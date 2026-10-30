/**
 * LG-PROD-R4: Candidate Packaging & Reproducibility Validator
 * 
 * Creates an immutable, reproducible deployable snapshot of `packages/la-gaviota`,
 * capturing both tracked modifications and untracked candidate additions
 * while strictly excluding runtime artifacts (.next, node_modules, .env.local).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const PKG_ROOT = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = path.join(PKG_ROOT, 'artifacts');

if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

const EXCLUDE_PREFIXES = [
  'node_modules',
  '.next',
  '.git',
  '.turbo',
  'artifacts',
  '.env.local'
];

function shouldInclude(relPath) {
  for (const prefix of EXCLUDE_PREFIXES) {
    if (relPath === prefix || relPath.startsWith(prefix + path.sep)) {
      return false;
    }
  }
  if (relPath.endsWith('.log') || relPath.endsWith('.tsbuildinfo')) {
    return false;
  }
  return true;
}

function getAllFiles(dir, baseDir = dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);
    if (!shouldInclude(relPath)) continue;

    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      files.push(relPath);
    }
  }
  return files;
}

function getFileSha256(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

function packageCandidate() {
  console.log('[Candidate Packager] Scanning files in packages/la-gaviota...');
  const files = getAllFiles(PKG_ROOT).sort();
  console.log(`[Candidate Packager] Found ${files.length} candidate files.`);

  const fileManifest = {};
  for (const relPath of files) {
    const fullPath = path.join(PKG_ROOT, relPath);
    const stats = fs.statSync(fullPath);
    fileManifest[relPath] = {
      sha256: getFileSha256(fullPath),
      size: stats.size
    };
  }

  // Tarball generation
  const tarballPath = path.join(ARTIFACTS_DIR, 'lg-prod-r4-staging-candidate.tar.gz');
  console.log(`[Candidate Packager] Compressing candidate package into ${tarballPath}...`);

  // Write filelist for tar
  const filelistPath = path.join(ARTIFACTS_DIR, '.candidate_files.txt');
  fs.writeFileSync(filelistPath, files.join('\n'), 'utf8');

  execSync(`tar -czf "${tarballPath}" -T "${filelistPath}"`, {
    cwd: PKG_ROOT
  });
  fs.unlinkSync(filelistPath);

  const tarballStats = fs.statSync(tarballPath);
  const tarballSha256 = getFileSha256(tarballPath);
  console.log(`[Candidate Packager] Tarball created: ${tarballStats.size} bytes, SHA-256: ${tarballSha256}`);

  // Base Git info
  let baseCommit = '49add73ae90b837c36553a0f2b535267c9610143';
  let branch = 'feat/lg-prod-r1';
  try {
    baseCommit = execSync('git rev-parse HEAD', { cwd: PKG_ROOT }).toString().trim();
    branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: PKG_ROOT }).toString().trim();
  } catch {
    // fallback to known values
  }

  const manifest = {
    release_candidate_name: 'LG-PROD-R4-STAGING-ACTIVATION',
    package_name: 'la-gaviota',
    version: '0.1.3-staging-r4',
    created_at: new Date().toISOString(),
    git_branch: branch,
    base_commit: baseCommit,
    tarball: {
      filename: 'lg-prod-r4-staging-candidate.tar.gz',
      sha256: tarballSha256,
      size_bytes: tarballStats.size
    },
    key_hashes: {
      migration_sql_sha256: fileManifest['supabase/migrations/20261027_lg_prod_r1_rls_policies.sql']?.sha256,
      staging_seed_sql_sha256: fileManifest['supabase/fixtures/staging_seed_data.sql']?.sha256,
      package_lock_sha256: fileManifest['package-lock.json']?.sha256,
      safety_guard_sha256: fileManifest['src/lib/safetyGuard.ts']?.sha256
    },
    total_files_count: files.length,
    files: fileManifest
  };

  const manifestPath = path.join(ARTIFACTS_DIR, 'lg-prod-r4-staging-candidate.manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`[Candidate Packager] Manifest written to ${manifestPath}`);

  return manifest;
}

if (require.main === module) {
  packageCandidate();
}

module.exports = { packageCandidate, getAllFiles, getFileSha256 };
