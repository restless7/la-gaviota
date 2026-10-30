# Base independiente de pruebas — PostgreSQL18

Estado final: **19/19 pruebas con código actual y PostgreSQL real PASS; 3flujos cash de navegador con33assertions DB PASS; lease cerrado y PostgreSQL detenido. No release.** El backend existente no se consultó ni modificó.

## Inventario y decisión

Supabase CLI ausente; Docker28.5.2 disponible con daemon existente pero sin imágenes Supabase/PostgREST/GoTrue locales. No se descargaron imágenes ni cambiaron servicios. PostgreSQL16/17/18 instalados; se eligió18.6 con socket privado. Raíz≈1.9GB libres, /tmp≈14.9GB y MemAvailable≈10.6GiB al preflight. Sin lectura de valores `.env`/configuración privada. Root creó por separado gateway PostgREST nativo y nueva instancia Clerk: sus pruebas HTTP/browser tienen evidencia propia, no se atribuyen a este runner.

## Fixture estable

`seed-stable.sql` agrega sólo al cluster sintético: SKU_TEST_A20k/15k/10k retail/micro/rest, costo7k y stock100; SKU_TEST_LAST8k/7k/6k stock1; SKU_TEST_HIDDEN inactivo; kit UUID fijo80000 con4unidades de SKU_A; flags inventario,2propietarios de modelo y perfiles de tiers/staff. `seed-clerk-test-identities.sql` agrega9identidades de la NUEVA instancia Clerk de test autorizada,9órdenes y9items ficticios, más2perfiles B2B. Ninguna cuenta de usuario existente o fila privada fue copiada.

Schema inicial reutiliza17tablas app +2Storage del fixture R1B (columnas/types derivados de Prisma, no dump de DB real). Se agregan defaults UUID/timestamps, FK order_items→orders/products y kit_items→kits/products, stock/precios no negativos y unique b2b user. No pretende reproducir cada constraint/trigger o schema real. RLS/ACL aplica exclusivamente el **modelo propuesto no desplegado** `88eff4933862913457e11e92474d4cf9d83501b8f9afcacb340e238cfb164def`. `auth.jwt()` y operaciones Storage son stubs SQL. Claves/JWT gateway son exclusivamente de test del root; no se incluyen aquí.

## Prueba ejecutada

`current-checkout-pg.cjs` carga por transpile/VM **archivos actuales** de autorización, database, prepareCheckout, checkoutValidation y products; ejecuta28consultas PostgreSQL reales mediante adaptador SDK finito de SELECT (columnas/tablas/condiciones allowlisted). Clerk identity es stub explícito y no se contactan servicios reales. Hashes source antes/después iguales.19casos PASS:

- Retail/micro/rest: precio vigente de DB, mínimo y envío actual; precio/rol/owner del payload ignorados.
- Total esperado adulterado, stock insuficiente, producto inactivo, cantidad fraccional y guest denegados.
- Catálogo por cada tier proyecta sólo su precio; inactivos ocultos y costos/otros tiers no exportados.
- RLS owner de modelo deja propio, niega ajeno; ACL anon niega costo.
- **Gap observado:** kit visible en catálogo pero rechazado por prepareCheckout que busca exclusivamente products. Este PASS significa que reprodujimos el rechazo, no que checkout de kits funcione.
- **Límite observado:** dos cotizaciones combinadas con Promise.all de la última unidad obtienen aprobación; stock permanece1 porque cotizar no reserva. El adaptador psql síncrono serializa sus lecturas: esto no acredita concurrencia HTTP ni sesiones SQL superpuestas del aplicativo. No se atribuye atomicidad de inventario al aplicativo.
- Modelo SQL condicional separado: dos procesos psql lanzados asincrónicamente ejecutan UPDATE stock>=1 sobre tabla test_control.inventory y permiten sólo1de2. Demuestra técnica en SQL, **no está implementada en el aplicativo**.

No se mezclan19casos con322anteriores ni se presentan como E2E HTTP/SDK/Clerk reales. Root/QA ejercitan esas capas por separado sobre el mismo entorno independiente.

## Lifecycle y reproducción

El controller sólo admite este stage con sentinel/realpath/0700 y exige>=1GiB libre tanto raíz como stage en cada comando. `initdb --auth-host=reject`, listen_addresses vacío, socket0700; entorno subprocess sólo PATH/LANG/LC_ALL. Login authenticator NOINHERIT es miembro de anon/authenticated/service_role para gateway de test. No toca TCP ni otros clusters/servicios.

```
env -i PATH=/usr/bin:/bin LANG=C.UTF-8 LC_ALL=C.UTF-8 python3 /tmp/la-gaviota-authorized-e2e-20261015/database/cluster-control.py start
env -i PATH=/usr/bin:/bin LANG=C.UTF-8 LC_ALL=C.UTF-8 node /tmp/la-gaviota-authorized-e2e-20261015/database/current-checkout-pg.cjs
env -i PATH=/usr/bin:/bin LANG=C.UTF-8 LC_ALL=C.UTF-8 python3 /tmp/la-gaviota-authorized-e2e-20261015/database/cluster-control.py stop
```

Start rechaza data/ existente: no reusar/borrar evidencia automáticamente. El runner presupone la fixture recién preparada y su concurrencia crea tabla test_control.inventory; repetir requiere un nuevo stage/controller revisado o reset explícito sólo de test. Comandos describen la ejecución local; no conectan DB remota. Artefactos durables excluyen PGDATA, sockets, secretos, `.env`, passwords y credentials. Controller conservado para revisión, con ruta fija privada que debe revisarse al crear otro stage.

**Cleanup final verificado:** root confirmó Next/PGRST/gateway detenidos y cerró el lease. Controller guardado detuvo exclusivamente PG PID569200 con exit0; PID ausente, socket vacío y postmaster.pid ausente. `cleanup.json` conserva prueba. PGDATA ficticia permanece privada; no se borraron datos ni servicios ajenos.

## Confirmación durable tras checkout cash de navegador

Root reportó checkout cash con sesión real de la nueva instancia Clerk de test. La verificación independiente **read-only PostgreSQL** de orden `0a314258-f323-4b20-ace7-1f920d038c50` pasó11/11assertions: propietario coincide con retail del manifest aprobado, header60000/cash/Pendiente, exactamente1itemSKU_TEST_A con3×20000=60000 y referencia a producto existente. No se seleccionaron email/address/phone. Ver `browser-cash-order-verification.json` y SELECTportable. Es **un flujo** con11checks de persistencia; no onceflujos ni garantía de atomicidad/crash/retry/pagos reales. El browser es evidencia de root/QA, este archivo atestigua únicamente sus filas durables en la fixture independiente. LeasePG cerrado y cleanup verificado al final.

## Tres oracles durables finales

`browser-cash-orders-verification.json` es la autoridad combinada: retail3×20000=60000; micro10×15000=150000; restaurante30×10000=300000. Cada orden tiene propietario correcto de la nueva instancia de test, paymentcash/statusPendiente, exactamente1item, producto existente y sumaitems=header. Son3flujos con33assertions read-only, no33flujos. Los archivos individuales/intermedios se solapan y no se suman. SQL portable por cada orden conserva únicamente proyección necesaria, sin contacto/address. No se ejecutaron más pruebas tras el último oracle; sólo cleanup de lifecycle.
