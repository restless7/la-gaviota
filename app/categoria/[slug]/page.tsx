import { redirect } from 'next/navigation';
import { categoryHref } from '@/src/lib/categories';

export default async function CategoriaRedirect(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  redirect(categoryHref(slug));
}
