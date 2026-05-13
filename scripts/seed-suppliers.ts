import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const mockSuppliers = [
  {
    name: 'Finca Vista Hermosa',
    farm_location: 'Lebrija, Santander',
    contact_name: 'Don Arturo Prada',
    phone: '315-123-4567',
    email: 'arturo@vistahermosa.com',
    supplied_categories: ['Frutas', 'Verduras'],
    status: 'Activo',
  },
  {
    name: 'Cultivos San Jorge',
    farm_location: 'Socorro, Santander',
    contact_name: 'Jorge Mendez',
    phone: '310-987-6543',
    email: 'jorge@sanjorge.com',
    supplied_categories: ['Verduras', 'Varios Preparados'],
    status: 'Activo',
  },
  {
    name: 'Hacienda La Estrella',
    farm_location: 'Piedecuesta, Santander',
    contact_name: 'Maria Rodriguez',
    phone: '300-456-7890',
    email: 'maria@laestrella.com',
    supplied_categories: ['Frutas'],
    status: 'Activo',
  },
  {
    name: 'Carnes de Origen SAS',
    farm_location: 'Bucaramanga, Santander',
    contact_name: 'Pedro Gomez',
    phone: '320-555-0199',
    email: 'pedro@carnes.com',
    supplied_categories: ['Carnes'],
    status: 'Activo',
  },
  {
    name: 'Agrofrut del Oriente',
    farm_location: 'Girón, Santander',
    contact_name: 'Claudia Vargas',
    phone: '318-200-3344',
    email: 'claudia@agrofrut.com',
    supplied_categories: ['Frutas', 'Pulpas'],
    status: 'Activo',
  },
  {
    name: 'Parcela El Refugio',
    farm_location: 'Floridablanca, Santander',
    contact_name: 'Luis Fernando Cárdenas',
    phone: '312-888-1122',
    email: 'luis@elrefugio.com',
    supplied_categories: ['Verduras'],
    status: 'Activo',
  },
  {
    name: 'Frutas Selectas del Valle',
    farm_location: 'San Gil, Santander',
    contact_name: 'Ramiro Torres',
    phone: '316-444-5566',
    email: 'ramiro@valle.com',
    supplied_categories: ['Frutas'],
    status: 'Activo',
  },
  {
    name: 'Huerta Orgánica La Cumbre',
    farm_location: 'Zapatoca, Santander',
    contact_name: 'Esperanza Duarte',
    phone: '314-777-9988',
    email: 'esperanza@lacumbre.com',
    supplied_categories: ['Frutas', 'Verduras'],
    status: 'Activo',
  },
  {
    name: 'Distribuidora Agropecuaria Cúcuta',
    farm_location: 'Cúcuta, Norte de Santander',
    contact_name: 'Andrés Mejia',
    phone: '322-111-3344',
    email: 'andres@cucuta.com',
    supplied_categories: ['Verduras'],
    status: 'Activo',
  },
];

async function seedSuppliers() {
  console.log('Seeding suppliers...');
  const { error } = await supabase
    .from('suppliers')
    .insert(mockSuppliers);

  if (error) {
    console.error('Error seeding suppliers:', error);
  } else {
    console.log('Suppliers seeded successfully!');
  }
}

seedSuppliers();
