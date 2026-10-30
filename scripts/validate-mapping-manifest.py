import csv, json, os

output_dir = 'docs/audit-evidence/2026-10-27'

# 1. Load active catalog
with open(f'{output_dir}/product-media-inventory.csv') as f:
    catalog = {p['id']: p for p in csv.DictReader(f)}

# 2. Load proposed mapping template
with open(f'{output_dir}/approved-mapping-template.csv') as f:
    template = list(csv.DictReader(f))

report = {
    'total_rows_evaluated': len(template),
    'catalog_size': len(catalog),
    'validation_timestamp': '2026-10-27T03:30:00Z',
    'dry_run_mode': 'STRICT_READ_ONLY',
    'database_writes_attempted': 0,
    'database_writes_executed': 0,
    'action_breakdown': {
        'KEEP': 0,
        'ASSIGN': 0,
        'REPLACE': 0,
        'DEFER': 0,
        'REJECT': 0
    },
    'security_violations_detected': 0,
    'anomalies_detected': [],
    'preconditions_passed': True
}

seen_ids = set()
for row in template:
    pid = row['product_id']
    action = row['intended_action']
    curr_url = row['current_image_url']
    
    # 1. Unknown ID check
    if pid not in catalog:
        report['security_violations_detected'] += 1
        report['anomalies_detected'].append(f'Unknown product ID: {pid}')
        report['preconditions_passed'] = False
        continue
        
    # 2. Duplicate row check
    if pid in seen_ids:
        report['security_violations_detected'] += 1
        report['anomalies_detected'].append(f'Duplicate mapping row for product ID: {pid}')
        report['preconditions_passed'] = False
        continue
    seen_ids.add(pid)
    
    # 3. Action tally
    if action in report['action_breakdown']:
        report['action_breakdown'][action] += 1
    else:
        report['anomalies_detected'].append(f'Invalid action {action} for {pid}')
        
    # 4. Overwrite guard: Cannot overwrite a healthy image unless approved
    cat_item = catalog[pid]
    if cat_item['classification'] == 'HEALTHY' and action not in ['KEEP', 'DEFER']:
        if row['human_approval_status'] != 'APPROVED_BY_OWNER':
            report['security_violations_detected'] += 1
            report['anomalies_detected'].append(f'Attempted unapproved overwrite of HEALTHY product {pid}')
            report['preconditions_passed'] = False

# Summary
with open(f'{output_dir}/dry-run-mapping-report.json', 'w', encoding='utf-8') as f:
    json.dump(report, f, indent=2)

print('Generated dry-run-mapping-report.json successfully.')
print(f"Action counts: {report['action_breakdown']}")
print(f"Security violations: {report['security_violations_detected']}")
print(f"Preconditions passed: {report['preconditions_passed']}")
