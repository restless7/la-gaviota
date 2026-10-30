"use client";

import { useUser } from '@clerk/nextjs';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPERARIO' | 'COMMERCIAL' | 'CLIENT' | 'USER';

export function useRBAC() {
  const { user: clerkUser, isLoaded } = useUser();
  
  // Extract role and tier from Clerk publicMetadata
  const metadata = clerkUser?.publicMetadata as Record<string, string> | undefined;
  const rawRole = metadata?.role;
  const tier = metadata?.tier;
  
  // Reconcile logic: Check explicitly for the 'role' field first, then fallback to implicit admin from 'tier'
  let mappedRole: UserRole = 'USER';
  if (rawRole === 'SUPER_ADMIN') {
    mappedRole = 'SUPER_ADMIN';
  } else if (rawRole === 'ADMIN') {
    mappedRole = 'ADMIN';
  } else if (rawRole === 'OPERARIO') {
    mappedRole = 'OPERARIO';
  } else if (rawRole === 'COMMERCIAL') {
    mappedRole = 'COMMERCIAL';
  } else if (rawRole === 'CLIENT' || tier === 'Restaurantes' || tier === 'Micromercados') {
    mappedRole = 'CLIENT';
  }
  
  const isSuperAdmin = mappedRole === 'SUPER_ADMIN';
  const isCommercial = mappedRole === 'COMMERCIAL';
  const isClient = mappedRole === 'CLIENT';
  const isAdminAreaUser = isSuperAdmin || mappedRole === 'ADMIN';

  // Function to check if the current commercial user owns a resource
  const canAccessResource = (_ownerId?: string, _assignedTo?: string) => { void _ownerId; void _assignedTo; return isSuperAdmin || mappedRole === 'ADMIN'; };

  // Create a compatible user object for the admin layout to consume
  const user = clerkUser ? {
    id: clerkUser.id,
    username: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Usuario',
    role: mappedRole,
    permissions: isSuperAdmin ? ['*'] : [],
  } : null;

  return {
    user,
    role: mappedRole,
    loading: !isLoaded,
    isSuperAdmin,
    isCommercial,
    isClient,
    isAdminAreaUser,
    canAccessResource
  };
}
