-- Migration: Create Product Images Bucket

INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Allow public read access to product-images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Allow admin insert to product-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Allow admin update to product-images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');
