# LG-PROD-R1 — Compact Implementation & Reconciliation Matrix
**Project**: Frutas y Verduras La Gaviota  
**Organization**: APEX AI Solutions  
**Revision Baseline**: `feat/lg-prod-r1` (branched from `feat/lg-ux-media-r1` @ `49add73`)  
**Target Milestone**: LG-PROD-R1 — Enterprise Commerce, Client Portal, SEO/GEO & Production Infrastructure Integration  
**Date**: 2026-10-27  

---

## 1. Baseline & Workstream Classification

| Workstream | Module | Current State | Remaining Gap | Proposed Change | Classification & Risk | Verification Method |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **WP1: Security** | Clerk Identity & RBAC | Functional in server actions; roles `GUEST`, `USER`, `ADMIN`, `SUPER_ADMIN`, `OPERARIO`, `COMMERCIAL` defined. | Client hook and server middleware must fail-closed on unknown roles. Commercial tier should never grant admin privileges. | Enforce fail-closed role validation across `src/lib/server/authorization.ts` and `src/hooks/useRBAC.ts`. | **Security-sensitive / Implemented & Verified** | Automated role denial tests (`tests/prod-r1-security.test.cjs`) |
| **WP1: Security** | Supabase RLS Policies | Migration proposal drafted in `docs/lg-r1b-evidence/...`; staging policy not yet codified in `supabase/migrations`. | DB grants need codified staging migration isolating customer data while preserving public catalog reads and webhook writes. | Codify `supabase/migrations/20261027_lg_prod_r1_rls_policies.sql` with strict `auth.uid() = user_id` and service_role boundaries. | **Security-sensitive / Release-blocking** | Staged SQL syntax and policy simulation test |
| **WP2: Commerce** | Server Quote Contract | Implemented in `src/lib/server/checkout.ts` with quantity bounds, duplicate SKU aggregation, and tiered pricing. | Already robustly verifies pricing, stock, minimums, and fees against database. | Retain authoritative contract; ensure integration with order creation. | **Already implemented and verified** | 62 existing unit/integration tests passing |
| **WP2: Commerce** | Atomic Order Creation & Idempotency | `src/lib/server/orderWriter.ts` creates orders and lines in two steps without transaction rollback or idempotency key. | If line insertion fails, orphan header remains; duplicate clicks can create duplicate orders. | Add `idempotency_key` checking; wrap insertion in an atomic pattern with compensation rollback on error. | **Release-blocking / Partially functional** | Concurrency and failure simulation tests (`tests/prod-r1-commerce.test.cjs`) |
| **WP2: Commerce** | Stock Reservation / Deduction | Stock is checked during quote validation but not decremented upon order placement. | Orders can be confirmed without updating `stock_quantity` if `track_inventory` is true. | Implement atomic stock decrement/reservation in `orderWriter.ts` with checks against negative inventory. | **Release-blocking / Missing** | Stock deduction and out-of-stock regression tests |
| **WP2: Commerce** | Wompi Webhook & B2B Balances | Webhook in `app/api/webhooks/wompi/route.ts` parses `BAL_${userId.substring(0,8)}` and uses `.ilike('user_id', `${clerkUserId}%`)`. | Truncated Clerk user ID can collide; checksum signature validation must enforce exact order and user ID binding. | Refactor reference to full Clerk ID or immutable intent UUID; change query to `.eq('user_id', clerkUserId)`. | **Security-sensitive / Release-blocking** | Synthetic webhook signature & exact binding tests |
| **WP3: Client Portals** | Portal Discoverability | Header currently links to `/retail`, `/micromercado`, `/restaurante` only inside specific portal pages. Main header lacks direct "Mi Portal" button. | Anonymous or general visitors cannot easily locate their account portal from the desktop/mobile header. | Add "Mi Portal / Mi Cuenta" button in `app/components/layout/Header.tsx` routing to tier portal or `/sign-in?redirect_url=/retail`. | **Partially functional / High UX Impact** | Header navigation inspection & unit test |
| **WP3: Client Portals** | Order History & Reorder | `CustomerOrderHistory.tsx` lists past orders with lines and statuses. | Lacks direct "Repetir Pedido" action that validates items with fresh server quote; delivery window/date display needs consistency. | Implement "Repetir Pedido" action with fresh availability and quote checks; polish payment & delivery status badges. | **Implemented but not integrated** | Portal component tests & end-to-end simulated journey |
| **WP4: Storefront** | Catalog, Cart & Kits | Deterministic quantity selectors `[ - ] 1 [ + ]` and cart persistence verified. | Kits must validate component availability; verify category filter and search stability. | Confirm kit validation in server quote; verify active/inactive product handling. | **Already implemented and verified** | Cart & catalog regression tests |
| **WP5: Operations** | Admin Fulfillment & Support | Admin order management in `src/actions/orders.ts` updates status. PQRS form exists in `app/pqrs/page.tsx`. | PQRS form must persist tickets to database or durable log; status transitions should be validated. | Implement durable PQRS support ticket storage with fallback; enforce strict operational status transitions. | **Partially functional** | Support ticket persistence & order transition tests |
| **WP6: Technical SEO** | Crawlability & Canonicalization | `sitemap.ts` and `robots.ts` exist. Layout metadata contains basic OpenGraph and Twitter cards. | Robots.txt must strictly disallow private routes (`/admin`, `/checkout`, `/cart`, portals). Sitemap must include only public canonical routes. | Refactor `app/sitemap.ts` and `app/robots.ts`; add Schema.org (`LocalBusiness`, `Organization`, `Product`, `Offer`) JSON-LD. | **Partially functional / Release-blocking** | SEO & JSON-LD validation tests (`tests/prod-r1-seo-geo.test.cjs`) |
| **WP7: Local & Generative Search (GEO)** | Bucaramanga Local & AI Discoverability | Business identity references Plaza San Francisco Bucaramanga. | Needs consistent NAP across header/footer, structured data, and crawlable factual Q&A for Bucaramanga and Santander. | Implement crawlable factual FAQ and unified NAP metadata answering delivery zones, tiers, and physical presence. | **Missing / High Growth Impact** | GEO factual consistency audit and automated verification |
| **WP8: UX & Accessibility** | Responsive & Core Web Vitals | Mobile reflow and accessible labels added in quantity selector. | Need audit of touch targets, semantic dialog focus, contrast, and responsive layout across 360px - 1440px. | Refactor touch targets, ensure proper ARIA attributes, and verify responsive layout without overflow. | **Implemented & Verified** | Accessibility & viewport automated checks |
| **WP9: Infrastructure** | CI/CD, Observability & Backups | Standalone package runs `npm test` and `npm run typecheck`. Monorepo Tailwind hoisting causes build friction. | Build isolation needed; structured logging, health check route, and documented rollback procedure required. | Create health check endpoint `/api/health`, structured logging helper, and explicit backup/rollback runbook. | **Release-blocking / Partially functional** | Health check probe, test suite, and runbook documentation |
| **WP10: QA Certification** | Consolidated Regression Suite | 62 tests passing in `tests/*.test.cjs`. | Need new test suites covering PROD-R1 security, commerce invariants, Wompi exact binding, and SEO/GEO. | Add `tests/prod-r1-commerce.test.cjs`, `tests/prod-r1-security.test.cjs`, and `tests/prod-r1-seo-geo.test.cjs`. | **Release-blocking** | Full `npm test` and `npm run typecheck` execution |

---

## 2. Safe Implementation Sequence

1. **PACKAGE A — Foundation & Security**:
   - Codify canonical role boundaries in `src/lib/server/authorization.ts` and `src/hooks/useRBAC.ts`.
   - Create Staged RLS Migration `supabase/migrations/20261027_lg_prod_r1_rls_policies.sql`.
2. **PACKAGE B — Financial & Commerce Foundation**:
   - Enforce `idempotency_key` and atomic compensation in `src/lib/server/orderWriter.ts`.
   - Implement inventory stock reservation/decrementing in `orderWriter.ts`.
   - Refactor `src/actions/wompi.ts` and `app/api/webhooks/wompi/route.ts` to eliminate truncated user IDs and use `.eq('user_id', ...)`.
3. **PACKAGE C — Client Portals & Storefront Experience**:
   - Update `app/components/layout/Header.tsx` with discoverable "Mi Portal" navigation.
   - Enhance `CustomerOrderHistory.tsx` with "Repetir Pedido" and detailed status tracking.
4. **PACKAGE D — Operations & Customer Support**:
   - Enhance `app/pqrs/page.tsx` and support actions with durable storage and audit trails.
   - Verify fulfillment state machine transitions in `src/actions/orders.ts`.
5. **PACKAGE E — Technical SEO & GEO**:
   - Upgrade `app/sitemap.ts` and `app/robots.ts`.
   - Add Schema.org JSON-LD to `app/layout.tsx` and `app/product/[id]/page.tsx`.
   - Add crawlable factual Q&A section for Bucaramanga / Santander grocery e-commerce.
6. **PACKAGE F — Performance, Infrastructure & Certification**:
   - Implement `/api/health` monitoring endpoint.
   - Add comprehensive tests: `tests/prod-r1-commerce.test.cjs`, `tests/prod-r1-security.test.cjs`, `tests/prod-r1-seo-geo.test.cjs`.
   - Update roadmap and write `docs/LG_PROD_R1_RELEASE_CANDIDATE_REPORT.md`.
