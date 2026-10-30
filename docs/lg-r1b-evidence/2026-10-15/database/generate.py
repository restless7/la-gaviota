#!/usr/bin/python3
"""Recovered after ENOSPC. Verification-only; does not regenerate/replace frozen tested SQL.
Original generation was one-time source-derived synthesis; fixture/proposal are now frozen inputs.
This utility validates complete table names, frozenSQL/fixture/harness identities and cleanup evidence.
"""
from pathlib import Path
import re,json,hashlib,os
S=Path('/home/sebastiangarcia/.local/share/la-gaviota/lg-r1b-20261015/database');R=Path('/home/sebastiangarcia/planmaestro-ecosystem/packages/la-gaviota')
assert S.resolve()==S and (S/'SYNTHETIC_ONLY.sentinel').read_text()=='LA_GAVIOTA_LG_R1B_20261015_SYNTHETIC_LOCAL_POSTGRES_ONLY\n'
summary=json.loads((S/'test-summary.json').read_text()); coverage=json.loads((S/'schema-coverage.json').read_text());models=set(re.findall(r'^model (\w+) \{',(R/'prisma/schema.prisma').read_text(),re.M))
assert models=={r['table'].split('.')[1] for r in coverage if r['table'].startswith('public.')}
for f,k in [('fixture.sql','fixture_sha256'),('proposals/lg-r1b-policy-proposal.sql.txt','candidate_sql_sha256'),('run-isolated.py','executed_harness_sha256')]:assert hashlib.sha256((S/f).read_bytes()).hexdigest()==summary[k]
cleanup=json.loads((S/'cleanup.json').read_text());assert not cleanup['pid_alive'] and cleanup['stop_exit']==0 and not (S/'data/postmaster.pid').exists() and not list((S/'socket').iterdir())
assert summary['executed']==315 and summary['passed']==315 and summary['failed']==0
print(json.dumps({'frozen_inputs_verified':True,'app_tables':len(models),'coverage_tables':len(coverage),'final_cases':315,'cleanup_verified':True}))
