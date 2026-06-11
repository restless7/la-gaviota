'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getInventorySettings() {
  const { data, error } = await supabase
    .from('global_settings')
    .select('track_inventory')
    .eq('id', 'default')
    .single();

  if (error || !data) {
    // Return default false if table doesn't exist yet
    return { track_inventory: false };
  }
  return data;
}

export async function toggleInventoryTracking(newValue: boolean) {
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
