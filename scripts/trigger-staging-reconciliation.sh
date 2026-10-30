#!/usr/bin/env bash
# ==============================================================================
# APEX AI SOLUTIONS — LA GAVIOTA LG-PROD-R3
# Staging Reconciliation External Scheduler Trigger
#
# Resolves Vercel Preview Cron limitation by providing an authenticated,
# scheduled trigger for staging/preview deployments with audit logging.
# ==============================================================================

set -euo pipefail

TARGET_URL="${1:-${STAGING_URL:-http://localhost:3000}}"
SECRET="${2:-${CRON_SECRET:-}}"

if [ -z "$SECRET" ]; then
  echo "[ERROR] $(date -u +"%Y-%m-%dT%H:%M:%SZ") CRON_SECRET must be supplied via argument or environment variable." >&2
  exit 1
fi

ENDPOINT="${TARGET_URL%/}/api/cron/reconcile-wompi"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "[RECON-TRIGGER] Starting scheduled reconciliation dispatch at ${TIMESTAMP}"
echo "[RECON-TRIGGER] Target: ${ENDPOINT}"

HTTP_RESPONSE=$(curl -s -S -w "\n%{http_code}" -X POST "${ENDPOINT}" \
  -H "Authorization: Bearer ${SECRET}" \
  -H "Content-Type: application/json" \
  --max-time 30)

HTTP_BODY=$(echo "${HTTP_RESPONSE}" | sed '$d')
HTTP_STATUS=$(echo "${HTTP_RESPONSE}" | tail -n 1)

if [ "${HTTP_STATUS}" -eq 200 ]; then
  echo "[RECON-SUCCESS] HTTP 200 at $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "[RECON-PAYLOAD] ${HTTP_BODY}"
  exit 0
else
  echo "[RECON-FAILURE] HTTP ${HTTP_STATUS} at $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >&2
  echo "[RECON-ERROR] ${HTTP_BODY}" >&2
  exit 1
fi
