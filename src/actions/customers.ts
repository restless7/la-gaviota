'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface Customer {
  clerk_user_id: string;
  full_name: string;
  business_name: string | null;
  email: string;
  phone: string;
  address: string;
  nit: string | null;
  tier: string;
  credit_limit: number;
  current_balance: number;
  payment_terms: string;
  assigned_rep: string | null;
  total_orders: number;
  total_spent: number;
  last_order_at: string | null;
  created_at: string;
}

export async function fetchCustomers(tier?: string): Promise<Customer[]> {
  let query = supabase
    .from('customers')
    .select('*')
    .order('total_spent', { ascending: false });

  if (tier) {
    query = query.eq('tier', tier);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching customers:', error);
    throw new Error('Failed to fetch customers');
  }

  return data || [];
}

export async function ensureCustomer(clerkUserId: string, data: Partial<Customer>) {
  // Upsert customer profile
  const { error } = await supabase
    .from('customers')
    .upsert({
      clerk_user_id: clerkUserId,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      tier: data.tier || 'Personas Naturales',
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error ensuring customer:', error);
    throw new Error('Failed to ensure customer record');
  }

  return { success: true };
}
