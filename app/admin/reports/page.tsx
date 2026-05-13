import React from 'react';
import ReportsClient from './ReportsClient';
import { fetchSalesAnalytics, fetchKPIMetrics } from '@/src/actions/analytics';

export default async function AdminReportsPage() {
  const salesData = await fetchSalesAnalytics();
  const kpis = await fetchKPIMetrics();

  return (
    <ReportsClient salesData={salesData} kpis={kpis} />
  );
}
