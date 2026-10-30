'use server';


import { auth } from '@clerk/nextjs/server';
import { getActor } from '@/src/lib/server/authorization';
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
    .in('status', ['PAID', 'SHIPPED', 'DELIVERED'])
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
