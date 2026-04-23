'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'Personas Naturales' | 'Micromercados' | 'Restaurantes';

interface UserRoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isLoading: boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({
  children,
  initialRole = 'Personas Naturales',
}: {
  children: React.ReactNode;
  initialRole?: UserRole;
}) {
  const [role, setRoleState] = useState<UserRole>(initialRole);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // On mount, sync from cookie if available
    const savedRole = getCookie('gaviota_user_role') as UserRole;
    if (savedRole && ['Personas Naturales', 'Micromercados', 'Restaurantes'].includes(savedRole)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRoleState(savedRole);
    }
    setIsLoading(false);
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    setCookie('gaviota_user_role', newRole, 365);
    // Force a router refresh to update Next.js Server Components with the new cookie
    if (typeof window !== 'undefined') {
        window.location.reload(); 
    }
  };

  return (
    <UserRoleContext.Provider value={{ role, setRole, isLoading }}>
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

// Minimal cookie helpers for client side sync
function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = name + '=' + value + ';expires=' + expires.toUTCString() + ';path=/';
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
  return null;
}
