import { notFound } from 'next/navigation';
import Flow from '@/components/Flow';
import { CATEGORIES } from '@/lib/options';
import type { Category } from '@/lib/types';

export const dynamicParams = false;
export const generateStaticParams = () => CATEGORIES.map((c) => ({ category: c.id }));

export default async function Page({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!CATEGORIES.some((c) => c.id === category)) notFound();
  return <Flow category={category as Category} />;
}
