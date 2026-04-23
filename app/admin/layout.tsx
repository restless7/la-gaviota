"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  FileText,
  Settings,
  Users,
  Shield,
  Menu,
  X,
  Home,
  File,
  TrendingUp,
  Database,
  Zap,
  Lightbulb,
  LogOut,
  BrainCircuit,
  PenSquare,
  Briefcase,
  ChevronDown,
  Server,
  Calculator,
  ScrollText,
} from 'lucide-react';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import { useRBAC } from '@/src/hooks/useRBAC';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard Principal', href: '/admin', icon: Home, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { 
    name: 'Gestión de Clientes', 
    icon: Users, 
    group: 'crm',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    subItems: [
      { name: 'Personas Naturales', href: '/admin/clientes/personas' },
      { name: 'Micromercados', href: '/admin/clientes/micro' },
      { name: 'Restaurantes & Mayoristas', href: '/admin/clientes/restaurantes' }
    ]
  },
  {
    name: 'Catálogo & Precios',
    icon: Server,
    group: 'catalog',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    subItems: [
      { name: 'Inventario General', href: '/admin/catalog/inventory' },
      { name: 'Gestión de Precios por Tier', href: '/admin/pricing' },
      { name: 'Kits y Promociones', href: '/admin/catalog/kits' },
    ]
  },
  { name: 'Gestión de Pedidos', href: '/admin/orders', icon: TrendingUp, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'Proveedores & Granjas', href: '/admin/suppliers', icon: Briefcase, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'Reportes y Ventas', href: '/admin/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'Audit Log (Transacciones)', href: '/admin/audit', icon: ScrollText, roles: ['SUPER_ADMIN'] },
  { name: 'Configuración', href: '/admin/settings', icon: Settings, roles: ['SUPER_ADMIN'] },
];

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [crmOpen, setCrmOpen] = useState(false);
  const [opsOpen, setOpsOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading, isSuperAdmin, isCommercial, isAdminAreaUser } = useRBAC();
  const { logout } = useAuth(); // Import from original useAuth Context

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4CAF50] mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Cargando su portal...</p>
        </div>
      </div>
    );
  }

  const isLoginPage = pathname === '/admin/login';

  if (user && !isAdminAreaUser && !isLoginPage) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h2>
          <p className="text-gray-400 mb-8">
            No tienes permisos suficientes para acceder al panel de administración. 
            Si crees que esto es un error, contacta al soporte técnico.
          </p>
          <div className="space-y-4">
            <Link 
              href="/"
              className="block w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              Volver al Inicio
            </Link>
            <button
              onClick={logout}
              className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-gray-900">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out shadow-xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-center p-6 border-b border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#E30613]"></div>
          <div className="relative w-32 h-10">
             {/* Fallback layout logo text */}
             <span className="font-serif text-2xl font-black text-[#E30613] italic tracking-tight">La Gaviota</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute right-4 text-gray-400 hover:text-gray-800"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-4 px-3 h-[calc(100vh-200px)] overflow-y-auto">
          {navigation.map((item) => {
            const canView = isSuperAdmin ? true : (isCommercial && item.roles.includes('COMMERCIAL'));
            if (!canView) return null;

            if (item.subItems) {
              const isChildActive = item.subItems.some(sub => pathname.startsWith(sub.href));
              const groupKey = (item as any).group || 'crm';
              const isGroupOpen = groupKey === 'crm' ? crmOpen : opsOpen;
              const toggleGroup = () => groupKey === 'crm' ? setCrmOpen(!crmOpen) : setOpsOpen(!opsOpen);
              
              return (
                <div key={item.name} className="mb-1">
                  <button
                    onClick={toggleGroup}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors
                      ${isChildActive 
                        ? 'text-white' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`h-5 w-5 ${isChildActive ? 'text-emerald-500' : ''}`} />
                      <span className={isChildActive ? 'font-medium' : ''}>{item.name}</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isGroupOpen || isChildActive ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {(isGroupOpen || isChildActive) && (
                    <div className="mt-1 space-y-1">
                      {item.subItems.map(subItem => {
                        const isSubActive = pathname.startsWith(subItem.href);
                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                              flex items-center pl-12 pr-4 py-2.5 text-sm rounded-lg transition-colors
                              ${isSubActive
                                ? 'bg-emerald-600/10 text-emerald-500 font-medium'
                                : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                              }
                            `}
                          >
                            {subItem.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
              
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 mb-1 rounded-xl transition-all font-medium
                  ${isActive
                    ? 'bg-[#E30613]/10 text-[#E30613]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-gray-50/80">
          {user && (
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#4CAF50]/20 text-[#4CAF50] rounded-full flex items-center justify-center shadow-sm border border-[#4CAF50]/30">
                  <span className="text-sm font-black">
                    {user.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{user.username}</p>
                  <p className="text-xs text-[#E30613] uppercase font-bold tracking-wider">{user.role}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors font-medium shadow-sm"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Salir</span>
              </button>
            </div>
          )}
          <div className="p-4 border-t border-gray-200 bg-white text-center">
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
              La Gaviota OS v2.0
            </div>
          </div>
        </div>
      </div>

      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm z-10 relative">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-[#E30613]"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-4 ml-auto">
              <div className="text-sm text-gray-500 font-medium bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  );
}
