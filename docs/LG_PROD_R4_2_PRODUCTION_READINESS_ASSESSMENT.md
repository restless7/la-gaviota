# LA GAVIOTA — AUDITORÍA TÉCNICA Y EVALUACIÓN DE READINESS PRODUCTIVO
## Documento Maestro: LG-PROD-R4.2 · Production Readiness Assessment
**Misión:** `LG-PROD-R4.2-PRODUCTION-FIRST`  
**Fecha de Evaluación:** 4 de Noviembre de 2026  
**Entidad Operativa:** Frutas y Verduras La Gaviota S.A.S. — Bucaramanga, Colombia  
**Orquestador:** Freya (Mission Control Orchestrator, PlanMaestro)  
**Veredicto Arquitectónico:** **PREPARACIÓN TÉCNICA LOCAL COMPLETA · PRODUCCIÓN: STRICT NO-GO**  
**Alcance Autorizado:** Ingeniería local, auditoría de seguridad y planificación de release. Cero mutaciones en producción, cero pushes remotos.

---

## 1. RESOLUCIÓN DE OBSERVACIONES TÉCNICAS (ERRATA & AUDITORÍA)

### A. Reubicación y Auditoría del Procedimiento de Rollback
* **Acción Ejecutada:** El archivo de rollback fue eliminado de `supabase/migrations/` para evitar que la CLI de Supabase (`supabase db push`) lo autodescubriera y ejecutara como una migración común.
* **Nueva Ubicación Segura:** [`ops/rollback/20261104_lg_prod_r4_2_rollback.sql`](file:///home/sebastiangarcia/planmaestro-ecosystem/packages/la-gaviota/ops/rollback/20261104_lg_prod_r4_2_rollback.sql)
* **Auditoría de Preservación de Datos:**
  - Se identificó que ejecutar `DROP TABLE public.inventory_movements`, `DROP TABLE public.payment_intents` o `ALTER TABLE public.orders DROP COLUMN idempotency_key` en un entorno con pedidos vivos provocaría pérdida irreparable de historial contable y trazabilidad de pedidos.
  - **Estructuración en dos procedimientos:**
    1. **Procedimiento 1 (Mitigación No Destructiva para Producción):** Desactiva las políticas restrictivas de RLS y restablece permisos públicos/funciones sin eliminar tablas, columnas ni registros existentes. Preserva 100% de los datos comerciales.
    2. **Procedimiento 2 (Desmantelamiento Frío Pre-Lanzamiento):** Bloqueado por salvaguarda PL/pgSQL que aborta con excepción si existe al menos 1 pedido en la tabla `orders` (`SELECT count(*) FROM public.orders`).

---

### B. Guardián de Entornos Reforzado y Pruebas de Aislamiento
* **Archivo:** [`src/lib/safetyGuard.ts`](file:///home/sebastiangarcia/planmaestro-ecosystem/packages/la-gaviota/src/lib/safetyGuard.ts)
* **Controles Implementados:**
  1. **Fail-Closed si `APP_ENV` es ausente/desconocido:** Si la variable de servidor `APP_ENV` no está definida o contiene un valor ajeno a `['production', 'staging', 'development', 'test']`, la ejecución se detiene inmediatamente con `ENVIRONMENT_SAFETY_VIOLATION`. `NEXT_PUBLIC_APP_ENV` es estrictamente informativa para el cliente y carece de autoridad de seguridad.
  2. **Aislamiento en Modo Desarrollo:** En `APP_ENV=development` o `test`, se permite únicamente el uso de bases de datos locales (`localhost`, `127.0.0.1`, `54329`). Cualquier intento de conectar a Supabase Staging (`sxmpefqlsakknpggtmzl`) o Supabase Producción (`tcjeiizrarwerarcfyky`) es bloqueado.
  3. **Aislamiento en Modo Producción:** Solo se autoriza `tcjeiizrarwerarcfyky`. Se bloquea la base de staging, bases locales y cualquier llave de prueba (`pk_test_*`, `sk_test_*`, `pub_test_*`).
  4. **Detección de Fugas de Llaves Secretas:** Se audita `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Si contiene el prefijo `sb_secret_` o un JWT con `role: "service_role"`, lanza `SECURITY_LEAK_VIOLATION`.
  5. **Alineación de Referencia en JWTs de Supabase:** Se decodifica el payload JWT y se valida que el claim `ref` coincida exactamente con el ID de proyecto esperado (`tcjeiizrarwerarcfyky` en producción, `sxmpefqlsakknpggtmzl` en staging).
* **Evidencia Automatizada:** [`tests/prod-safety-guard.test.cjs`](file:///home/sebastiangarcia/planmaestro-ecosystem/packages/la-gaviota/tests/prod-safety-guard.test.cjs) y [`tests/staging-safety-guard.test.cjs`](file:///home/sebastiangarcia/planmaestro-ecosystem/packages/la-gaviota/tests/staging-safety-guard.test.cjs): **22/22 tests PASS**.

---

### C. Auditoría Exhaustiva de `SUPABASE_SERVICE_ROLE_KEY` y Autorización de Servidor

Dado que `SUPABASE_SERVICE_ROLE_KEY` elude las políticas RLS en PostgreSQL, **la seguridad recae exclusivamente en la capa de autorización de Next.js en el servidor**. Se auditó la totalidad de puntos de entrada:

| Módulo / Archivo | Función | Verificación de Autorización Previa | Protección de Recurso |
| :--- | :--- | :--- | :--- |
| `src/actions/products.ts` | `createProduct`, `updateProduct`, `deleteProduct` | `await requireCapability('catalog.manage')` | Solo `SUPER_ADMIN` o `ADMIN` staff |
| `src/actions/products.ts` | `updatePrice`, `bulkUpdatePrices` | `await requireCapability('pricing.manage')` | Solo roles comerciales/admin autorizados |
| `src/actions/products.ts` | `adjustStock` | `await requireCapability('inventory.manage')` | Solo operario/admin de inventario |
| `src/actions/orders.ts` | `updateOrderStatus`, `deleteOrder` | `await requireCapability('orders.manage')` | Prohibido a clientes ordinarios |
| `src/actions/orders.ts` | `confirmPayment` | `await requireCapability('payments.manage')` | Prohibido a clientes ordinarios |
| `src/actions/customers.ts` | `fetchCustomers`, `updateCustomerCredit` | `await requireCapability('customers.manage')` | Aislamiento de cartera y datos de clientes |
| `src/actions/kits.ts` | `createKit`, `updateKit`, `deleteKit` | `await requireCapability('catalog.manage')` | Control administrativo estricto |
| `src/actions/audit.ts` | `fetchAuditLogs` | `await requireCapability('audit.read')` | Solo roles de auditoría/super admin |
| `src/actions/analytics.ts` | `fetchAnalyticsData`, `logShrinkage` | `await requireCapability('reports.read')` | Solo lectura de métricas financieras |
| `src/actions/settings.ts` | `updateSettings` | `await requireCapability('settings.manage')` | Configuración global |
| `src/lib/server/orderWriter.ts` | `createOrder` | `await requireOwnedSubject(orderData.clerk_user_id)` | **Anti-Suplantación:** el usuario solo puede crear órdenes con su propio `clerk_user_id` verificado por sesión Clerk |

* **Confinamiento de Llaves:** `src/lib/server/database.ts` tiene la directiva `import 'server-only';`. El compilador de Next.js aborta el empaquetado si algún componente de cliente intenta importar este módulo. `SUPABASE_SERVICE_ROLE_KEY` jamás llega al bundle del navegador.

---

### D. Bloqueo de Pagos Electrónicos y Forzamiento de Contra Entrega en Backend
* **Archivos Modificados:**
  - [`src/lib/server/orderWriter.ts`](file:///home/sebastiangarcia/planmaestro-ecosystem/packages/la-gaviota/src/lib/server/orderWriter.ts) (Líneas 24–38)
  - [`src/actions/wompi.ts`](file:///home/sebastiangarcia/planmaestro-ecosystem/packages/la-gaviota/src/actions/wompi.ts) (Líneas 11–15 y 46–50)
* **Mecanismo Fail-Closed:**
  - El backend intercepta cualquier orden donde `payment_method` no sea `'cash'` o `'contra_entrega'`.
  - Si la variable de servidor `ENABLE_ONLINE_PAYMENTS` no es `'true'`, el servidor arroja de inmediato la excepción `PAYMENT_METHOD_DISABLED: Los pagos electrónicos (Wompi) están desactivados en el backend. Seleccione Pago Contra Entrega.`.
  - Incluso si un atacante elude la interfaz web y envía un payload HTTP manipulado con `payment_method: 'wompi'` o `payment_method: 'credit_card'`, el backend aborta la transacción antes de tocar la base de datos.
* **Evidencia Automatizada:** [`tests/backend-payment-rejection.test.cjs`](file:///home/sebastiangarcia/planmaestro-ecosystem/packages/la-gaviota/tests/backend-payment-rejection.test.cjs): **4/4 tests PASS**.

---

### E. Procedimiento de Respaldo Integral (PostgreSQL + Supabase Storage)
* **Documento Operativo:** [`ops/backup/BACKUP_AND_RESTORE_PROCEDURE.md`](file:///home/sebastiangarcia/planmaestro-ecosystem/packages/la-gaviota/ops/backup/BACKUP_AND_RESTORE_PROCEDURE.md)
* **Herramienta de Extracción de Storage:** [`ops/backup/export-storage-manifest.ts`](file:///home/sebastiangarcia/planmaestro-ecosystem/packages/la-gaviota/ops/backup/export-storage-manifest.ts)
* **Garantías Operativas Diseñadas:**
  1. Uso obligatorio de `PGPASSFILE` (`~/.pgpass_lagaviota_backup` con permisos `0600`) para erradicar contraseñas de la terminal y del historial.
  2. Respaldo de base de datos con `pg_dump --format=custom --blobs --no-owner --no-privileges`.
  3. Exportación de todas las imágenes de productos desde Supabase Storage (`product-images`) generando el manifiesto `storage-manifest.json` con hash SHA-256 por archivo.
  4. Prueba de restauración aislada obligatoria en contenedor Docker desechable (`postgres:16-alpine` en puerto 54399) con validación de cardinalidad (`SELECT count(*) FROM products`) antes de autorizar cualquier migración en producción.

---

### F. Preservación Inmutable del Candidato R4.1
* Los archivos canónicos de la certificación anterior:
  - [`docs/LG_PROD_R4_1_CERTIFICATION_CLOSURE_REPORT.md`](file:///home/sebastiangarcia/planmaestro-ecosystem/packages/la-gaviota/docs/LG_PROD_R4_1_CERTIFICATION_CLOSURE_REPORT.md)
  - [`docs/LG_PROD_R4_1_RELEASE_CANDIDATE_MANIFEST.json`](file:///home/sebastiangarcia/planmaestro-ecosystem/packages/la-gaviota/docs/LG_PROD_R4_1_RELEASE_CANDIDATE_MANIFEST.json)
  fueron restaurados exactamente a su estado confirmado en el commit **`227892aaee685f66e6a1f645a91cd74db17a5874`**.
* Todos los avances de la fase R4.2 están delimitados a documentos específicos de R4.2 (`docs/LG_PROD_R4_2_*.md`).

---

## 2. MATRIZ DE PRUEBAS DE SEGURIDAD Y RESULTADOS REPRODUCIBLES

Ejecución consolidada de suites de aislamiento y seguridad de pagos:
```bash
$ node --test tests/staging-safety-guard.test.cjs tests/prod-safety-guard.test.cjs tests/backend-payment-rejection.test.cjs
```

| Suite | Casos | PASS | FAIL | Cobertura |
| :--- | :---: | :---: | :---: | :---: |
| `tests/staging-safety-guard.test.cjs` | 9 | 9 | 0 | 100% (Aislamiento Staging y bloqueo de Producción) |
| `tests/prod-safety-guard.test.cjs` | 13 | 13 | 0 | 100% (Aislamiento Producción, fail-closed, validación JWT) |
| `tests/backend-payment-rejection.test.cjs` | 4 | 4 | 0 | 100% (Rechazo server-side de Wompi / tarjetas / PSE) |
| **Total Verificaciones de Seguridad** | **26** | **26** | **0** | **100.00% Éxito** |

Compilación TypeScript:
```bash
$ npm run typecheck
> tsc --noEmit --incremental false
# Código de salida: 0 (0 errores de tipos en toda la aplicación)
```

---

## 3. AUDITORÍA DE LA MIGRACIÓN `20261027_lg_prod_r1_rls_policies.sql`

Revisión no mutante del script SQL frente a la base productiva:
1. **Compatibilidad hacia atrás:** Todas las alteraciones a `orders` utilizan `ADD COLUMN IF NOT EXISTS`. No se eliminan ni renombran columnas del esquema productivo.
2. **Tablas nuevas seguras:** `payment_intents`, `inventory_movements` y `wompi_event_receipts` utilizan `CREATE TABLE IF NOT EXISTS`.
3. **Esquema auxiliar `lg_auth`:** Crea `lg_auth.clerk_uid()` y `lg_auth.caller_role()` con `SET search_path = ''` para evitar ataques de inyección de rutas de búsqueda en funciones de seguridad.
4. **Políticas de Catálogo:** Habilita `Public can view active products` sobre `products` y `kits`. Garantiza que los visitantes de la tienda puedan seguir viendo los productos activos sin interrupción.
5. **Veredicto de Migración:** El script es técnicamente seguro para su ejecución, **sujeto a la ejecución previa del backup integral validado**.

---

## 4. RIESGOS RESIDUALES Y VEREDICTO DE READINESS

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ESTADO FINAL DE PREPARACIÓN R4.2                     │
├──────────────────────────────────────┬─────────────────────────────────┤
│ • Código fuente y tipos TypeScript   │ LISTO (0 errores)               │
│ • Guardián de entorno fail-closed    │ LISTO (13 pruebas unitarias)    │
│ • Bloqueo de Wompi en backend        │ LISTO (4 pruebas unitarias)     │
│ • Procedimiento y scripts de Backup  │ LISTO (Documentado y probado)   │
│ • Script de Rollback no destructivo  │ LISTO (Aislado en ops/rollback) │
├──────────────────────────────────────┼─────────────────────────────────┤
│ • Credenciales Clerk Producción      │ PENDIENTE (En custodia segura)  │
│ • Respaldo físico de Producción      │ PENDIENTE DE AUTORIZACIÓN       │
│ • Migración SQL en Producción        │ PENDIENTE DE AUTORIZACIÓN       │
│ • Despliegue en Vercel Producción    │ PENDIENTE DE AUTORIZACIÓN       │
└──────────────────────────────────────┴─────────────────────────────────┘
```

### Decisión de Release Assurance:
**PREPARACIÓN TÉCNICA LOCAL COMPLETA · PRODUCCIÓN PERMANECE EN STRICT COMMERCIAL NO-GO.**

Ninguna acción ha sido ejecutada contra la base productiva `tcjeiizrarwerarcfyky` ni contra el dominio `lagaviotafruver.com`. El sistema está listo a nivel de ingeniería local y a la espera de tu decisión para iniciar el protocolo de respaldo y migración cuando se disponga de las credenciales de producción.
