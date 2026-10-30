Auth autorizado — reproducción y límites

La app/instancia nuevas y las diez cuentas ficticias se conservan. Restore privado: ~/.local/share/la-gaviota/authorized-e2e-20261015/auth/{isolated-clerk.env,fixture-manifest-private.json}, directorio700/archivos600. Nunca copiar esos archivos al repo. Las sesiones de prueba fueron revocadas; storageState histórico no permite reanudar sesión.

Recrear entorno Next/PostgREST/PG aislado con fixtures, antes de ejecutar. No usar47773 ni backend original. ClerkCLI1.4.0: doctor--json primero, claves de app nueva por env privado, GET/instance debe devolver la instancia de independent-instance.json. Descubrir endpoints con api ls; dryrun antes de POST. Generar testing_tokens y sign_in_tokens únicamente para IDs de fixtures.json, respuestas en directorio privado600. Tickets/signin omiten verificación UI; el testingtoken sólo antibot. No repetir signup contra email ya existente ni eliminar usuarios ajenos.

Ejemplo desde raíz app, con Playwright instalado: LG_APP_ROOT=$PWD LG_AUTH_PRIVATE_DIR=/ruta/privada LG_E2E_BASE_URL=http://localhost:PUERTO node docs/runtime-e2e-authorized-evidence/2026-10-15/auth/reproduce-password-otp.cjs . Entradas privadas esperadas: fixture-manifest-private.json, testing-token-private.json; para tickets, tickets-private.json. role-ticket acepta micro/restaurant/admin/super/operario/commercial/owner-a/owner-b; LG_E2E_ROW_MAP apunta al mapa sintético de DB.

B2Bcash requiere state privado NUEVO exportado por role-ticket y acepta micro/restaurant; genera órdenes sólo en DBaislada. Signup es una prueba de creación única: usar credencial +clerk_test nueva y un manifiesto privado de ejecución sin labelsignup-ui; no borrar el manifiesto durable ni sobrescribir cuenta existente. Metadata default no se parchea.

Los wrappers portables se empaquetaron tras apagar runtime y no se reejecutaron. Resultados proceden de sus fuentes ejecutadas equivalentes con rutas privadas concretas. No hay secretos/cookies/tokens ni body/query raw en evidencia durable.

Cleanup borrado NO ejecutado: si el dueño desea retirar el entorno, verificar app/instance IDs exactos de independent-instance.json, listar sólo IDs propios de fixtures.json, dryrun DELETE de esos usuarios o de esa app nueva. No rotar claves ni alterar la aplicación LaGaviota original.

Auth/UI y tres cash happy paths están probados en fixturelocal. Los defectos financieros observados siguen NO-GO; no se certifican atomicidad, idempotencia, stock/kit ni Wompi.
