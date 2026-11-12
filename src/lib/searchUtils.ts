/**
 * Accent-insensitive catalog search normalization and matching helpers.
 */

export function normalizeSearchText(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export interface SearchableCatalogProduct {
  name: string;
  category?: string;
  description?: string | null;
  kitItems?: Array<{ name: string }>;
}

export function matchesCatalogSearch(
  product: SearchableCatalogProduct,
  rawQuery: string
): boolean {
  const query = normalizeSearchText(rawQuery);
  if (!query) return true;

  const tokens = query.split(/\s+/).filter(Boolean);
  const haystack = normalizeSearchText(
    [
      product.name,
      product.category || '',
      product.description || '',
      ...(product.kitItems?.map((k) => k.name) || []),
    ].join(' ')
  );

  return tokens.every((token) => haystack.includes(token));
}

