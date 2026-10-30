# LG-R1C — pista de implementación/autorización

**Resultado local: PASS en regresión de fuente sintética; runtime/SDK/gateway sigue condicionado. Producción: NO-GO.** Este handoff es subordinado al informe de root. No es otra auditoría ni autorización de release.

## Implementación y procedencia

Clone independiente: /tmp/la-gaviota-lg-r1c-20261015/application, HEAD49add73ae90b837c36553a0f2b535267c9610143. Root aplicó los parches congelados53aplicación+2dependencias y registró hashes/aplicación en patch-application.json. No se reconstruyó ningún patch de memoria. Se leyó la directiva LG-R1C completa, AGENTS del paquete y las guías locales coincidentes Next16.4.1 (data-security, server-actions, authentication, serverActions) antes de escribir código. Clerk6.x continúa; no identidad paralela ni role mirror.

Esta pista no editó el repositorio original. Sólo realizó una corrección estrecha de integración en **dos archivos ya aprobados** del clone: middleware.ts y src/lib/server/authorization.ts. No hubo correcciones de lint ni cambios de permiso, precio, cantidad, stock, estado financiero o fórmula. El owner confirmó expresamente tiers.manage para ADMIN y SUPER_ADMIN; se conserva exactamente.

## Corrección de contexto Clerk revisada y aplicada

La revisión del SDK instalado6.39.7 confirmó: clerkMiddleware invoca su handler con callback auth verificado antes de decorar headers de autenticación downstream; el auth() exportado lee next/headers. El candidato congelado llamaba getActor→auth() dentro de middleware, mezclando contextos. Esto es un riesgo de integración confirmado por el orden/código del SDK, no reproducción de fallo en producción.

Se preparó el diff exacto middleware-context-compatibility.patch (SHA25630f8b701b6e289b2fbad0c3100e11f18557338f8d023f9be210f003494e5b9a1), se presentó a root y QA independiente, y sólo después de ambos acuerdos se aplicó al clone. middleware-context-applied.json conserva antes/después y autorización.

getMiddlewareActor recibe exclusivamente el callback verificado de Clerk desde middleware. No recibe IDs ni headers del request como autoridad. Es un export interno en módulo server-only, **sin use-server ni endpoint público**. El resolver privado de metadata fresca permanece byte a byte igual; getActor ordinario sigue usando auth() para Server Actions downstream. Roles, tiers, capabilities conocidas, marca WeakSet y ownership no cambian. La comparación del cuerpo y del sufijo de controles está en middleware-context-review.json.

## Regresión ejecutada sobre los archivos implementados

El harness original se adaptó para leer **sólo archivos del clone aplicado**, no proposal y sin fallback al repo original. Única excepción histórica: el caso baseline de mutación de rol lee users.ts del snapshot inmutable previo. Todas sus dependencias siguen mocked. Se registran SHA de29 módulos aplicados efectivamente cargados y comparación posterior: idénticos durante cada ejecución. El resto del scope se verifica mediante hashes/compilación/revisión; no se afirma ejecución de53 interfaces visuales.

Comando final:

    env -i PATH=/usr/bin:/bin LANG=C.UTF-8 /home/sebastiangarcia/.nvm/versions/node/v24.13.0/bin/node /home/sebastiangarcia/.local/share/la-gaviota/lg-r1c-20261015/implementation/run-implemented-synthetic.cjs

**535/535 casos únicos nombrados PASS**,0fail/0skip. Hubo una corrida inicial del patch congelado y una repetición final tras la corrección de contexto; son replays de los mismos535casos, no1070pruebas únicas. La instrumentación delega las mismas aserciones sin cambiar semántica: **2001invocaciones de assert,91sitios estáticos y91sitios dinámicos distintos**. Estos números incluyen validación de fixtures/excepciones esperadas y no representan91propiedades de seguridad independientes.

Cobertura incluye guest/retail/B2B/admin/super/operario/commercial/invalid, roles legacy, target inválido, owned/cross-owner, metadata fresh vsclaim stale, errores de identidad, catálogo safe+admin, writers internos, media, scheduler y escenarios de compatibilidad. Los positivos ADMIN y SUPER para tier se conservan; los restantes roles no reciben ese privilegio.

Regresión adicional separada middleware-context-regression.cjs: **20/20casos PASS**,51assertinvocations,30sitios dinámicos. Ejecuta middleware/helper reales del clone con SDK/request/response inyectados: callback correcto aunque auth exportado simulado falle antes de decoración; rechazo de headers forjados/claims stale; roles/tier y dashboard; banned/locked/mismatch/lookup/callback failure; rawID rechazado; getActor ordinary usa exportauth; guest y decisión tier preservados. **No prueba autenticación real de Clerk, firma JWT ni HTTP.** Resultados middleware-context-results.json. QA independiente reproduce por separado; no sumar sus replays a casos únicos.

## Compatibilidad y fronteras

financial-import-compatibility.json demuestra que el cuerpo comercial de createOrder coincide exactamente con49add73 tras remover únicamente las dos líneas agregadas de guard+cliente. Su export callable desapareció y sólo cash/Wompi importan el writer server-only. Se preservaron SHA de lib/wompi, webhook, Prisma/schema y SQL setup. No se corrigieron atomicidad, idempotencia, cantidades, stock/reservas, balance references, callback state ni refund real; son LG-R2.

El read de inventory setting ya propuesto falla cerrado ante ausencia/error en lugar de defaultfalse. El público conserva price/previousPrice autorizado sin costos/otros tiers; AdminProduct separado mantiene administración. El carrito legado conserva IDs/cantidades y reconcilia pricing, con fallos explícitos. Son fronteras/adaptadores incluidos en el patch aprobado, no redesign de UX.

Los clientes service_role son server-only y posteriores al guard, o lectores públicos de proyección fija. **service_role bypass RLS**: la protección de estas operaciones depende del guard y query/proyección; mocks no certifican aislamiento de secretos en bundles. SQL nativo owner subTEXT/no role mirror se mantiene como propuesta no aplicada. Webhook anon y Realtime Kanban siguen bloqueando activación coordinada de las políticas estrictas; no se les otorgó service_role para ocultarlo.

La revisión de labels sólo inspecciona fuente: role-label-source-inventory.json y ROLE_LEGACY_MIGRATION_PLAN_ES.md. role=admin minúsculas, privileged tier-only, conflictos y permisos OPERARIO/COMMERCIAL necesitan proceso explícito. No se enumeraron ni cambiaron cuentas reales. Cuenta nueva sin role es USER; role desconocido no equivale a metadata ausente. Footer sigue esperando minúsculas y Header elige portal por tier fuera del scope53; navegación real administrativa queda pendiente, sin cambio fuera de autorización.

## Calidad, alcance y límites

Release owner reporta typecheck final PASS y lint scoped36errores/28warnings heredados frente a37/30 de47archivos baseline,0diagnósticos nuevos,0fatal; no limpió lint ni alteró código. Evidencia de release es la autoridad de esos checks. SQL315 de LG-R1B no fue repetido ni aplicado por esta pista y no se reutiliza como prueba de gateway.

final-implemented-scope-hashes.json registra55archivos aprobados: **53 coinciden con su versión congelada (51app+2deps)** y2app contienen sólo el delta de contexto revisado. No se añaden paths de aplicación fuera de los55. La preservación completa del repo original/producción la verifica root por su baseline; esta pista no llamó servicios reales ni abrió credenciales.

Pendientes: prueba de SDK/headers reales y Server Action dispatch, login/expiry/roles en navegador, manifest de acciones/build, JWT gateway/RLS/Storage, credenciales server-only reales y bundles; migración de metadata legacy; transiciones Wompi/Realtime; advisory residual; lint heredado. Ningún mock se presenta como PASS de runtime o comercial.

## Próximo gate

Candidato local apto para revisión de integración aislada dentro de estas evidencias; no autoriza SQL ni deployment. Antes de siguiente fase: aprobar fixtures/servicios Clerk/Supabase dedicados, comprobar contexto SDK/HTTP, source bundle/public DTO/SSR y media multipart, mantener cierre ante error; diseñar transición webhook+Realtime separada y plan LG-R2 financiero. Cualquier modificación real de roles/políticas/producción requiere su propia autorización.

Se detiene esta pista tras evidencia. No procesos propios permanentes, servidores o servicios nuevos. No .env real, SDKs/clientes reales en VM, usuarios/clientes reales, transacciones/pagos/refunds, SQL migrations, original source edits, commit/push/merge/deploy. Exacttokens/tier/costo no expuestos y no se fabrican.
