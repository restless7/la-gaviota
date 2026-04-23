import React from 'react';
import { SupplierTable } from './SupplierTable';

export default function AdminSuppliersPage() {
  return (
    <div className="w-full">
      <div className="mb-8">
         <h1 className="text-3xl font-black text-slate-800 font-serif">Proveedores y Granjas</h1>
         <p className="text-gray-500">Gestione la red agrícola de La Gaviota y calcule precios base.</p>
      </div>
      <SupplierTable />
    </div>
  );
}
