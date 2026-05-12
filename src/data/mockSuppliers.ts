export interface Supplier {
  id: string;
  name: string;
  location: string;
  contactPerson: string;
  phone: string;
  productsSupplied: string[];
  status: 'Activo' | 'Inactivo' | 'Auditando';
  lastDelivery: string;
  municipality: string;
}

export const mockSuppliers: Supplier[] = [
  {
    id: 'SUP-001',
    name: 'Finca Vista Hermosa',
    location: 'Lebrija, Santander',
    municipality: 'Lebrija',
    contactPerson: 'Don Arturo Prada',
    phone: '315-123-4567',
    productsSupplied: ['Aguacate Hass', 'Banano Criollo', 'Mandarina'],
    status: 'Activo',
    lastDelivery: '2026-05-11',
  },
  {
    id: 'SUP-002',
    name: 'Cultivos San Jorge',
    location: 'Socorro, Santander',
    municipality: 'Socorro',
    contactPerson: 'Jorge Mendez',
    phone: '310-987-6543',
    productsSupplied: ['Tomate Chonto', 'Zanahoria', 'Cebolla Larga', 'Arveja'],
    status: 'Activo',
    lastDelivery: '2026-05-12',
  },
  {
    id: 'SUP-003',
    name: 'Hacienda La Estrella',
    location: 'Piedecuesta, Santander',
    municipality: 'Piedecuesta',
    contactPerson: 'Maria Rodriguez',
    phone: '300-456-7890',
    productsSupplied: ['Fresa Grande', 'Fresa Jumbo', 'Mora'],
    status: 'Activo',
    lastDelivery: '2026-05-10',
  },
  {
    id: 'SUP-004',
    name: 'Carnes de Origen SAS',
    location: 'Bucaramanga, Santander',
    municipality: 'Bucaramanga',
    contactPerson: 'Pedro Gomez',
    phone: '320-555-0199',
    productsSupplied: ['Res Costilla', 'Res Lomo Fino', 'Pollo Pechuga'],
    status: 'Activo',
    lastDelivery: '2026-05-12',
  },
  {
    id: 'SUP-005',
    name: 'Agrofrut del Oriente',
    location: 'Girón, Santander',
    municipality: 'Girón',
    contactPerson: 'Claudia Vargas',
    phone: '318-200-3344',
    productsSupplied: ['Piña Perolera', 'Piña Oro Miel', 'Guanábana', 'Papaya'],
    status: 'Activo',
    lastDelivery: '2026-05-11',
  },
  {
    id: 'SUP-006',
    name: 'Parcela El Refugio',
    location: 'Floridablanca, Santander',
    municipality: 'Floridablanca',
    contactPerson: 'Luis Fernando Cárdenas',
    phone: '312-888-1122',
    productsSupplied: ['Lechuga Batavia', 'Espinaca', 'Cilantro', 'Perejil'],
    status: 'Activo',
    lastDelivery: '2026-05-12',
  },
  {
    id: 'SUP-007',
    name: 'Frutas Selectas del Valle',
    location: 'San Gil, Santander',
    municipality: 'San Gil',
    contactPerson: 'Ramiro Torres',
    phone: '316-444-5566',
    productsSupplied: ['Naranja Valenciana', 'Limón Criollo', 'Maracuyá', 'Curuba'],
    status: 'Activo',
    lastDelivery: '2026-05-09',
  },
  {
    id: 'SUP-008',
    name: 'Huerta Orgánica La Cumbre',
    location: 'Zapatoca, Santander',
    municipality: 'Zapatoca',
    contactPerson: 'Esperanza Duarte',
    phone: '314-777-9988',
    productsSupplied: ['Aguacate Criollo', 'Uchuva', 'Feijoa'],
    status: 'Auditando',
    lastDelivery: 'N/A',
  },
  {
    id: 'SUP-009',
    name: 'Distribuidora Agropecuaria Cúcuta',
    location: 'Cúcuta, Norte de Santander',
    municipality: 'Cúcuta',
    contactPerson: 'Andrés Mejia',
    phone: '322-111-3344',
    productsSupplied: ['Cebolla Cabezona', 'Ajo Blanco', 'Ajo Criollo'],
    status: 'Activo',
    lastDelivery: '2026-05-08',
  },
  {
    id: 'SUP-010',
    name: 'Finca Los Naranjos',
    location: 'Barichara, Santander',
    municipality: 'Barichara',
    contactPerson: 'Don Esteban Rueda',
    phone: '311-333-7788',
    productsSupplied: ['Guayaba', 'Pitahaya', 'Granadilla'],
    status: 'Inactivo',
    lastDelivery: '2026-03-15',
  },
];
