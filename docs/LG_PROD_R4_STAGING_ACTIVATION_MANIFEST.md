# LA GAVIOTA — LG-PROD-R4: REPRODUCIBLE STAGING CANDIDATE MANIFEST & RESOURCE AUDIT
**APEX AI SOLUTIONS · RELEASE ASSURANCE & SYSTEMS ARCHITECTURE**  
**Date:** October 28, 2026  
**Project:** Frutas y Verduras La Gaviota (`packages/la-gaviota`)  
**Active Branch:** `feat/lg-prod-r1`  
**Commercial Status:** **STRICT NO-GO MAINTAINED (Pending Hosted Staging Certification)**  

---

## 1. IMMUTABLE CANDIDATE PROVENANCE & TECHNICAL IDENTITY

To guarantee reproducibility and prevent deploying an uncertified variant, the exact deployable candidate snapshot is cryptographically fingerprinted below:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        IMMUTABLE CANDIDATE PROVENANCE MANIFEST                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Git Branch:                  feat/lg-prod-r1                                          │
│  Historical Base Commit:      49add73ae90b837c36553a0f2b535267c9610143                │
│  Working Tree SHA:            bd5c56f5f0ad52564bc4189bd0698ba18cc2f954                │
│  Comprehensive Diff SHA-256:  c4f6ad66b6afb69255e32c4c61406c40ea24b9045baca2efce9e1...│
│  package-lock.json SHA-256:   4dd9bbbdd1b8d2edeaf874024295cb63826146328d662bebb308...│
│  Migration SQL SHA-256:       92f4c4fc854ff256f73169706dde9761b0080ff332e0515fc088b...│
│  TypeScript Check:            0 errors (`tsc --noEmit --incremental false`)            │
│  Next.js Turbopack Build:     47 / 47 routes compiled cleanly (Exit Code 0)            │
│  Automated Test Suite:        123 / 123 PASS (100% pass rate in 2.87s)                 │
│  PostgreSQL 16.15 Tests:      48 / 48 PASS (Concurrency, Invariants, RLS, Deadlocks)   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. INVENTORY OF DEPLOYABLE ARTIFACT COMPONENTS

The deployable candidate consists of the base commit plus the verified working-tree layers:

### A. Database Migrations & Security Boundaries
* `supabase/migrations/20261027_lg_prod_r1_rls_policies.sql` (SHA-256: `92f4c4...`):
  - Strict `REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated;`
  - `SET search_path = ''` on `public.create_order_atomic`, `public.process_wompi_transaction`, and `lg_auth.*` helper functions.
  - Fail-closed Clerk JWT `sub` verification matching `clerk_user_id` when `caller_role = 'authenticated'`.
  - Non-destructive payment decline: records `payment_status = 'declined'` while preserving commercial order `status = 'Pendiente'`.
  - Compound deduplication index `idx_wompi_receipts_tx_status` on `wompi_event_receipts(provider_transaction_id, status)`.

### B. Transactional Core, Reconciliation & Scheduler
* `src/lib/server/wompiReconciliation.ts`:
  - Active reference polling fallback when `provider_transaction_id` is null.
  - Priority selection of `APPROVED` transactions over previous `DECLINED` attempts.
  - Decoupled commercial order lifecycle: 24h exhaustion routes intent to `ESCALATED_UNRESOLVED` and sets `orders.payment_status = 'pending_review'` without unilateral cancellation.
  - Explicit operational kill switch (`RECONCILIATION_DISABLED=true`).
  - Durable job telemetry insertion into `public.audit_logs`.
* `app/api/cron/reconcile-wompi/route.ts`:
  - Dual HTTP method support (`GET` for Vercel Cron, `POST` for external runners / webhooks).
  - Constant-time `timingSafeEqual` authentication against `CRON_SECRET` (>= 32 chars).
* `vercel.json`:
  - Production cron schedule registration (`*/15 * * * *`).
* `scripts/trigger-staging-reconciliation.sh`:
  - Authenticated external trigger script for preview/staging environments where Vercel crons do not run automatically.
* `.github/workflows/staging-reconciliation.yml`:
  - Staging scheduler workflow template for automated 15-minute dispatch.

### C. Client Portals & Multi-Viewport E2E Test Suite
* `tests/e2e-portals-preflight.cjs`:
  - Playwright harness covering 3 Customer Portals (`/retail`, `/micromercado`, `/restaurante`) across 5 viewports (`360px`, `390px`, `768px`, `1024px`, `1440px`).
* `tests/prod-r3-staging-preflight.test.cjs`:
  - Real PostgreSQL 16.15 suite asserting reference query fallback, payment retry separation, multi-tx priority, non-destructive exhaustion, and scheduler security.

---

## 3. AUDIT OF THE FOUR ISOLATED STAGING RESOURCES

Before performing any external mutation or remote integration test, the current environment state has been audited:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        STAGING RESOURCE AUDIT & STATUS                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Resource 1: Supabase Non-Production Project ────────► NOT DESIGNATED (BLOCKED) │
│  Resource 2: Clerk Development Instance ─────────────► PRESENT (NEEDS CONFIRM)  │
│  Resource 3: Wompi Sandbox Merchant ─────────────────► NOT CONFIGURED (BLOCKED) │
│  Resource 4: Vercel Staging Target & Scheduler ──────► NOT DESIGNATED (BLOCKED) │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Resource 1: Supabase Staging Project
* **Current Local Setting:** `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL = https://tcjeiizrarwerarcfyky.supabase.co`.
* **Finding:** `tcjeiizrarwerarcfyky` is the **production catalog database** containing live product records, pricing, and photography bucket objects.
* **Hard Stop Enforcement:** **PROHIBITED TO TOUCH.** Applying test migrations, synthetic orders, or test profiles to `tcjeiizrarwerarcfyky` violates the hard stop directive.
* **Requirement:** An independent, isolated Supabase project must be provided by the owner (e.g. `https://<staging-id>.supabase.co`).

### Resource 2: Clerk Development Instance
* **Current Local Setting:** `.env.local` contains `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starting with `pk_test_...` and bound to instance `discrete-orca-86.clerk.accounts.dev`.
* **Finding:** This is an active Clerk Development instance.
* **Requirement:** Owner confirmation is required:
  - Is `discrete-orca-86.clerk.accounts.dev` authorized to be populated with the synthetic test users (`retail_user_a`, `retail_user_b`, `micro_user`, `restaurante_user`, `operario_user`, `admin_user`), or should a dedicated staging Clerk application be created?

### Resource 3: Wompi Sandbox Merchant
* **Current Local Setting:** No Wompi keys (`NEXT_PUBLIC_WOMPI_PUB_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET`) exist in `.env.local` or environment variables.
* **Finding:** Online payment testing is completely blocked until test sandbox credentials are provided.
* **Requirement:** A Wompi Sandbox merchant account must be designated by the owner with test keys (`pub_stag_test_...`, `prv_stag_test_...`, integrity secret, and events secret) and the staging webhook endpoint URL configured in the Wompi dashboard.

### Resource 4: Vercel Staging Target & Reconciliation Scheduler
* **Current Local Setting:** No staging Vercel deployment URL is bound.
* **Finding:** Vercel Cron does not execute on Preview deployments, and Hobby plan limits crons to 1/day.
* **Requirement:** Owner must designate:
  1. Staging deployment URL (e.g. dedicated Vercel project with its own production target, or protected preview URL).
  2. Authorized runner vehicle (e.g. external cron runner executing `scripts/trigger-staging-reconciliation.sh` with `CRON_SECRET`).

---

## 4. PROPOSED ORDER OF EXECUTION (POST-AUTHORIZATION)

Once the four resources are formally authorized and provided, Antigravity will execute the certification gates in strict sequential order:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     STAGING INTEGRATION EXECUTION SEQUENCE                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  GATE A: Candidate Freeze ──► Verify sha256 of candidate bundle before deploy   │
│  GATE B: Supabase + Clerk ──► Apply migration to staging DB; test JWT RLS via   │
│                               real HTTP requests with synthetic Clerk users     │
│  GATE C: Client Portals ────► Playwright journeys for Retail, Micro, Rest across│
│                               5 viewports (pricing, orders, balances, reorder)  │
│  GATE D: Wompi Sandbox ─────► End-to-end sandbox payments (approved, declined,   │
│                               retried, duplicate webhooks, reference query)     │
│  GATE E: Release Assurance ─► Recovery rehearsal, audit verification, delivery   │
│                               of final certification matrix                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Gate B Details (Supabase + Clerk):
- Apply `supabase/migrations/20261027_lg_prod_r1_rls_policies.sql` to designated staging Supabase project only.
- Provision synthetic test users in Clerk Development:
  - Retail Customer A (`test-retail-a@staging.lagaviotafruver.com`)
  - Retail Customer B (`test-retail-b@staging.lagaviotafruver.com`)
  - Micromercado Customer (`test-micro@staging.lagaviotafruver.com`)
  - Restaurante Customer (`test-restaurante@staging.lagaviotafruver.com`)
  - Operario (`test-operario@staging.lagaviotafruver.com`)
  - Admin (`test-admin@staging.lagaviotafruver.com`)
- Test authentic HTTP requests passing Clerk session JWTs to PostgREST, asserting:
  - Anonymous role is denied direct mutations.
  - Retail Customer A cannot view or mutate Retail Customer B's orders (`RLS` denial).
  - Cross-tier price forging is rejected.
  - `create_order_atomic` successfully persists matching authenticated orders.

### Gate C Details (Client Portals E2E):
- Run `tests/e2e-portals-preflight.cjs` against the hosted staging URL.
- Test across 360px, 390px, 768px, 1024px, and 1440px viewports.
- Assert DOM state, real database persistence, tier pricing, balance deduction, fresh-quote reorder, and unauthenticated redirects.

### Gate D Details (Wompi Sandbox & Reconciliation):
- Execute synthetic Wompi Sandbox transactions with official test cards.
- Verify webhook delivery, signature validation, atomic balance adjustment, and order settlement.
- Verify DECLINED attempt followed by APPROVED retry on identical merchant reference.
- Verify `DefaultWompiApiAdapter.getTransactionByReference` against the live Wompi sandbox endpoint.
- Verify reconciliation worker execution and audit record persistence.

### Gate E Details (Release Assurance):
- Non-destructive migration replay test on staging.
- Observability and alert simulation.
- Compile final release recommendation.

---

## 5. HARD STOP COMPLIANCE

* **Zero Production Touches:** `tcjeiizrarwerarcfyky.supabase.co` and `lagaviotafruver.com` remain strictly isolated and unmodified.
* **Zero Credential Exfiltration:** No secrets are requested or printed in logs or chat.
* **Zero Data Loss:** Rehearsals are constrained to disposable PostgreSQL 16.15 and synthetic staging projects.
* **Strict NO-GO Maintained:** No deployment to production authorized.
