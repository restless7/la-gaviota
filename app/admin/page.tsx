import React from 'react';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';
import { fetchAdminProducts, AdminProduct } from '@/src/actions/products';
import { getLiveOperationalOrders as fetchOrders, Order } from '@/src/actions/orders';
import { fetchDashboardMetrics, DashboardMetrics } from '@/src/actions/dashboard';
import { getActor, hasCapability } from '@/src/lib/server/authorization';

export default async function AdminDashboardPage() {
  const actor = await getActor();
  
  if (!actor.userId) {
    redirect('/sign-in?redirect_url=/admin');
  }

  if (!hasCapability(actor, 'catalog.manage')) {
    redirect('/dashboard');
  }

  // Use Promise.allSettled to guard against any temporary backend query failures
  const [productsResult, ordersResult, metricsResult] = await Promise.allSettled([
    fetchAdminProducts(),
    fetchOrders(),
    fetchDashboardMetrics()
  ]);

  const products: AdminProduct[] = productsResult.status === 'fulfilled' ? productsResult.value : [];
  const orders: Order[] = ordersResult.status === 'fulfilled' ? ordersResult.value : [];
  const metrics: DashboardMetrics = metricsResult.status === 'fulfilled' ? metricsResult.value : {
    productCount: 0,
    orderCount: 0,
    supplierCount: 0,
    activeSuppliers: 0,
    pendingApplications: 0
  };

  if (productsResult.status === 'rejected') {
    console.error('[AdminDashboardPage] Warning: Failed to fetch products:', productsResult.reason);
  }
  if (ordersResult.status === 'rejected') {
    console.error('[AdminDashboardPage] Warning: Failed to fetch orders:', ordersResult.reason);
  }
  if (metricsResult.status === 'rejected') {
    console.error('[AdminDashboardPage] Warning: Failed to fetch metrics:', metricsResult.reason);
  }

  // Calculate real inventory stats
  const lowStockItems = products
    .filter(p => p.stockQuantity < 50)
    .map(p => ({
      name: p.name,
      stock: p.stockQuantity,
      unit: p.unit,
      severity: p.stockQuantity < 15 ? ('critical' as const) : ('warning' as const)
    }));

  // Calculate real order stats
  const pendingOrders = orders.filter(o => o.status === 'Pendiente').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  // Recent orders for the table
  const recentOrders = orders.slice(0, 5);

  return (
    <AdminDashboardClient 
      initialProductCount={products.length || metrics.productCount}
      initialLowStockItems={lowStockItems}
      initialOrderCount={orders.length || metrics.orderCount}
      initialPendingOrders={pendingOrders}
      initialTotalRevenue={totalRevenue}
      initialRecentOrders={recentOrders}
      initialSupplierCount={metrics.supplierCount}
      initialActiveSuppliers={metrics.activeSuppliers}
      initialPendingApplications={metrics.pendingApplications}
    />
  );
}
