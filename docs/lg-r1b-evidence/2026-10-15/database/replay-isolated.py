#!/usr/bin/python3
"""Optional future reproduction. Fresh owned substage only. Wrapper itself NOT EXECUTED in315case evidence."""
from pathlib import Path
import json,sys,re,shutil,subprocess,hashlib,os
ROOT=Path('/home/sebastiangarcia/.local/share/la-gaviota/lg-r1b-20261015/database')
assert ROOT.resolve()==ROOT and (ROOT/'SYNTHETIC_ONLY.sentinel').read_text()=='LA_GAVIOTA_LG_R1B_20261015_SYNTHETIC_LOCAL_POSTGRES_ONLY\n'
if len(sys.argv)!=2 or not re.fullmatch('[A-Za-z0-9]{1,6}',sys.argv[1]):raise SystemExit('Usage: replay-isolated.py TAG (1–6 alphanumeric characters, fresh substage)')
assert shutil.disk_usage(ROOT).free>=512*1048576,'Require512MiB free'
dest=ROOT/('r-'+sys.argv[1]);assert not dest.exists(),'Refuse existing evidence substage'
for filename,key in [('fixture.sql','fixture_sha256'),('proposals/lg-r1b-policy-proposal.sql.txt','candidate_sql_sha256'),('run-isolated.py','executed_harness_sha256')]:
 assert hashlib.sha256((ROOT/filename).read_bytes()).hexdigest()==json.loads((ROOT/'test-summary.json').read_text())[key], 'Frozen input mismatch: '+filename
dest.mkdir(mode=0o700);(dest/'proposals').mkdir(mode=0o700);(dest/'logs').mkdir(mode=0o700);(dest/'socket').mkdir(mode=0o700)
for f in ['SYNTHETIC_ONLY.sentinel','fixture.sql','storage-stub.sql','schema-coverage.json','proposals/lg-r1b-policy-proposal.sql.txt']:shutil.copyfile(ROOT/f,dest/f)
# Only permitted transformation: private owned stage constant. No URL/DB/env credential input accepted.
harness=(ROOT/'run-isolated.py').read_text().replace(str(ROOT),str(dest));(dest/'run-isolated.py').write_text(harness)
assert len(str(dest/'socket'/'.s.PGSQL.55473'))<104
r=subprocess.run(['/usr/bin/python3',str(dest/'run-isolated.py')],cwd=dest,env={'PATH':'/usr/bin:/bin','LANG':'C.UTF-8','LC_ALL':'C.UTF-8'})
raise SystemExit(r.returncode)
