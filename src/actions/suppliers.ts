'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface Supplier {
  id: string;
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  farm_location: string;
  supplied_categories: string[];
  status: 'Activo' | 'Inactivo';
  created_at: string;
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching suppliers:', error);
    throw new Error('Failed to fetch suppliers');
  }

  return data || [];
}

export async function createSupplier(supplier: Omit<Supplier, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('suppliers')
    .insert(supplier)
    .select()
    .single();

  if (error) {
    console.error('Error creating supplier:', error);
    throw new Error('Failed to create supplier');
  }

  revalidatePath('/admin/suppliers');
  return { success: true, data };
}

export async function updateSupplierStatus(id: string, status: Supplier['status']) {
  const { error } = await supabase
    .from('suppliers')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error updating supplier status:', error);
    throw new Error('Failed to update supplier status');
  }

  revalidatePath('/admin/suppliers');
  return { success: true };
}

export async function updateSupplier(id: string, supplier: Partial<Omit<Supplier, 'id' | 'created_at'>>) {
  const { data, error } = await supabase
    .from('suppliers')
    .update({ ...supplier, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating supplier:', error);
    throw new Error('Failed to update supplier');
  }

  revalidatePath('/admin/suppliers');
  return { success: true, data };
}
