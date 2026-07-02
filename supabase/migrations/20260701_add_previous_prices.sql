-- Add previous price tracking columns to products table
ALTER TABLE products 
ADD COLUMN previous_price_retail numeric(10,2),
ADD COLUMN previous_price_micro numeric(10,2),
ADD COLUMN previous_price_restaurant numeric(10,2);
