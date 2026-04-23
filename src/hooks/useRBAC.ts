"use client";

import { useAuth } from '@/src/contexts/AuthContext';

export type UserRole = 'SUPER_ADMIN' | 'COMMERCIAL' | 'CLIENT' | 'USER';

export function useRBAC() {
  const { user, loading } = useAuth();
  
  // Backwards compatibility with the old ADMIN string if any remains
  const mappedRole = user?.role === 'ADMIN' ? 'SUPER_ADMIN' : (user?.role as UserRole) || 'USER';
  
  const isSuperAdmin = mappedRole === 'SUPER_ADMIN';
  const isCommercial = mappedRole === 'COMMERCIAL';
  const isClient = mappedRole === 'CLIENT';
  const isAdminAreaUser = isSuperAdmin || isCommercial;

  // Function to check if the current commercial user owns a resource
  // The resource must have an ownerId or assignedTo matching the user's ID
  const canAccessResource = (ownerId?: string, assignedTo?: string) => {
    if (isSuperAdmin) return true;
    if (isCommercial) {
      if (!user?.id) return false;
      return user.id === ownerId || user.id === assignedTo;
    }
    return false;
  };

  return {
    user,
    role: mappedRole,
    loading,
    isSuperAdmin,
    isCommercial,
    isClient,
    isAdminAreaUser,
    canAccessResource
  };
}
