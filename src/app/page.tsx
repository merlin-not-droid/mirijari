import { BRAND, CATEGORIES } from '@/lib/options';
import { DATA_AS_OF } from '@/lib/data';
import Icon, { Logo } from '@/components/Icon';
import HeroSeats from '@/components/HeroSeats';
import AdSlot from '@/components/AdSlot';

// 정적 배포(GitHub Pages)에서는 동적 경로의 프리페치 파일이 404가 되므로 카테고리 이동은 일반 링크를 쓴다
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const SLASH = process.env.NEXT_PUBLIC_STATIC === '1' ? '/' : '';

export default function Home() {
  // 쉼표 뒤에서 줄을 나눠 어색한 줄바꿈을 막는다
  const [lead, rest] = BRAND.tagline.split(', ');
  return (
    <div className="home">
      <header className="top">
        <span className="logo"><Logo name={BRAND.name} /></span>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <h1>{lead},<br />{rest}</h1>
          <p>3열이냐 4열이냐, 통로냐 가운데냐. 키·취향·동행을 1분만 알려주면 예매 전에 미리, 나에게 맞는 자리 3곳을 골라 드려요.</p>
        </div>
        <HeroSeats />
      </section>

      <nav className="cats" aria-label="무엇을 보러 가나요">
        <h2 className="cats-title">무엇을 보러 가나요</h2>
        {CATEGORIES.map((c) => (
          <a key={c.id} href={`${BASE}/go/${c.id}${SLASH}`} className="cat-row">
            <Icon name={c.id} size={24} className="cat-icon" />
            <span className="cat-name">{c.name}</span>
            <span className="cat-desc">{c.desc}</span>
            <Icon name="arrow" size={20} className="cat-arrow" />
          </a>
        ))}
      </nav>

      <AdSlot slot="home" />

      <section className="how">
        <h2>이렇게 골라 드려요</h2>
        <div className="how-grid">
          <div><h3>사람마다 다른 명당</h3><p>키 155cm와 185cm의 명당은 달라요. 눈높이, 시야각, 앞사람에 가릴 위험까지 계산해요.</p></div>
          <div><h3>남은 자리에서도, 오픈 전에도</h3><p>이미 많이 팔렸다면 남은 자리 중 최선을, 티켓팅 전이라면 경쟁을 피해 먼저 클릭할 순서를 알려드려요.</p></div>
          <div><h3>왜 이 자리인지까지</h3><p>점수만 던지지 않아요. 추천 이유와 아쉬운 점을 함께 보여드려요.</p></div>
        </div>
      </section>

      <footer className="foot">
        좌석 배치와 구역 정보는 {DATA_AS_OF} 기준의 근사 데이터예요. 실제 좌석 번호·시야·가격은 예매처 좌석도에서 꼭 확인하세요.
        입력한 정보는 이 기기에만 저장돼요.{' '}
        <a href={`${BASE}/privacy${SLASH}`}>개인정보 처리방침</a>
      </footer>
    </div>
  );
}
