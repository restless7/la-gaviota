import React from 'react';
import type { Metadata } from 'next';
import { getSiteAnalyticsSummary } from '@/src/actions/siteAnalytics';
import AnalyticsDashboardClient from './AnalyticsDashboardClient';

export const metadata: Metadata = {
  title: 'Analítica Web & Tráfico | Panel Administrador',
  description: 'Métricas de visualizaciones, visitas de la página, comportamiento de usuarios y conversión en Surtifruver La Gaviota.',
};

export default async function AdminAnalyticsPage() {
  const analyticsData = await getSiteAnalyticsSummary('30d');

  return (
    <AnalyticsDashboardClient initialData={analyticsData} />
  );
}
