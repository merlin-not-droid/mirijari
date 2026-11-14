import type { GridSection, GridVenue, HallType, Tier } from '../types.ts';

const SEAT_W = 0.55;
const alpha = (i: number) => (i < 26 ? String.fromCharCode(65 + i) : 'A' + String.fromCharCode(65 + i - 26));

/** 한 행의 좌석 문자열: 블록 사이에 통로('__')를 넣는다 */
function rowCells(blocks: number[]) {
  return blocks.map((n) => 's'.repeat(n)).join('__');
}

function splitBlocks(cols: number, hall: HallType): number[] {
  if (hall === '4dx') {
    const out: number[] = [];
    for (let left = cols; left > 0; left -= 4) out.push(Math.min(4, left));
    return out;
  }
  if (cols < 16) return [cols];
  const side = Math.max(3, Math.round(cols * 0.2));
  return [side, cols - side * 2, side];
}

// ───────── 영화관 ─────────
export const HALLS: { id: HallType; name: string; desc: string; rows: number; cols: number }[] = [
  { id: 'standard', name: '일반관', desc: '2D·3D 일반 상영관', rows: 11, cols: 16 },
  { id: 'imax', name: 'IMAX', desc: '초대형 스크린, 가파른 단차', rows: 16, cols: 32 },
  { id: 'dolby', name: '돌비 시네마', desc: '돌비 비전·애트모스', rows: 13, cols: 24 },
  { id: '4dx', name: '4DX', desc: '모션 체어·환경 효과', rows: 9, cols: 16 },
  { id: 'screenx', name: 'ScreenX', desc: '좌우 벽면 3면 스크린', rows: 11, cols: 18 },
  { id: 'recliner', name: '리클라이너·프리미엄', desc: '넓은 좌석 간격', rows: 7, cols: 10 },
];

export const CINEMA_SIZES = [
  { id: 's', name: '소형', rows: 8, cols: 12, hint: '~100석' },
  { id: 'm', name: '중형', rows: 11, cols: 16, hint: '~180석' },
  { id: 'l', name: '대형', rows: 14, cols: 22, hint: '~300석' },
  { id: 'xl', name: '특대', rows: 17, cols: 34, hint: '500석+' },
];

const HALL_PHYS: Record<HallType, { wRatio: number; aspect: number; first: number; pitch: number; rise: number; bottom: number }> = {
  standard: { wRatio: 0.92, aspect: 2.2, first: 0.42, pitch: 1.05, rise: 0.32, bottom: 1.2 },
  imax: { wRatio: 1.0, aspect: 1.65, first: 0.36, pitch: 1.1, rise: 0.42, bottom: 1.0 },
  dolby: { wRatio: 0.95, aspect: 2.1, first: 0.42, pitch: 1.15, rise: 0.38, bottom: 1.2 },
  '4dx': { wRatio: 0.9, aspect: 2.2, first: 0.45, pitch: 1.3, rise: 0.35, bottom: 1.2 },
  screenx: { wRatio: 0.9, aspect: 2.2, first: 0.42, pitch: 1.05, rise: 0.32, bottom: 1.2 },
  recliner: { wRatio: 0.9, aspect: 2.2, first: 0.5, pitch: 1.7, rise: 0.3, bottom: 1.2 },
};

export function makeCinema(opts: {
  hall: HallType;
  rows: number;
  cols: number;
  name?: string;
  sub?: string;
  /** 캡처 인식 등으로 얻은 실제 배치 (있으면 rows/cols 대신 사용) */
  cells?: string[];
  rowLabels?: string[];
}): GridVenue {
  const ph = HALL_PHYS[opts.hall];
  const cells = opts.cells ?? Array.from({ length: opts.rows }, () => rowCells(splitBlocks(opts.cols, opts.hall)));
  const widthM = Math.max(...cells.map((r) => r.length)) * SEAT_W;
  const width = Math.max(7, widthM * ph.wRatio);
  const hallName = HALLS.find((h) => h.id === opts.hall)!.name;
  return {
    kind: 'grid',
    view: 'screen',
    id: `cinema-${opts.hall}-${cells.length}x${cells[0]?.length ?? 0}`,
    name: opts.name ?? `${hallName}`,
    sub: opts.sub ?? `${cells.length}행 × 최대 ${Math.max(...cells.map((r) => r.replace(/_/g, '').length))}석`,
    approx: !opts.cells,
    hall: opts.hall,
    target: { width, height: width / ph.aspect, bottom: ph.bottom },
    sections: [
      {
        id: 'hall',
        name: hallName,
        cells,
        rowLabels: opts.rowLabels ?? cells.map((_, i) => alpha(i)),
        firstRowDist: Math.max(3.2, width * ph.first),
        rowPitch: ph.pitch,
        baseElev: 0,
        rise: [[0, 0.12], [2, ph.rise]],
      },
    ],
  };
}

/** 널리 알려진 특별관. 좌석 수 기준 근사 배치이며 실제 좌석도와 다를 수 있음 */
export const CINEMA_PRESETS: { id: string; name: string; hall: HallType; rows: number; cols: number; sub: string }[] = [
  { id: 'cgv-yongsan-imax', name: 'CGV 용산아이파크몰 IMAX', hall: 'imax', rows: 17, cols: 37, sub: '약 620석 · 근사 배치' },
  { id: 'megabox-coex-dolby', name: '메가박스 코엑스 돌비 시네마', hall: 'dolby', rows: 14, cols: 27, sub: '약 380석 · 근사 배치' },
  { id: 'lotte-world-super', name: '롯데시네마 월드타워 수퍼플렉스', hall: 'standard', rows: 17, cols: 37, sub: '약 620석 · 근사 배치' },
];

// ───────── 극장 (뮤지컬·콘서트홀) ─────────
interface FloorSpec { rows: number; cols: number; }

function tiersFor(floorIdx: number, rows: number): [number, Tier][] {
  if (floorIdx === 0) return [[0, 'VIP'], [Math.round(rows * 0.68), 'R'], [Math.round(rows * 0.9), 'S']];
  if (floorIdx === 1) return [[0, 'R'], [Math.round(rows * 0.3), 'S'], [Math.round(rows * 0.75), 'A']];
  return [[0, 'S'], [Math.round(rows * 0.25), 'A']];
}

export function makeTheater(opts: {
  id: string;
  name: string;
  sub: string;
  floors: FloorSpec[];
  stageWidth?: number;
  note?: string;
}): GridVenue {
  const f1 = opts.floors[0];
  const depth1 = 2.5 + f1.rows * 0.95;
  const sections: GridSection[] = opts.floors.map((f, i) => {
    const side = Math.max(4, Math.round(f.cols * 0.24));
    const cells = Array.from({ length: f.rows }, () => rowCells([side, f.cols - side * 2, side]));
    const rowLabels = cells.map((_, r) => String(r + 1));
    if (i === 0) {
      const cross = Math.round(f.rows * 0.5);
      return {
        id: 'f1', name: '1층', cells, rowLabels,
        firstRowDist: 2.5, rowPitch: 0.95, baseElev: 0,
        rise: [[0, 0.06], [Math.round(f.rows * 0.3), 0.12], [Math.round(f.rows * 0.65), 0.18]],
        crossAisles: f.rows >= 16 ? [cross] : [],
        overhangFromRow: opts.floors.length > 1 ? Math.round(f.rows * 0.72) : undefined,
        tiers: tiersFor(0, f.rows),
      };
    }
    return {
      id: `f${i + 1}`, name: `${i + 1}층`, cells, rowLabels,
      firstRowDist: depth1 * (0.68 + 0.06 * (i - 1)), rowPitch: 0.9,
      baseElev: 4.4 * i + 0.6, rise: [[0, 0.38 + 0.08 * (i - 1)]],
      railing: true,
      tiers: tiersFor(i, f.rows),
    };
  });
  return {
    kind: 'grid', view: 'stage', id: opts.id, name: opts.name, sub: opts.sub, approx: true, note: opts.note,
    sections,
    target: { width: opts.stageWidth ?? 14, height: 1.55, bottom: 1.0 },
  };
}

const T = (id: string, name: string, sub: string, floors: [number, number][], match: string[], stageWidth?: number) => ({
  match,
  venue: makeTheater({ id, name, sub, floors: floors.map(([rows, cols]) => ({ rows, cols })), stageWidth }),
});

/** 층별 열·좌석 수는 공개 좌석 규모에 맞춘 근사치 — 예매처 좌석도와 번호가 다를 수 있음 */
export const THEATERS: { match: string[]; venue: GridVenue }[] = [
  T('charlotte', '샤롯데씨어터', '서울 잠실 · 약 1,230석', [[22, 36], [12, 36]], ['샤롯데']),
  T('bluesquare', '블루스퀘어 신한카드홀', '서울 한남 · 약 1,760석', [[25, 38], [12, 38], [10, 36]], ['블루스퀘어', '신한']),
  T('chungmu', '충무아트센터 대극장', '서울 중구 · 약 1,250석', [[20, 34], [9, 34], [8, 33]], ['충무아트', '대극장']),
  T('dcube', '디큐브 링크아트센터', '서울 신도림 · 약 1,240석', [[20, 32], [10, 32], [9, 31]], ['디큐브']),
  T('lgart', 'LG아트센터 서울 시그니처홀', '서울 마곡 · 약 1,330석', [[21, 36], [9, 34], [8, 34]], ['LG아트센터', '시그니처']),
  T('sac-opera', '예술의전당 오페라극장', '서울 서초 · 약 2,280석', [[22, 40], [10, 44], [11, 44], [11, 44]], ['예술의전당', '오페라극장'], 16),
  T('sejong', '세종문화회관 대극장', '서울 광화문 · 약 3,020석', [[30, 52], [15, 52], [13, 52]], ['세종문화회관', '대극장'], 20),
  T('bbch', '광림아트센터 BBCH홀', '서울 압구정 · 약 1,000석', [[19, 32], [12, 32]], ['광림', 'BBCH']),
  T('hongik', '홍익대 대학로 아트센터 대극장', '서울 대학로 · 약 700석', [[17, 28], [8, 28]], ['홍익대', '대학로']),
  T('dream', '드림씨어터', '부산 · 약 1,730석', [[24, 38], [12, 36], [11, 35]], ['드림씨어터']),
  T('keimyung', '계명아트센터', '대구 · 약 1,950석', [[26, 40], [12, 40], [11, 40]], ['계명아트']),
];

export const THEATER_TEMPLATES: GridVenue[] = [
  makeTheater({ id: 'tpl-large', name: '대극장형', sub: '1,000석 이상 · 3층 구조', floors: [{ rows: 22, cols: 36 }, { rows: 10, cols: 36 }, { rows: 9, cols: 34 }] }),
  makeTheater({ id: 'tpl-mid', name: '중극장형', sub: '400~1,000석 · 2층 구조', floors: [{ rows: 16, cols: 26 }, { rows: 7, cols: 26 }], stageWidth: 12 }),
  makeTheater({ id: 'tpl-small', name: '소극장형', sub: '400석 미만 · 단층', floors: [{ rows: 12, cols: 18 }], stageWidth: 9 }),
];
