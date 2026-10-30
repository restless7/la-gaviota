# Matriz propuesta — LG-R1B

Autoridad: identidad Clerk + publicMetadata fresco del servidor. Tier comercial nunca concede privilegios. Artefacto PROPUESTO, no aplicado.

| Capacidad | Guest | Retail/Micro/Restaurante | ADMIN | SUPER_ADMIN | OPERARIO/COMMERCIAL | Rol inválido |
|---|---|---|---|---|---|---|
|catalog.public|PUBLIC|PUBLIC|PUBLIC|PUBLIC|PUBLIC|PUBLIC|
|profile.own|DENY|OWN|OWN|OWN|OWN|DENY|
|orders.own|DENY|OWN|OWN|OWN|OWN|DENY|
|checkout.own|DENY|OWN|OWN|OWN|OWN|DENY|
|catalog.manage|DENY|DENY|ALLOW|ALLOW|DENY|DENY|
|pricing.manage|DENY|DENY|ALLOW|ALLOW|DENY|DENY|
|inventory.manage|DENY|DENY|ALLOW|ALLOW|DENY|DENY|
|customers.manage|DENY|DENY|ALLOW|ALLOW|DENY|DENY|
|orders.manage|DENY|DENY|ALLOW|ALLOW|DENY|DENY|
|payments.manage|DENY|DENY|ALLOW|ALLOW|DENY|DENY|
|identity.read|DENY|DENY|DENY|ALLOW|DENY|DENY|
|identity.manage|DENY|DENY|DENY|ALLOW|DENY|DENY|
|tiers.manage|DENY|DENY|ALLOW|ALLOW|DENY|DENY|
|reports.read|DENY|DENY|ALLOW|ALLOW|DENY|DENY|
|audit.read|DENY|DENY|DENY|ALLOW|DENY|DENY|
|audit.write|DENY|DENY|ALLOW|ALLOW|DENY|DENY|
|settings.read|DENY|DENY|ALLOW|ALLOW|DENY|DENY|
|settings.manage|DENY|DENY|ALLOW|ALLOW|DENY|DENY|
|suppliers.manage|DENY|DENY|ALLOW|ALLOW|DENY|DENY|
|storage.manage|DENY|DENY|ALLOW|ALLOW|DENY|DENY|
|scheduler.run|DENY|DENY|DENY|DENY|DENY|DENY|

OWN = sujeto autenticado igual al propietario; ADMIN/SUPER_ADMIN acceden a otros sujetos sólo con capacidad administrativa explícita.
Scheduler: secreto independiente, mínimo32 caracteres, comparación constante, sin privilegio por cuenta humana.
Registro nuevo sin metadata se trata como USER retail. CLIENT es alias exacto de cliente; role=admin y tier=admin/SUPER_ADMIN no elevan. Su migración requiere revisión previa para evitar bloqueo de operadores legítimos.
OPERARIO y COMMERCIAL conservan etiqueta e identidad/capacidades propias de cliente; ningún permiso de bodega/comercial se inventa.
Rol de aplicación inválido: catálogo público retail; servidor privado deniega. SQL nativeJWT permite SELECT de filas propias por identidad válida aunque metadata de aplicación sea desconocida; no concede escritura ni acceso administrativo.
No se prueba Clerk SDK real, propagación de revocación ni gateway/JWT con estos mocks.
