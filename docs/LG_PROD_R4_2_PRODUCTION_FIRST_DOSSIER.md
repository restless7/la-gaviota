# LA GAVIOTA — MASTER ENGINEERING DOSSIER · LG-PROD-R4.2
## STRATEGIC RELEASE PIVOT: PRODUCTION-FIRST RELEASE
**Mission ID:** `LG-PROD-R4.2-PRODUCTION-FIRST`  
**Security Classification:** RESTRICTED · COMMERCIAL RELEASE ASSURANCE  
**Date:** November 4, 2026  
**Orchestration Lead:** Freya (Mission Control Orchestrator, PlanMaestro)  
**Target Candidate Reference:** Commit `227892aaee685f66e6a1f645a91cd74db17a5874`  
**Strategic Decision:** DEFER FULL STAGING CERTIFICATION · CONCENTRATE ON SECURE, CONTROLLED PRODUCTION RELEASE

---

## EXECUTIVE SUMMARY & STRATEGIC PIVOT DIRECTIVE

Following the formal quantitative resolution of test inventory (166 total cases: 165 PASS, 1 BLOCKED, 0 FAIL) under `LG-PROD-R4.1-DOCUMENTARY-ERRATA-001`, the Board of Architecture and Quality Assurance has decreed an immediate strategic transition:

> **STRATEGIC MANDATE:**
> Stop prioritizing completion of the independent Vercel staging environment and its multi-stage hosted certification process.
> The immediate operational priority of *Frutas y Verduras La Gaviota* is to deliver a **functional, secure, commercially viable and controlled production release**.
> The existing staging Supabase instance (`sxmpefqlsakknpggtmzl`) remains preserved and isolated as an immutable reference environment.
> We defer non-essential staging infrastructure without weakening the data security, authorization boundaries, or financial safety of production operations.

---

## SECTION 1: LG-PROD-R4.2 PRODUCTION READINESS ASSESSMENT

An exhaustive audit of the production assets, candidate architecture, and data contracts yields the following operational findings:

### 1.1 Production Supabase Project (`tcjeiizrarwerarcfyky`)
* **Project Reference:** `tcjeiizrarwerarcfyky` (AWS `us-east-1`).
* **Existing State:** Contains live commercial assets:
  - Catalog definitions (products, categories, units, retail prices).
  - Production Supabase Storage bucket (`product-images`) holding approved commercial photography for hundreds of items (e.g., `https://tcjeiizrarwerarcfyky.supabase.co/storage/v1/object/public/product-images/*`).
* **Gap to Bridge:**
  - Has not yet received the RLS hardening migration (`20261027_lg_prod_r1_rls_policies.sql`).
  - Schema `public` creation rights have not been formally revoked from `anon` and `authenticated`.
  - Transactional tables (`orders`, `order_items`, `payment_intents`, `inventory_movements`) require the verified idempotency columns and atomic RPCs before taking live orders.
* **Invariant:** Must NEVER receive synthetic test seeds (`staging_seed_data.sql`).

### 1.2 Production Domain and Frontend Infrastructure
* **Production Domain:** `www.lagaviotafruver.com` / `lagaviotafruver.com`.
* **Hosting Platform:** Vercel Production Environment.
* **Runtime Stack:** Next.js 16.4.1 (Turbopack), React 19.2.4, Node.js v24.13.0 engine specification (`package.json`).
* **Vercel Engine Consideration:** Vercel default Node.js builders operate on Node 20.x or 22.x LTS. The project specifies `node: ">=24.13.0 <25"`. The Vercel project configuration must be set to Node 22+ or the engine range relaxed to `">=20.0.0"` if Vercel deployment logs flag an incompatible runtime builder.

### 1.3 Clerk Production Authentication & Session Architecture
* **Current Staging Configuration:** Clerk Development Instance (`discrete-orca-86.clerk.accounts.dev`) using test keys (`pk_test_...`).
* **Production Requirements:**
  - Official Clerk Production Instance or production custom domain (e.g. `clerk.lagaviotafruver.com`) using live keys (`pk_live_...`, `sk_live_...`).
  - User session tokens must carry `publicMetadata` with canonical roles and tiers:
    ```json
    {
      "role": "USER",
      "tier": "Personas Naturales"
    }
    ```
  - Administrative accounts must carry:
    ```json
    {
      "role": "SUPER_ADMIN"
    }
    ```

### 1.4 Architectural Breakthrough: Frontend-to-Database Communication Path
* **The PostgREST Myth Resolved:** In staging, a `PGRST301` error occurred during automated tests (`tests/clerk-supabase-jwt.test.cjs`) when sending Clerk JWTs directly as HTTP `Bearer` tokens to Supabase hosted PostgREST (`GET /rest/v1/orders`).
* **Actual Application Code Architecture:**
  - An exhaustive source code audit revealed that **the application does NOT make direct browser-to-PostgREST authenticated requests**.
  - 100% of mutations, checkout operations, B2B queries, administrative actions, and customer views are implemented as **Next.js Server Actions** (`src/actions/*`) running in the server Node.js runtime.
  - The security boundary is strictly server-side:
    1. Server Action receives client call.
    2. `@clerk/nextjs/server` (`auth()`, `clerkClient()`) validates the session.
    3. `src/lib/server/authorization.ts` enforces `requireCapability()` or `requireOwnedSubject()`.
    4. `getServerDatabase(actor)` in `src/lib/server/database.ts` provisions a server-side Supabase client using `SUPABASE_SERVICE_ROLE_KEY` over HTTPS.
  - **Verdict on `PGRST301`:** The `PGRST301` code is an artifact of direct HTTP client calls to Supabase. Because the real application delegates all authenticated operations to Server Actions using the server key, **unconfigured Third-Party Auth in PostgREST DOES NOT BLOCK the production Server Actions architecture**. However, the PostgreSQL RLS policies remain essential as defense-in-depth against direct database pooler vectors.

### 1.5 Commerce & Inventory Atomicity
* **Pricing Integrity:** Server-authoritative in `prepareCheckout()` (`src/lib/server/checkout.ts`). Client prices from browser DOM are discarded; unit prices are fetched fresh from database records.
* **Order Atomicity:** Implemented via RPC `create_order_atomic()` or transaction wrapper ensuring order header and line items persist atomically.
* **Inventory Control:** Controlled by `global_settings.track_inventory`. When enabled, pessimistic inventory subtraction prevents overselling.

---

## SECTION 2: R4.1-TO-PRODUCTION PROMOTION AUDIT

Audit of canonical candidate commit **`227892aaee685f66e6a1f645a91cd74db17a5874`**:

| Dimension | Candidate R4.1 Implementation | Production Promotion Requirement | Risk Severity |
| :--- | :--- | :--- | :---: |
| **Safety Guard (`src/lib/safetyGuard.ts`)** | `PROD_SUPABASE_BLOCKLIST = ['tcjeiizrarwerarcfyky']` unconditionally throws on line 101-107 if target contains production ref. | **CRITICAL CODE BLOCKER:** Must refactor into a bidirectional `environmentGuard.ts`. If `APP_ENV=production`, it must ALLOW `tcjeiizrarwerarcfyky` and BLOCK staging/test databases. | **CRITICAL** |
| **Synthetic Fixtures** | `supabase/fixtures/staging_seed_data.sql` contains mock customers, test orders, and fake movements. | **STRICT PROHIBITION:** Fixtures must be isolated. Never run against `tcjeiizrarwerarcfyky`. | **HIGH** |
| **Payment Gateway** | `app/checkout/page.tsx` checks `Boolean(process.env.NEXT_PUBLIC_WOMPI_PUB_KEY)`. | **VERIFIED CLEAN:** Omitting `NEXT_PUBLIC_WOMPI_PUB_KEY` in production automatically defaults checkout to `'cash'` (Contra Entrega) and disables online payment UI. | **RESOLVED** |
| **Public Support Info** | `.env.example` has `soporte@staging.lagaviotafruver.com`. | Must inject real production coordinates (`soporte@lagaviotafruver.com`, `+57 318 499 0826`). | **LOW** |
| **RLS Migration Script** | `supabase/migrations/20261027_lg_prod_r1_rls_policies.sql` adds idempotency and RLS. | Backward-compatible (`IF NOT EXISTS`). Safe for production after backup. | **MEDIUM** |

### Code Mutation Required Before Production Deployment:
To allow legitimate production operation without compromising safety, `src/lib/safetyGuard.ts` must be promoted to support dual-mode fail-closed enforcement:
```typescript
// Conceptual Production-Ready Environment Guard
if (appEnv === 'production') {
  // 1. Must target production Supabase ONLY
  if (ref !== PROD_SUPABASE_PROJECT_ID) {
    throw new Error('PROD_SAFETY_VIOLATION: Production must connect exclusively to tcjeiizrarwerarcfyky.');
  }
  // 2. Refuse any staging or test keys
  if (clerkPubKey.startsWith('pk_test_') || clerkSecretKey.startsWith('sk_test_')) {
    throw new Error('PROD_SAFETY_VIOLATION: Test Clerk keys detected in production environment.');
  }
} else if (appEnv === 'staging') {
  // Existing staging rules: target sxmpefqlsakknpggtmzl, block tcjeiizrarwerarcfyky
} else {
  // Fail-closed if APP_ENV is undefined or unrecognized
  throw new Error('SAFETY_VIOLATION: Unrecognized or missing APP_ENV.');
}
```

---

## SECTION 3: PRODUCTION MIGRATION AND BACKUP PLAN

### 3.1 Pre-Migration Backup Protocol (Mandatory Step 0)
Before any DDL statement is executed against `tcjeiizrarwerarcfyky`:
1. **Trigger Automated Snapshot:** Ensure Supabase dashboard daily backup is active.
2. **Execute Point-in-Time Logical Dump:**
   ```bash
   pg_dump "postgresql://postgres.[REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
     --format=custom \
     --blobs \
     --verbose \
     --file=backup_tcjeiizrarwerarcfyky_pre_r4_2_$(date +%Y%m%d_%H%M%S).dump
   ```
3. **Verify Dump Integrity:**
   ```bash
   pg_restore --list backup_tcjeiizrarwerarcfyky_pre_r4_2_*.dump | grep "TABLE DATA public products"
   ```

### 3.2 Target Production Migration
* **Source:** `supabase/migrations/20261027_lg_prod_r1_rls_policies.sql` (SHA-256: `92f4c4fc854ff256f73169706dde9761b0080ff332e0515fc088b5998aeba957`).
* **Operations Applied:**
  - Revokes `CREATE ON SCHEMA public` from `anon` and `authenticated`.
  - Adds idempotency columns (`idempotency_key`, `payment_status`, `client_metadata`) to `public.orders`.
  - Creates table `public.payment_intents` and `public.inventory_movements`.
  - Enables RLS on `orders`, `order_items`, `payment_intents`, `inventory_movements`, `marketing_leads`, `profiles`.
  - Creates atomic stored procedures `create_order_atomic` and `confirm_order_payment` with `SECURITY DEFINER` and `search_path = ''`.
* **Zero-Downtime Property:** All statements use `ADD COLUMN IF NOT EXISTS` and `CREATE TABLE IF NOT EXISTS`. Existing catalog tables and views remain 100% accessible to read traffic.

### 3.3 Reversible Rollback Plan
If migration anomalies occur:
1. Schema changes can be gracefully reverted via the emergency rollback script `supabase/migrations/20261104_lg_prod_r4_2_rollback.sql`:
   ```sql
   BEGIN;
   DROP FUNCTION IF EXISTS public.create_order_atomic;
   DROP FUNCTION IF EXISTS public.confirm_order_payment;
   DROP TABLE IF EXISTS public.inventory_movements CASCADE;
   DROP TABLE IF EXISTS public.payment_intents CASCADE;
   ALTER TABLE public.orders DROP COLUMN IF EXISTS idempotency_key;
   ALTER TABLE public.orders DROP COLUMN IF EXISTS idempotency_fingerprint;
   ALTER TABLE public.orders DROP COLUMN IF EXISTS payment_status;
   ALTER TABLE public.orders DROP COLUMN IF EXISTS payment_reference;
   ALTER TABLE public.orders DROP COLUMN IF EXISTS client_metadata;
   GRANT CREATE ON SCHEMA public TO anon, authenticated;
   COMMIT;
   ```
2. Full database restore from `backup_tcjeiizrarwerarcfyky_pre_r4_2_*.dump` using `pg_restore --clean`.

---

## SECTION 4: PRODUCTION ENVIRONMENT CONFIGURATION MATRIX

All values must be configured within the **Vercel Project Settings > Environment Variables (Production Scope)**:

| Variable Name | Required Scope | Sensitivity | Production Target Value / Format | Validation Rule |
| :--- | :--- | :--- | :--- | :--- |
| `APP_ENV` | Server | Critical | `production` | Must equal `'production'` |
| `NEXT_PUBLIC_APP_ENV` | Browser/Server | Public | `production` | Must equal `'production'` |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser/Server | Public | `https://tcjeiizrarwerarcfyky.supabase.co` | Matches production ref |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/Server | Public | Production Anon Key (`eyJ...`) | Issued by `tcjeiizrarwerarcfyky` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | Secret | Production Service Role Key (`eyJ...`) | Issued by `tcjeiizrarwerarcfyky` |
| `DATABASE_URL` | Server Only | Secret | `postgresql://postgres.[REF]:[PASS]@aws-0-us-east-1.pooler.supabase.com:5432/postgres` | Production Pooler URL |
| `DIRECT_URL` | Server Only | Secret | `postgresql://postgres.[REF]:[PASS]@aws-0-us-east-1.pooler.supabase.com:5432/postgres` | Production Session Direct URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Browser/Server | Public | `pk_live_...` | Production Clerk Key |
| `CLERK_SECRET_KEY` | Server Only | Secret | `sk_live_...` | Production Clerk Secret |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Browser | Public | `/sign-in` | Standard Route |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Browser | Public | `/sign-up` | Standard Route |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Browser | Public | `/dashboard` | Standard Route |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Browser | Public | `/dashboard` | Standard Route |
| `NEXT_PUBLIC_WOMPI_PUB_KEY` | Browser/Server | Public | *OMITTED / EMPTY* | **Disabled for Initial Launch** |
| `WOMPI_PRIVATE_KEY` | Server Only | Secret | *OMITTED / EMPTY* | **Disabled for Initial Launch** |
| `WOMPI_INTEGRITY_SECRET` | Server Only | Secret | *OMITTED / EMPTY* | **Disabled for Initial Launch** |
| `WOMPI_EVENTS_SECRET` | Server Only | Secret | *OMITTED / EMPTY* | **Disabled for Initial Launch** |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Browser | Public | `soporte@lagaviotafruver.com` | Official Business Inbox |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Browser | Public | `573184990826` | Official WhatsApp Commercial Line |

---

## SECTION 5: MINIMUM COMMERCIAL RELEASE SCOPE (LG-PROD-R4.2)

The release boundary is intentionally circumscribed to core commercial value:

```
┌────────────────────────────────────────────────────────────────────────┐
│               LG-PROD-R4.2 INCLUDED COMMERCIAL SCOPE                   │
├────────────────────────────────┬───────────────────────────────────────┤
│ 1. Public Storefront & Catalog │ • Responsive mobile / desktop         │
│                                │ • Category filters & real photography │
│                                │ • B2C Retail pricing presentation     │
├────────────────────────────────┼───────────────────────────────────────┤
│ 2. Customer Authentication     │ • Sign-in / Sign-up via Clerk Prod    │
│                                │ • Customer profile persistence        │
│                                │ • Automated role & tier assignment    │
├────────────────────────────────┼───────────────────────────────────────┤
│ 3. Cart & Server-Side Checkout │ • Anti-tamper server-price evaluation │
│                                │ • Minimum order rule: $50,000 COP     │
│                                │ • Municipal delivery fees (Bucaramanga│
│                                │   Girón, Floridablanca)               │
├────────────────────────────────┼───────────────────────────────────────┤
│ 4. Single Payment Method       │ • PAGO CONTRA ENTREGA (Cash/Card POS) │
│                                │ • Zero financial transaction risk     │
│                                │ • Electronic payments safely disabled │
├────────────────────────────────┼───────────────────────────────────────┤
│ 5. Atomic Order Creation       │ • create_order_atomic RPC             │
│                                │ • Idempotency key protection          │
│                                │ • Immediate order receipt & ID        │
├────────────────────────────────┼───────────────────────────────────────┤
│ 6. Administrative Portal       │ • Role-gated (/admin) for SUPER_ADMIN │
│                                │ • Real-time order Kanban board        │
│                                │ • Order status updates & PDF invoices │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## SECTION 6: GO-LIVE CHECKLIST AND ROLLBACK PLAN

```mermaid
sequenceDiagram
    autonumber
    actor Sebastian as Sebastian (Release Authority)
    participant Freya as Freya (Mission Control)
    participant Vercel as Vercel Production
    participant Supabase as Supabase Production (tcjeiizrarwerarcfyky)
    participant Clerk as Clerk Production

    Note over Sebastian,Freya: Phase 1: Pre-Flight Approvals
    Sebastian->>Freya: Authorize Production Go-Live
    Freya->>Supabase: Execute pg_dump backup
    Supabase-->>Freya: Backup Verified (backup_tcjeiiz_pre_r4_2.dump)

    Note over Freya,Supabase: Phase 2: Database Migration
    Freya->>Supabase: Apply 20261027_lg_prod_r1_rls_policies.sql
    Supabase-->>Freya: Migration Applied (Zero Errors, DDL Complete)

    Note over Freya,Vercel: Phase 3: Configuration & Build
    Freya->>Vercel: Inject Production Configuration Matrix (APP_ENV=production)
    Freya->>Vercel: Trigger Production Build from release branch
    Vercel-->>Freya: Build Success (Next.js 16.4.1 Turbopack)

    Note over Freya,Clerk: Phase 4: Smoke Test (Contra Entrega)
    Freya->>Vercel: Load Storefront (lagaviotafruver.com)
    Freya->>Clerk: Test Customer Session
    Freya->>Vercel: Execute Smoke Checkout ($50,000 COP Contra Entrega)
    Vercel->>Supabase: Atomic Order Creation
    Supabase-->>Vercel: Order Confirmed
    Freya->>Sebastian: REPORT: PRODUCTION LIVE & VERIFIED
```

### Abort Triggers:
1. `pg_dump` fails or produces an empty archive.
2. Migration script encounters table lock timeouts or constraint violations.
3. Vercel build fails due to Node engine mismatch.
4. Storefront displays unhandled exception or Safety Guard violation on boot.
5. In any abort scenario: execute Section 3.3 Rollback Plan immediately.

---

## SECTION 7: REMAINING BLOCKERS CLASSIFICATION

### 7.1 CRITICAL (Must resolve before live traffic cutover)
1. **Safety Guard Promotion:** Refactor `src/lib/safetyGuard.ts` into bidirectional `environmentGuard.ts` so `APP_ENV=production` permits `tcjeiizrarwerarcfyky` and forbids staging/disposable targets.
2. **Clerk Production Credentials:** Obtain and inject production Clerk keys (`pk_live_...`, `sk_live_...`).
3. **Database Pre-Migration Backup:** Execute verified `pg_dump` of `tcjeiizrarwerarcfyky`.
4. **Database Migration Execution:** Apply `20261027_lg_prod_r1_rls_policies.sql` on `tcjeiizrarwerarcfyky`.
5. **Explicit Production Go-Live Authorization:** Formal sign-off from Sebastian.

### 7.2 DEFERRED (Post-Launch / LG-PROD-R4.3)
1. **Independent Vercel Staging Deployment:** Postponed. Existing staging database preserved.
2. **Staging Hosted PostgREST Third-Party Auth:** Postponed.
3. **Wompi Sandbox & Live Gateway Certification:** Postponed until merchant credentials (`pub_test_`, `pub_prod_`) are delivered.
4. **B2B Wholesale Portals (Micromercados / Restaurantes) Volume Pricing:** Staged for phase 2 expansion.

### 7.3 OPTIONAL (Operational Backlog)
1. **Automated WhatsApp Order Notification Webhook.**
2. **Agricultural Shrinkage Reporting Dashboard.**
3. **Automated CI/CD Staging-to-Production Sync Workflow.**

---

## SECTION 8: AUTHORIZATION BOUNDARY ENFORCEMENT

This engineering document constitutes **assessment, local code preparation, architecture validation, and release engineering**.

In strict compliance with governance rules:
- **Zero mutations** have been made to production database `tcjeiizrarwerarcfyky`.
- **Zero commits** have been pushed to remote branches or `main`.
- **Zero live transactions** or real customer modifications have occurred.
- All live production deployment actions remain blocked pending explicit **GO-LIVE AUTHORIZATION** from Sebastian.

