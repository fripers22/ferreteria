# Contexto total del proyecto FerreSync

Este documento consolida el contexto funcional y técnico del proyecto FerreSync para que sirva como referencia única de arquitectura, tecnologías, módulos, IA, flujos y convenciones operativas.

## 1. Propósito del sistema

FerreSync es un sistema de gestión para ferreterías que cubre:

- Punto de venta rápido.
- Inventario y control de stock.
- Clientes.
- Cuentas por cobrar.
- Reportes operativos.
- Chatbot con IA local y recuperación de contexto.

La aplicación está pensada para operar de forma local o en un entorno de desarrollo con PostgreSQL, un backend Node.js/Express y un frontend React.

## 2. Arquitectura general

La solución sigue una arquitectura por capas y desacoplada por dominio:

- Frontend web en React + Vite.
- Backend API en Node.js + Express.
- Persistencia en PostgreSQL con Prisma ORM.
- Extensión vectorial con pgvector para RAG.
- Capa IA local basada en Ollama.

### Flujo de alto nivel

1. El usuario interactúa con el frontend.
2. El frontend llama a la API mediante Axios.
3. El backend valida autenticación con JWT.
4. Los controladores delegan la lógica a servicios.
5. Prisma persiste y consulta datos en PostgreSQL.
6. El chatbot usa RAG, memoria conversacional y herramientas internas.

## 3. Stack tecnológico

### Backend

- Node.js.
- Express.js.
- Prisma ORM.
- PostgreSQL.
- pgvector.
- JWT para autenticación.
- bcryptjs para contraseñas.
- express-validator para validación.
- dotenv para variables de entorno.
- nodemon para desarrollo.
- Ollama local para generación y embeddings.

### Frontend

- React 18.
- Vite.
- React Router DOM.
- Axios.
- React Hot Toast.
- React Icons.
- TailwindCSS.
- PostCSS.
- Autoprefixer.

### Infraestructura local

- Docker y Docker Compose.
- Contenedor PostgreSQL con imagen pgvector/pgvector:pg15.

## 4. Estructura funcional

### Módulos principales

- Auth.
- Productos.
- Categorías.
- Clientes.
- Ventas.
- Inventario.
- Cuentas por cobrar.
- Chatbot / IA.

### Pantallas del frontend

- Login.
- Dashboard.
- POS.
- Inventory.
- Customers.
- Accounts.
- Reports.
- Chatbot.
- Settings.

### Layout y navegación

- Sidebar lateral.
- Topbar superior.
- Layout principal protegido por autenticación.
- Redirección a login si no existe sesión.

## 5. Backend: organización interna

El backend sigue una estructura clásica por responsabilidades:

- `src/index.js`: arranque del servidor, middlewares, health check y registro de rutas.
- `src/routes/`: definición de endpoints por módulo.
- `src/controllers/`: capa HTTP de entrada y salida.
- `src/services/`: lógica de negocio e integración con IA, memoria y herramientas.
- `src/middlewares/`: autenticación y validación.
- `src/config/`: conexión a base de datos.
- `prisma/`: esquema, migraciones y seed.
- `src/scripts/`: procesos auxiliares como ingesta de conocimiento para RAG.

## 6. Base de datos y modelo de dominio

La base de datos está modelada con Prisma sobre PostgreSQL.

### Entidades principales

- User: usuarios del sistema con rol ADMIN o VENDEDOR.
- Category: categorías de productos.
- Product: catálogo, stock, costos y precios.
- Customer: clientes.
- Sale: cabecera de venta.
- SaleDetail: detalle de venta por producto.
- InventoryMovement: movimientos de inventario.
- Account: cuenta por cobrar del cliente.
- AccountTransaction: cargos y abonos.
- KnowledgeChunk: fragmentos indexados para RAG con embedding vectorial.
- ChatSession: sesión conversacional.
- ChatMessage: mensajes de la sesión.
- ChatSummary: resumen persistente de la conversación.
- ChatFeedback: calificación y notas de calidad.

### Tipos y enums

- Role: ADMIN, VENDEDOR.
- MovementType: ENTRADA, SALIDA, AJUSTE.
- PaymentMethod: EFECTIVO, TARJETA, TRANSFERENCIA, FIADO.
- TransactionType: CARGO, ABONO.

### Reglas de negocio visibles en el esquema

- Los productos tienen stock, stock mínimo, costo y precio de venta.
- Las ventas guardan subtotal, descuento, impuesto, total y método de pago.
- Las cuentas tienen saldo, límite de crédito y fecha de última actividad.
- El chatbot conserva sesiones, mensajes, resúmenes y feedback.

## 7. API y convenciones

### Convenciones generales

- Base URL local: `http://localhost:4000`.
- Autenticación: `Authorization: Bearer <token>`.
- Excepción: `POST /api/auth/login`.
- Respuesta común: `{ success, message, data, errors }`.
- Fechas en formato ISO.
- Valores monetarios como `number`.

### Endpoints por módulo

#### Auth

- `POST /api/auth/login`
- `GET /api/auth/profile`
- `PUT /api/auth/change-password`

#### Productos

- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/products/barcode/:barcode`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

#### Categorías

- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

#### Clientes

- `GET /api/customers`
- `GET /api/customers/:id`
- `POST /api/customers`
- `PUT /api/customers/:id`
- `DELETE /api/customers/:id`

#### Ventas

- `GET /api/sales`
- `GET /api/sales/daily`
- `GET /api/sales/:id`
- `POST /api/sales`
- `DELETE /api/sales/:id`

#### Inventario

- `GET /api/inventory/movements`
- `POST /api/inventory/movements`
- `GET /api/inventory/low-stock`
- `GET /api/inventory/value`

#### Cuentas por cobrar

- `GET /api/accounts`
- `GET /api/accounts/summary`
- `GET /api/accounts/:id`
- `GET /api/accounts/customer/:customerId`
- `POST /api/accounts/payment`
- `PUT /api/accounts/:id/credit-limit`

#### Chatbot / IA

- `POST /api/chatbot`
- `POST /api/chatbot/feedback`
- `GET /api/chatbot/session/:id`
- `GET /api/chatbot/insights`

## 8. Frontend: comportamiento y navegación

El frontend centraliza la sesión en `AuthContext` y persiste token y usuario en `localStorage`.

### Características visibles

- Login con control de sesión.
- Protección de rutas privadas.
- Dashboard con métricas del día.
- Accesos rápidos a POS, inventario, clientes y cuentas.
- Notificaciones con toast.
- Consumo de API mediante una instancia Axios con interceptor de token.

### Servicios del frontend

- `api.js`: instancia Axios base.
- Interceptor de request para inyectar JWT.
- Interceptor de response para cerrar sesión ante `401`.

## 9. IA local, RAG y memoria conversacional

La capa IA es una parte central del proyecto y funciona de forma local con Ollama.

### Modelos usados

- `llama3.2:3b` para chat/generación.
- `nomic-embed-text` para embeddings.

### Idea general

El chatbot no responde solo con un prompt fijo. Usa un pipeline con:

- Recuperación semántica de documentos indexados.
- Memoria de conversación por sesión.
- Resumen acumulativo de contexto.
- Herramientas internas para consultar o escribir datos.
- Confirmación explícita para acciones de escritura.

### Componentes IA

- `rag.service.js`: busca fragmentos relevantes en `KnowledgeChunk` usando embeddings y pgvector.
- `chat-memory.service.js`: crea sesiones, guarda mensajes y mantiene resúmenes.
- `agent.service.js`: decide si responder, usar una herramienta, rechazar o pedir confirmación.
- `agent-tools.service.js`: ejecuta herramientas de negocio.
- `ollama.service.js`: puente con Ollama para chat y embeddings.

### Qué guarda la memoria

- Historial reciente de mensajes.
- Resumen compacto de sesiones largas.
- Feedback del usuario sobre la calidad de respuestas.

### Qué ingesta el RAG

- Perfil del agente.
- Capacidades IA.
- Flujos por módulo.
- FAQ del proyecto.
- Documentación técnica de módulos y API.
- Plantilla de cobertizos para cotización asistida.

### Reglas del agente

- Responder solo sobre FerreSync y sus módulos.
- No inventar datos ni estados de inventario o ventas.
- Pedir confirmación para escritura con `allowWrite=true`.
- Rechazar preguntas fuera del dominio.
- Reportar fuentes recuperadas cuando aplica.

### Herramientas del agente

- `list_low_stock`
- `get_daily_sales_summary`
- `find_product`
- `list_customers`
- `get_inventory_value`
- `build_cart_estimate`
- `create_customer`
- `create_inventory_movement`

## 10. Flujos funcionales clave

### POS

1. Buscar productos por nombre, SKU o código de barras.
2. Agregar cantidades al carrito.
3. Elegir método de pago.
4. Registrar la venta.
5. Descontar stock.
6. Si es FIADO, crear o actualizar cuenta y transacción.

### Inventario

1. Revisar bajo stock.
2. Registrar entradas, salidas o ajustes.
3. Actualizar stock en tiempo real.
4. Consultar valor total del inventario.

### Clientes

1. Registrar clientes.
2. Consultar historial y cuentas.
3. Buscar por nombre, teléfono o email.

### Cuentas por cobrar

1. Crear cuenta al registrar ventas a crédito.
2. Consultar saldo y límite.
3. Registrar abonos.

### Reportes

1. Consultar ventas del día.
2. Revisar ticket promedio.
3. Ver resumen de inventario.

### Chatbot

1. Recibir mensaje del usuario.
2. Buscar contexto en documentos y memoria.
3. Decidir si usar herramienta o responder con RAG.
4. Guardar mensaje y actualizar resumen.
5. Permitir feedback de calidad.

## 11. Funcionalidades destacadas

- Autenticación JWT con roles.
- POS con carrito y venta rápida.
- Gestión de inventario y alertas de bajo stock.
- Cuentas por cobrar con control de saldo.
- Reportes diarios y valor de inventario.
- Chatbot con contexto recuperado y memoria por sesión.
- Cotización asistida para listas de materiales.

## 12. Scripts y comandos relevantes

### Backend

- `npm run dev`
- `npm run start`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:push`
- `npm run db:seed`
- `npm run db:studio`
- `npm run rag:ingest`

### Frontend

- `npm run dev`
- `npm run build`
- `npm run preview`

### Infraestructura local

- `docker-compose up -d`
- `docker-compose down`

### Ollama

- `ollama serve`
- `ollama pull llama3.2:3b`
- `ollama pull nomic-embed-text`

## 13. Variables y servicios externos

### Variables implícitas importantes

- `PORT` para el backend.
- `DATABASE_URL` para Prisma.
- `VITE_API_URL` para el frontend.
- Variables de control del RAG y del resumen conversacional.

### Servicios requeridos

- PostgreSQL con pgvector.
- Ollama ejecutándose en `http://localhost:11434`.

## 14. Datos de prueba y arranque

El proyecto incluye credenciales de prueba documentadas:

- admin / admin123
- vendedor1 / vendedor123

Secuencia típica de arranque:

1. Levantar PostgreSQL con Docker.
2. Instalar dependencias del backend.
3. Generar Prisma y ejecutar migraciones.
4. Sembrar datos iniciales.
5. Ingerir documentación del RAG.
6. Instalar dependencias del frontend.
7. Levantar Ollama.
8. Ejecutar backend y frontend.

## 15. Plantilla especial: cobertizo

Existe un flujo adicional orientado a estimación de materiales para cobertizos.

### Datos requeridos

- Largo.
- Ancho.
- Alto.
- Tipo de techo.
- Tipo de estructura.
- Separación entre postes.

### Objetivo del flujo

- Calcular cantidades estimadas.
- Buscar materiales en inventario.
- Generar un carrito estimado sin afectar stock.

## 16. Convenciones operativas del agente

- Hablar en español claro y breve.
- No inventar datos de inventario o ventas.
- Pedir confirmación antes de escribir.
- Mantener trazabilidad del contexto usado.
- Restringir respuestas al dominio de FerreSync.

## 17. Resumen ejecutivo

FerreSync combina una app web operativa con una capa IA local. Su valor principal está en unir POS, inventario, clientes, cuentas por cobrar y chatbot contextualizado con RAG, memoria y herramientas controladas. El proyecto está estructurado para operar de forma local, con datos relacionales bien definidos y una base documental suficiente para sostener respuestas asistidas y acciones guiadas.
