import type { Category, CategoryPrefs, Experience, Flag, Mode, Profile, Sport } from './types.ts';

export const BRAND = { name: '미리자리', en: 'MiriJari', tagline: '키도 취향도 다 다른데, 명당이 하나일 리 없잖아요' };

export const CATEGORIES: { id: Category; name: string; desc: string }[] = [
  { id: 'concert', name: '콘서트', desc: '아레나·돔·스타디움 구역과 티켓팅 우선순위' },
  { id: 'musical', name: '뮤지컬', desc: '층·열·좌우까지 내 눈높이에 맞는 자리' },
  { id: 'movie', name: '영화', desc: '상영관 타입별 최적 열과 번호' },
  { id: 'sports', name: '스포츠', desc: '야구·축구·농구·배구 직관 구역' },
];

export const SPORTS: { id: Sport; name: string }[] = [
  { id: 'baseball', name: '야구' },
  { id: 'soccer', name: '축구' },
  { id: 'basketball', name: '농구' },
  { id: 'volleyball', name: '배구' },
];

type Opt<T extends string> = { id: T; label: string; hint?: string };

export const AGE: Opt<Profile['ageBand']>[] = [
  { id: 'teen', label: '10대' }, { id: '20s', label: '20대' }, { id: '30s', label: '30대' },
  { id: '40s', label: '40대' }, { id: '50plus', label: '50대+' },
];
export const GENDER: Opt<Profile['gender']>[] = [
  { id: 'na', label: '선택 안 함' }, { id: 'female', label: '여성' }, { id: 'male', label: '남성' },
];
export const VISION: Opt<Profile['vision']>[] = [
  { id: 'good', label: '좋음' }, { id: 'corrected', label: '안경·렌즈 착용' }, { id: 'weak', label: '멀리가 잘 안 보임' },
];
export const HAND: Opt<Profile['hand']>[] = [
  { id: 'na', label: '상관없음' }, { id: 'right', label: '오른손' }, { id: 'left', label: '왼손' },
];
export const EXPERIENCE: Opt<Experience>[] = [
  { id: 'first', label: '처음' }, { id: 'lt5', label: '5회 미만' },
  { id: 'gte5', label: '5회 이상' }, { id: 'gte20', label: '20회 이상' },
];
export const COMPANION: Opt<Profile['companion']>[] = [
  { id: 'solo', label: '혼자' }, { id: 'couple', label: '연인' }, { id: 'friends', label: '친구' },
  { id: 'kids', label: '아이와 함께' }, { id: 'parents', label: '부모님과' }, { id: 'group', label: '단체' },
];
export const ROW_PREF: Opt<Profile['rowPref']>[] = [
  { id: 'none', label: '추천에 맡길게요' }, { id: 'front', label: '앞쪽' },
  { id: 'middle', label: '중간' }, { id: 'back', label: '뒤쪽' },
];
export const SIDE_PREF: Opt<Profile['sidePref']>[] = [
  { id: 'none', label: '상관없음' }, { id: 'center', label: '가운데' }, { id: 'aisle', label: '통로 쪽' },
];
export const BUDGET: Opt<Profile['budget']>[] = [
  { id: 'value', label: '가성비' }, { id: 'normal', label: '보통' }, { id: 'premium', label: '좋은 자리면 투자' },
];
export const FLAGS: Opt<Flag>[] = [
  { id: 'restroom', label: '중간에 자주 나가요' },
  { id: 'legroom', label: '넓은 좌석·다리 공간 필요' },
  { id: 'blocked', label: '앞사람에 가리는 게 싫어요' },
  { id: 'neck', label: '목·허리가 쉽게 피로해요' },
  { id: 'motion', label: '멀미·어지럼에 민감' },
  { id: 'stairs', label: '계단·높은 곳이 부담' },
  { id: 'noise', label: '큰 소리에 민감' },
  { id: 'sun', label: '햇빛·더위에 약해요' },
];

export const STYLES: Record<Category, Opt<string>[]> = {
  concert: [
    { id: 'close', label: '아티스트 가까이', hint: '표정·실물이 우선' },
    { id: 'whole', label: '무대 전체·연출', hint: '조명·전광판까지 한눈에' },
    { id: 'sound', label: '음향', hint: '라이브 사운드가 우선' },
    { id: 'hype', label: '열기·떼창', hint: '뛰고 소리 지르러 가요' },
    { id: 'relax', label: '편하게', hint: '앉아서 여유 있게' },
  ],
  musical: [
    { id: 'face', label: '배우 표정·연기', hint: '가까이서 디테일' },
    { id: 'whole', label: '무대 전체·군무', hint: '연출과 동선' },
    { id: 'sound', label: '음향·가사 전달', hint: '넘버를 또렷하게' },
    { id: 'value', label: '가성비', hint: '낮은 등급의 좋은 자리' },
  ],
  movie: [
    { id: 'immerse', label: '몰입', hint: '화면이 시야를 꽉 채우게' },
    { id: 'comfort', label: '편안함', hint: '목·눈이 편한 거리' },
    { id: 'sound', label: '사운드', hint: '음향 밸런스 좋은 곳' },
    { id: 'subtitle', label: '자막 읽기 편하게', hint: '화면과 자막을 한 시야에' },
  ],
  sports: [
    { id: 'cheer', label: '응원 열기', hint: '응원가 부르러 가요' },
    { id: 'tactics', label: '경기 흐름·전술', hint: '전체가 한눈에' },
    { id: 'close', label: '선수 가까이', hint: '생생한 현장감' },
    { id: 'chill', label: '먹고 즐기기', hint: '여유롭게 관람' },
  ],
};

export const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: 'open', label: '미리자리', desc: '예매 전 — 나에게 맞는 자리를 몇 열 몇 칸까지 미리 골라 드려요' },
  { id: 'remaining', label: '남은 자리 중', desc: '예매 화면에 보이는 남은 자리에 맞추면 그 안에서 골라 드려요' },
  { id: 'ticketing', label: '티켓팅 전략', desc: '오픈 전 — 경쟁을 피해 먼저 클릭할 우선순위' },
];

export const EXPERIENCE_LABEL: Record<Category, string> = {
  concert: '콘서트 직관 경험',
  musical: '뮤지컬 관람 경험',
  movie: '이 타입 상영관 경험',
  sports: '직관 경험',
};

export const DEFAULT_PROFILE: Profile = {
  height: 168,
  ageBand: '20s',
  gender: 'na',
  vision: 'good',
  hand: 'na',
  partySize: 2,
  companion: 'friends',
  rowPref: 'none',
  sidePref: 'none',
  budget: 'normal',
  flags: [],
};

export const defaultPrefs = (c: Category): CategoryPrefs => ({ experience: 'lt5', style: STYLES[c][0].id });

export const labelOf = <T extends string>(opts: Opt<T>[], id: T) => opts.find((o) => o.id === id)?.label ?? id;
