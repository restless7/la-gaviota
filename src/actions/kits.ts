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

export async function createOrUpdateKit(kitData: KitPayload): Promise<{ success: boolean; kitId?: string; slug?: string; error?: string }> {
  try {
    const actor = await requireCapability('catalog.manage');
    const supabase = getServerDatabase(actor);

    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Sesión expirada o no autorizada. Por favor vuelve a iniciar sesión.' };
    }

    const isUpdate = !!kitData.id;

    if (!kitData.name || !kitData.name.trim()) {
      return { success: false, error: 'El nombre del kit es obligatorio.' };
    }

    if (!kitData.items || kitData.items.length === 0) {
      return { success: false, error: 'Debes agregar al menos un producto al kit.' };
    }

    // 1. Sanitize slug with NFD accent stripping and alphanumeric hyphenation
    let cleanSlug = (kitData.slug || kitData.name)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!cleanSlug) {
      cleanSlug = `kit-${Date.now().toString().slice(-4)}`;
    }

    let kitId = kitData.id;

    if (isUpdate && kitId) {
      const { error: updateError } = await supabase
        .from('kits')
        .update({
          name: kitData.name.trim(),
          slug: cleanSlug,
          fixed_price: Math.max(0, kitData.fixed_price),
          banner_url: kitData.banner_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', kitId);
        
      if (updateError) {
        console.error('Failed to update kit:', updateError);
        return { success: false, error: 'Error al actualizar el kit: ' + updateError.message };
      }
      
      // Clear old items to avoid merge conflicts on update
      await supabase.from('kit_items').delete().eq('kit_id', kitId);
    } else {
      // Check if slug exists; if it conflicts with another kit, auto-append short suffix
      const { data: existingSlug } = await supabase
        .from('kits')
        .select('id')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (existingSlug) {
        cleanSlug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
      }

      const { data: newKit, error: insertError } = await supabase
        .from('kits')
        .insert({
          name: kitData.name.trim(),
          slug: cleanSlug,
          fixed_price: Math.max(0, kitData.fixed_price),
          banner_url: kitData.banner_url || null,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Failed to create kit:', insertError);
        return { success: false, error: 'Error al guardar el kit: ' + (insertError.message || 'Verifica que el nombre no esté duplicado.') };
      }
      
      kitId = newKit.id;
    }

    // 2. Bulk Insert Kit Items (deduplicate items by product_id)
    if (kitId && kitData.items.length > 0) {
      const itemMap = new Map<string, number>();
      for (const item of kitData.items) {
        if (!item.product_id) continue;
        const currentQty = itemMap.get(item.product_id) || 0;
        itemMap.set(item.product_id, currentQty + (Number(item.quantity) || 1));
      }

      const itemsToInsert = Array.from(itemMap.entries()).map(([productId, quantity]) => ({
        kit_id: kitId,
        product_id: productId,
        quantity: quantity
      }));

      const { error: itemsError } = await supabase
        .from('kit_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Failed to insert kit items:', itemsError);
        if (!isUpdate) {
          await supabase.from('kits').delete().eq('id', kitId);
        }
        return { success: false, error: 'Error al asociar los productos al kit: ' + itemsError.message };
      }
    }

    // 3. Log Audit Trail (non-blocking)
    try {
      await logAdminAction(
        'KITS',
        isUpdate ? 'Actualizó Kit' : 'Creó Nuevo Kit',
        `Kit: ${kitData.name} | Precio Fijo: $${kitData.fixed_price} | Ítems: ${kitData.items.length}`,
        kitId
      );
    } catch (auditErr) {
      console.warn('Audit log failed silently:', auditErr);
    }

    // 4. Revalidate Public Shops
    try {
      revalidatePath('/admin/catalog/kits');
      revalidatePath('/shop');
      revalidatePath('/');
    } catch {}

    return { success: true, kitId, slug: cleanSlug };
  } catch (err: unknown) {
    console.error('Unhandled error in createOrUpdateKit:', err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('FORBIDDEN')) {
      return {
        success: false,
        error: 'Tu usuario no tiene permisos de Administrador para gestionar el catálogo. Pide a un Super Admin que actualice tu rol.'
      };
    }
    return { success: false, error: 'Ocurrió un error en el servidor: ' + msg };
  }
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

export async function updateKitStatus(kitId: string, status: 'active' | 'draft' | 'archived'): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireCapability('catalog.manage');
    const supabase = getServerDatabase(actor);

    const { error } = await supabase
      .from('kits')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', kitId);

    if (error) {
      console.error('Error updating kit status:', error);
      return { success: false, error: 'No se pudo actualizar el estado del kit: ' + error.message };
    }

    try {
      await logAdminAction(
        'KITS',
        'Actualizó Estado de Kit',
        `Kit ${kitId} cambiado a estado: ${status}`,
        kitId
      );
    } catch {}

    try {
      revalidatePath('/admin/catalog/kits');
      revalidatePath('/shop');
      revalidatePath('/');
    } catch {}

    return { success: true };
  } catch (err: unknown) {
    console.error('Unhandled error in updateKitStatus:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado al actualizar el estado' };
  }
}

export async function updateKitName(kitId: string, name: string): Promise<{ success: boolean; name?: string; error?: string }> {
  try {
    const actor = await requireCapability('catalog.manage');
    const supabase = getServerDatabase(actor);

    const cleanName = name.trim();
    if (!cleanName) return { success: false, error: 'El nombre del kit no puede estar vacío' };

    const { error } = await supabase
      .from('kits')
      .update({ name: cleanName, updated_at: new Date().toISOString() })
      .eq('id', kitId);

    if (error) {
      console.error('Error updating kit name:', error);
      return { success: false, error: 'No se pudo actualizar el nombre: ' + error.message };
    }

    try {
      await logAdminAction(
        'KITS',
        'Renombró Kit',
        `Kit ${kitId} renombrado a: "${cleanName}"`,
        kitId
      );
    } catch {}

    try {
      revalidatePath('/admin/catalog/kits');
      revalidatePath('/shop');
      revalidatePath('/');
    } catch {}

    return { success: true, name: cleanName };
  } catch (err: unknown) {
    console.error('Unhandled error in updateKitName:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado al renombrar kit' };
  }
}

export async function deleteKit(kitId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireCapability('catalog.manage');
    const supabase = getServerDatabase(actor);

    const { error } = await supabase
      .from('kits')
      .delete()
      .eq('id', kitId);

    if (error) {
      console.error('Error deleting kit:', error);
      return { success: false, error: 'No se pudo eliminar el kit: ' + error.message };
    }

    try {
      await logAdminAction(
        'KITS',
        'Eliminó Kit',
        `Kit ${kitId} eliminado del catálogo`,
        kitId
      );
    } catch {}

    try {
      revalidatePath('/admin/catalog/kits');
      revalidatePath('/shop');
      revalidatePath('/');
    } catch {}

    return { success: true };
  } catch (err: unknown) {
    console.error('Unhandled error in deleteKit:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado al eliminar kit' };
  }
}
