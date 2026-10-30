# LG-RUNTIME-E2E — seguridad de datos y Storage

2026-10-15. **Modelo SQL local PASS (322/322); fuente actual con stubs PASS (118/118); políticas/JWT/Storage remotos UNKNOWN y E2E real BLOCKED hasta designación y autorización del sandbox. No release.** No se leyó `.env`, secretos, clientes, órdenes o cuentas reales. No hubo consultas de metadata remota ni modificaciones del aplicativo/políticas remotas. El grafo committed se consultó sólo como orientación; las comprobaciones usan los archivos actuales y sus hashes.

## Evidencia ejecutada

- PostgreSQL18 real, cluster sintético nuevo, socket privado0700 sin TCP, subprocess env limitado a PATH/LANG/LC_ALL.322 casos PASS:315 del contrato R1B preservado +7 del contrato de consultas actual. Tablas/datos/roles locales ficticios; `auth.jwt()` y helper Storage son stubs. La suite NO valida firmas/issuer/audience/exp JWT, Clerk gateway, PostgREST, Storage/CDN, realtime o políticas del proyecto existente.
- SQL candidato preservado SHA256 `88eff4933862913457e11e92474d4cf9d83501b8f9afcacb340e238cfb164def`; fixture `018c98ae260d2ce4be0eeed798811c0ef3ca27f1f93895cd4e34d55f836528c9`; harness ejecutado `3737e9844293bf3d6a4827ddb67887d89a17b83fb529d4a930b9232a14f6f460`. No se alteró/aplicó SQL en el repo ni en servicios reales.
- PID482867 detenido `pg_ctl -m fast` exit0; PID muerto, socket vacío y postmaster.pid ausente. Se preserva cluster privado; no se tocaron servicios ajenos. Disco raíz final observado1,910,263,808bytes libres. El guard del harness exige1GiB en su filesystem de stage; el root preflight y comprobación final verificaron por separado el filesystem raíz. Evidencia `private-pg/{test-results,test-summary,cleanup,cluster-settings,provenance}.json`.
-118 casos ejecutan por transpile/VM los archivos actuales `authorization.ts`, `database.ts`, `scheduler.ts`, `customers.ts`, `b2b.ts`, `media.ts`. SDK Clerk, Supabase y cache Next son stubs explícitos con identidad/datos ficticios, env sintético y loader allowlisted sin acceso a red. Hashes source antes/después idénticos. `guard-media-results.json` registra cada caso y hashes. No se cuentan runs previos otra vez.

## Contrato y resultado por frontera

| Frontera | Positivo observado | Negativo observado | Límite |
| --- | --- | --- | --- |
| Catálogo anon SQL | Proyección exacta actual products12columnas y kits5columnas devuelve activo | base_cost/otros precios y SELECT* negados | Modelo SQL, no consulta Supabase real |
| Owner SQL | retail,micro,restaurant y otros sub TEXT leen sólo propias6familias | otro dueño, sub inválido, anon y DML de usuario denegados | Token firmado y revocación son responsabilidad gateway no ensayada |
| Staff SQL directo | No se conceden privilegios por claims ADMIN/SUPER_ADMIN | DML y tablas internas denegados incluso claim de admin | El staff real usa servidor; no JWT elevando rol DB |
| Servidor actual | Actor emitido y fresco, ADMIN/SUPER_ADMIN capacidades; B2B filtra user_id/clerk_user_id verificado | Actor forjado, unknown/lowercase admin, banned/locked, error Clerk y crossowner retail fallan | Stub Clerk, no cuentas reales; metadata fresca no revoca operación ya iniciada |
| Profile actual | Dueño puede actualizar proyección fija de contacto | Otro dueño y tier retail forjado negados; crédito/saldo/assigned_rep no reenviados | No API/DB reales ni consistencia distributed Clerk↔DB |
| Media actual | ADMIN/SUPER_ADMIN upload product/kit path managed UUID; replace conserva blob anterior; delete mapping único verificado | Guest/retail/operario/commercial/unknown, tipo/tamaño/MIME, origen ajeno, URL no managed, referencia compartida negados | Magic bytes no son decodificador completo, tamaño actual2MiB; Storage real no ejecutado |
| Scheduler actual | Secreto sintético correcto permite cliente servidor | Ausente/incorrecto falla antes del cliente | No cron real ni envío de mensajes |
| Storage SQL | Sólo contexto de get público según helper ficticio | List/contexto ausente/bucketmetadata/private/DML usuario negados | Public CDN bytes no quedan demostrados por SELECT storage.objects |
| service_role SQL | Intencionalmente lee todos dueños y escribe costo/blob privado | RLS NO contiene a ese rol | Guard y query scope servidor son la garantía, no RLS |

## Compatibilidad con el worktree actual

1. `src/actions/products.ts:440` consulta `products`/`kits` directamente con anon y proyecciones explícitas. Los DOS casos nuevos exactos PASS contra el candidato SQL: éste concede columnas seguras de base además de views `catalog_public`/`kits_public`. Por ello **no se declara incompatibilidad sólo por no usar las views**. No se certifica equivalencia PostgREST real ni existencia de esas columnas/grants reales.
2. `src/lib/server/database.ts:7` usa exclusivamente service_role después de `assertIssuedActor`. Las lecturas B2B/portal con este cliente dependen de `.eq(user_id|clerk_user_id, verifiedUserId)`. RLS owner directo no protege estas lecturas. La suite VM comprueba filtros de los cinco métodos B2B; no afirma certificar cada ruta del aplicativo.
3. `app/api/webhooks/wompi/route.ts:6` conserva cliente anon: read orders, update orders y read order_items **42501 bajo el modelo**. No activar el SQL sin transición separada/revisada del callback y garantía de integridad de pagos. Cambiarlo sin más a service_role abriría bypass; este track no lo hace.
4. `app/admin/orders/OrderKanbanBoard.tsx:40` conserva cliente anon de realtime. SELECTorders42501 en modelo demuestra que no debe suponerse un feed administrativo autorizado. Falta ensayo realtime en sandbox y decisión de transporte autenticado/servidor.
5. `src/actions/media.ts` ya usa servidor guardado; ProductForm/KitsClient deben probarse con Storage real sólo en bucket de test designado. La eliminación retiene fallos recuperables y evita blobs legacy/no managed; no garantiza transacción entre mapping DB y blob.
6. `getServerDatabase` acepta un actor autenticado válido, incluyendo retail; no es un guard de capacidad por sí mismo. Cada callsite privado debe pedir su capacidad o filtrar ownership. `current-client-source-inventory.json` enumera24archivos con llamadas detectadas estáticamente; no es prueba de reachability/completitud de exportaciones.
7. Autoridad: Clerk auth + metadata fresca server; ningún mirror de rol DB. Un JWT de usuario con rol app desconocido puede leer propias filas bajo política SQL de identidad; el servidor actual INVALID niega métodos privados. Esta asimetría está documentada y no concede staff.

## Gate pendiente y siguiente ejecución concreta

- Owner debe designar proyecto Supabase de test aislado, cuentas Clerk ficticias retail/micro/restaurante/admin/superadmin y dos propietarios, buckets y notificaciones/pagos sandbox. La configuración existente no se presume sandbox. Hasta entonces: **cero pruebas remotas mutantes o consultas privadas**.
- Entregar `metadata-attestation.sql.txt` a sesión metadata-only autorizada: RLS/policies, ACLs efectivas de tabla/columna/roles, defaults, schema/constraints/indexes, views/RPC/helpers; no rows de usuarios/órdenes/objetos ni bodies de funciones/secretos. SQL es draft no ejecutado remotamente; revisar resultados antes de conservar/publicar. RLS desactivada, OR policies permisivas, memberships o grants extra bloquean aceptación.
- Atestación separada de issuer/JWT/TTL, Data API schema exposure, Storage versión/helpers y configuración de buckets/realtime. SQL de metadata no demuestra validación JWT.
- Reproducir deny/allow contra gateway sandbox real: guestcost/PII/write; owner propio/ajeno; micro/rest price; admin capacidad y downgrade siguiente llamada; token faltante/firma errónea/expirado; Storage publicGET/list/upload/replace/delete/errores y publicación realtime. Usar sólo registros/archivos marcados de test y limpieza inventariada. No hacer rollback a USING(true)/grantsALL.
- El SQL monolítico R1B continúa **NO APLICABLE automáticamente**: preconditions de metadata y callbacks/realtime son gates abiertos. Si se requiere split additive-first, diseñarlo y ensayarlo aparte; no se afirma que exista esa transición probada.

## Reproducción local ejecutada

```
env -i PATH=/usr/bin:/bin LANG=C.UTF-8 LC_ALL=C.UTF-8 /usr/bin/python3 /tmp/la-gaviota-runtime-e2e-20261015/security/private-pg/run-runtime-model.py
env -i PATH=/usr/bin:/bin LANG=C.UTF-8 LC_ALL=C.UTF-8 /usr/bin/node /tmp/la-gaviota-runtime-e2e-20261015/security/guard-media-model.cjs
```

El harness PG rechaza data/ existente: ese comando describe la ejecución realizada, no reinicia ni borra evidencia. Una reproducción requiere stage nuevo, revisión de paths/hashes/sentinel y lease propio. El harness VM sí puede repetirse sin servicios reales; reemplaza su propio JSON de resultados.

Referencias primarias verificadas: [RLS y grants/service_role](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [Clerk Third-Party Auth](https://supabase.com/docs/guides/auth/third-party/clerk). Documentación de producto no acredita configuración del proyecto real.
