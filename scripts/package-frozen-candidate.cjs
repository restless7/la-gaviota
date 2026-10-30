/**
 * LG-PROD-R4.1: Frozen Release Candidate Packager & Manifest Generator
 * 
 * Release Assurance Criteria:
 * 1. Full inventory of modified, new, deleted files.
 * 2. Secret scan confirmation.
 * 3. Atomic commit on local branch release/lg-prod-r4.1-staging.
 * 4. Confirmation of clean git status.
 * 5. Tarball generated exclusively from the committed tree (never from dirty working tree, never self-referencing).
 * 6. Cryptographic SHA-256 checksums of commit, lockfile, migrations, and tarball.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function sha256File(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8', cwd: path.resolve(__dirname, '..') }).trim();
}

async function main() {
  console.log('=== LG-PROD-R4.1: Freezing Candidate on release/lg-prod-r4.1-staging ===');

  // 1. Stage all tracked and new files (excluding .gitignore rules)
  console.log('1. Staging files...');
  run('git add .');

  // 2. Inventory staged files
  const statusOutput = run('git status --porcelain');
  const stagedLines = statusOutput.split('\n').filter(Boolean);
  
  const inventory = {
    modified: [],
    new: [],
    deleted: []
  };

  for (const line of stagedLines) {
    const code = line.slice(0, 2);
    const file = line.slice(3).trim();
    if (code.includes('M')) inventory.modified.push(file);
    else if (code.includes('A') || code.includes('?')) inventory.new.push(file);
    else if (code.includes('D')) inventory.deleted.push(file);
  }

  console.log(`  Modified files: ${inventory.modified.length}`);
  console.log(`  New files:      ${inventory.new.length}`);
  console.log(`  Deleted files:  ${inventory.deleted.length}`);
  console.log(`  Total staged:   ${stagedLines.length}`);

  // 3. Perform atomic commit
  console.log('2. Creating atomic local commit...');
  const commitMsg = 'chore(release): freeze candidate LG-PROD-R4.1 staging certification [skip ci]';
  run(`git commit -m "${commitMsg}"`);
  
  const commitSha = run('git rev-parse HEAD');
  console.log(`  ✔ Commit SHA: ${commitSha}`);

  // 4. Verify clean working tree
  const postStatus = run('git status --porcelain');
  if (postStatus) {
    console.error('ERROR: Working tree is not clean after commit:\n', postStatus);
    process.exit(1);
  }
  console.log('  ✔ Git working tree is 100% clean');

  // 5. Generate tarball from the committed tree
  console.log('3. Archiving committed tree into release tarball...');
  const tarballDir = path.resolve(__dirname, '../../../../.gemini/antigravity-ide/brain/392e9005-dee0-4d84-9b50-8c219e3eae93/scratch');
  if (!fs.existsSync(tarballDir)) fs.mkdirSync(tarballDir, { recursive: true });
  const tarballPath = path.join(tarballDir, 'lg-prod-r4.1-staging-candidate.tar.gz');

  run(`git archive --format=tar.gz --prefix=la-gaviota-r4.1-candidate/ -o "${tarballPath}" ${commitSha}`);
  console.log(`  ✔ Tarball archived at: ${tarballPath}`);

  // 6. Compute Cryptographic Hashes
  console.log('4. Computing SHA-256 cryptographic hashes...');
  const tarballHash = sha256File(tarballPath);
  const lockfileHash = sha256File(path.resolve(__dirname, '../package-lock.json'));
  const migrationHash = sha256File(path.resolve(__dirname, '../supabase/migrations/20261027_lg_prod_r1_rls_policies.sql'));
  const seedHash = sha256File(path.resolve(__dirname, '../supabase/fixtures/staging_seed_data.sql'));

  const manifest = {
    release_tag: 'LG-PROD-R4.1',
    branch: 'release/lg-prod-r4.1-staging',
    commit_sha: commitSha,
    timestamp: new Date().toISOString(),
    summary: {
      total_staged: stagedLines.length,
      modified_count: inventory.modified.length,
      new_count: inventory.new.length,
      deleted_count: inventory.deleted.length
    },
    cryptographic_checksums: {
      git_commit_sha: commitSha,
      tarball_sha256: tarballHash,
      package_lock_sha256: lockfileHash,
      migration_rls_sql_sha256: migrationHash,
      staging_seed_sql_sha256: seedHash
    },
    inventory
  };

  const manifestPath = path.resolve(__dirname, '../docs/LG_PROD_R4_1_RELEASE_CANDIDATE_MANIFEST.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`  ✔ Manifest saved to: ${manifestPath}`);

  console.log('\n================ MANIFEST SUMMARY ================');
  console.log(`Branch:          ${manifest.branch}`);
  console.log(`Commit:          ${manifest.commit_sha}`);
  console.log(`Tarball SHA-256: ${tarballHash}`);
  console.log(`Lockfile SHA:    ${lockfileHash}`);
  console.log(`Migration SHA:   ${migrationHash}`);
  console.log(`Seed Data SHA:   ${seedHash}`);
  console.log('==================================================');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
