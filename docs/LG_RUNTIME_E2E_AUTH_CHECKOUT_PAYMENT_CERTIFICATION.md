# La Gaviota — LG-RUNTIME-E2E: autenticación, checkout y pagos

Fecha: **2026-10-15, America/Bogota**. **Gate financiero FAIL; certificación integral NO OBTENIDA; lanzamiento comercial NO-GO.** Las comprobaciones locales amplían la evidencia del build y del carrito, pero reproducen fallos de integridad que deben corregirse antes de aceptar pedidos reales. No se realizaron cobros, crearon cuentas reales ni aplicaron políticas o despliegues.

## Baseline y alcance

Se verificó el **árbol local implementado**, no sólo HEAD `49add73ae90b837c36553a0f2b535267c9610143`. Ese commit sigue siendo la referencia histórica y no incluye las modificaciones locales. El [manifest inicial](runtime-e2e-evidence/2026-10-15/preflight/baseline-source-manifest.json) identifica 144 archivos actuales de aplicación, tests y configuración; la [comparación final](runtime-e2e-evidence/2026-10-15/preflight/source-preservation.json) comprueba su preservación durante este gate. Los informes anteriores conservan sus limitaciones y fechas; esta ejecución no los convierte retroactivamente en pruebas runtime.

Tres revisiones coordinadas cubrieron autenticación, pagos y seguridad/datos. Root repitió independientemente los diagnósticos del callback/writer y las 118 comprobaciones de guardas. Las bases PostgreSQL fueron nuevas, locales y ficticias, con sockets privados, sin TCP y detenidas al finalizar. No se copió el dataset del proyecto existente.

Se consultó metadata de configuración/despliegue Vercel sin obtener valores de variables. Navegación pública real utilizó la vista previa local existente; se bloquearon envíos del navegador. No hubo login, registro, pedidos ni pagos contra los servicios configurados. La configuración actual no identifica por sí sola recursos de prueba aislados; sigue pendiente que el propietario designe Clerk, Supabase y comercio Wompi de pruebas para los flujos mutantes.

| Frente | Resultado | Qué acredita |
| --- | --- | --- |
| Clerk y portales | PARTIAL / E2E autenticado BLOCKED | Redirección real anónima y reglas con SDK simulado; sin sesión autenticada real |
| Checkout y pagos | **FAIL integridad** / Wompi sandbox BLOCKED | Fallos reproducidos sobre código actual y persistencia PostgreSQL local; sin transacción del proveedor |
| Guardas, ownership y datos | PASS en modelos; remoto SIN CERTIFICAR | Positivos/negativos de código y SQL ficticio; sin atestación del gateway/políticas desplegadas |
| Preflight de release | **FAIL / PARTIAL** | TypeScript pasa; lint falla, advisories abiertos y configuración/operación incompletas |

## Autenticación y acceso

La [evidencia de autenticación](runtime-e2e-evidence/2026-10-15/auth/) separa las comprobaciones de fuente de las de navegador. **33/33 casos de modelo PASS** cubren middleware, capacidades y ownership con dependencias explícitamente simuladas. Se conserva la decisión del propietario: `tiers.manage` permite ADMIN y SUPER_ADMIN; gestión de identidades/roles queda restringida a SUPER_ADMIN. Ninguna cuenta Clerk fue modificada.

En navegador real, `/dashboard` y `/admin` anónimos llevan a `/sign-in`; `/sign-in` y `/sign-up` entregan la interfaz local. Se observaron formularios sin rellenarlos ni enviarlos. Las cuatro navegaciones no produjeron errores de página; siete solicitudes POST fueron bloqueadas por el harness y no se contabilizan como defectos del producto. No se valida registro, login, cierre/expiración de sesión, retorno posterior al login ni el contenido privado retail/B2B/admin.

Las sondas directas de Server Actions no proporcionaron una aceptación HTTP concluyente: una respuesta 500 de Flight es compatible con denegación genérica, pero no prueba ausencia de IO privilegiado; dos respuestas 409 quedan **UNVERIFIED**. Los 404 de solicitudes sin contexto de navegación protegido no demuestran un fallo del portal. No se marcan estas sondas como guardas PASS ni se infiere una causa de despliegue obsoleto.

## Integridad de pedidos y pagos

Las **52 pruebas actuales de checkout PASS** verifican validaciones y ramas locales, no un pedido Supabase ni un pago. El [track de pagos](runtime-e2e-evidence/2026-10-15/payments/PAYMENT_RUNTIME_EVIDENCE_ES.md) ejecutó cuatro módulos actuales mediante VM con estado ficticio: **16 diagnósticos, cinco controles PASS_MODEL y once requisitos FAIL**. Un runner que termina correctamente por reproducir un defecto no constituye aceptación del producto.

| Defecto reproducido | Evidencia observada | Consecuencia del gate |
| --- | --- | --- |
| Referencia sin vinculación a intención persistida | Cambiar únicamente `reference` de A a B, de otro propietario y mismo importe, conserva checksum válido y aprueba B en el modelo | FAIL binding |
| Callback concurrente | Dos callbacks idénticos leen el estado inicial: dos actualizaciones y dos notificaciones | FAIL idempotencia concurrente |
| Recuperación después del cambio de estado | Un fallo posterior a persistir `Pendiente` devuelve 500; el retry devuelve 200 y omite el trabajo pendiente | FAIL recuperación |
| Error al escribir inventario | Error inyectado devuelve 200; retry no completa el descuento y stock queda sin actualizar | FAIL efectos durables |
| Abonos BAL | El parseo de `user_...` produce búsqueda `user%`; puede seleccionar otro dueño; el replay acredita dos veces | FAIL propietario exacto y recibo único |
| Contrato de entorno | Cambiar el envelope `test`→`prod` no se rechaza con el secreto ficticio del caso | FAIL validación de entorno, sin demostrar aceptación entre secretos reales |
| Writer de pedidos | Header/items se escriben por separado; el fallo de items conserva header y el retry crea otro | FAIL atomicidad e intento único |

El caso concurrente del callback **no demostró dos descuentos de stock**: ambos lectores parten de 10 y escriben 8 para cantidad 2. Sí demuestra efectos de procesamiento repetidos y una carrera. No se probó ningún cargo real ni se afirma pérdida financiera o explotación productiva.

La prueba más fuerte de persistencia invoca el **writer actual contra PostgreSQL 18 real mediante un adaptador finito de psql**. Cinco escenarios: **un positivo y cuatro fallos de integridad**. Un fallo al insertar líneas deja 1 header/0 items; reintentar deja 2 headers/0 items; envíos concurrentes idénticos crean 2 pedidos/2 líneas. La salida abrupta del proceso Node después del header deja 1/0 visible desde otra conexión; reintentar termina con 2/1. No es un crash del servidor PostgreSQL ni una ejecución de Supabase/PostgREST, RLS, HTTP o Wompi. Véanse [resultados](runtime-e2e-evidence/2026-10-15/payments/private-pg/results.json) y [cleanup](runtime-e2e-evidence/2026-10-15/payments/private-pg/cleanup.json).

Root reprodujo los 16 diagnósticos y comparó resultados excluyendo únicamente el timestamp generado `updated_at`; hashes de las fuentes iguales. La repetición no añade casos únicos. La documentación oficial Wompi describe propiedades firmadas ordenadas y reintentos; su ejemplo no firma `reference`. Validar checksum requiere además vincular intención, propietario, transacción, importe, moneda y entorno exactos antes de efectos durables. [Contrato oficial de eventos](https://docs.wompi.co/docs/colombia/eventos/).

## Guardas, SQL y Storage

El [track de seguridad](runtime-e2e-evidence/2026-10-15/security/SECURITY_GATE.md) obtuvo **118/118 casos de fuente PASS** con Clerk/Supabase/Next simulados y **322/322 comprobaciones PostgreSQL PASS** sobre el SQL propuesto: 315 casos retenidos realmente repetidos y siete de compatibilidad con consultas actuales. No se suman con las 33 pruebas de autenticación, que cubren fronteras solapadas; tampoco se suman los replays como propiedades independientes.

Los positivos incluyen actores autorizados, perfil propio, tier y media; los negativos cubren roles desconocidos, elevación por tier, otro dueño, identidad fallida y scheduler sin secreto. Root repitió los 118 casos, sin cambios de fuente. Esto evita una falsa aceptación basada en denegar todas las llamadas, pero no certifica el SDK/gateway real.

El catálogo actual usa columnas públicas explícitas de `products`/`kits`; **es compatible con los grants seguros del modelo propuesto**, aunque no use exclusivamente las views. El callback Wompi anónimo y el lector Kanban/Realtime anónimo quedan denegados por ese mismo modelo restrictivo. Por ello **no aplicar automáticamente el SQL ni cambiar el webhook a service_role**: primero se debe corregir su integridad y ensayar la transición de consumidores.

`service_role` omite RLS; los consumidores servidor dependen de las guardas y los filtros de propietario. Los helpers `auth.jwt()`/Storage del fixture son stubs, no verificación de firma, issuer, expiración, revocación, PostgREST, Storage API/CDN o Realtime. Las políticas efectivas del proyecto existente permanecen **SIN CERTIFICAR**. Se preparó una [consulta de atestación metadata-only](runtime-e2e-evidence/2026-10-15/security/metadata-attestation.sql.txt), **no ejecutada remotamente**; no requiere filas de clientes.

## Calidad, configuración y operación

| Comprobación | Resultado de esta ejecución | Límite |
| --- | --- | --- |
| TypeScript | **PASS exit0**, `--noEmit --incremental false` | No sustituye ejecución autenticada |
| ESLint aplicación `app/src` | **FAIL: 64 errores/45 warnings en 135 archivos** | Diagnóstico actual; no se corrigió deuda en esta fase |
| ESLint captura global | FAIL: 178 errores/115 warnings en 175 archivos | Incluye 95 errores/63 warnings de 17 archivos históricos de evidencia; captura anterior a publicar estos nuevos harnesses |
| npm audit completo | 12 nodos afectados: 9 high/3 moderate/0 critical | No son doce exploits independientes |
| npm audit omitdev | 7 nodos: 4 high/3 moderate | No declarar toda la deuda como exclusiva de desarrollo |
| Build y compra anónima visual | Build anterior PASS, 42 páginas; carrito anterior verificado | **No se hizo otro build ni se certificó checkout en esta fase**; las fuentes permanecieron iguales |
| Vercel Production metadata | Clerk/Supabase/Wompi tienen nombres configurados; faltan `SUPABASE_SERVICE_ROLE_KEY` y `CRON_SECRET` | No se obtuvieron valores ni se añadieron variables; local y Vercel difieren |
| Publicación | Alias inspeccionado sigue en deployment `dpl_7akmDyb1H4VCuuzFBhjqCsoHqkv1` anterior a estos cambios | No contiene por inferencia la implementación local sin commit/release |
| Monitoreo, respaldo, restore y rollback | **UNVERIFIED / no ensayados** | No hay certificación por mostrar deployment READY |

Los [resultados de preflight](runtime-e2e-evidence/2026-10-15/preflight/) conservan auditorías y resúmenes. Los avisos altos incluyen cadenas de braces, deepmerge-ts y mysql2; corregir exige evaluar padres compatibles y uso real, sin `audit fix` ciego ni cambios de major inferidos. Referencias primarias: [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [deepmerge-ts](https://github.com/advisories/GHSA-ggr8-5vv4-36mx), [mysql2](https://github.com/advisories/GHSA-3f6p-5ww8-9rcr).

## Trabajo que desbloquea la certificación

El siguiente paquete concreto es **LG-R2 — integridad transaccional**, no otra auditoría general ni más ajustes visuales. Debe implementar y probar:

1. Comando validado con intento único durable y transacción de header/items/intención/reserva según política de stock aprobada. Mismo intento concurrente o reintentado devuelve el mismo pedido; fallos intermedios no dejan pedidos parciales.
2. Intención opaca persistida, propietario exacto y binding de transacción/importe/moneda/entorno; BAL sin prefijos ambiguos. Recibo único por proveedor y transición de estado atómica.
3. Efectos de inventario, balance y notificación recuperables mediante journal/outbox y conciliación. Duplicados y eventos desordenados no duplican efectos; un fallo después de persistir estado se recupera al reintentar.
4. Ensayo conjunto de clientes, permisos y esquema: mantener catálogo y portales legítimos mientras se elimina dependencia anónima del webhook/Realtime. Sin rollback a grants públicos amplios.

No se implementó este paquete durante la validación. Para cerrar el E2E proveedor faltan **designación de instancia Clerk de pruebas y actores ficticios, proyecto/bucket Supabase de pruebas, y comercio Wompi sandbox con configuración privada y callback de test**. No enviar secretos al chat. Una clave Clerk de desarrollo no acredita que la instancia o los usuarios sean desechables.

La aceptación posterior debe incluir login/registro/retorno/expiry/signout, dos propietarios aislados y todos los roles; acceso directo a acciones; políticas efectivas y Storage/gateway; pedidos y recibos duplicados/concurrentes; rechazo y pendiente→aprobado; fallos entre commits, reintento y conciliación; montos/stock/balances finales exactos. Las pruebas fallidas aquí deben convertirse en regresiones contra la corrección, conservando los positivos.

Antes del release: lint y riesgos de dependencias resueltos o decisión documentada dentro del gate aprobado; configuración completa revisada; artifact/SHA exacto, alertas con responsable, respaldo y restore/rollback ensayados; pruebas móviles finales sobre ese artifact. Nada de esto se declara PASS por estar planificado.

## Preservación y entrega

Durante este gate no se modificaron aplicación, package/lock, configuración ni SQL del producto; se añadieron documentación y harnesses de evidencia. Los 144 archivos del baseline de ejecución conservan hashes. Los tres PIDs PostgreSQL propios comprobados están ausentes; la vista previa local previa en `http://localhost:47773` se conserva para el propietario. No hay nuevo servidor, poller o worker de pruebas pendiente.

El [manifest de entrega](runtime-e2e-evidence/2026-10-15/evidence-manifest.json) registra archivos sanitizados, verificaciones independientes y reporte. Se excluyen `.env`, cookies, PGDATA, caches, node_modules y logs privados completos. El escaneo compara las claves reales conocidas sin imprimirlas; es una comprobación acotada, no certificación universal de secretos.

Por la publicación de harnesses de evidencia se ejecutó una vez el hook requerido `npm_config_offline=true npx --no-install graphify hook-rebuild`, exit0: 1702 archivos AST, 7417 nodos/13259 edges/571 comunidades. Su corpus committed no incluye estos archivos untracked ni acredita la semántica de los cambios locales. La [prueba del hook](runtime-e2e-evidence/2026-10-15/preflight/graphify-hook.json) registra el delta de mantenimiento; no es un gate de seguridad.

No se hicieron commits, push, despliegue, cambios Vercel, cuentas/pagos reales ni políticas remotas. Los pedidos y abonos descritos son ficticios. Mission Control, memoria remota y contabilidad exacta de tokens/costo no están expuestos; no se fabrican registros o métricas. **Resultado: validación local completada dentro del alcance disponible; certificación autenticada/proveedor pendiente y gate financiero FAIL.**
