'use server';
import { requireCapability, validateTier, validateRole, assertTargetId } from '@/src/lib/server/authorization';
import { getServerDatabase } from '@/src/lib/server/database';
import { clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export interface SystemUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tier: string;
  createdAt: number;
}

export async function fetchSystemUsers(): Promise<SystemUser[]> {
  try {
    await requireCapability('identity.read');
    const client = await clerkClient();
    const response = await client.users.getUserList({
      limit: 100,
    });

    return response.data.map(user => {
      const metadata = (user.publicMetadata || {}) as Record<string, unknown>;
      return {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress || 'Sin email',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: typeof metadata.role === 'string' ? metadata.role : 'USER',
        tier: typeof metadata.tier === 'string' ? metadata.tier : 'Personas Naturales',
        createdAt: user.createdAt,
      };
    });
  } catch (error) {
    console.error('Error fetching system users:', error);
    return [];
  }
}

export async function updateUserRoleAndTier(userId: string, role: string, tier: string) {
  const actor = await requireCapability('identity.manage');


  assertTargetId(userId);
  const safeRole = validateRole(role);
  const safeTier = validateTier(tier);
  if (userId === actor.userId) throw new Error('SELF_ROLE_CHANGE_REQUIRES_SEPARATE_FLOW');
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const existingMetadata = user.publicMetadata || {};
    if (existingMetadata.role === 'SUPER_ADMIN' && safeRole !== 'SUPER_ADMIN') throw new Error('SUPER_ADMIN_DOWNGRADE_REQUIRES_SEPARATE_FLOW');

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...existingMetadata,
        role: safeRole,
        tier: safeTier,
      }
    });

    // Also sync customer tier in Supabase so CRM tables (/admin/clientes/micro, /restaurantes, /personas) reflect the change
    try {
      const supabase = getServerDatabase(actor);
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.primaryEmailAddress?.emailAddress || 'Cliente';
      await supabase
        .from('customers')
        .upsert({
          clerk_user_id: userId,
          full_name: fullName,
          email: user.primaryEmailAddress?.emailAddress || 'Sin email',
          tier: safeTier,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'clerk_user_id' });
    } catch (syncErr) {
      console.warn('Could not sync user tier to customers table:', syncErr);
    }

    revalidatePath('/admin/clientes/usuarios');
    revalidatePath('/admin/clientes/personas');
    revalidatePath('/admin/clientes/micro');
    revalidatePath('/admin/clientes/restaurantes');
    revalidatePath('/');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error updating user:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error updating user' };
  }
}
