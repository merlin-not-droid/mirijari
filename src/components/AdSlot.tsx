'use client';
import { useEffect, useState } from 'react';

/** AdSense 게시자 ID (ca-pub-…)와 광고 단위 ID. 빌드 환경변수로 넣는다 — README 참고 */
export const AD_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '';
const SLOTS = {
  home: process.env.NEXT_PUBLIC_AD_SLOT_HOME ?? '',
  list: process.env.NEXT_PUBLIC_AD_SLOT_LIST ?? '',
  result: process.env.NEXT_PUBLIC_AD_SLOT_RESULT ?? '',
};
const NAMES = { home: '홈 중간', list: '목록 아래', result: '추천 결과 아래' };
const PREVIEW_KEY = 'miri.adPreview';

/**
 * 광고 영역. AdSense ID가 설정돼 있으면 실제 광고를, 없으면 아무것도 그리지 않는다.
 * 자리만 확인하려면 주소 뒤에 ?ads=preview 를 붙여 연다 (끄기: ?ads=off). 개발 서버에서는 항상 자리가 보인다.
 */
export default function AdSlot({ slot }: { slot: keyof typeof SLOTS }) {
  const id = SLOTS[slot];
  const live = !!AD_CLIENT && !!id;
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (live) {
      try {
        const w = window as unknown as { adsbygoogle?: unknown[] };
        (w.adsbygoogle = w.adsbygoogle ?? []).push({});
      } catch { /* 광고 차단 등으로 실패해도 화면은 그대로 둔다 */ }
      return;
    }
    try {
      const q = new URLSearchParams(location.search).get('ads');
      if (q === 'preview') localStorage.setItem(PREVIEW_KEY, '1');
      if (q === 'off') localStorage.removeItem(PREVIEW_KEY);
      setPreview(process.env.NODE_ENV === 'development' || localStorage.getItem(PREVIEW_KEY) === '1');
    } catch { /* 저장소를 못 쓰면 미리보기 없이 */ }
  }, [live]);

  if (live)
    return (
      <aside className="ad" aria-label="광고">
        <span className="ad-label">광고</span>
        <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client={AD_CLIENT} data-ad-slot={id}
          data-ad-format="auto" data-full-width-responsive="true" />
      </aside>
    );
  if (!preview) return null;
  return (
    <aside className="ad ad-preview" aria-label="광고 영역 미리보기">
      <span className="ad-label">광고</span>
      <p>광고 영역 · {NAMES[slot]}</p>
      <small>AdSense를 연결하면 이 자리에 광고가 표시돼요. 연결 전에는 방문자에게 보이지 않아요.</small>
    </aside>
  );
}
