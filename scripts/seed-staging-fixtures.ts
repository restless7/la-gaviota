/**
 * LG-PROD-R4: Staging Supabase Activation Seeder
 * 
 * Safely seeds the designated independent Supabase Staging project
 * with strictly synthetic catalog, customer fixtures, and sample transactions.
 * 
 * Enforces assertStagingSafety() to fail closed if accidentally pointed at production.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { assertStagingSafety } from '../src/lib/safetyGuard';

// Load .env.local or custom environment file
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Mandatory Safety Guard Assertion
assertStagingSafety();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[Staging Seeder] Missing Supabase configuration (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedStaging() {
  console.log(`[Staging Seeder] Initializing synthetic seed against ${supabaseUrl}...`);

  // 1. Settings
  const { error: settingsError } = await supabase
    .from('global_settings')
    .upsert({ id: 'default', track_inventory: true });
  if (settingsError) throw new Error(`Failed to seed global_settings: ${settingsError.message}`);
  console.log('  ✔ global_settings seeded');

  // 2. Synthetic Catalog
  const syntheticCatalog = [
    { id: 'sku-stag-manzana', name: 'Manzana Roja Staging', category: 'FRUTAS', subcategory: 'Manzanas', unit: 'kg', base_cost: 4500, price_retail: 7000, price_micro: 6200, price_restaurant: 5500, stock_quantity: 250, is_active: true, is_in_season: true },
    { id: 'sku-stag-banano', name: 'Banano Urabá Staging', category: 'FRUTAS', subcategory: 'Bananos', unit: 'kg', base_cost: 1800, price_retail: 3200, price_micro: 2800, price_restaurant: 2400, stock_quantity: 500, is_active: true, is_in_season: true },
    { id: 'sku-stag-aguacate', name: 'Aguacate Hass Staging', category: 'FRUTAS', subcategory: 'Aguacates', unit: 'kg', base_cost: 5000, price_retail: 8500, price_micro: 7500, price_restaurant: 6800, stock_quantity: 180, is_active: true, is_in_season: true },
    { id: 'sku-stag-naranja', name: 'Naranja Valencia Staging', category: 'FRUTAS', subcategory: 'Cítricos', unit: 'kg', base_cost: 1500, price_retail: 2800, price_micro: 2400, price_restaurant: 2000, stock_quantity: 400, is_active: true, is_in_season: true },
    { id: 'sku-stag-tomate', name: 'Tomate Chonto Staging', category: 'VERDURAS Y HORTALIZAS', subcategory: 'Tomates', unit: 'kg', base_cost: 2200, price_retail: 4200, price_micro: 3600, price_restaurant: 3100, stock_quantity: 350, is_active: true, is_in_season: true },
    { id: 'sku-stag-cebolla-cab', name: 'Cebolla Cabezona Blanca Staging', category: 'VERDURAS Y HORTALIZAS', subcategory: 'Cebollas', unit: 'kg', base_cost: 2000, price_retail: 3800, price_micro: 3200, price_restaurant: 2800, stock_quantity: 300, is_active: true, is_in_season: true },
    { id: 'sku-stag-cebolla-jun', name: 'Cebolla Junca Staging', category: 'VERDURAS Y HORTALIZAS', subcategory: 'Cebollas', unit: 'atado', base_cost: 1200, price_retail: 2200, price_micro: 1900, price_restaurant: 1600, stock_quantity: 200, is_active: true, is_in_season: true },
    { id: 'sku-stag-zanahoria', name: 'Zanahoria San Pedro Staging', category: 'VERDURAS Y HORTALIZAS', subcategory: 'Raíces', unit: 'kg', base_cost: 1600, price_retail: 3000, price_micro: 2600, price_restaurant: 2200, stock_quantity: 400, is_active: true, is_in_season: true },
    { id: 'sku-stag-papa-pastusa', name: 'Papa Pastusa Staging', category: 'VERDURAS Y HORTALIZAS', subcategory: 'Tubérculos', unit: 'kg', base_cost: 1800, price_retail: 3400, price_micro: 2900, price_restaurant: 2500, stock_quantity: 600, is_active: true, is_in_season: true },
    { id: 'sku-stag-cilantro', name: 'Cilantro Patón Staging', category: 'HIERBAS Y AROMATICAS', subcategory: 'Hierbas de Cocina', unit: 'atado', base_cost: 800, price_retail: 1500, price_micro: 1300, price_restaurant: 1100, stock_quantity: 150, is_active: true, is_in_season: true },
    { id: 'sku-stag-albahaca', name: 'Albahaca Fresca Staging', category: 'HIERBAS Y AROMATICAS', subcategory: 'Aromáticas', unit: 'atado', base_cost: 1000, price_retail: 1800, price_micro: 1500, price_restaurant: 1300, stock_quantity: 100, is_active: true, is_in_season: true },
    { id: 'sku-stag-kit-familiar', name: 'Combo Surtido Familiar Staging', category: 'KITS Y COMBOS', subcategory: 'Kits', unit: 'unidad', base_cost: 28000, price_retail: 45000, price_micro: 40000, price_restaurant: 36000, stock_quantity: 50, is_active: true, is_in_season: true }
  ];

  const { error: catError } = await supabase
    .from('products')
    .upsert(syntheticCatalog, { onConflict: 'id' });
  if (catError) throw new Error(`Failed to seed products: ${catError.message}`);
  console.log(`  ✔ Synthetic catalog seeded (${syntheticCatalog.length} SKUs)`);

  // 3. Synthetic B2B Applications
  const syntheticB2B = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      clerk_user_id: 'user_staging_micro',
      applicant_name: 'Carlos Andrés Micromercado',
      applicant_email: 'test-micro@staging.lagaviotafruver.com',
      business_name: 'Minimarket Don Carlos Staging',
      business_type: 'Micromercados',
      nit: '901234567-1',
      phone: '3101112233',
      address: 'Carrera 27 #34-12, San Alonso',
      municipality: 'Bucaramanga',
      monthly_volume: 'COP 4,000,000 / mes',
      notes: 'Synthetic Micromercado fixture',
      status: 'approved'
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      clerk_user_id: 'user_staging_restaurante',
      applicant_name: 'Laura Gómez Restaurante',
      applicant_email: 'test-restaurante@staging.lagaviotafruver.com',
      business_name: 'Trattoria La Nonna Staging',
      business_type: 'Restaurantes',
      nit: '901987654-2',
      phone: '3152223344',
      address: 'Calle 48 #33-21, Cabecera',
      municipality: 'Bucaramanga',
      monthly_volume: 'COP 10,000,000 / mes',
      notes: 'Synthetic Restaurante fixture',
      status: 'approved'
    }
  ];

  const { error: b2bError } = await supabase
    .from('business_applications')
    .upsert(syntheticB2B, { onConflict: 'id' });
  if (b2bError) throw new Error(`Failed to seed business_applications: ${b2bError.message}`);
  console.log(`  ✔ Synthetic B2B applications seeded (${syntheticB2B.length} applications)`);

  console.log('✅ Staging Supabase seeding completed successfully with zero production data.');
}

seedStaging().catch(err => {
  console.error('[Staging Seeder ERROR]:', err);
  process.exit(1);
});
