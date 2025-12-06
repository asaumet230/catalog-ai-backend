# 🚀 CatalogAI Backend

Backend API REST para CatalogAI - Sistema de gestión de catálogos potenciado por IA.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API Endpoints](#api-endpoints)
- [Principios de Desarrollo](#principios-de-desarrollo)
- [Deploy en Railway](#deploy-en-railway)
- [Integración con NextAuth](#integración-con-nextauth)

## ✨ Características

- ✅ Autenticación JWT completa (registro, login, renovación de token)
- ✅ Soporte para OAuth (Google, GitHub, Facebook) via NextAuth
- ✅ CRUD completo de usuarios y catálogos
- ✅ Sistema de roles y permisos (user_role, admin_role)
- ✅ Validaciones exhaustivas con express-validator
- ✅ Arquitectura MVC con TypeScript
- ✅ Base de datos MongoDB con Mongoose
- ✅ Principios SOLID y Clean Code
- ✅ Paginación de resultados
- ✅ Middlewares de seguridad
- ✅ Manejo centralizado de errores

## 🛠 Tecnologías

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Tipado estático
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación basada en tokens
- **bcrypt** - Hash de contraseñas
- **express-validator** - Validación de requests

## 📦 Requisitos Previos

- Node.js >= 18.x
- MongoDB >= 6.x (local o Atlas)
- npm o yarn

## 🚀 Instalación

1. **Clonar el repositorio o navegar a la carpeta:**

```bash
cd catalogAI-backend
```

2. **Instalar dependencias:**

```bash
npm install
```

3. **Configurar variables de entorno:**

```bash
cp .env.template .env
```

Editar el archivo `.env` con tus valores:

```env
PORT=8080
NODE_ENV=development
DB_CNN=mongodb://localhost:27017/catalogai-db
SECRET_JWT_SEED=tu-super-secreto-jwt-aqui
CORS_WHITELIST=http://localhost:3000,http://localhost:3001
```

4. **Iniciar el servidor en desarrollo:**

```bash
npm run dev
```

5. **Construir para producción:**

```bash
npm run build
npm start
```

## ⚙️ Configuración

### Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `8080` |
| `NODE_ENV` | Entorno de ejecución | `development` o `production` |
| `DB_CNN` | URI de conexión a MongoDB | `mongodb://localhost:27017/catalogai-db` |
| `SECRET_JWT_SEED` | Secreto para firmar JWT | `mi-secreto-super-seguro` |
| `CORS_WHITELIST` | Dominios permitidos (separados por coma) | `http://localhost:3000` |

### MongoDB

**Opción 1: MongoDB Local**
```bash
mongod --dbpath /ruta/a/tu/db
```

**Opción 2: MongoDB Atlas**
```env
DB_CNN=mongodb+srv://usuario:password@cluster.mongodb.net/catalogai-db
```

## 📖 Uso

### Health Check

```bash
curl http://localhost:8080/health
```

Respuesta:
```json
{
  "ok": true,
  "message": "CatalogAI API is running",
  "version": "1.0.0"
}
```

## 📁 Estructura del Proyecto

```
catalogAI-backend/
├── src/
│   ├── controllers/          # Lógica de negocio
│   │   ├── authController.ts
│   │   ├── usersController.ts
│   │   ├── catalogsController.ts
│   │   └── index.ts
│   ├── database/             # Configuración de BD
│   │   ├── dbConfig.ts
│   │   └── index.ts
│   ├── helpers/              # Funciones auxiliares
│   │   ├── sendError.ts
│   │   ├── jwtGenerator.ts
│   │   ├── dbValidators.ts
│   │   └── index.ts
│   ├── interfaces/           # Tipos TypeScript
│   │   ├── IUser.ts
│   │   ├── ICatalog.ts
│   │   ├── IServer.ts
│   │   └── index.ts
│   ├── middlewares/          # Middlewares personalizados
│   │   ├── fieldValidator.ts
│   │   ├── jwtValidator.ts
│   │   ├── permissionValidator.ts
│   │   └── index.ts
│   ├── models/               # Modelos Mongoose
│   │   ├── User.ts
│   │   ├── Catalog.ts
│   │   ├── Server.ts
│   │   └── index.ts
│   ├── routes/               # Definición de rutas
│   │   ├── authRouter.ts
│   │   ├── usersRouter.ts
│   │   ├── catalogsRouter.ts
│   │   └── index.ts
│   └── app.ts                # Punto de entrada
├── public/                   # Archivos estáticos
├── dist/                     # Código compilado
├── .env.template             # Template de variables
├── .gitignore
├── package.json
├── tsconfig.json
├── nodemon.json
└── README.md
```

## 🔌 API Endpoints

### 🔐 Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Registrar nuevo usuario | No |
| POST | `/login` | Login con credenciales | No |
| GET | `/renew` | Renovar token JWT | Sí |
| POST | `/sync-oauth` | Sincronizar usuario OAuth | No |

**Ejemplo: Register**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "ok": true,
  "message": "User registered successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "user_role",
    "active": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Ejemplo: Login**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "password123"
}
```

### 👥 Usuarios (`/api/users`)

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| GET | `/` | Obtener todos los usuarios | Sí | Admin |
| GET | `/profile` | Obtener perfil del usuario autenticado | Sí | Todos |
| GET | `/:id` | Obtener usuario por ID | Sí | Todos |
| PUT | `/:id` | Actualizar usuario | Sí | Todos |
| DELETE | `/:id` | Eliminar usuario | Sí | Admin |

**Ejemplo: Get Profile**
```bash
GET /api/users/profile
x-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 📦 Catálogos (`/api/catalogs`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/` | Crear catálogo | Sí |
| GET | `/` | Obtener todos los catálogos | Sí |
| GET | `/:id` | Obtener catálogo por ID | Sí |
| PUT | `/:id` | Actualizar catálogo | Sí |
| DELETE | `/:id` | Eliminar catálogo | Sí |
| POST | `/:id/products` | Agregar producto al catálogo | Sí |

**Ejemplo: Create Catalog**
```bash
POST /api/catalogs
x-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Catálogo Verano 2024",
  "description": "Productos para la temporada de verano",
  "platform": "shopify",
  "markup": 30,
  "products": [
    {
      "name": "Camiseta Beach",
      "description": "Camiseta de algodón para playa",
      "price": 25.99,
      "images": ["https://example.com/image.jpg"],
      "category": "ropa",
      "stock": 100
    }
  ]
}
```

**Respuesta:**
```json
{
  "ok": true,
  "message": "Catalog created successfully",
  "catalog": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Catálogo Verano 2024",
    "description": "Productos para la temporada de verano",
    "userId": "507f1f77bcf86cd799439011",
    "platform": "shopify",
    "markup": 30,
    "status": "draft",
    "totalProducts": 1,
    "products": [...]
  }
}
```

### Autenticación con JWT

Todas las rutas protegidas requieren el header:

```
x-token: <tu-jwt-token>
```

### Códigos de Respuesta

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

## 🏗 Principios de Desarrollo

Este proyecto sigue los principios **SOLID** y **Clean Code**:

### ✅ Single Responsibility Principle (SRP)
- Cada controlador maneja una única entidad
- Helpers con funciones específicas
- Middlewares con responsabilidades únicas

### ✅ Open/Closed Principle (OCP)
- Middlewares extensibles sin modificar código existente
- Validadores personalizados

### ✅ Liskov Substitution Principle (LSP)
- Interfaces TypeScript bien definidas
- Modelos consistentes con sus interfaces

### ✅ Interface Segregation Principle (ISP)
- Rutas separadas por dominio
- Interfaces específicas para cada modelo

### ✅ Dependency Inversion Principle (DIP)
- Configuración de DB separada
- Helpers desacoplados de controladores

### 📝 Clean Code
- Nombres descriptivos y consistentes
- Funciones pequeñas y específicas
- Comentarios significativos
- Alineación vertical para legibilidad
- DRY (Don't Repeat Yourself)

## 🚂 Deploy en Railway

### 1. Crear cuenta en Railway

Visita [railway.app](https://railway.app) y crea una cuenta.

### 2. Instalar Railway CLI

```bash
npm i -g @railway/cli
```

### 3. Login en Railway

```bash
railway login
```

### 4. Inicializar proyecto

```bash
railway init
```

### 5. Agregar MongoDB

En el dashboard de Railway:
- Click en "New" → "Database" → "Add MongoDB"
- Copia la URI de conexión

### 6. Configurar variables de entorno

En Railway dashboard:
- Settings → Variables
- Agregar:
  - `PORT` (Railway lo provee automáticamente)
  - `DB_CNN` (URI de MongoDB)
  - `SECRET_JWT_SEED`
  - `CORS_WHITELIST` (tu frontend en Vercel)
  - `NODE_ENV=production`

### 7. Deploy

```bash
railway up
```

### 8. Obtener URL

Railway te dará una URL pública como:
```
https://catalogai-backend-production.up.railway.app
```

## 🔗 Integración con NextAuth

Este backend está diseñado para integrarse perfectamente con NextAuth en el frontend.

### En tu frontend Next.js:

```typescript
// app/api/auth/[...nextauth]/route.ts
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const res = await fetch("https://tu-api.railway.app/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
          }),
        })

        const user = await res.json()
        if (res.ok && user) return user
        return null
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        await fetch("https://tu-api.railway.app/api/auth/sync-oauth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            image: user.image,
            provider: "google",
            providerId: user.id,
          }),
        })
      }
      return true
    }
  }
}
```

## 📝 Scripts Disponibles

```bash
# Desarrollo con hot-reload
npm run dev

# Compilar TypeScript
npm run build

# Producción
npm start
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver el archivo LICENSE para más detalles

## 👨‍💻 Autor

**Andres Felipe Saumet**

## 📞 Soporte

Para soporte, contacta a través de:
- Email: tu-email@example.com
- GitHub Issues: [Crear Issue](https://github.com/tu-usuario/catalogai-backend/issues)

---

⌨️ con ❤️ por [Andres Felipe Saumet](https://github.com/tu-usuario)
