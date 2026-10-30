# LG-R1C — labels de rol y plan de compatibilidad

Inventario **de fuente aplicada**, no listado de cuentas activas. No se leyó Clerk remoto ni se modificó metadata de usuarios. Ver role-label-source-inventory.json para referencias exactas. La decisión explícita del owner conserva **tiers.manage para ADMIN y SUPER_ADMIN**; no hay delta ni gate pendiente sobre esa regla.

| Convención | Comportamiento local implementado | Estrategia futura, sin ejecutar |
|---|---|---|
| role=ADMIN | Administración operacional/tier; sin administración de identidades ni lectura audit reservada | Mantener contrato congelado; verificar cuenta sintética y acceso operativo |
| role=SUPER_ADMIN | Capacidades conocidas incl. identidad; capability desconocida se deniega | Mantener; validación de recuperación de último administrador antes de migrar personas reales |
| role=USER o CLIENT | Cliente; tier válido independiente | CLIENT es alias de lectura; escritores de roles canónicos emiten USER |
| role ausente y metadata nueva | USER retail por decisión explícita del contrato | No confundir con role desconocido; probar alta real segura en siguiente fase |
| role=admin en minúsculas | INVALID; sin operaciones privadas/administrativas del servidor | No aplicar titlecase automático: owner debe confirmar cuáles eran administradores legítimos |
| tier=admin/SUPER_ADMIN sin role canónico | Tier no eleva; USER retail si role ausente | Owner confirma intención por cuenta mediante metadata mínima; nunca inferir rol por tier |
| role=OPERARIO | Etiqueta reconocida; sólo derechos propios de cliente, sin capacidades de bodega | Definir capacidades/recursos expresamente antes de concederlas |
| role=COMMERCIAL | Etiqueta reconocida; sin privilegios/asignaciones comerciales inferidos | Definir assigned_rep/ownership y operaciones aprobadas; no restaurar USING(true) |
| role desconocido/conflictivo | Sin elevación; servidor privado falla cerrado; catálogo público retail | Resolver manualmente metadata ambigua mediante proceso autorizado |
| claim de sesión stale SUPER pero metadata fresca USER | Niega capacidades staff | Verificar ciclo real de Clerk y revocación en entorno de prueba; no confiar en claim para operaciones sensibles |

Los SELECT owner del modelo SQL futuro se basan en identidad nativa válida sub TEXT; no consultan role mirror. Pueden permitir lectura propia con role de aplicación desconocido, mientras el servidor service-backed es más restrictivo. No se aplicó ese SQL y no se afirma equivalencia entre ambos modelos.

Secuencia de migración propuesta:

1. Obtener por canal autorizado sólo conteos/labels de metadata y casos ambiguos pseudonimizados; no exportar emails, direcciones ni órdenes. Esta fase no autorizó ni ejecutó la lectura de cuentas reales.
2. Aprobar una tabla caso→rol canónico+tier comercial, separando identidad/permiso/precio. Resolver minúsculas, privileged tiers históricos y conflictos sin elevación automática.
3. Ensayar esa tabla con cuentas sintéticas. Registrar acceso esperado y diferencias intencionales; incluir roles nuevos, revocados y sesiones stale.
4. Preparar snapshot protegido de metadata mínima y rollback por cuenta, con custodio/retención; evitar secretos en Git/logs. Mantener un mecanismo administrativo de recuperación verificado.
5. Solicitar autorización separada antes de cualquier cambio real de identidad. Usar únicamente el flujo administrativo protegido y verificación del actor; no introducir bypass por tier ni cambiar el contrato tiers.manage aprobado.
6. Validar sesiones y navegación después de cada lote pequeño; si hay divergencia, detener el lote y conservar denegación, sin conceder privilegios generales.

Compatibilidad de UI no corregida fuera de los53 archivos: Footer sigue comprobando role=admin y Header elige portal por pricing tier. El middleware/dashboard canónico funciona según el contrato en mocks, pero la descubribilidad administrativa y login real quedan pendientes de SDK/HTTP/navegador. No se modificaron esos archivos fuera del alcance para ocultarlo.
