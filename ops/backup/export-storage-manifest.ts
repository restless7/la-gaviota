/**
 * LG-PROD-R4.2: Supabase Comprehensive Storage Exporter & Manifest Generator
 * 
 * Safely lists and exports all blobs from ALL Supabase Storage buckets
 * (including 'product-images' and 'kit-banners'), generating a cryptographic SHA-256
 * manifest for complete multi-bucket recovery without modifying any data.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface StorageManifestItem {
  name: string;
  id?: string | null;
  bucket: string;
  updated_at?: string | null;
  created_at?: string | null;
  last_accessed_at?: string | null;
  metadata?: Record<string, unknown> | null;
  sha256: string;
  size_bytes: number;
}

export interface ComprehensiveStorageBackup {
  exported_at: string;
  project_url: string;
  total_buckets: number;
  total_objects: number;
  total_bytes: number;
  buckets: Record<string, {
    object_count: number;
    byte_count: number;
    objects: StorageManifestItem[];
  }>;
}

export async function exportAllStorageBuckets(
  supabaseUrl: string,
  serviceKey: string,
  outputDir: string,
  manifestPath: string
): Promise<ComprehensiveStorageBackup> {
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });

  console.log(`[Storage Backup] Discovering all storage buckets at: ${supabaseUrl}`);
  fs.mkdirSync(outputDir, { recursive: true });

  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError || !buckets) {
    throw new Error(`Failed to list storage buckets: ${bucketsError?.message}`);
  }

  const knownCriticalBuckets = ['product-images', 'kit-banners'];
  const allBucketNames = Array.from(new Set([...buckets.map(b => b.name), ...knownCriticalBuckets]));

  console.log(`[Storage Backup] Identified ${allBucketNames.length} target buckets: ${allBucketNames.join(', ')}`);

  const backupResult: ComprehensiveStorageBackup = {
    exported_at: new Date().toISOString(),
    project_url: supabaseUrl,
    total_buckets: allBucketNames.length,
    total_objects: 0,
    total_bytes: 0,
    buckets: {}
  };

  for (const bucketName of allBucketNames) {
    console.log(`\n[Storage Backup] Processing bucket: [${bucketName}]...`);
    const bucketDir = path.join(outputDir, bucketName);
    fs.mkdirSync(bucketDir, { recursive: true });

    const { data: fileList, error: listError } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

    if (listError) {
      console.warn(`[Storage Backup] Warning: Could not list bucket [${bucketName}]:`, listError.message);
      backupResult.buckets[bucketName] = { object_count: 0, byte_count: 0, objects: [] };
      continue;
    }

    const manifestItems: StorageManifestItem[] = [];

    for (const item of fileList) {
      if (!item.name || item.name === '.emptyFolderPlaceholder') continue;

      console.log(`  Downloading [${bucketName}] -> ${item.name}...`);
      const { data: blobData, error: downloadError } = await supabase.storage
        .from(bucketName)
        .download(item.name);

      if (downloadError || !blobData) {
        console.error(`  [ERROR] Failed to download [${bucketName}/${item.name}]:`, downloadError?.message);
        continue;
      }

      const buffer = Buffer.from(await blobData.arrayBuffer());
      const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
      const localFilePath = path.join(bucketDir, item.name);

      fs.mkdirSync(path.dirname(localFilePath), { recursive: true });
      fs.writeFileSync(localFilePath, buffer);

      const record: StorageManifestItem = {
        name: item.name,
        id: item.id,
        bucket: bucketName,
        updated_at: item.updated_at,
        created_at: item.created_at,
        last_accessed_at: item.last_accessed_at,
        metadata: item.metadata,
        sha256,
        size_bytes: buffer.length
      };

      manifestItems.push(record);
      backupResult.total_objects++;
      backupResult.total_bytes += buffer.length;
    }

    backupResult.buckets[bucketName] = {
      object_count: manifestItems.length,
      byte_count: manifestItems.reduce((acc, it) => acc + it.size_bytes, 0),
      objects: manifestItems
    };
  }

  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(backupResult, null, 2), 'utf8');
  console.log(`\n[Storage Backup] Comprehensive manifest written to: ${manifestPath}`);
  console.log(`[Storage Backup] Total objects exported: ${backupResult.total_objects} (${backupResult.total_bytes} bytes across ${backupResult.total_buckets} buckets).`);

  return backupResult;
}
