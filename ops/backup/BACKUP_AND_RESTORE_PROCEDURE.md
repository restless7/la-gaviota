# LA GAVIOTA — PROCEDIMIENTO INTEGRAL DE RESPALDO Y RESTAURACIÓN
## PostgreSQL 16 + Supabase Multi-Bucket Storage · Protocolo LG-PROD-R4.2
**Fecha de Publicación:** 4 de Noviembre de 2026  
**Objetivo de Protección:** Base de Datos Productiva `tcjeiizrarwerarcfyky` (Catálogo, Precios, Esquema, Buckets `product-images` y `kit-banners`)  
**Directiva de Seguridad:** PREPARACIÓN DOCUMENTAL Y HERRAMENTAL · ESTRICTA PROHIBICIÓN DE EJECUCIÓN NO AUTORIZADA CONTRA PRODUCCIÓN

---

### 1. Gestión Segura de Credenciales (Sin Contraseñas en CLI ni Historial)

> [!CAUTION]
> **Nunca incluir contraseñas en texto plano dentro de la línea de comandos, scripts versioneados o cadenas de conexión en terminal.**  
> `pg_dump` y `psql` registrarían las credenciales en el historial de bash (`~/.bash_history`) y en la tabla de procesos (`ps aux`).

#### Protocolo PGPASSFILE Obligatorio:
1. Crear un archivo temporal de contraseñas con permisos restringidos:
   ```bash
   install -m 600 /dev/null ~/.pgpass_lagaviota_backup
   ```
2. Registrar la tupla de conexión de producción:
   ```bash
   # Formato: hostname:port:database:username:password
   echo "db.tcjeiizrarwerarcfyky.supabase.co:5432:postgres:postgres:<TU_CONTRASENA_PRODUCCION>" >> ~/.pgpass_lagaviota_backup
   ```
3. Exportar la variable de entorno para la sesión del operador:
   ```bash
   export PGPASSFILE=~/.pgpass_lagaviota_backup
   ```
4. Al concluir la operación de respaldo:
   ```bash
   rm -f ~/.pgpass_lagaviota_backup
   unset PGPASSFILE
   ```

---

### 2. Procedimiento de Respaldo Lógico de Base de Datos (PostgreSQL 16)

#### Comando Canónico `pg_dump`:
```bash
pg_dump \
  --host=db.tcjeiizrarwerarcfyky.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --format=custom \
  --blobs \
  --no-owner \
  --no-privileges \
  --verbose \
  --file=ops/backup/artifacts/backup_tcjeiizrarwerarcfyky_$(date +%Y%m%d_%H%M%S).dump \
  2>&1 | tee ops/backup/artifacts/backup_pg_dump.log
```

#### Generación de Checksum Criptográfico SHA-256:
```bash
sha256sum ops/backup/artifacts/backup_tcjeiizrarwerarcfyky_*.dump > ops/backup/artifacts/backup_tcjeiizrarwerarcfyky.dump.sha256
```

---

### 3. Procedimiento de Respaldo Multi-Bucket de Supabase Storage

`pg_dump` no respalda los bytes físicos de los archivos multimedia almacenados en Supabase Storage (S3-compatible backend). 

#### Inventario de Buckets Críticos en Producción:
1. **`product-images`:** Almacena más de 400 fotografías de productos (frutas, verduras, condimentos, kits) aprobadas comercialmente.
2. **`kit-banners`:** Almacena banners promocionales para combos mayoristas y combos de negocios.
3. **Buckets adicionales descubiertos dinámicamente:** El exportador consulta la API `storage.listBuckets()` para descubrir cualquier otro bucket operativo (ej. facturación o documentos).

#### A. Inventario y Descarga de Blobs:
Se utiliza la herramienta [`ops/backup/export-storage-manifest.ts`](file:///home/sebastiangarcia/planmaestro-ecosystem/packages/la-gaviota/ops/backup/export-storage-manifest.ts):
```bash
# Ejecución no mutante (solo lectura de objetos)
npx tsx -e '
  import { exportAllStorageBuckets } from "./ops/backup/export-storage-manifest";
  exportAllStorageBuckets(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    "ops/backup/artifacts/storage",
    "ops/backup/artifacts/storage-manifest.json"
  );
'
```

#### B. Estructura del Manifiesto Multi-Bucket (`storage-manifest.json`):
Cada objeto exportado se cataloga con su bucket de origen, nombre, tamaño en bytes y hash criptográfico SHA-256:
```json
{
  "exported_at": "2026-11-04T19:30:00.000Z",
  "project_url": "https://tcjeiizrarwerarcfyky.supabase.co",
  "total_buckets": 2,
  "total_objects": 486,
  "total_bytes": 142589020,
  "buckets": {
    "product-images": {
      "object_count": 480,
      "byte_count": 141200000,
      "objects": [
        {
          "name": "aromticas-albahaca-1782949880848.jpeg",
          "bucket": "product-images",
          "size_bytes": 184520,
          "sha256": "8a3f9e2b..."
        }
      ]
    },
    "kit-banners": {
      "object_count": 6,
      "byte_count": 1389020,
      "objects": [
        {
          "name": "managed/kit/combo-semanal.webp",
          "bucket": "kit-banners",
          "size_bytes": 231500,
          "sha256": "3d4c5e6f..."
        }
      ]
    }
  }
}
```

---

### 4. Prueba de Restauración Aislada (Dry-Run en Entorno No Productivo)

> [!IMPORTANT]
> Un respaldo no existe hasta que se demuestra su restauración completa en un entorno limpio.

#### Protocolo de Restauración de Prueba (En Contenedor Docker Local Desechable):
1. **Levantar clúster PostgreSQL 16 limpio en puerto aislado (ej. 54399):**
   ```bash
   docker run --name pg-backup-verification -e POSTGRES_PASSWORD=testpass -p 54399:5432 -d postgres:16-alpine
   ```
2. **Ejecutar restauración completa desde el archivo dump:**
   ```bash
   PGPASSWORD=testpass pg_restore \
     --host=127.0.0.1 \
     --port=54399 \
     --username=postgres \
     --dbname=postgres \
     --clean \
     --if-exists \
     --verbose \
     ops/backup/artifacts/backup_tcjeiizrarwerarcfyky_*.dump \
     2>&1 | tee ops/backup/artifacts/restore_test.log
   ```
3. **Verificación de Consistencia Cuantitativa:**
   ```bash
   PGPASSWORD=testpass psql -h 127.0.0.1 -p 54399 -U postgres -d postgres -c "
     SELECT 'products' AS tabla, count(*) AS filas FROM public.products
     UNION ALL
     SELECT 'categories', count(*) FROM public.categories
     UNION ALL
     SELECT 'kits', count(*) FROM public.kits;
   "
   ```
4. **Destrucción del contenedor de prueba:**
   ```bash
   docker rm -f pg-backup-verification
   ```

---

### 5. Criterios de Aceptación del Respaldo

Para que el respaldo sea formalmente aceptado por Release Assurance antes de cualquier migración:
1. `pg_dump` finaliza con código de salida `0` y sin errores de lectura.
2. El hash SHA-256 del archivo `.dump` coincide con el archivo `.sha256`.
3. Todos los objetos de `product-images` y `kit-banners` están descargados y catalogados con su hash en `storage-manifest.json`.
4. La restauración de prueba en PostgreSQL 16 local reproduce exactamente el número de productos, categorías y kits sin truncamiento de datos.
