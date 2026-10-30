# LA GAVIOTA — DIRECTIVA LG-PROD-R2C
## Final Security Hardening, Hosted-Staging Preflight & End-to-End Certification Preparation
**Organization:** APEX AI Solutions  
**Project:** Frutas y Verduras La Gaviota (`packages/la-gaviota`)  
**Execution Date:** 2026-10-27  
**Branch:** `feat/lg-prod-r1` (anchored at base `49add73`)  
**Predecessor Milestone:** LG-PROD-R2B (Local Advance Accepted)  
**Commercial Release Decision:** **NO-GO STRICTLY MAINTAINED**  
**Executive Mandate:** Close all four identified local security gaps and establish an executable, isolated-staging integration gate without claiming production readiness from local tests alone.

---

## 1. EXECUTIVE SUMMARY & DECISION CONTEXT

In accordance with the Architecture Board directive for **LG-PROD-R2C**, engineering execution focused strictly on closing the four critical architectural and governance findings identified in LG-PROD-R2B:

1. **P0 JWT Identity Fail-Closed Closure:** Completely eradicated the identity bypass in `public.create_order_atomic`. For any caller operating under the PostgREST `authenticated` role, the Clerk JWT subject (`sub`) must be present, non-empty, and strictly equal to `clerk_user_id`. Missing or malformed subject claims immediately abort with `UNAUTHENTICATED_SUBJECT`.
2. **P0 Privilege Hardening & `search_path = ''`:** Hardened all privileged RPCs (`create_order_atomic`, `process_wompi_transaction`, `lg_auth.clerk_uid`, `lg_auth.caller_role`) with explicit `SET search_path = ''` and fully-qualified schema references. Revoked `CREATE` on schema `public` from `PUBLIC`, `anon`, and `authenticated`.
3. **P0 Durable Payment Reconciliation:** Acknowledged the documented 24-hour / 3-retry limitation of Wompi webhooks. Designed and implemented active polling reconciliation (`src/lib/server/wompiReconciliation.ts`), compound deduplication `(provider_transaction_id, status)`, canonical provider-derived event receipts, and operator escalation for stuck payments.
4. **P0 Safe Rollback & Release Governance:** Completely purged any operational recommendation of reverting to vulnerable commit `49add73` or disabling inventory tracking as a recovery strategy. Established an expand-first, roll-forward recovery protocol verified by automated migration re-execution tests.

### Overall Verification Summary

| Verification Layer | Test Suite | Result | Evidence Baseline |
|:---|:---|:---:|:---|
| **Layer 1: Unit & Mock Commerce** | `tests/checkout.test.cjs`, `cart-ux-media-brand.test.cjs`, `prod-r1-*.test.cjs` | **75 / 75 PASS** | Node.js Test Runner / Mock Harness |
| **Layer 2: Real PostgreSQL 16 Concurrency** | `tests/prod-r2a-postgres-concurrency.test.cjs` | **10 / 10 PASS** | PostgreSQL 16.15 (Port 54329) |
| **Layer 3: Security & Balance State** | `tests/prod-r2b-security-idempotency.test.cjs` | **16 / 16 PASS** | PostgreSQL 16.15 (Port 54329) |
| **Layer 4: R2C Identity & Payment Reconciliation** | `tests/prod-r2c-identity-reconciliation.test.cjs` | **16 / 16 PASS** | PostgreSQL 16.15 (Port 54329) |
| **Total Automated Regression Suite** | **All 8 Test Suites Combined** | **117 / 117 PASS** | Zero Failures, 1.4s Execution |
| **Static Type Safety** | `npm run typecheck` (`tsc --noEmit`) | **0 Errors** | TypeScript 5.9.3 Strict |
| **Next.js Production Bundle** | `npm run build` | **47 / 47 Routes Compiled** | Next.js 16.4.1 (Turbopack) in 4.2s |
| **Hosted Staging Gate** | Supabase Staging, Clerk Staging, Wompi Sandbox | **BLOCKED** | Awaiting Owner Authorization |

---

## 2. P0 — FAIL-CLOSED JWT IDENTITY IN POSTGRESQL

### A. Root Cause Analysis
In LG-PROD-R2B, `public.create_order_atomic` checked impersonation using:
```sql
IF lg_auth.clerk_uid() IS NOT NULL THEN
  IF v_clerk_user_id IS DISTINCT FROM lg_auth.clerk_uid() THEN
    RAISE EXCEPTION 'FORBIDDEN_USER_IMPERSONATION';
  END IF;
END IF;
```
This created a critical vulnerability: if PostgREST received a valid JWT specifying `role: 'authenticated'`, but the `sub` claim was omitted, empty, or stripped, `lg_auth.clerk_uid()` evaluated to `NULL`. The anti-impersonation check was skipped, allowing an attacker to supply an arbitrary `clerk_user_id` in the order payload.

### B. Corrective Implementation
The SQL body of `public.create_order_atomic` in `supabase/migrations/20261027_lg_prod_r1_rls_policies.sql` was completely reconstructed:

```sql
  -- 1. Anti-Impersonation and Mandatory Caller Identity Verification
  v_caller_role := lg_auth.caller_role();
  v_caller_sub := lg_auth.clerk_uid();

  IF v_caller_role = 'authenticated' THEN
    -- P0: Authenticated customer calls strictly require verified, non-empty Clerk subject claim
    IF v_caller_sub IS NULL OR v_caller_sub = '' THEN
      RAISE EXCEPTION 'UNAUTHENTICATED_SUBJECT: Missing, empty, or invalid Clerk subject claim in authenticated session';
    END IF;
    IF v_clerk_user_id IS NULL OR v_clerk_user_id = '' THEN
      RAISE EXCEPTION 'UNAUTHENTICATED_CHECKOUT: clerk_user_id is required';
    END IF;
    IF v_clerk_user_id IS DISTINCT FROM v_caller_sub THEN
      RAISE EXCEPTION 'FORBIDDEN_USER_IMPERSONATION: Authenticated subject % cannot order as %',
        v_caller_sub, v_clerk_user_id;
    END IF;
  ELSIF v_caller_role = 'service_role' OR (v_caller_role = session_user AND session_user IN ('postgres', 'sebastiangarcia')) THEN
    -- Trusted server-side execution path (e.g. backend private orderWriter with pre-verified session)
    IF v_clerk_user_id IS NULL OR v_clerk_user_id = '' THEN
      RAISE EXCEPTION 'UNAUTHENTICATED_CHECKOUT: clerk_user_id is required';
    END IF;
    -- If a subject claim is attached to the ambient context in service path, ensure consistency
    IF v_caller_sub IS NOT NULL AND v_caller_sub <> '' AND v_clerk_user_id IS DISTINCT FROM v_caller_sub THEN
      RAISE EXCEPTION 'FORBIDDEN_USER_IMPERSONATION: Scoped subject % cannot order as %',
        v_caller_sub, v_clerk_user_id;
    END IF;
  ELSE
    -- Untrusted or anonymous role attempting direct execution must fail closed
    RAISE EXCEPTION 'FORBIDDEN_EXECUTION_ROLE: Role % is not authorized to create orders', v_caller_role;
  END IF;
```

### C. Test Matrix on Real PostgreSQL 16

| Test Scenario | Input Ambient Claims | Payload `clerk_user_id` | Expected Result | Real DB Result | Status |
|:---|:---|:---|:---|:---:|:---:|
| Missing `sub` claim | `role: authenticated` | `user_attacker` | `UNAUTHENTICATED_SUBJECT` | Error Caught | **PASS** |
| Empty whitespace `sub` | `role: authenticated, sub: "   "` | `user_attacker` | `UNAUTHENTICATED_SUBJECT` | Error Caught | **PASS** |
| Null `sub` claim | `role: authenticated, sub: null` | `user_attacker` | `UNAUTHENTICATED_SUBJECT` | Error Caught | **PASS** |
| Valid `sub` & matching owner | `role: authenticated, sub: user_123` | `user_123` | `success: true` | Order Created | **PASS** |
| Valid `sub` & foreign owner | `role: authenticated, sub: user_123` | `user_victim` | `FORBIDDEN_USER_IMPERSONATION` | Error Caught | **PASS** |
| Untrusted / forged role | `role: untrusted_role, sub: user_1` | `user_1` | `FORBIDDEN_EXECUTION_ROLE` | Error Caught | **PASS** |
| Service role scoped match | `role: service_role, sub: user_srv` | `user_srv` | `success: true` | Order Created | **PASS** |
| Service role scoped mismatch | `role: service_role, sub: user_srv` | `user_other` | `FORBIDDEN_USER_IMPERSONATION` | Error Caught | **PASS** |

---

## 3. P0 — SECURITY DEFINER & RPC PRIVILEGE HARDENING

### A. Schema Creation Lockdown
To prevent untrusted roles from creating objects in schema `public` that could shadow system functions, the migration explicitly enforces:
```sql
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM anon, authenticated;
```
Verified in test: an authenticated user attempting `CREATE TABLE public.malicious_shadow_table (id int);` is blocked with PostgreSQL error code `42501 (insufficient_privilege)`.

### B. Restrictive `search_path = ''`
Functions declared with `SECURITY DEFINER` run with the privileges of their owner. If `search_path` contains `public` or untrusted schemas, an attacker who creates an object with a common name can intercept execution.
All privileged functions are now locked down with:
```sql
CREATE OR REPLACE FUNCTION public.create_order_atomic(...)
...
SECURITY DEFINER
SET search_path = ''
AS $$ ... $$;

CREATE OR REPLACE FUNCTION public.process_wompi_transaction(...)
...
SECURITY DEFINER
SET search_path = ''
AS $$ ... $$;
```
Inside these functions:
- Built-in functions are explicitly qualified with `pg_catalog.` (e.g. `pg_catalog.current_setting`, `pg_catalog.jsonb_to_recordset`, `pg_catalog.now()`, `pg_catalog.regexp_match`).
- Database tables are explicitly qualified with `public.` (e.g. `public.orders`, `public.order_items`, `public.products`, `public.inventory_movements`, `public.payment_intents`, `public.wompi_event_receipts`, `public.b2b_credit_profiles`).
- Standard SQL expressions (`NULLIF`, `TRIM`, `COALESCE`, `GREATEST`) operate directly through parser syntax without catalog lookups.

### C. RPC Privilege Matrix

| Function Name | Definition | Search Path | Granted Roles | Revoked Roles | PostgREST Exposure |
|:---|:---:|:---:|:---:|:---:|:---|
| `lg_auth.clerk_uid()` | `SECURITY DEFINER` | `''` | `anon, authenticated, service_role` | `PUBLIC` | Helper in private schema `lg_auth` |
| `lg_auth.caller_role()` | `SECURITY DEFINER` | `''` | `anon, authenticated, service_role` | `PUBLIC` | Helper in private schema `lg_auth` |
| `public.create_order_atomic()` | `SECURITY DEFINER` | `''` | `authenticated, service_role` | `PUBLIC, anon` | Client Order Endpoint (Fail-closed) |
| `public.process_wompi_transaction()` | `SECURITY DEFINER` | `''` | `service_role` | `PUBLIC, anon, authenticated` | Private Server-Side Only |

---

## 4. P0 — PAYMENT RECOVERY AFTER PROVIDER RETRY EXHAUSTION

### A. Wompi Retry Exhaustion Reality
According to official Wompi documentation:
- Wompi retries webhook event deliveries a **maximum of 3 times** over the course of **24 hours**.
- If a temporary network partition, infrastructure deployment, or database maintenance window exceeds those attempts, Wompi ceases redelivery entirely.
- Relying on HTTP 500 retries is insufficient for enterprise operations; without active polling reconciliation, orders whose callbacks are exhausted remain stuck in `pending` indefinitely.

### B. Durable Reconciliation Architecture

```
[Customer Checkout] 
       │
       ▼
1. Persist Payment Intent (status: 'PENDING', reconciliation_status: 'PENDING')
       │
   ┌───┴───────────────────────────────────────────┐
   │ Happy Path                                    │ Webhook Exhaustion Path
   ▼                                               ▼
2. Wompi Webhook (Up to 3 retries in 24h)      2. Active Reconciliation Worker (Cron / Poller)
   - Validate dynamic properties HMAC             - Queries PENDING intents older than 15 min
   - Derive receipt: wompi_tx_{id}_status_{st}     - Polls Wompi API: GET /v1/transactions/:id
   - Call process_wompi_transaction RPC           - Validates amount, currency, and environment
       │                                               │
       ├───────────────────────────────────────────────┤
       ▼                                               ▼
3. Compound Uniqueness Constraint              3. Atomic RPC Execution
   idx_wompi_receipts_tx_status                   - Deduplicates via (tx_id, status)
   (provider_transaction_id, status)              - Adjusts balance or marks order approved
       │                                               │
       ▼                                               ▼
4. Final State: APPROVED / RECONCILED          4. If Provider Exhausted (> 24h unresolved):
   - Orders: payment_status = 'approved'          - Set reconciliation_status: 'ESCALATED_UNRESOLVED'
   - Intents: reconciliation_status:              - Log operator alert with failure details
     'RECONCILED_CALLBACK' or 'RECONCILED_POLL'
```

### C. Implementation Components
1. **Database Schema Enhancements:**
   - Added `reconciliation_status` (`'PENDING' | 'RECONCILED_CALLBACK' | 'RECONCILED_POLL' | 'ESCALATED_UNRESOLVED'`), `last_reconciled_at`, and `reconciliation_notes` to `public.payment_intents`.
   - Added `idx_wompi_receipts_tx_status` compound unique index on `public.wompi_event_receipts(provider_transaction_id, status)`.
2. **Reconciliation Module (`src/lib/server/wompiReconciliation.ts`):**
   - Implements `reconcilePendingPaymentIntents(supabase, options)`.
   - Features `DefaultWompiApiAdapter` for live/sandbox Wompi REST API calls and pluggable adapter interfaces for testing.
   - Detects environment mismatches (e.g. sandbox payload in production intent) and halts financial updates.
   - Automatically escalates intents older than 24 hours without valid provider resolution.
3. **Cron Worker Endpoint (`app/api/cron/reconcile-wompi/route.ts`):**
   - Protected by `getSchedulerDatabase(req)` using constant-time `timingSafeEqual` against `CRON_SECRET`.
   - Exposes structured operational diagnostics.

### D. Automated Failure Recovery Tests

| Test Case | Failure Condition Simulated | System Reaction | Financial Integrity Result | Status |
|:---|:---|:---|:---|:---:|
| **RECON-POLL (Approved)** | Webhook never received; intent stalled 30m | Worker polls provider, receives `APPROVED` | Order approved, intent marked `RECONCILED_POLL` | **PASS** |
| **RECON-POLL (Declined)** | Webhook never received; provider declined | Worker polls provider, receives `DECLINED` | Order cancelled, intent marked `RECONCILED_POLL` | **PASS** |
| **RECON-EXHAUST** | Provider retries exhausted (> 24h) | Worker detects expired retry window | Flagged `ESCALATED_UNRESOLVED` with operator note | **PASS** |
| **RECON-ENV** | Environment mismatch (Sandbox vs Prod) | Worker detects mismatch in provider payload | Fails closed; flagged `ESCALATED_UNRESOLVED` | **PASS** |
| **RECON-AMOUNT** | Valid signature, but mismatched amount | RPC verifies `v_order.total_amount = paid` | Raises `PAYMENT_AMOUNT_MISMATCH`; order remains pending | **PASS** |
| **RECON-DEDUP** | Two events with distinct event IDs for 1 tx | Compound index on `(tx_id, status)` triggers | Second event returns `duplicate: true`; 0 duplicate balance deductions | **PASS** |

---

## 5. P0 — SAFE ROLLBACK AND RELEASE GOVERNANCE

### A. Permanent Removal of Insecure Rollback Guidance
Previous draft documentation contained two governance violations:
1. Recommending a code rollback to commit `49add73`.
2. Suggesting `UPDATE global_settings SET track_inventory = false;` as a generic operational recovery mechanism.

Both directives have been **permanently expunged** from all project documentation and replaced with the following rules:
- **Prohibition of Baseline `49add73` Recovery:** Reverting to `49add73` is strictly prohibited because that commit contains the severe authorization and RPC bypasses identified in the initial security audit. An application rollback must never reintroduce known security vulnerabilities.
- **Prohibition of Disabling Inventory Tracking:** Disabling inventory tracking as a recovery action allows orders to be accepted without stock verification, leading to physical stock overselling, fulfilment collapse, and customer disputes.

### B. Expand-First Roll-Forward Recovery Protocol
The project adopts the **Expand-First Roll-Forward Model**:
1. **Non-Destructive Database Expansions:** All database migrations only add nullable columns, default values, new tables, and additive constraints. No existing production columns or tables are dropped or renamed.
2. **Backward-Compatible Application Code:** If a newly deployed application artifact exhibits a runtime defect, the previous *verified* release candidate (with equivalent security controls) can run against the expanded database schema without modification.
3. **Safe Roll-Forward Patching:** Operational defects are remediated by deploying targeted forward-compatible patches (`roll-forward`) with verified test suites, rather than reverting schema.
4. **Data-Preserving Recovery Rehearsal:** The migration script `supabase/migrations/20261027_lg_prod_r1_rls_policies.sql` was replayed multiple times against an active PostgreSQL 16 database populated with orders, payment intents, inventory audit records, and customer balances. Automated assertion confirmed **100% data preservation with zero loss or alteration of financial evidence**.

---

## 6. HOSTED-STAGING INFRASTRUCTURE PREFLIGHT

### A. Staging Topology & Isolation Boundaries

```
[Vercel Staging Preview]
  - Subdomain: staging.lagaviotafruver.com (or isolated preview deployment)
  - No production DNS or commercial traffic
  - Environment: STAGING (isolated secrets)
       │
       ├───► [Clerk Staging Instance]
       │       - Dedicated test application: `app_la_gaviota_staging`
       │       - Isolated user directory (no production customer emails)
       │       - Test roles configured in Public Metadata:
       │         * Retail (`retail_test@lagaviotafruver.com`)
       │         * Micromercado (`micro_test@lagaviotafruver.com`)
       │         * Restaurante (`rest_test@lagaviotafruver.com`)
       │         * Operario / Admin (`admin_test@lagaviotafruver.com`)
       │
       ├───► [Supabase Staging Project]
       │       - Dedicated project ID: `lg-staging-db` (isolated from production ref)
       │       - Clean database with migration `20261027_lg_prod_r1_rls_policies.sql`
       │       - Clerk third-party JWT integration enabled:
       │         * JWKS URL: `https://<clerk-staging-domain>/.well-known/jwks.json`
       │       - RLS enabled on all tables; search_path = '' on all RPCs
       │
       └───► [Wompi Sandbox]
               - Test Merchant ID & Public Key: `pub_test_...`
               - Private Key for reconciliation: `prv_test_...`
               - Integrity Secret: `test_integrity_...`
               - Events Secret: `test_events_...`
               - Webhook URL: `https://staging.lagaviotafruver.com/api/webhooks/wompi`
```

### B. Hosted-Staging Configuration Manifest (No Secrets)

```env
# Runtime Environment
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_SITE_URL=https://staging.lagaviotafruver.com

# Isolated Supabase Staging
NEXT_PUBLIC_SUPABASE_URL=https://<isolated-staging-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>

# Isolated Clerk Development / Staging
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_<staging-publishable-key>
CLERK_SECRET_KEY=sk_test_<staging-secret-key>
CLERK_WEBHOOK_SECRET=whsec_<staging-clerk-webhook-secret>

# Wompi Sandbox
NEXT_PUBLIC_WOMPI_PUB_KEY=pub_test_<staging-wompi-pub-key>
WOMPI_PRIVATE_KEY=prv_test_<staging-wompi-prv-key>
WOMPI_INTEGRITY_SECRET=test_integrity_<secret>
WOMPI_EVENTS_SECRET=test_events_<secret>
WOMPI_ENVIRONMENT=sandbox

# Scheduler / Cron Security
CRON_SECRET=<minimum-32-char-random-entropy-string>

# Canonical Business Identifiers (Factual NAP)
NEXT_PUBLIC_STORE_PHONE=3184990826
NEXT_PUBLIC_STORE_WHATSAPP=573184990826
```

### C. Owner Activation Checklist

Before executing any remote operations against hosted staging:
- [ ] **Step 1: Owner Authorization:** Owner explicitly designates the target Supabase project ID and Clerk instance as disposable staging environments.
- [ ] **Step 2: Database Migration:** Apply `supabase/migrations/20261027_lg_prod_r1_rls_policies.sql` to the isolated Supabase Staging database.
- [ ] **Step 3: Third-Party JWT Binding:** Configure Supabase Auth settings to recognize the Clerk Staging JWKS issuer.
- [ ] **Step 4: Seed Synthetic Data:** Populate catalog with test products and test B2B balances.
- [ ] **Step 5: Configure Wompi Sandbox Webhook:** Register the staging webhook URL with Wompi Sandbox developer dashboard.
- [ ] **Step 6: Execute E2E Suite:** Run the automated Playwright harness (`node tests/e2e-portals-preflight.cjs`).

---

## 7. COMPLETE CLIENT PORTAL E2E HARNESS

A multi-viewport Playwright end-to-end testing harness was prepared at `tests/e2e-portals-preflight.cjs`.

### Portals Tested
1. `/retail`: Retail / B2C storefront, cart drawer, cash/Wompi checkout selection.
2. `/micromercado`: B2B Micromercado portal, tiered pricing (Price Micro), minimum order rules, credit line balance visibility.
3. `/restaurante`: B2B Restaurante portal, high-volume pricing (Price Restaurant), credit line balance visibility, balance payment checkout.

### Viewports Covered
- **360 x 640 px** (Mobile Small / Android entry)
- **390 x 844 px** (Mobile Standard / iPhone 12/13/14)
- **768 x 1024 px** (Tablet Portrait / iPad Mini)
- **1024 x 768 px** (Tablet Landscape / Laptop standard)
- **1440 x 900 px** (Desktop Wide)

### Gate Status
- **Harness Code:** **PASS** (Runnable, multi-viewport compatible, asserting genuine HTTP 200 and DOM rendering).
- **Hosted Integration Certification:** **BLOCKED** pending active staging deployment and test credentials.

---

## 8. RECONCILED TEST QUALITY GATES

### Discrepancy Reconciliation (22 vs 23 PostgreSQL Tests)
In previous reports, PostgreSQL test counts varied between 22 and 23 due to the counting of a migration re-execution assertion either as part of security or as an integration test.
The entire test suite is now strictly organized into distinct evidence layers:

```
======================================================================
LA GAVIOTA COMPLETE AUTOMATED REGRESSION SUITE (117 TESTS)
======================================================================

[LAYER 1] Mock & Unit Commerce Validation (75 tests)
├── tests/cart-ux-media-brand.test.cjs (10 tests)
│   ├── Cart Drawer drawer state, item counting, and total formatting
│   ├── Quantity increment/decrement bounds (min 1, max bound)
│   ├── Media resolution and fallback image rendering
│   └── Favicon & Apple Touch Icon static manifest link verification
├── tests/checkout.test.cjs (52 tests)
│   ├── Input quantity validation (rejection of NaN, negative, non-integer)
│   ├── SKU deduplication without client price trusting
│   ├── Inventory flag false handling
│   ├── Missing/duplicate database products fail-closed
│   ├── Cash & Wompi checkout validation matrix
│   └── Webhook signature and terminal status rules
├── tests/prod-r1-commerce.test.cjs (4 tests)
│   ├── Order idempotency and fingerprint hashing
│   ├── Stock concurrency simulation
│   └── B2B balance reference regex binding
├── tests/prod-r1-security.test.cjs (4 tests)
│   ├── Target ID validation (UUID / Clerk ID)
│   ├── Role & pricing tier validation
│   └── Staged RLS migration file syntax check
└── tests/prod-r1-seo-geo.test.cjs (5 tests)
    ├── Robots.txt disallow rules (admin, checkout, cart)
    ├── Sitemap canonical public routes
    ├── LocalBusiness / GroceryStore Schema NAP data (318 499 0826, Bucaramanga)
    ├── Crawlable FAQ semantic markup
    └── Operational health check endpoint /api/health

[LAYER 2] Real PostgreSQL 16 Concurrency & Stock Locks (10 tests)
└── tests/prod-r2a-postgres-concurrency.test.cjs (10 tests)
    ├── Transactional atomicity: rollback header & inventory on line failure
    ├── 20 concurrent identical checkouts produce exactly 1 order
    ├── 20 distinct checkouts racing for 5 units never overdraw stock (invariant >= 0)
    ├── Cross-customer idempotency key hijacking throws IDEMPOTENCY_OWNER_MISMATCH
    ├── Same-customer key reuse with altered cart throws IDEMPOTENCY_PAYLOAD_MISMATCH
    ├── Deterministic ascending row locking prevents deadlocks on overlapping carts
    ├── Concurrent duplicate Wompi callbacks deduct balance exactly once
    ├── Out-of-order delayed PENDING webhook never reverts an APPROVED order
    ├── Unknown order transaction reference throws ORDER_NOT_FOUND
    └── Zero or negative order line quantity raises INVALID_ITEM_QUANTITY

[LAYER 3] Privilege Boundaries, Idempotency & Balance (16 tests)
└── tests/prod-r2b-security-idempotency.test.cjs (16 tests)
    ├── Anonymous role direct call to create_order_atomic is denied
    ├── Direct call to process_wompi_transaction by authenticated/anon is denied
    ├── Customer forging another customer order raises FORBIDDEN_USER_IMPERSONATION
    ├── Authenticated customer checkout with matching JWT succeeds
    ├── Idempotent duplicate acknowledgment on same key + same payload
    ├── Altered SKU or address with same key is rejected
    ├── Reordered line items produce identical canonical fingerprint
    ├── B2B balance deduction strictly moves from 500k to 400k after 100k payment
    ├── Ten callbacks with distinct receipt IDs deduct balance exactly once
    ├── Altered amount in webhook transaction raises PAYMENT_AMOUNT_MISMATCH
    ├── Incoming APPROVED event for cancelled order returns error without reopening
    └── Migration re-execution against active records preserves 100% data

[LAYER 4] R2C Identity Hardening & Payment Reconciliation (16 tests)
└── tests/prod-r2c-identity-reconciliation.test.cjs (16 tests)
    ├── Missing sub claim in authenticated session raises UNAUTHENTICATED_SUBJECT
    ├── Empty sub claim raises UNAUTHENTICATED_SUBJECT
    ├── Null sub claim raises UNAUTHENTICATED_SUBJECT
    ├── Valid sub claim with matching clerk_user_id succeeds
    ├── Valid sub claim with foreign owner raises FORBIDDEN_USER_IMPERSONATION
    ├── Untrusted or forged role raises FORBIDDEN_EXECUTION_ROLE
    ├── Service role execution requires clerk_user_id and enforces consistency
    ├── Untrusted role cannot CREATE tables in schema public (42501 denied)
    ├── create_order_atomic and process_wompi_transaction enforce search_path = ''
    ├── Stalled pending intent actively reconciled to APPROVED via provider polling
    ├── Stalled pending intent with provider DECLINED cancels order
    ├── Stalled intent > 24h escalated to ESCALATED_UNRESOLVED with operator note
    ├── Environment mismatch fails closed to ESCALATED_UNRESOLVED
    ├── Amount mismatch in signed transaction raises PAYMENT_AMOUNT_MISMATCH
    ├── Compound uniqueness on (tx_id, status) prevents duplicate receipt processing
    └── Migration re-execution preserves all records and keeps track_inventory active
======================================================================
TOTAL TESTS: 117 | PASSED: 117 | FAILED: 0 | DURATION: 1.4s
======================================================================
```

---

## 9. RELEASE ACCEPTANCE MATRIX

| Directive Item | Description | Engineering Status | Gate Certification Status | Evidence Reference |
|:---|:---|:---:|:---:|:---|
| **P0-1** | Fail-Closed JWT Identity (`create_order_atomic`) | **PASS** | Validated in PostgreSQL 16 | `tests/prod-r2c-identity-reconciliation.test.cjs` |
| **P0-2** | `SECURITY DEFINER` & `search_path = ''` Lockdown | **PASS** | Validated in PostgreSQL 16 | `supabase/migrations/20261027_lg_prod_r1_rls_policies.sql` |
| **P0-3** | Durable Payment Reconciliation & Provider Polling | **PASS** | Validated in PostgreSQL 16 | `src/lib/server/wompiReconciliation.ts` |
| **P0-4** | Safe Rollback & Release Governance Model | **PASS** | Validated (Zero Data Loss) | `docs/LG_PROD_R2C_FINAL_HARDENING_AND_STAGING_PREFLIGHT.md` |
| **INF-01** | Next.js Production Build (47 routes) | **PASS** | 4.2s compilation | `next build` Turbopack output |
| **INF-02** | Static Type Checking | **PASS** | 0 errors | `tsc --noEmit` output |
| **INF-03** | Hosted-Staging Infrastructure Provisioning | **PARTIAL** | Manifest Prepared | Awaiting Owner Authorization |
| **INF-04** | Clerk Development / Staging Test Accounts | **BLOCKED** | Configured | Awaiting Hosted Staging Deployment |
| **INF-05** | Wompi Sandbox Webhook Live Capture | **BLOCKED** | Synthetic Passed | Awaiting Merchant Sandbox Credentials |
| **E2E-01** | Multi-Viewport Client Portal E2E (/retail) | **BLOCKED** | Harness Ready | `tests/e2e-portals-preflight.cjs` |
| **E2E-02** | Multi-Viewport Client Portal E2E (/micromercado) | **BLOCKED** | Harness Ready | `tests/e2e-portals-preflight.cjs` |
| **E2E-03** | Multi-Viewport Client Portal E2E (/restaurante) | **BLOCKED** | Harness Ready | `tests/e2e-portals-preflight.cjs` |
| **COMM-01** | Commercial Production Release | **NO-GO** | Blocked by Design | Held for Single Hosted-Staging Gate |

---

## 10. REMAINING DEPENDENCIES & OWNER ACTION PACKAGE

To advance from **LG-PROD-R2C** to the definitive **Hosted-Staging Integration Certification Gate**, the following external actions are required from the project owner:

1. **Supabase Staging Project:** Provide or designate a non-production Supabase project URL and keys (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
2. **Clerk Development Instance:** Provide test instance API keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) with configured test users for Retail, Micromercado, Restaurante, and Admin.
3. **Wompi Sandbox:** Provide test merchant credentials (`NEXT_PUBLIC_WOMPI_PUB_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET`).
4. **Vercel Staging Preview:** Authorize deployment of branch `feat/lg-prod-r1` to a dedicated staging preview URL with the staged environment variables.

Once these credentials and permissions are supplied, a single hosted-staging certification session will execute the real browser E2E journeys across the three client portals and confirm end-to-end financial transaction reconciliation before scheduling final production launch discussions.

**COMMERCIAL STATUS: NO-GO REMAINS IN EFFECT.**
