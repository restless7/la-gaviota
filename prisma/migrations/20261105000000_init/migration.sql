-- Extensions required for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "abandoned_carts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clerk_user_id" TEXT,
    "customer_phone" TEXT,
    "customer_email" TEXT,
    "cart_data" JSONB NOT NULL,
    "total_amount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'abandoned',
    "last_active_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abandoned_carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agricultural_shrinkage_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" TEXT NOT NULL,
    "quantity_kg" DECIMAL(10,2) NOT NULL,
    "log_type" TEXT NOT NULL,
    "loss_reason" TEXT,
    "logged_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agricultural_shrinkage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "timestamp" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "details" TEXT,
    "metadata" JSONB,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_credit_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "credit_limit" DECIMAL DEFAULT 0,
    "credit_balance" DECIMAL DEFAULT 0,
    "credit_days_remaining" INTEGER DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "b2b_credit_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clerk_user_id" TEXT NOT NULL,
    "applicant_name" TEXT NOT NULL,
    "applicant_email" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "business_type" TEXT NOT NULL,
    "nit" TEXT DEFAULT '',
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "monthly_volume" TEXT DEFAULT '',
    "notes" TEXT DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buying_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "product_list" JSONB NOT NULL DEFAULT '[]',
    "last_used_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buying_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "clerk_user_id" TEXT NOT NULL,
    "full_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "tier" TEXT DEFAULT 'Personas Naturales',
    "total_orders" INTEGER DEFAULT 0,
    "total_spent" INTEGER DEFAULT 0,
    "last_order_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "business_name" TEXT,
    "nit" TEXT,
    "credit_limit" INTEGER DEFAULT 0,
    "current_balance" INTEGER DEFAULT 0,
    "payment_terms" TEXT DEFAULT 'Contado',
    "assigned_rep" TEXT,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("clerk_user_id")
);

-- CreateTable
CREATE TABLE "daily_operational_ledgers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operational_date" DATE NOT NULL,
    "total_orders_processed" INTEGER NOT NULL DEFAULT 0,
    "total_revenue_collected" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "closed_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "closed_by_user" TEXT NOT NULL,

    CONSTRAINT "daily_operational_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "track_inventory" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kit_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kit_id" UUID,
    "product_id" TEXT,
    "quantity" DECIMAL NOT NULL DEFAULT 1,

    CONSTRAINT "kit_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fixed_price" DECIMAL NOT NULL,
    "banner_url" TEXT,
    "status" TEXT DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name" TEXT NOT NULL,
    "business_name" TEXT,
    "business_type" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "source" TEXT DEFAULT 'Landing Page',
    "status" TEXT NOT NULL DEFAULT 'Nuevo',
    "notes" TEXT DEFAULT '',
    "assigned_to" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price_at_purchase" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clerk_user_id" TEXT,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "delivery_address" TEXT NOT NULL,
    "delivery_municipality" TEXT NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pendiente',
    "payment_method" TEXT NOT NULL,
    "notes" TEXT DEFAULT '',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "scheduled_delivery_date" DATE DEFAULT CURRENT_DATE,
    "is_conflicted" BOOLEAN DEFAULT false,
    "conflict_reason" TEXT,
    "purchase_tier" TEXT DEFAULT 'RETAIL',

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "base_cost" INTEGER NOT NULL DEFAULT 0,
    "price_retail" INTEGER NOT NULL DEFAULT 0,
    "price_micro" INTEGER NOT NULL DEFAULT 0,
    "price_restaurant" INTEGER NOT NULL DEFAULT 0,
    "previous_price_retail" INTEGER,
    "previous_price_micro" INTEGER,
    "previous_price_restaurant" INTEGER,
    "stock_quantity" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_in_season" BOOLEAN NOT NULL DEFAULT true,
    "image_url" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "subcategory" TEXT,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "contact_name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "farm_location" TEXT,
    "supplied_categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'Activo',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "business_name" TEXT DEFAULT 'Surtifruver La Gaviota',
    "nit" TEXT DEFAULT '900.123.456-7',
    "address" TEXT DEFAULT 'Centro de Abastos - Bucaramanga',
    "phone" TEXT DEFAULT '+57 315 XXX XXXX',
    "hours" TEXT DEFAULT 'Lunes a Sábado: 3:00 AM - 6:00 PM | Domingos: 4:00 AM - 2:00 PM',
    "delivery_zones" JSONB DEFAULT '[{"name": "Bucaramanga Centro", "enabled": true, "minOrder": 25000}, {"name": "Floridablanca", "enabled": true, "minOrder": 35000}, {"name": "Girón", "enabled": true, "minOrder": 40000}, {"name": "Piedecuesta", "enabled": true, "minOrder": 45000}, {"name": "Lebrija", "enabled": false, "minOrder": 80000}, {"name": "San Gil", "enabled": false, "minOrder": 100000}, {"name": "Socorro", "enabled": false, "minOrder": 120000}, {"name": "Cúcuta", "enabled": false, "minOrder": 200000}]',
    "notifications" JSONB DEFAULT '{"dailyReport": true, "emailLowStock": true, "emailNewOrder": true, "whatsappDelivery": true, "whatsappNewOrder": false}',
    "retail_margin" DECIMAL DEFAULT 25,
    "micro_margin" DECIMAL DEFAULT 15,
    "wholesale_margin" DECIMAL DEFAULT 5,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "b2b_credit_profiles_user_id_key" ON "b2b_credit_profiles"("user_id");

-- CreateIndex
CREATE INDEX "idx_b2b_credit_profiles_user_id" ON "b2b_credit_profiles"("user_id");

-- CreateIndex
CREATE INDEX "idx_applications_clerk_user" ON "business_applications"("clerk_user_id");

-- CreateIndex
CREATE INDEX "idx_applications_created" ON "business_applications"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_applications_status" ON "business_applications"("status");

-- CreateIndex
CREATE INDEX "idx_buying_templates_user_id" ON "buying_templates"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_operational_ledgers_operational_date_key" ON "daily_operational_ledgers"("operational_date");

-- CreateIndex
CREATE UNIQUE INDEX "kit_items_kit_id_product_id_key" ON "kit_items"("kit_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "kits_slug_key" ON "kits"("slug");

-- CreateIndex
CREATE INDEX "idx_orders_customer" ON "orders"("clerk_user_id");

-- CreateIndex
CREATE INDEX "idx_orders_status" ON "orders"("status");

-- CreateIndex
CREATE INDEX "idx_products_category" ON "products"("category");

-- AddForeignKey
ALTER TABLE "agricultural_shrinkage_logs" ADD CONSTRAINT "agricultural_shrinkage_logs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "kit_items" ADD CONSTRAINT "kit_items_kit_id_fkey" FOREIGN KEY ("kit_id") REFERENCES "kits"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "kit_items" ADD CONSTRAINT "kit_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

