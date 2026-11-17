import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Flow from '@/components/Flow';
import { CATEGORIES } from '@/lib/options';
import { CATEGORY_SEO, pageUrl } from '@/lib/site';
import type { Category } from '@/lib/types';

export const dynamicParams = false;
export const generateStaticParams = () => CATEGORIES.map((c) => ({ category: c.id }));

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const seo = CATEGORY_SEO[category];
  if (!seo) return {};
  const url = pageUrl(`/go/${category}`);
  return { title: seo.title, description: seo.description, alternates: { canonical: url }, openGraph: { title: seo.title, description: seo.description, url } };
}

export default async function Page({ params }: Props) {
  const { category } = await params;
  if (!CATEGORIES.some((c) => c.id === category)) notFound();
  return <Flow category={category as Category} />;
}
