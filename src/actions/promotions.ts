'use server';

import { requireCapability } from '@/src/lib/server/authorization';
import { getServerDatabase } from '@/src/lib/server/database';
import { logAdminAction } from '@/src/lib/audit';
import { revalidatePath } from 'next/cache';
import {
  type Promotion,
  type PromotionTierRule,
  type DiscountCalculation,
  getActivePromotion,
  calculateDiscount,
} from '@/src/lib/server/promotions';

export type { Promotion, PromotionTierRule, DiscountCalculation };

export async function getActivePromotionAction(): Promise<Promotion | null> {
  return getActivePromotion();
}

export async function calculateDiscountAction(
  subtotal: number,
  tier: string = 'Personas Naturales'
): Promise<DiscountCalculation> {
  const activePromo = await getActivePromotion();
  return calculateDiscount(subtotal, tier, activePromo);
}

export async function getAdminPromotionsList(): Promise<Promotion[]> {
  const actor = await requireCapability('pricing.manage');
  const supabase = getServerDatabase(actor);

  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getAdminPromotionsList] Error:', error);
    return [];
  }

  return (data || []).map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    headline: p.headline || p.name,
    description: p.description,
    banner_url: p.banner_url,
    is_active: p.is_active,
    starts_at: p.starts_at,
    ends_at: p.ends_at,
    tier_rules: Array.isArray(p.tier_rules) ? p.tier_rules : [],
    applicable_tiers: Array.isArray(p.applicable_tiers) ? p.applicable_tiers : ['Personas Naturales'],
    max_discount_cap: p.max_discount_cap ? Number(p.max_discount_cap) : null,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));
}

export async function updatePromotionCampaign(
  payload: Partial<Promotion> & { id: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireCapability('pricing.manage');
    const supabase = getServerDatabase(actor);

    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.name !== undefined) updateFields.name = payload.name.trim();
    if (payload.headline !== undefined) updateFields.headline = payload.headline.trim();
    if (payload.description !== undefined) updateFields.description = payload.description;
    if (payload.banner_url !== undefined) updateFields.banner_url = payload.banner_url;
    if (payload.is_active !== undefined) updateFields.is_active = Boolean(payload.is_active);
    if (payload.starts_at !== undefined) updateFields.starts_at = payload.starts_at;
    if (payload.ends_at !== undefined) updateFields.ends_at = payload.ends_at;
    if (payload.tier_rules !== undefined) updateFields.tier_rules = payload.tier_rules;
    if (payload.applicable_tiers !== undefined) updateFields.applicable_tiers = payload.applicable_tiers;
    if (payload.max_discount_cap !== undefined) updateFields.max_discount_cap = payload.max_discount_cap;

    const { error } = await supabase
      .from('promotions')
      .update(updateFields)
      .eq('id', payload.id);

    if (error) {
      console.error('[updatePromotionCampaign] DB Error:', error);
      return { success: false, error: 'No se pudo guardar la campaña: ' + error.message };
    }

    try {
      await logAdminAction(
        'PRICING',
        'Actualizó Campaña Promocional',
        `Campaña ${payload.name || payload.id} actualizada (Activo: ${payload.is_active})`,
        payload.id
      );
    } catch {}

    revalidatePath('/admin/promotions');
    revalidatePath('/cart');
    revalidatePath('/checkout');
    revalidatePath('/');

    return { success: true };
  } catch (err: unknown) {
    console.error('[updatePromotionCampaign] Unhandled:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error inesperado al guardar la campaña',
    };
  }
}

export async function extendPromotionDuration(
  id: string,
  days: number = 7
): Promise<{ success: boolean; error?: string; newEndsAt?: string }> {
  try {
    const actor = await requireCapability('pricing.manage');
    const supabase = getServerDatabase(actor);

    const { data: promo, error: fetchErr } = await supabase
      .from('promotions')
      .select('ends_at, name')
      .eq('id', id)
      .single();

    if (fetchErr || !promo) {
      return { success: false, error: 'Campaña no encontrada' };
    }

    const currentEnd = new Date(promo.ends_at).getTime();
    const baseTime = currentEnd > Date.now() ? currentEnd : Date.now();
    const newEndsAt = new Date(baseTime + days * 86400000).toISOString();

    const { error: updateErr } = await supabase
      .from('promotions')
      .update({
        ends_at: newEndsAt,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    try {
      await logAdminAction(
        'PRICING',
        'Extendió Campaña Promocional',
        `Campaña ${promo.name} extendida por ${days} días hasta ${newEndsAt}`,
        id
      );
    } catch {}

    revalidatePath('/admin/promotions');
    revalidatePath('/cart');
    revalidatePath('/checkout');
    revalidatePath('/');

    return { success: true, newEndsAt };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al extender campaña' };
  }
}

export async function togglePromotionActive(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireCapability('pricing.manage');
    const supabase = getServerDatabase(actor);

    const { error } = await supabase
      .from('promotions')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    try {
      await logAdminAction(
        'PRICING',
        'Cambió Estado de Campaña',
        `Campaña ${id} cambiada a ${isActive ? 'ACTIVA' : 'PAUSADA'}`,
        id
      );
    } catch {}

    revalidatePath('/admin/promotions');
    revalidatePath('/cart');
    revalidatePath('/checkout');
    revalidatePath('/');

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al cambiar estado' };
  }
}
