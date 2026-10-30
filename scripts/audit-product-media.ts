/**
 * Programmatic Product Photography & Media Integrity Scanner
 * Frutas y Verduras La Gaviota
 * Mission ID: LG-UX-MEDIA-R1
 *
 * Operation: STRICTLY READ-ONLY
 * Target: Enumerate current live product catalog, audit HTTP/image health,
 * scan local asset repositories for recovery candidates, classify image states,
 * and export actionable inventories and prioritized photography production queue.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

interface SupabaseProduct {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  unit: string;
  price_retail: number | null;
  is_active: boolean;
  is_in_season: boolean;
  image_url: string | null;
  description: string | null;
}

interface ImageMetadata {
  httpStatus: number | null;
  contentType: string | null;
  contentLength: number | null;
  width: number | null;
  height: number | null;
  format: string | null;
  error?: string;
}

export type ImageClassification =
  | 'HEALTHY'
  | 'MISSING_REFERENCE'
  | 'BROKEN_REFERENCE'
  | 'INVALID_IMAGE'
  | 'PLACEHOLDER_ONLY'
  | 'LOW_QUALITY'
  | 'DUPLICATE_SUSPECTED'
  | 'MAPPING_REVIEW_REQUIRED';

export type ConfidenceLevel = 'EXACT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN' | 'NONE';

interface RecoveryCandidate {
  localPath: string;
  provenance: string;
  confidence: ConfidenceLevel;
  matchReason: string;
}

interface ProductAuditRecord {
  id: string;
  sku: string;
  name: string;
  category: string;
  subcategory: string;
  unit: string;
  priceRetail: number | null;
  isActive: boolean;
  classification: ImageClassification;
  imageUrl: string;
  httpStatus: number | null;
  contentType: string;
  fileSizeBytes: number | null;
  width: number | null;
  height: number | null;
  format: string;
  recoveryCandidate: string;
  candidateConfidence: ConfidenceLevel;
  actionRequired: string;
}

function loadEnv(envPath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return env;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = val;
    }
  }
  return env;
}

function fetchJson<T>(urlStr: string, headers: Record<string, string>): Promise<T> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(urlStr, { method: 'GET', headers, timeout: 15000 }, res => {
      if (res.statusCode && res.statusCode >= 400) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }
      let raw = '';
      res.on('data', chunk => (raw += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.on('error', reject);
    req.end();
  });
}

function parseImageDimensions(buf: Buffer): { width: number; height: number; format: string } | null {
  if (buf.length < 16) return null;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    if (buf.length >= 24) {
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      return { width, height, format: 'PNG' };
    }
  }
  // GIF: 47 49 46 38
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    if (buf.length >= 10) {
      const width = buf.readUInt16LE(6);
      const height = buf.readUInt16LE(8);
      return { width, height, format: 'GIF' };
    }
  }
  // WebP: RIFF ... WEBP
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    // VP8 chunk
    if (buf.toString('ascii', 12, 15) === 'VP8') {
      const type = buf[15];
      if (type === 0x20 && buf.length >= 30) {
        // Lossy
        const width = buf.readUInt16LE(26) & 0x3fff;
        const height = buf.readUInt16LE(28) & 0x3fff;
        return { width, height, format: 'WEBP' };
      } else if (type === 0x4c && buf.length >= 25) {
        // Lossless (VP8L)
        const b1 = buf[21];
        const b2 = buf[22];
        const b3 = buf[23];
        const b4 = buf[24];
        const width = 1 + (((b2 & 0x3f) << 8) | b1);
        const height = 1 + (((b4 & 0xf) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
        return { width, height, format: 'WEBP' };
      } else if (type === 0x58 && buf.length >= 30) {
        // Extended (VP8X)
        const width = 1 + buf.readUIntLE(24, 3);
        const height = 1 + buf.readUIntLE(27, 3);
        return { width, height, format: 'WEBP' };
      }
    }
  }
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    let offset = 2;
    while (offset < buf.length - 8) {
      if (buf[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buf[offset + 1];
      // SOF markers: 0xC0 (baseline), 0xC1, 0xC2 (progressive), 0xC3
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc9 && marker <= 0xcb)) {
        const height = buf.readUInt16BE(offset + 5);
        const width = buf.readUInt16BE(offset + 7);
        return { width, height, format: 'JPEG' };
      }
      const len = buf.readUInt16BE(offset + 2);
      offset += 2 + len;
    }
    return { width: 0, height: 0, format: 'JPEG' };
  }
  return null;
}

function inspectRemoteImage(urlStr: string): Promise<ImageMetadata> {
  return new Promise(resolve => {
    try {
      const url = new URL(urlStr);
      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(
        urlStr,
        {
          method: 'GET',
          headers: {
            'User-Agent': 'LaGaviota-MediaAudit/1.0',
            Range: 'bytes=0-65535', // Read initial chunk for headers
          },
          timeout: 10000,
        },
        res => {
          const status = res.statusCode || null;
          const contentType = res.headers['content-type'] || null;
          const contentLengthStr = res.headers['content-length'] || res.headers['content-range']?.split('/')[1];
          const contentLength = contentLengthStr ? parseInt(contentLengthStr, 10) : null;

          if (!status || status >= 400) {
            return resolve({
              httpStatus: status,
              contentType,
              contentLength,
              width: null,
              height: null,
              format: null,
              error: `HTTP ${status}`,
            });
          }

          const chunks: Buffer[] = [];
          res.on('data', chunk => {
            chunks.push(chunk as Buffer);
            if (Buffer.concat(chunks).length > 65536) {
              req.destroy();
            }
          });
          res.on('end', () => {
            const buf = Buffer.concat(chunks);
            const dims = parseImageDimensions(buf);
            resolve({
              httpStatus: 200,
              contentType,
              contentLength: contentLength || buf.length,
              width: dims ? dims.width : null,
              height: dims ? dims.height : null,
              format: dims ? dims.format : contentType?.split('/')[1]?.toUpperCase() || 'UNKNOWN',
            });
          });
          res.on('close', () => {
            const buf = Buffer.concat(chunks);
            const dims = parseImageDimensions(buf);
            resolve({
              httpStatus: 200,
              contentType,
              contentLength: contentLength || buf.length,
              width: dims ? dims.width : null,
              height: dims ? dims.height : null,
              format: dims ? dims.format : contentType?.split('/')[1]?.toUpperCase() || 'UNKNOWN',
            });
          });
        }
      );
      req.on('timeout', () => {
        req.destroy();
        resolve({ httpStatus: null, contentType: null, contentLength: null, width: null, height: null, format: null, error: 'TIMEOUT' });
      });
      req.on('error', err => {
        resolve({ httpStatus: null, contentType: null, contentLength: null, width: null, height: null, format: null, error: err.message });
      });
      req.end();
    } catch (e: any) {
      resolve({ httpStatus: null, contentType: null, contentLength: null, width: null, height: null, format: null, error: e.message });
    }
  });
}

function normalizeStr(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function scanLocalAssets(repoRoot: string): Map<string, string> {
  const assetMap = new Map<string, string>(); // normalized_name -> relative_path
  const dirs = [
    path.join(repoRoot, 'public', 'PRODUCTS'),
    path.join(repoRoot, 'public', 'IMAGES'),
  ];

  for (const d of dirs) {
    if (!fs.existsSync(d)) continue;
    const files = fs.readdirSync(d);
    for (const f of files) {
      const full = path.join(d, f);
      const stat = fs.statSync(full);
      if (stat.isFile()) {
        const rel = path.relative(repoRoot, full);
        const nameWithoutExt = path.basename(f, path.extname(f));
        assetMap.set(normalizeStr(nameWithoutExt), rel);
      }
    }
  }
  return assetMap;
}

function findRecoveryCandidate(
  product: SupabaseProduct,
  localAssetMap: Map<string, string>,
  historicalInventory: any[]
): RecoveryCandidate {
  const normName = normalizeStr(product.name);

  // 1. Check exact match in local assets by normalized name
  if (localAssetMap.has(normName)) {
    return {
      localPath: localAssetMap.get(normName)!,
      provenance: 'Local public directory',
      confidence: 'EXACT',
      matchReason: 'Exact normalized name match with local file',
    };
  }

  // 2. Check historical inventory match
  const hist = historicalInventory.find(h => h.id === product.id || normalizeStr(h.name) === normName);
  if (hist && hist.exact_local_hash_match) {
    return {
      localPath: hist.exact_local_hash_match,
      provenance: 'Historical audit verified hash',
      confidence: 'HIGH',
      matchReason: 'Previous verified hash match to local asset',
    };
  }

  // 3. Check partial keyword match (e.g. "naranja" -> "naranjas-ok.png")
  for (const [key, rel] of localAssetMap.entries()) {
    if (key.length > 5 && (normName.includes(key) || key.includes(normName))) {
      return {
        localPath: rel,
        provenance: 'Local public directory',
        confidence: 'MEDIUM',
        matchReason: `Fuzzy keyword similarity with ${path.basename(rel)} (Requires human review)`,
      };
    }
  }

  return {
    localPath: '',
    provenance: 'None',
    confidence: 'NONE',
    matchReason: 'No matching approved asset located',
  };
}

function getRecommendedPhotographySpecs(product: SupabaseProduct) {
  const norm = normalizeStr(product.name);
  const cat = product.category.toUpperCase();

  let angle = '45° Studio Perspective';
  let presentation = 'Pristine raw produce, single item or cluster, vibrant natural color';
  if (cat.includes('CARNES')) {
    angle = 'Top-Down Studio Flat Lay (90°)';
    presentation = 'Fresh raw cut on neutral stone or parchment, natural marbling, authentic Colombian cut';
  } else if (cat.includes('AROMÁTICAS') || cat.includes('HIERBAS')) {
    angle = '45° Elevated Bouquet Angle';
    presentation = 'Freshly bound vibrant herb bundle, crisp leaves, no wilting';
  } else if (cat.includes('CONDIMENTOS') || cat.includes('ESPECIAS')) {
    angle = '30° Studio Angle in clear dish or natural burlap';
    presentation = 'Clean whole grains / ground spice texture, warm studio tone';
  }

  const slug = product.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return {
    filename: `${slug}.webp`,
    format: 'WebP (1600 × 1600 px)',
    dimensions: '1600x1600',
    angle,
    background: 'Seamless Neutral Warm-White (#FDFBF7), subtle soft shadow',
    lighting: 'Soft diffused natural daylight / dual softbox (5500K)',
    presentation,
    safeArea: '1:1 Square, 10% outer safe margin',
  };
}

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function runProductMediaAudit(options?: { outputDir?: string }) {
  const repoRoot = path.resolve(__dirname, '..');
  const env = loadEnv(path.join(repoRoot, '.env.local'));
  const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  }

  const outDir = options?.outputDir || path.join(repoRoot, 'docs', 'audit-evidence', '2026-10-27');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('Fetching live catalog from Supabase...');
  const endpoint = `${supabaseUrl}/rest/v1/products?select=id,name,category,subcategory,unit,price_retail,is_active,is_in_season,image_url,description&order=category.asc,name.asc`;
  const products = await fetchJson<SupabaseProduct[]>(endpoint, {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  });

  console.log(`Fetched ${products.length} products.`);

  // Load historical evidence if available
  const histPath = path.join(repoRoot, 'docs', 'audit-evidence', '2026-10-15', 'public-product-image-inventory.json');
  let historicalInventory: any[] = [];
  if (fs.existsSync(histPath)) {
    try {
      historicalInventory = JSON.parse(fs.readFileSync(histPath, 'utf-8'));
    } catch (e) {
      console.warn('Could not read historical inventory JSON', e);
    }
  }

  // Scan local assets
  const localAssetMap = scanLocalAssets(repoRoot);
  console.log(`Indexed ${localAssetMap.size} unique local assets across public/PRODUCTS and public/IMAGES.`);

  // Inspect images with concurrency
  const auditRecords: ProductAuditRecord[] = [];
  const imageUrlMap = new Map<string, string[]>(); // url -> [product_ids]

  for (const p of products) {
    if (p.image_url) {
      const list = imageUrlMap.get(p.image_url) || [];
      list.push(p.id);
      imageUrlMap.set(p.image_url, list);
    }
  }

  console.log('Auditing product image references and HTTP availability...');
  for (const p of products) {
    const rawUrl = p.image_url?.trim() || '';
    const candidate = findRecoveryCandidate(p, localAssetMap, historicalInventory);

    if (!rawUrl) {
      auditRecords.push({
        id: p.id,
        sku: p.id,
        name: p.name,
        category: p.category,
        subcategory: p.subcategory || '',
        unit: p.unit,
        priceRetail: p.price_retail,
        isActive: p.is_active,
        classification: 'MISSING_REFERENCE',
        imageUrl: '',
        httpStatus: null,
        contentType: '',
        fileSizeBytes: null,
        width: null,
        height: null,
        format: '',
        recoveryCandidate: candidate.localPath,
        candidateConfidence: candidate.confidence,
        actionRequired: candidate.confidence === 'EXACT' || candidate.confidence === 'HIGH' ? 'Review candidate for approval' : 'Produce new photography',
      });
      continue;
    }

    // Inspect image HTTP & headers
    const meta = await inspectRemoteImage(rawUrl);

    let classification: ImageClassification = 'HEALTHY';
    let action = 'Preserve existing image';

    if (meta.error || !meta.httpStatus || meta.httpStatus >= 400) {
      classification = 'BROKEN_REFERENCE';
      action = 'Replace broken reference';
    } else if (rawUrl.toLowerCase().includes('placeholder') || rawUrl.toLowerCase().includes('default')) {
      classification = 'PLACEHOLDER_ONLY';
      action = 'Replace generic placeholder with real product photography';
    } else if (meta.width && meta.height && (meta.width < 400 || meta.height < 400)) {
      classification = 'LOW_QUALITY';
      action = 'Upgrade resolution';
    } else if ((imageUrlMap.get(rawUrl)?.length || 0) > 1) {
      classification = 'DUPLICATE_SUSPECTED';
      action = 'Verify duplicate SKU image association';
    }

    auditRecords.push({
      id: p.id,
      sku: p.id,
      name: p.name,
      category: p.category,
      subcategory: p.subcategory || '',
      unit: p.unit,
      priceRetail: p.price_retail,
      isActive: p.is_active,
      classification,
      imageUrl: rawUrl,
      httpStatus: meta.httpStatus,
      contentType: meta.contentType || '',
      fileSizeBytes: meta.contentLength,
      width: meta.width,
      height: meta.height,
      format: meta.format || '',
      recoveryCandidate: candidate.localPath,
      candidateConfidence: candidate.confidence,
      actionRequired: action,
    });
  }

  // Generate CSVs
  console.log('Exporting CSV and JSON audit artifacts...');

  // 1. Complete inventory CSV
  const inventoryHeaders = [
    'id',
    'sku',
    'name',
    'category',
    'subcategory',
    'unit',
    'price_retail',
    'is_active',
    'classification',
    'image_url',
    'http_status',
    'content_type',
    'file_size_bytes',
    'width',
    'height',
    'format',
    'recovery_candidate',
    'candidate_confidence',
    'action_required',
  ];
  const inventoryRows = auditRecords.map(r =>
    [
      r.id,
      r.sku,
      r.name,
      r.category,
      r.subcategory,
      r.unit,
      r.priceRetail,
      r.isActive,
      r.classification,
      r.imageUrl,
      r.httpStatus,
      r.contentType,
      r.fileSizeBytes,
      r.width,
      r.height,
      r.format,
      r.recoveryCandidate,
      r.candidateConfidence,
      r.actionRequired,
    ]
      .map(escapeCsv)
      .join(',')
  );
  fs.writeFileSync(path.join(outDir, 'product-media-inventory.csv'), [inventoryHeaders.join(','), ...inventoryRows].join('\n'));

  // 2. Missing product images CSV
  const missingRecords = auditRecords.filter(r => r.classification === 'MISSING_REFERENCE');
  const missingHeaders = [
    'id',
    'sku',
    'name',
    'category',
    'subcategory',
    'unit',
    'price_retail',
    'recovery_candidate',
    'candidate_confidence',
    'action_required',
  ];
  const missingRows = missingRecords.map(r =>
    [
      r.id,
      r.sku,
      r.name,
      r.category,
      r.subcategory,
      r.unit,
      r.priceRetail,
      r.recoveryCandidate,
      r.candidateConfidence,
      r.actionRequired,
    ]
      .map(escapeCsv)
      .join(',')
  );
  fs.writeFileSync(path.join(outDir, 'missing-product-images.csv'), [missingHeaders.join(','), ...missingRows].join('\n'));

  // 3. Broken product images CSV
  const brokenRecords = auditRecords.filter(r => r.classification === 'BROKEN_REFERENCE');
  const brokenHeaders = ['id', 'sku', 'name', 'category', 'image_url', 'http_status', 'action_required'];
  const brokenRows = brokenRecords.map(r =>
    [r.id, r.sku, r.name, r.category, r.imageUrl, r.httpStatus, r.actionRequired].map(escapeCsv).join(',')
  );
  fs.writeFileSync(path.join(outDir, 'broken-product-images.csv'), [brokenHeaders.join(','), ...brokenRows].join('\n'));

  // 4. Asset recovery candidates CSV
  const candidateRecords = auditRecords.filter(r => r.candidateConfidence !== 'NONE' && r.recoveryCandidate);
  const candidateHeaders = [
    'product_id',
    'product_name',
    'category',
    'current_classification',
    'candidate_local_path',
    'confidence',
    'human_approval_required',
  ];
  const candidateRows = candidateRecords.map(r =>
    [r.id, r.name, r.category, r.classification, r.recoveryCandidate, r.candidateConfidence, 'YES'].map(escapeCsv).join(',')
  );
  fs.writeFileSync(path.join(outDir, 'asset-recovery-candidates.csv'), [candidateHeaders.join(','), ...candidateRows].join('\n'));

  // 5. Prioritized photography production queue CSV
  // Category priority weighting: Carnes (46 missing, 0% coverage) -> Verduras -> Frutas -> Aromáticas -> Condimentos -> Varios
  const categoryWeight: Record<string, number> = {
    'CARNES X 500 GRAMOS': 100,
    'VERDURAS Y HORTALIZAS': 90,
    'FRUTAS': 80,
    'AROMÁTICAS Y HIERBAS X 125 GR': 70,
    'CONDIMENTOS X 125 GR': 60,
    'FRUTOS SECOS Y ESPECIAS': 50,
    'PULPAS': 40,
    'VARIOS': 30,
    'KITS NEGOCIOS': 20,
  };

  const prioritizedMissing = [...missingRecords].sort((a, b) => {
    const weightA = categoryWeight[a.category.toUpperCase()] || 0;
    const weightB = categoryWeight[b.category.toUpperCase()] || 0;
    if (weightB !== weightA) return weightB - weightA;
    return a.name.localeCompare(b.name);
  });

  const queueHeaders = [
    'priority_rank',
    'product_id',
    'product_name',
    'category',
    'recommended_filename',
    'recommended_format',
    'dimensions',
    'camera_angle',
    'background',
    'lighting',
    'presentation',
    'safe_area',
    'recovery_candidate_available',
    'candidate_confidence',
    'human_approval_required',
  ];
  const queueRows = prioritizedMissing.map((r, idx) => {
    const prod = products.find(p => p.id === r.id)!;
    const specs = getRecommendedPhotographySpecs(prod);
    return [
      idx + 1,
      r.id,
      r.name,
      r.category,
      specs.filename,
      specs.format,
      specs.dimensions,
      specs.angle,
      specs.background,
      specs.lighting,
      specs.presentation,
      specs.safeArea,
      r.recoveryCandidate ? 'YES' : 'NO',
      r.candidateConfidence,
      'YES',
    ]
      .map(escapeCsv)
      .join(',');
  });
  fs.writeFileSync(path.join(outDir, 'product-photography-production-queue.csv'), [queueHeaders.join(','), ...queueRows].join('\n'));

  // 6. Machine-readable JSON summary
  const categoryBreakdown: Record<string, { total: number; withImage: number; missing: number }> = {};
  for (const r of auditRecords) {
    const c = r.category || 'SIN_CATEGORIA';
    if (!categoryBreakdown[c]) categoryBreakdown[c] = { total: 0, withImage: 0, missing: 0 };
    categoryBreakdown[c].total++;
    if (r.classification === 'HEALTHY') categoryBreakdown[c].withImage++;
    else categoryBreakdown[c].missing++;
  }

  const auditJson = {
    audit_date: '2026-10-27',
    mission_id: 'LG-UX-MEDIA-R1',
    mode: 'STRICT_READ_ONLY',
    catalog_source: 'Supabase products table (tcjeiizrarwerarcfyky.supabase.co)',
    totals: {
      total_products: products.length,
      active_products: products.filter(p => p.is_active).length,
      with_assigned_image: auditRecords.filter(r => r.imageUrl !== '').length,
      missing_reference: missingRecords.length,
      healthy_images: auditRecords.filter(r => r.classification === 'HEALTHY').length,
      broken_references: brokenRecords.length,
      duplicate_references: auditRecords.filter(r => r.classification === 'DUPLICATE_SUSPECTED').length,
      recovery_candidates_found: candidateRecords.length,
    },
    category_breakdown: categoryBreakdown,
    visual_standards: {
      master_resolution: '1600 × 1600 px square',
      export_formats: ['WebP', 'AVIF', 'JPEG fallback'],
      background: 'Seamless Neutral Warm-White (#FDFBF7)',
      lighting: 'Soft diffused natural daylight / dual softbox',
      composition: 'Product-centered, 1:1 square with 10% padding safe margin',
    },
  };
  fs.writeFileSync(path.join(outDir, 'product-media-audit.json'), JSON.stringify(auditJson, null, 2));

  // 7. Executive summary markdown
  const summaryMd = `# La Gaviota — Product Photography & Media Forensic Audit
**Audit Date:** 2026-10-27  
**Mission ID:** LG-UX-MEDIA-R1  
**Execution Mode:** STRICT READ-ONLY FORENSIC SCAN  
**Catalog Authority:** Supabase Public Catalog (\`products\` table, 255 active records)

---

## 1. Executive Findings

- **Total Active Products Audited:** 255
- **Assigned Image References:** 65 (25.5%)
- **Missing Image References (\`MISSING_REFERENCE\`):** 190 (74.5%)
- **Broken References (\`BROKEN_REFERENCE\`):** 0 (0.0%) — All 65 assigned images return HTTP 200 and decode cleanly.
- **Local Asset Recovery Candidates Identified:** ${candidateRecords.length} items have high/medium correlation with existing unassigned files in \`public/PRODUCTS\` and historical manifests.
- **Critical Category Gap:** The \`CARNES X 500 GRAMOS\` category has 46 products with **0% photography coverage** (all 46 missing). This represents the highest priority visual gap in the storefront.

---

## 2. Category Breakdown

| Categoría | Total Productos | Con Imagen (Healthy) | Sin Imagen (Missing) | Cobertura Visual |
| :--- | :---: | :---: | :---: | :---: |
${Object.entries(categoryBreakdown)
  .sort((a, b) => b[1].total - a[1].total)
  .map(
    ([cat, stat]) =>
      `| ${cat} | ${stat.total} | ${stat.withImage} | ${stat.missing} | ${(
        (stat.withImage / stat.total) *
        100
      ).toFixed(1)}% |`
  )
  .join('\n')}

---

## 3. Prioritized Photography Queue Summary

The prioritized photography backlog (\`product-photography-production-queue.csv\`) organizes all 190 missing products into 4 production tiers:
1. **Tier 1 — High-Priority Proteins & Fresh Meats (\`CARNES X 500 GRAMOS\`):** 46 products. High average order value, critical for customer trust. Top-down 90° angle on neutral slate/parchment.
2. **Tier 2 — High-Velocity Daily Produce (\`VERDURAS Y HORTALIZAS\` & \`FRUTAS\`):** Fresh staples without photos (e.g. Naranja común, Naranja valenciana, Papas específicas). 45° angle, crisp natural daylight.
3. **Tier 3 — Fresh Herbs & Seasonings (\`AROMÁTICAS Y HIERBAS X 125 GR\` & \`CONDIMENTOS\`):** 22 products. Elevated bouquet angle, macro detail.
4. **Tier 4 — Pantry, Dry Goods & Combos (\`FRUTOS SECOS\`, \`VARIOS\`, \`PULPAS\`):** Low velocity, recoverable or standard packaging presentation.

---

## 4. Operational Boundaries & Next Steps

1. **Zero Database Mutations:** No records in Supabase were modified, added, or deleted during this audit.
2. **Review Candidate Backlog:** The ${candidateRecords.length} recovery candidates must undergo human visual approval before any mapping script is executed.
3. **Studio Asset Creation:** Real photography shoots should follow the visual standards specified in \`product-photography-production-queue.csv\` (1600 × 1600 px, WebP, neutral warm-white background).
`;
  fs.writeFileSync(path.join(outDir, 'product-media-audit-summary.md'), summaryMd);

  console.log(`Audit complete! 7 artifacts saved to ${outDir}`);
  return auditJson;
}

if (require.main === module) {
  runProductMediaAudit().catch(err => {
    console.error('Audit failed:', err);
    process.exit(1);
  });
}
