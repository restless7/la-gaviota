import React from 'react';
import { fetchOrderById, Order } from '@/src/actions/orders';
import InvoiceClientView from './InvoiceClientView';

interface InvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoicePage(props: InvoicePageProps) {
  const { id } = await props.params;

  let initialOrder: Order | null = null;
  let initialError: string | null = null;

  try {
    initialOrder = await fetchOrderById(id);
    if (!initialOrder) {
      initialError = 'No pudimos encontrar el pedido solicitado o no tienes permisos para visualizarlo.';
    }
  } catch (err: unknown) {
    console.error('[InvoicePage] Failed to fetch order for invoice:', id, err);
    initialError =
      err instanceof Error
        ? err.message
        : 'Error de autorización o consulta al cargar la orden.';
  }

  return (
    <InvoiceClientView
      orderId={id}
      initialOrder={initialOrder}
      initialError={initialError}
    />
  );
}
