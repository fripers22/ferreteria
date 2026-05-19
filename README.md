# FerreSync - Sistema de Gestión de Ferretería

Sistema completo de gestión para ferreterías con POS, inventario, cuentas por cobrar y chatbot con IA.

## Stack Tecnológico

### Backend
- Node.js + Express.js
- PostgreSQL + Prisma ORM + pgvector (RAG)
- JWT para autenticación
- Gemini API para el chatbot y embeddings

### Frontend
- React 18 + Vite
- TailwindCSS
- React Router DOM
- React Hot Toast

## Requisitos

- Node.js 18+
- Docker y Docker Compose (para PostgreSQL con pgvector)
- npm o yarn

## Instalación

### 1. Clonar el repositorio
```bash
git clone <repo-url>
cd ferreteria
```

### 2. Iniciar PostgreSQL con Docker
```bash
docker-compose up -d
```

### 3. Configurar Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run rag:ingest
```
Si actualizas los documentos, vuelve a ejecutar `npm run rag:ingest -- --reset`.

### 3.1 Configurar IA online (Gemini)
1. Crea tu API key en Google AI Studio: https://aistudio.google.com/
2. Abre `backend/.env` y pega la clave en `GEMINI_API_KEY`.
3. Si despliegas en Vercel, agrega la misma variable en el panel de Environment Variables del proyecto.
4. Reinicia el backend.

Variables usadas por defecto:
```bash
GEMINI_MODEL="gemini-1.5-flash"
GEMINI_EMBEDDING_MODEL="text-embedding-004"
```

### 4. Configurar Frontend
```bash
cd frontend
npm install
```

## Ejecutar el proyecto

### Backend (puerto 4000)
```bash
cd backend
npm run dev
```

### Frontend (puerto 5173)
```bash
cd frontend
npm run dev
```

## Credenciales de prueba

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | Administrador |
| vendedor1 | vendedor123 | Vendedor |

## Estructura del proyecto

```
ferreteria/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── middlewares/
│       ├── services/
│       └── config/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── context/
│       └── hooks/
├── docker-compose.yml
└── README.md
```

## Funcionalidades

- ✅ Autenticación JWT con roles (Admin/Vendedor)
- ✅ Punto de Venta (POS) con carrito
- ✅ Gestión de inventario y movimientos
- ✅ Control de clientes
- ✅ Cuentas por cobrar (crédito/fiado)
- ✅ Reportes de ventas
- ✅ Chatbot asistente (con Gemini online)
- ✅ Dashboard con estadísticas

## Agente IA con RAG
- El asistente responde con contexto recuperado (RAG) y no con un prompt fijo.
- Para ejecutar acciones de escritura, el cliente debe enviar `allowWrite=true`.
- Documentos base del agente en la carpeta `docs/` (perfil, flujos, FAQ).
- Memoria persistente por sesion, feedback de calidad e insights rapidos.

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil

### Productos
- `GET /api/products` - Listar productos
- `POST /api/products` - Crear producto
- `PUT /api/products/:id` - Actualizar producto

### Ventas
- `GET /api/sales` - Listar ventas
- `POST /api/sales` - Crear venta
- `GET /api/sales/daily` - Ventas del día

### Inventario
- `GET /api/inventory/movements` - Movimientos
- `POST /api/inventory/movements` - Registrar movimiento
- `GET /api/inventory/low-stock` - Productos bajo stock

### Cuentas
- `GET /api/accounts` - Listar cuentas
- `POST /api/accounts/payment` - Registrar pago

### Chatbot
- `POST /api/chatbot` - Enviar mensaje al asistente IA local

---
Desarrollado con ❤️ para FerreSync
