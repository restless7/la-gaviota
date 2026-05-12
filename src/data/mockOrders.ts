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
    date: '2026-05-12T08:30:00Z',
    totalAmount: 485000,
    address: 'Cra 27 #36-20, Bucaramanga',
    items: [
      { productId: 'prd_0049', name: 'Aguacate Hass', quantity: 20, unit: 'kg', price: 1600, total: 32000 },
      { productId: 'prd_0073', name: 'Cebolla cabezona', quantity: 30, unit: 'kg', price: 3200, total: 96000 },
      { productId: 'prd_0070', name: 'Tomate chonto', quantity: 50, unit: 'kg', price: 2800, total: 140000 },
    ]
  },
  {
    id: 'ORD-1002',
    customerName: 'Tienda La Esquina',
    customerTier: 'Micromercados',
    status: 'Pendiente',
    date: '2026-05-12T09:15:00Z',
    totalAmount: 145000,
    address: 'Cl 45 #23-10, Floridablanca',
    items: [
      { productId: 'prd_0001', name: 'Agraz', quantity: 10, unit: 'kg', price: 2300, total: 23000 },
      { productId: 'prd_0029', name: 'Mora', quantity: 15, unit: 'kg', price: 4600, total: 69000 },
      { productId: 'prd_0016', name: 'Guayaba', quantity: 20, unit: 'kg', price: 1400, total: 28000 },
    ]
  },
  {
    id: 'ORD-1003',
    customerName: 'Maria Perez',
    customerTier: 'Personas Naturales',
    status: 'En Preparación',
    date: '2026-05-12T10:00:00Z',
    totalAmount: 24000,
    address: 'Tr 24 #50-10, Piedecuesta',
    items: [
      { productId: 'prd_0070', name: 'Tomate chonto', quantity: 2, unit: 'kg', price: 12000, total: 24000 }
    ]
  },
  {
    id: 'ORD-1004',
    customerName: 'Parrilla Santandereana',
    customerTier: 'Restaurantes',
    status: 'En Ruta',
    date: '2026-05-12T06:45:00Z',
    totalAmount: 720000,
    address: 'Av Quebrada Seca #32-15, Bucaramanga',
    items: [
      { productId: 'prd_0022', name: 'Manzana roja', quantity: 25, unit: 'kg', price: 900, total: 22500 },
      { productId: 'prd_0051', name: 'Acelga', quantity: 15, unit: 'kg', price: 1700, total: 25500 },
    ]
  },
  {
    id: 'ORD-1005',
    customerName: 'Mercado Doña Flor',
    customerTier: 'Micromercados',
    status: 'Pendiente',
    date: '2026-05-12T11:20:00Z',
    totalAmount: 320000,
    address: 'Cra 15 #52-30, Girón',
    items: [
      { productId: 'prd_0033', name: 'Papaya', quantity: 40, unit: 'kg', price: 2100, total: 84000 },
      { productId: 'prd_0027', name: 'Maracuyá', quantity: 25, unit: 'kg', price: 2700, total: 67500 },
      { productId: 'prd_0052', name: 'Ahuyama', quantity: 30, unit: 'kg', price: 5000, total: 150000 },
    ]
  },
  {
    id: 'ORD-1006',
    customerName: 'Carolina Mejia',
    customerTier: 'Personas Naturales',
    status: 'Entregado',
    date: '2026-05-11T14:00:00Z',
    totalAmount: 67000,
    address: 'Cl 93 #18-42, Bucaramanga',
    items: [
      { productId: 'prd_0011', name: 'Fresa grande', quantity: 3, unit: '500g', price: 1800, total: 5400 },
      { productId: 'prd_0040', name: 'Pitahaya', quantity: 2, unit: 'kg', price: 6300, total: 12600 },
    ]
  },
  {
    id: 'ORD-1007',
    customerName: 'Asadero El Pollo Gordo',
    customerTier: 'Restaurantes',
    status: 'En Preparación',
    date: '2026-05-12T07:00:00Z',
    totalAmount: 1200000,
    address: 'Cra 33 #48-55, Bucaramanga',
    items: [
      { productId: 'prd_0070', name: 'Tomate chonto', quantity: 80, unit: 'kg', price: 2800, total: 224000 },
      { productId: 'prd_0073', name: 'Cebolla cabezona', quantity: 60, unit: 'kg', price: 3200, total: 192000 },
      { productId: 'prd_0018', name: 'Limón criollo', quantity: 40, unit: 'kg', price: 4400, total: 176000 },
    ]
  },
  {
    id: 'ORD-1008',
    customerName: 'Fruver Don Camilo',
    customerTier: 'Micromercados',
    status: 'En Ruta',
    date: '2026-05-12T05:30:00Z',
    totalAmount: 450000,
    address: 'Cl 10 #28-60, San Gil',
    items: [
      { productId: 'prd_0038', name: 'Piña perolera', quantity: 20, unit: 'kg', price: 5800, total: 116000 },
      { productId: 'prd_0028', name: 'Melón', quantity: 25, unit: 'kg', price: 3300, total: 82500 },
    ]
  },
  {
    id: 'ORD-1009',
    customerName: 'Julián Rodríguez',
    customerTier: 'Personas Naturales',
    status: 'Entregado',
    date: '2026-05-11T16:45:00Z',
    totalAmount: 38000,
    address: 'Mz 12 Casa 4, Cañaveral',
    items: [
      { productId: 'prd_0049', name: 'Aguacate Hass', quantity: 4, unit: 'kg', price: 2500, total: 10000 },
      { productId: 'prd_0030', name: 'Naranja común', quantity: 5, unit: 'kg', price: 2800, total: 14000 },
    ]
  },
  {
    id: 'ORD-1010',
    customerName: 'Club de Leones BGA',
    customerTier: 'Restaurantes',
    status: 'Pendiente',
    date: '2026-05-12T12:00:00Z',
    totalAmount: 950000,
    address: 'Cra 36 #52-100, Bucaramanga',
    items: [
      { productId: 'prd_0015', name: 'Guanábana', quantity: 20, unit: 'kg', price: 5100, total: 102000 },
      { productId: 'prd_0029', name: 'Mora', quantity: 30, unit: 'kg', price: 3700, total: 111000 },
    ]
  },
  {
    id: 'ORD-1011',
    customerName: 'Superette La 33',
    customerTier: 'Micromercados',
    status: 'En Preparación',
    date: '2026-05-12T08:00:00Z',
    totalAmount: 280000,
    address: 'Cl 33 #14-22, Bucaramanga',
    items: [
      { productId: 'prd_0059', name: 'Arveja desgranada', quantity: 25, unit: 'kg', price: 3200, total: 80000 },
      { productId: 'prd_0054', name: 'Ajo blanco', quantity: 10, unit: 'kg', price: 5800, total: 58000 },
    ]
  },
  {
    id: 'ORD-1012',
    customerName: 'Pedro Manrique',
    customerTier: 'Personas Naturales',
    status: 'Pendiente',
    date: '2026-05-12T13:30:00Z',
    totalAmount: 52000,
    address: 'Cl 200 #5-15, Lagos del Cacique',
    items: [
      { productId: 'prd_0039', name: 'Piña oro miel', quantity: 3, unit: 'kg', price: 3000, total: 9000 },
      { productId: 'prd_0014', name: 'Granadilla', quantity: 5, unit: 'kg', price: 4400, total: 22000 },
    ]
  },
  {
    id: 'ORD-1013',
    customerName: 'Hamburguesas El Portal',
    customerTier: 'Restaurantes',
    status: 'En Ruta',
    date: '2026-05-12T04:00:00Z',
    totalAmount: 540000,
    address: 'Cra 27 #42-18, Bucaramanga',
    items: [
      { productId: 'prd_0070', name: 'Tomate chonto', quantity: 40, unit: 'kg', price: 2800, total: 112000 },
      { productId: 'prd_0019', name: 'Limón taití', quantity: 30, unit: 'kg', price: 2700, total: 81000 },
    ]
  },
  {
    id: 'ORD-1014',
    customerName: 'Minimercado San Juan',
    customerTier: 'Micromercados',
    status: 'Entregado',
    date: '2026-05-11T08:00:00Z',
    totalAmount: 175000,
    address: 'Cl 7 #15-30, Lebrija',
    items: [
      { productId: 'prd_0026', name: 'Mandarina', quantity: 30, unit: 'kg', price: 4000, total: 120000 },
      { productId: 'prd_0008', name: 'Curuba', quantity: 15, unit: 'kg', price: 2000, total: 30000 },
    ]
  },
  {
    id: 'ORD-1015',
    customerName: 'Andrea Torres',
    customerTier: 'Personas Naturales',
    status: 'En Preparación',
    date: '2026-05-12T10:30:00Z',
    totalAmount: 89000,
    address: 'Cl 105 #22-40, Bucaramanga',
    items: [
      { productId: 'prd_0012', name: 'Fresa jumbo', quantity: 4, unit: '500g', price: 2600, total: 10400 },
      { productId: 'prd_0040', name: 'Pitahaya', quantity: 3, unit: 'kg', price: 6300, total: 18900 },
      { productId: 'prd_0002', name: 'Arándanos', quantity: 5, unit: 'kg', price: 1800, total: 9000 },
    ]
  },
];
