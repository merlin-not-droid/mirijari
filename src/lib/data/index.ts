import type { Category, Venue } from '../types.ts';
import { THEATERS, THEATER_TEMPLATES } from './grid.ts';
import { ARENAS, ARENA_TEMPLATES } from './zones.ts';

export const DATA_AS_OF = '2026년 11월';

/**
 * KOPIS 공연목록은 시설명만 주고 홀 이름은 주지 않는 경우가 많다.
 * 홀이 여러 개인 시설은 보유한 홀을 후보로 보여 주고 사용자가 고르게 한다.
 */
const COMPLEXES: { match: string[]; ids: string[] }[] = [
  { match: ['올림픽공원'], ids: ['kspo', 'handball', 'olympic-hall'] },
  { match: ['인스파이어엔터테인먼트리조트'], ids: ['inspire'] },
  { match: ['세종문화회관'], ids: ['sejong'] },
  { match: ['LG아트센터'], ids: ['lgart'] },
  { match: ['^예술의전당'], ids: ['sac-opera'] },
  { match: ['충무아트'], ids: ['chungmu'] },
  { match: ['블루스퀘어'], ids: ['bluesquare'] },
  { match: ['홍익대', '대학로'], ids: ['hongik'] },
];

const norm = (s: string) => s.replace(/\s/g, '').toLowerCase();
/** 모든 단어가 포함돼야 하고, '^'로 시작하는 단어는 시설명 앞부분과 일치해야 한다 */
const hit = (facility: string, terms: string[]) =>
  terms.every((t) => (t.startsWith('^') ? facility.startsWith(norm(t.slice(1))) : facility.includes(norm(t))));

/** KOPIS 공연시설명 → 보유한 공연장 후보. exact면 바로 그 공연장으로 추천한다 */
export function matchVenues(facility: string): { venues: Venue[]; exact: boolean } {
  const f = norm(facility);
  const all = [...ARENAS, ...THEATERS];
  const direct = all.filter((v) => hit(f, v.match)).map((v) => v.venue);
  const complex = COMPLEXES.filter((c) => hit(f, c.match))
    .flatMap((c) => c.ids.map((id) => all.find((v) => v.venue.id === id)!.venue));
  const venues = [...new Map([...direct, ...complex].map((v) => [v.id, v])).values()];
  return { venues, exact: venues.length === 1 && complex.length === 0 };
}

export function venuesFor(category: Category): { known: Venue[]; templates: Venue[] } {
  if (category === 'concert')
    return { known: [...ARENAS.map((a) => a.venue), ...THEATERS.map((t) => t.venue)], templates: [...ARENA_TEMPLATES, ...THEATER_TEMPLATES] };
  return { known: THEATERS.map((t) => t.venue), templates: THEATER_TEMPLATES };
}

export const TICKETING_TIPS = [
  '오픈 10분 전까지 로그인·본인인증·결제수단 등록을 끝내고, 예매처 서버 시간에 맞춰 새로고침하세요.',
  '좌석 화면이 뜨면 고민하지 말고 위 1순위부터 클릭하세요. 정중앙 앞쪽은 몇 초 안에 사라져요.',
  '"이미 선택된 좌석"이 뜨면 같은 구역에서 머뭇거리지 말고 바로 2순위로 넘어가세요.',
  '3명 이상이면 2연석씩 나눠 잡는 편이 성공률이 훨씬 높아요.',
  '놓쳤다면 취소표를 노리세요. 무통장 미입금분은 입금 마감 직후에 다시 풀리는 경우가 많아요 (예매처 공지 확인).',
];
