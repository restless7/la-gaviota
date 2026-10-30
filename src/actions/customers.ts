'use server';
import { requireCapability, hasCapability, requireOwnedSubject, validateTier, assertTargetId } from '@/src/lib/server/authorization';
import { getServerDatabase } from '@/src/lib/server/database';



import { revalidatePath } from 'next/cache';


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
  const actor = await requireCapability('customers.manage');
  const supabase = getServerDatabase(actor);

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
  const actor = await requireOwnedSubject(clerkUserId);
  const supabase = getServerDatabase(actor);
  if (data.tier !== undefined && !hasCapability(actor, 'tiers.manage')) throw new Error('TIER_FIELD_FORBIDDEN');

  // Upsert customer profile
  const { error } = await supabase
    .from('customers')
    .upsert({
      clerk_user_id: clerkUserId,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      ...(data.tier === undefined ? {} : { tier: validateTier(data.tier) }),
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error ensuring customer:', error);
    throw new Error('Failed to ensure customer record');
  }

  return { success: true };
}

export async function approveClientTier(userId: string, requestedTier: string, applicationId?: string) {
  const actor = await requireCapability('tiers.manage');
  const supabase = getServerDatabase(actor);

  assertTargetId(userId);
  validateTier(requestedTier);
  const { clerkClient, auth } = await import('@clerk/nextjs/server');
  const { userId: adminId } = await auth();
  
  if (!adminId) throw new Error("Unauthorized Admin");

  const client = await clerkClient();
  
  // 1. Update Clerk
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      tier: requestedTier,
      approvedAt: new Date().toISOString()
    }
  });

  // 2. Update Customers table
  await supabase
    .from('customers')
    .update({ tier: requestedTier, updated_at: new Date().toISOString() })
    .eq('clerk_user_id', userId);

  // 3. Update Business Application if provided
  if (applicationId) {
    await supabase
      .from('business_applications')
      .update({
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', applicationId);
  }

  revalidatePath('/admin/solicitudes');
  revalidatePath('/admin/clientes/restaurantes');
  revalidatePath('/admin/clientes/micro');
  return { success: true };
}
