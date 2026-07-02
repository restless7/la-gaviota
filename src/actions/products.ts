'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { logAdminAction } from '@/src/lib/audit';

import { CATEGORIES } from '@/src/constants/productConstants';

// We initialize the Supabase client here for server actions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  unit: string;
  baseCost: number;
  priceRetail: number;
  priceMicro: number;
  priceRestaurant: number;
  previousPriceRetail: number | null;
  previousPriceMicro: number | null;
  previousPriceRestaurant: number | null;
  stockQuantity: number;
  isActive: boolean;
  isInSeason: boolean;
  imageUrl: string | null;
  description: string | null;
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }

  // Fetch active kits to integrate them into the catalog
  const { data: kitsData, error: kitsError } = await supabase
    .from('kits')
    .select('*')
    .eq('status', 'active');

  if (kitsError) {
    console.error('Error fetching kits:', kitsError);
  }

  // Map products
  const mappedProducts = (data || []).map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    subcategory: p.subcategory || null,
    unit: p.unit,
    baseCost: p.base_cost,
    priceRetail: p.price_retail,
    priceMicro: p.price_micro,
    priceRestaurant: p.price_restaurant,
    previousPriceRetail: p.previous_price_retail,
    previousPriceMicro: p.previous_price_micro,
    previousPriceRestaurant: p.previous_price_restaurant,
    stockQuantity: p.stock_quantity,
    isActive: p.is_active,
    isInSeason: p.is_in_season,
    imageUrl: p.image_url,
    description: p.description
  }));

  // Map kits as products
  const mappedKits = (kitsData || []).map(k => ({
    id: k.id,
    name: k.name,
    category: 'Kits Negocios',
    subcategory: null,
    unit: 'Combo',
    baseCost: Number(k.fixed_price),
    priceRetail: Number(k.fixed_price),
    priceMicro: Number(k.fixed_price),
    priceRestaurant: Number(k.fixed_price),
    previousPriceRetail: Number(k.fixed_price),
    previousPriceMicro: Number(k.fixed_price),
    previousPriceRestaurant: Number(k.fixed_price),
    stockQuantity: 999, // Kits are virtually unlimited based on underlying stock
    isActive: true,
    isInSeason: true,
    imageUrl: k.banner_url || null,
    description: `Combo mayorista: ${k.name}`
  }));

  // Combine and sort
  return [...mappedProducts, ...mappedKits].sort((a, b) => a.name.localeCompare(b.name));
}


export async function updateProductStock(id: string, newStock: number) {
  const { error } = await supabase
    .from('products')
    .update({ stock_quantity: newStock })
    .eq('id', id);

  if (error) {
    console.error('Error updating stock:', error);
    throw new Error('Failed to update stock');
  }
  
  revalidatePath('/admin/catalog/product-management');
  revalidatePath('/shop');
  revalidatePath('/');
  return { success: true };
}

export async function updateProductSeasonStatus(id: string, inSeason: boolean) {
  const { error } = await supabase
    .from('products')
    .update({ is_in_season: inSeason })
    .eq('id', id);

  if (error) {
    console.error('Error updating season status:', error);
    throw new Error('Failed to update season status');
  }

  revalidatePath('/admin/catalog/product-management');
  revalidatePath('/shop');
  return { success: true };
}

export async function updateProductPricing(
  id: string, 
  base_cost?: number, 
  price_retail?: number, 
  price_micro?: number, 
  price_restaurant?: number
) {
  // Enforce auth
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const updates: any = {};
  if (base_cost !== undefined && base_cost !== 0) updates.base_cost = base_cost;
  if (price_retail !== undefined && price_retail !== 0) updates.price_retail = price_retail;
  if (price_micro !== undefined && price_micro !== 0) updates.price_micro = price_micro;
  if (price_restaurant !== undefined && price_restaurant !== 0) updates.price_restaurant = price_restaurant;

  if (Object.keys(updates).length === 0) return { success: true };

  const { error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating product pricing:', error);
    throw new Error('Failed to update product pricing');
  }

  // Log the event if it's a cost change
  if (updates.base_cost) {
    await logAdminAction(
      'PRICING',
      'Actualizó costo base',
      `Nuevo costo: $${updates.base_cost} COP.`,
      id
    );
  }

  revalidatePath('/admin/pricing');
  revalidatePath('/shop');
  revalidatePath('/');
  return { success: true };
}

export async function updateProductPrices(productId: string, prices: { retail: number, micro: number, restaurant: number }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // In a real app, verify publicMetadata.role === 'admin' here. 
  // For La Gaviota MVP, having access to this Server Action implies Admin Dashboard access.
  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const { error } = await supabase
    .from('products')
    .update({
      price_retail: prices.retail,
      price_micro: prices.micro,
      price_restaurant: prices.restaurant
    })
    .eq('id', productId);

  if (error) {
    console.error('Error updating three-tier pricing:', error);
    throw new Error('Failed to update three-tier pricing');
  }

  await logAdminAction(
      'PRICING',
      'Actualización de estructura de precios de 3 niveles',
      `Retail: ${prices.retail}, Micro: ${prices.micro}, Rest: ${prices.restaurant}`,
      productId
  );

  revalidatePath('/admin/pricing');
  revalidatePath('/shop');
  revalidatePath('/');
  return { success: true };
}

export async function applyMacroMargins(
  retailMargin: number, 
  microMargin: number, 
  restaurantMargin: number
) {
  // To avoid hitting edge limits, we fetch all, calculate, and do a batch upsert
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('*');
    
  if (fetchError || !products) throw new Error('Failed to fetch products for macro update');

  const updatedProducts = products.map((p) => ({
    ...p,
    price_retail: Math.round(p.base_cost * (1 + retailMargin / 100)),
    price_micro: Math.round(p.base_cost * (1 + microMargin / 100)),
    price_restaurant: Math.round(p.base_cost * (1 + restaurantMargin / 100)),
  }));

  const { error: updateError } = await supabase
    .from('products')
    .upsert(updatedProducts, { onConflict: 'id' });

  if (updateError) {
    console.error('Error applying macro margins:', updateError);
    throw new Error('Failed to apply macro margins');
  }

  // 3. Log the event
  await logAdminAction(
    'PRICING',
    'Aplicó multiplicadores masivos',
    `Márgenes: Detal +${retailMargin}%, Micro +${microMargin}%, Rest. +${restaurantMargin}% — ${updatedProducts.length} productos actualizados.`,
    'MACRO_UPDATE'
  );

  revalidatePath('/admin/pricing');
  revalidatePath('/shop');
  revalidatePath('/');
  return { success: true, count: updatedProducts.length };
}

export async function createProduct(product: Omit<Product, 'id' | 'previousPriceRetail' | 'previousPriceMicro' | 'previousPriceRestaurant'>) {
  // Generate a simple ID like prd_XXXX
  const { data: countData } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });
  
  const count = (countData as any)?.length || 0;
  const newId = `prd_${String(count + 1).padStart(4, '0')}`;

  const { error } = await supabase
    .from('products')
    .insert({
      id: newId,
      name: product.name,
      category: product.category,
      subcategory: product.subcategory,
      unit: product.unit,
      base_cost: product.baseCost,
      price_retail: product.priceRetail,
      price_micro: product.priceMicro,
      price_restaurant: product.priceRestaurant,
      stock_quantity: product.stockQuantity,
      is_active: product.isActive,
      is_in_season: product.isInSeason,
      image_url: product.imageUrl,
      description: product.description
    });

  if (error) {
    console.error('Error creating product:', error);
    throw new Error('Failed to create product');
  }

  // Log the audit event
  await logAdminAction(
    'SUPPLIER',
    'Creación de Nuevo Producto',
    `Nombre: ${product.name} | Costo Base: $${product.baseCost}`,
    newId
  );

  revalidatePath('/admin/catalog/product-management');
  revalidatePath('/shop');
  revalidatePath('/');
  return { success: true, id: newId };
}

export async function updateProduct(id: string, product: Omit<Product, 'id' | 'previousPriceRetail' | 'previousPriceMicro' | 'previousPriceRestaurant'>) {
  // Fetch existing product to audit changes
  const { data: oldProduct } = await supabase
    .from('products')
    .select('image_url, description')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('products')
    .update({
      name: product.name,
      category: product.category,
      subcategory: product.subcategory,
      unit: product.unit,
      base_cost: product.baseCost,
      price_retail: product.priceRetail,
      price_micro: product.priceMicro,
      price_restaurant: product.priceRestaurant,
      stock_quantity: product.stockQuantity,
      is_active: product.isActive,
      is_in_season: product.isInSeason,
      image_url: product.imageUrl,
      description: product.description
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating product:', error);
    throw new Error('Failed to update product');
  }

  // Audit specific field changes
  let auditAction = 'Actualización de Producto';
  let auditDetails = `Producto ID: ${id} actualizado.`;

  if (oldProduct) {
    const changedFields = [];
    if (oldProduct.image_url !== product.imageUrl) changedFields.push('Imagen');
    if (oldProduct.description !== product.description) changedFields.push('Descripción');
    
    if (changedFields.length > 0) {
      auditAction = `Actualización de Producto (${changedFields.join(', ')})`;
      auditDetails = `Se actualizó: ${changedFields.join(', ')} para el producto ${product.name || id}.`;
    }
  }

  await logAdminAction(
    'SUPPLIER',
    auditAction,
    auditDetails,
    id
  );

  revalidatePath('/admin/catalog/product-management');
  revalidatePath('/shop');
  revalidatePath('/');
  return { success: true };
}

export async function deleteProduct(id: string) {
  // First get the product to delete its image if it exists
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('image_url')
    .eq('id', id)
    .single();

  if (!fetchError && product?.image_url) {
    try {
      // The image_url is usually a public URL, we need to extract the path
      // Example: https://<project>.supabase.co/storage/v1/object/public/product-images/product-123.jpg
      const urlParts = product.image_url.split('/product-images/');
      if (urlParts.length > 1) {
        const path = urlParts[1];
        await supabase.storage.from('product-images').remove([path]);
      }
    } catch (e) {
      console.error('Error deleting image:', e);
    }
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    throw new Error('Failed to delete product');
  }

  await logAdminAction(
    'SUPPLIER',
    'Eliminación de Producto',
    `Producto ID: ${id} eliminado del sistema.`,
    id
  );

  revalidatePath('/admin/catalog/product-management');
  revalidatePath('/shop');
  revalidatePath('/');
  return { success: true };
}
