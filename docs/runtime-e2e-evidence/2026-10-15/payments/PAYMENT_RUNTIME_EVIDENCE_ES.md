# Pagos: evidencia acotada sobre el worktree actual

Fecha: 2026-10-15. **Gate de integridad de pagos FAIL; certificación E2E con proveedores BLOCKED.** No es autorización de release. No se modificó código financiero de la aplicación durante esta ejecución.

Se repitieron las **52 pruebas de checkout PASS** sobre archivos actuales. Eso verifica validación local y ramas con dependencias controladas; no demuestra autenticación real, transporte HTTP, escritura Supabase ni un pago Sandbox. El TAP y los hashes anteriores a la ejecución están adjuntos.

## Ejecución del callback y writer actuales con dependencias controladas

`run-current-payment-models.cjs` transpila e invoca los cuatro archivos actuales registrados en `payment-model-results.json`. SDK, red y módulos ajenos al mapa de imports están excluidos. Las filas, identidades y secretos son ficticios. El adaptador en memoria modela selecciones, mutaciones, barreras y fallos. Los códigos de respuesta son valores del callback con NextResponse sustituido, no respuestas HTTP observadas.

**16 diagnósticos observados: 5 controles PASS_MODEL y 11 requisitos de integridad FAIL.** El éxito del programa significa que reprodujo la observación prevista; no convierte los once fallos en aceptación. Las fuentes conservaron sus hashes y hubo cero imports fuera del mapa. No se inventa una cifra de peticiones externas instrumentadas: no se importó ningún cliente de red y el VM no expone fetch.

| Evidencia | Resultado observado | Gate |
| --- | --- | --- |
| PAY-01/02/03/05/16 | Aprobación simple, pendiente sin DB, firma inválida sin DB, replay secuencial y error de header antes de items conservan el comportamiento esperado en el modelo | PASS_MODEL |
| PAY-04 | Cambiar únicamente reference de pedido A a B, del otro owner y mismo importe, conserva checksum válido y aprueba B | FAIL binding |
| PAY-06 | Dos callbacks idénticos leen Pago Pendiente antes de actualizar: dos updates y dos notificaciones; stock termina 8 desde 10 con dos compras de 2 | FAIL concurrencia |
| PAY-07 | Fallo de dependencia después de persistir Pendiente: primera respuesta 500; retry 200 salta recuperación y stock queda 10 | FAIL recovery |
| PAY-08 | Error inyectado al escribir stock: respuesta 200; retry omitido; stock queda 10 | FAIL side effects |
| PAY-09/10 | BAL divide user_... por underscore y consulta user%; dos perfiles producen cardinalidad inválida ignorada, uno no relacionado recibe el abono | FAIL owner exacto |
| PAY-11 | Replay idéntico BAL reduce deuda ficticia 100000→85000→70000 | FAIL deduplicación |
| PAY-12 | Cambiar environment del envelope no firmado de test a prod no se rechaza | FAIL contrato de entorno; no prueba aceptación entre secretos reales distintos |
| PAY-13/14 | Error al insertar items conserva header; retry deja dos headers sin líneas | FAIL atomicidad/idempotencia |
| PAY-15 | Dos invocaciones concurrentes idénticas del writer crean dos pedidos | FAIL idempotencia |

La referencia es parte del contrato de checkout firmado al iniciar el pago, pero el ejemplo estándar de firma de eventos no la incluye. Validar correctamente ese checksum no establece por sí solo la correspondencia transacción/pedido. Ver [eventos oficiales](https://docs.wompi.co/docs/colombia/eventos/). Las propiedades son variables y el helper actual respeta su orden. La prueba no es un ataque a un proveedor ni a un backend existente.

## PostgreSQL real con adaptador finito del writer

`run-writer-pg.py` creó un clúster privado PostgreSQL 18.6 sin TCP, socket 0700 y fixtures nuevas. `run-current-writer-pg.cjs` invocó **el orderWriter actual**; cada operación insert del cliente sustituido ejecutó un statement mediante psql en una conexión autocommit independiente. Los tipos integer, UUID y FK relevantes corresponden al schema Prisma, con un trigger de fallo expresamente ficticio. No reproduce todos los constraints, triggers, políticas ni servicios del backend.

**5 escenarios DB: 1 PASS_DB_FIXTURE y 4 FAIL de integridad**, con evidencia persistida y lectura desde conexiones nuevas:

| Escenario | Filas durables observadas |
| --- | --- |
| Creación válida | 1 pedido / 1 línea |
| Fallo de INSERT de líneas | 1 pedido / 0 líneas |
| Repetición de ese fallo | 2 pedidos / 0 líneas |
| Dos submits concurrentes idénticos | 2 pedidos / 2 líneas |
| Salida abrupta del proceso Node con código77 después del commit del header | Otra conexión observa 1 pedido / 0 líneas; volver a ejecutar crea 2 pedidos / 1 línea |

La salida abrupta termina el proceso de aplicación bajo prueba en el punto del adaptador. **No se simuló caída del sistema operativo o de PostgreSQL**, ni recuperación Supabase. El callback fue probado únicamente con el modelo en memoria; esta prueba PostgreSQL corresponde al writer. El runner portátil se repitió una vez para verificar su CLI; reproduce los mismos cinco escenarios y no agrega cinco propiedades nuevas. La corrida portátil final es la autoridad de los resultados DB seleccionados. El PID propio final 489036 se detuvo con exit0; no queda pidfile, socket o proceso propio. No se reutilizó ningún servicio existente ni se ejecutó SQL sobre un recurso externo.

## Fuentes y límites para decidir el siguiente paso

`src/lib/server/orderWriter.ts` realiza header y líneas en dos operaciones; `app/api/webhooks/wompi/route.ts` lee status y luego escribe sin receipt/transacción exclusiva, dispara efectos después de cambiar status y conserva el path BAL por prefijo. No hubo un refactor ni una migración en esta ejecución. Estos fallos requieren diseño e implementación coordinados antes de declarar un pago íntegro: intención ligada al owner exacto y al importe/moneda/entorno; correspondencia autoritativa del transaction ID; receipt único; transición y efectos durables recuperables; creación atómica de header/líneas y clave idempotente de submit. No se propone habilitar service_role al callback para ocultar fallos de permisos.

Los [ambientes oficiales](https://docs.wompi.co/docs/colombia/ambientes-y-llaves/) son independientes y las pruebas proveedor requieren recursos designados. Los [datos de Sandbox](https://docs.wompi.co/docs/colombia/datos-de-prueba-en-sandbox/) y el [seguimiento de transacciones](https://docs.wompi.co/docs/colombia/seguimiento-de-transacciones/) se revisaron como documentación; no se enviaron transacciones ni consultas de cuentas. Clerk real, owner real en Supabase/PostgREST/RLS y Wompi Sandbox permanecen sin certificar mientras no exista el entorno expresamente autorizado.

No se copió `.env`, token, payload propietario ni dato de cliente. Los artefactos seleccionados excluyen data directory y logs privados del clúster. El registro de documentación resume hechos y enlaces, sin copiar páginas completas.

## Reproducción local segura

Desde la raíz actual de La Gaviota, sin importar configuración:

```sh
node --test tests/checkout.test.cjs
env -i PATH=/home/sebastiangarcia/.nvm/versions/node/v24.13.0/bin:/usr/bin:/bin LANG=C.UTF-8 node docs/runtime-e2e-evidence/2026-10-15/payments/run-current-payment-models.cjs "$PWD" /tmp/payment-model-replay.json
```

Para repetir PostgreSQL, se requieren PostgreSQL18 en `/usr/lib/postgresql/18/bin`, Node24.13/TypeScript del worktree, usuario sin root, al menos1GiB libre tanto en repo como en stage y una ruta NUEVA `/tmp/la-gaviota-*` sin symlinks. La CLI rechaza un stage existente y no admite un endpoint remoto. Sustituir el sufijo si ya existe:

```sh
env -i PATH=/home/sebastiangarcia/.nvm/versions/node/v24.13.0/bin:/usr/bin:/bin LANG=C.UTF-8 python3 docs/runtime-e2e-evidence/2026-10-15/payments/run-writer-pg.py --root "$PWD" --stage /tmp/la-gaviota-payments-replay-20261015 --node /home/sebastiangarcia/.nvm/versions/node/v24.13.0/bin/node
```

El runner crea su clúster, ejecuta los cinco escenarios y lo detiene en `finally`, preservando evidencia privada. No debe apuntarse a un servicio compartido ni presentarse como prueba del gateway. `execution-provenance.json` registra el comando final ejecutado y los hashes de harness/schema.
