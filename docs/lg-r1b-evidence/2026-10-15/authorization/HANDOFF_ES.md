# LG-R1B — Handoff de autorización, propuesta NO aplicada

Estado: **preparación aislada completada; release comercial NO-GO**. Ningún parche fue aplicado al repositorio original, ninguna política fue aplicada a producción y ningún SDK/cliente real o credencial fue utilizado por el harness. Root mantiene el documento canónico y el baseline completo; este archivo es evidencia subordinada de la pista de autorización.

## Autoridad y restricciones

Se leyó la directiva LG-R1B exacta adjunta. Se retomó el trabajo tras la autorización expresa; no se volvió a escalar la asociación ya revisada del deploy con49add73. No se investigó explotabilidad en vivo ni apareció evidencia nueva de compromiso. Se preservaron las fronteras originales: sin .env, usuarios reales, transacciones, Wompi live, instalaciones en el repo, cambios de servicios, commit/push/deploy ni graphify hook (no se editó código del repo).

Skill Clerk router leído; la guía clerk-nextjs-patterns referenciada no está instalada y las docs Next locales no existen en el árbol compartido. Se consultaron fuentes primarias como fallback antes de proponer código: [Clerk RBAC](https://clerk.com/docs/guides/secure/basic-rbac), [Clerk server actions](https://clerk.com/docs/reference/nextjs/app-router/server-actions), [Next data security](https://nextjs.org/docs/app/guides/data-security) y [Next serverActions/bodySizeLimit](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions). No se migró ClerkCore ni se ejecutó código tomado de documentación.

## Modelo propuesto

Identidad = auth Clerk. Aplicación = publicMetadata fresco obtenido por users.getUser en servidor; la lectura de la identidad propia es necesaria para autorizar y se cuenta separadamente de operaciones sobre recursos/usuarios arbitrarios. El helper rechaza usuario ausente, ID distinto, banned/locked y roles inválidos en los caminos privados. Un WeakSet marca los actores emitidos y evita construir el cliente privilegiado con objetos fabricados en proceso. Cada llamada nueva vuelve a leer metadata; no se usa cache persistente de privilegios.

Role y tier se separan. ADMIN tiene administración de catálogo/precios/inventario/clientes/pedidos/pagos/reportes/proveedores/settings/tier y escritura de auditoría. SUPER_ADMIN añade enumeración/gestión de identidades y lectura de auditoría. USER y CLIENT identifican clientes, mientras los tiers Personas Naturales/Micromercados/Restaurantes seleccionan sólo el precio comercial autorizado. **Tier=admin/SUPER_ADMIN nunca eleva**; role=admin en minúsculas tampoco. OPERARIO y COMMERCIAL se reconocen pero no reciben capacidades de bodega, comerciales, asignadas o administrativas inventadas. Las capacidades de cliente propias siguen disponibles para etiquetas reconocidas. Cuenta nueva sin role se trata explícitamente como retail USER; role desconocido es INVALID y no equivalente a cuenta nueva.

Matriz completa: role-capability-ownership-matrix.json y ROLE_MATRIX_ES.md. Las decisiones ADMIN vsSUPER_ADMIN, aliases legacy, permisos OPERARIO/COMMERCIAL, visibilidad pública del stock exacto, autoedición de rol/tier y downgrade SUPER_ADMIN requieren aprobación antes de aplicar. Se prohíbe la autoedición de identidad y el downgrade de otro SUPER_ADMIN mediante el flujo genérico para no degradar el último administrador accidentalmente.

Autoridad DB coordinada con arquitecto: native ClerkJWT con sub TEXT para SELECT de filas propias; service_role sólo en módulos server-only y después del guard para operaciones de servidor. **service_role evita RLS**: los guards/proyecciones/filtros son esa frontera, no una afirmación de protección RLS para el cliente privilegiado. No hay role mirror, registry paralelo ni broker nuevo. Los SELECT owner de SQL dependen sólo de identidad nativa válida: un role de aplicación desconocido puede conservar SELECT de sus filas por JWT nativo, aunque el helper servidor sea más estricto. Esta asimetría se declara; no se presenta una denegación global de identidad inválida que SQL no pruebe.

## Qué cambia en el overlay

- Cada acción administrativa original tiene guard por capacidad antes de lecturas/escrituras sobre objetivos arbitrarios; los IDs objetivo con formato inválido se rechazan. Roles/tiers editables usan enums cerrados. reviewed_by y closed_by_user derivan del actor, no del nombre/ID suministrado por el caller.
- createOrder desaparece del módulo use-server exportado. Su cuerpo de escritura existente se mueve a lib/server/orderWriter con server-only, sin use-server y con sujeto propio/admin autorizado. Sólo imports internos de cash/Wompi cambian. **La secuencia header/items sigue sin ser transaccional; no se corrigieron cantidades, inventario, pagos, ROI o idempotencia.**
- Product público contiene price/previousPrice del tier autorizado, sin baseCost ni otros precios. AdminProduct conserva los campos administrativos y fetchAdminProducts exige capacidad. Los consumidores existentes se adaptan al DTO; no se añadió selector de cantidades ni rediseño visual.
- fetchProducts usa catalog_public/kits_public, coordinados exactamente con SQL. El lookup B2B de precio usa actor fresco; falta de fila falla cerrado y previousPrice=null no cae incorrectamente al precio anterior retail. Los servicios B2B usan clerk_user_id y proyección de líneas sin products(*); **getMonthlySpend conserva el problema preexistente de statuses ingleses**, fuera de este paquete.
- CartPersistence migra arrays legacy a envelopeV2 de IDs/cantidades, descartando costos/precios persistidos; se reconcilia con catálogo actual antes de habilitar escritura/checkout. Error o SKU ausente/inactivo conserva el draft y muestra error, bloqueando checkout. Hay límites técnicos de restauración:1MiB/300líneas/quantity finita positiva≤1e6; no son reglas comerciales de cantidad. Cambios de auth/tab y comportamiento React completo necesitan E2E; no se presume resuelto por helper puro.
- Dos schedulers requieren secreto configurado≥32caracteres y comparación constante, antes de acceder al cliente service. Lead capture sigue deliberadamente público con body≤8192bytes/campos cerrados/proyección de insert; no se inventó un rate limiter distribuido. Sync de carrito exige identidad y consulta propietario; su ordering/completion/retención sigue pendiente.
- getInventorySettings devuelve únicamente booleano actual mediante una lectura fija privilegiada; un error ya no se convierte en falso silencioso. El marketing RSC exige reports.read. Audit sink es lazy/server-only, sin fallback anon, y se alinea a actor/action/target/category/details/metadata del schema observado; mocks no prueban durabilidad ni entrega de logs reales.
- Tres acciones de media exigen storage.manage, buckets fijos, destino managed/kind/UUID, MIME/magic y≤2MiB. ProductForm/KitsClient usan estas acciones, sin SDK anon de upload. Next propone bodySizeLimit3mb para multipart+overhead; el default1MB rompería archivos válidos2MiB. No se amplían allowedOrigins. Sólo se validan cabeceras/MIME/tamaño: **no se certifica decodificación completa, antivirus ni límites de píxeles**. Replace conserva blob previo. Delete exige referencia del DB, origen y path managed aprobados, y ausencia de uso compartido en ambas tablas products/kits. El conteo y borrado no son una transacción contra remapeo concurrente; política de retención/purga sigue decisión previa a activar esa capacidad. deleteProduct conserva objetos históricos/compartidos para recuperación.
- Middleware/useRBAC/admin navigation adoptan ADMIN vsSUPER_ADMIN sin privilegios de tier/casing. El build/runtime Clerk dentro de middleware y la migración de operadores legacy están pendientes; TypeScript no sustituye la prueba HTTP de ese contexto.

## Evidencia ejecutada

**535/535 PASS** de casos fuente/VM, bajo Node24.21.0 efectivo. Son pruebas sintéticas de comportamiento candidato y una reproducción baseline, no535pruebas de producción. El otro agente realiza la repetición independiente con Node24.13; su resultado es autoridad separada, no duplicar conteos.

Comando:

    env -i PATH=/usr/bin:/bin LANG=C.UTF-8 node /home/sebastiangarcia/.local/share/la-gaviota/lg-r1b-20261015/authorization/run-synthetic.cjs

El proceso rechaza variables de entorno adicionales; VM recibe sólo URL .invalid y claves ficticias. Imports de Clerk/Supabase/Next se interceptan; nunca se carga su implementación real. Import map de código rechaza módulos no permitidos; no existe fetch global ni clientes de red. Se comprueba rechazo de URL externa y referencia .env, actor falso no emitido, mismatch sujeto, capability desconocida incluso SUPER_ADMIN y fallo de lookup. Esto es una barrera de harness, no sandbox de kernel frente a código hostil arbitrario.

Cobertura: todas las capacidades staff con guest/retail/micro/restaurante/operario/commercial/invalid/tierlegacy/casinglegacy negados y admin/super positivos; targets inválidos; revocación role vsclaim stale; owned order/profile/application y cross-owner; private writer y cash/Wompi init; catálogo público/tier sin costos y catálogo admin completo; scheduler missing/wrong/missing-config secret y positivo; media upload/replace/delete, MIME/size/URL/two-table usage/fallo; SSR owned history/marketing; audit sink; public settings true/failclosed; legacy cart/corrupt/inactive/missing/NaN.

**TypeScript source-only PASS** usando el tooltree final aislado preparado por la pista de reproducibilidad. No app build/config execution, servidor, SDK real o generación Prisma. **Lint sigue FAIL heredado**: candidato53archivos36errors/28warnings; mismos47archivos originales37errors/30warnings, más6helpers nuevos. Comparación normalizada por archivo/regla/severidad/primera línea: cero mensajes nuevos, tres eliminados. Excluir rutas absolutas y snippets con líneas desplazadas evita atribuir errores antiguos a parches nuevos. No se hizo limpieza general de lint.

**git apply --check exit0**, sólo comprobación, NO aplicación. Original59callables inventariados; propuesta62exports: se retira createOrder, se añade fetchAdminProducts y3media; el writer es interno no callable. callable-coverage-final.json documenta cada uno, guard, scope, pruebas y exclusiones. La presencia de funciones/exportaciones en AST y sus invocaciones VM **no prueba registro ni dispatch HTTP de Server Actions**.

## Bloqueadores y límites de activación

1. Webhook Wompi original sigue con anon y los defectos financieros R2. Al endurecer SQL dejará de escribir. **No se convierte a service_role sin validar callbacks/intent/state**. Activación de política completa BLOCKED por esa transición y los P0 financieros.
2. OrderKanbanBoard conserva Realtime anon, que no recibirá todos los pedidos administrativos con SQL owner-only. Se requiere refresh/poll de servidor autorizado o diseño Realtime apropiado; no se dieron permisos DB al JWT admin para ocultarlo. Función realtime administrativa BLOCKED.
3. No se probó JWT gateway de Clerk/Supabase, expiración/revocación de tokens, SDK real, middleware runtime, HTTP acciones/CSRF/body bound, service credential injection o sesiones/navegador. Los pruebas SQL reales de otro agente no equivalen a JWT gateway.
4. Metadata legacy y reglas OPERARIO/COMMERCIAL no fueron enumeradas en cuentas reales. Aplicar el guard exacto sin una migración aprobada podría bloquear operadores válidos. No se altera ningún usuario.
5. Service_role requiere provisión server-only explícita y sin anon fallback; su falta falla cerrado. Vista pública requerida debe existir antes del corte de DTO. Dirección configurada debe coincidir con image remotePatterns; no se leyó configuración productiva.
6. Subida multipart3MB global amplía el límite framework; las acciones siguen necesitando sus propios bounds, rate limits y validación financiera R2. Lead capture público necesita antiabuso distribuido/consentimiento/retención apropiados. Media full decode/retención/uso concurrente sigue pendiente.
7. Monthly spend/status, checkout unit/price-change confirmation, stock/reserva/concurrencia/idempotencia, receipts y balance ownership son R2; conservar un camino de ejecución no prueba corrección monetaria.
8. El adaptador del carrito conserva IDs/cantidades, no promete merge multi-tab ni cross-device; flujo auth/tier y errores reales debe validarse en navegador aislado.

## Siguiente autorización exacta y rollback

Propuesta técnicamente revisable para implementar guardrails en una rama aislada **después de aprobar matriz/aliases y decisiones pendientes**, aplicando el patch concreto a49add73 y usando el candidato de dependencias revisado. No autorización de release ni migración productiva.

Secuencia: aprobar capacidades/roles+metadata migration → provisionar test Clerk/DB/storage y service credential server-only → crear vistas públicas compatibles sin retirar aún permisos originales → aplicar la propuesta a checkout aislado → tests HTTP/SDK/roles/owners/media/multipart/React y regresión legítima → resolver transiciones webhook R2 y realtime → revisión coordinada de SQL/políticas y aprobación separada de release exacto. Probar fallos DB/Clerk y rollback con artefacto/fixtures; no volver a USING(true) ni conceder roles por tier. Ante fallo, suspender el release/capacidad afectada conservando datos y objetos, mantener denegación y corregir en staging. No asegurar seguridad por rollback a una build vulnerable.

## Artefactos y preservación

- application-security-proposal.patch: diff definitivo NO aplicado.
- proposal-files.json / EXACT_PROPOSED_FILES_ES.md: lista exacta53archivos (47existentes+6nuevos) y hashes.
- proposal/: overlay definitivo; baseline/: fuentes comparadas. historical-generation/: scripts intermedios de construcción, **no reproducen las refinaciones finales y no deben ejecutarse como receta**. El diff definitivo es la autoridad de materialización.
- callable-inventory.json original59; callable-coverage-final.json propuesta62+remoción/writer.
- role-capability-ownership-matrix.json y ROLE_MATRIX_ES.md.
- run-synthetic.cjs / synthetic-results.json.
- patch-check.json, typecheck-result.json/typecheck.log, scoped-eslint-{baseline,candidate}.json, lint-comparison.json, source-preservation.json.

Se compararon SHA de los47fuentes originales representados: idénticos; root conserva el inventario completo. No se tocó aplicación original ni producción. Se inició sólo compilación/lint/procesos finitos propios ya terminados; no servidores ni background workers.

Incidente de entorno: filesystem raíz llegó100% y falló una escritura del script suplementario (archivo0bytes). Se detuvieron writes/tests por instrucción de root. El owner de caché recuperó espacio propio; se reanudó con preflight≥512MiB, sin borrar artefactos ajenos ni archivos de aplicación. No fue defecto del producto ni evidencia de compromiso. Las métricas exactas de tokens/tier/costo no están expuestas y no se inventan.
