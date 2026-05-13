import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load the environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Since this is a script, we need the Service Role Key to bypass RLS reliably if needed,
// but the ANON key will work because we enabled public inserts in the policies.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Instead of importing directly which might fail with TS paths in a plain node script,
// we will mock the import or use a simple parser if needed, but ts-node can handle it.
// To keep it clean, we'll import products dynamically.
import { products } from '../src/data/products';

async function seedProducts() {
  console.log(`Starting to seed ${products.length} products to Supabase...`);
  
  // Transform data to match the Supabase schema
  const productsToInsert = products.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    unit: p.unit,
    base_cost: Math.round(p.priceRetail * 0.65), // Estimate base cost
    price_retail: p.priceRetail,
    price_micro: p.priceMicro,
    price_restaurant: p.priceRestaurant,
    stock_quantity: Math.floor(Math.random() * 400) + 50, // Initial random stock between 50-450
    is_active: true,
    is_in_season: true,
  }));

  // Upsert in batches to avoid payload limits
  const BATCH_SIZE = 50;
  for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
    const batch = productsToInsert.slice(i, i + BATCH_SIZE);
    console.log(`Inserting batch ${i / BATCH_SIZE + 1} (${batch.length} products)...`);
    
    const { error } = await supabase
      .from('products')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, error.message);
    }
  }

  console.log('✅ Seeding complete!');
}

seedProducts().catch(console.error);
