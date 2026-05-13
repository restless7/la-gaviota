const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const suppliers = [
  {
    name: 'Finca Vista Hermosa',
    farm_location: 'Lebrija, Santander',
    contact_name: 'Don Arturo Prada',
    phone: '315-123-4567',
    supplied_categories: ['Frutas'],
    status: 'Activo',
  },
  {
    name: 'Cultivos San Jorge',
    farm_location: 'Socorro, Santander',
    contact_name: 'Jorge Mendez',
    phone: '310-987-6543',
    supplied_categories: ['Verduras Y Hortalizas'],
    status: 'Activo',
  },
  {
    name: 'Hacienda La Estrella',
    farm_location: 'Piedecuesta, Santander',
    contact_name: 'Maria Rodriguez',
    phone: '300-456-7890',
    supplied_categories: ['Frutas'],
    status: 'Activo',
  },
  {
    name: 'Carnes de Origen SAS',
    farm_location: 'Bucaramanga, Santander',
    contact_name: 'Pedro Gomez',
    phone: '320-555-0199',
    supplied_categories: ['Carnes'],
    status: 'Activo',
  },
  {
    name: 'Agrofrut del Oriente',
    farm_location: 'Girón, Santander',
    contact_name: 'Claudia Vargas',
    phone: '318-200-3344',
    supplied_categories: ['Frutas'],
    status: 'Activo',
  },
  {
    name: 'Parcela El Refugio',
    farm_location: 'Floridablanca, Santander',
    contact_name: 'Luis Fernando Cárdenas',
    phone: '312-888-1122',
    supplied_categories: ['Verduras Y Hortalizas'],
    status: 'Activo',
  },
  {
    name: 'Frutas Selectas del Valle',
    farm_location: 'San Gil, Santander',
    contact_name: 'Ramiro Torres',
    phone: '316-444-5566',
    supplied_categories: ['Frutas'],
    status: 'Activo',
  },
  {
    name: 'Distribuidora Agropecuaria Cúcuta',
    farm_location: 'Cúcuta, Norte de Santander',
    contact_name: 'Andrés Mejia',
    phone: '322-111-3344',
    supplied_categories: ['Condimentos Frutos Secos Aromaticas'],
    status: 'Activo',
  },
  {
    name: 'Finca Los Naranjos',
    farm_location: 'Barichara, Santander',
    contact_name: 'Don Esteban Rueda',
    phone: '311-333-7788',
    supplied_categories: ['Frutas'],
    status: 'Inactivo',
  },
];

async function seedSuppliers() {
  console.log('Seeding suppliers...');
  const { data, error } = await supabase
    .from('suppliers')
    .insert(suppliers);

  if (error) {
    console.error('Error seeding suppliers:', error);
  } else {
    console.log('Suppliers seeded successfully!');
  }
}

seedSuppliers();
