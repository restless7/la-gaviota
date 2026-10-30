# LA GAVIOTA — LG-PROD-R3.1: HOSTED-STAGING ACTIVATION READINESS & INTEGRATION REPORT
**APEX AI SOLUTIONS · RELEASE ASSURANCE & SYSTEMS ARCHITECTURE**  
**Date:** October 28, 2026  
**Project:** Frutas y Verduras La Gaviota (`packages/la-gaviota`)  
**Active Branch:** `feat/lg-prod-r1`  
**Historical Git Base:** `49add73ae90b837c36553a0f2b535267c9610143`  
**Working Tree SHA:** `bd5c56f5f0ad52564bc4189bd0698ba18cc2f954`  
**Comprehensive Diff SHA-256:** `c4f6ad66b6afb69255e32c4c61406c40ea24b9045baca2efce9e1fd6bf3dc43f`  
**Package-Lock SHA-256:** `4dd9bbbdd1b8d2edeaf874024295cb63826146328d662bebb3080c90b0dc890f`  
**Migration SQL SHA-256:** `92f4c4fc854ff256f73169706dde9761b0080ff332e0515fc088b5998aeba957`  
**Commercial Status:** **STRICT NO-GO MAINTAINED (Pending Hosted Staging Certification)**  

---

## 1. EXECUTIVE SUMMARY & ARCHITECTURAL DISPOSITION

In accordance with the **APEX AI Solutions Architecture Board Review for LG-PROD-R3 (28 Oct 2026)**, release candidate `LG-PROD-R3` is accepted as the locally tested preflight baseline. Directive `LG-PROD-R3.1` mandates addressing four external contract and operational boundaries before hosted staging activation:

1. **Exact Candidate Provenance:** Formally document the working-tree identity, diff hash, lockfile hash, and migration checksum. (Base commit `49add73` is explicitly acknowledged as the historical branch point, not the standalone modified candidate hash).
2. **Wompi Reference-Based Reconciliation Disposition:** Acknowledge that `GET /v1/transactions?reference={ref}` is not guaranteed across all Wompi Colombia collection modalities. Classify Gate WOMPI-REF as **PARTIAL / BLOCKED ON SANDBOX LIVE CREDENTIALS**.
3. **Removal of 24-Hour Irreversible Order Cancellation:** Wompi's webhook retry horizon is decoupled from the commercial order lifecycle. Automated expiration of polling **never** unilaterally cancels a customer order (`orders.status = 'Cancelado'`). It flags `orders.payment_status = 'pending_review'` and routes the intent to operator escalation (`ESCALATED_UNRESOLVED`) for manual verification.
4. **Staging Reconciliation Scheduler & Plan Constraints:** Document that Vercel Cron on Hobby is limited to 1 execution per day (Pro/Enterprise supports 1-minute intervals) and that GitHub Actions `schedule:` only executes from the repository's default branch. Provide external authenticated runner scripts with concurrency locking, kill-switch protection, and durable audit logs.
5. **Business Facts Integrity:** Preserve verified legal merchant identity (Eduard Iván Velazco López, Plaza de Mercado San Francisco, Calle 13 #22-49, Local 10, Bucaramanga, +57 318 499 0826). Use synthetic support email in staging manifest.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          LG-PROD-R3.1 PREFLIGHT STATUS                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Working Tree SHA:                    bd5c56f5f0ad52564bc4189bd0698ba18cc2f954  │
│  Base Git Commit:                     49add73 (feat/lg-prod-r1)                 │
│  Automated Test Suite:                123 / 123 PASS (100% pass rate in 2.87s)  │
│  Real PostgreSQL 16.15 Tests:         48 / 48 PASS (ACID / RPC / Reconciliation)│
│  TypeScript Strict (tsc --noEmit):    0 errors (incremental: false)             │
│  Next.js 16.4.1 Production Build:     47 / 47 routes compiled cleanly           │
│  Gate WOMPI-REF (Reference Query):    PARTIAL (Pending Live Sandbox Execution)  │
│  Gate SCHED-01 (Staging Scheduler):   PARTIAL (Harness Ready / Pending Staging) │
│  Client Portal E2E Preflight:         3 Portals / 5 Viewports Harness Ready     │
│  Commercial Release Authorization:    NO-GO (Strictly Enforced)                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CLOSURE OF ARCHITECTURAL AND INTEGRATION RISKS

### Risk 1 & Gate WOMPI-REF: Wompi Reference-Based Query & Non-Destructive Reconciliation
* **Finding:** Public Wompi documentation guarantees `GET /v1/transactions/{id}` authenticated with private key. Querying by reference `GET /v1/transactions?reference={ref}` exists in specific Wompi modalities but cannot be treated as contract-certified for checkout collections without live sandbox verification. Furthermore, cancelling an order automatically after 24 hours of missing callbacks risks cancelling orders paid via slow bank rails (e.g. weekend PSE).
* **Architectural Closure:**
  1. **Contract Classification:** Gate WOMPI-REF is classified as **PARTIAL / BLOCKED ON LIVE SANDBOX CREDENTIALS**.
  2. **Non-Destructive Fail-Safe:** If reference lookup returns no results or provider queries fail, the order is **NEVER** silently cancelled or destroyed.
  3. **Decoupled Order Lifecyle:** When polling is exhausted (> 24h), `payment_intents.reconciliation_status` transitions to `'ESCALATED_UNRESOLVED'` with actionable notes. The order remains in `orders.status = 'Pendiente'` with `orders.payment_status = 'pending_review'`.
  4. **Late Provider Confirmation Support:** Because the order is preserved in `Pendiente`, any subsequent authorized Wompi approval webhook seamlessly settles the order to `En Preparación` without manual database surgery.
* **Evidence:** Certified by real PostgreSQL 16.15 tests `R3-RECON-NULL-TXID` and `R3-RECON-EXHAUST-NO-TX` in `tests/prod-r3-staging-preflight.test.cjs`.

### Risk 2: Payment Decline & Retry Separation (Transaction vs Commercial Intent)
* **Finding:** Wompi allows retrying a failed attempt with the same merchant reference. If an earlier `DECLINED` attempt cancels the order (`orders.status = 'Cancelado'`), a second approved transaction is rejected with `ORDER_ALREADY_CANCELLED`.
* **Architectural Closure:**
  1. **State Decoupling:** Fulfillment status (`orders.status`) and transaction payment status (`orders.payment_status`) are strictly separated.
  2. **Non-Destructive Decline:** In `process_wompi_transaction`, non-approved callbacks (`DECLINED`, `VOIDED`, `ERROR`) record the provider event receipt in `wompi_event_receipts` and update `orders.payment_status = 'declined'`, but preserve `orders.status = 'Pendiente'`.
  3. **Atomic Retry Settlement:** When the customer retries and the second transaction is `APPROVED`, `process_wompi_transaction` verifies that `status` is not hard-cancelled, transitions the order to `orders.payment_status = 'approved'`, advances fulfillment to `orders.status = 'En Preparación'`, and binds `orders.payment_reference = v_tx_id`.
  4. **Adapter Priority Selection:** `DefaultWompiApiAdapter.getTransactionByReference` prioritizes `APPROVED` transactions first when multiple transactions exist for a reference.
* **Evidence:** Certified by real PostgreSQL 16.15 tests `R3-RETRY-SEPARATION` and `R3-ADAPTER-PRIORITY` in `tests/prod-r3-staging-preflight.test.cjs`.

### Risk 3 & Gate SCHED-01: Staging Scheduler Architecture & Plan Constraints
* **Finding:** Vercel Cron on the Hobby plan is limited to 1 execution per day; Pro/Enterprise plans support intervals down to 1 minute. GitHub Actions scheduled workflows (`schedule:`) only run from the repository default branch (`main`), not from feature branches (`feat/lg-prod-r1`).
* **Architectural Closure:**
  1. **Dual HTTP Method Route:** Hardened `app/api/cron/reconcile-wompi/route.ts` to export both `GET` (for native Vercel Cron) and `POST` (for external runners), protected with constant-time `timingSafeEqual` against `CRON_SECRET` (>= 32 characters).
  2. **Dedicated Staging Runner Script:** Delivered `scripts/trigger-staging-reconciliation.sh`, an executable script with authenticated dispatch, status validation, and execution logging.
  3. **Operational Protection:** Added explicit kill switch (`RECONCILIATION_DISABLED=true` or `ENABLE_WOMPI_RECONCILIATION=false`) and durable execution telemetry insertion into `public.audit_logs`.
  4. **Plan Alignment Requirement:** The staging environment must utilize an external runner (or dedicated Vercel Pro staging project) to achieve the required 15-minute reconciliation cadence.
* **Evidence:** Certified by tests `R3-CRON-SECURITY` and `R3-KILL-SWITCH` in `tests/prod-r3-staging-preflight.test.cjs`.

---

## 3. COMPREHENSIVE TEST RECONCILIATION MATRIX

All 123 automated tests are reconciled across 5 distinct verification layers:

| Layer | Domain | Test Count | Target Environment | Status |
| :--- | :--- | :---: | :--- | :---: |
| **Layer 1** | Unit & Mock Commerce Validation | 75 | Node.js Test Runner / In-Memory Mock | **PASS** |
| **Layer 2** | Concurrency, Stock Invariants & Row Locking | 10 | Real PostgreSQL 16.15 (Port 54329) | **PASS** |
| **Layer 3** | Least Privilege RPCs, SHA-256 Idempotency & Balance State | 16 | Real PostgreSQL 16.15 (Port 54329) | **PASS** |
| **Layer 4** | Fail-Closed JWT Identity, search_path & Deduplication | 16 | Real PostgreSQL 16.15 (Port 54329) | **PASS** |
| **Layer 5** | R3.1 Reference Fallback, Non-Destructive Exhaustion & Kill Switch | 6 | Real PostgreSQL 16.15 (Port 54329) | **PASS** |
| **Total** | **Authoritative Engineering Regression Suite** | **123** | **Full Local Stack** | **PASS** |

### Execution Telemetry
```bash
$ npm test
✔ 123 tests passed (0 failed, 0 skipped, duration: 2.87s)

$ npm run typecheck
> tsc --noEmit --incremental false
✔ 0 errors

$ npm run build
▲ Next.js 16.4.1 (Turbopack)
✓ Compiled successfully in 1531ms
✓ Finished TypeScript in 3.1s
✓ Generating static pages (47/47) in 723ms
✓ 47/47 routes generated cleanly
```

---

## 4. VERIFIED BUSINESS FACTS & STAGING SECURITY

* **Verified Merchant Identity:**
  - **Business Name:** Frutas y Verduras La Gaviota
  - **Legal Representative:** Eduard Iván Velazco López
  - **Physical Address:** Plaza de Mercado San Francisco, Calle 13 #22-49, Local 10, Bucaramanga, Santander, Colombia
  - **Commercial WhatsApp / Phone:** +57 318 499 0826
* **Customer Support Email:** Synthetic address `soporte@staging.lagaviotafruver.com` configured for staging; operational production inbox to be confirmed by Eduard Velazco prior to launch.
* **SEO & GEO Hygiene:** Staging routes enforce `X-Robots-Tag: noindex, nofollow`. Public metadata does not leak staging test records into canonical production indexes.

---

## 5. STAGING ACTIVATION PACKAGE (4 ISOLATED RESOURCES)

The staging preflight is 100% complete. The following four isolated resources must be designated by the owner to unlock hosted execution:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         STAGING ACTIVATION CHECKLIST                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  [ ] 1. Supabase Staging:     Independent project (clean schema, zero prod data)│
│  [ ] 2. Clerk Dev Instance:   Isolated dev instance with synthetic test users   │
│  [ ] 3. Wompi Sandbox:        Merchant test keys (pub_stag_..., prv_stag_...)   │
│  [ ] 4. Vercel Staging:       Dedicated staging URL + authorized cron runner    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Staging Secrets Manifest Template (Zero Secrets Committed)
```bash
# Clerk Authentication (Staging / Development Instance)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

# Supabase Storage & Data (Staging Instance)
NEXT_PUBLIC_SUPABASE_URL=https://<staging-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Wompi Sandbox Payment Gateway
NEXT_PUBLIC_WOMPI_PUB_KEY=pub_stag_test_...
WOMPI_PRIVATE_KEY=prv_stag_test_...
WOMPI_INTEGRITY_SECRET=stag_integrity_...
WOMPI_EVENTS_SECRET=stag_events_...

# Scheduled Reconciliation Worker (>= 32 chars)
CRON_SECRET=staging_cron_secret_minimum_32_characters_long_token

# Public Support & Brand (Synthetic in Staging)
NEXT_PUBLIC_SUPPORT_EMAIL=soporte@staging.lagaviotafruver.com
NEXT_PUBLIC_WHATSAPP_NUMBER=573184990826
```

---

## 6. RELEASE GOVERNANCE DISPOSITION

### Hard Stop Enforcement
* **NO PRODUCTION DEPLOYMENTS:** No deployments targeting `lagaviotafruver.com`.
* **NO PRODUCTION MIGRATIONS:** Production database remains completely segregated and untouched.
* **NO LIVE CREDENTIALS:** Production Wompi and Clerk credentials remain unreferenced.
* **NO DATA EXFILTRATION:** Catalog photography and live customer data remain unaltered.

### Commercial Recommendation
**COMMERCIAL NO-GO MAINTAINED.**  
The platform has achieved 100% preflight pass across all 123 automated tests, TypeScript strict checks, and Turbopack builds.  
The next authorized milestone is **Hosted-Staging Gateway Activation**: once the owner designates the 4 isolated staging resources, Antigravity will execute the remote certification runbook and deliver the final commercial release evidence.
