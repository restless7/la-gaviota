import React from 'react';
import ReportsClient from './ReportsClient';
import { getAdvancedFinancialSummary, getSalesProjectionData, getRealShrinkageMetrics, fetchAllProducts } from '@/src/actions/analytics';

export default async function AdminReportsPage({ searchParams }: { searchParams: { [key: string]: string | undefined } }) {
  const filters = {
    startDate: searchParams.startDate,
    endDate: searchParams.endDate,
    productId: searchParams.productId,
  };

  const [summary, salesData, shrinkageData, products] = await Promise.all([
    getAdvancedFinancialSummary(filters),
    getSalesProjectionData(filters),
    getRealShrinkageMetrics(filters),
    fetchAllProducts()
  ]);

  return (
    <ReportsClient 
      summary={summary} 
      salesData={salesData} 
      shrinkageData={shrinkageData} 
      products={products}
      currentFilters={filters}
    />
  );
}
