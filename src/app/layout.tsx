import type { Metadata, Viewport } from 'next';
import { BRAND } from '@/lib/options';
import { SITE_DESC, SITE_URL, pageUrl } from '@/lib/site';
import './globals.css';

const AD_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '';
const GOOGLE_VERIFY = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? '';
const NAVER_VERIFY = process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION ?? '';
const TITLE = `${BRAND.name} — 예매 전에 미리 정하는 내 자리`;

export const metadata: Metadata = {
  metadataBase: new URL(`${SITE_URL}/`),
  title: { default: TITLE, template: `%s | ${BRAND.name}` },
  description: SITE_DESC,
  keywords: ['좌석 추천', '명당 자리', '콘서트 좌석', '뮤지컬 좌석', '영화관 명당', '야구장 좌석', '직관 자리', '티켓팅', '좌석 시야', BRAND.name],
  applicationName: BRAND.name,
  alternates: { canonical: pageUrl() },
  openGraph: { type: 'website', locale: 'ko_KR', siteName: BRAND.name, title: TITLE, description: SITE_DESC, url: pageUrl() },
  twitter: { card: 'summary', title: TITLE, description: SITE_DESC },
  robots: { index: true, follow: true },
  // 구글 서치 콘솔·네이버 서치어드바이저의 소유 확인 코드 (빌드 변수로 넣는다 — README 참고)
  verification: { google: GOOGLE_VERIFY || undefined, other: NAVER_VERIFY ? { 'naver-site-verification': NAVER_VERIFY } : undefined },
};
export const viewport: Viewport = { themeColor: '#0b0d11', width: 'device-width', initialScale: 1 };

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: BRAND.name,
  alternateName: BRAND.en,
  url: pageUrl(),
  description: SITE_DESC,
  applicationCategory: 'EntertainmentApplication',
  operatingSystem: 'Web',
  inLanguage: 'ko',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
        {AD_CLIENT && (
          <script async crossOrigin="anonymous" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`} />
        )}
      </head>
      <body>
        <div className="wrap">{children}</div>
      </body>
    </html>
  );
}
