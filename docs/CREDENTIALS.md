# Credenciales de acceso — Chilli Garden

## Panel Administrador

| Campo    | Valor                        |
|----------|------------------------------|
| URL      | http://179.41.8.247/admin/login |
| Email    | admin@menuapp.com            |
| Password | admin123                     |
| Rol      | owner                        |

## URLs de la app

| Vista          | URL                                      |
|----------------|------------------------------------------|
| Menú cliente   | http://179.41.8.247/m/chilligarden       |
| Panel admin    | http://179.41.8.247/admin/dashboard      |
| Login admin    | http://179.41.8.247/admin/login          |
| Demo / landing | http://179.41.8.247/demo                 |

## Variables de entorno (MenuApp-Backend/.env)

```
PORT=3001
JWT_SECRET=c24f56f162168de0c4a28afc2c15a76e653e74629effadeebd98139bab1939e3
MP_ACCESS_TOKEN=TEST-tu-access-token-aqui
FRONTEND_URL=*
BASE_URL=http://179.41.8.247
```

## Para resetear la base de datos al estado inicial

```bash
cd /home/mugg_server_1/appmenu/MenuApp-Backend
npx prisma db seed
```

Esto limpia todo y recrea el menú de Chilli Garden con las credenciales de arriba.
