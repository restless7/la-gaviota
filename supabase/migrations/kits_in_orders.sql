-- Migration: Drop order_items FK constraint for Kit support
-- Since we now inject dynamic Kits (which live in the 'kits' table) into the checkout flow as Products,
-- order_items needs to accept both product_ids and kit_ids (UUIDs).

ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- We don't recreate the FK because product_id can now point to EITHER products(id) OR kits(id).
