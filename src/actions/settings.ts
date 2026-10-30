'use server';
import { readPublicInventoryFlag } from '@/src/lib/server/database';

import { requireCapability } from '@/src/lib/server/authorization';
import { getServerDatabase } from '@/src/lib/server/database';



import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';


export async function getInventorySettings() {
  return readPublicInventoryFlag();
}

export async function toggleInventoryTracking(newValue: boolean) {
  const actor = await requireCapability('settings.manage');
  const supabase = getServerDatabase(actor);

  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const { error } = await supabase
    .from('global_settings')
    .update({ track_inventory: newValue, updated_at: new Date().toISOString() })
    .eq('id', 'default');

  if (error) {
    console.error('Error toggling inventory tracking:', error);
    throw new Error('Failed to toggle tracking');
  }

  revalidatePath('/admin/catalog/product-management');
  revalidatePath('/shop');
  return { success: true };
}
