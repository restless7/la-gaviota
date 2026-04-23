'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/src/contexts/UserRoleContext';

export default function DashboardRedirect() {
  const router = useRouter();
  const { role } = useUserRole();

  useEffect(() => {
    if (role === 'Micromercados') {
      router.replace('/micromercado');
    } else if (role === 'Restaurantes') {
      router.replace('/restaurante');
    } else {
      router.replace('/retail');
    }
  }, [role, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4CAF50]"></div>
    </div>
  );
}
