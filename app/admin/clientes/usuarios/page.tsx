import React from 'react';
import { fetchSystemUsers } from '@/src/actions/users';
import UserManagementClient from './UserManagementClient';

export const dynamic = 'force-dynamic';

export default async function UserManagementPage() {
  const users = await fetchSystemUsers();
  
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 font-serif">Gestión de Usuarios</h1>
          <p className="text-gray-500 font-medium mt-1">
            Administra roles del sistema y accesos B2B para todos los usuarios registrados.
          </p>
        </div>
      </div>
      
      <UserManagementClient initialUsers={users} />
    </div>
  );
}
