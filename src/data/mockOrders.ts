export type OrderStatus = 'Pendiente' | 'En Preparación' | 'En Ruta' | 'Entregado';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerTier: 'Personas Naturales' | 'Micromercados' | 'Restaurantes';
  status: OrderStatus;
  date: string;
  totalAmount: number;
  items: OrderItem[];
  address: string;
}

export const initialOrders: Order[] = [
  {
    id: 'ORD-1001',
    customerName: 'Restaurante El Gordo',
    customerTier: 'Restaurantes',
    status: 'Pendiente',
    date: '2026-04-22T08:30:00Z',
    totalAmount: 185000,
    address: 'Cra 15 #85-22, Bogotá',
    items: [
      { productId: '2', name: 'Aguacate Hass', quantity: 20, unit: 'kg', price: 9000, total: 180000 }
    ]
  },
  {
    id: 'ORD-1002',
    customerName: 'Tienda La Esquina',
    customerTier: 'Micromercados',
    status: 'Pendiente',
    date: '2026-04-22T09:15:00Z',
    totalAmount: 45000,
    address: 'Cl 140 #9-15, Bogotá',
    items: [
      { productId: '6', name: 'Kit Sancocho Familiar', quantity: 4, unit: 'Bandejas', price: 11000, total: 44000 }
    ]
  },
  {
    id: 'ORD-1003',
    customerName: 'Maria Perez',
    customerTier: 'Personas Naturales',
    status: 'En Preparación',
    date: '2026-04-22T10:00:00Z',
    totalAmount: 24000,
    address: 'Tr 24 #50-10, Bogotá',
    items: [
      { productId: '1', name: 'Tomate Chonto', quantity: 2, unit: 'kg', price: 12000, total: 24000 }
    ]
  },
  {
    id: 'ORD-1004',
    customerName: 'Parrilla Santandereana',
    customerTier: 'Restaurantes',
    status: 'En Ruta',
    date: '2026-04-22T11:45:00Z',
    totalAmount: 320000,
    address: 'Av Pepadilla #10-10, Bogotá',
    items: [
      { productId: '3', name: 'Manzana Roja', quantity: 25, unit: 'kg', price: 12000, total: 300000 }
    ]
  }
];
