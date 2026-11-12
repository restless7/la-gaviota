'use server';


import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { getActor, assertIssuedActor } from '@/src/lib/server/authorization';
import { getServerDatabase } from '@/src/lib/server/database';

// Fallback to service role if possible, else anon

export async function getB2BProfile() {
  const { userId } = await auth();
  if (!userId) return null;
  const actor = await getActor();
  const supabase = getServerDatabase(actor);

  const { data } = await supabase
    .from('b2b_credit_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  return data;
}

export async function getBuyingTemplates() {
  const { userId } = await auth();
  if (!userId) return [];
  const actor = await getActor();
  const supabase = getServerDatabase(actor);

  const { data } = await supabase
    .from('buying_templates')
    .select('*')
    .eq('user_id', userId)
    .order('last_used_at', { ascending: false });

  return data || [];
}

export async function getMonthlySpend() {
  const { userId } = await auth();
  if (!userId) return 0;
  const actor = await getActor();
  const supabase = getServerDatabase(actor);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('clerk_user_id', userId)
    .in('status', ['Pendiente', 'En Preparación', 'En Ruta', 'Entregado'])
    .gte('created_at', startOfMonth.toISOString());

  if (error || !data) return 0;

  return data.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
}

export async function getLastOrder() {
  const { userId } = await auth();
  if (!userId) return null;
  const actor = await getActor();
  const supabase = getServerDatabase(actor);

  const { data } = await supabase
    .from('orders')
    .select('id,total_amount,status,created_at,order_items(product_id,product_name,quantity,price_at_purchase)')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data;
}

export async function getB2BOrders() {
  const { userId } = await auth();
  if (!userId) return [];
  const actor = await getActor();
  const supabase = getServerDatabase(actor);

  const { data } = await supabase
    .from('orders')
    .select('id,total_amount,status,created_at,order_items(product_id,product_name,quantity,price_at_purchase)')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false });

  return data || [];
}

export async function createBuyingTemplate(
  templateName: string,
  items: Array<{ product_id: string; quantity: number }>
) {
  const { userId } = await auth();
  if (!userId) return { ok: false as const, error: 'Debes iniciar sesión para guardar plantillas.' };
  const actor = await getActor();
  assertIssuedActor(actor);

  const trimmedName = (templateName || '').trim();
  if (trimmedName.length < 2 || trimmedName.length > 80) {
    return { ok: false as const, error: 'El nombre de la plantilla debe tener entre 2 y 80 caracteres.' };
  }

  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    return { ok: false as const, error: 'Agrega al menos 1 producto al carrito antes de guardar una plantilla.' };
  }

  const deduped = new Map<string, number>();
  for (const item of items) {
    const pid = typeof item?.product_id === 'string' ? item.product_id.trim() : '';
    const qty = Number(item?.quantity);
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(pid) || !Number.isSafeInteger(qty) || qty <= 0 || qty > 10000) {
      return { ok: false as const, error: 'Uno de los productos de la plantilla tiene datos inválidos.' };
    }
    deduped.set(pid, Math.min(10000, (deduped.get(pid) || 0) + qty));
  }

  const normalizedList = Array.from(deduped.entries()).map(([product_id, quantity]) => ({
    product_id,
    quantity,
  }));

  const supabase = getServerDatabase(actor);
  const { data, error } = await supabase
    .from('buying_templates')
    .insert({
      user_id: actor.userId!,
      template_name: trimmedName,
      product_list: normalizedList,
      last_used_at: new Date().toISOString(),
    })
    .select('id, template_name, product_list, last_used_at, created_at')
    .single();

  if (error || !data) {
    console.error('[createBuyingTemplate] Failed to create template:', error);
    return { ok: false as const, error: 'No pudimos guardar tu plantilla. Intenta nuevamente.' };
  }

  revalidatePath('/micromercado');
  revalidatePath('/restaurante');
  return { ok: true as const, template: data };
}

export async function deleteBuyingTemplate(templateId: string) {
  const { userId } = await auth();
  if (!userId) return { ok: false as const, error: 'Debes iniciar sesión.' };
  const actor = await getActor();
  assertIssuedActor(actor);

  const safeId = (templateId || '').trim();
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(safeId)) {
    return { ok: false as const, error: 'ID de plantilla inválido.' };
  }

  const supabase = getServerDatabase(actor);
  const { error } = await supabase
    .from('buying_templates')
    .delete()
    .eq('id', safeId)
    .eq('user_id', actor.userId!);

  if (error) {
    console.error('[deleteBuyingTemplate] Failed to delete template:', error);
    return { ok: false as const, error: 'No se pudo eliminar la plantilla.' };
  }

  revalidatePath('/micromercado');
  revalidatePath('/restaurante');
  return { ok: true as const };
}
