# LG-R1C — QA independiente y ejecución real de framework

Veredicto: **modelo local de autorización y revisión independiente PASS; integración real completa BLOCKED; comercial NO-GO**. Se revisó el clon real `/tmp/la-gaviota-lg-r1c-20261015/application`. No se editaron archivos de aplicación por este track ni se consultaron producción, cuentas o credenciales. No se aplicó SQL ni inició PostgreSQL.

## Implementación y procedencia

Se observaron inicialmente los53 hashes exactos de la aplicación congelada y manifest/lock aprobados. Tras la corrección autorizada, los55 hashes finales coinciden exactamente con Release Engineering: sólo middleware.ts y src/lib/server/authorization.ts difieren del patchR1B por el patch de compatibilidad30f8b701b6e289b2fbad0c3100e11f18557338f8d023f9be210f003494e5b9a1. `final-55-file-hashes.json` y `final-test-executions.json` son la evidencia.

AST independiente:59 callables originales(54Server Actions+5POST),62 en candidato(57acciones+5POST). Añadidos uploadCatalogMedia/replaceCatalogMedia/deleteCatalogMedia/fetchAdminProducts; createOrder deja de ser Server Action y queda en módulo server-only. No hay omisiones frente al inventario original. Se verificaron seis cuerpos financieros más createOrder trasladado por tokens tras excluir expresamente guards, construcción de cliente, validación de ID y atribución closed_by_user al actor. No se acredita matemática correcta, transacciones, idempotencia o checkout seguro.

## Pruebas reproducidas contra archivos aplicados

- Suite crítica535/535PASS, reproducida independientemente;2001 llamadas assert,91 posiciones estáticas. Estas cantidades no equivalen a2001 propiedades de seguridad distintas.
- Suite nueva de contexto20/20PASS, reproducida independientemente;51 llamadas assert.
- QA propia12/12PASS: banned/locked, sub discordante, capacidades desconocidas, copia de actor, ausencia de servicekey sin fallback, owner/ADMIN, proyección pública y whitelistlead.
- QA propia adicional de contexto5/5PASS: callback verificado sin exported auth disponible, guest, sub inválido, callbackfallido, claims antiguos ignorados frente a metadata fresca.

Cero failures/skips e intentos de red instrumentados. Se informan suites y replays por separado; algunas fronteras coinciden, por lo que no se suman como afirmaciones únicas. Node24.13.0, entorno sóloPATH/LANG, guard de APIs de red y loaders estrictos del clon real. La única excepción histórica es una prueba de vulnerabilidad baseline que lee una copia preservada de users.ts; jamás se usa como fallback del candidato.29 hashes de archivos efectivamente cargados quedan en el resultado535 y permanecen iguales.

**Todas estas suites inyectan Clerk/Supabase/Next/contexto/notificaciones sintéticos. No verifican identidad Clerk real, dispatchHTTP, gatewayJWT ni datos reales.**

## Regresión de contexto descubierta y corregida

El SDK6.39.7 ejecuta el callback de clerkMiddleware antes de decorar los headers del request downstream. auth() exportado reconstruye request con next/headers y exige AuthStatus; el callbackauth proviene directamente del estado verificado. El uso nuevo de getActor()->auth() dentro del middleware introducía una dependencia de contexto no probada por los mocks iniciales. Se documentaron archivos/hashes/líneas exactos en middleware-sdk-context-review.json. El impacto sobre una sesión real sigue INFERRED, no se afirmó bypass ni exploit.

Se revisó antes de aplicar el diff exacto de dos archivos. getMiddlewareActor recibe únicamente ClerkMiddlewareAuth, llama callback y delega a un resolver privado. Conserva users.getUser fresco, banned/locked/sub, roles/tiers/capabilities, WeakSet de actores emitidos y getActor normal de Server Actions. El tipo se exporta realmente en el SDK instalado. No acepta headers ni IDstring como autoridad. ADMINtiers.manage se preserva conforme a decisión explícita del owner. Fuente/TS/mocks cubren la corrección; el login real sigue pendiente.

## Framework real, sin credenciales

Se invocó Next16.4.1/Turbopack real mediante Node24.13.0 dentro de namespaces nuevos user+network, sin rutas externas, sin.env productivo y con keyless/telemetry desactivados. Build terminó exit1 tras26.071s: `next/font` no pudo obtener Inter desde GoogleFonts. No hubo buildcompleto ni pruebasHTTP/SDKauth/portales.

Limitación adicional: loopback quedó down. Strace registra16 intentos externos deDNS sin éxito y11 conexiones loopback también bloqueadas; esto impide inferir compilación completa aunque el error final visible sea la fuente. El próximo harness debe habilitar únicamente loopback, mantener cero rutas externas y suministrar fonts/servicios sintéticos mediante seams revisados. No se repitió build para fabricar PASS.

El primer intento se abortó erróneamente al leer vsize comoRSS porque `/proc/PID/stat` contiene nombres con espacios. Se preservó como diagnóstico de verificador, se corrigió con statm resident y parseo seguro, y root autorizó una repetición con el mismo cap3GiB/120s. No fue fallo de aplicación ni ENOSPC. La ejecución correcta mantuvo mínimos: raíz3675922432bytes,tmpfs14142640128bytes,MemAvailable10202521600bytes.366 hashes tracked antes/después idénticos; no se restauró ni ocultó delta generado.163 tareas observadas por strace ya no existen. No quedan procesos propios ni servidorHTTP iniciado.

## Calidad e integración DB/Storage

Revisión independiente de logs/hashfinales del agenteRelease, sin presentarla como segunda ejecución: TypeScript exit0; lintscope53archivos36errores28avisos heredados,0fatales,0nuevos,64 diagnósticos con misma línea de fuente. Lintfull sigueFAIL; última corrida completa inicial149archivos92errores60avisos frente a baseline143/93/62. No se volvió a correr full tras el ajuste de contexto, por lo que cualquier total finalfull derivado debe etiquetarse así.

Compatibilidad inspeccionada en `database-storage-compatibility.json`: readers públicos dependen de catalog_public/kits_public y del schema real aún no verificado; enrichmentB2B fresco no convierte tier en ADMIN. Service_role necesita guards/filtros porque evitaRLS. Historial propio filtra sujeto; auditoría necesita confirmar schema; v2cart elimina costos/precios legacy y bloquea checkout si falla reconciliación. Validaciones reales de hidratación/servicios permanecen abiertas.

Wompi callback sigue usando anon para escrituras y Kanban sigue usando Realtimeanon. La política restrictiva propuesta afectaría esos consumidores; no se activa hasta su transición coordinada. Los315 casosSQL son históricos deR1B y no se ejecutaron ni sumaron aquí. Fonts controladas, servicios/JWT/Storage, Wompi/Realtime, metadata de grants/policies/views/RPC/defaultprivileges y recuperación failclosed son prerrequisitos separados. Los12package-nodes advisory(9high3moderate) y7omitdev permanecen abiertos; no se declara seguro por falta de importsobservados ni dev-only a Prisma.

Cierre: la implementación local puede pasar a preparación controlada de runtime con estos bloqueos explícitos. No autoriza migración, pagos, despliegue, LG-R2 ni UX. Los artefactos de producción no fueron consultados ni modificados por este track; la preservación probada aquí corresponde a archivos y a ausencia de acciones productivas propias, no a una certificación de cambios externos durante la ejecución.
