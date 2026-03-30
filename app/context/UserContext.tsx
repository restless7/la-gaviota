'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'Personas Naturales' | 'Micromercados' | 'Restaurantes';

interface UserContextProps {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('Personas Naturales');

  return (
    <UserContext.Provider value={{ role, setRole }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserRole must be used within a UserProvider');
  }
  return context;
}
