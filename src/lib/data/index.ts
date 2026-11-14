import type { Category, Venue } from '../types.ts';
import { THEATERS, THEATER_TEMPLATES } from './grid.ts';
import { ARENAS, ARENA_TEMPLATES } from './zones.ts';

export const DATA_AS_OF = '2026년 11월';

/** KOPIS 공연시설명 → 보유한 공연장 데이터. 없으면 null (유형 템플릿을 고르게 함) */
export function matchVenue(facility: string): Venue | null {
  const norm = facility.replace(/\s/g, '').toLowerCase();
  const hit = [...ARENAS, ...THEATERS].find((v) => v.match.every((m) => norm.includes(m.replace(/\s/g, '').toLowerCase())));
  return hit?.venue ?? null;
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
