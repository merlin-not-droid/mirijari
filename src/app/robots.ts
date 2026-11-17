import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

// 참고: github.io/저장소 주소에서는 이 파일이 도메인 루트가 아니라 검색엔진이 읽지 않는다.
// (기본값이 '모두 허용'이라 문제는 없다.) 자체 도메인을 연결하면 그대로 쓰인다.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${SITE_URL}/sitemap.xml` };
}
