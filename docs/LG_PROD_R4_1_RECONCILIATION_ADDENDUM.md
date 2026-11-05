# LA GAVIOTA — CERTIFICATION RECONCILIATION ADDENDUM · LG-PROD-R4.1
**Misión:** `LG-PROD-R4.1-DOCUMENTARY-ERRATA-001`  
**Frutas y Verduras La Gaviota S.A.S. — Bucaramanga, Colombia**  
**Fecha del Informe Original:** 30 de Octubre de 2026  
**Fecha de Emisión del Addendum / Errata:** 4 de Noviembre de 2026  
**Orquestador:** Freya (Mission Control Orchestrator)  
**Destinatario:** Release Assurance Board & Dirección Técnica  
**Rama Local:** `release/lg-prod-r4.1-staging` (Exclusivamente local, cero push remoto)  
**Modo:** Solo Documentación / Código de Aplicación en Solo Lectura (Sin modificaciones en código fuente)  
**Decisión Vigente:** **PRODUCCIÓN: STRICT COMMERCIAL NO-GO**

---

## 1. PROPÓSITO DEL DOCUMENTO
Este Addendum resuelve de forma definitiva y verificable las inconsistencias cuantitativas, documentales y de trazabilidad observadas en la evaluación de Release Assurance para el cierre de **LG-PROD-R4.1**.

Siguiendo la instrucción formal del Board:
- **No se modifica ningún archivo de código de aplicación** (`src/`, `app/`, `tests/`, `scripts/`, `prisma/`).
- **No se genera ningún commit de código adicional**, preservando la inmutabilidad del candidato de release.
- Se proporciona la reconciliación matemática exacta de todas las pruebas a partir de los artefactos y ejecutores reales de Node.js.
- Se formaliza el estado de las fronteras de integración pendientes.

---

## 2. RECONCILIACIÓN CUANTITATIVA INEQUÍVOCA DEL INVENTARIO DE PRUEBAS

### A. Diagnóstico de la Discrepancia Histórica
Las discrepancias cuantitativas previas (162 vs 165) surgieron por dos errores de agregación manual en reportes intermedios:
1. **Doble contabilización:** La suite automatizada de `npm test` (`node --test tests/*.test.cjs`) ejecuta exactamente **150 pruebas** distribuidas en 13 archivos. Entre esos 13 archivos ya estaban incluidas las 5 pruebas de `clerk-supabase-jwt.test.cjs` y las 7 pruebas de `e2e-portals-authenticated.test.cjs`. En resúmenes ejecutivos anteriores se sumó erróneamente `150 + 5 + 7`, contando dos veces esas 12 pruebas.
2. **Agrupación desalineada:** Las categorías anteriores ("Regresión 35", "ACID 48", "Idempotencia 45") eran etiquetas heredadas de auditorías anteriores (R1, R2B, R2C) y no coincidían con el número real de casos instanciados en cada archivo de prueba (por ejemplo, `checkout.test.cjs` genera dinámicamente 52 aserciones sobre límites y cantidades).

### B. Matriz Canónica y Real de Pruebas (Basada en Telemetría de Node.js)
A continuación se presenta el inventario exhaustivo derivado directamente de la ejecución de `node:test` en el commit canónico:

| # | Archivo de Prueba | Ejecutor / Arnés | Casos | PASS | BLOCKED | FAIL | Alcance & Evidencia |
| :-: | :--- | :--- | :-: | :-: | :-: | :-: | :--- |
| 1 | `tests/cart-ux-media-brand.test.cjs` | `node:test` (`npm test`) | 10 | 10 | 0 | 0 | Assets de marca, favicon, OpenGraph, estado de carrito. |
| 2 | `tests/checkout.test.cjs` | `node:test` (`npm test`) | 52 | 52 | 0 | 0 | Validaciones de checkout, límites numéricos, agregación de SKU. |
| 3 | `tests/clerk-supabase-jwt.test.cjs` | `node:test` (`npm test`) | 5 | 5 | 0 | 0 | Criptografía RS256, JWKS, claims de rol, sub, PG RLS. |
| 4 | `tests/e2e-portals-authenticated.test.cjs` | `node:test` (`npm test`) | 7 | 7 | 0 | 0 | Aislamiento A/B, precios B2B, tampering, crédito B2B, admin, cash. |
| 5 | `tests/hosted-staging-gate-b.test.cjs` | `node:test` (`npm test`) | 6 | 6 | 0 | 0 | Pruebas directas en Supabase Staging (`sxmpefqlsakknpggtmzl`). |
| 6 | `tests/prod-r1-commerce.test.cjs` | `node:test` (`npm test`) | 6 | 6 | 0 | 0 | Idempotencia comercial, concurrencia, validación de roles. |
| 7 | `tests/prod-r1-security.test.cjs` | `node:test` (`npm test`) | 4 | 4 | 0 | 0 | Validación de target ID, roles canónicos, sintaxis SQL RLS. |
| 8 | `tests/prod-r1-seo-geo.test.cjs` | `node:test` (`npm test`) | 6 | 6 | 0 | 0 | Robots.txt, sitemap.xml, Schema LocalBusiness Bucaramanga. |
| 9 | `tests/prod-r2a-postgres-concurrency.test.cjs` | `node:test` (`npm test`) | 10 | 10 | 0 | 0 | Concurrencia PostgreSQL 16, ordenamiento ascendente de locks. |
| 10 | `tests/prod-r2b-security-idempotency.test.cjs` | `node:test` (`npm test`) | 13 | 13 | 0 | 0 | Protección RPC, anti-impersonación, deduplicación de pagos. |
| 11 | `tests/prod-r2c-identity-reconciliation.test.cjs` | `node:test` (`npm test`) | 16 | 16 | 0 | 0 | Fail-closed claims, reconciliación de pagos pendientes. |
| 12 | `tests/prod-r3-staging-preflight.test.cjs` | `node:test` (`npm test`) | 6 | 6 | 0 | 0 | Adapter Wompi, CRON_SECRET en tiempo constante, kill switch. |
| 13 | `tests/staging-safety-guard.test.cjs` | `node:test` (`npm test`) | 9 | 9 | 0 | 0 | Allowlist staging, blocklist prod, multivector, redacción pass. |
| **—** | **Subtotal Suite Automatizada (`npm test`)** | **`node --test tests/*.test.cjs`** | **150** | **150** | **0** | **0** | **13 archivos ejecutados por el script test oficial** |
| 14 | `tests/e2e-portals-preflight.cjs` | Playwright + Chrome Headless | 15 | 15 | 0 | 0 | 3 portales x 5 viewports interactivos en localhost:3005. |
| 15 | `scripts/verify-wompi-contract.ts` | Script de verificación de API | 1 | 0 | 1 | 0 | Contrato Wompi Sandbox (bloqueado por credenciales de comercio). |
| **TOTAL** | **Inventario Global de Casos de Prueba** | **Todas las fuentes auditadas** | **166** | **165** | **1** | **0** | **100.00% éxito ejecutable / 99.40% cobertura del plan** |

#### Totales Reconciliados Oficiales:
- **Total de casos clasificados:** **166**
- **Casos con veredicto PASS:** **165**
- **Casos con veredicto BLOCKED:** **1** (`scripts/verify-wompi-contract.ts` — Pasarela Wompi Sandbox a la espera de credenciales `pub_test_` de comercio)
- **Casos con veredicto FAIL:** **0**
- **Tasa de éxito en pruebas ejecutadas:** **100.00%** (165/165)
- **Cobertura sobre el plan total:** **99.40%** (165/166)
- **Total de pruebas E2E:** **22 pruebas** (15 en `e2e-portals-preflight.cjs` + 7 en `e2e-portals-authenticated.test.cjs`).

> [!NOTE]
> Queda formalmente derogada y marcada como superseded cualquier declaración preliminar que mencione 162/162 o 165/164. El inventario canónico comprobable es **166 casos (165 PASS, 1 BLOCKED, 0 FAIL)**.

---

## 3. IDENTIDAD CANÓNICA DEL CANDIDATO Y TRAZABILIDAD CRIPTOGRÁFICA

Se formaliza la relación entre los dos identificadores históricos:

| Snapshot / Entidad | Git Commit SHA | Tarball de Release SHA-256 | Estado & Rol |
| :--- | :--- | :--- | :--- |
| **v1 — Base Code Snapshot** | `25e9504467786208813ffc8dfd8feb00c6eea070` | `6dbd0ed127c52b33e6de3921bfca85b49eecc94bd47b85a6de8e484a28c5524b` | **Histórico (Congelamiento de Código):** Contiene los 532 archivos de aplicación y suites de prueba, previo a la emisión de reportes. |
| **v2 — Canonical Integral HEAD** | `227892aaee685f66e6a1f645a91cd74db17a5874` | `69f3eae178a59e444818e95c1c28ebb1f3cd8373e1ac29d3f409f09556d51dbb` | **CANÓNICO OFICIAL:** Árbol completo e inmutable en `HEAD` de `release/lg-prod-r4.1-staging`, incluyendo reportes y manifiestos. |

#### Hashes Complementarios del Candidato Canónico:
- **Lockfile SHA-256 (`package-lock.json`):** `4dd9bbbdd1b8d2edeaf874024295cb63826146328d662bebb3080c90b0dc890f`
- **Migración RLS SQL SHA-256 (`supabase/migrations/20261027_lg_prod_r1_rls_policies.sql`):** `92f4c4fc854ff256f73169706dde9761b0080ff332e0515fc088b5998aeba957`
- **Fixtures Staging SQL SHA-256 (`supabase/fixtures/staging_seed_data.sql`):** `dc1f201b3143d035f87596000b9dc2fd968bab9ec43b247f7976ed675e09c217`
- **Ubicación del Tarball Canónico:** `scratch/lg-prod-r4.1-staging-candidate.tar.gz`

---

## 4. FRONTERAS DE INTEGRACIÓN Y ESTADO REAL DE COMPONENTES

| Componente | Estado | Detalle y Condición de Cierre |
| :--- | :---: | :--- |
| **PostgreSQL 16 & RLS** | **PASS** | Evaluado contra base remota de Staging Supabase (`sxmpefqlsakknpggtmzl`) vía pooler IPv4. Las políticas RLS y la función `lg_auth.clerk_uid()` segregan correctamente datos bajo claims JWT simulados. |
| **Criptografía Clerk (RS256)** | **PASS** | Plantilla `supabase_staging` en Clerk Development (`discrete-orca-86.clerk.accounts.dev`) emite tokens con claims `role: "authenticated"`, `app_role`, `customer_tier` y `sub` verificados criptográficamente. |
| **PostgREST HTTP Gateway** | **PARTIAL** | La petición HTTP directa a `GET /rest/v1/orders` con `Bearer <clerk_jwt>` responde `HTTP 401 PGRST301 (No suitable key)`. **Bloqueador:** El operador debe ingresar al Dashboard de Supabase (`sxmpefqlsakknpggtmzl`) -> `Authentication > Providers > Third Party Auth > Clerk` y activar el dominio `discrete-orca-86.clerk.accounts.dev`. |
| **Frontend Remoto en Vercel** | **NOT DEPLOYED** | No se ha creado un proyecto Vercel staging aislado ni desplegado en Vercel Preview. Las pruebas interactivas se ejecutaron en `http://localhost:3005` conectado a la BD remota de staging. |
| **Wompi Sandbox** | **BLOCKED** | El módulo de pagos e integración está implementado, pero no se han ejecutado pruebas de contrato en vivo por falta de credenciales de prueba (`pub_test_`, `prv_test_`) del comercio. |
| **Producción (`tcjeiizrarwerarcfyky`)** | **STRICT NO-GO** | Producción 100% aislada. Cero mutaciones, cero despliegues, cero cobros. |

---

## 5. PRECISIONES ADICIONALES DE ARQUITECTURA Y RUNTIME

### A. Distinción entre Rol Administrativo (`SUPER_ADMIN`) y Tiers Comerciales
- `SUPER_ADMIN` es exclusivamente una **identidad administrativa de personal**, dotada de capacidades de servidor (`catalog.manage`, `orders.manage`, `audit.read`, etc.).
- En `src/lib/server/authorization.ts`, los roles comerciales válidos son exclusivamente:
  ```typescript
  export type Tier = 'Personas Naturales' | 'Micromercados' | 'Restaurantes';
  ```
- El claim `"customer_tier": "admin"` emitido en el token del administrador es un marcador de depuración. En el middleware (`middleware.ts`), los usuarios con capacidades administrativas son interceptados y redirigidos inmediatamente a `/admin`, impidiendo su participación en flujos de compra ordinarios.
- El fallback del servidor que evalúa valores desconocidos como `'Personas Naturales'` opera bajo principio de menor privilegio (impide que un administrador obtenga descuentos B2B o líneas de crédito mayoristas), pero los pedidos de prueba comerciales deben realizarse siempre con las cuentas de cliente sintéticas dedicadas (`staging_retail_a`, `staging_micro`, etc.).

### B. Versión de Next.js Confirmada
- El entorno de ejecución certificado y fijado en el lockfile oficial (`package-lock.json`) utiliza **Next.js 16.4.1 (Turbopack)**.
- Cualquier mención previa a "Next.js 15" queda corregida como una errata tipográfica; el runtime probado corresponde a **Next.js 16.4.1**.
- Versión de Node.js auditada: **v24.13.0**.

---

## 6. VEREDICTO FINAL Y RECOMENDACIÓN PARA EL RELEASE BOARD

1. **Expediente Documental:** Cerrado y reconciliado con éxito bajo el addendum `LG-PROD-R4.1-DOCUMENTARY-ERRATA-001`.
2. **Siguiente Hito Recomendado:** Avanzar hacia la **Certificación de Integración Staging (LG-PROD-R4.2)** una vez se cumplan las dos condiciones externas:
   - Activación del toggle de Clerk Third-Party Auth en el Supabase Dashboard.
   - Creación del proyecto Vercel Staging aislado con credenciales de staging.
3. **Restricción Contractual:** Se ratifica el estado de **STRICT COMMERCIAL NO-GO** para cualquier operación productiva.
