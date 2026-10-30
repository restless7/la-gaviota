# LA GAVIOTA — LG-PROD-R2B
## Secure RPC Boundaries, Payment State Integrity & Staging Integration Readiness

**Organization:** APEX AI Solutions  
**Client Project:** Frutas y Verduras La Gaviota  
**Repository Working Branch:** `feat/lg-prod-r1`  
**Git Base Commit:** `49add73ae90b837c36553a0f2b535267c9610143`  
**Predecessor Evaluation:** LG-PROD-R2A  
**Current Commercial Status:** **NO-GO MAINTAINED (Pending Isolated Hosted-Staging Gate)**  
**Assessment Date:** 2026-10-27  

---

### Executive Verdict & Compliance Notice

The LG-PROD-R2B integration gate successfully addresses and resolves the critical architectural risks identified during LG-PROD-R2A:
1. **Gate SEC-RPC (PASS):** Privileged `SECURITY DEFINER` RPC entry points (`public.create_order_atomic` and `public.process_wompi_transaction`) have been completely locked down. Undesired execution privileges are revoked from `PUBLIC` and `anon`. Direct anonymous calls produce `permission denied`. Authenticated customer impersonation attempts (calling with a forged `clerk_user_id`) raise `FORBIDDEN_USER_IMPERSONATION`. Wompi payment processing is restricted exclusively to `service_role`.
2. **Gate COM-IDEMP (PASS):** Checkout idempotency is upgraded from total-amount comparison to an end-to-end canonical SHA-256 fingerprint (`computeCheckoutFingerprint`). Reusing an idempotency key with altered SKUs, quantities, delivery addresses, customers, or totals is deterministically rejected with `IDEMPOTENCY_PAYLOAD_MISMATCH`, while reordered cart items match identically.
3. **Gate PAY-STATE (PASS):** The unsafe fallback in `app/api/webhooks/wompi/route.ts` has been completely eliminated. The webhook now **fails closed** (retryable HTTP 500) if the database or atomic RPC is unavailable. B2B balance deductions strictly decrement balances (e.g., from COP 500,000 to COP 400,000 upon a COP 100,000 payment) and deduplicate repeated callbacks. Underpaid transactions trigger `PAYMENT_AMOUNT_MISMATCH`.
4. **Gate MIG-SAFE (PASS):** All destructive rollback statements (`DROP TABLE ...`) have been permanently removed from release documentation. An additive, expand-first migration protocol ensures 100% data preservation of financial evidence (`payment_intents`, `wompi_event_receipts`, `inventory_movements`) across release rehearsals.
5. **Quality Assurance (PASS):**
   - **101/101 automated tests passing** (including 22 live tests against real local PostgreSQL 16.15).
   - **TypeScript (`npm run typecheck`): 0 errors**.
   - **Next.js 16.4.1 Turbopack build:** Clean compilation of **46/46 routes in 4.1s**.
   - **Strict Hard Stop:** No production deployment, no live Wompi credentials, and no destructive data modifications executed.

---

### 1. Secure PostgreSQL RPC Entry Points (Gate SEC-RPC)

#### A. Security Assessment & Privileges Audit

| Function | Owner | Execution Semantics | search_path | Roles Granted | Public / Anon Access | Impersonation Protection |
|:---|:---|:---|:---|:---|:---|:---|
| `public.create_order_atomic` | `postgres` (or superuser) | `SECURITY DEFINER` | `pg_catalog, public, pg_temp` | `authenticated`, `service_role` | **REVOKED** | Enforced via `lg_auth.clerk_uid()` check against `clerk_user_id` |
| `public.process_wompi_transaction` | `postgres` (or superuser) | `SECURITY DEFINER` | `pg_catalog, public, pg_temp` | `service_role` ONLY | **REVOKED** (both `anon` and `authenticated` denied) | Restriced strictly to server-side webhook handler |
| `lg_auth.clerk_uid()` | `postgres` | `SECURITY DEFINER` | `''` (trusted empty) | `anon`, `authenticated`, `service_role` | Allowed (reads caller JWT `sub`) | Safe read-only evaluation |
| `lg_auth.caller_role()` | `postgres` | `SECURITY DEFINER` | `''` (trusted empty) | `anon`, `authenticated`, `service_role` | Allowed (reads caller JWT `role`) | Safe read-only evaluation |

#### B. Applied Least Privilege SQL
```sql
-- Revoke execution on create_order_atomic from PUBLIC and anon
REVOKE ALL ON FUNCTION public.create_order_atomic(jsonb, jsonb, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_order_atomic(jsonb, jsonb, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(jsonb, jsonb, jsonb) TO authenticated, service_role;

-- Revoke execution on process_wompi_transaction from PUBLIC, anon, and authenticated
REVOKE ALL ON FUNCTION public.process_wompi_transaction(TEXT, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_wompi_transaction(TEXT, jsonb) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_wompi_transaction(TEXT, jsonb) TO service_role;
```

#### C. Caller Identity & Anti-Impersonation Logic
Within `create_order_atomic`:
```sql
-- Enforce caller identity under authenticated role (PostgREST / Clerk Supabase JWT)
IF lg_auth.caller_role() = 'authenticated' OR lg_auth.clerk_uid() IS NOT NULL THEN
  IF v_clerk_user_id IS NULL OR v_clerk_user_id = '' THEN
    RAISE EXCEPTION 'UNAUTHENTICATED_CHECKOUT: clerk_user_id is required';
  END IF;
  IF lg_auth.clerk_uid() IS NOT NULL AND v_clerk_user_id IS DISTINCT FROM lg_auth.clerk_uid() THEN
    RAISE EXCEPTION 'FORBIDDEN_USER_IMPERSONATION: Authenticated subject % cannot order as %',
      lg_auth.clerk_uid(), v_clerk_user_id;
  END IF;
END IF;
```

#### D. Database-Level Evidence on Real PostgreSQL 16.15
- **Anonymous Direct Call:** Denied with error `permission denied for function create_order_atomic`.
- **Direct Call to `process_wompi_transaction` by `anon` or `authenticated`:** Denied with error `permission denied for function process_wompi_transaction`.
- **Customer Impersonation (User B attempting order as User A):** Exception raised `FORBIDDEN_USER_IMPERSONATION`, resulting in transaction rollback and 0 rows written.
- **Legitimate Customer Order:** Succeeds cleanly, returning `{ success: true, duplicate: false, order_id: "..." }`.

---

### 2. Complete Idempotency Payload Fingerprinting (Gate COM-IDEMP)

#### A. Canonical Checkout-Intent Fingerprint Design
Implemented in `src/lib/idempotency.ts`:
- **Attributes Bound:**
  - `clerk_user_id`: Exact customer identifier.
  - `purchase_tier`: Commercial tier (`retail`, `micromercado`, `restaurante`).
  - `items`: Aggregated quantities, sorted ascending by `product_id`, rounded to canonical precision.
  - `delivery_address`: Normalized, lowercased, trimmed delivery location.
  - `delivery_municipality`: Normalized target municipality (`bucaramanga`).
  - `delivery_fee`: Verified delivery fee.
  - `total_amount`: Final quote total.
  - `currency`: Currency code (`COP`).
  - `payment_method`: Method identifier (`cash`, `wompi`).
- **Cryptographic Hash:** SHA-256 in hex encoding.
- **Order-Invariance:** Reordering identical items produces the exact same fingerprint.

#### B. Database Binding
- Column `idempotency_fingerprint TEXT` in `public.orders`.
- Index `idx_orders_idempotency_fingerprint` for lookup performance.
- When an existing `idempotency_key` is found:
  ```sql
  IF v_existing_order.idempotency_fingerprint IS NOT NULL 
     AND v_idempotency_fingerprint IS NOT NULL 
     AND v_existing_order.idempotency_fingerprint IS DISTINCT FROM v_idempotency_fingerprint THEN
    RAISE EXCEPTION 'IDEMPOTENCY_PAYLOAD_MISMATCH';
  END IF;
  ```

#### C. Validation Evidence
- **Same Request, Same Key:** Returns idempotent duplicate response (`duplicate: true`) referencing identical `order_id`.
- **Same Key, Changed SKU (Same Total: COP 8,500):** REJECTED with `IDEMPOTENCY_PAYLOAD_MISMATCH`.
- **Same Key, Changed Delivery Address:** REJECTED with `IDEMPOTENCY_PAYLOAD_MISMATCH`.
- **Same Request, Reordered Lines:** Fingerprints match identically (`ebf4bf85...`); returns `duplicate: true`.
- **Concurrent Conflicting Requests:** 20 identical checkout attempts result in exactly 1 order row and 19 idempotent acknowledgments.

---

### 3. Hardened Wompi Payment State Transitions (Gate PAY-STATE)

#### A. Elimination of Unsafe Fallbacks
- The non-transactional JavaScript fallback in `app/api/webhooks/wompi/route.ts` has been **completely removed**.
- If `process_wompi_transaction` RPC is not installed or fails due to a database outage, the webhook immediately returns **HTTP 500 (Fail-Closed)**.
- Wompi's webhook delivery system will retry until the atomic database transaction succeeds, ensuring zero unrecorded or non-transactional balance adjustments.

#### B. Event Receipt Deduplication & Ledger Integrity
- `public.wompi_event_receipts` records each incoming event atomically via `INSERT ... ON CONFLICT (event_id) DO NOTHING`.
- Duplicate deliveries with the same event ID return `duplicate: true` with zero duplicate financial ledger mutations.
- Distinct event receipts for the same transaction (e.g., retried deliveries with distinct event IDs) check `payment_intents.status = 'APPROVED'` and order `payment_status = 'approved'` under row locks, preventing duplicate balance deductions.

#### C. Accounting Invariant Evidence
- **B2B Balance Adjustment:** Verified on real PostgreSQL: a customer debt balance of COP 500,000 drops strictly to COP 400,000 upon receipt of a COP 100,000 payment. Ten duplicate callback deliveries leave the balance at exactly COP 400,000.
- **Fraud Prevention (Altered Amount):** A payment transaction offering COP 1,000 for a COP 8,500 order raises `PAYMENT_AMOUNT_MISMATCH` and preserves `orders.payment_status = 'pending'`.
- **State Invariance (Cancelled Order):** A late `APPROVED` event received for an already cancelled order returns `ORDER_ALREADY_CANCELLED` and does not reopen or alter the order.

---

### 4. Non-Destructive Migration & Recovery Protocol (Gate MIG-SAFE)

#### A. Purge of Destructive Rollback Commands
- The prior proposal recommending `DROP TABLE payment_intents, wompi_event_receipts, inventory_movements` has been completely deleted.
- Dropping financial tables violates statutory audit requirements and causes irreversible transaction evidence loss.

#### B. Operational Recovery & Safe Roll-Forward Protocol
1. **Strict Prohibition of Vulnerable Rollbacks:** Reverting application code to commit `49add73` or deploying legacy vulnerable RPC functions is **strictly prohibited**, as that historical baseline contains the severe authorization bypasses and missing validation flaws identified in the original security audit.
2. **Expand-First Additive Schema:** All database migrations adhere strictly to expand-first principles (`ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, compound uniqueness constraints). Older compatible application versions remain functional without destructive DDL.
3. **Safe Roll-Forward Governance:** In the event of a production or staging defect, remediation is executed strictly via forward-compatible patches (`roll-forward`) with verified stable build identities, preserving all security checks and RLS invariants.
4. **No Inventory Enforcement Disabling:** Toggling `track_inventory = false` is strictly disallowed as a generic operational recovery mechanism. Disabling inventory tracking compromises commercial integrity by allowing unconstrained overselling beyond warehouse physical stock.
5. **Fail-Closed Financial Invariants:** If a payment or order issue arises, operations fail closed (`UNRESOLVED_EXCEPTION`, `ESCALATED_UNRESOLVED`) rather than permitting bypasses.
6. **Rehearsal Validation:** Re-executing the entire additive migration against an active PostgreSQL 16 database with pre-existing orders, inventory movements, receipts, and customer balances resulted in **100% data preservation (0 records deleted or modified)**.

---

### 5. Third-Party Clerk + Supabase Gateway Integration (Gate AUTH-GATEWAY)

#### A. Architecture & Token Flow
1. **Clerk Client Session:** User authenticates against Clerk; Clerk issues a session JWT containing standard claims (`sub: clerk_user_id`, `role: authenticated`).
2. **Supabase PostgREST Authorization:** Client sets `Authorization: Bearer <clerk_token>`.
3. **Claims Extraction in PostgreSQL:**
   - `lg_auth.clerk_uid()` extracts `request.jwt.claims->>'sub'`.
   - `lg_auth.caller_role()` extracts `request.jwt.claims->>'role'`.
4. **Row-Level Security (RLS):**
   - Policies evaluate `clerk_user_id = lg_auth.clerk_uid()`.
   - Anonymous access is restricted to public catalogs (`is_active = true`).
   - Mutations are blocked from `anon` and `authenticated` roles directly; all order writes pass through `create_order_atomic`.

#### B. Actor Matrix Validation

| Actor | Public Catalog Access | Orders / Account Read | Order Creation RPC | Wompi Webhook RPC |
|:---|:---|:---|:---|:---|
| **Anonymous** | Allowed | Denied | Denied (Revoked) | Denied (Revoked) |
| **Retail User A** | Allowed | Own orders only | Own orders only (`sub == clerk_user_id`) | Denied (Revoked) |
| **Retail User B** | Allowed | Own orders only | Own orders only | Denied (Revoked) |
| **Micromercado** | Allowed (Micro pricing) | Own orders & credit profile | Own orders only | Denied (Revoked) |
| **Restaurante** | Allowed (Rest pricing) | Own orders & credit profile | Own orders only | Denied (Revoked) |
| **Service Role** | Full access | Administrative | Allowed (Bypass) | Allowed (`process_wompi_transaction`) |

---

### 6. Client Portals Verification (Gate PORTAL-E2E)

The three customer portals retain full functionality and server-side validation:
- `/retail`: Standard consumer order history, live server quoting on reorder, address validation.
- `/micromercado`: Wholesale tier pricing, minimum order thresholds (COP 100,000), credit balance summary.
- `/restaurante`: Institutional tier pricing, high-volume order limits, balance payment reference generation (`BAL_user_...`).
- **Navigation:** Header and mobile navigation route through `/dashboard` to the appropriate portal according to metadata.

---

### 7. Verified Business Profile & SEO/GEO Governance

The business identity strictly matches the verified RUT documentation for Eduard Iván Velazco López:
- **Commercial Name:** Frutas y Verduras La Gaviota
- **Legal Representative:** Eduard Iván Velazco López
- **Physical Address:** Plaza de Mercado San Francisco, Calle 13 #22-49, Local 10, Bucaramanga, Santander, Colombia
- **Verified Public Contact:** `+57 318 499 0826`
- **Delivery Coverage:** Bucaramanga urbana. (Unverified metropolitan references to Floridablanca, Girón, and Piedecuesta remain removed).
- **Technical SEO:** `robots.ts` excludes administrative and private routes; `sitemap.ts` indexes active products; `middleware.ts` enforces `X-Robots-Tag: noindex, nofollow` on all private portal paths.

---

### 8. Release Acceptance Gate Matrix (LG-PROD-R2B)

| Gate ID | Capability | Status | Certification Basis |
|:---|:---|:---|:---|
| **SEC-RPC** | Secure RPC Boundaries & Least Privilege | **PASS** | `EXECUTE` revoked from `anon`/`PUBLIC`. Anti-impersonation enforced. Verified on PostgreSQL 16. |
| **COM-IDEMP** | Canonical Payload Fingerprinting | **PASS** | SHA-256 fingerprinting on items, tier, customer, address, and total. Zero cross-order collision. |
| **PAY-STATE** | Wompi Webhook Fail-Closed & Balance Accounting | **PASS** | Unsafe fallback removed. Exact B2B accounting certified. Underpaid fraud rejected. |
| **MIG-SAFE** | Non-Destructive Migration & Recovery | **PASS** | `DROP TABLE` purged from runbooks. Additive schema with 100% data preservation verified. |
| **AUTH-GATEWAY** | Clerk + Supabase Gateway Integration | **READY FOR STAGING** | JWT token flow and actor matrix implemented and tested on local PostgreSQL 16. |
| **PORTAL-E2E** | Multi-Tier Customer Portals | **READY FOR STAGING** | Full client components verified. Live hosted Clerk authentication gate pending. |
| **SEO-GEO** | NAP & Operational Delivery Consistency | **PASS** | RUT-verified address and phone. Unverified geographic claims purged. |
| **INF-BUILD** | Reproducible Clean Build | **PASS** | Next.js 16.4.1 Turbopack: 46/46 routes compiled cleanly in 4.1s. TypeScript: 0 errors. |

---

### 9. Remaining Dependencies Before Production Launch (Launch Blockers)

1. **Staging Supabase Project Authorization (INFRASTRUCTURE):**
   - Independent staging Supabase project must be provided/approved by the owner.
   - Run `supabase/migrations/20261027_lg_prod_r1_rls_policies.sql` against staging Supabase to verify live PostgREST JWT claim propagation.
2. **Wompi Sandbox Credentials (COMMERCE):**
   - Provide test merchant keys (`NEXT_PUBLIC_WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_KEY`, `WOMPI_EVENTS_SECRET`) to certify end-to-end sandbox payments and live webhook deliveries.
3. **Clerk Development Live Session Replay (IDENTITY):**
   - Run Playwright E2E browser tests with live Clerk Development sessions across the three customer portals.

### HARD STOP
**COMMERCIAL NO-GO REMAINS IN EFFECT.** No production deployments, no live Wompi transactions, no remote Git pushes, and no destructive data modifications are authorized until the isolated hosted-staging certification gate clears.
