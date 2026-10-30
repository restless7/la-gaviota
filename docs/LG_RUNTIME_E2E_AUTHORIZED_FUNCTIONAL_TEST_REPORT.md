# La Gaviota — E2E autorizado: autenticación y compras ficticias

Fecha: **2026-10-15, America/Bogota**. **Autenticación y tres recorridos de compra contra entrega verificados en infraestructura de pruebas independiente. Integridad financiera FAIL; Wompi Sandbox BLOCKED; lanzamiento comercial NO-GO.**

Esta continuación ejecuta la autorización del propietario para crear identidades y datos ficticios preservando el proyecto existente. Amplía el [gate anterior](LG_RUNTIME_E2E_AUTH_CHECKOUT_PAYMENT_CERTIFICATION.md): las limitaciones de autenticación de aquel cierre dejan de ser bloqueos para los casos reales probados aquí. Sus fallos financieros permanecen vigentes. No se implementaron correcciones financieras ni cambios de aplicación durante estas pruebas.

## 1. Inventario de entornos y aislamiento

El inventario se presentó antes de ejecutar las pruebas y crear datos; las revisiones iniciales sólo consultaron configuración y metadata. [Inventario consolidado](runtime-e2e-authorized-evidence/2026-10-15/root/environment-inventory.json).

| Recurso | Clasificación y evidencia | Acción realizada |
| --- | --- | --- |
| Clerk configurado originalmente | La clave local coincide con la aplicación La Gaviota existente; Development no significa instancia desechable | Preservado; no se usó para crear o modificar los fixtures |
| Clerk de pruebas | Nueva aplicación **LG-E2E-DISPOSABLE-20261015**, sólo Development; app e instancia distintas, binding de clave confirmado por metadata del proveedor | Se crearon nueve usuarios de referencia y un décimo mediante registro UI; sin cambio de plan/facturación |
| Supabase configurado originalmente | Proyecto existente con catálogo/configuración que se deben preservar; no clasificado como testing | Sin consultas privadas, escrituras, migraciones, políticas o cambios de permisos de esta ejecución |
| Base de pruebas | PostgreSQL **18.6**, clúster nuevo, socket privado, sin listener TCP; esquema/filas ficticios derivados de fuentes retenidas | Fixtures de catálogo, perfiles, pedidos, settings y políticas propuestas, exclusivamente locales |
| Gateway de pruebas | PostgREST **16.4** oficial, digest del asset GitHub contrastado; proxy limitado a loopback y `/rest/v1` | Cliente Supabase real de la aplicación comunicándose por HTTP con la base ficticia |
| Aplicación de pruebas | Copia del árbol actual en `/tmp/la-gaviota-authorized-e2e-20261015/application`; Next **16.4.1** real en modo development/webpack, puerto 47774 | Variables allowlist: nueva instancia Clerk y gateway local; no `.env` original ni artifact de producción copiados |
| Wompi | Sin claves locales Sandbox; metadata previa Vercel sólo enumera nombres Production, sin valores/prefijos comprobados | Ninguna transacción externa; callbacks firmados con secretos ficticios |

El gateway local **no es un stack Supabase completo**: no incluye Storage API, Auth, Realtime ni gateway Clerk/JWKS. Las pruebas JWT HTTP usan HMAC ficticio. El SDK Clerk y sus sesiones sí se verificaron contra la instancia Development nueva. La configuración de PostgREST permite declarar explícitamente roles, conexión y secreto del gateway; aquí todos apuntan al fixture. [Configuración oficial](https://docs.postgrest.org/en/stable/references/configuration.html).

Docker estaba disponible pero no había imágenes Supabase; se evitó descargar el stack completo. El binario PostgREST y todos los datos temporales quedaron fuera del producto. El digest verifica el asset descargado, sin atribuirle una firma independiente del mantenedor.

## 2. Fixtures estables

Se conservan **diez identidades sintéticas** en la nueva aplicación: retail, micromercado, restaurante, ADMIN, SUPER_ADMIN, OPERARIO, COMMERCIAL, dos propietarios independientes y el usuario creado por registro UI. No se enumeraron usuarios del Clerk original.

El catálogo ficticio contiene dos productos activos, un producto inactivo y un kit. `SKU_TEST_A` tiene precios retail **20.000**, micro **15.000**, restaurante **10.000** y stock inicial **100**; otro SKU representa la última unidad. Existen pedidos propios de referencia para contrastar visibilidad entre propietarios. No se copiaron productos, saldos o pedidos del backend existente.

Los manifests públicos contienen IDs y expectativas de prueba. Contraseñas, claves nuevas y estado de autenticación permanecen privados; la restauración de credenciales/fixtures estables está en `~/.local/share/la-gaviota/authorized-e2e-20261015/auth/`, directorio 0700 y archivos 0600. No se sustituyó `.env.local` ni se configuraron estas claves en Vercel.

La matriz de permisos mantiene la decisión del propietario: ADMIN y SUPER_ADMIN pueden gestionar tiers; identidad/roles permanecen restringidos a SUPER_ADMIN. OPERARIO y COMMERCIAL no reciben privilegios administrativos inferidos.

## 3. Autenticación y autorización reales

[Evidencia de autenticación](runtime-e2e-authorized-evidence/2026-10-15/auth/) y [acciones HTTP](runtime-e2e-authorized-evidence/2026-10-15/payments/actions-http/REAL_ACTION_GUARDS_ES.md).

- **Login UI PASS:** contraseña real de fixture, preparación de segundo factor y código Development; destino retail correcto. La recarga conserva sesión y retail no accede a `/admin`.
- **Registro UI PASS:** formulario real, verificación de correo y destino `/retail`. El usuario nuevo tenía metadata role/tier vacía; no se parcheó para que pasara.
- **Logout PASS:** sesión cerrada mediante SDK cargado; un acceso posterior a `/dashboard` vuelve al login.
- **Portales/precios PASS en los casos observados:** retail/propietarios/staff sin privilegios laborales llegan a retail; micro y restaurante a sus portales; ADMIN/SUPER_ADMIN a administración. Precios de `SKU_TEST_A`: 20.000/15.000/10.000 según tier.
- **Ownership UI PASS en el muestreo:** cada uno de los dos propietarios ve el pedido propio y no el prefijo del ajeno. No equivale a cubrir cada endpoint privado.
- **Revocación de rol PASS:** se cambió exclusivamente el ADMIN ficticio a USER, conservando la misma sesión; `/admin` fue denegado. Se restauró y verificó exactamente la metadata original en `finally`.

La matriz por perfil usa tickets SDK del proveedor para evitar repetir la verificación de correo en cada actor: son sesiones auténticas, pero **no son ocho verificaciones UI adicionales**. El login y registro completos descritos arriba se ejecutaron por separado. Se usó token de testing para antibot; no se deshabilitó la configuración de seguridad del proveedor. [Testing oficial Clerk](https://clerk.com/docs/guides/development/testing/playwright/overview).

Cinco pares rol/acción se comprobaron por HTTP real sobre Server Actions de la copia actual:

| Actor | Acción | Resultado |
| --- | --- | --- |
| Retail | Catálogo administrativo | Denegación `FORBIDDEN` en respuesta Flight |
| ADMIN | Catálogo administrativo | Datos permitidos |
| ADMIN | Listado de usuarios | Denegación `FORBIDDEN` en stream Flight |
| SUPER_ADMIN | Catálogo administrativo | Datos permitidos |
| SUPER_ADMIN | Listado de usuarios | Diez fixtures de la instancia nueva; permitido |

Un HTTP 200 puede transportar un error Flight: se inspeccionó el resultado, sin tratar todo 2xx como autorización exitosa. Las sondas de historial/foreign-owner por Server Action quedaron **UNVERIFIED** por forwarding/ausencia de retorno Flight; no se contaron como PASS. No se afirma instrumentación de cero IO privilegiado a partir de una respuesta de error.

Las esperas iniciales fallidas del harness —selector de contraseña incorrecta, OTP enviado antes de terminar `prepare_second_factor`, y comprobación prematura de logout— están clasificadas como diagnósticos. La contraseña incorrecta sí produjo rechazo real del proveedor. Esos intentos no se agregan como defectos del producto ni como nuevos casos de aceptación. Expiración natural de sesión, todos los mecanismos de recuperación de cuenta y cada mutación administrativa no quedan certificados por este muestreo.

## 4. Compras completas contra entrega

Se ejecutó navegador → catálogo → cantidades → carrito → checkout → Server Action → SDK Supabase → HTTP PostgREST → PostgreSQL → confirmación. [Oracle de persistencia de los tres pedidos](runtime-e2e-authorized-evidence/2026-10-15/database/browser-cash-orders-verification.json).

| Perfil | Cantidad | Precio unitario COP | Total aceptado COP | Pedido ficticio persistido |
| --- | ---: | ---: | ---: | --- |
| Retail | 3 | 20.000 | **60.000** | `0a314258-f323-4b20-ace7-1f920d038c50` |
| Micromercado | 10 | 15.000 | **150.000** | `ce9f9f46-fd0c-4cf1-929b-d892fac25832` |
| Restaurante | 30 | 10.000 | **300.000** | `b16e153e-d63f-4463-a3d7-e6375435225e` |

En los tres casos coinciden propietario autenticado, header, única línea, cantidad, precio, FK del producto y suma. Método `cash`, estado `Pendiente`; no se registró un cobro ni una liquidación bancaria. Las confirmaciones reflejan el total aceptado por el servidor. El carrito permitió ajustar cantidades sin abrir automáticamente su superficie.

Esto acredita **tres recorridos normales**, no atomicidad ante caída, deduplicación de solicitudes, stock reservado ni pago aprobado. Los importes cubren envío gratuito y mínimos de los tiers probados; no certifican por sí solos todas las zonas, fechas o reglas comerciales.

## 5. Datos, gateway y escenarios de error

El [fixture de base](runtime-e2e-authorized-evidence/2026-10-15/database/DATABASE_GATE.md) ejecutó **19 casos de código actual con 28 consultas PostgreSQL reales**. Autenticación/SDK estaban sustituidos por adaptadores explícitos en esa suite; no se presenta como HTTP E2E. Cubrió precios por tier, entrada/total alterado, stock y ownership. Dos quotes aceptadas demuestran ausencia de reserva; el adaptador síncrono no demuestra concurrencia HTTP. El decremento condicional concurrente probado por SQL es un modelo separado, no una garantía implementada por la aplicación.

El [gateway real](runtime-e2e-authorized-evidence/2026-10-15/payments/gateway/GATEWAY_HTTP_EVIDENCE_ES.md) pasó **14 comprobaciones HTTP**: proyección pública, costo/PII/escrituras denegados, filas propias/ajenas, claim ADMIN sin privilegios DB, firma JWT inválida/expiración y bypass de service_role. Root repitió esa suite; no se suman los replays como nuevos casos. Los tokens son ficticios: no se certifica validación Clerk/JWKS ni políticas alojadas.

El [track Wompi sintético](runtime-e2e-authorized-evidence/2026-10-15/payments/PAYMENTS_AUTHORIZED_E2E_STATUS_ES.md) añadió diez escenarios complementarios: **ocho controles PASS_MODEL y dos FAIL**; repitió separadamente los dieciséis diagnósticos retenidos, sin cambiar su resultado de cinco controles y once requisitos fallidos. No son pagos Sandbox ni nuevos pedidos reales del proveedor.

Continúan reproducidos: referencia de pago no vinculada a intención/propietario exactos; callbacks concurrentes con efectos repetidos; BAL ambiguo y replay; estado persistido que omite recuperación después del error; header/items separados y pedido duplicado al reintentar. Eventos de transacciones diferentes dirigidos a la misma referencia pueden dejar pedido cancelado con stock descontado. En el caso concurrente anterior, stock 10→8 **no prueba dos descuentos**: sí se duplicaron actualizaciones/notificaciones del procesamiento. No se afirma duplicación de cargos reales.

El kit publicado aún no se resuelve correctamente en el checkout de productos. Políticas restrictivas del fixture impiden las lecturas/escrituras anónimas del callback y del Kanban/Realtime actuales. **No activar el SQL propuesto ni cambiar el callback a service_role para sortear ese bloqueo**: requieren transición coordinada e integridad financiera previamente corregida.

## 6. Los diez criterios del propietario

| Criterio | Estado | Evidencia y límite |
| --- | --- | --- |
| 1. Sólo datos propios | PARTIAL | Dos propietarios UI y gateway real positivos/negativos; Server Actions foreign-owner y todas las familias de datos no exhaustivos |
| 2. Capacidades administrativas autorizadas | PARTIAL | Cinco pares de acciones reales, portales y revocación en misma sesión; faltan todas las mutaciones/Storage reales |
| 3. Carrito sin interrupción | PASS alcance probado | Cantidades en los tres recorridos; sin apertura automática. No certifica cross-tab/todas las condiciones offline |
| 4. Precios/cantidades coherentes | PARTIAL; tres flujos PASS | Retail, micro y restaurante: catálogo/carrito/checkout/header/línea coinciden; kits y reglas adicionales siguen abiertos |
| 5. Pedido único ante retry/concurrencia | **FAIL** | Writer actual conserva pedidos parciales y crea duplicados en las pruebas retenidas contra PG |
| 6. Webhook con un único efecto | **FAIL** | Carreras/BAL/replay y efectos duplicados en source actual con fixtures |
| 7. Rechazado/pendiente no aprobado | PARTIAL / FAIL desorden | Controles simples pasan en modelo; eventos de transacciones distintas sin binding dejan estado/stock incoherentes; Sandbox real BLOCKED |
| 8. Inventario coherente | **FAIL** | Falta reserva/commit durable y recuperación de efectos; quotes y compras normales no lo sustituyen |
| 9. Recuperación segura | **FAIL** | Postestado/retry puede omitir efectos; writer puede dejar header y duplicar operación |
| 10. Preservar producción | PASS alcance ejecutado | Recursos nuevos y datos ficticios; fuente/entorno original preservados; sin operaciones del backend existente ni despliegue |

No se da un total agregado de casos: UI, assertions de filas, escenarios y replays se solapan. Las denegaciones RLS del fixture no certifican las políticas del proyecto original; los pedidos `Pendiente` no son pagos liquidados. Cancelación, devolución y conciliación con el proveedor real permanecen sin certificación.

## 7. Acción necesaria y reproducción

**LG-R2 sigue siendo el siguiente paquete:** intento de checkout durable y único; transacción de header/líneas/intención/reserva según política aprobada; binding exacto de pago/owner/importe/moneda/entorno; recibos únicos y transición atómica; efectos recuperables mediante outbox/journal y conciliación; BAL con propietario exacto. Convertir los fallos reproducidos en regresiones contra esa implementación, manteniendo los positivos de este informe.

Después: configurar comercio Wompi **Sandbox** en el entorno de pruebas, sin claves/tarjetas reales, y validar entrega/reintento del proveedor. Atestar esquema/políticas/gateway/Storage/Realtime efectivos y ensayar transición de clientes antes de un release. La ausencia de claves Sandbox no autoriza extraer o utilizar secretos Production por inferencia.

Los fixtures y harnesses se retienen con hashes en el [manifest](runtime-e2e-authorized-evidence/2026-10-15/evidence-manifest.json). Algunos runners tienen guards de stage/rutas exactas: reproducir exige preparar un stage nuevo con sentinel, fixture y herramientas documentados; no apuntarlos al proyecto Supabase existente ni a un PGDATA reutilizado por accidente. Los datos privados de restauración permanecen fuera del repositorio. No existe una certificación automática de release por ejecutar uno de estos comandos.

Los cuatro wrappers portables de navegador se empaquetaron después de detener el runtime: su sintaxis se comprobó, pero no se repitieron las llamadas reales con esa versión empaquetada. Los resultados describen los drivers ejecutados en el stage y los hashes de las fuentes de aplicación observadas; no se atribuye una nueva ejecución a los wrappers.

TypeScript y build previos siguen siendo evidencia histórica del árbol sin cambios; no se ejecutó un nuevo build de producción ni install/upgrade en esta continuación. Persisten lint y advisories del preflight anterior, además de gates de configuración, monitoreo, respaldo y rollback. Esta fase no los declara resueltos.

## 8. Preservación y cierre

La [verificación root](runtime-e2e-authorized-evidence/2026-10-15/root-verification.json) contrasta fuentes/manifests, replays y aislamiento; el [registro de cleanup](runtime-e2e-authorized-evidence/2026-10-15/root/runtime-cleanup.json) identifica los procesos temporales. Se cerraron navegador, Next y gateways de prueba; PostgreSQL propio se detuvo después de los oracles. La vista previa local anterior en 47773 se conserva.

La nueva aplicación Development y sus diez fixtures se mantienen como referencia repetible. Se observaron once sesiones de esos usuarios: diez activas fueron revocadas y la restante ya había terminado por logout. No se borró el catálogo existente. El escaneo de entrega compara claves/contraseñas/tokens conocidos sin imprimir valores; su alcance es acotado y no constituye una certificación universal de secretos.

Se ejecutó una vez el hook local obligatorio Graphify, offline, exit0: CLI 1702 archivos AST, 7417 nodos/13259 edges/571 comunidades. Su corpus committed excluye los harnesses y cambios untracked; no certifica semántica ni seguridad de la implementación. Sólo produjo mantenimiento del grafo, registrado en la evidencia root.

Sin cambios de código del producto, dependencias, credenciales originales, políticas remotas, Vercel, commits, push o despliegue. No cobros ni reembolsos reales. Mission Control/memoria remota y contabilidad exacta de tokens/tier/costo no están expuestos; no se fabrican registros. **Avance acreditado: autenticación real y compras ficticias de los tres tiers. Bloqueo vigente: integridad financiera y certificación de pagos/infraestructura para el lanzamiento.**
