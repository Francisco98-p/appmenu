# Diagnóstico Completo del Código Base

**App**: QR-based Digital Menu (React + TypeScript + Vite + Express + Prisma)  
**Fecha**: 25 de Abril 2026  
**Auditores**: Senior Software Architect (x2 fuentes unificadas)

---

## Resumen Ejecutivo

El proyecto tiene una base sólida: buena elección de tecnologías (Zustand, React Router, Prisma, Socket.io), UI mobile-first bien ejecutada y separación de responsabilidades razonable en el backend. Sin embargo, existen **3 problemas críticos** que bloquean un deploy a producción: un leak de secreto en logs, el flujo de pagos incompleto (back_urls hardcodeadas, webhook sin persistencia, orden no creada antes del redirect), y falta total de tipado TypeScript en entidades de dominio. El `AdminDashboard.tsx` (963 líneas) es un God Component que concentra demasiada responsabilidad.

---

## 1. Arquitectura y Estructura

**Estado**: 🟡 Necesita atención

**Hallazgos**:
- Frontend: `src/pages/`, `src/context/`, `src/api/`, `src/App.tsx` — estructura razonable pero sin `hooks/` ni `types/`
- Backend: buena separación en `controllers/`, `routes/`, `middleware/`, `lib/`; sin embargo algunos controllers importan `prisma` desde `../index` (riesgo de dependencia circular) en lugar de `../lib/prisma`
- `context/` contiene stores Zustand, no React Context — naming incorrecto
- **God Component**: `AdminDashboard.tsx` con **963 líneas** combina gestión de pedidos, mesas, productos/stock, configuraciones de local, cocinas, WebSocket, 3 modals — todo en un archivo

**Recomendaciones**:
- Dividir `AdminDashboard.tsx` en sub-componentes (`TableGrid`, `TableDetailModal`, `StockTable`, `NewProductModal`, `KitchenModal`) y custom hooks (`useAdminOrders`, `useTableManager`)
- Crear `src/types/` para interfaces de dominio compartidas
- Renombrar `context/` → `stores/` o simplemente mover a `src/`
- Estandarizar todos los imports de backend a `../lib/prisma`

---

## 2. Gestión de Estado

**Estado**: 🟡 Necesita atención

**Hallazgos**:
- Usa **Zustand** para carrito (`cartStore.ts`) y autenticación (`authStore.ts`) — buena elección
- **El carrito NO persiste** entre sesiones (se pierde al refrescar la página)
- `authStore` hace `localStorage.getItem` manualmente en el inicializador en lugar de usar el middleware `persist` de Zustand
- No hay estado global de error/loading — cada componente gestiona el suyo
- `OrderStatus.tsx` muestra datos mock hardcodeados, sin conexión al estado real de pedidos

**Recomendaciones**:
- Agregar `persist` middleware de Zustand al `cartStore` usando `sessionStorage` (se limpia al cerrar la pestaña, apropiado para una visita al restaurante)
- Migrar `authStore` a `persist` middleware eliminando los `localStorage.getItem` manuales

---

## 3. Flujo de Pagos

**Estado**: 🔴 Problema Crítico

**Hallazgos**:
- `paymentController.ts:32` — **`back_urls` hardcodeadas a `localhost:5173`**: los pagos fallan silenciosamente en producción
- `paymentController.ts:6,20` — fallback de token MP hardcodeado: `'TEST-tu-access-token-aqui'`
- `routes/api.ts:41` — `POST /payment/create-preference` es **ruta pública sin autenticación**: cualquier actor puede crear preferencias de pago para cualquier local
- Webhook en `paymentController.ts:69-87` — **no actualiza ningún pedido en la DB**: solo hace log del evento, las confirmaciones de pago se pierden
- **El pedido no se crea antes del redirect a MP**: si el cliente no regresa (cierra la app, fallo de red), el carrito queda huérfano sin orden en DB
- No hay verificación de firma del webhook (`X-Signature`) — cualquiera puede enviar eventos falsos
- No hay clave de idempotencia para prevenir pedidos duplicados
- `PaymentSuccess.tsx` — no parsea el estado del pago desde parámetros URL; solo muestra mensaje de éxito sin verificar
- `PaymentSuccess.tsx` redirige a `/` (DemoLinks) en lugar de volver al menú del local

**Recomendaciones**:
1. Reemplazar `localhost` en `back_urls` con variable de entorno `BASE_URL`
2. Crear el pedido en estado `Pendiente` **antes** de redirigir a MP; pasar `orderId` como `external_reference`
3. Proteger `/payment/create-preference` con `authenticateToken`
4. Implementar el webhook para actualizar `pagoConfirmado = true` y `estado = Recibido` cuando `payment.status === 'approved'`
5. Agregar verificación de firma `X-Signature` en el webhook
6. Leer `/m/:slug` desde sessionStorage en `PaymentSuccess` para redirect correcto
7. Llamar `clearCart()` en el `useEffect` de `PaymentSuccess`

---

## 4. Flujo de Pedidos

**Estado**: 🟡 Necesita atención

**Hallazgos**:
- Ciclo de vida actual: ítem del menú → carrito → selección de mesa → pedido → notificación WebSocket → admin ve el pedido
- Para **MercadoPago**: el cliente es redirigido fuera sin que el pedido exista en DB. El webhook debería crearlo, pero no lo hace
- Para **Efectivo**: `confirmOrder()` crea el pedido correctamente; el carrito se limpia
- `aclaracion` (instrucciones especiales) existe en schema y API pero **no está expuesto en la UI del carrito**
- Mesa no se pre-carga desde el QR — el cliente debe seleccionarla manualmente
- `OrderStatus.tsx:15-26` — **datos mock hardcodeados**: completamente inutilizable para usuarios reales
- No hay UI optimista — el botón "Confirmar" bloquea durante la llamada API

**Recomendaciones**:
1. Crear pedido en estado `Pendiente` antes de redirigir a MP (ver sección 3)
2. Corregir `OrderStatus` para fetchear pedidos reales por `orderId` (guardado en sessionStorage)
3. Exponer el campo `aclaracion` en el cart modal
4. Soportar `?mesa=X` en la URL del QR para pre-seleccionar mesa

---

## 5. QR y Enrutamiento

**Estado**: 🟡 Necesita atención

**Hallazgos**:
- Patrón de ruta: `/m/:slug` — correcto
- Slugs inválidos retornan error con mensaje amigable — adecuado
- Ruta wildcard `App.tsx:46` hardcodeada a `/m/sanjuan-gourmet`: rompe cualquier otro tenant
- No hay generación de QR en el dashboard: el admin no puede producir códigos QR desde la app
- Los QR solo apuntan al menú, no pre-seleccionan mesa — genera fricción
- No hay mecanismo de expiración para QR codes

**Recomendaciones**:
- Cambiar wildcard a redirect a `/demo`
- Agregar pantalla de generación de QR en `AdminDashboard` usando `qrcode.react`
- Soportar `/m/:slug?mesa=X` para pre-selección de mesa desde el QR

---

## 6. Rendimiento

**Estado**: 🟡 Necesita atención

**Hallazgos**:
- **No hay lazy loading de rutas**: todas las páginas se importan eager en `App.tsx` — un solo bundle grande
- **`AdminDashboard.tsx:73`**: Socket.io listener + `setInterval` de 30 s activos simultáneamente — double refresh innecesario
- Imágenes de Unsplash sin parámetros de calidad/ancho ni `loading="lazy"`
- Sin caché para datos del menú — cada mount hace un fetch completo
- `total()` en cartStore es una función, no un valor derivado — se recomputa en cada render

**Recomendaciones**:
1. Agregar `React.lazy()` + `<Suspense>` para todas las rutas en `App.tsx`
2. Eliminar el `setInterval` cuando el socket está conectado; usarlo solo como fallback en desconexión
3. Agregar `?w=400&q=80` a las URLs de Unsplash y `loading="lazy"` a todos los `<img>`
4. Implementar caché `stale-while-revalidate` (React Query o SWR) para `/menu/:slug`

---

## 7. Uso de TypeScript

**Estado**: 🔴 Problema Crítico

**Hallazgos**:
- **Uso masivo de `any`** en todas las capas:
  - `Menu.tsx:9` — `local: any`
  - `Menu.tsx:123-129` — `filteredCategories` con todo `any`
  - `AdminDashboard.tsx:9-37` — `orders: any[]`, `products: any[]`, `categories: any[]`, `kitchens: any[]`, `allTables: any[]`, `localSettings: any`
  - `authStore.ts:7` — `local?: any`
  - `paymentController.ts:23` — `items: any`
  - `OrderStatus.tsx:6` — `orders: any[]`
- No existen tipos de entidades de dominio: `Local`, `Category`, `Product`, `Order`, `OrderItem` no están definidos como interfaces compartidas
- Tipos de respuestas API nunca declarados — todas las llamadas axios retornan `any`
- `(req as any).user` en todos los controllers backend — Express Request nunca extendido
- `interface User { local?: any }` en `authStore` — sin tipado en el objeto más usado

**Recomendaciones**:
1. Crear `src/types/index.ts` con: `Local`, `Category`, `Product`, `Order`, `OrderItem`, `CartItem`, `User`, `Kitchen`, `Table`
2. Extender `Express.Request` en `global.d.ts` backend, eliminar todos los casts `(req as any).user`
3. Tipar todos los `api.get<T>()` en frontend

---

## 8. UX y Mobile-First

**Estado**: 🟢 Bueno

**Hallazgos**:
- Targets táctiles grandes (botones 48px+)
- Layout responsive con Tailwind, enfoque mobile-first
- Estados de carga presentes (spinners en todas las rutas asíncronas)
- Estados de error con mensajes amigables al usuario
- Botón de carrito flotante en la parte inferior — correcto para acceso con pulgar
- Tema oscuro apropiado para ambiente de restaurante

**Recomendaciones**:
- Agregar skeleton loaders para mejor percepción de rendimiento
- `PaymentSuccess.tsx` redirige a `/` (DemoLinks) en lugar de volver al menú del local — corregir

---

## 9. Calidad y Mantenibilidad

**Estado**: 🟡 Necesita atención

**Hallazgos**:
- Código comentado / notas de desarrollo en `Menu.tsx:19` y `:121`
- Datos mock hardcodeados en `OrderStatus.tsx:19-26`
- `AdminDashboard.tsx` — 963 líneas, 20+ variables de estado, IIFEs inline en JSX para calcular stats de stock
- `alert()` y `window.confirm()` para todo el feedback de usuario en `AdminDashboard`
- Logs de debug en `auth.ts`, `menuController.ts`, `AdminDashboard.tsx` y socket handler
- Lógica de agrupamiento de pedidos por mesa duplicada

**Recomendaciones**:
1. Eliminar todo el código comentado y logs de debug
2. Reemplazar `alert()`/`confirm()` con estados de error inline o toast ligero (sonner)
3. Dividir `AdminDashboard` en sub-componentes (ver sección 1)

---

## 10. Seguridad

**Estado**: 🔴 Problema Crítico

**Hallazgos**:
- **`auth.ts:13`** — `console.log('Auth check - Secret:', process.env.JWT_SECRET)` — el secreto JWT se imprime en **cada request autenticado**: exposición en cualquier pipeline de logs
- `auth.ts:17` y `authController.ts:26` — fallback de JWT hardcodeado: `|| 'secret_key'` — trivialmente atacable
- `paymentController.ts:6,20` — fallback de token MP hardcodeado: `'TEST-tu-access-token-aqui'`
- CORS completamente abierto: `cors()` sin configuración en `index.ts:22`
- Webhook de MP sin verificación de firma `X-Signature`
- Archivo `.env` creado localmente — verificar que esté en `.gitignore` para no commitearlo
- Sin enforcement de HTTPS (depende de infraestructura, pero no hay redirect middleware)
- Sin validación/sanitización de inputs en endpoints de escritura

**Recomendaciones**:
1. **Eliminar `console.log` de `JWT_SECRET` en `auth.ts:13` — acción inmediata**
2. Eliminar todos los fallbacks hardcodeados — lanzar error al startup si falta la env var
3. Restringir CORS con `{ origin: process.env.FRONTEND_URL }`
4. Agregar `.env` a `.gitignore` si no está
5. Verificar firma `X-Signature` en webhook de MP
6. Agregar validación de requests con `zod`

---

# Lista de Corrección Prioritaria

| # | Problema | Sección | Impacto | Esfuerzo |
|---|----------|---------|---------|----------|
| 1 | `JWT_SECRET` logueado en consola en cada request | Seguridad | Crítico — credencial expuesta en logs | S |
| 2 | `back_urls` hardcodeadas a `localhost` — pagos MP rotos en producción | Pagos | Crítico — todos los pagos online fallan | S |
| 3 | Webhook no actualiza Order en DB — confirmaciones perdidas | Pagos | Crítico — ingresos/confianza del cliente | M |
| 4 | Carrito no persiste al recargar la página | Estado | Alto — el cliente pierde su pedido | S |
| 5 | God Component `AdminDashboard.tsx` (963 líneas) | Arquitectura | Medio — mantenibilidad y onboarding | L |

**Leyenda de esfuerzo**: S = Small (1-2 horas) · M = Medium (medio día) · L = Large (1-2 días)

---

*Diagnóstico unificado — 25 de Abril de 2026*
