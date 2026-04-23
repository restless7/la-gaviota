export interface Supplier {
  id: string;
  name: string;
  location: string;
  contactPerson: string;
  phone: string;
  productsSupplied: string[];
  status: 'Activo' | 'Inactivo' | 'Auditando';
  lastDelivery: string;
}

export const mockSuppliers: Supplier[] = [
  {
    id: 'SUP-001',
    name: 'Finca Vista Hermosa',
    location: 'Lebrija, Santander',
    contactPerson: 'Don Arturo',
    phone: '315-123-4567',
    productsSupplied: ['Aguacate Hass', 'Banano Criollo'],
    status: 'Activo',
    lastDelivery: '2026-04-20',
  },
  {
    id: 'SUP-002',
    name: 'Cultivos San Jorge',
    location: 'Socorro, Santander',
    contactPerson: 'Jorge Mendez',
    phone: '310-987-6543',
    productsSupplied: ['Tomate Chonto', 'Zanahoria', 'Cebolla Larga'],
    status: 'Activo',
    lastDelivery: '2026-04-22',
  },
  {
    id: 'SUP-003',
    name: 'Hacienda La Estrella',
    location: 'Piedecuesta, Santander',
    contactPerson: 'Maria Rodriguez',
    phone: '300-456-7890',
    productsSupplied: ['Badea', 'Arándanos'],
    status: 'Auditando',
    lastDelivery: 'N/A',
  },
  {
    id: 'SUP-004',
    name: 'Carnes de Origen',
    location: 'Bucaramanga, Santander',
    contactPerson: 'Pedro Gomez',
    phone: '320-555-0199',
    productsSupplied: ['Res Costilla', 'Res Lomo fino'],
    status: 'Activo',
    lastDelivery: '2026-04-21',
  }
];
