#!/usr/bin/python3
"""OPTIONAL FUTURE REPLAY WRAPPER; not executed in 322-case evidence. Fresh stage only."""
from pathlib import Path
import hashlib,json,os,shutil,subprocess,tempfile
HERE=Path(__file__).resolve().parent
APP=HERE.parents[3]
assert (APP/'package.json').is_file(), 'Resolve package root from durable evidence'
assert shutil.disk_usage('/').free>=1024**3, 'Require1GiB root free'
assert shutil.disk_usage('/tmp').free>=1024**3, 'Require1GiB stage free'
summary=json.loads((HERE/'sql-model-summary.json').read_text())
model=HERE/'sql-model';proposal=APP/'docs/lg-r1b-evidence/2026-10-15/database/proposals/lg-r1b-policy-proposal.sql.txt'
for file,expected in [(proposal,summary['candidate_sql_sha256']),(model/'fixture.sql',summary['fixture_sha256']),(model/'run-runtime-model.py',summary['executed_harness_sha256'])]:
 assert hashlib.sha256(file.read_bytes()).hexdigest()==expected, 'Frozen input mismatch'
stage=Path(tempfile.mkdtemp(prefix='la-gaviota-runtime-security-pg-',dir='/tmp'));os.chmod(stage,0o700)
assert stage.resolve()==stage and stage.stat().st_uid==os.getuid()
for d in ['logs','socket','proposals']:(stage/d).mkdir(mode=0o700)
for f in ['fixture.sql','storage-stub.sql','schema-coverage.json']:shutil.copyfile(model/f,stage/f)
shutil.copyfile(proposal,stage/'proposals/lg-r1b-policy-proposal.sql.txt')
(stage/'SYNTHETIC_ONLY.sentinel').write_text('LA_GAVIOTA_RUNTIME_E2E_20261015_SYNTHETIC_LOCAL_POSTGRES_ONLY\n')
text=(model/'run-runtime-model.py').read_text()
old="/tmp/la-gaviota-runtime-e2e-20261015/security/private-pg"
assert text.count(old)==1
text=text.replace(old,str(stage)).replace(" assert S.resolve()==S", " assert __import__('shutil').disk_usage('/').free>=1024**3, 'Require1GiB root free'\n assert S.resolve()==S")
(stage/'run-runtime-model.py').write_text(text)
print('Owned synthetic stage:',stage,flush=True)
code=subprocess.run(['/usr/bin/python3',str(stage/'run-runtime-model.py')],cwd=stage,env={'PATH':'/usr/bin:/bin','LANG':'C.UTF-8','LC_ALL':'C.UTF-8'}).returncode
print('Evidence preserved, no automatic deletion:',stage,flush=True)
raise SystemExit(code)
