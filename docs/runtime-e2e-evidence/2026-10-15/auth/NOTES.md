Auth runtime E2E: PARTIAL

33/33 source-model PASS:12 edge/ownership y21 callbacks/roles/propiedad positiva. SDKs inyectados; no autenticación real. Negativos: cero target DB/storage/Clerk, consulta de autoridad del actor separada.

Browser anónimo: dashboard/admin → sign-in200; dos shells públicos200, inputsSignIn/SignUp observados sin envío. No sesión/registro. Todas las escrituras del browser bloqueadas.

HTTP: un500 Flight y dos409 sin verificar; no prueba de cero dependencias. Los FAIL crudos por expectativas404/307 se conservan como diagnóstico de protocolo; ver aclaraciones del resumen, no defectos app.

Clerk6.39.7/Core2 development; aislamiento instancia/DB no demostrado. Login/registro/sesiones/roles con identidad BLOCKED hasta fixtures autorizadas. Sin usuarios existentes ni creación de cuentas. Sin claves/env/cookies/manifests build publicados. Browser cerrado, preview preservado.

Reproducción: comandos en auth-track-summary.json, ROOT/OUT explícitos. No se incluyen scripts HTTP para repetir POST sin revisión.

Referencias: https://clerk.com/docs/guides/development/testing/playwright/overview y https://clerk.com/docs/guides/development/testing/playwright/test-helpers . Helpers de token omiten verificación/MFA; requieren capa UI separada.
