import { Metadata } from 'next';
import { getCustomerSubscriptions } from '@/src/actions/subscriptions';
import { SubscriptionsManagementClient } from './SubscriptionsManagementClient';

export const metadata: Metadata = {
  title: 'Mis Mercados Programados | La Gaviota Fruver',
  description: 'Administra tus entregas automáticas de frutas y verduras frescas en Bucaramanga y el área metropolitana.',
};

export default async function MercadosProgramadosPage() {
  const subscriptions = await getCustomerSubscriptions();

  return (
    <SubscriptionsManagementClient initialSubscriptions={subscriptions} />
  );
}

