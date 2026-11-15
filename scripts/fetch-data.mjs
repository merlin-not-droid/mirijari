// 공연(KOPIS)·영화(KOBIS) 목록을 받아 public/data/*.json 스냅샷으로 저장한다.
// 빌드 직전(prebuild)과 개발 서버 시작 전(predev)에 실행되고,
// GitHub Actions가 매일 다시 빌드하면서 목록이 갱신된다.
// 키가 없거나 요청이 실패해도 빌드는 멈추지 않는다 (기존 스냅샷 유지 또는 빈 목록).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data');
const KOPIS = process.env.KOPIS_API_KEY?.trim();
const KOBIS = process.env.KOBIS_API_KEY?.trim();

// 한국 시간 기준 날짜
const kst = (offsetDays = 0) => new Date(Date.now() + 9 * 3600e3 + offsetDays * 86400e3);
const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');

async function save(name, snapshot) {
  await mkdir(OUT, { recursive: true });
  await writeFile(path.join(OUT, name), JSON.stringify(snapshot));
  console.log(`[data] ${name}: ${snapshot.source} · ${snapshot.items.length}건${snapshot.error ? ' · ' + snapshot.error : ''}`);
}

/** 실패 시: 이전 스냅샷이 있으면 그대로 두고, 없으면 빈 목록을 쓴다 */
async function keepOrEmpty(name, error) {
  try {
    const prev = JSON.parse(await readFile(path.join(OUT, name), 'utf8'));
    if (prev.items?.length) return console.log(`[data] ${name}: 이전 스냅샷 유지 (${error})`);
  } catch { /* 이전 파일 없음 */ }
  await save(name, { source: 'none', updatedAt: null, items: [], error });
}

async function get(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// ── KOPIS: 이번 달 1일 ~ 다다음 달 말일. 조회 기간이 31일로 제한돼 월 단위로 나눠 요청 ──
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decode = (s) => s.replace(/&(#\d+|#x[\da-f]+|\w+);/gi, (m, e) =>
  e[0] === '#' ? String.fromCodePoint(/^#x/i.test(e) ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENTITIES[e.toLowerCase()] ?? m);
// XML 값은 한 번, 값 안에 한 번 더 이스케이프된 것(&amp;amp;)까지 두 번 디코딩한다
const tag = (xml, name) => decode(decode(xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() ?? ''));

async function kopisMonth(genre, from, to) {
  const items = [];
  for (let page = 1; page <= 5; page++) {
    const xml = await get(
      `http://www.kopis.or.kr/openApi/restful/pblprfr?service=${KOPIS}&stdate=${from}&eddate=${to}&cpage=${page}&rows=100&shcate=${genre}`,
    );
    // 오류는 HTTP 200에 결과코드로 온다 (02 = 미등록 키, 05 = 31일 초과 등). 04(자료 없음)는 정상
    const code = tag(xml, 'returncode');
    if (code && code !== '00' && code !== '04') throw new Error(`결과코드 ${code} ${tag(xml, 'errmsg')}`.trim());
    const rows = xml.match(/<db>[\s\S]*?<\/db>/g) ?? [];
    for (const r of rows) {
      items.push({
        id: tag(r, 'mt20id'), name: tag(r, 'prfnm'),
        from: tag(r, 'prfpdfrom'), to: tag(r, 'prfpdto'),
        venue: tag(r, 'fcltynm'), area: tag(r, 'area'),
        poster: tag(r, 'poster'), state: tag(r, 'prfstate'),
      });
    }
    if (rows.length < 100) break;
  }
  return items;
}

async function kopis(name, genre) {
  if (!KOPIS) return keepOrEmpty(name, 'KOPIS_API_KEY 없음');
  try {
    const now = kst();
    const seen = new Map();
    for (let m = 0; m < 3; m++) {
      const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + m, 1));
      const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + m + 1, 0));
      for (const it of await kopisMonth(genre, ymd(first), ymd(last))) if (it.id) seen.set(it.id, it);
    }
    const items = [...seen.values()]
      .filter((it) => it.state !== '공연완료')
      .sort((a, b) => a.from.localeCompare(b.from));
    await save(name, { source: 'kopis', updatedAt: new Date().toISOString(), items });
  } catch (e) {
    await keepOrEmpty(name, `KOPIS 요청 실패: ${e.message}`);
  }
}

// ── KOBIS: 어제 기준 일별 박스오피스 ──
async function kobis() {
  const name = 'movies.json';
  if (!KOBIS) return keepOrEmpty(name, 'KOBIS_API_KEY 없음');
  try {
    const json = JSON.parse(
      await get(`https://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=${KOBIS}&targetDt=${ymd(kst(-1))}`),
    );
    if (json.faultInfo) throw new Error(json.faultInfo.message);
    const items = (json.boxOfficeResult?.dailyBoxOfficeList ?? []).map((m) => ({
      rank: Number(m.rank), name: m.movieNm, openDt: m.openDt, audiAcc: Number(m.audiAcc),
    }));
    await save(name, { source: 'kobis', updatedAt: new Date().toISOString(), items });
  } catch (e) {
    await keepOrEmpty(name, `KOBIS 요청 실패: ${e.message}`);
  }
}

await Promise.all([kopis('events-concert.json', 'CCCD'), kopis('events-musical.json', 'GGGA'), kobis()]);
