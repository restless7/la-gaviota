import { CATEGORIES } from '@/src/constants/productConstants';

const key = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const aliases: Record<string, string> = {
  verduras: 'VERDURAS Y HORTALIZAS',
  carnes: 'CARNES X 500 GRAMOS',
  kits: 'KITS NEGOCIOS',
  'varios-preparados': 'VARIOS',
  miscelanea: 'MISCELÁNEA',
  tiendita: 'MISCELÁNEA',
  'la-tiendita': 'MISCELÁNEA',
  navidad: 'MISCELÁNEA',
  'cojines-navidenos': 'MISCELÁNEA',
};

export function normalizeCategory(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = key(value);
  return CATEGORIES.find(category => key(category) === normalized) ?? aliases[normalized] ?? null;
}

export function categoryHref(value: string): string {
  const category = normalizeCategory(value);
  return category ? `/?category=${encodeURIComponent(category)}` : '/';
}
