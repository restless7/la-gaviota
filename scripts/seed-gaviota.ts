import { ConvexHttpClient } from "convex/browser";
// We use a relative path to the generated API
// Depending on where this is run, the path might need adjustment
// But since it's a script, we can use absolute paths for safety if needed
import { products } from "../src/data/products";
import path from "path";
import fs from "fs";

// Manually parse .env.local because we don't want to rely on extra dependencies if not needed
const envPath = path.resolve(__dirname, "../../apex-backend/.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const convexUrl = envContent.match(/CONVEX_URL=(.*)/)?.[1]?.trim() || envContent.match(/NEXT_PUBLIC_CONVEX_URL=(.*)/)?.[1]?.trim();

if (!convexUrl) {
  console.error("❌ CONVEX_URL not found in apex-backend/.env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);

async function main() {
  console.log("🚀 Starting Gaviota Seeding...");
  
  // 1. Seed Pricing Configs
  console.log("⚙️  Seeding Pricing Configs...");
  // We use string names for mutations to avoid dependency on generated files in a standalone script
  // @ts-ignore
  await client.mutation("gaviota:updatePricingConfig", { key: "retail_margin", value: 0.25 });
  // @ts-ignore
  await client.mutation("gaviota:updatePricingConfig", { key: "micro_margin", value: 0.15 });
  // @ts-ignore
  await client.mutation("gaviota:updatePricingConfig", { key: "restaurant_margin", value: 0.10 });

  // 2. Seed Products in batches
  const batchSize = 50;
  console.log(`📦 Seeding ${products.length} products in batches of ${batchSize}...`);

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize).map(p => ({
      productId: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category,
      subcategory: p.subcategory || "",
      unit: p.unit,
      image: p.imagePlaceholder,
      description: p.description,
      cost: Math.round(p.priceRetail * 0.75), // Initial cost basis
      priceRetail: p.priceRetail,
      priceMicro: p.priceMicro,
      priceRestaurant: p.priceRestaurant,
    }));

    try {
        await client.mutation("gaviota:seedProducts", { products: batch });
        console.log(`  ✅ Processed ${Math.min(i + batchSize, products.length)}/${products.length}`);
    } catch (e) {
        console.error(`  ❌ Error in batch ${i}:`, e.message);
    }
  }

  console.log("🎉 Seeding complete!");
}

main().catch(console.error);
