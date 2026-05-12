'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';

export type UserRole = 'Personas Naturales' | 'Micromercados' | 'Restaurantes';

interface UserRoleContextType {
  role: UserRole;
  isLoading: boolean;
  isSignedIn: boolean;
  userName: string | null;
  businessName: string | null;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded, isSignedIn } = useUser();

  const contextValue = useMemo(() => {
    if (!isLoaded) {
      return {
        role: 'Personas Naturales' as UserRole,
        isLoading: true,
        isSignedIn: false,
        userName: null,
        businessName: null,
      };
    }

    if (!isSignedIn || !user) {
      return {
        role: 'Personas Naturales' as UserRole,
        isLoading: false,
        isSignedIn: false,
        userName: null,
        businessName: null,
      };
    }

    // Derive role from Clerk publicMetadata
    const metadata = user.publicMetadata as Record<string, string> | undefined;
    const tier = metadata?.tier as UserRole | undefined;
    const validTiers: UserRole[] = ['Personas Naturales', 'Micromercados', 'Restaurantes'];
    const role: UserRole = tier && validTiers.includes(tier) ? tier : 'Personas Naturales';

    return {
      role,
      isLoading: false,
      isSignedIn: true,
      userName: user.firstName || user.fullName || user.primaryEmailAddress?.emailAddress || null,
      businessName: (metadata?.businessName as string) || null,
    };
  }, [user, isLoaded, isSignedIn]);

  return (
    <UserRoleContext.Provider value={contextValue}>
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
}
