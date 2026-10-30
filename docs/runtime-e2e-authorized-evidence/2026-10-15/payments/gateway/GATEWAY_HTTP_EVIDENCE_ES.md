# Gateway HTTP local: 14/14 comprobaciones PASS

Fecha: 2026-10-15. Ejecución finita contra `http://127.0.0.1:47776/rest/v1`, gateway loopback creado y administrado por root, PostgREST16.4 y PostgreSQL18 privados con fixtures/políticas propuestas. Se usó HTTP real con urllib, sin proxy de entorno y sin redirects. No se creó otro servicio ni se editó aplicación o configuración.

Los tokens se firmaron con el HMAC **ficticio** privado del gateway y subjects `user_TEST_RETAIL_A/B`. Firma y expiración fueron verificadas por PostgREST. **No son tokens Clerk**, no verifican issuer/JWKS/sesión/revocación Clerk ni certifican Supabase hospedado, Auth, Storage, Realtime, Kong/apikey o Server Actions. El header apikey contiene la fixture de root; no se probó una implementación de validación de API keys.

| Comprobación | Resultado observado |
| --- | --- |
| Catálogo anon: proyección explícita segura | 200, sin costo ni tiers privados |
| Costo anon / PII customers anon | Denegado SQL42501 |
| Escritura anon | Denegada SQL42501 |
| Perfil propio / pedido propio authenticated | 200, una fila propia en cada caso |
| Perfil/pedido de otro owner | 200, [] en ambos casos |
| Metadata ADMIN en JWT ordinary authenticated | Sin privilegio DML y sin PII de otro owner |
| Firma JWT inválida / JWT expirado | 401 en ambos casos |
| service_role: costo / lectura de múltiples owners | 200; bypass explícito, requiere guardas server confiables |

Los únicos dos PATCH intentados usaron un SKU ficticio inexistente y fueron denegados por permisos; no se hizo DML positivo. Los cuerpos retenidos contienen únicamente status, conteos, nombres de campos y códigos de error. No se guardaron JWT, HMAC, emails, teléfonos ni IDs Clerk reales. Los GET al rol de servicio prueban el bypass: no son autorización por usuario. Las [reglas oficiales de RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) explican la combinación de grants/policies y la excepción service_role.

Esto agrega evidencia de transporte real y enforcement de la fixture al gate DB. No cambia el FAIL de binding, atomicidad, deduplicación o recovery de pagos ni habilita Wompi. El callback no se invocó por HTTP. La propiedad y cleanup del gateway/PG son de root.

Reproducción sólo mientras root mantenga **ese entorno ficticio** activo y sus archivos privados; el runner rechaza otras rutas/configuraciones y no crea servicios:

```sh
env -i PATH=/usr/bin:/bin LANG=C.UTF-8 python3 docs/runtime-e2e-authorized-evidence/2026-10-15/payments/gateway/run-gateway-http.py --fixture-env /tmp/la-gaviota-authorized-e2e-20261015/root/synthetic-service-env.json --postgrest-config /tmp/la-gaviota-authorized-e2e-20261015/root/postgrest.conf --output /tmp/la-gaviota-gateway-replay.json
```

No ejecutar apuntando a un backend existente. El manifest de este subdirectorio es independiente y no modifica el manifest congelado del paquete payments anterior.
