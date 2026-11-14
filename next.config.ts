import type { NextConfig } from 'next';

// STATIC_EXPORT=1 이면 GitHub Pages용 정적 사이트(out/)로 내보낸다.
// 이때 서버가 없으므로 src/app/api (AI 기능)는 빌드 전에 제외한다 — .github/workflows/deploy.yml 참고
const isStatic = process.env.STATIC_EXPORT === '1';
const basePath = process.env.PAGES_BASE_PATH || '';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isStatic ? { output: 'export' as const, trailingSlash: true, images: { unoptimized: true } } : {}),
  basePath: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_STATIC: isStatic ? '1' : '',
  },
};

export default nextConfig;
