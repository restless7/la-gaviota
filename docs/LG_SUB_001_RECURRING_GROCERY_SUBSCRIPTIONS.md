# LG-SUB-001 — Recurring Grocery Subscriptions & Scheduled Deliveries (Mercados Programados)

**Frutas y Verduras La Gaviota S.A.S.**  
**Status:** Feature Complete (Ready for Staging & Production Deployment)  
**Primary Language:** Spanish (Colombia)  
**Business Timezone:** `America/Bogota` (UTC-5)  
**Payment Model:** Contra Entrega (Cash / On Delivery — No membership fees or card tokenization)  

---

## 1. Executive Summary & Commercial Value

The **Mercados Programados** system allows customers of *La Gaviota* to configure their grocery basket once and schedule periodic automatic deliveries (**Weekly**, **Every 15 Days**, or **Monthly**).

### Core Principles
1. **No Membership Fees:** The customer subscribes to a recurring order of fresh produce, not a software or membership fee.
2. **Dynamic Live Pricing:** Grocery prices fluctuate with agricultural harvests. The system recalculates order totals dynamically using live catalog prices on the day of dispatch, while strictly enforcing customer-selected maximum spending limits (`maximum_authorized_total`).
3. **No Duplicate Checkout Engines:** The order generation adapter reuses the canonical `createOrder` pipeline and atomic inventory verification.
4. **Deterministic Recurrence:** Eliminates scheduling drift in shorter months (e.g. 31st anchored subscriptions clamp to Feb 28/29, then restore to March 31). Automatically shifts non-operating Sunday deliveries forward to Monday.
5. **Customer Autonomy:** Customers can pause, resume, skip an upcoming delivery, adjust products/quantities, or cancel at any time directly from `/mi-cuenta/mercados-programados`.

---

## 2. Architecture Discovery Summary

- **App Framework:** Next.js 16 (App Router + Turbopack).
- **Authentication & RBAC:** Clerk authentication integrated with PostgreSQL roles (`getActor()`, `requireOwnedSubject()`, `requireCapability('orders.manage')`).
- **Database & Persistence:** PostgreSQL hosted on Supabase + Prisma schema definitions.
- **Canonical Order Pipeline:** `@/src/lib/server/orderWriter.ts` (`createOrder`), `@/src/lib/server/checkout.ts` (`prepareCheckout`), `@/src/lib/checkoutValidation.ts` (`quoteCheckout`).
- **Delivery Rules:** Operating cutoff at 10:00 PM (`America/Bogota`). Monday–Saturday operating window; Sundays roll over to Monday. Municipal delivery zones (Bucaramanga, Floridablanca, Girón, Piedecuesta).
- **Background Cron:** Configured in `vercel.json` (`/api/cron/process-subscriptions` at 5:00 AM Bogota time / 10:00 UTC).

---

## 3. Database & Domain Model

### 3.1 Migration File
`supabase/migrations/20261123_grocery_subscriptions.sql`

### 3.2 Entities
- **`grocery_subscriptions`**: Parent recurring contract defining customer, frequency (`WEEKLY | EVERY_15_DAYS | MONTHLY`), status (`ACTIVE | PAUSED | CANCELED`), delivery window, municipality, confirmation policy (`AUTO | MANUAL`), spending cap, and anchor date.
- **`grocery_subscription_items`**: Basket lines associated with the subscription, specifying product IDs, quantities, units, and customer substitution preferences (`CALL_CUSTOMER | SIMILAR | SKIP_ITEM`).
- **`grocery_subscription_occurrences`**: Scheduled delivery cycles. Holds estimated totals, unique `idempotency_key`, delivery date, and foreign key to `orders.id` once confirmed.
- **`grocery_subscription_events`**: Audit log recording lifecycle actions (`CREATED`, `PAUSED`, `RESUMED`, `SKIPPED`, `CANCELED`, `ORDER_GENERATED`, `APPROVAL_REQUESTED`, `GENERATION_FAILED`).
- **`orders` table extension**: Added nullable column `subscription_occurrence_id UUID UNIQUE` to guarantee a 1-to-1 association and prevent duplicate orders.

---

## 4. Recurrence Engine (`src/lib/subscriptions/recurrence.ts`)

- **Weekly (`WEEKLY`)**: Steps by exactly 7 calendar days, preserving the customer's preferred weekday.
- **Every 15 Days (`EVERY_15_DAYS`)**: Advances in exact 15-day intervals from the recurrence anchor (`anchor_date + 15 * k`).
- **Monthly (`MONTHLY`)**: Preserves the original day of month. In shorter months (February, April, June, September, November), clamps to the month's maximum days (28/29 or 30). In subsequent 31-day months, restores the 31st without day drift.
- **Operating Day Shifting**: Any delivery landing on a Sunday (day 0) or registered holiday/blackout date automatically rolls forward to Monday / the next operating day.
- **Cutoff Rule**: Orders generated after 10:00 PM are scheduled for the day after next (+2 operating days).

---

## 5. Order Generation Pipeline (`src/lib/subscriptions/generator.ts`)

At the scheduled preparation cutoff:
1. **Locking & State**: Transitions occurrence to `GENERATING` state with concurrency locks.
2. **Live Catalog Evaluation**: Resolves current product prices, seasonal availability, and kit fixed prices.
3. **Stock & Municipal Delivery**: Runs canonical `quoteCheckout`, checking stock (if `track_inventory` is active) and computing delivery fees.
4. **Promotions**: Applies any active launch discounts or promotional campaigns.
5. **Authorization Verification**:
   - If `confirmation_policy === 'MANUAL'` or `quote.totalAmount > maximum_authorized_total`: Transitions occurrence to `PENDING_APPROVAL` and notifies customer. Does NOT place unauthorized orders!
   - If `AUTO` and within spending cap: Calls `createOrder` with `payment_method: 'cash'`, passing `idempotency_key`.
6. **Order Linkage**: Stores `order_id` on the occurrence, updates occurrence status to `CONFIRMED`.
7. **Next Occurrence Schedule**: Calculates and inserts the next occurrence cycle and updates `next_occurrence_date` on the subscription.
8. **WhatsApp Alert**: Fires `triggerOrderNotification` to inform the customer of their upcoming fresh grocery order.

---

## 6. User Experience & Interfaces

### Customer Experience
- **Cart Entry Point (`/cart`)**: Prominent action **"Programar entrega recurrente"** that opens `ScheduleSubscriptionModal.tsx` without destroying the active cart.
- **Scheduling Wizard (`ScheduleSubscriptionModal.tsx`)**:
  - Step 1: Resumen de canasta (cantidades, unidades y subtotales referenciales).
  - Step 2: Frecuencia (Cada semana / Cada 15 días / Cada mes).
  - Step 3: Fecha de entrega, franja horaria y dirección en Bucaramanga/AMB.
  - Step 4: Política de precios y tope máximo autorizado.
  - Step 5: Confirmación y enlace directo al portal.
- **Customer Portal (`/mi-cuenta/mercados-programados`)**: Full self-service dashboard to pause, resume, skip next delivery, review basket, approve price exceptions, or cancel.
- **Retail Portal Link (`/(portals)/retail`)**: Direct access card for household accounts.

### Administrator Experience
- **Admin Management Portal (`/admin/mercados-programados`)**:
  - Integrated into main admin sidebar (`app/admin/layout.tsx`).
  - Operational KPIs: Active Subscriptions, Weekly/Biweekly/Monthly demand breakdown, Estimated Recurring Volume, and Pending Attention counts.
  - Full search by customer, phone, address, or subscription name.
  - Filters by Status (`ACTIVE | PAUSED | CANCELED`) and Frequency.
  - Actionable Retry button for failed generations.
  - Administrative Pause/Resume controls.
  - Basket inspection drawer.

---

## 7. Background Scheduler (`/api/cron/process-subscriptions`)

- **Endpoint**: `/api/cron/process-subscriptions`
- **Schedule**: `0 10 * * *` (Daily at 5:00 AM Colombia time / 10:00 UTC).
- **Authentication**: Constant-time `crypto.timingSafeEqual` check against `CRON_SECRET`.
- **Batch Processing**: Retrieves up to 50 due `SCHEDULED` occurrences due today or tomorrow.
- **Output**: Detailed execution telemetry (`processedCount`, `confirmedCount`, `pendingApprovalCount`, `failedCount`).

---

## 8. Verification & Test Results

Executed automated test batteries via Node.js native test runner:

1. **`tests/subscriptions-recurrence.test.cjs`**:
   - `✔ Weekly frequency steps by exactly 7 calendar days`
   - `✔ Sunday deliveries roll over to Monday`
   - `✔ Every 15 days frequency advances by exactly 15 calendar days`
   - `✔ Monthly recurrence clamps to end of month without permanent anchor drift`
   - `✔ Leap Year handling in February (2028 is a leap year)`
   - `✔ Blackout dates shift to subsequent operating day`

2. **`tests/subscriptions-order-generation.test.cjs`**:
   - `✔ Spending cap enforcement blocks automatic confirmation when total exceeds cap`
   - `✔ Automatic confirmation succeeds when quoted total is within cap`
   - `✔ Manual confirmation policy requires explicit customer review`
   - `✔ Idempotency key uniquely binds occurrence to delivery date and subscription`
   - `✔ Occurrence transition to CONFIRMED binds exactly one order_id`

**Summary:** 11 passed, 0 failed.  
**TypeScript check:** `tsc --noEmit` exited with code 0 (0 type errors).  
**Production Build:** `next build` compiled all 61 static and dynamic routes cleanly.

---

## 9. Deployment Instructions

1. **Database Migration:**
   Apply `supabase/migrations/20261123_grocery_subscriptions.sql` in Supabase SQL Editor or via Supabase CLI (`supabase db push`).
2. **Environment Variables:**
   Ensure `CRON_SECRET` is set in Vercel project settings to secure the automated scheduler.
3. **Vercel Cron:**
   `vercel.json` contains the cron registration and will activate automatically upon git push to `main`.

