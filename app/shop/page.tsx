import { redirect } from 'next/navigation';
import { normalizeCategory } from '@/src/lib/categories';

export default async function ShopRedirectPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(await searchParams)) {
    for (const entry of Array.isArray(value) ? value : value ? [value] : []) query.append(name, entry);
  }
  const category = normalizeCategory(query.get('category'));
  query.delete('category');
  if (category) query.set('category', category);
  redirect(query.size ? `/?${query.toString()}` : '/');
}
