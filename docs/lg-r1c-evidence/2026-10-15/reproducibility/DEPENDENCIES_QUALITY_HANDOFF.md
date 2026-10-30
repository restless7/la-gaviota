# LG-R1C — Instalación, calidad comparable y advisories

Estado de este track: **clean-install PASS; TypeScript inicial PASS; no regresión lint inicial PASS; lint completo FAIL heredado; advisories abiertos triaged**. Comprobación final tras el ajuste middleware/helper revisado: TypeScript PASS exit0/8.068s; scoped-lint53archivos36errores28warnings heredados,0nuevas violaciones. Comercial sigue NO-GO.

## Instalación nueva realmente ejecutada

Root autorizó un único árbol instalado en `/tmp/la-gaviota-lg-r1c-20261015/application/node_modules`. `npm ci --ignore-scripts --no-audit --no-fund --strict-peer-deps --engine-strict`, Node24.13.0/npm11.6.2, exit0 en12.062s,539paquetes. No se reutilizó node_modules anterior ni symlink hacia él. Sólo el árbol antiguo expresamente autorizado `/tmp/la-gaviota-lg-r1b-20261015/candidate-final/node_modules` se retiró tras validar realpath, hashes del manifest/lock y ausencia de procesos referenciándolo. No se retiró el tooltree R1B inicial, servicios ni archivos ajenos.

ManifestSHA256 `7bcb5bf41cf599dffd487cb3c1032b1cb81350ace0e2f43bd009a0587b8e8c6b`; lockSHA256 `1906288202e7b4c44e61659787ea3f9577ea9b37f7404098dd5c89b1c56b7157`. Inalterados tras instalación. Sin force, legacy-peer-deps, overrides, upgrade o lifecycle. Npmrc user/global privados vacíos y entorno allowlist sin HOME/.env/Clerk/Supabase/Wompi/DB. Caché propia anterior reutilizada; sólo registro público npm para instalar y consultar advisories.

Recursos mínimos observados: raíz3681615872bytes, tmpfs14282739712bytes, MemAvailable10365370368bytes. Gates: raíz≥1GiB,tmpfs≥4GiB,MemAvailable≥4GiB,300s/logs10MiB. Sin abort ni ENOSPC. Proceso de instalación199691 terminó; no se dejó worker de instalación.

Evidencia: `clean-ci.json`, stdout/stderr, `owned-old-tree-retirement.json`, `clean-install.py`.

## Integridad y peers

26dependencias directas resueltas exactamente a las versiones aprobadas.617entradas de lock **incluyendo raíz** =616sin raíz;610tarballs HTTPS registry.npmjs.org con SHA512,6entradas bundled cubiertas por tarball padre.539entradas instaladas, cero diferencias de versión contra lock para las instaladas.7paquetes declaran lifecycle; permanecieron desactivados. No se afirma generación Prisma, firma del mantenedor ni attestation de supply chain por el hecho de que npm verificó integridades.

`npm ls --all --json --offline` final con configs vacíos exit0, sin peer inválido. **Sí reporta dos entradas físicas optional/extraneous**, `@img/sharp-wasm32@0.35.5` y `@emnapi/runtime@1.11.3`: ambas existen en el lock aprobado y en installed lock con misma versión/integridad. Sus padres opcionales de plataforma no están todos presentes. No se ocultó esa advertencia ni se borraron paquetes para fabricar un árbol sin problemas. No equivalen a drift de manifest ni incompatibilidad de peer, pero la clasificación de npm se conserva como limitación operativa.

Evidencia: `final-peer-tree.*`, `dependency-verification-summary.json`, `installed-direct-metadata.json`. La primera exploración npm-ls se repitió con configuración/caché privadas explícitas; sólo `final-peer-tree.*` es autoridad final de ese check.

## Baseline ESLint comparable

Mismos binarios realmente instalados: ESLint9.39.4, eslint-config-next16.4.1, TS5.9.3. Fuente baseline obtenida mediante Gitshow del commit49add73 en una copia pequeña sin .env/public/docs; node_modules es sólo enlace al único árbol instalado. Análisis estático no ejecuta los scripts legacy. No se modificó fuente para eliminar diagnósticos.

| Alcance | Baseline | Candidato congelado R1B inicial |
| --- | --- | --- |
| Full tracked JS/TS/config, incluidos diagnósticos/scripts |143archivos;93errores62warnings |149archivos;92errores60warnings |
| Scope aprobado |47existentes;37errores30warnings |53archivos;36errores28warnings |
| Fuera del scope |96archivos;56errores32warnings |Mismos56errores32warnings |
| Nuevas violaciones tras comparación |—|**0errores0warnings** |
| Fatal/config failures |0|0|

Los64diagnósticos restantes del scope coinciden por archivo, regla, severidad, mensaje normalizado y **misma línea de fuente exacta**. Se normaliza sólo el párrafo del mensaje que excluye el codeframe con path/línea; la prueba adicional de línea de fuente evita que los desplazamientos de línea aparenten nuevas incidencias. No se tomó una reducción agregada como prueba suficiente. `lint-comparison.json`, `lint-source-line-validation.json` y JSONfull/scoped conservan cada diagnóstico. Un primer comparador sin normalización señaló8effect-errors por paths/codeframes distintos; fue diagnóstico del comparador, no regresión ni reparación de producto.

Errores heredados del scope:21no-explicit-any,8set-state-in-effect,4HTMLnavigation,2unescapedentities,1display-name. Warnings:21unused-vars,4img-elements,2locationassign,1exhaustive-deps. No se propone churn any→unknown ni refactor de efectos/UX para conseguir PASS cosmético. Root acordó cero cambios lint si no hay violaciones nuevas. El gate de no regresión puede pasar mientras **lint completo continúa FAIL**.

No se compara directamente93errores con82del informe R1B: aquel análisis excluía varios scripts de diagnóstico; el par comparable actual usa idéntico scope/tooling.

TypeScript inicial: `tsc --noEmit --incremental false --pretty false`, exit0. Preload deniega APIs de redNode/net/tls/http/https/dns/fetch/WebSocket y no registró intentos; es instrumentación finita, no prueba universal de kernel ni de gateways. Next real/build pertenece a QA independiente y no se acredita aquí con el PASS de tipos.

## Advisories: cada high, sin cambios de versión

Audit nuevo:12package-nodes(9high3moderate),exit1; omitdev7(4high3moderate),exit1. No son12bugs independientes ni una certificación de explotación. Las9entradas high proceden de3advisories base. `high-advisory-triage.json` contiene una fila por cada package-node high.

| Paquete high instalado | Cadena/alcance | Reachability observada y salida propuesta |
| --- | --- | --- |
|eslint-config-next16.4.1|Cadena tooling braces|Sólo lint/config; sin import app/src o endpoint de glob no confiable observado. Actualizar padre soportado cuando corresponda, sin downgrade14 automático.|
|@next/eslint-plugin-next16.4.1|→fast-glob→micromatch→braces|Misma condición; probar lint/Next y globs reales antes de actualización.|
|fast-glob3.3.1|→micromatch→braces|Se conserva flag npm; no afirmar seguro por ser tooling.|
|micromatch4.0.8|→braces3.0.3|No endpoint que permita glob al cliente encontrado; revisar si aparece.|
|braces3.0.3|GHSA-vfj7-8cjw-p6xm|Issue del mantenedor disputa el reporte en ausencia de glob externo y discute maxLength; no release parchado en advisory actual. Registrar disputa y mantener finding abierto.|
|@prisma/config7.8.0|→deepmerge-ts7.1.5|Usado por prisma.config.ts de tooling; ningún import app/src observado. Padre pin exacto impide reemplazo directo sin revisión.|
|deepmerge-ts7.1.5|GHSA-ggr8-5vv4-36mx|Requiere grafo JS recursivo; JSON solo no lo construye. Fix8.0 introduce cambiosMap/customAPI: actualizar padre compatible y probar config/client, no override8.|
|mysql2 3.15.3|GHSA-3f6p-5ww8-9rcr +moderatecompressed|Prisma7.8 pin exacto; no import/callMySQL de app/src observado. High requiere conexión a servidorMySQL malicioso/MITM; no se usó ningún MySQL/credencial. Fixdefaultplugin en release3.22/PR4236; parent compatible y tests sintéticos antes de cambio.|
|prisma7.8.0|Padre config/dev/mysql2|Peer opcional de @prisma/client; aparece también en omitdev, **no simplemente dev-only**. Mantener CLI/dev/Studio sin exposición; actualización soportada del padre requiere alcance separado.|

Fuentes primarias verificadas:

- [braces issue70](https://github.com/micromatch/braces/issues/70): disputa explícita del mantenedor, sin borrar flag npm.
- [deepmerge advisory](https://github.com/RebeccaStevens/deepmerge-ts/security/advisories/GHSA-ggr8-5vv4-36mx), [release8.0](https://github.com/RebeccaStevens/deepmerge-ts/releases/tag/v8.0.0): fix y compatibilidad.
- [mysql2 advisory](https://github.com/sidorares/node-mysql2/security/advisories/GHSA-3f6p-5ww8-9rcr), [release3.22](https://github.com/sidorares/node-mysql2/releases/tag/v3.22.0), [PR4236](https://github.com/sidorares/node-mysql2/pull/4236): el advisory de mantenedor aún indica patchedNone, mientras release/commit documentan defaultplugin cerrado. Se conserva discrepancia; npm marca <3.22.0. No se inventa actualización del árbol.
- [mysql2 compression](https://github.com/sidorares/node-mysql2/security/advisories/GHSA-rgwj-5xj2-c3m3): condición compress:true. Npm refiere3.23.1; el advisory primario aún no indica patchedversion; requiere confirmar commit antes de upgrade.
- [Hono repeatedslashes](https://github.com/honojs/node-server/security/advisories/GHSA-92pp-h63x-v22m): versión instalada1.19.11 por PrismaDev; fix1.19.13 documentado. También quedan moderateHonoWindows/Valibot heredados; las dos páginas primarias no respondieron en esta sesión, sus datos npm se conservan, sin cerrar hallazgo.

No se ejecutaron PoCs, servidores PrismaDev/Studio/MySQL ni probes de producción. Futuros tests deben usar sintéticos para config recursiva, plugin-downgrade, límites de compresión y rutasHono, además de peers/tipos/build. Rechazar sugerencias npm de downgradePrisma6.19.3/eslintconfig14 y overrides evita cambios no aprobados; no resuelve automáticamente el riesgo.

Soporte tooling: [ESLint9 EOL2026-08-06](https://eslint.org/version-support/) permanece pendiente. [Node24 es LTS](https://nodejs.org/en/about/previous-releases), pero24.13 probado no es patch actual24.22; no se actualizó host/candidato. Install también avisa deprecation Clerk/types/react y Recharts2; no se introducen Clerk7/Recharts3/ESLint10 sin autorización.

## Límites y siguiente gate

Aplicación no editada por este track. Manifest/lock no se alteraron; SQL/producción no se tocaron. Root/autor/QA revisaron el ajuste del contexto Clerk, patchSHA30f8b701b6e289b2fbad0c3100e11f18557338f8d023f9be210f003494e5b9a1, únicamente middleware.ts y src/lib/server/authorization.ts. La última pareja de checks se ejecutó contra esos archivos congelados. Instalar no acredita lifecyclePrisma/engine generation, Clerkauthreal, Storage, PostgREST, checkout seguro, build offline completo ni releaseGO.

Evidencia final: final-quality-summary.json enlaza55hashes estables durante TypeScript/scoped-lint; sólo los2archivos revisados difieren del patchR1B;64diagnósticos heredados conservan exacta línea de fuente/regla/mensaje.0intentos de red en estos checks, todos los subprocess terminaron. No se volvió a ejecutar lintfull tras el ajuste: el fullFAIL actual se deriva del scoped idéntico y archivos fuera de scope sin cambios, no se presenta como una nueva corrida full. No se repitió instalación ni se ejecutaron upgrades. Árbol nuevo conservado para QA; no se elimina hasta cierre de todos los consumidores autorizados.
