import React from 'react';
import { getAdminPromotionsList } from '@/src/actions/promotions';
import PromotionsAdminClient from './PromotionsAdminClient';

export default async function AdminPromotionsPage() {
  const promotions = await getAdminPromotionsList();

  return (
    <PromotionsAdminClient initialPromotions={promotions} />
  );
}

