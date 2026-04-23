import React from 'react';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import Image from 'next/image';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Role-Specific Portal Header Motif - This is separate from the global header, adding a tailored feel */}
      <div className="bg-slate-900 h-1 relative overflow-hidden shrink-0">
         {/* Could be dynamically colored depending on exact role styling needs later */}
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         {children}
      </main>
    </div>
  );
}
