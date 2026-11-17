/** 검색엔진에 알려 줄 사이트 주소 (끝에 / 없음). 자체 도메인을 연결하면 SITE_URL 변수만 바꾼다 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://merlin-not-droid.github.io/mirijari').replace(/\/$/, '');
export const SITE_DESC = '키·취향·동행을 알려주면 콘서트·뮤지컬·영화·스포츠에서 나에게 맞는 좌석을 몇 열 몇 칸까지 미리 골라 드려요. 예매 전 좌석 추천, 티켓팅 우선순위, 남은 자리 중 추천.';
/** 정적 배포에서는 주소가 / 로 끝난다 */
export const pageUrl = (path = '') => `${SITE_URL}${path}${process.env.NEXT_PUBLIC_STATIC === '1' || path === '' ? '/' : ''}`;

export const CATEGORY_SEO: Record<string, { title: string; description: string }> = {
  concert: { title: '콘서트 좌석 추천 — 구역·몇 열·티켓팅 우선순위', description: 'KSPO DOME, 고척스카이돔, 인스파이어 아레나 등 콘서트장에서 내 키와 취향에 맞는 구역과 열을 추천하고, 티켓팅 때 먼저 클릭할 순서를 알려 드려요.' },
  musical: { title: '뮤지컬 좌석 추천 — 층·열·번호까지', description: '샤롯데씨어터, 블루스퀘어, 충무아트센터 등 뮤지컬 극장에서 내 눈높이와 취향에 맞는 층·열·좌석 번호를 추천해요.' },
  movie: { title: '영화관 명당 자리 추천 — 일반관·IMAX·돌비·4DX', description: '상영관 타입과 크기, 내 키와 관람 취향에 맞춰 영화관에서 가장 좋은 열과 좌석 번호를 추천해요.' },
  sports: { title: '야구·축구·농구·배구 직관 자리 추천', description: '잠실야구장, 서울월드컵경기장 등 프로 경기장에서 응원·전술 관람·가족 동반 등 내 성향에 맞는 구역과 열을 추천해요.' },
};
