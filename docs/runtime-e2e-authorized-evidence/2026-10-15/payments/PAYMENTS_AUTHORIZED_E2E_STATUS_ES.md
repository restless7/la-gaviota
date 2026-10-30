# Pagos autorizados: Sandbox pendiente y fixtures actuales

**Sandbox real BLOCKED; integridad financiera FAIL. No hubo cobros.**

Se inventarió configuración antes de ejecutar. `.env.local` no contiene variables Wompi; `.env.example` las tiene vacías y processenv está ausente. La metadata Vercel ya retenida enumera nombres en Production; sus valores/prefijos siguen UNKNOWN y no fueron recuperados. No se editó configuración, código de aplicación ni SQL.

La [documentación de eventos](https://docs.wompi.co/docs/colombia/eventos/) establece propiedades variables y ordenadas para el checksum. Los [escenarios Sandbox oficiales](https://docs.wompi.co/docs/colombia/datos-de-prueba-en-sandbox/) describen resultados aprobados y rechazados; aquí se usó su forma de evento con datos enteramente ficticios. Ninguna fixture constituye un registro emitido por el proveedor.

El replay conserva los mismos16 diagnósticos anteriores:5 PASS_MODEL/11 FAIL, sin contarlos nuevamente como casos nuevos. Las fuentes coinciden en hash. Diez escenarios complementarios ejercitan rechazo, pendiente/desorden, error transitorio y negativas;8 PASS_MODEL/2 FAIL. Son escenarios de función con dependencias controladas, no diez criterios certificados ni dos defectos nuevos independientes. Una repetición de estabilidad produjo JSON idéntico byte a byte; no agrega casos. El runner tiene reloj fijo y no carga SDK/clientes de red ni configuración real.

Los5 escenarios PostgreSQL previos (1 positivo/4 fallos) se reutilizan por hash de writer/validación idéntico, sin iniciar otro clúster ni sumarlos otra vez. No se presentan como Supabase/PostgREST/RLS o proveedor.

| Criterio | Esperado | Observado | Estado |
| --- | --- | --- | --- |
| PAY-G1 Entorno Sandbox designado | Identificar llaves/secretos Sandbox del comercio y backend de pruebas aislado; no usar valores Production | Local no tiene variables Wompi. Vercel previo enumera nombres sólo en Production; valores/prefijos UNKNOWN/no recuperados. | BLOCKED |
| PAY-G2 Autenticación y owner del checkout | Clerk real identifica al owner y Supabase valida su pedido; revocado/cross-owner no opera | Guardas/unit mocks previos no equivalen a sesión Clerk y ownership reales; no se inició login ni SDK aquí. | BLOCKED_E2E |
| PAY-G3 Quote fresco y entrada válida | Precio/tier server, cantidades válidas, activos/stockflag y total esperado; inválido sin writes | 52 pruebas locales previas retenidas, con fuentes sin cambios; no certificar escritura gateway. | PASS_LOCAL_ONLY |
| PAY-G4 Binding transacción/intención/owner | Transaction ID autoritativo coincide referencia, owner exacto, importe, moneda y entorno | PAY-04 cambia reference y aprueba otro owner; PAY-09/10 BAL user%; AUTH-PAY-08 monto distinto cancela objetivo. | FAIL |
| PAY-G5 Creación atómica | Header y líneas se confirman juntos o ninguno; caída/retry recupera misma operación | Writer actual con psqlfinito/PG previo deja1header0items; retry2headers; hash de fuente actual coincide. No repetido. | FAIL_REAL_PG_FIXTURE |
| PAY-G6 Deduplicación submit/callback/BAL | Operación estable y receipt único producen un único efecto aun concurrente | PAY-06 dos updates/notificaciones, PAY-11 BAL dos créditos, PAY-15 dos pedidos. Replaysecuencialnormal sólo PASS_MODEL. | FAIL |
| PAY-G7 Estados y desorden | Pendiente no habilita fulfillment; transiciones autoritativas conservan estado/efectos consistentes | AUTH-PAY-01..05 controles simples cumplen; AUTH-PAY-06 dos transacciones distintas sin binding dejanCancelado constockdescontado. | PARTIAL_FAIL |
| PAY-G8 Efectos inventario consistentes | Stock/metrics/notificación aplicados una vez y recuperables por receipt/transacción | PAY-06 stock8 con2callbacks y2notificaciones; PAY-08 stockupdatefallido devuelve200 sin recuperación. No se efectuaron cobros. | FAIL |
| PAY-G9 Retry y recuperación | Fallo antes/después del commit no pierde efecto ni duplica operación; respuesta conserva reintento | AUTH-PAY-07 500→retry200 preserva rechazos; PAY-07 poststatus500→retry200skip pierde inventario. PGexit77 dejóheaderdurable. | PARTIAL_FAIL |
| PAY-G10 E2E proveedor Sandbox | Aprobado/rechazado/pendiente reales Sandbox, entrega webhook y DB aislada trazables sin dinero real | No hay config Sandbox designada confirmada; se ejecutaron fixtures, no requests/transacciones Sandbox. | BLOCKED |

**Hallazgo nuevo de secuencia:** dos transacciones ficticias firmadas independientemente, una aprobada y otra rechazada, dirigidas concurrentemente a la misma referencia no ligada producen pedido Cancelado, stock8 desde10 y una notificación. No se afirma que Wompi emita estados terminales contradictorios para una única transacción. La prueba usa dos IDs y expone la falta de binding y serialización del consumidor.

El rechazo simple y los pendientes tardíos preservan los estados esperados en el modelo. Un error transitorio al actualizar el pedido devuelve500 y un retry aplica el rechazo. Eso no corrige el fallo ya demostrado después del cambio de estado, cuando el retry omite recuperar efectos pendientes.

La habilitación E2E necesita recursos Sandbox designados y sus referencias por un mecanismo privado existente; no enviar llaves en el chat ni recuperar Production. Además, la certificación financiera requiere implementar y probar intención/owner exactos, transaction ID autoritativo, receipt único, creación atómica y recuperación durable. Esta fase sólo registra evidencia, sin ejecutar esa corrección.

Reproducción desde la raíz actual, sin cargar `.env`:

```sh
env -i PATH=/home/sebastiangarcia/.nvm/versions/node/v24.13.0/bin:/usr/bin:/bin LANG=C.UTF-8 node docs/runtime-e2e-authorized-evidence/2026-10-15/payments/run-authorized-payment-fixtures.cjs "$PWD" /tmp/la-gaviota-authorized-fixture-replay.json
```

El JSON de salida registra los hashes actuales. `pairing-and-counts.json` distingue replay, escenarios complementarios y evidencia DB retenida. No hay procesos propios ni actividad pendiente.
