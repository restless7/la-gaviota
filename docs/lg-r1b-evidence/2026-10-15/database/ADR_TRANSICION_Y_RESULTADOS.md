# LG-R1B — Stage D: contrato Clerk/Supabase, SQL candidato y verificación aislada

Estado: **315/315 verificaciones SQL finales PASS; transición de producción BLOCKED; comercial NO-GO**. Baseline leído `49add73ae90b837c36553a0f2b535267c9610143`. Este trabajo escribe únicamente en el stage privado `database/`. No modifica fuente original, datos/políticas de producción, credenciales ni cuentas Clerk. No realiza nuevas consultas de metadata de producción.

## Decisión de autoridad

**Clerk es la autoridad única de identidad y rol comercial/de aplicación.** No se crea tabla de roles espejo, réplica de permisos, nuevo proveedor ni broker PostgreSQL hipotético. Para operaciones privilegiadas, el servidor resuelve la identidad mediante Clerk `auth()`, vuelve a consultar el usuario con el SDK servidor, rechaza usuario ausente/banned/locked, y evalúa `publicMetadata` fresca mediante el helper central del candidato de autorización. No se usa `user_metadata`, tier administrativo, client-side context ni JWT antiguo para conceder capacidades de staff. Los roles OPERARIO/COMMERCIAL no reciben atribuciones de administración implícitas.

La identidad de propietario en DB es `auth.jwt()->>'sub'` **TEXT**, compatible con `user_...`. No se llama `auth.uid()` ni se fuerza UUID. Un JWT nativo de usuario se ejecuta como `authenticated`, incluso si representa un ADMIN/SUPER_ADMIN. Sus claims de rol de aplicación no otorgan escrituras directas en DB/storage.

Para lecturas propias desde un cliente nativo, Supabase debe estar configurado explícitamente con la integración Third-Party Auth de Clerk del issuer aprobado, sin reutilizar secretos JWT ni plantillas deprecated. Cliente por solicitud/sesión con `accessToken: async()=>getToken()`, sin token en URL/log ni singleton compartido entre solicitudes. Esta integración no se configuró ni probó aquí; queda requisito real en sandbox. El helper SQL sólo valida forma de `sub` y claim de transporte `role=authenticated`, **no verifica firma, issuer, audience, exp ni revocación**; esa validación corresponde al gateway y debe acreditarse por separado.

Operaciones de staff y escritores internos de comercio usan un cliente **server-only service_role**, después del guard autorizado y consultas acotadas a capacidad/propietario. No hay fallback a anon. **service_role omite RLS**: las políticas no aíslan actores detrás de ese cliente. Se probó intencionalmente que ese rol lee otros propietarios y escribe costo sin actor en el fixture, para impedir atribuir a RLS una protección que no ofrece. La garantía del servidor depende del helper, sus callsites, selección de campos, integridad del código y secreto privado. No se introduce un rol DB personalizado imposible de usar automáticamente con Supabase-js/PostgREST.

El candidato actual de aplicación adopta service_role también en lecturas propias servidor con filtro explícito. Estas rutas **no quedan protegidas por las políticas owner**; requieren pruebas de ownership en el callsite. Las políticas owner son defensa para clientes nativos futuros/aprobados y acceso directo del usuario; no sustituyen ese filtro. Antes de liberar debe decidirse y probarse si las lecturas propias usan token nativo o el repositorio servidor guardado; no mezclar garantías.

Contrato de rol inválido: el helper servidor propuesto rechaza INVALID en métodos privados con service_role y permite catálogo público seguro a precio retail. La política owner SQL es deliberadamente de identidad: un JWT válido con sub propio puede leer sus filas aunque su metadata de aplicación sea desconocida. Esto no eleva a staff; es una asimetría explícita con el servidor más restrictivo. Si el dueño exige denegación uniforme para metadata desconocida, debe aprobarse rediseño de la ruta owner (por ejemplo sólo servidor con lookup fresco), sin introducir mirror implícito.

## Revocación y datos inválidos

- Staff: nueva llamada requiere usuario/metadata fresca; degradación/banned/locked impide nuevo cliente privilegiado. La comprobación no revoca una operación ya iniciada ni vuelve atómica la consulta de metadata y la mutación; ventana en vuelo y latencia/fallos de Clerk requieren contrato explícito. Error del proveedor debe fallar cerrado.
- Owner JWT directo: un token válidamente firmado previamente emitido puede continuar hasta expirar según gateway/TTL. No se inventa revocación inmediata ni un mirror de estado. Para exigir revocación inmediata, todas las lecturas privadas deberán pasar por servidor con lookup fresco, o aprobarse otro mecanismo soportado; esa decisión queda abierta.
- El fixture `auth.jwt()` lee claims JSON sintéticos de sesión. La prueba `expired_claim_owner_read_limitation_sql_stub_not_gateway` devuelve una fila propia con exp=1 **a propósito**: demuestra que el stub SQL no verifica vencimiento. No es un PASS de rechazo JWT expirado en Supabase.
- Metadata de ADMIN/SUPER_ADMIN falsificada o desactualizada en un token retail no habilita ningún DML directo; missing/empty/UUID sub, transporte inválido o role ausente devuelven cero filas propias. Un guest con claims ficticios no pasa a ser rol SQL authenticated.

## SQL candidato y superficies

`proposals/lg-r1b-policy-proposal.sql.txt` y su `.patch` son **artefactos no aplicados al repo/producción**. El mismo SQL se aplicó exclusivamente al cluster privado sintético.

SHA256 SQL final: `88eff4933862913457e11e92474d4cf9d83501b8f9afcacb340e238cfb164def`.

- Catalogo: view `public.catalog_public`, `security_invoker=true/security_barrier=true`; sólo productos activos. Columnas: id,name,category,subcategory,unit,price_retail,previous_price_retail,stock_quantity,is_active,is_in_season,image_url,description. Se conserva stock_quantity por compatibilidad con UI actual; visibilidad de inventario requiere decisión de negocio antes del release.
- No hay grants de base_cost, precio micro/restaurante o precios previos B2B a anon/authenticated. El SQL revoca grants de tabla **y todos los grants por columna realmente presentes**, no sólo las columnas conocidas en Prisma. Se prueba una columna sensible extra del fixture para evitar bypass mediante ACL residual.
- Kits: view `public.kits_public`, campos id,name,slug,fixed_price,banner_url,status; sólo activos. Composición/admin permanecen servidor; no se afirma que el checkout de kits esté resuelto.
- Customers/orders/order_items/b2b_credit_profiles/buying_templates/business_applications: lectura own por sub TEXT y selección por columna. El detalle usa join al padre con propietario. No se habilita DML directo de perfil, crédito, estado, ownership o solicitudes.
- Abandoned carts, shrinkage, audit, ledgers, global_settings, kit_items, marketing_leads, suppliers, system_settings: sin grants directos anon/user; sólo frontera servidor ya autorizada.
- Storage objects: sin DML de usuario, incluso ADMIN; lectura de buckets públicos sólo con helper de operación get_authenticated/get_authenticated_info. object.list y contexto ausente devuelven cero filas. storage.buckets: sin permisos directos de metadata ni modificación de flag public.
- Los buckets públicos conservan entrega pública de bytes por URL. La prueba SQL de storage.objects no verifica esos GET CDN ni la API real Storage. El helper `storage.allow_any_operation(text[])` del fixture es un stub explícito; producción debe acreditar que su versión instala esa función y semántica. Si no existe, candidato aborta y debe adaptarse mediante revisión, no ampliando USING(true).

Cobertura exacta: **17 tablas app + storage.objects + storage.buckets =19 tablas**. Nombres/campos derivados de Prisma están en `schema-coverage.json`. Fixture deriva tipos escalares/ownership; **no reproduce todos los constraints, defaults, triggers, funciones, FK o migraciones reales**. Se conservan conocidas contradicciones schema/audit y B2B: nunca se certifica compatibilidad total por esta prueba.

## Preconditions y secuencia coordinada

1. Mantener NO-GO y obtener aprobación de implementación separada. No activar el SQL simplemente porque315 pruebas pasaron.
2. Solicitar metadata-only autorizada: versiones, grants/column ACL/role memberships/default privileges, policies completas, vistas/RPC/security-definer, tipos/constraints y helpers Storage. `metadata-request.sql.txt` prepara consultas de catálogo solamente; no se ejecutaron remotamente.
3. Contrastar columnas de Prisma y sourceSQL con schema real, incluido audit_logs con dos contratos incompatibles y orders.customer_id inexistente en el Prisma auditado. No cambiar schema financiero en LG-R1B.
4. Inventariar **29 módulos cliente actuales** (`client-transition-inventory.json`); su clasificación browser/servidor es estática, no prueba de reachability. Todos carecen de accessToken nativo. Migrar clientes antes de retirar permisos anon.
5. Implementar guards frescos y frontera server-only, DTO público y vistas. `fetchProducts` debe usar exactamente catalog_public/kits_public; B2B obtiene sólo su precio entitlement en servidor; admin usa fetchAdminProducts con capacidad. El padre notificó al autor del overlay del mismatch inicial public_catalog/public_kits.
6. ProductForm/KitsClient no pueden seguir subiendo con anon. Migrar a acción de media guardada storage.manage, buckets allowlisted y path generado servidor; fallos explícitos; retener blobs previos. El overlay de seguridad está preparando estas acciones. Verificar upload/replace/delete, error y owner/admin con mocks y luego Storage real sandbox.
7. Marketing/jobs: secretos scheduler verificados antes del cliente privilegiado; lead público usa writer interno de proyección fija y validación/rate limits; abandoned owner deriva identidad del servidor. No dar INSERT directo público como workaround.
8. Orders/checkout/wompi/getInventorySettings/audit: resolver escritores internos sin marcar funciones de cliente como admin de forma indiscriminada. **Webhook Wompi original sigue usando anon; aplicar este SQL lo rompería. Cambiarlo ciegamente a service_role convertiría una frontera aún insegura en acceso bypass. Activación bloqueada hasta un paquete explícito del callback/servicios confiables con pruebas; no se refactorizó transacción/pagos aquí.**
9. Realtime admin del Kanban usa cliente anon; política propuesta no autoriza feed cross-owner. Elegir y probar canal admin autenticado/servidor o actualización mediante consulta guardada. No asumir service_role en navegador.
10. Ensayar nuevo app+SQL en sandbox con API PostgREST, Clerk JWT y Storage reales, incluyendo firma/issuer/exp y roles. Medir query plans bajo índices owner; demostrar UI catalog/portal/admin/media y webhooks sandbox. No usar clientes de producción.
11. Sólo tras metadata revisada y pruebas, autorizar transición coordinada. SQL exige review_gate explícito, aborta ante policy names no revisados o memberships heredadas anon/auth y helper Storage ausente; todos los cambios están en transacción. El valor del gate es marcador de proceso, no autenticación ni attestation automática.
12. Default privileges por cada rol creador, grants heredados y RPC/vistas preexistentes deben revisarse: la lista propuesta toca sólo19 tablas, dos nuevas vistas y helper privado; no descubre automáticamente funciones definer antiguas que pudieran eludir controles. No aprobar release hasta cerrar esa evidencia.

## Rollback seguro

No se entrega un down que restaure USING(true), ORtrue ni grants ALL al público. Mantener guards corregidos, secretos server-only y mínima lectura pública. Si falla compatibilidad, detener el despliegue; preferir roll-forward del cliente guardado, o restringir temporalmente las operaciones privadas con autorización del dueño. Nunca volver al código de acciones vulnerable mientras service_role está habilitado.

Las instrucciones SQL de `failclosed-rollback.sql.txt` revocan únicamente lecturas privadas de usuario y preservan vistas públicas seguras; son **NOT EXECUTED**, requieren verificar las mismas preconditions/schema y ensayo específico. No neutralizan service_role: deshabilitar operaciones privilegiadas requiere control coordinado del aplicativo, y revocar/rotar clave proyecto afecta todos sus consumidores y exige autorización independiente. No modificar buckets, borrar imágenes, alterar tablas financieras o restaurar data como rollback de permisos.

Backups requeridos: metadata ACL/policies/functions/views y release previo compatible; no datos privados para esta evaluación. Detectar fallos mediante403/permission denied controlados, catálogo vacío, historia own inesperada, upload denegado, callback/cron fallido y precio no-entitled; alertas no deben incluir tokens/PII. No cambiar errores→lista vacía para esconder fallos.

## Resultados y límites

| Grupo final sin solapamiento | Casos PASS |
| --- | ---: |
| Preconditions migración: gate ausente y policy desconocida |2|
| Catálogo/kits activos, ACL base/costos/tier/columna extra/view |22|
| Lecturas own/cross-owner + writes prohibidos para8actores |120|
| Claims ausentes/inválidos/falsificados/stale app-role |14|
| Guest denegado en6tablas propias |6|
| DELETE denegado en17tablas×4identidades |68|
|9tablas internas×retail/admin denegados |18|
| Storage get/private/list/contexto/metadata/DML×4identidades |36|
| Token expirado: limitación stub y ninguna elevación DML |2|
| Service-role bypass explícito/servidor privilegiado |21|
| Rollback de positivos sin persistencia y metadatos helper/view/role |5|
| Snapshot filas19tablas idénticas antes/después |1|
| **Total** |**315**|

No se cuentan301 y313 runs previos otra vez; son diagnósticos históricos. Todos los comandos de prueba cambiaron únicamente registros sintéticos dentro de transacciones revertidas; aplicación del candidato cambió permisos/policies/views sólo del cluster privado. Snapshots de filas antes/después de19tablas resultaron iguales.

Runtime: PostgreSQL18 instalado, `listen_addresses=''`, socket privado modo700, entorno subprocess limitado a PATH/LANG/LC_ALL y argumentos absolutos. Sin PG*, DATABASE_URL, HOME de otro entorno, .env, TCP, Docker o servicio compartido. Cada conexión valida data_directory del cluster y sentinel/realpath stage; startup exige512MiB libres. Último PID81489 detenido exit0, PID muerto, socket vacío, postmaster.pid ausente. `cluster-settings.json`, `cleanup.json`, logs y test-summary conservan evidencia.

Incidente local ENOSPC: un run inicial301PASS terminó y detuvoPG. La escritura posterior del generador falló y una invocación guardada sobrescribió algunos JSON con0 sin iniciarPG; se preservó como histórico `prior-run-301` y se documentó en ENOSPC-INCIDENT.txt. Root recuperó espacio de su propio cache; este agente no borró servicios/caches ajenos. Run final315 reconstruye evidencia completa, enlaza SQL/fixture/harness por SHA256 y cerró con~1.9GiB libres. generator.py se recuperó como validador de integridad sin regenerar SQL; su comprobación separada pasó (no suma casos). Los SQL fixture/proposal y run-isolated.py son autoridades ejecutables.

Resultados que siguen BLOCKED/NOTEXECUTED: JWT firmado real, issuer/audience/exp/revocation real, PostgREST/schema exposure, Storage/CDN API, media roundtrip real, realtime, handlers webhook/cron integrados y schema/policies/grants producción. Pruebas de Clerk/server guards corresponden al track de autorización, no se reclasifican como SQL real.

## Reproducción

Comando ejecutado dentro del stage privado, sin network ni dependencias nuevas:

```
python3 /home/sebastiangarcia/.local/share/la-gaviota/lg-r1b-20261015/database/run-isolated.py
```

El harness rechaza data/ existente para preservar evidencia. Para repetición autorizada se usa `replay-isolated.py TAG` con tag alfanumérico1–6caracteres y un substage nuevo; nunca borra/reutiliza cluster o resultados previos. El wrapper es facilitador **NOT EXECUTED**; el harness y SQL sí se ejecutaron con315PASS. No copiar scripts a un directorio con credenciales ni modificar destinos a una DB remota.

## Referencias primarias verificadas

- Integración nativa Clerk: https://supabase.com/docs/guides/auth/third-party/clerk y https://clerk.com/docs/guides/development/integrations/databases/supabase.
- Column ACL y su diferencia de grants tabla: https://supabase.com/docs/guides/database/postgres/column-level-security.
- security_invoker: https://www.postgresql.org/docs/18/sql-createview.html y https://supabase.com/docs/guides/database/views.
- Storage operación/servicio bypass: https://supabase.com/docs/guides/storage/security/access-control.

Ninguna referencia equivale a que la integración esté activada en el proyecto real.
