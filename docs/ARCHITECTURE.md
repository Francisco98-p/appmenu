# Arquitectura — MenuApp

## Visión general

MenuApp es una aplicación monolítica en producción: el backend Express sirve tanto la API REST como los archivos estáticos del frontend compilado (SPA). Todo el tráfico entra por Apache 2.4 (Windows host) que actúa como reverse proxy hacia el proceso Node.js corriendo en WSL2.

```mermaid
flowchart TD
    Cliente["Cliente (móvil/PC)"]
    Apache["Apache 2.4\n:80 (Windows host)\n179.41.8.247"]
    Node["Node.js / Express\n:3001 (WSL2)"]
    Static["Frontend dist/\n(archivos estáticos)"]
    API["API REST\n/api/*"]
    WS["Socket.io\n/socket.io/*"]
    DB["SQLite\ndev.db"]
    MP["Mercado Pago\nAPI externa"]

    Cliente -->|"HTTP :80"| Apache
    Apache -->|"ProxyPass /"| Node
    Apache -->|"ws:// WebSocket"| WS
    Node --> Static
    Node --> API
    Node --> WS
    API --> DB
    API -->|"create preference / webhook"| MP
```

---

## Estructura de carpetas

```
appmenu/
├── MenuApp-Frontend/src/
│   ├── api/           # Axios client (baseURL: /api)
│   ├── components/    # Componentes reutilizables
│   │   └── admin/     # TableGrid, StockTable, modales
│   ├── context/       # Zustand stores
│   ├── hooks/         # Custom hooks (useAdminOrders, useTableManager)
│   ├── pages/         # Vistas completas de la app
│   ├── types/         # Interfaces TypeScript compartidas
│   └── App.tsx        # BrowserRouter + rutas lazy
│
└── MenuApp-Backend/src/
    ├── controllers/   # Lógica de negocio por dominio
    ├── middleware/    # authenticateToken (JWT)
    ├── routes/        # api.ts — tabla de rutas
    ├── types/         # Extensión de express.Request
    └── index.ts       # Bootstrap: Express + Socket.io + static serving
```

---

## Capas de la aplicación

```mermaid
flowchart LR
    subgraph frontend [Frontend - Browser]
        Router["React Router\nApp.tsx"]
        Pages["Pages\n(Menu, Admin, Mozo...)"]
        Stores["Zustand Stores\n(authStore, cartStore)"]
        Hooks["Custom Hooks\n(useAdminOrders...)"]
        AxiosClient["Axios Client\n/api — con JWT interceptor"]
        SocketClient["Socket.io Client\nwindow.location.origin"]
    end

    subgraph backend [Backend - Node.js :3001]
        ExpressRouter["Express Router\n/api/*"]
        AuthMiddleware["Middleware\nauthenticateToken"]
        Controllers["Controllers\n(menu, admin, auth, payment)"]
        PrismaORM["Prisma ORM"]
        SocketServer["Socket.io Server"]
        StaticFiles["express.static\ndist/"]
    end

    subgraph data [Datos]
        SQLiteDB["SQLite\ndev.db"]
        MPApi["Mercado Pago\nAPI"]
    end

    Router --> Pages
    Pages --> Stores
    Pages --> Hooks
    Pages --> AxiosClient
    Pages --> SocketClient
    Hooks --> AxiosClient
    AxiosClient -->|"HTTP /api"| ExpressRouter
    SocketClient -->|"WebSocket"| SocketServer
    ExpressRouter --> AuthMiddleware
    AuthMiddleware --> Controllers
    Controllers --> PrismaORM
    Controllers --> SocketServer
    Controllers --> MPApi
    PrismaORM --> SQLiteDB
```

---

## Routing (Frontend)

| Path | Componente | Acceso |
|------|-----------|--------|
| `/` | `DemoLinks` | Público |
| `/demo` | `DemoLinks` | Público |
| `/m/:slug` | `Menu` | Público |
| `/success` | `PaymentSuccess` | Público |
| `/failure` | `PaymentFailure` | Público |
| `/pending` | `PaymentPending` | Público |
| `/status` | `OrderStatus` | Público |
| `/admin/login` | `Login` | Público |
| `/admin/dashboard` | `AdminDashboard` | Protegido (JWT) |
| `/mozo/dashboard` | `MozoDashboard` | Protegido (JWT) |
| `*` | Redirect `/` | — |

Todas las páginas se cargan con `React.lazy()` + `Suspense`. El componente `ProtectedRoute` redirige a `/admin/login` si no hay token en el store de auth.

---

## Socket.io — Event Map

El servidor no tiene handlers `socket.on` propios. Solo emite eventos desde los controllers cuando la base de datos cambia.

```mermaid
flowchart LR
    subgraph server [Backend - controllers]
        C1["placeOrder\nmenuController"]
        C2["updateOrderStatus\nadminController"]
        C3["updateOrderPaymentStatus\nadminController"]
    end

    subgraph events [Eventos emitidos con io.emit]
        E1["newOrder"]
        E2["orderStatusUpdated"]
        E3["orderPaymentUpdated"]
    end

    subgraph clients [Clientes suscritos]
        Admin["AdminDashboard\n(los 3 eventos)"]
        Mozo["MozoDashboard\n(los 3 eventos)"]
        Status["OrderStatus\n(orderStatusUpdated, orderPaymentUpdated)"]
    end

    C1 --> E1
    C2 --> E2
    C3 --> E3
    E1 --> Admin
    E1 --> Mozo
    E2 --> Admin
    E2 --> Mozo
    E2 --> Status
    E3 --> Admin
    E3 --> Mozo
    E3 --> Status
```

---

## Autenticación y seguridad

```mermaid
sequenceDiagram
    participant Browser
    participant LocalStorage
    participant AxiosInterceptor
    participant Backend

    Browser->>Backend: POST /api/auth/login {email, password}
    Backend-->>Browser: {token, user}
    Browser->>LocalStorage: Zustand persist → "menuapp-auth"

    Note over Browser,Backend: Peticiones subsiguientes

    Browser->>AxiosInterceptor: request()
    AxiosInterceptor->>LocalStorage: JSON.parse("menuapp-auth").state.token
    AxiosInterceptor->>Backend: Authorization: Bearer <token>
    Backend->>Backend: jwt.verify(token, JWT_SECRET)
    Backend-->>Browser: 200 / 401 / 403
```

El middleware `authenticateToken` adjunta `{ id, email, rol, localId }` a `req.user` para todos los controladores admin.

---

## Decisiones de diseño

### baseURL relativa (`/api`)
En lugar de `http://hostname:3001/api`, el cliente Axios usa `baseURL: '/api'`. Esto permite que Apache proxy el tráfico sin necesidad de configurar CORS por origen y hace que el frontend funcione en cualquier dominio sin recompilar.

### Frontend servido por Express
El backend compila y sirve `dist/` como archivos estáticos. Hay un fallback SPA (`app.get('*')`) que devuelve `index.html` para cualquier ruta no-API, permitiendo que React Router maneje la navegación del lado del cliente.

### Zustand persist
- `authStore`: persiste en `localStorage` (sobrevive al cierre del browser) bajo la clave `menuapp-auth`.
- `cartStore`: persiste en `sessionStorage` (se limpia al cerrar la pestaña) bajo `menuapp-cart`.

### WebSocket origin
La conexión Socket.io del frontend usa `io(window.location.origin)`. Esto funciona tanto en desarrollo (`localhost:5173` con proxy Vite) como en producción (a través del proxy Apache).

### tipoOrden en el pedido
El selector Salón/Retirar en el frontend envía `tipoOrden: 'salon' | 'retirar'` al crear el pedido. Cuando es `retirar`, el campo `mesa` se guarda como `'Retirar'` en la base de datos y no se pide selección de mesa al usuario.
