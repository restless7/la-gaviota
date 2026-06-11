'use server';

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
    const client = await clerkClient();
    const response = await client.users.getUserList({
      limit: 100,
    });

    return response.data.map(user => {
      const metadata = user.publicMetadata as Record<string, any>;
      return {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress || 'Sin email',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: metadata?.role || 'USER',
        tier: metadata?.tier || 'Personas Naturales',
        createdAt: user.createdAt,
      };
    });
  } catch (error) {
    console.error('Error fetching system users:', error);
    return [];
  }
}

export async function updateUserRoleAndTier(userId: string, role: string, tier: string) {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const existingMetadata = user.publicMetadata || {};

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...existingMetadata,
        role,
        tier,
      }
    });

    revalidatePath('/admin/clientes/usuarios');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating user:', error);
    return { success: false, error: error.message };
  }
}
