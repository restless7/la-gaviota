# Guardas reales por HTTP: cinco casos confirmados

Se reutilizaron estados privados modo600 de sesiones reales ya iniciadas por QA en la aplicación Clerk de pruebas nueva e independiente. El browser verificó subject y rol contra el manifest privado, sin exportarlos. El único origen de acciones fue `http://localhost:47774`; las llamadas usaron `page.evaluate(fetch(...))`, cookies automáticas, protocolo Next-Action y IDs del manifest DEV actual. No se añadió wiring, rutas o código de aplicación.

| Rol | Acción | Resultado real |
| --- | --- | --- |
| Retail | fetchAdminProducts | HTTP500, text/x-component, error RSC FORBIDDEN |
| ADMIN | fetchAdminProducts | HTTP200, payload RSC de catálogo administrativo |
| ADMIN | fetchSystemUsers | HTTP200, error RSC FORBIDDEN; status200 solo no significa permiso |
| SUPER_ADMIN | fetchAdminProducts | HTTP200, catálogo administrativo |
| SUPER_ADMIN | fetchSystemUsers | HTTP200, diez usuarios; diez coinciden con las fixtures privadas del NEWapp |

Son **cinco pares rol/acción confirmados**. La lista incluye el décimo usuario de signup autorizado en paralelo. No se guardaron emails, IDs Clerk, respuestas crudas, JWT, cookies o storageState en el paquete. Los cuerpos se redujeron a conteos, nombres de campos y marcadores de error. Las sesiones y su limpieza pertenecen a QA/root; cada browser propio se cerró sin hacer sign-out.

**Límites:** Retail getB2BOrders produjo dos veces200 application/json con cuerpo de dos caracteres y sin resultado RSC interpretable; queda UNVERIFIED. Retail fetchSystemUsers no estaba compilado al primer intento y, tras compilarse la página legítima de SUPER_ADMIN, respondió igualmente con resultado no RSC para ese caller. El manifest muestra workers en rutas protegidas; forwarding/middleware es una explicación inferida, sin una traza que lo confirme. No se siguió reintentando ni se clasificó200 como aceptación o rechazo de la función. La lectura foreign-owner por Server Action no se demostró en este lote; los catorce checks gateway HMAC son otra capa y no sustituyen esta falta.

No se ejecutó la prueba opcional de revocación ADMIN→USER→ADMIN con la misma sesión. Tampoco se afirma cero IO privilegiado por observar FORBIDDEN: se registró la fuente/hashes y el orden de la guarda antes de la operación, sin instrumentar todas las dependencias HTTP. No se solicitaron cambios de roles, datos, órdenes o pagos desde este harness. El SDK Clerk pudo refrescar la sesión existente al cargar la página; esas solicitudes no se contaron separadamente y no se afirma cero operaciones de sesión.

El runner es intencionalmente específico del fixture autorizado: requiere browser Playwright instalado, estados privados600, manifest de cuentas y testing token privados existentes, app/instance IDs del NEWapp, servidor DEV y su manifest vivos. No incluye esos secretos y no crea cuentas/sesiones. Reproducir únicamente bajo la lease de root/QA:

```sh
env -i PATH=/home/sebastiangarcia/.nvm/versions/node/v24.13.0/bin:/usr/bin:/bin LANG=C.UTF-8 node docs/runtime-e2e-authorized-evidence/2026-10-15/payments/actions-http/run-real-action-guards.cjs admin /tmp/la-gaviota-authorized-e2e-20261015/auth/admin-storage-state-private.json /tmp/la-gaviota-admin-actions-replay.json
```

Los archivos de las corridas iniciales se preservan y el resumen distingue intentos no verificados de los cinco casos confirmados. Dos arranques abortaron antes de browser/HTTP porque el manifest pasó de9 a10 tras el signup; se corrigió sólo esa precondición del harness. No se suman como fallos de autenticación ni como casos.
