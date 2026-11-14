// ───────── 공통 ─────────
export type Category = 'concert' | 'musical' | 'movie' | 'sports';
export type Sport = 'baseball' | 'soccer' | 'basketball' | 'volleyball';
export type Mode = 'open' | 'remaining' | 'ticketing';

export type Experience = 'first' | 'lt5' | 'gte5' | 'gte20';
export type Flag = 'restroom' | 'legroom' | 'neck' | 'motion' | 'sun' | 'stairs' | 'noise' | 'blocked';

/** 기기에 저장되는 공통 프로필 (서버 DB에 저장하지 않음) */
export interface Profile {
  height: number;
  ageBand: 'teen' | '20s' | '30s' | '40s' | '50plus';
  gender: 'female' | 'male' | 'na';
  vision: 'good' | 'corrected' | 'weak';
  hand: 'right' | 'left' | 'na';
  partySize: number;
  companion: 'solo' | 'couple' | 'friends' | 'kids' | 'parents' | 'group';
  rowPref: 'none' | 'front' | 'middle' | 'back';
  sidePref: 'none' | 'center' | 'aisle';
  budget: 'value' | 'normal' | 'premium';
  flags: Flag[];
}

/** 카테고리마다 따로 묻는 항목 */
export interface CategoryPrefs {
  experience: Experience;
  style: string;
}

/** 엔진 입력 = 공통 프로필 + 카테고리별 항목 */
export type Persona = Profile & CategoryPrefs & { category: Category };

// ───────── 좌석 격자형 공연장 (영화관·극장) ─────────
export type Tier = 'VIP' | 'R' | 'S' | 'A';
export type HallType = 'standard' | 'imax' | 'dolby' | '4dx' | 'screenx' | 'recliner';

export interface GridSection {
  id: string;
  name: string;
  /** 행별 문자열. 's' = 좌석, '_' = 통로/빈칸 */
  cells: string[];
  rowLabels: string[];
  /** 스크린/무대 끝에서 첫 열까지 거리(m) */
  firstRowDist: number;
  rowPitch: number;
  /** 첫 열 바닥 높이(m) */
  baseElev: number;
  /** [이 행부터, 열당 단차(m)] */
  rise: [number, number][];
  /** 바로 앞이 가로 통로인 행 */
  crossAisles?: number[];
  /** 이 행부터 위층 발코니 아래 */
  overhangFromRow?: number;
  /** 첫 열 앞에 안전 난간 */
  railing?: boolean;
  tiers?: [number, Tier][];
}

export interface GridVenue {
  kind: 'grid';
  view: 'screen' | 'stage';
  id: string;
  name: string;
  sub?: string;
  /** 실측 좌석도가 아닌 근사 배치 여부 */
  approx: boolean;
  note?: string;
  hall?: HallType;
  sections: GridSection[];
  /** screen: 폭·높이·하단 높이 / stage: 무대 폭·(미사용)·무대 바닥 높이 */
  target: { width: number; height: number; bottom: number };
}

export interface Seat {
  id: string;
  sec: number;
  r: number;
  c: number;
  num: number;
  x: number;
  d: number;
  elev: number;
  xn: number;
  depthFrac: number;
  aisleDist: number;
  frontOpen: boolean;
  overhang: boolean;
  railing: boolean;
  rise: number;
  tier?: Tier;
}

export type GridFactor = 'view' | 'close' | 'center' | 'neck' | 'sound' | 'sight' | 'aisle' | 'leg' | 'value' | 'hand';

export interface SeatScore {
  total: number;
  f: Record<GridFactor, number>;
  meta: { angle: number; neckAngle: number; dist: number; lookDown: number };
}

// ───────── 구역형 공연장 (아레나·경기장) ─────────
export type Shape =
  | { t: 'rect'; x: number; y: number; w: number; h: number }
  | { t: 'sector'; r1: number; r2: number; a1: number; a2: number };

export interface ZoneAttrs {
  prox: number;
  view: number;
  cheer: number;
  comfort: number;
  sound: number;
  shade: number;
  access: number;
  /** 1 = 가장 비쌈 */
  price: number;
  family: number;
  food: number;
  /** 1 = 단차 없음(플로어) */
  flat: number;
  /** 1 = 매우 가파름 */
  steep: number;
  /** 예매 경쟁 예상(사전 추정치) */
  demand: number;
}

export interface Zone {
  id: string;
  name: string;
  desc: string;
  shapes: Shape[];
  a: ZoneAttrs;
  rows: number;
  /** 출입구가 구역의 위쪽(뒷열)인지 아래쪽(앞열)인지 */
  entry: 'top' | 'bottom';
  standing?: boolean;
  caution?: string;
}

export type ZoneTemplate = 'baseball' | 'soccer' | 'court' | 'arena';

export interface ZoneVenue {
  kind: 'zone';
  template: ZoneTemplate;
  id: string;
  name: string;
  sub?: string;
  approx: boolean;
  note?: string;
  zones: Zone[];
}

export type Venue = GridVenue | ZoneVenue;

export type ZoneFactor =
  | 'prox' | 'view' | 'cheer' | 'quiet' | 'comfort' | 'sound' | 'shade'
  | 'access' | 'value' | 'family' | 'food' | 'sight' | 'gentle';

// ───────── 추천 결과 ─────────
export interface Pick {
  rank: number;
  title: string;
  label: string;
  where: string;
  score: number;
  demand: number;
  reasons: string[];
  tradeoff?: string;
  /** 격자형: 좌석 id 목록 / 구역형: 구역 id */
  seatIds?: string[];
  zoneId?: string;
  rowAdvice?: string;
  sideAdvice?: string;
  split?: boolean;
}

// ───────── 외부 데이터 스냅샷 ─────────
export interface EventItem {
  id: string;
  name: string;
  from: string;
  to: string;
  venue: string;
  area?: string;
  poster?: string;
  state: string;
}
export interface MovieItem {
  rank: number;
  name: string;
  openDt: string;
  audiAcc: number;
}
export interface Snapshot<T> {
  source: 'kopis' | 'kobis' | 'none';
  updatedAt: string | null;
  items: T[];
  error?: string;
}
