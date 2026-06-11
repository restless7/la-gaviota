# 🦅 ECOSISTEMA DIGITAL LA GAVIOTA OS

## Documentación Técnica de Arquitectura Core (v1.0 Stable)

Esta plataforma es un sistema híbrido de comercio electrónico B2C/B2B y un balanceador logístico de inventarios frescos, construido sobre una arquitectura moderna basada en eventos e inmutabilidad de datos.

### 🛠️ Stack Tecnológico Unificado
- **Frontend / Backend Server-Side**: Next.js (App Router, v16+) con TypeScript Estricto.
- **Autenticación y Metadata de Roles**: Clerk Auth (Manejo de Tiers Empresariales mediante JWT y Server Hooks).
- **Base de Datos y Almacenamiento Relacional**: Supabase (PostgreSQL con extensiones en tiempo real) y Supabase Storage (Buckets Públicos).
- **Pasarela de Pagos**: Wompi API (Entorno de producción real activo, validado con firmas criptográficas SHA-256).

---

### 🏗️ 1. INFRAESTRUCTURA DE DATOS Y ESTADOS CORE

#### 📊 Esquema de Base de Datos (PostgreSQL / Supabase)
El sistema opera con tablas relacionales clave integradas de forma atómica:
- `products`: Contiene el catálogo general. Columnas críticas: `id` (UUID), `name`, `slug`, `category`, `subcategory` (TEXT), `cost_price`, `retail_price`, `distributor_price`, `wholesale_price`, `image_url`.
- `orders`: Registra los pedidos transaccionales. Columnas críticas: `id` (UUID), `total_amount`, `status`, `metadata`, `notes`.
- `b2b_credit_profiles`: Controla el cupo y balance de créditos asignados a comercios verificados.

⚠️ **Regla Crítica de Sincronización de Estados (Máquina de Estados Híbrida):**
La lógica interna del servidor habla estrictamente en inglés para la gestión de flujos logísticos (`PENDING_PAYMENT`, `PAID`, `SHIPPED`, `DELIVERED`).
La capa profunda de Postgres en la tabla `orders` implementa la restricción `orders_status_check`. Esta restricción valida strings históricos en español (`Pendiente`, `En Preparación`, `En Ruta`, `Entregado`, `Cancelado`). Los parches de aplicación mapean la inmutabilidad en inglés hacia las escrituras en español en la DB para prevenir violaciones de restricciones (23514 Check Violation).

---

### 🛡️ 2. BLUEPRINT DE SEGURIDAD Y ENRUTAMIENTO TRANSACCIONAL

#### 📡 Manejador de Webhooks Seguro (`app/api/webhooks/wompi/route.ts`)
El endpoint maestro de comunicación de la pasarela de pagos ha sido blindado contra tres vectores de vulnerabilidad identificados en auditoría defensiva:

**A. Enrutamiento Inteligente de Saldos (Prefijo `BAL_`)**
Si la propiedad `reference` enviada por el webhook de Wompi comienza con el prefijo `BAL_` (ej. `BAL_user123_17180634`), el sistema intercepta el hilo de ejecución antes de intentar un casting a UUID hacia la tabla de órdenes. Ejecuta un query semántico (`.ilike`) en la base de datos para cazar el `user_id` del cliente comercial e impacta directamente la tabla `b2b_credit_profiles`, deduciendo matemáticamente el abono al `credit_balance` en tiempo real. Finaliza retornando un 200 OK.

**B. Escudo de Protección Contra Explotación de Precios (CWE-602)**
Para evitar que un atacante manipule el DOM o las variables de entorno de cliente y altere el valor en centavos (`amount_in_cents`) en el widget de pago, el Webhook implementa una validación cruzada obligatoria:
- Al recibir un evento `transaction.updated` con estado `APPROVED`, se realiza una consulta de solo lectura a la tabla `orders` para recuperar el `total_amount` real calculado por el backend.
- Se ejecuta la ecuación de equivalencia monetaria: `Monto Pagado = transaction.amount_in_cents / 100`
- Si el monto real de la base de datos no es exactamente equivalente al monto pagado reportado por la pasarela, el sistema asume una Explotación de Precios (Fraude), muta la variable de estado a ERROR, cambia el estatus de la orden a `Cancelado` en Supabase e inyecta una nota de auditoría bloqueando la liberación de inventario. Retorna un 200 OK para mitigar ataques de denegación de servicio por reintentos de Wompi.

**C. Control de Idempotencia y Concurrencia (CWE-362)**
Para neutralizar duplicaciones de descuentos de stock y dobles sumas en las métricas de lealtad causadas por latencia de red y reintentos automáticos de la pasarela, se inyectó una barrera de cortocircuito al inicio del procesamiento:

```typescript
if (['PAID', 'SHIPPED', 'DELIVERED', 'En Preparación', 'En Ruta', 'Entregado'].includes(orderData.status)) {
  return NextResponse.json({ received: true }, { status: 200 });
}
```

---

### 📱 3. INTERFAZ DE USUARIO DE ALTA DENSIDAD Y NAVEGACIÓN STICKY

#### 🎨 Grilla de Productos de Alta Eficiencia (`src/components/store/ShopView.tsx` / `ProductCard.tsx`)
Para evitar el desperdicio de espacio vertical donde un solo producto acaparaba la pantalla de los smartphones, se rediseñó la UI bajo parámetros estrictos de densidad comercial:
- **Grid Layout Responsivo:** Implementación de clases dinámicas de Tailwind CSS para garantizar un control óptimo de las filas:
  - Móvil (`sm` / default): `grid-cols-2` estricto (dos productos simultáneos por pantalla).
  - Tablet / Desktop Base (`md` / `lg`): `grid-cols-3` y `grid-cols-4`.
  - Ultra Wide (`xl`): `grid-cols-5`.
- **Estandarización de Assets Visuales:** Las imágenes de los productos están contenidas en layouts con la propiedad `aspect-square w-full relative overflow-hidden` y renderizadas usando `object-cover`. Esto fuerza simetría perfecta en cuadros predecibles, eliminando saltos bruscos del DOM (Cumulative Layout Shift). Los textos usan un truncado estricto mediante `line-clamp-2` y tamaño `text-sm`.

#### 🗂️ Sticky Mobile Header y Menú Hamburguesa (`Header.tsx` o equivalente)
- **Fijación de Capa Superior:** El contenedor de navegación se encuentra anclado al inicio de la ventana del cliente utilizando: `sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100`. Ofrece un efecto traslúcido estilizado tipo cristal mientras el usuario escanea los productos.
- **Navegación Guiada por la URL (Deep Linking):** El botón de menú hamburguesa despliega un panel lateral interactivo (Slide-over Drawer) con la taxonomía multinivel de categorías del negocio. Al hacer clic en una categoría (ej: `Carnes`), el componente cierra el drawer y empuja el parámetro directamente a la URL: `/shop?category=CARNES`.
- **Escuchador Reactivo:** `ShopView.tsx` captura el cambio mediante `searchParams.get('category')` envuelto en un `<Suspense>` boundary (resolviendo la deuda técnica de Next.js CSR Bailout), filtra el catálogo de forma reactiva y reposiciona el viewport al origen mediante:

```typescript
window.scrollTo({ top: 0, behavior: 'smooth' });
```

---

### 🗃️ 4. MÓDULO ENTERPRISE DE PRODUCT MANAGEMENT (`/admin/catalog/*`)

El antiguo visor estático de inventario fue migrado en su totalidad a un ecosistema CRUD de grado administrativo unificado bajo la ruta física: `/app/admin/catalog/product-management`.

#### 📂 Taxonomía Multinivel B2B
El módulo soporta estructuras jerárquicas dinámicas parametrizadas en `src/constants/productConstants.ts` a través de un mapeo de tipo `Record<string, string[]>`. El formulario renderiza subcategorías en cascada condicional al estado de la categoría padre:
- **FRUTOS SECOS Y ESPECIAS** (Unificación de Condimentos y Frutos Secos).
- **CARNES X 500 GRAMOS** -> Habilita subcategorías selectores: `['CARNE DE CERDO', 'VÍSCERAS', 'PESCADO']`.
- **AROMÁTICAS Y HIERBAS X 125 GR**
- **KITS NEGOCIOS**

#### 📸 Integración Multimedia con Supabase Storage
La carga de archivos a través del área interactiva "Haga clic para subir una imagen" está completamente conectada al bucket público `product-images`:
- **Sanitización Dinámica de Nombres (Slugifier):** Al seleccionar un archivo binario (.png, .jpg), el sistema captura el nombre asignado al producto, remueve caracteres especiales y genera una firma única basada en unix timestamp (`products/tomate-chonto-17180630.jpg`), evitando colisiones de sobreescritura.
- **Asignación Atómica:** Al recibir confirmación del almacenamiento, recupera la URL pública nativa (`.getPublicUrl()`) y la acopla al payload que guardará la fila en la tabla de PostgreSQL.

#### 🗑️ Ciclo de Destrucción Limpia (Assets Cascading)
Para evitar que el bucket público acumule basura digital o archivos huérfanos que agoten la cuota de almacenamiento, la acción de eliminación de un producto ejecuta un flujo dual asíncrono y secuencial:
1. **Paso 1 (Storage Cleanup):** Descarga la dirección de la imagen registrada en la base de datos, extrae la ruta interna del objeto y dispara una orden de remoción estricta al storage: `supabase.storage.from('product-images').remove([path])`.
2. **Paso 2 (Database Purge):** Una vez confirmado el borrado físico del asset multimedia, el backend ejecuta la mutación relacional definitiva: `supabase.from('products').delete().eq('id', id)`.

---

### 🥾 5. CONTEXTO DE ARRANQUE PARA NUEVAS INSTANCIAS (BOOTSTRAP)

Si eres un sub-agente o una nueva instancia tomando el control del desarrollo, aquí tienes los frentes de trabajo inmediatos abiertos para continuar la expansión del sistema:
- **Dashboard Metrics (`app/admin/dashboard` / `src/actions/dashboard.ts`)**: Expanding financial analytics and loyalty program aggregations.
- **Checkout Flows (`app/checkout` / `src/actions/checkoutAction.ts`)**: Streamlining B2B credit checkouts and managing abandoned carts.
- **Partner Management (`src/components/portals/CustomerOrderHistory.tsx`)**: Upgrading B2B profile views.
- **Products API & Store (`src/actions/products.ts` & `src/components/store/*`)**: Catalog state management and synchronization.
