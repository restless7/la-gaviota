'use server';
import { requireCapability } from '@/src/lib/server/authorization';
import { getServerDatabase } from '@/src/lib/server/database';



import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { logAdminAction } from '@/src/lib/audit';


export interface KitItemPayload {
  product_id: string;
  quantity: number;
}

export interface KitPayload {
  id?: string;
  name: string;
  slug: string;
  fixed_price: number;
  banner_url?: string;
  items: KitItemPayload[];
}

export async function createOrUpdateKit(kitData: KitPayload) {
  const actor = await requireCapability('catalog.manage');
  const supabase = getServerDatabase(actor);

  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const isUpdate = !!kitData.id;

  // 1. Insert or Update the Kit Master Record
  let kitId = kitData.id;

  if (isUpdate) {
    const { error: updateError } = await supabase
      .from('kits')
      .update({
        name: kitData.name,
        slug: kitData.slug,
        fixed_price: kitData.fixed_price,
        banner_url: kitData.banner_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', kitId);
      
    if (updateError) {
      console.error('Failed to update kit:', updateError);
      throw new Error('Failed to update kit record');
    }
    
    // Clear old items to avoid merge conflicts on update
    await supabase.from('kit_items').delete().eq('kit_id', kitId);
  } else {
    const { data: newKit, error: insertError } = await supabase
      .from('kits')
      .insert({
        name: kitData.name,
        slug: kitData.slug,
        fixed_price: kitData.fixed_price,
        banner_url: kitData.banner_url || null,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to create kit:', insertError);
      throw new Error('Failed to create kit record. Check for duplicate slugs.');
    }
    
    kitId = newKit.id;
  }

  // 2. Bulk Insert Kit Items
  if (kitId && kitData.items.length > 0) {
    const itemsToInsert = kitData.items.map(item => ({
      kit_id: kitId,
      product_id: item.product_id,
      quantity: item.quantity
    }));

    try {
      const { error: itemsError } = await supabase
        .from('kit_items')
        .insert(itemsToInsert);

      if (itemsError) {
        throw itemsError;
      }
    } catch (err) {
      console.error('Failed to insert kit items:', err);
      if (!isUpdate) {
        await supabase.from('kits').delete().eq('id', kitId);
        console.log(`[Rollback] Kit ${kitId} eliminado por falla en kit_items.`);
      }
      throw new Error('Failed to link items to kit. Se ha revertido la creación del kit.');
    }
  }

  // 3. Log Audit Trail
  await logAdminAction(
    'KITS',
    isUpdate ? 'Actualizó Kit' : 'Creó Nuevo Kit',
    `Kit: ${kitData.name} | Precio Fijo: $${kitData.fixed_price} | Ítems: ${kitData.items.length}`,
    kitId
  );

  // 4. Revalidate Public Shops
  revalidatePath('/admin/catalog/kits');
  revalidatePath('/shop');
  revalidatePath('/');

  return { success: true, kitId };
}

export async function fetchKits() {
  const actor = await requireCapability('catalog.manage');
  const supabase = getServerDatabase(actor);

  const { data, error } = await supabase
    .from('kits')
    .select(`
      *,
      kit_items (
        id,
        quantity,
        product_id,
        products (
          name,
          unit,
          image_url,
          price_retail,
          price_micro,
          price_restaurant
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching kits:', error);
    return [];
  }

  return data || [];
}

export async function updateKitStatus(kitId: string, status: 'active' | 'draft' | 'archived') {
  const actor = await requireCapability('catalog.manage');
  const supabase = getServerDatabase(actor);

  const { error } = await supabase
    .from('kits')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', kitId);

  if (error) {
    console.error('Error updating kit status:', error);
    throw new Error('Failed to update kit status');
  }

  await logAdminAction(
    'KITS',
    'Actualizó Estado de Kit',
    `Kit ${kitId} cambiado a estado: ${status}`,
    kitId
  );

  revalidatePath('/admin/catalog/kits');
  revalidatePath('/shop');
  revalidatePath('/');

  return { success: true };
}

export async function updateKitName(kitId: string, name: string) {
  const actor = await requireCapability('catalog.manage');
  const supabase = getServerDatabase(actor);

  const cleanName = name.trim();
  if (!cleanName) throw new Error('El nombre del kit no puede estar vacío');

  const { error } = await supabase
    .from('kits')
    .update({ name: cleanName, updated_at: new Date().toISOString() })
    .eq('id', kitId);

  if (error) {
    console.error('Error updating kit name:', error);
    throw new Error('Failed to update kit name');
  }

  await logAdminAction(
    'KITS',
    'Renombró Kit',
    `Kit ${kitId} renombrado a: "${cleanName}"`,
    kitId
  );

  revalidatePath('/admin/catalog/kits');
  revalidatePath('/shop');
  revalidatePath('/');

  return { success: true, name: cleanName };
}

export async function deleteKit(kitId: string) {
  const actor = await requireCapability('catalog.manage');
  const supabase = getServerDatabase(actor);

  const { error } = await supabase
    .from('kits')
    .delete()
    .eq('id', kitId);

  if (error) {
    console.error('Error deleting kit:', error);
    throw new Error('Failed to delete kit');
  }

  await logAdminAction(
    'KITS',
    'Eliminó Kit',
    `Kit ${kitId} eliminado del catálogo`,
    kitId
  );

  revalidatePath('/admin/catalog/kits');
  revalidatePath('/shop');
  revalidatePath('/');

  return { success: true };
}
