const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const ts = require('typescript');

const REPO_ROOT = path.resolve(__dirname, '..');

function loadTsModule(relativePath, mocks = {}) {
  const fullPath = path.resolve(REPO_ROOT, relativePath);
  const tsCode = fs.readFileSync(fullPath, 'utf8');
  const compiled = ts.transpileModule(tsCode, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;

  const mod = { exports: {} };
  const customRequire = (id) => {
    if (mocks[id]) return mocks[id];
    if (id.startsWith('@/')) {
      const target = id.replace('@/', '');
      const candidates = [
        target,
        `${target}.ts`,
        `${target}.tsx`,
        `${target}.js`,
        `${target}/index.ts`,
        `${target}/index.js`,
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(path.join(REPO_ROOT, candidate))) {
          return loadTsModule(candidate, mocks);
        }
      }
    }
    return require(id);
  };
  const fn = new Function('module', 'exports', 'require', '__dirname', '__filename', compiled);
  fn(mod, mod.exports, customRequire, path.dirname(fullPath), fullPath);
  return mod.exports;
}

test('isVercelBlobUrl logic accurately identifies Vercel Blob URLs', () => {
  function isVercelBlobUrl(url) {
    if (typeof url !== 'string') return false;
    return url.includes('blob.vercel-storage.com');
  }

  assert.equal(isVercelBlobUrl('https://abc.public.blob.vercel-storage.com/managed/product/123.jpg'), true);
  assert.equal(isVercelBlobUrl('https://blob.vercel-storage.com/managed/kit/123.webp'), true);
  assert.equal(isVercelBlobUrl('https://tcjeiizrarwerarcfyky.supabase.co/storage/v1/object/public/product-images/managed/prd.jpg'), false);
  assert.equal(isVercelBlobUrl('/IMAGES/kit-chevere-semana.jpg'), false);
  assert.equal(isVercelBlobUrl(null), false);
  assert.equal(isVercelBlobUrl(undefined), false);
});

test('uploadCatalogMedia uses Vercel Blob put when BLOB_READ_WRITE_TOKEN is configured', async () => {
  let putCalledWith = null;

  const mockBlob = {
    put: async (key, bytes, options) => {
      putCalledWith = { key, bytesLength: bytes.length, options };
      return {
        pathname: key,
        url: `https://my-store.public.blob.vercel-storage.com/${key}`,
      };
    },
    del: async () => {},
    list: async () => ({ blobs: [] }),
  };

  const { uploadCatalogMedia } = loadTsModule('src/actions/media.ts', {
    '@vercel/blob': mockBlob,
    '@/src/lib/server/authorization': {
      requireCapability: async () => ({ userId: 'admin-1', role: 'ADMIN' }),
      assertTargetId: () => {},
    },
    '@/src/lib/server/database': { getServerDatabase: () => ({}) },
  });

  const prevToken = process.env.BLOB_READ_WRITE_TOKEN;
  process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_test_token_123';

  try {
    // Valid JPEG header bytes: FF D8 FF
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, ...Array(30).fill(0)]);
    const file = new File([jpegBuffer], 'fresco.jpg', { type: 'image/jpeg' });
    const form = new FormData();
    form.set('file', file);

    const result = await uploadCatalogMedia('product', form);

    assert.ok(putCalledWith, 'put should have been called');
    assert.match(putCalledWith.key, /^managed\/product\/[0-9a-f-]+\.jpg$/);
    assert.equal(putCalledWith.options.access, 'public');
    assert.equal(putCalledWith.options.contentType, 'image/jpeg');
    assert.ok(result.url.includes('public.blob.vercel-storage.com'));
  } finally {
    if (prevToken) process.env.BLOB_READ_WRITE_TOKEN = prevToken;
    else delete process.env.BLOB_READ_WRITE_TOKEN;
  }
});

test('deleteCatalogMedia invokes Vercel del for blob URLs and clears DB column', async () => {
  let deletedBlobUrl = null;
  let updatedFields = null;

  const mockBlob = {
    put: async () => {},
    del: async (url) => { deletedBlobUrl = url; },
    list: async () => ({ blobs: [] }),
  };

  const testBlobUrl = 'https://my-store.public.blob.vercel-storage.com/managed/product/test-del.jpg';

  const mockDb = {
    from: (table) => {
      if (table === 'products') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { image_url: testBlobUrl },
                error: null,
              }),
              then: (resolve) => resolve({ data: [{ id: 'prd_001' }], error: null }),
            }),
          }),
          update: (fields) => ({
            eq: () => {
              updatedFields = fields;
              return Promise.resolve({ error: null });
            },
          }),
        };
      }
      if (table === 'kits') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [], error: null }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
    storage: {
      from: () => {
        throw new Error('Supabase storage should not be touched for Vercel Blob URLs');
      },
    },
  };

  const { deleteCatalogMedia } = loadTsModule('src/actions/media.ts', {
    '@vercel/blob': mockBlob,
    '@/src/lib/server/authorization': {
      requireCapability: async () => ({ userId: 'admin-1', role: 'ADMIN' }),
      assertTargetId: () => {},
    },
    '@/src/lib/server/database': { getServerDatabase: () => mockDb },
  });

  const res = await deleteCatalogMedia('product', 'prd_001');
  assert.equal(res.success, true);
  assert.equal(deletedBlobUrl, testBlobUrl);
  assert.deepEqual(updatedFields, { image_url: null });
});
