import type { Shape, Sport, Zone, ZoneAttrs, ZoneVenue } from '../types.ts';

const BASE: ZoneAttrs = {
  prox: 0.5, view: 0.5, cheer: 0.5, comfort: 0.5, sound: 0.5, shade: 0.5, access: 0.6,
  price: 0.5, family: 0.5, food: 0.5, flat: 0, steep: 0.3, demand: 0.5,
};
const rect = (x: number, y: number, w: number, h: number): Shape => ({ t: 'rect', x, y, w, h });
const sector = (r1: number, r2: number, a1: number, a2: number): Shape => ({ t: 'sector', r1, r2, a1, a2 });
const zone = (
  id: string, name: string, desc: string, shapes: Shape[], a: Partial<ZoneAttrs>,
  rows: number, entry: 'top' | 'bottom' = 'top', extra: Partial<Zone> = {},
): Zone => ({ id, name, desc, shapes, a: { ...BASE, ...a }, rows, entry, ...extra });

// ───────── 야구장 ─────────
function baseballZones(o: { home?: '1B' | '3B'; dome?: boolean }): Zone[] {
  // 지도: 홈플레이트 아래쪽, 1루 = 오른쪽(각도 105~160), 3루 = 왼쪽(200~255)
  const first: [number, number] = [105, 160];
  const third: [number, number] = [200, 255];
  const homeArc = o.home === '3B' ? third : first;
  const awayArc = o.home === '3B' ? first : third;
  const side = (arc: [number, number]) => (arc === first ? '1루' : '3루');
  const hl = o.home ? `${side(homeArc)} · 홈` : '홈 응원 방면';
  const al = o.home ? `${side(awayArc)} · 원정` : '원정 응원 방면';
  const zs = [
    zone('premium', '중앙 테이블·프리미엄', '포수 뒤 정중앙. 투구 궤적이 정면으로 보여요', [sector(150, 178, 160, 200)],
      { prox: 0.9, view: 0.95, cheer: 0.35, comfort: 0.95, shade: 0.7, access: 0.8, price: 1, family: 0.7, food: 0.9, steep: 0.2, demand: 0.85 }, 12),
    zone('home-low', `내야 하단 (${hl})`, '응원단상 앞. 응원 열기가 가장 뜨거운 곳', [sector(150, 178, ...homeArc)],
      { prox: 0.8, view: 0.8, cheer: 1, comfort: 0.45, shade: 0.45, access: 0.7, price: 0.7, family: 0.45, food: 0.6, demand: 0.95 }, 25),
    zone('away-low', `내야 하단 (${al})`, '원정 응원석. 홈보다 예매 경쟁이 덜해요', [sector(150, 178, ...awayArc)],
      { prox: 0.8, view: 0.8, cheer: 0.75, comfort: 0.5, shade: 0.45, access: 0.7, price: 0.7, family: 0.5, food: 0.6, demand: 0.65 }, 25),
    zone('home-up', `내야 상단 (${hl})`, '응원 소리는 들리고 경기는 한눈에', [sector(181, 206, ...homeArc)],
      { prox: 0.45, view: 0.85, cheer: 0.6, comfort: 0.5, shade: 0.85, access: 0.4, price: 0.35, family: 0.55, steep: 0.7, demand: 0.55 }, 20, 'bottom'),
    zone('away-up', `내야 상단 (${al})`, '한적하게 전체 조망', [sector(181, 206, ...awayArc)],
      { prox: 0.45, view: 0.85, cheer: 0.4, comfort: 0.55, shade: 0.85, access: 0.4, price: 0.35, family: 0.6, steep: 0.7, demand: 0.4 }, 20, 'bottom'),
    zone('center-up', '중앙 상단', '포수 뒤 높은 곳. 수비 시프트까지 보이는 중계 화면 각도', [sector(181, 206, 160, 200)],
      { prox: 0.45, view: 0.92, cheer: 0.3, comfort: 0.55, shade: 0.9, access: 0.4, price: 0.4, family: 0.55, steep: 0.7, demand: 0.5 }, 18, 'bottom'),
    zone('exciting', '익사이팅존', '파울라인 바로 옆. 선수와 가장 가까운 자리', [sector(150, 178, 84, 102), sector(150, 178, 258, 276)],
      { prox: 1, view: 0.6, cheer: 0.6, comfort: 0.5, shade: 0.2, access: 0.7, price: 0.85, family: 0.2, demand: 0.8 }, 6, 'top',
      { caution: '강한 파울 타구가 날아올 수 있어 어린이 동반은 권하지 않아요' }),
    zone('outfield', '외야석', '홈런볼과 피크닉 분위기. 가장 저렴해요', [sector(150, 185, 18, 80), sector(150, 185, 280, 342)],
      { prox: 0.4, view: 0.55, cheer: 0.45, comfort: 0.45, shade: 0.15, access: 0.65, price: 0.15, family: 0.75, food: 0.7, demand: 0.35 }, 18),
  ];
  if (o.dome) zs.forEach((z) => (z.a.shade = 1));
  return zs;
}

// ───────── 축구장 ─────────
function soccerZones(o: { track?: boolean }): Zone[] {
  const zs = [
    zone('w1', 'W석 1층 (본부석)', '벤치 쪽 사이드라인. 선수 입장과 벤치가 가까워요', [rect(100, 232, 200, 30)],
      { prox: 0.8, view: 0.85, cheer: 0.3, comfort: 0.75, shade: 0.9, access: 0.8, price: 0.9, family: 0.7, demand: 0.7 }, 25),
    zone('w2', 'W석 2층', '중계 카메라 각도. 전술이 가장 잘 보여요', [rect(100, 266, 200, 26)],
      { prox: 0.5, view: 1, cheer: 0.25, comfort: 0.7, shade: 1, access: 0.5, price: 0.7, family: 0.6, steep: 0.6, demand: 0.55 }, 20, 'bottom'),
    zone('e1', 'E석 1층', '본부석 맞은편. 응원과 관람의 균형', [rect(100, 38, 200, 30)],
      { prox: 0.8, view: 0.85, cheer: 0.5, comfort: 0.6, shade: 0.4, access: 0.75, price: 0.6, family: 0.7, demand: 0.65 }, 25),
    zone('e2', 'E석 2층', '합리적인 가격의 전체 조망', [rect(100, 8, 200, 26)],
      { prox: 0.5, view: 0.97, cheer: 0.4, comfort: 0.55, shade: 0.6, access: 0.45, price: 0.45, family: 0.6, steep: 0.6, demand: 0.45 }, 20, 'bottom'),
    zone('home-end', '홈 서포터석 (골대 뒤)', '90분 내내 서서 응원하는 구역', [rect(42, 72, 44, 156)],
      { prox: 0.6, view: 0.4, cheer: 1, comfort: 0.25, shade: 0.4, access: 0.6, price: 0.3, family: 0.15, flat: 0.3, demand: 0.8 }, 25, 'top', { standing: true }),
    zone('away-end', '원정·일반석 (골대 뒤)', '반대편 골대 뒤. 가장 저렴하고 여유로워요', [rect(314, 72, 44, 156)],
      { prox: 0.6, view: 0.4, cheer: 0.5, comfort: 0.5, shade: 0.4, access: 0.6, price: 0.25, family: 0.5, demand: 0.3 }, 25),
  ];
  if (o.track) zs.forEach((z) => { z.a.prox *= 0.7; z.a.view = Math.max(0, z.a.view - 0.05); });
  return zs;
}

// ───────── 실내 코트 (농구·배구) ─────────
function courtZones(sport: Sport): Zone[] {
  const end = sport === 'basketball' ? '골대 뒤' : '엔드라인 뒤';
  const zs = [
    zone('courtside', '코트사이드·플로어', '선수 숨소리가 들리는 거리', [rect(128, 196, 144, 12), rect(128, 92, 144, 12)],
      { prox: 1, view: 0.7, cheer: 0.6, comfort: 0.7, price: 1, access: 0.9, family: 0.4, flat: 0.6, demand: 0.9 }, 2),
    zone('cheer', '1층 홈 응원석', '응원단 앞. 응원가와 이벤트의 중심', [rect(128, 212, 144, 30)],
      { prox: 0.8, view: 0.85, cheer: 1, comfort: 0.5, price: 0.6, access: 0.7, family: 0.5, demand: 0.85 }, 12),
    zone('side', '1층 중앙 사이드', '응원단 맞은편. 코트 전체가 정면으로', [rect(128, 58, 144, 30)],
      { prox: 0.8, view: 0.95, cheer: 0.55, comfort: 0.6, price: 0.7, access: 0.7, family: 0.7, demand: 0.75 }, 12),
    zone('end1', `1층 ${end}`, sport === 'basketball' ? '덩크와 골밑 싸움이 눈앞에' : '서브와 리시브가 정면으로', [rect(84, 92, 38, 116), rect(278, 92, 38, 116)],
      { prox: 0.75, view: 0.55, cheer: 0.6, comfort: 0.5, price: 0.45, access: 0.7, family: 0.6, demand: 0.5 }, 10),
    zone('side2', '2층 사이드', '저렴하게 전체 흐름을 보는 자리', [rect(100, 246, 200, 24), rect(100, 30, 200, 24)],
      { prox: 0.45, view: 0.9, cheer: 0.5, comfort: 0.5, price: 0.3, access: 0.45, family: 0.6, steep: 0.6, demand: 0.45 }, 12, 'bottom'),
    zone('end2', `2층 ${end}`, '가장 저렴한 구역', [rect(44, 70, 34, 160), rect(322, 70, 34, 160)],
      { prox: 0.35, view: 0.5, cheer: 0.4, comfort: 0.5, price: 0.15, access: 0.45, family: 0.55, steep: 0.6, demand: 0.2 }, 12, 'bottom'),
  ];
  zs.forEach((z) => (z.a.shade = 1));
  return zs;
}

// ───────── 콘서트 아레나 (엔드 스테이지 기준) ─────────
type Scale = 'hall' | 'arena' | 'dome' | 'stadium';
function arenaZones(scale: Scale): Zone[] {
  const far = { hall: 1.15, arena: 1, dome: 0.85, stadium: 0.7 }[scale];
  const snd = { hall: 1.05, arena: 1, dome: 0.85, stadium: 0.8 }[scale];
  const zs = [
    zone('floor-front', '플로어 앞 구역', '무대 바로 앞. 가장 가깝지만 단차가 없어요', [rect(110, 85, 180, 62)],
      { prox: 1, view: 0.55, sound: 0.65, cheer: 1, comfort: 0.3, access: 0.6, price: 1, flat: 1, demand: 1 }, 20),
    zone('floor-mid', '플로어 중간 구역', '콘솔 앞. 음향 기준점에 가장 가까워요', [rect(110, 151, 180, 66)],
      { prox: 0.8, view: 0.6, sound: 0.9, cheer: 0.85, comfort: 0.35, access: 0.6, price: 0.95, flat: 1, demand: 0.8 }, 20),
    zone('floor-back', '플로어 뒤 구역', '플로어 분위기를 비교적 수월하게', [rect(110, 221, 180, 69)],
      { prox: 0.6, view: 0.55, sound: 0.8, cheer: 0.7, comfort: 0.4, access: 0.65, price: 0.9, flat: 1, demand: 0.55 }, 20),
    zone('side-front', '1층 무대 옆 사이드', '옆모습이지만 거리는 플로어급', [rect(60, 70, 42, 100), rect(298, 70, 42, 100)],
      { prox: 0.9, view: 0.5, sound: 0.55, cheer: 0.75, comfort: 0.6, price: 0.85, steep: 0.35, demand: 0.75 }, 18, 'top',
      { caution: '무대 장치·스피커에 일부가 가릴 수 있어요. 시야제한석 표기를 확인하세요' }),
    zone('side-back', '1층 측면 중간', '단차가 있어 시야가 트이고 거리도 적당', [rect(60, 175, 42, 115), rect(298, 175, 42, 115)],
      { prox: 0.65, view: 0.8, sound: 0.7, cheer: 0.65, comfort: 0.65, price: 0.8, steep: 0.35, demand: 0.7 }, 18),
    zone('front-low', '1층 정면', '무대와 전광판, 조명 연출이 정면으로', [rect(110, 300, 180, 40)],
      { prox: 0.5, view: 0.95, sound: 0.85, cheer: 0.6, comfort: 0.7, price: 0.8, steep: 0.35, demand: 0.65 }, 18),
    zone('side-up', '2층 측면', '멀지만 단차가 커서 가리지 않아요', [rect(15, 70, 38, 220), rect(347, 70, 38, 220)],
      { prox: 0.4, view: 0.75, sound: 0.6, cheer: 0.45, comfort: 0.6, price: 0.5, access: 0.4, steep: 0.7, demand: 0.4 }, 20, 'bottom'),
    zone('front-up', '2층 정면', '가장 멀지만 전체 연출과 응원봉 물결이 한눈에', [rect(60, 348, 280, 40)],
      { prox: 0.25, view: 0.85, sound: 0.65, cheer: 0.4, comfort: 0.6, price: 0.4, access: 0.35, steep: 0.75, demand: 0.3 }, 20, 'bottom'),
  ];
  zs.forEach((z) => {
    if (!z.id.startsWith('floor-front')) z.a.prox = Math.min(1, z.a.prox * far);
    z.a.sound = Math.min(1, z.a.sound * snd);
    z.a.shade = scale === 'stadium' ? 0.3 : 1;
  });
  return zs;
}

const V = (
  template: ZoneVenue['template'], id: string, name: string, sub: string, zones: Zone[], note?: string,
): ZoneVenue => ({ kind: 'zone', template, id, name, sub, approx: true, zones, note });

/** 기준: 2026년 11월. 홈구장·응원석 방향은 시즌마다 바뀔 수 있어 구단 공지 확인 필요 */
export const STADIUMS: Record<Sport, ZoneVenue[]> = {
  baseball: [
    V('baseball', 'jamsil', '잠실야구장', '서울 · LG 트윈스 / 두산 베어스', baseballZones({ home: '1B' })),
    V('baseball', 'gocheok', '고척스카이돔', '서울 · 키움 히어로즈', baseballZones({ home: '1B', dome: true }), '돔구장이라 날씨·햇빛 영향이 없어요'),
    V('baseball', 'incheon', '인천SSG랜더스필드', '인천 · SSG 랜더스', baseballZones({ home: '1B' })),
    V('baseball', 'suwon', '수원KT위즈파크', '수원 · KT 위즈', baseballZones({ home: '1B' })),
    V('baseball', 'daejeon', '대전한화생명볼파크', '대전 · 한화 이글스', baseballZones({}), '홈·원정 응원석 방향은 구단 좌석 안내에서 확인하세요'),
    V('baseball', 'daegu', '대구삼성라이온즈파크', '대구 · 삼성 라이온즈', baseballZones({ home: '3B' })),
    V('baseball', 'gwangju', '광주기아챔피언스필드', '광주 · KIA 타이거즈', baseballZones({ home: '3B' })),
    V('baseball', 'sajik', '사직야구장', '부산 · 롯데 자이언츠', baseballZones({ home: '1B' })),
    V('baseball', 'changwon', '창원NC파크', '창원 · NC 다이노스', baseballZones({ home: '1B' })),
  ],
  soccer: [
    V('soccer', 'seoul-wc', '서울월드컵경기장', '서울 · FC서울', soccerZones({})),
    V('soccer', 'jeonju-wc', '전주월드컵경기장', '전주 · 전북 현대', soccerZones({})),
    V('soccer', 'ulsan-munsu', '울산문수축구경기장', '울산 · 울산 HD', soccerZones({})),
    V('soccer', 'pohang', '포항스틸야드', '포항 · 포항 스틸러스', soccerZones({})),
    V('soccer', 'daejeon-wc', '대전월드컵경기장', '대전 · 대전 하나시티즌', soccerZones({})),
    V('soccer', 'incheon-fs', '인천축구전용경기장', '인천 · 인천 유나이티드', soccerZones({})),
    V('soccer', 'gwangju-wc', '광주월드컵경기장', '광주 · 광주FC', soccerZones({})),
    V('soccer', 'jeju-wc', '제주월드컵경기장', '서귀포 · 제주 SK', soccerZones({})),
    V('soccer', 'suwon-wc', '수원월드컵경기장', '수원 · 수원 삼성', soccerZones({})),
    V('soccer', 'daegu', '대구iM뱅크PARK', '대구 · 대구FC', soccerZones({})),
    V('soccer', 'gangneung', '강릉하이원아레나', '강릉 · 강원FC', soccerZones({ track: true }), '종합운동장형이라 트랙만큼 그라운드가 멀어요'),
    V('soccer', 'anyang', '안양종합운동장', '안양 · FC안양', soccerZones({ track: true }), '종합운동장형이라 트랙만큼 그라운드가 멀어요'),
    V('soccer', 'bucheon', '부천종합운동장', '부천 · 부천FC', soccerZones({ track: true }), '종합운동장형이라 트랙만큼 그라운드가 멀어요'),
    V('soccer', 'gimcheon', '김천종합운동장', '김천 · 김천 상무', soccerZones({ track: true }), '종합운동장형이라 트랙만큼 그라운드가 멀어요'),
  ],
  basketball: [
    V('court', 'jamsil-student', '잠실학생체육관', '서울 · SK 나이츠', courtZones('basketball')),
    V('court', 'jamsil-arena', '잠실실내체육관', '서울 · 삼성 썬더스', courtZones('basketball')),
    V('court', 'goyang', '고양 소노 아레나', '고양 · 소노 스카이거너스', courtZones('basketball')),
    V('court', 'anyang-arena', '안양 정관장 아레나', '안양 · 정관장 레드부스터스', courtZones('basketball')),
    V('court', 'suwon-kt', '수원 KT 소닉붐 아레나', '수원 · KT 소닉붐', courtZones('basketball')),
    V('court', 'wonju', '원주 DB프로미 아레나', '원주 · DB 프로미', courtZones('basketball')),
    V('court', 'changwon-gym', '창원체육관', '창원 · LG 세이커스', courtZones('basketball'), '2026-27 시즌 초 경기장 공사 소식이 있어요. 일정을 확인하세요'),
    V('court', 'ulsan', '울산 동천체육관', '울산 · 현대모비스 피버스', courtZones('basketball')),
    V('court', 'daegu-gym', '대구체육관', '대구 · 한국가스공사 페가수스', courtZones('basketball')),
    V('court', 'sajik-gym', '부산 사직실내체육관', '부산 · KCC 이지스', courtZones('basketball')),
  ],
  volleyball: [
    V('court', 'gyeyang', '인천 계양체육관', '인천 · 대한항공', courtZones('volleyball')),
    V('court', 'cheonan', '천안 유관순체육관', '천안 · 현대캐피탈', courtZones('volleyball')),
    V('court', 'jangchung', '서울 장충체육관', '서울 · 우리카드 / GS칼텍스', courtZones('volleyball')),
    V('court', 'suwon-gym', '수원체육관', '수원 · 한국전력 / 현대건설', courtZones('volleyball')),
    V('court', 'chungmu-gym', '대전 충무체육관', '대전 · 삼성화재 / 정관장', courtZones('volleyball')),
    V('court', 'pyeongtaek', '평택 이충문화체육센터', '평택 · KB손해보험 (2026-27 임시 홈)', courtZones('volleyball')),
    V('court', 'gangseo', '부산 강서체육관', '부산 · OK저축은행', courtZones('volleyball')),
    V('court', 'samsan', '인천 삼산월드체육관', '인천 · 흥국생명', courtZones('volleyball')),
    V('court', 'hwaseong', '화성종합경기타운 실내체육관', '화성 · IBK기업은행', courtZones('volleyball')),
    V('court', 'gimcheon-gym', '김천실내체육관', '김천 · 한국도로공사', courtZones('volleyball')),
    V('court', 'pepper', '광주 페퍼스타디움', '광주 · 페퍼저축은행', courtZones('volleyball')),
  ],
};

const A = (id: string, name: string, sub: string, scale: Scale, match: string[], note?: string) => ({
  match,
  venue: V('arena', id, name, sub, arenaZones(scale), note),
});

export const ARENAS: { match: string[]; venue: ZoneVenue }[] = [
  A('kspo', 'KSPO DOME', '서울 올림픽공원 · 약 15,000석', 'arena', ['KSPO']),
  A('inspire', '인스파이어 아레나', '인천 영종도 · 약 15,000석', 'arena', ['인스파이어']),
  A('gocheok-c', '고척스카이돔', '서울 구로 · 공연 시 약 2만석 이상', 'dome', ['고척'], '돔 특성상 울림이 있어요. 뒤쪽 구역은 전광판 의존도가 높아요'),
  A('jamsil-arena-c', '잠실실내체육관', '서울 잠실 · 약 1만석', 'arena', ['잠실실내']),
  A('handball', '올림픽공원 핸드볼경기장', '서울 올림픽공원 · 약 5,000석', 'hall', ['핸드볼']),
  A('olympic-hall', '올림픽홀', '서울 올림픽공원 · 약 3,000석', 'hall', ['올림픽홀']),
  A('seoul-wc-c', '서울월드컵경기장', '서울 상암 · 스타디움 공연', 'stadium', ['서울월드컵'], '야외 스타디움은 뒤쪽 구역이 매우 멀어 전광판 위주로 보게 돼요'),
  A('goyang-stadium', '고양종합운동장', '고양 · 스타디움 공연', 'stadium', ['고양종합운동장'], '야외 스타디움은 뒤쪽 구역이 매우 멀어 전광판 위주로 보게 돼요'),
  A('incheon-asiad', '인천아시아드주경기장', '인천 · 스타디움 공연', 'stadium', ['아시아드주경기장'], '야외 스타디움은 뒤쪽 구역이 매우 멀어 전광판 위주로 보게 돼요'),
  A('sajik-arena', '부산 사직실내체육관', '부산 · 약 1만석', 'arena', ['사직실내']),
];

export const ARENA_TEMPLATES: ZoneVenue[] = [
  V('arena', 'tpl-arena', '아레나·체육관형', '5천~1.5만석 실내', arenaZones('arena')),
  V('arena', 'tpl-dome', '돔형', '2만석 이상 실내', arenaZones('dome')),
  V('arena', 'tpl-stadium', '야외 스타디움형', '4만석 이상 야외', arenaZones('stadium')),
];
