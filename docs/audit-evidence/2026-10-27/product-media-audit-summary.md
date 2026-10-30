# La Gaviota — Product Photography & Media Forensic Audit
**Audit Date:** 2026-10-27  
**Mission ID:** LG-MEDIA-R2 (Cross-Audit & Multi-Source Reconciliation)  
**Execution Mode:** STRICT READ-ONLY FORENSIC SCAN  
**Catalog Authority:** Supabase Public Catalog (`products` table, 255 active records) & Supabase Storage (`product-images` bucket, 80 objects)

---

## 1. Definición Operativa de Estados de Imagen

Para evitar confusiones metodológicas entre campos de base de datos y la experiencia visual real del cliente, se definen estrictamente tres conceptos no equivalentes:

1. **Producto sin `image_url` (190 productos):**  
   El registro en la tabla `products` de Supabase tiene el campo `image_url` en estado `NULL` o cadena vacía.
2. **Producto sin fotografía visible en interfaz (190 productos):**  
   Al carecer de `image_url`, la interfaz pública (`ProductCard.tsx`) renderiza el fallback de canasta campesina `🧺 Foto no disponible` (o el logo genérico `/IMAGES/logo.jpeg` en detalle), y el panel de administración (`InventoryClient.tsx`) renderiza el emoji de categoría (p. ej. 🥩, 🥬, 🍎). No existe ningún fallback dinámico o asignación oculta por slug en el cliente.
3. **Producto que realmente requiere fotografía nueva de estudio (~142 productos netos):**  
   Producto que no cuenta con `image_url` y para el cual **tampoco existe** un activo aprobado en activos locales (`public/PRODUCTS/`, 33 candidatos identificados) ni un objeto recuperable en el bucket de Supabase (15 objetos no mapeados identificados).

---

## 2. Reconciliación de Métricas y Hallazgos Forenses

- **Total de Productos Activos:** 255
- **Con `image_url` asignado en Base de Datos:** **65 productos (25.5%)**
  - **`HEALTHY` (Alta Calidad y Decodificación Válida):** **61 productos (23.9%)**
  - **`LOW_QUALITY` (Resolución < 600px o miniatura pequeña, pero visibles):** **4 productos (1.6%)**
    - `prd_0048` *Aguacate choque* (259×194 px, 10.6 KB)
    - `prd_0050` *Aguacate papelillo* (247×204 px, 11.5 KB)
    - `prd_0063` *Brócoli* (500×375 px, 31.5 KB)
    - `prd_0085` *Lechuga batavia* (195×259 px, 4.0 KB)
- **Sin `image_url` (`MISSING_REFERENCE`):** **190 productos (74.5%)**
- **Referencias Rotas (`BROKEN_REFERENCE`):** **0 productos (0.0%)** — El 100% de las 65 URLs asignadas retornan HTTP 200 OK y son servidas con encabezados de imagen válidos (`image/png`, `image/jpeg`, `image/webp`).
- **Objetos en Bucket Supabase (`product-images`):** 80 archivos físicos.
  - 65 corresponden a los productos asignados en BD.
  - 15 son objetos no mapeados en BD (versiones previas, duplicados de subida o variantes no vinculadas como `morcillasrellenas-1781150619699.png`, `coco-acaramelado`, `arveja-desgranada`, etc.).
- **Candidatos de Recuperación Local:** 33 productos correlacionados con activos de repositorio (`public/PRODUCTS/`).

---

## 3. Desglose Conciliado por Categoría

| Categoría | Total Productos | Con `image_url` (Total 65) | `HEALTHY` (61) | `LOW_QUALITY` (4) | Sin `image_url` (190) | Cobertura Visual Real |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| VERDURAS Y HORTALIZAS | 81 | 24 | 22 | 2 | 57 | 29.6% |
| FRUTAS | 50 | 24 | 22 | 2 | 26 | 48.0% |
| CARNES X 500 GRAMOS | 46 | 1 | 1 | 0 | 45 | 2.2% |
| VARIOS | 24 | 6 | 6 | 0 | 18 | 25.0% |
| FRUTOS SECOS Y ESPECIAS | 14 | 4 | 4 | 0 | 10 | 28.6% |
| CONDIMENTOS X 125 GR | 11 | 4 | 4 | 0 | 7 | 36.4% |
| AROMÁTICAS Y HIERBAS X 125 GR | 11 | 1 | 1 | 0 | 10 | 9.1% |
| PULPAS | 10 | 1 | 1 | 0 | 9 | 10.0% |
| KITS NEGOCIOS | 8 | 0 | 0 | 0 | 8 | 0.0% |
| **TOTAL** | **255** | **65** | **61** | **4** | **190** | **25.5%** |

*Aclaración sobre la categoría Carnes:* Contiene 46 productos activos. **1 producto tiene fotografía asignada y sana** (`prd_0188` *Vísceras Chanfaina picada*, imagen `vsceras-chanfaina-picada-1782958960148.jpg`). Los 45 productos restantes carecen de fotografía (cobertura 2.2%).

---

## 4. Auditoría Cruzada de Casos Específicos

En respuesta a la verificación solicitada sobre productos visibles en la interfaz de administración:

| Producto | ID / UUID | Categoría | Clasificación Escáner | URL de Origen (Supabase Storage) | Estado HTTP | Dimensiones | Render en Admin (`InventoryClient`) | Render en Tienda (`ProductCard`) |
| :--- | :--- | :--- | :---: | :--- | :---: | :---: | :--- | :--- |
| **Ajo criollo** | `prd_0055` | VERDURAS Y HORTALIZAS | `HEALTHY` | `.../product-images/ajo-criollo-1782949724946.png` | 200 OK | 2528×1696 | Miniatura `<img>` visible | Foto completa visible |
| **Almendra** | `prd_0235` | FRUTOS SECOS Y ESPECIAS | `HEALTHY` | `.../product-images/almendra-1782952074665.jpeg` | 200 OK | 447×447 | Miniatura `<img>` visible | Foto completa visible |
| **Apio rama mata** | `prd_0057` | VERDURAS Y HORTALIZAS | `HEALTHY` | `.../product-images/apio-rama-mata-1782951997776.png` | 200 OK | 2528×1696 | Miniatura `<img>` visible | Foto completa visible |
| **Ajo mix** | `prd_0216` | CONDIMENTOS X 125 GR | `HEALTHY` | `.../product-images/ajo-mix-1782963945327.jpeg` | 200 OK | 1239×1600 | Miniatura `<img>` visible | Foto completa visible |
| **Ajo molido** | `prd_0215` | CONDIMENTOS X 125 GR | `HEALTHY` | `.../product-images/ajo-molido-1782961782601.jpeg` | 200 OK | 554×554 | Miniatura `<img>` visible | Foto completa visible |
| **Ajonjolí** | `prd_0233` | FRUTOS SECOS Y ESPECIAS | `HEALTHY` | `.../product-images/ajonjol-1782961830767.jpeg` | 200 OK | 448×446 | Miniatura `<img>` visible | Foto completa visible |
| **Apio arracacha**| `prd_0058` | VERDURAS Y HORTALIZAS | `HEALTHY` | `.../product-images/apio-arracacha-1782951942739.jpeg` | 200 OK | 2528×1696 | Miniatura `<img>` visible | Foto completa visible |
| **Apio rama x3** | `prd_0056` | VERDURAS Y HORTALIZAS | `HEALTHY` | `.../product-images/apio-rama-x3-1782952018212.png` | 200 OK | 2528×1696 | Miniatura `<img>` visible | Foto completa visible |

**Conclusión del Muestreo:** Las miniaturas apreciadas en el administrador corresponden con exactitud a los productos clasificados como `HEALTHY` por el escáner. No provienen de una fuente secundaria ignorada; residen en el bucket `product-images` y están registradas en la columna `image_url` de la tabla `products`.

---

## 5. Próximos Pasos Operativos Antes de Fotografiar

1. **NO autorizar la producción de 190 fotografías nuevas de inmediato.**
2. **Fase 1: Recuperación de Activos Existentes (33 productos):** Realizar la revisión humana de los 33 candidatos locales (`asset-recovery-candidates.csv`) y los 15 objetos del bucket de Supabase para asociarlos mediante la interfaz existente (`/admin/catalog/product-management/[id]`) o script aprobado de mapeo.
3. **Fase 2: Sesión de Fotografía Focalizada (~142 productos):** Priorizar exclusivamente las categorías desprovistas de activos, iniciando por `CARNES X 500 GRAMOS` (45 productos faltantes) y presentaciones específicas de verduras y frutas.

