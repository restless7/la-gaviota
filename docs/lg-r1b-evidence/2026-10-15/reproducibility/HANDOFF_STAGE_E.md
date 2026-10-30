# LG-R1B — Stage E: candidato de reproducibilidad y dependencias

Fecha2026-10-15 America/Bogota. **Preparación aislada completa; instalación reproducible PASS, calidad y seguridad PARTIAL. Producción NO-GO.** No se modificó package.json, lock, source o node_modules del repositorio original; no hubo consultas nuevas a producción, credenciales ni SDKs reales.

## Artefactos propuestos y ejecución real

La propuesta final modifica solamente **package.json y package-lock.json**. Autoridades: `candidate-final/package.json`, `candidate-final/package-lock.json` y `dependency-reconciliation.patch` (208087bytes). `candidate/` es una exploración anterior con Clerk6.37, NO el candidato recomendado.

- ManifestSHA256: `7bcb5bf41cf599dffd487cb3c1032b1cb81350ace0e2f43bd009a0587b8e8c6b`.
- LockSHA256: `1906288202e7b4c44e61659787ea3f9577ea9b37f7404098dd5c89b1c56b7157`.
- Instalación final real y desde cero: `/tmp/la-gaviota-lg-r1b-20261015/candidate-final/node_modules`.
- `npm ci --ignore-scripts --no-audit --no-fund --strict-peer-deps`, Node24.13.0/npm11.6.2, **exit0**,539paquetes/12.918s. `final-tmpfs-clean-ci.json` conserva comando, tiempos, hashes y mínimos de recursos. No había node_modules antes de esa ejecución.
- Entorno reconstruido por allowlist, HOME omitido y nunca reasignado, npmrc de usuario/global distintos y vacíos, caché privada tmpfs, ninguna variable de aplicación/credencial. Registro público npm únicamente; no se ejecutaron lifecycle scripts.
- `npm ls --all --json --offline` **exit0**, sin peer inválido observado. Se mantienen checks estrictos de engines y peers; sin force, legacy-peer-deps ni overrides.
- Lock:616entradas de paquetes;610tarballs npm con SHA512;6entradas `inBundle` cubiertas por integridad de `@tailwindcss/oxide-wasm32-wasi`. No falta integridad independiente en un tarball descargable.94entradas opcionales incluyen plataformas no instaladas.7entradas declaran lifecycle scripts y permanecieron desactivadas.138paths añadidos/146versiones cambiadas frente al lock incompleto;0paths retirados.

## Clasificación de cambios

1. **Reproducibilidad:** recuperar los seis directos ausentes del lock: Clerk Next/localizations, Supabase JS/SSR, Prisma/client; corregir versión raíz0.1.0→0.1.3; fijar los26directos con versiones exactas y declarar Node`>=24.13.0 <25`/npm11.6.2/packageManager. El lock nuevo fija transitivas sin alterar sus rangos mediante overrides.
2. **Seguridad:** Next16.2.1→16.4.1 y eslint-config-next alineado; Clerk6.37.0→6.39.7. Se conserva major16/React19/Clerk6/Prisma7. Next16.3.6 se descartó como selección insuficiente: el audit actual incluye advisories hasta16.3.7 y transitivas Sharp/PostCSS antiguas. La selección16.4.1 es un candidato revisado mediante advisories y audit, no una afirmación de parche mínimo. Sharp resuelto0.35.5 y PostCSS8.5.30.
3. **Compatibilidad:** @types/react19.2.14→19.3.0 y @types/react-dom19.2.3→19.3.0. Con la pareja anterior npm strict ERESOLVE en PrismaStudio→Radix intentaba typesdom19.3; la pareja coherente resuelve sin ocultar peers. React/ReactDOM runtime permanecen19.2.4. Typecheck PASS no reemplaza regresión de render/auth.
4. **No adoptado:** Clerk7/Core3, Prisma8, Recharts3, ESLint10, Reactruntime19.3 y otros upgrades opcionales. ESLint9 está EOL desde2026-08-06 según su política oficial: se conserva para baseline controlado, no se presenta como tooling mantenido. Node24 es LTS, pero24.13.0 es el patch disponible probado, no el actual24.22.0; validar patch de runtime actualizado antes de release queda pendiente. Ninguna actualización del host se hizo.

`dependency-change-plan.json` clasifica cada directo; `installed-direct-metadata.json` conserva versiones realmente instaladas, peers, engines e integridades.

## Calidad estática y frontera de seguridad

Copia de137archivos source/config tracked, excluyendo `.env*`,.git,node_modules,.next,docs,public y scripts legacy. Hashes originales idénticos antes/después; fuente no editada. TS/ESLint ejecutados con env mínimo y preload que rechaza red mediante net/tls/http/https/dns/fetch/WebSocket;0intentos registrados. Esto es instrumentación finita, no una sandbox kernel universal.

| Check final | Resultado | Evidencia |
| --- | --- | --- |
| tsc --noEmit --incremental false --pretty false | PASS exit0 |final-typecheck.json/stdout/stderr|
| ESLint source-copy . --format json | FAIL exit1:131archivos,82errores,58warnings,0fatal |final-lint.*,final-static-summary.json|
| Peer tree offline | PASS exit0 |final-peer-tree.*|
| Reproducción preflight limpio | PASS exit0, sin instalar |reproduction-preflight-tests.json|
| Rechazo variable Supabase ficticia | PASS esperado:exit1 antes de instalación |mismo JSON, no valores secretos|
| Next build y runtime autenticado | BLOCKED / NO EJECUTADO |source todavía instancia SDKs reales; no existe reemplazo sintético completo de DB/Clerk/Googlefonts/static generation en este track|

El conteo ESLint no es comparable directamente con143archivos del audit anterior: aquí se excluyen scripts legacy y se usa tooling propio exacto. No se arreglaron82errores para fabricar PASS. TS resolvió el bloqueo previo de `prisma/config` al disponer Prisma7 real, pero no acredita generación/funcionamiento de PrismaClient porque scripts permanecen apagados. El candidato final no importa la aplicación ni inicia Next/PrismaStudio/servidores.

## Advisories y limitaciones

`baseline-audit` del lock incompleto:15entradas(1critical12high1moderate1low). El candidato final: **12entradas(0critical9high3moderate), npm audit exit1**. `--omit=dev`: **7entradas(4high3moderate), exit1**. No se interpretan15→12como reducción cuantitativa de riesgo: el lock original omitía seis directos y sus transitivas.

Se corrigieron en el candidato los reportes de Next y Clerk; permanecen cadenas ESLint→fast-glob→micromatch→braces y Prisma→config/dev/mysql2. Prisma es peer opcional de @prisma/client y sus transitivas aparecen también con omitdev: **no son simplemente dev-only**. No se encontraron imports Prisma/mysql2/Hono/deepmerge/Valibot en app/src en inspección finita, ni se levantaron esos servidores; eso limita alcance observado pero no elimina los reportes.

`advisory-triage.json` contiene rangos, versiones, flags, URLs y contexto. `residual-advisory-primary-references.json` enlaza advisories/commits/issues de mantenedores. Se rechazaron sugerencias automáticas de downgrade a Prisma6.19.3 o eslint-config-next14.2.35. Resolver esas cadenas requiere actualización compatible del padre o decisión explícita documentada; no se forzó deepmerge8 ni se eliminó tooling para reducir contadores.

Fuentes primarias de selección:

- [Next ImageResponse](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j): condición Node next/og con SVG controlado por atacante; no se encontró ese import en source inspeccionado.
- [Next AVIF](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4) y [Sharp/librsvg](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w): condicionados por formato/runtime; sin explotación ni probes.
- [Clerk route matcher](https://github.com/clerk/javascript/security/advisories/GHSA-vqx2-fgx2-5wq9): el patrón public-list invertido tiene una defensa descrita por el mantenedor; source también usa matchers por rol. No se afirma bypass efectivo del sitio.
- [Clerk checks combinados](https://github.com/clerk/javascript/security/advisories/GHSA-w24r-5266-9c3c): no se encontraron los checks combinados afectados;6.39.7 satisface ambos mínimos publicados.
- [ESLint soporte](https://eslint.org/version-support/) y [Node releases](https://nodejs.org/en/about/previous-releases).

La versión realmente instalada en producción sigue UNKNOWN; se reutiliza sólo la evidencia de paridad anterior. No hubo nuevas consultas de deployment ni autorización runtime. No hay evidencia nueva de compromiso o credencial expuesta.

## Incidencias reproducidas y recursos

Se conservan los fallos iniciales ERESOLVE de tipos, EUSAGE de lock heredado @emnapi y ENOSPC. Una instalación duplicada en el filesystem raíz agotó espacio; se pausó todo y se retiraron exclusivamente caché propia regenerable y node_modules duplicado incompleto, liberando1637240832bytes. No se retiró el primer tooltree compartido ni archivos ajenos. Disponibilidad global del host durante ENOSPC no se certifica; preservación de source sí está verificada.

La instalación final se trasladó a tmpfs separado por coordinación de root. Monitoreó raíz>=512MiB,tmpfs>=4GiB,MemAvailable>=4GiB,logs<=10MiBcada uno y300s. Mínimos observados: raíz2302869504bytes,tmp15162540032bytes,mem12956307456bytes;0abort. No quedan procesos propios de instalación/quality pendientes. Root puede retirar el tooltree inicial sólo cuando el agente de autorización confirme que no lo usa.

## Reproducción futura sin tocar original

El script `reproduce-candidate.py` verifica hashes, rechaza variables de servicio/runtime y `.env`, URLs no-registry y overrides, comprueba recursos y crea un destino tmpfs nuevo por ejecución. `--check-only` es la modalidad verificada del wrapper nuevo; la instalación final real ya fue ejecutada con `install-final-tmpfs.py` sobre esos mismos hashes. No se sumó una instalación extra sólo para probar el wrapper.

```sh
env -i PATH=/home/sebastiangarcia/.nvm/versions/node/v24.13.0/bin:/usr/bin:/bin LANG=C.UTF-8 python3 /home/sebastiangarcia/.local/share/la-gaviota/lg-r1b-20261015/reproducibility/reproduce-candidate.py --check-only
# Con suficiente tmpfs/memoria, reproduce sólo npmci en directorio nuevo:
env -i PATH=/home/sebastiangarcia/.nvm/versions/node/v24.13.0/bin:/usr/bin:/bin LANG=C.UTF-8 python3 /home/sebastiangarcia/.local/share/la-gaviota/lg-r1b-20261015/reproducibility/reproduce-candidate.py --install
```

**Gate E:** PASS para restauración de clean-install del candidato aislado; PARTIAL global por lintFAIL, advisories residuales, scripts/runtime/build no verificados y actualización Nodepatch/ESLintsoporte pendiente. Aplicar los dos archivos propuestos requiere la siguiente autorización; no se aplicó el patch ni se inició corrección financiera/UX, commit, push o deployment.
