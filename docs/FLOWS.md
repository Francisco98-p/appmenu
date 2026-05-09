# Diagramas de Flujo — MenuApp

---

## 1. Flujo completo del cliente

Desde que escanea el QR hasta que confirma el pedido.

```mermaid
flowchart TD
    QR["Escanea QR\n/m/chilligarden"]
    Load["GET /api/menu/chilligarden"]
    Display["Muestra menú\ncategorías + productos compactos"]
    Browse["Navega y busca productos"]
    AddCart["Agrega items al carrito\n(cartStore - sessionStorage)"]
    OpenCart["Abre carrito\n(botón flotante)"]

    subgraph tipoOrden [Selecciona tipo de orden]
        Salon["Salón\n→ elige mesa"]
        Retirar["Retirar\n→ mesa = 'Retirar'"]
    end

    subgraph metodoPago [Selecciona método de pago]
        Efectivo["Efectivo"]
        MP["Mercado Pago"]
    end

    Confirm["CONFIRMAR PEDIDO"]

    subgraph pagoEfectivo [Pago en efectivo]
        PostOrder["POST /api/orders\n{tipoOrden, mesa, items...}"]
        OrderCreated["Pedido creado\nestado: 'Recibido'"]
        Success["Pantalla de éxito\n¡Pedido Enviado!"]
        Track["Ver estado\n/status?orderId=X"]
    end

    subgraph pagoMP [Mercado Pago]
        MPFlow["→ Ver Flujo MP"]
    end

    QR --> Load --> Display --> Browse --> AddCart --> OpenCart
    OpenCart --> tipoOrden
    Salon --> metodoPago
    Retirar --> metodoPago
    Efectivo --> Confirm
    MP --> Confirm
    Confirm -->|"Efectivo"| PostOrder
    Confirm -->|"MercadoPago"| MPFlow
    PostOrder --> OrderCreated --> Success --> Track
```

---

## 2. Flujo de pago con Mercado Pago

```mermaid
sequenceDiagram
    participant Cliente as Cliente (Browser)
    participant Frontend
    participant Backend
    participant MPApi as Mercado Pago API
    participant DB as SQLite

    Cliente->>Frontend: Confirmar pedido (MercadoPago)
    Frontend->>Backend: POST /api/payment/create-preference\n{items, localId, orderId?}
    Backend->>MPApi: Crear preferencia de pago
    MPApi-->>Backend: {preferenceId, initPoint}
    Backend-->>Frontend: {preferenceId, initPoint}
    Frontend->>Cliente: Redirect → initPoint (MP checkout)

    Note over Cliente,MPApi: El cliente completa el pago en Mercado Pago

    alt Pago aprobado
        MPApi->>Backend: POST /api/payment/webhook\n{type: "payment", data.id}
        Backend->>MPApi: GET payment/{id}
        MPApi-->>Backend: {status: "approved", external_reference: orderId}
        Backend->>DB: Order.update({pagoConfirmado: true, estado: "Recibido"})
        MPApi->>Cliente: Redirect → /success?external_reference=orderId
        Cliente->>Frontend: /success
        Frontend->>Frontend: clearCart()
        Frontend->>Cliente: Muestra éxito + link a tracking
    else Pago fallido
        MPApi->>Cliente: Redirect → /failure
    else Pago pendiente
        MPApi->>Cliente: Redirect → /pending
    end
```

---

## 3. Flujo de autenticación JWT

```mermaid
sequenceDiagram
    participant Browser
    participant AxiosInterceptor as Axios Interceptor
    participant AuthStore as Zustand authStore\n(localStorage)
    participant Backend

    Browser->>Backend: POST /api/auth/login {email, password}
    Backend->>Backend: bcrypt.compare(password, hash)
    Backend->>Backend: jwt.sign({id, email, rol, localId})
    Backend-->>Browser: {token, user}
    Browser->>AuthStore: login(user, token)
    AuthStore->>AuthStore: persist → localStorage["menuapp-auth"]

    Note over Browser,Backend: Peticiones a rutas protegidas

    Browser->>AxiosInterceptor: cualquier request a /api/admin/*
    AxiosInterceptor->>AuthStore: JSON.parse(localStorage["menuapp-auth"]).state.token
    AxiosInterceptor->>Backend: Authorization: Bearer <token>
    Backend->>Backend: jwt.verify(token, JWT_SECRET)
    Backend->>Backend: req.user = {id, email, rol, localId}
    Backend-->>Browser: 200 + datos

    Note over Browser,Backend: Token expirado o inválido

    Backend-->>AxiosInterceptor: 401 o 403
    AxiosInterceptor->>AuthStore: remove("menuapp-auth")
    AxiosInterceptor->>Browser: redirect → /admin/login
```

---

## 4. Flujo del panel Admin — gestión de pedidos en tiempo real

```mermaid
sequenceDiagram
    participant Admin as Admin (Dashboard)
    participant SocketClient as Socket.io Client
    participant Backend
    participant DB as SQLite
    participant Mozo as Mozo (Dashboard)
    participant Customer as Cliente (OrderStatus)

    Admin->>Backend: GET /api/admin/orders (carga inicial)
    Backend-->>Admin: Array de pedidos

    Admin->>SocketClient: io(window.location.origin)
    Mozo->>SocketClient: io(window.location.origin)
    Customer->>SocketClient: io(window.location.origin)

    Note over Admin,Customer: Nuevo pedido llega

    Note over Backend: POST /api/orders ejecutado por cliente
    Backend->>DB: prisma.order.create(...)
    Backend->>SocketClient: io.emit("newOrder", order)
    SocketClient-->>Admin: event "newOrder" → agrega a lista
    SocketClient-->>Mozo: event "newOrder" → agrega a lista

    Note over Admin,Customer: Admin actualiza estado

    Admin->>Backend: PUT /api/admin/orders/:id/status {estado: "En preparación"}
    Backend->>DB: prisma.order.update(...)
    Backend->>SocketClient: io.emit("orderStatusUpdated", order)
    SocketClient-->>Admin: actualiza estado en UI
    SocketClient-->>Mozo: actualiza estado en UI
    SocketClient-->>Customer: actualiza estado en tracking

    Note over Admin,Customer: Admin confirma pago

    Admin->>Backend: PUT /api/admin/orders/:id/payment {pagoConfirmado: true}
    Backend->>DB: prisma.order.update(...)
    Backend->>SocketClient: io.emit("orderPaymentUpdated", order)
    SocketClient-->>Admin: actualiza badge de pago
    SocketClient-->>Mozo: actualiza badge de pago
    SocketClient-->>Customer: actualiza badge de pago en tracking
```

---

## 5. Ciclo de vida de un pedido

```mermaid
stateDiagram-v2
    [*] --> Recibido : POST /orders (cliente confirma)
    Recibido --> EnPreparacion : Admin actualiza estado
    EnPreparacion --> Listo : Cocina avisa que está listo
    Listo --> Entregado : Mozo entrega en la mesa
    Entregado --> Cobrado : Admin cierra la mesa

    Recibido --> Recibido : webhook MP → pagoConfirmado=true

    note right of Recibido
        estado inicial
        pagoConfirmado puede cambiar
        vía webhook de MP
    end note

    note right of Cobrado
        estado final
        Mozo lo filtra de su vista
    end note
```

---

## 6. Flujo de carga inicial de la app (SPA)

```mermaid
flowchart TD
    Browser["Browser solicita /m/chilligarden"]
    Apache["Apache :80\nrecibe la request"]
    Proxy["ProxyPass → Node.js :3001"]
    Express["Express\n¿coincide /api/*?"]
    Static["express.static dist/\n¿existe el archivo?"]
    Fallback["SPA Fallback\nenvía dist/index.html"]
    ReactBoot["React se monta\nBrowserRouter"]
    Router["React Router\nmatch /m/:slug → <Menu>"]
    ApiCall["Menu.tsx\nGET /api/menu/chilligarden"]
    Render["Renderiza el menú"]

    Browser --> Apache --> Proxy --> Express
    Express -->|"No es /api"| Static
    Static -->|"No hay archivo estático"| Fallback
    Fallback --> ReactBoot --> Router --> ApiCall --> Render
```
