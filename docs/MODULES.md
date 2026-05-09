# Módulos — MenuApp

Descripción detallada de cada módulo de la aplicación, tanto frontend como backend.

---

## Frontend

### Estructura de archivos

```
MenuApp-Frontend/src/
├── App.tsx
├── api/
│   └── axios.ts
├── context/
│   ├── authStore.ts
│   └── cartStore.ts
├── hooks/
│   ├── useAdminOrders.ts
│   └── useTableManager.ts
├── pages/
│   ├── DemoLinks.tsx
│   ├── Menu.tsx
│   ├── Login.tsx
│   ├── AdminDashboard.tsx
│   ├── MozoDashboard.tsx
│   ├── OrderStatus.tsx
│   ├── PaymentSuccess.tsx
│   ├── PaymentFailure.tsx
│   └── PaymentPending.tsx
├── components/
│   └── admin/
│       ├── TableGrid.tsx
│       ├── TableDetailModal.tsx
│       ├── StockTable.tsx
│       ├── NewProductModal.tsx
│       └── KitchenModal.tsx
└── types/
    └── index.ts
```

---

### `App.tsx` — Router principal

Configura `BrowserRouter`, carga lazy todas las páginas con `React.lazy`, y envuelve todo en `Suspense`. Define el componente `ProtectedRoute` que requiere token JWT.

**Rutas definidas:**

| Path | Componente | Protegida |
|------|-----------|:---------:|
| `/` y `/demo` | `DemoLinks` | No |
| `/m/:slug` | `Menu` | No |
| `/success` | `PaymentSuccess` | No |
| `/failure` | `PaymentFailure` | No |
| `/pending` | `PaymentPending` | No |
| `/status` | `OrderStatus` | No |
| `/admin/login` | `Login` | No |
| `/admin/dashboard` | `AdminDashboard` | **Sí** |
| `/mozo/dashboard` | `MozoDashboard` | **Sí** |
| `*` | Redirect `/` | — |

---

### `api/axios.ts` — Cliente HTTP

Instancia de Axios configurada para la aplicación.

```typescript
const api = axios.create({ baseURL: '/api' });
```

**Request interceptor:**
- Lee `localStorage['menuapp-auth']`
- Parsea el JSON del store Zustand: `parsed.state.token`
- Si existe token, agrega `Authorization: Bearer <token>` a cada request

**Response interceptor:**
- En respuestas `401` o `403`: elimina `menuapp-auth` de localStorage y redirige a `/admin/login`

---

### `context/authStore.ts` — Store de autenticación

Store Zustand con persistencia en `localStorage`.

**Estado:**
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
}
```

**Acciones:**
- `login(user, token)` — guarda usuario y token
- `logout()` — limpia el estado

**Persistencia:** `localStorage`, clave `menuapp-auth`.  
El interceptor de Axios lee directamente de esta clave para evitar dependencia circular.

---

### `context/cartStore.ts` — Store del carrito

Store Zustand con persistencia en `sessionStorage`.

**Estado:**
```typescript
interface CartState {
  items: CartItem[];
}
```

**Acciones:**
- `addItem(item)` — agrega o incrementa cantidad si el producto ya existe
- `removeItem(productId)` — decrementa o elimina si cantidad llega a 0
- `clearCart()` — vacía el carrito completo
- `total()` — computed: suma de `precio × cantidad` de todos los items

**Persistencia:** `sessionStorage`, clave `menuapp-cart`. Se limpia al cerrar la pestaña.

---

### `types/index.ts` — Interfaces TypeScript

Tipos compartidos por toda la aplicación.

| Interfaz | Descripción |
|---------|-------------|
| `Kitchen` | `{ id, nombre, localId }` |
| `Table` | `{ id, numero, localId }` |
| `Product` | Producto completo con `categoria?` y `kitchen?` |
| `Category` | `{ id, localId, nombre, orden, productos }` |
| `Local` | Local con `categorias`, `mesas`, `horarioApertura?`, `horarioCierre?` |
| `LocalSettings` | Subconjunto de `Local` para formulario de config |
| `User` | `{ id, email, rol, local? }` |
| `OrderItem` | Item de pedido con `producto` embebido |
| `Order` | Pedido completo con `items` y `tipoOrden?` |
| `CartItem` | Item en el carrito del cliente |
| `PaymentMethod` | `'Efectivo' \| 'MercadoPago'` |

---

### Pages

---

#### `DemoLinks.tsx` — Landing / Demo

Página de inicio con tres tarjetas de acceso rápido:
- "Vista Cliente" → `/m/chilligarden`
- "Admin Dashboard" → `/admin/login`
- "Panel Mozo" → `/mozo/dashboard`

Sin estado local. Puramente presentacional.

---

#### `Menu.tsx` — Menú público del cliente

La página principal de la experiencia del cliente. Se accede via `/m/:slug`.

**Estado local:**
| Variable | Tipo | Descripción |
|---------|------|-------------|
| `local` | `any` | Datos del local cargados de la API |
| `loading` | `boolean` | Estado de carga |
| `error` | `string` | Mensaje de error si falla la carga |
| `searchTerm` | `string` | Filtro de búsqueda de productos |
| `selectedCategory` | `number \| null` | Tab activo en el nav de categorías |
| `isCartOpen` | `boolean` | Visibilidad del modal del carrito |
| `selectedTableNum` | `string` | Mesa seleccionada |
| `isOrderSuccess` | `boolean` | Pantalla de éxito post-pedido |
| `lastOrderId` | `number \| null` | ID del último pedido para el link de tracking |
| `placingOrder` | `boolean` | Loading del botón confirmar |
| `paymentMethod` | `'Efectivo' \| 'MercadoPago'` | Método de pago seleccionado |
| `tipoOrden` | `'salon' \| 'retirar'` | Tipo de servicio |

**Stores usados:** `useCartStore` (items, addItem, removeItem, total, clearCart)

**API calls:**
- `GET /menu/${slug}` — carga el menú
- `POST /payment/create-preference` — inicia pago MP
- `POST /orders` — crea pedido (efectivo o cuando MP falla)

**Flujo de negocio:**
1. Carga el menú al montar
2. Cliente filtra por categoría o búsqueda
3. Agrega items al carrito
4. Elige Salón/Retirar (tabs en el header)
5. En el carrito: confirma mesa, método de pago
6. Si Efectivo → `POST /orders` directo
7. Si MercadoPago → `POST /payment/create-preference` → redirect a MP

---

#### `Login.tsx` — Autenticación

Formulario simple de email y password. Al autenticar exitosamente, guarda el token en `authStore` y navega al dashboard según el rol del usuario.

**API call:** `POST /auth/login`

---

#### `AdminDashboard.tsx` — Panel de administración

Página principal para el dueño o encargado del local. Tiene tres pestañas:

**Pestaña "Salón"** — Gestión de pedidos
- Vista de mesas activas en tiempo real
- Modal de detalle por mesa: items, estado, pago
- Acciones: cambiar estado, marcar pago, cerrar mesa

**Pestaña "Stock"** — Gestión de productos
- Lista de productos con filtro por categoría y cocina
- Actualización de stock inline
- Crear nuevo producto (modal)
- Gestionar cocinas (modal)

**Pestaña "Config"** — Configuración del local
- Mesas: agregar/eliminar
- Datos del local: nombre, logo, CBU/alias, link MP

**Socket.io:** escucha `newOrder`, `orderStatusUpdated`, `orderPaymentUpdated` desde `window.location.origin`.  
**Polling fallback:** refresca pedidos cada 30 segundos si el socket se desconecta.

**API calls:** `GET /admin/orders`, `GET /admin/tables`, `GET /admin/local`, `GET /admin/categories`, `GET /admin/kitchens`, `GET /admin/products`, y los respectivos PUT/POST/DELETE.

---

#### `MozoDashboard.tsx` — Panel del mozo

Vista simplificada para el personal de sala.

- Grid de mesas con estado visual por colores
- Filtro de búsqueda de mesas
- Modal de detalle de mesa con pedidos activos
- Botón "Tomar pedido" que abre el menú del cliente con `?mesa=X&mozo=true`
- Al entrar con `mozo=true`, la selección de mesa en el menú está bloqueada a la mesa del parámetro

**Socket.io:** escucha los 3 eventos. Filtra pedidos con `estado === 'Cobrado'` (no los muestra).

---

#### `OrderStatus.tsx` — Tracking del pedido

Muestra el estado del pedido en tiempo real. El cliente llega aquí después de confirmar un pedido en efectivo.

**Estado:** `order` cargado de `GET /orders/:id`  
**Socket.io:** escucha `orderStatusUpdated` y `orderPaymentUpdated`, actualiza el estado si el `id` coincide.

Muestra una línea de tiempo visual con el progreso del pedido.

---

#### `PaymentSuccess.tsx` / `PaymentFailure.tsx` / `PaymentPending.tsx`

Páginas de retorno de Mercado Pago.

- **Success:** Lee `external_reference` de los query params (contiene el `orderId`), llama a `clearCart()`, muestra mensaje de éxito con link al tracking.
- **Failure:** Mensaje de error con botón para volver al menú.
- **Pending:** Mensaje de pago pendiente con instrucciones.

---

### Custom Hooks

---

#### `hooks/useAdminOrders.ts`

Encapsula la lógica de pedidos para el panel admin.

**Estado:** `orders`, `loading`, `socketConnected` (ref)

**Returns:**
- `fetchOrders()` — `GET /admin/orders`
- `updateStatus(orderId, estado)` — `PUT /admin/orders/:id/status`
- `togglePayment(orderId, current)` — `PUT /admin/orders/:id/payment`
- `closeTable(tableMesa, tableOrders)` — marca todos los pedidos de la mesa como `Cobrado`

Socket.io: suscribe a `newOrder` y usa polling cada 30s cuando el socket está desconectado.

> Nota: Este hook no está actualmente importado en `AdminDashboard.tsx` (la lógica está inlineada). Está disponible para una futura refactorización.

---

#### `hooks/useTableManager.ts`

Encapsula las operaciones CRUD de mesas.

**Estado:** `allTables: Table[]`

**Returns:**
- `fetchTables()` — `GET /admin/tables`
- `addTable(numero)` — `POST /admin/tables`
- `deleteTable(id)` — `DELETE /admin/tables/:id`

> Nota: Al igual que `useAdminOrders`, no está actualmente importado en producción.

---

### Componentes Admin (`components/admin/`)

Componentes extraídos como preparación para una futura refactorización de `AdminDashboard.tsx`.

| Componente | Props principales | Descripción |
|-----------|-------------------|-------------|
| `TableGrid` | `tableList`, `onSelect` | Grid de mesas con estado visual |
| `TableDetailModal` | `selectedTable`, `tableData`, callbacks | Modal con pedidos de una mesa |
| `StockTable` | `products`, `kitchens`, callbacks | Tabla de stock con filtros |
| `NewProductModal` | `form`, `categories`, `kitchens`, callbacks | Formulario de nuevo producto |
| `KitchenModal` | `kitchens`, `onAdd`, `onDelete`, `onClose` | CRUD de cocinas |

---

## Backend

### Estructura de archivos

```
MenuApp-Backend/src/
├── index.ts             # Bootstrap del servidor
├── controllers/
│   ├── authController.ts
│   ├── menuController.ts
│   ├── adminController.ts
│   ├── kitchenController.ts
│   ├── tableController.ts
│   └── paymentController.ts
├── middleware/
│   └── auth.ts          # authenticateToken
├── routes/
│   └── api.ts           # Tabla de rutas
├── types/
│   └── express.d.ts     # Extensión de express.Request
└── lib/
    └── prisma.ts        # Singleton PrismaClient
```

---

### `index.ts` — Bootstrap del servidor

Punto de entrada de la aplicación. Responsabilidades:

1. Carga variables de entorno (`dotenv.config()`)
2. Crea la app Express y el servidor HTTP
3. Inicializa Socket.io con CORS configurado
4. Aplica middlewares: CORS, `express.json()`
5. Monta las rutas de la API en `/api`
6. Sirve los archivos estáticos del frontend (`dist/`)
7. Define el fallback SPA para React Router
8. Inicia el servidor en el puerto configurado

**Exports:** `io` (instancia Socket.io), `prisma` (instancia Prisma)

---

### `middleware/auth.ts` — Autenticación JWT

Middleware `authenticateToken` aplicado a todas las rutas `/admin/*`.

**Flujo:**
1. Lee el header `Authorization`
2. Extrae el token del formato `Bearer <token>`
3. Sin token → `401 Access denied`
4. Token inválido/expirado → `403 Invalid token`
5. Token válido → adjunta `req.user = { id, email, rol, localId }` y llama `next()`

El tipo de `req.user` está declarado en `types/express.d.ts`:

```typescript
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email: string; rol: string; localId: number; };
    }
  }
}
```

---

### `controllers/authController.ts`

**`login`** — `POST /api/auth/login`

1. Busca el usuario por email (incluye `local`)
2. `bcrypt.compare(password, user.password)`
3. Firma un JWT con `{ id, email, rol, localId }`, vigencia 1 día
4. Devuelve `{ token, user }`

---

### `controllers/menuController.ts`

**`getMenuBySlug`** — `GET /api/menu/:slug`

Consulta Prisma con includes: `categorias` (ordenadas por `orden` asc) con `productos` activos, y `mesas`. Los campos `horarioApertura` y `horarioCierre` se devuelven automáticamente como parte del modelo `Local`.

**`placeOrder`** — `POST /api/orders`

1. Verifica que existan el local y cada producto del pedido
2. Crea `Order` con `OrderItem`s anidados en una sola transacción Prisma
3. Emite `io.emit('newOrder', order)` para notificar en tiempo real
4. Devuelve el pedido creado con items e información del producto

**`getOrderById`** — `GET /api/orders/:id`

Devuelve un objeto simplificado del pedido: `{ id, mesa, estado, pagoConfirmado, total, metodoPago, createdAt, items[] }`.

---

### `controllers/adminController.ts`

Todos los métodos usan `req.user.localId` para filtrar datos por local.

| Método | Descripción |
|--------|-------------|
| `getOrders` | Pedidos del local, newest first, con items y productos |
| `updateOrderStatus` | Actualiza `estado`; emite `orderStatusUpdated` |
| `updateOrderPaymentStatus` | Actualiza `pagoConfirmado`; emite `orderPaymentUpdated` |
| `getCategories` | Categorías del local ordenadas por `orden` |
| `getAdminProducts` | Productos del local con `categoria` y `kitchen` |
| `createProduct` | Crea nuevo producto; parsea precio y stock como números |
| `updateProductStock` | Actualiza solo el campo `stock` |
| `getLocalSettings` | Config del local (`nombre`, `logo`, `slug`, `cbuAlias`, `mercadoPagoLink`) |
| `updateLocalSettings` | Actualiza esos campos por `localId` |

---

### `controllers/kitchenController.ts`

CRUD de cocinas para el local del usuario autenticado.

- `getKitchens` — lista cocinas del `localId`
- `createKitchen` — crea cocina con nombre
- `deleteKitchen` — elimina por `id`

---

### `controllers/tableController.ts`

CRUD de mesas. Usa `getRealLocalId(req)`: busca el usuario por email en la DB para obtener el `localId` actual (más robusto que confiar solo en el JWT que podría estar desactualizado).

- `getTables` — lista mesas ordenadas por `numero`
- `createTable` — crea mesa con `numero`
- `deleteTable` — elimina por `id`

---

### `controllers/paymentController.ts`

**`createPreference`** — integración con Mercado Pago SDK

1. Verifica que exista `MP_ACCESS_TOKEN`
2. Busca el `Local` para obtener el slug
3. Crea preferencia con `items`, `back_urls` (usando `BASE_URL`), `auto_return: 'approved'`
4. Incluye `orderId` en `external_reference` para correlacionar el webhook

**`webhook`** — procesa notificaciones de MP

1. Solo actúa si `type === 'payment'`
2. Consulta la API de MP para obtener el estado del pago
3. Si `approved`: actualiza el pedido en DB (`pagoConfirmado: true`, `estado: 'Recibido'`)
4. Siempre responde `200` a MP (para que no reintente)

---

### `lib/prisma.ts` — Singleton Prisma

```typescript
const prisma = new PrismaClient();
export default prisma;
```

Exportado e importado en `index.ts`, luego re-exportado para que los controllers lo usen desde `'../index'`.

---

### `routes/api.ts` — Tabla de rutas

Archivo central que conecta cada path con su controller y aplica el middleware de auth cuando corresponde.

Ver referencia completa en [API.md](API.md).
