import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateCategories() {
  console.log("Starting category migration...");

  const updates = [
    { old: 'Frutas', new: 'FRUTAS' },
    { old: 'Verduras Y Hortalizas', new: 'VERDURAS Y HORTALIZAS' },
    { old: 'Verduras', new: 'VERDURAS Y HORTALIZAS' },
    { old: 'Pulpas', new: 'PULPAS' },
    { old: 'Varios Preparados', new: 'VARIOS' },
    { old: 'Carnes', new: 'CARNES X 500 GRAMOS' },
    { old: 'Condimentos Frutos Secos Aromaticas', new: 'CONDIMENTOS X 125 GR' },
    { old: 'Kits Negocios', new: 'KITS NEGOCIOS' }
  ];

  for (const { old, new: newCat } of updates) {
    const { error, count } = await supabase
      .from('products')
      .update({ category: newCat })
      .eq('category', old);

    if (error) {
      console.error(`Error updating ${old} -> ${newCat}:`, error);
    } else {
      console.log(`Updated ${old} -> ${newCat}`);
    }
  }

  console.log("Migration complete.");
}

migrateCategories();
