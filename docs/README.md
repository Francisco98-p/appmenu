# MenuApp — Menú Digital con QR

MenuApp es una aplicación web para restaurantes y locales gastronómicos que permite a los clientes escanear un código QR, navegar el menú digital, armar su pedido y pagar — todo desde su celular, sin descargar nada.

El sistema también incluye un panel de administración para gestionar pedidos en tiempo real, stock, mesas y configuración del local; y un panel para mozos que les permite tomar pedidos desde la mesa.

---

## Características principales

- Menú digital por QR con slug único por local (`/m/:slug`)
- Carrito persistente (sessionStorage) con selector Salón / Retirar
- Pago online con Mercado Pago o en efectivo
- Tracking del pedido en tiempo real vía Socket.io
- Panel Admin: gestión de pedidos, estados, productos, stock, mesas
- Panel Mozo: vista simplificada para tomar pedidos por mesa
- Autenticación JWT con roles (`owner`)
- Horario de apertura/cierre visible en el menú

---

## Tech Stack

### Frontend
| Tecnología | Versión | Rol |
|-----------|---------|-----|
| React | 18 | UI framework |
| TypeScript | 5 | Tipado estático |
| Vite | 6 | Build tool |
| Tailwind CSS | 4 | Estilos |
| React Router DOM | 6 | Routing SPA |
| Zustand | 4 | Estado global (auth + cart) |
| Axios | 1.x | Cliente HTTP |
| Socket.io-client | 4 | WebSockets |
| Lucide React | — | Iconos |

### Backend
| Tecnología | Versión | Rol |
|-----------|---------|-----|
| Node.js | 18+ | Runtime |
| Express | 4 | Framework HTTP |
| TypeScript | 5 | Tipado estático |
| Prisma | 5 | ORM |
| SQLite | — | Base de datos |
| Socket.io | 4 | WebSockets en tiempo real |
| JSON Web Token | — | Autenticación |
| bcrypt | — | Hash de contraseñas |
| Mercado Pago SDK | — | Pagos online |
| dotenv | — | Variables de entorno |

### Infraestructura
| Componente | Rol |
|-----------|-----|
| PM2 | Proceso manager Node.js en WSL2 |
| Apache 2.4 (Windows host) | Reverse proxy → WSL:3001 |

---

## Estructura del repositorio

```
appmenu/
├── MenuApp-Frontend/          # SPA React/Vite
│   ├── src/
│   │   ├── api/               # Cliente Axios
│   │   ├── components/admin/  # Componentes reutilizables del admin
│   │   ├── context/           # Zustand stores (auth, cart)
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Páginas de la app
│   │   ├── types/             # Interfaces TypeScript
│   │   └── App.tsx            # Router principal
│   ├── public/images/         # Imágenes de productos
│   └── dist/                  # Build de producción (generado)
│
├── MenuApp-Backend/           # API Express
│   ├── src/
│   │   ├── controllers/       # Lógica de negocio
│   │   ├── middleware/        # Auth JWT
│   │   ├── routes/            # Definición de rutas
│   │   ├── types/             # Tipos Express extendidos
│   │   └── index.ts           # Entry point
│   ├── prisma/
│   │   ├── schema.prisma      # Modelos DB
│   │   ├── seed.ts            # Datos iniciales
│   │   └── dev.db             # SQLite (generado)
│   └── dist/                  # Build compilado (generado)
│
├── docs/                      # Documentación
│   ├── README.md              # Este archivo
│   ├── ARCHITECTURE.md        # Arquitectura y decisiones técnicas
│   ├── API.md                 # Referencia de endpoints
│   ├── DATABASE.md            # Modelos y diagrama ER
│   ├── FLOWS.md               # Diagramas de flujo
│   ├── MODULES.md             # Detalle de cada módulo
│   ├── DEPLOYMENT.md          # Guía de deploy
│   ├── CREDENTIALS.md         # Credenciales de acceso (no pushear)
│   └── DIAGNOSTICO.md         # Diagnóstico técnico del proyecto
│
└── app.sh                     # Script de inicio WSL
```

---

## Quickstart (desarrollo local)

### Requisitos
- Node.js 18+
- npm 9+

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/Francisco98-p/appmenu.git
cd appmenu

# Backend
cd MenuApp-Backend && npm install

# Frontend
cd ../MenuApp-Frontend && npm install
```

### 2. Configurar variables de entorno

```bash
# En MenuApp-Backend/
cp .env.example .env
# Editar .env con tus valores (ver sección Variables de entorno)
```

### 3. Inicializar base de datos

```bash
cd MenuApp-Backend
npx prisma migrate dev
npx prisma db seed
```

### 4. Iniciar en modo desarrollo

**Terminal 1 — Backend:**
```bash
cd MenuApp-Backend
npm run dev
# Escucha en http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd MenuApp-Frontend
npm run dev
# Escucha en http://localhost:5173
```

---

## Build de producción

```bash
# Frontend
cd MenuApp-Frontend && npm run build
# Genera MenuApp-Frontend/dist/

# Backend
cd MenuApp-Backend && npm run build
# Genera MenuApp-Backend/dist/
```

El backend sirve el frontend compilado como archivos estáticos desde `dist/`, por lo que en producción solo corre un proceso Node.js en el puerto 3001.

---

## Variables de entorno

Archivo: `MenuApp-Backend/.env`

| Variable | Requerida | Descripción | Ejemplo |
|---------|-----------|-------------|---------|
| `PORT` | No | Puerto del servidor (default: 3001) | `3001` |
| `JWT_SECRET` | **Sí** | Secreto para firmar tokens JWT | `mi-secreto-super-seguro` |
| `MP_ACCESS_TOKEN` | No* | Token de acceso de Mercado Pago | `APP_USR-...` |
| `BASE_URL` | No | URL pública de la app (para MP back_urls) | `http://179.41.8.247` |
| `FRONTEND_URL` | No | Origen permitido en CORS (default: `*`) | `http://179.41.8.247` |

\* Requerida para usar pagos online con Mercado Pago.

---

## URLs de acceso (producción)

| Acceso | URL |
|--------|-----|
| Landing / Demo | `http://179.41.8.247/` |
| Menú Chilli Garden | `http://179.41.8.247/m/chilligarden` |
| Login Admin | `http://179.41.8.247/admin/login` |
| Panel Admin | `http://179.41.8.247/admin/dashboard` |
| Panel Mozo | `http://179.41.8.247/mozo/dashboard` |

Credenciales en [`CREDENTIALS.md`](CREDENTIALS.md).

---

## Documentación adicional

| Documento | Contenido |
|-----------|-----------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Arquitectura del sistema, capas, Socket.io |
| [API.md](API.md) | Referencia completa de endpoints REST |
| [DATABASE.md](DATABASE.md) | Modelos de datos y diagrama ER |
| [FLOWS.md](FLOWS.md) | Diagramas de flujo de los procesos clave |
| [MODULES.md](MODULES.md) | Descripción detallada de cada módulo |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Guía de deploy en producción |
| [DIAGNOSTICO.md](DIAGNOSTICO.md) | Diagnóstico técnico y plan de mejoras |
