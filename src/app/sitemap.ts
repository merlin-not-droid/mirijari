import type { MetadataRoute } from 'next';
import { CATEGORIES } from '@/lib/options';
import { pageUrl } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: pageUrl(), lastModified, changeFrequency: 'daily', priority: 1 },
    ...CATEGORIES.map((c) => ({ url: pageUrl(`/go/${c.id}`), lastModified, changeFrequency: 'daily' as const, priority: 0.9 })),
    { url: pageUrl('/privacy'), lastModified, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
