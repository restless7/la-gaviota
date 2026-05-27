'use server';

import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Fallback to service role if possible, else anon
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getB2BProfile() {
  const { userId } = await auth();
  if (!userId) return null;

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

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('customer_id', userId)
    .in('status', ['PAID', 'SHIPPED', 'DELIVERED'])
    .gte('created_at', startOfMonth.toISOString());

  if (error || !data) return 0;

  return data.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
}

export async function getLastOrder() {
  const { userId } = await auth();
  if (!userId) return null;

  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*, products(*))')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data;
}

export async function getB2BOrders() {
  const { userId } = await auth();
  if (!userId) return [];

  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*, products(*))')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false });

  return data || [];
}
