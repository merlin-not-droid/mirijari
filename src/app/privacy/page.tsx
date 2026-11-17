import type { Metadata } from 'next';
import { BRAND } from '@/lib/options';
import { Logo } from '@/components/Icon';

export const metadata: Metadata = { title: `개인정보 처리방침 — ${BRAND.name}` };

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const HOME = `${BASE}/`;

export default function Privacy() {
  return (
    <article className="doc">
      <header className="top">
        <a href={HOME} className="logo"><Logo name={BRAND.name} /></a>
        <a href={HOME} className="top-link">처음으로</a>
      </header>

      <h1 className="page-title">개인정보 처리방침</h1>
      <p className="page-sub">시행일 2026년 11월 17일</p>

      <h2>1. 수집하는 정보</h2>
      <p>
        {BRAND.name}는 회원가입이 없고, 입력한 정보를 서버로 보내거나 저장하지 않습니다.
        키·나이대·관람 취향 같은 설문 답변은 추천 계산에만 쓰이며, 사용 중인 브라우저의 저장 공간(localStorage)에만 남습니다.
      </p>

      <h2>2. 저장된 정보 지우기</h2>
      <p>브라우저 설정에서 이 사이트의 사이트 데이터를 삭제하면 저장된 설문 답변이 모두 지워집니다.</p>

      <h2>3. 광고</h2>
      <p>
        이 사이트는 운영 비용을 위해 Google AdSense 광고를 게재할 수 있습니다. 광고가 게재되는 경우 Google과 그 제휴사는
        쿠키를 사용해 이 사이트나 다른 사이트의 방문 기록을 바탕으로 광고를 제공할 수 있습니다.
        맞춤 광고는 <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">Google 광고 설정</a>에서 끌 수 있습니다.
      </p>

      <h2>4. 외부 데이터 출처</h2>
      <p>
        공연 목록은 (재)예술경영지원센터 공연예술통합전산망(KOPIS), 상영작 목록은 영화진흥위원회 영화관입장권통합전산망(KOBIS)의
        공개 데이터를 사용합니다. 좌석 배치와 추천은 참고용이며, 실제 좌석과 예매 가능 여부는 예매처에서 확인해야 합니다.
      </p>

      <h2>5. 문의</h2>
      <p>
        이 방침에 대한 문의는 <a href="https://github.com/merlin-not-droid/mirijari/issues" target="_blank" rel="noreferrer">GitHub 저장소의 Issues</a>로 남겨 주세요.
      </p>
    </article>
  );
}
