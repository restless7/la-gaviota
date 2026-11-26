import { Metadata } from 'next';
import { getAdminSubscriptionsList } from '@/src/actions/subscriptions';
import { AdminSubscriptionsClient } from './AdminSubscriptionsClient';

export const metadata: Metadata = {
  title: 'Mercados Programados | Administración La Gaviota',
  description: 'Gestión administrativa de entregas periódicas y suscripciones de frutas y verduras.',
};

export default async function AdminSubscriptionsPage() {
  let subscriptions: Awaited<ReturnType<typeof getAdminSubscriptionsList>> = [];
  try {
    subscriptions = await getAdminSubscriptionsList();
  } catch (err) {
    console.error('[AdminSubscriptionsPage] Database unreachable:', err);
    // Page renders with empty list; no crash propagated to error.tsx
  }

  return (
    <AdminSubscriptionsClient initialSubscriptions={subscriptions} />
  );
}

