import { Metadata } from 'next';
import { getAdminSubscriptionsList } from '@/src/actions/subscriptions';
import { AdminSubscriptionsClient } from './AdminSubscriptionsClient';

export const metadata: Metadata = {
  title: 'Mercados Programados | Administración La Gaviota',
  description: 'Gestión administrativa de entregas periódicas y suscripciones de frutas y verduras.',
};

export default async function AdminSubscriptionsPage() {
  const subscriptions = await getAdminSubscriptionsList();

  return (
    <AdminSubscriptionsClient initialSubscriptions={subscriptions} />
  );
}

