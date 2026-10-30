import os, csv, json

output_dir = 'docs/audit-evidence/2026-10-27'
os.makedirs(output_dir, exist_ok=True)

contact_sheet_content = """# La Gaviota — LG-MEDIA-R3: Visual Recovery & Contact Sheet
**Mission ID:** LG-MEDIA-R3  
**Date:** 2026-10-27  
**Governance:** APEX AI Solutions · Digital Asset Management  
**Status:** CURATION COMPLETED · ZERO WRITES / ZERO DELETIONS

---

## 1. Curaduría de los 33 Candidatos Locales de Recuperación

| # | Producto | ID | Categoría | Estado Actual en BD | Archivo Local Evaluado | Dimensiones | Veredicto de Curaduría | Acción Recomendada |
| :-: | :--- | :--- | :--- | :---: | :--- | :---: | :---: | :--- |
| 1 | **Aguacate choque** | `prd_0048` | FRUTAS | `LOW_QUALITY` | `public/PRODUCTS/download (2).jpeg` | 259×194 | `DUPLICATE` | Conservar original hasta sesión de estudio |
| 2 | **Aguacate criollo** | `prd_0047` | FRUTAS | `HEALTHY` | `public/PRODUCTS/KBBNQRM5ZNKHNMT2TCXNHI5U4A.jpg` | 500×375 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 3 | **Aguacate Hass** | `prd_0049` | FRUTAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_h3ukc8...` | 2528×1696 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 4 | **Aguacate papelillo**| `prd_0050` | FRUTAS | `LOW_QUALITY` | `public/PRODUCTS/download (3).jpeg` | 247×204 | `DUPLICATE` | Conservar original hasta sesión de estudio |
| 5 | **Arándanos** | `prd_0002` | FRUTAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_fc2r3o...` | 2528×1696 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 6 | **Badea** | `prd_0003` | FRUTAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_w3yxw1...` | 2528×1696 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 7 | **Ciruela** | `prd_0006` | FRUTAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_dkzlp5...` | 1264×848 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 8 | **Coco** | `prd_0007` | FRUTAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_k58dk6...` | 2528×1696 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 9 | **Durazno nacional** | `prd_0009` | FRUTAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_ganmpr...` | 2528×1696 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 10 | **Feijoa** | `prd_0010` | FRUTAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_fikte5...` | 2528×1696 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 11 | **Fresa grande** | `prd_0011` | FRUTAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_rpdg9p...` | 2528×1696 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 12 | **Fresa jumbo** | `prd_0012` | FRUTAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_18qtrg...` | 1264×848 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 13 | **Fresa pequeña** | `prd_0013` | FRUTAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_qrsrz0...` | 1264×848 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 14 | **Granadilla** | `prd_0014` | FRUTAS | `HEALTHY` | `public/PRODUCTS/ChatGPT Image May 12, 2026...` | 1531×1027 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 15 | **Guanábana** | `prd_0015` | FRUTAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_9u7krx...` | 1264×848 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 16 | **Guayaba** | `prd_0016` | FRUTAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_18ats9...` | 1264×848 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 17 | **Kiwi** | `prd_0017` | FRUTAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_f77au1...` | 1264×848 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 18 | **Manzana roja** | `prd_0022` | FRUTAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_mtc5vl...` | 1264×848 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 19 | **Manzana verde** | `prd_0023` | FRUTAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_81puzn...` | 1264×848 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 20 | **Guanábana (Pulpa)**| `prd_0134` | PULPAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_9u7krx...` | 1264×848 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 21 | **Guayaba (Pulpa)** | `prd_0135` | PULPAS | `MISSING` | `public/PRODUCTS/Gemini_Generated_Image_18ats9...` | 1264×848 | `WRONG_MATCH` | **Rechazar**: Fruta entera no representa pulpa |
| 22 | **Lenteja remojada**| `prd_0149` | VARIOS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_fj18me...` | 1264×848 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 23 | **Acelga** | `prd_0051` | VERDURAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_pund0l...` | 2528×1696 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 24 | **Ahuyama** | `prd_0052` | VERDURAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_6o430d...` | 2528×1696 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 25 | **Ajo blanco** | `prd_0054` | VERDURAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_z9rhl9...` | 2528×1696 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 26 | **Ajo criollo** | `prd_0055` | VERDURAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_iqigl1...` | 2528×1696 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 27 | **Apio rama mata** | `prd_0057` | VERDURAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_9q1p35...` | 2528×1696 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 28 | **Apio rama x3** | `prd_0056` | VERDURAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_sec8rp...` | 2528×1696 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 29 | **Berenjena blanca**| `prd_0061` | VERDURAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_n19mlo...` | 2528×1696 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 30 | **Berenjena morada**| `prd_0062` | VERDURAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_9wt3g6...` | 2528×1696 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 31 | **Cebolla blanca** | `prd_0068` | VERDURAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_y3henv...` | 2528×1696 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 32 | **Cebolla puerro** | `prd_0071` | VERDURAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_l6rork...` | 2528×1696 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |
| 33 | **Cebolla roja** | `prd_0069` | VERDURAS | `HEALTHY` | `public/PRODUCTS/Gemini_Generated_Image_d3pcwi...` | 2528×1696 | `DUPLICATE` | Conservar foto activa en Supabase (200 OK) |

---

## 2. Investigación de los 15 Objetos no Mapeados de Supabase Storage

| Objeto en Bucket `product-images` | Tamaño | Tipo | Producto Vinculado | Estado del Producto | Diagnóstico Forense |
| :--- | :---: | :---: | :--- | :---: | :--- |
| `acelga-1782948870728.png` | 7.1 MB | `image/png` | `prd_0051` Acelga | `HEALTHY` | Versión anterior subida 20 segundos antes |
| `ahuyama-1782949443784.webp` | 53 KB | `image/webp` | `prd_0052` Ahuyama | `HEALTHY` | Variante WebP previa |
| `ahuyamn-1782949511275.png` | 6.6 MB | `image/png` | `prd_0052` Ahuyama | `HEALTHY` | Intento de subida previo con error tipográfico |
| `aj-botella-1782960987262.jpeg` | 227 KB | `image/jpeg` | `prd_0152` Ají botella | `HEALTHY` | Predecesor inmediato (subido 6 segundos antes) |
| `ajonjol-1782961821752.jpeg` | 15.8 KB | `image/jpeg` | `prd_0233` Ajonjolí | `HEALTHY` | Predecesor inmediato (subido 9 segundos antes) |
| `apio-arracacha-1782951938011.jpeg`| 24 KB | `image/jpeg` | `prd_0058` Apio arracacha | `HEALTHY` | Predecesor inmediato (subido 4 segundos antes) |
| `arveja-desgranada-1782961355739.jpeg`| 18 KB| `image/jpeg` | `prd_0059` Arveja desgranada | `HEALTHY` | Predecesor inmediato (subido 7 segundos antes) |
| `arveja-remojada-x250g-1782962099907.jpg`| 82 KB| `image/jpeg`| `prd_0148` Arveja remojada | `HEALTHY` | Predecesor inmediato (subido 14 segundos antes) |
| `coco-1782951067598.png` | 7.5 MB | `image/png` | `prd_0007` Coco | `HEALTHY` | Predecesor inmediato (subido 93 segundos antes) |
| `coco-acaramelado-1782959075027.webp` | 42 KB | `image/webp` | `prd_0234` Coco acaramelado | `HEALTHY` | Predecesor inmediato (subido 52 segundos antes) |
| `fresa-pequea-1782951274565.png` | 1.8 MB | `image/png` | `prd_0013` Fresa pequeña | `HEALTHY` | Predecesor inmediato (subido 33 segundos antes) |
| `lechuga-batavia-1782957042335.jpeg`| 4.0 KB | `image/jpeg` | `prd_0085` Lechuga batavia | `LOW_QUALITY` | Mismo archivo de baja resolución duplicado |
| `limn-mandarina-1782951612770.jpeg` | 17 KB | `image/jpeg` | `prd_0020` Limón mandarina | `HEALTHY` | Predecesor inmediato (subido 12 segundos antes) |
| `morcillasrellenas-1781150619699.png`| 6.7 MB | `image/png` | `prd_0164` Morcillas/rellenas | `HEALTHY` | Predecesor inmediato (subido 67 segundos antes) |
| `zanahoria-1782951763414.jpeg` | 9.8 KB | `image/jpeg` | `prd_0127` Zanahoria | `HEALTHY` | Predecesor inmediato |

**Conclusión:** 0 productos faltantes se benefician de estos 15 objetos. Todos son respaldos históricos o dobles clics de subida en el panel de administración. Se conservan intactos en el bucket.

---

## 3. Revisión de las 4 Imágenes de Baja Resolución

| ID | Producto | Categoría | Dimensiones Actuales | Tamaño | Candidato Superior Disponible | Acción Recomendada |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `prd_0048` | **Aguacate choque** | FRUTAS | 259×194 px | 10.6 KB | Ninguno (local es idéntico) | Preservar actual; fotografiar en estudio |
| `prd_0050` | **Aguacate papelillo**| FRUTAS | 247×204 px | 11.5 KB | Ninguno (local es idéntico) | Preservar actual; fotografiar en estudio |
| `prd_0063` | **Brócoli** | VERDURAS | 500×375 px | 31.5 KB | Ninguno | Preservar actual; fotografiar en estudio |
| `prd_0085` | **Lechuga batavia** | VERDURAS | 195×259 px | 4.0 KB | Ninguno (bucket es idéntico) | Preservar actual; fotografiar en estudio |
"""

with open(f'{output_dir}/visual-recovery-contact-sheet.md', 'w', encoding='utf-8') as f:
    f.write(contact_sheet_content)

print('Generated visual-recovery-contact-sheet.md successfully.')
