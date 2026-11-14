import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '미리자리 — 예매 전에 미리 정하는 내 자리',
  description: '키·취향·동행을 알려주면 콘서트·뮤지컬·영화·스포츠에서 나에게 맞는 좌석을 미리 골라 드려요.',
};
export const viewport: Viewport = { themeColor: '#0d0f13', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <div className="wrap">{children}</div>
      </body>
    </html>
  );
}
