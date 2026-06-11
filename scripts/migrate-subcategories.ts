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

async function migrateSubcategories() {
  console.log("Starting subcategory migration...");

  const { data: products, error } = await supabase.from('products').select('*');
  
  if (error || !products) {
    console.error("Failed to fetch products", error);
    return;
  }

  const updates = [];

  for (const p of products) {
    const name = p.name.toLowerCase();
    let sub = p.subcategory;

    if (p.category === 'CARNES X 500 GRAMOS') {
      if (name.includes('cerdo') || name.includes('panceta') || name.includes('papada') || name.includes('espinazo')) {
        sub = 'CARNE DE CERDO';
      } else if (name.includes('pollo') || name.includes('pechuga') || name.includes('gallina') || name.includes('muslo')) {
        sub = 'POLLO';
      } else if (name.includes('pescado') || name.includes('trucha') || name.includes('bagre') || name.includes('mojarra') || name.includes('tilapia') || name.includes('salmon')) {
        sub = 'PESCADO';
      } else if (name.includes('res') || name.includes('lomo') || name.includes('costilla') || name.includes('murillo') || name.includes('paletero') || name.includes('sobrebarriga') || name.includes('entrecote') || name.includes('punta de anca') || name.includes('cadera') || name.includes('chatas') || name.includes('bife')) {
        sub = 'CARNE DE RES';
      } else if (name.includes('higado') || name.includes('callo') || name.includes('pajarilla') || name.includes('hueso') || name.includes('bofe') || name.includes('menudencia') || name.includes('corazon')) {
        sub = 'VÍSCERAS';
      } else {
         // Default if it doesn't match above, assume RES for red meats if vague or leave as is
         if (name.includes('carne molida')) sub = 'CARNE DE RES';
      }
    } else if (p.category === 'FRUTAS') {
      if (name.includes('limon') || name.includes('naranja') || name.includes('mandarina') || name.includes('toronja') || name.includes('tangelo')) sub = 'CÍTRICOS';
      else if (name.includes('manzana') || name.includes('pera') || name.includes('uva') || name.includes('durazno') || name.includes('kiwi') || name.includes('fresa') || name.includes('cereza') || name.includes('mora') || name.includes('arandano')) sub = 'FRUTAS DULCES';
      else sub = 'FRUTAS TROPICALES Y NEUTRAS';
    } else if (p.category === 'VERDURAS Y HORTALIZAS') {
      if (name.includes('papa') || name.includes('yuca') || name.includes('platano') || name.includes('arracacha') || name.includes('ñame') || name.includes('batata') || name.includes('zanahoria') || name.includes('remolacha') || name.includes('cebolla') || name.includes('ajo')) sub = 'TUBÉRCULOS Y RAÍCES';
      else if (name.includes('lechuga') || name.includes('espinaca') || name.includes('acelga') || name.includes('apio') || name.includes('cilantro') || name.includes('perejil') || name.includes('repollo')) sub = 'HOJAS VERDES';
      else sub = 'HORTALIZAS Y OTROS';
    } else if (p.category === 'PULPAS') {
      sub = 'PULPAS NATURALES';
    }

    if (sub !== p.subcategory) {
      updates.push(supabase.from('products').update({ subcategory: sub }).eq('id', p.id));
      console.log(`Will update: ${p.name} -> ${sub}`);
    }
  }

  console.log(`Processing ${updates.length} updates...`);
  
  if (updates.length > 0) {
    const results = await Promise.all(updates);
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error(`Finished with ${errors.length} errors`, errors);
    } else {
      console.log("All subcategories updated successfully!");
    }
  } else {
    console.log("No subcategories needed updating.");
  }
}

migrateSubcategories();
