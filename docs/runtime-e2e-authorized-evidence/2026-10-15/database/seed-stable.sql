-- SYNTHETIC TEST DATABASE ONLY. Never production migrations or data.
CREATE ROLE authenticator LOGIN NOINHERIT;
GRANT anon,authenticated,service_role TO authenticator;
-- Stable data replaces only previously generated synthetic baseline rows.
TRUNCATE public.abandoned_carts,public.agricultural_shrinkage_logs,public.audit_logs,
 public.b2b_credit_profiles,public.business_applications,public.buying_templates,public.customers,
 public.daily_operational_ledgers,public.global_settings,public.kit_items,public.kits,
 public.marketing_leads,public.order_items,public.orders,public.products,public.suppliers,
 public.system_settings,storage.objects;
DO $$ DECLARE r record; BEGIN
 FOR r IN SELECT table_schema,table_name FROM information_schema.columns WHERE table_schema='public' AND column_name='id' AND udt_name='uuid' LOOP
  EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN id SET DEFAULT gen_random_uuid()',r.table_schema,r.table_name);
 END LOOP;
 FOR r IN SELECT table_schema,table_name,column_name FROM information_schema.columns WHERE table_schema='public' AND column_name IN ('created_at','updated_at','timestamp') AND data_type='timestamp with time zone' LOOP
  EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I SET DEFAULT now()',r.table_schema,r.table_name,r.column_name);
 END LOOP;
END $$;
ALTER TABLE public.products ADD CONSTRAINT test_nonnegative_stock CHECK(stock_quantity>=0);
ALTER TABLE public.products ADD CONSTRAINT test_nonnegative_prices CHECK(base_cost>=0 AND price_retail>=0 AND price_micro>=0 AND price_restaurant>=0);
ALTER TABLE public.order_items ADD CONSTRAINT test_positive_quantity CHECK(quantity>0);
ALTER TABLE public.order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY(order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY(product_id) REFERENCES public.products(id);
ALTER TABLE public.kit_items ADD CONSTRAINT kit_items_kit_id_fkey FOREIGN KEY(kit_id) REFERENCES public.kits(id) ON DELETE CASCADE;
ALTER TABLE public.kit_items ADD CONSTRAINT kit_items_product_id_fkey FOREIGN KEY(product_id) REFERENCES public.products(id);
ALTER TABLE public.b2b_credit_profiles ADD CONSTRAINT test_b2b_user_unique UNIQUE(user_id);
INSERT INTO public.products(id,name,category,unit,base_cost,price_retail,price_micro,price_restaurant,previous_price_retail,previous_price_micro,previous_price_restaurant,stock_quantity,is_active,is_in_season,image_url,description) VALUES
 ('SKU_TEST_A','Producto de prueba A','FRUTAS','kg',7000,20000,15000,10000,22000,16000,11000,100,true,true,'/IMAGES/product-display.jpeg','SYNTHETIC TEST ONLY'),
 ('SKU_TEST_LAST','Última unidad de prueba','VERDURAS Y HORTALIZAS','unidad',3000,8000,7000,6000,9000,8000,7000,1,true,true,'/IMAGES/verduras-banner1.jpeg','SYNTHETIC TEST ONLY'),
 ('SKU_TEST_HIDDEN','Producto inactivo de prueba','FRUTAS','kg',7000,20000,15000,10000,22000,16000,11000,100,false,true,NULL,'SYNTHETIC TEST ONLY');
INSERT INTO public.kits(id,name,slug,fixed_price,banner_url,status) VALUES
 ('a0000000-0000-4000-8000-000000000001','Kit de prueba','kit-test',80000,'/IMAGES/product-display.jpeg','active');
INSERT INTO public.kit_items(kit_id,product_id,quantity) VALUES('a0000000-0000-4000-8000-000000000001','SKU_TEST_A',4);
INSERT INTO public.global_settings(id,track_inventory) VALUES('default',true);
INSERT INTO public.system_settings(id,business_name,nit,address,phone,hours,delivery_zones,notifications,retail_margin,micro_margin,wholesale_margin) VALUES('default','SYNTHETIC TEST STORE','TEST ONLY','TEST ONLY','TEST ONLY','TEST ONLY','[]','{}',30,20,10);
INSERT INTO public.customers(clerk_user_id,full_name,email,tier,total_orders,total_spent,credit_limit,current_balance,payment_terms) VALUES
 ('user_TEST_RETAIL_A','Retail A','retaila@test.invalid','Personas Naturales',0,0,0,0,'Contado'),
 ('user_TEST_RETAIL_B','Retail B','retailb@test.invalid','Personas Naturales',0,0,0,0,'Contado'),
 ('user_TEST_MICRO','Micro','micro@test.invalid','Micromercados',0,0,500000,0,'Contado'),
 ('user_TEST_RESTAURANT','Restaurante','restaurant@test.invalid','Restaurantes',0,0,1000000,0,'Contado'),
 ('user_TEST_ADMIN','Admin','admin@test.invalid','Personas Naturales',0,0,0,0,'Contado'),
 ('user_TEST_SUPERADMIN','SuperAdmin','super@test.invalid','Personas Naturales',0,0,0,0,'Contado');
INSERT INTO public.b2b_credit_profiles(user_id,tier,credit_limit,credit_balance,credit_days_remaining) VALUES('user_TEST_MICRO','Micromercados',500000,0,30),('user_TEST_RESTAURANT','Restaurantes',1000000,0,30);
INSERT INTO public.orders(id,clerk_user_id,customer_name,customer_email,customer_phone,delivery_address,delivery_municipality,total_amount,status,payment_method,purchase_tier) VALUES
 ('b0000000-0000-4000-8000-000000000001','user_TEST_RETAIL_A','Retail A','retaila@test.invalid','TEST','TEST','Bucaramanga',25000,'Pago Pendiente','wompi','Personas Naturales'),
 ('b0000000-0000-4000-8000-000000000002','user_TEST_RETAIL_B','Retail B','retailb@test.invalid','TEST','TEST','Bucaramanga',25000,'Pago Pendiente','wompi','Personas Naturales');
INSERT INTO public.order_items(order_id,product_id,product_name,quantity,price_at_purchase) VALUES
 ('b0000000-0000-4000-8000-000000000001','SKU_TEST_A','Producto de prueba A',1,20000),
 ('b0000000-0000-4000-8000-000000000002','SKU_TEST_A','Producto de prueba A',1,20000);
