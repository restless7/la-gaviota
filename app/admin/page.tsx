import React from 'react';
import AdminDashboardClient from './AdminDashboardClient';
import { fetchProducts } from '@/src/actions/products';
import { getLiveOperationalOrders as fetchOrders } from '@/src/actions/orders';

import { fetchDashboardMetrics } from '@/src/actions/dashboard';

export default async function AdminDashboardPage() {
  const [products, orders, metrics] = await Promise.all([
    fetchProducts(),
    fetchOrders(),
    fetchDashboardMetrics()
  ]);
  
  // Calculate real inventory stats
  const lowStockItems = products
    .filter(p => p.stockQuantity < 50)
    .map(p => ({
      name: p.name,
      stock: p.stockQuantity,
      unit: p.unit,
      severity: p.stockQuantity < 15 ? 'critical' as const : 'warning' as const
    }));

  // Calculate real order stats
  const pendingOrders = orders.filter(o => o.status === 'Pendiente').length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
  
  // Recent orders for the table
  const recentOrders = orders.slice(0, 5);

  return (
    <AdminDashboardClient 
      initialProductCount={products.length}
      initialLowStockItems={lowStockItems}
      initialOrderCount={orders.length}
      initialPendingOrders={pendingOrders}
      initialTotalRevenue={totalRevenue}
      initialRecentOrders={recentOrders}
      initialSupplierCount={metrics.supplierCount}
      initialActiveSuppliers={metrics.activeSuppliers}
      initialPendingApplications={metrics.pendingApplications}
    />
  );
}
