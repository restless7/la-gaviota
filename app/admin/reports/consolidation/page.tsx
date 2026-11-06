import React, { Suspense } from 'react';
import { fetchOrderConsolidation } from '@/src/actions/orders';
import ConsolidationClient, { ConsolidatedItem } from './ConsolidationClient';

export const dynamic = 'force-dynamic';

export default async function ConsolidationPage() {
  let consolidatedItems: ConsolidatedItem[] = [];
  try {
    consolidatedItems = await fetchOrderConsolidation(['Pendiente', 'En Preparación']);
  } catch (err) {
    console.error('Error loading initial consolidation:', err);
    consolidatedItems = [];
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500 font-bold">Cargando consolidado operativo...</div>}>
      <ConsolidationClient initialItems={consolidatedItems} />
    </Suspense>
  );
}
