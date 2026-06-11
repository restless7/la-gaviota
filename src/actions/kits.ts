'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { logAdminAction } from '@/src/lib/audit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

  return { success: true, kitId };
}

export async function fetchKits() {
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
