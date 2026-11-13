import 'server-only';
import { createClient } from '@supabase/supabase-js';

export interface PromotionTierRule {
  minSubtotal: number;
  discountPercent: number;
  badge: string;
  label: string;
  description: string;
  posterUrl?: string;
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  headline: string;
  description: string | null;
  banner_url: string | null;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
  tier_rules: PromotionTierRule[];
  applicable_tiers: string[];
  max_discount_cap: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface DiscountCalculation {
  hasDiscount: boolean;
  discountAmount: number;
  discountPercent: number;
  discountLabel: string;
  badge: string;
  finalSubtotal: number;
  nextTier?: {
    needed: number;
    nextPercent: number;
    nextMinSubtotal: number;
  } | null;
  campaign: {
    id: string;
    code: string;
    name: string;
    endsAt: string;
    remainingSeconds: number;
  } | null;
}

const DEFAULT_LAUNCH_PROMOTION: Promotion = {
  id: 'promo-launch-default',
  code: 'LANZAMIENTO_WEB',
  name: '¡Gran Lanzamiento Web La Gaviota!',
  headline: '¡Descuentos de Lanzamiento por 1 Semana!',
  description: 'Aprovecha nuestra semana inaugural con descuentos escalonados automáticos: 15% en compras >$100k, 25% en compras >$200k y 35% en compras >$300k.',
  banner_url: '/PROMOTIONS/descuento-35-lanzamiento.jpg',
  is_active: true,
  starts_at: new Date(Date.now() - 3600000).toISOString(),
  ends_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  tier_rules: [
    {
      minSubtotal: 100000,
      discountPercent: 15,
      badge: '15% OFF',
      label: '15% de Descuento',
      description: 'En compras superiores a $100.000',
      posterUrl: '/PROMOTIONS/descuento-15-lanzamiento.jpg',
    },
    {
      minSubtotal: 200000,
      discountPercent: 25,
      badge: '25% OFF',
      label: '25% de Descuento',
      description: 'En compras superiores a $200.000',
      posterUrl: '/PROMOTIONS/descuento-25-lanzamiento.jpg',
    },
    {
      minSubtotal: 300000,
      discountPercent: 35,
      badge: '35% OFF',
      label: '35% de Descuento',
      description: 'En compras superiores a $300.000',
      posterUrl: '/PROMOTIONS/descuento-35-lanzamiento.jpg',
    },
  ],
  applicable_tiers: ['Personas Naturales'],
  max_discount_cap: null,
};

function getPublicSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Returns the currently active launch promotion if within its time window.
 */
export async function getActivePromotion(): Promise<Promotion | null> {
  const supabase = getPublicSupabase();
  if (!supabase) return DEFAULT_LAUNCH_PROMOTION;

  try {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', nowIso)
      .gt('ends_at', nowIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      code: data.code,
      name: data.name,
      headline: data.headline || data.name,
      description: data.description,
      banner_url: data.banner_url,
      is_active: data.is_active,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      tier_rules: Array.isArray(data.tier_rules) ? data.tier_rules : DEFAULT_LAUNCH_PROMOTION.tier_rules,
      applicable_tiers: Array.isArray(data.applicable_tiers) ? data.applicable_tiers : ['Personas Naturales'],
      max_discount_cap: data.max_discount_cap ? Number(data.max_discount_cap) : null,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (err) {
    console.warn('[getActivePromotion] Fallback to default campaign:', err);
    return DEFAULT_LAUNCH_PROMOTION;
  }
}

/**
 * Pure, authoritative discount calculation based on subtotal, customer tier, and active promotion.
 */
export function calculateDiscount(
  subtotal: number,
  tier: string = 'Personas Naturales',
  promotion?: Promotion | null
): DiscountCalculation {
  const defaultNoDiscount: DiscountCalculation = {
    hasDiscount: false,
    discountAmount: 0,
    discountPercent: 0,
    discountLabel: '',
    badge: '',
    finalSubtotal: subtotal,
    nextTier: null,
    campaign: null,
  };

  if (!promotion || !promotion.is_active) {
    return defaultNoDiscount;
  }

  // Check timeframe window
  const now = Date.now();
  const startTime = new Date(promotion.starts_at).getTime();
  const endTime = new Date(promotion.ends_at).getTime();

  if (now < startTime || now >= endTime) {
    return defaultNoDiscount;
  }

  // Check customer tier applicability
  const applicableTiers = promotion.applicable_tiers || ['Personas Naturales'];
  if (!applicableTiers.includes(tier) && !applicableTiers.includes('*')) {
    return defaultNoDiscount;
  }

  const remainingSeconds = Math.max(0, Math.round((endTime - now) / 1000));
  const campaignMeta = {
    id: promotion.id,
    code: promotion.code,
    name: promotion.name,
    endsAt: promotion.ends_at,
    remainingSeconds,
  };

  const rules = [...(promotion.tier_rules || [])].sort((a, b) => a.minSubtotal - b.minSubtotal);
  if (rules.length === 0) {
    return { ...defaultNoDiscount, campaign: campaignMeta };
  }

  // Find qualifying tier
  let activeRule: PromotionTierRule | null = null;
  let nextRule: PromotionTierRule | null = null;

  for (let i = rules.length - 1; i >= 0; i--) {
    if (subtotal >= rules[i].minSubtotal) {
      activeRule = rules[i];
      nextRule = i + 1 < rules.length ? rules[i + 1] : null;
      break;
    }
  }

  if (!activeRule) {
    const firstRule = rules[0];
    return {
      hasDiscount: false,
      discountAmount: 0,
      discountPercent: 0,
      discountLabel: '',
      badge: '',
      finalSubtotal: subtotal,
      nextTier: {
        needed: Math.max(0, firstRule.minSubtotal - subtotal),
        nextPercent: firstRule.discountPercent,
        nextMinSubtotal: firstRule.minSubtotal,
      },
      campaign: campaignMeta,
    };
  }

  let calculatedDiscount = Math.round(subtotal * (activeRule.discountPercent / 100));
  if (promotion.max_discount_cap && calculatedDiscount > promotion.max_discount_cap) {
    calculatedDiscount = Math.round(promotion.max_discount_cap);
  }

  return {
    hasDiscount: true,
    discountAmount: calculatedDiscount,
    discountPercent: activeRule.discountPercent,
    discountLabel: `${activeRule.label} (${activeRule.discountPercent}%)`,
    badge: activeRule.badge || `${activeRule.discountPercent}% OFF`,
    finalSubtotal: Math.max(0, subtotal - calculatedDiscount),
    nextTier: nextRule
      ? {
          needed: Math.max(0, nextRule.minSubtotal - subtotal),
          nextPercent: nextRule.discountPercent,
          nextMinSubtotal: nextRule.minSubtotal,
        }
      : null,
    campaign: campaignMeta,
  };
}
