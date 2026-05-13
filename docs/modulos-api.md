# Modulos y API (resumen tecnico)

Este documento se ingesta en el RAG para dar contexto detallado al agente.

## Convenciones generales
- Base URL: http://localhost:4000
- Autenticacion: JWT Bearer en Authorization (excepto /api/auth/login)
- Respuesta comun: { success: boolean, message?: string, data?: any, errors?: any }
- Fechas: ISO string
- Decimales: number

## Modulo Auth

### POST /api/auth/login
- Body: { username: string, password: string }
- Response data:
  - token: string (JWT)
  - user: { id: number, username: string, fullName: string, role: ADMIN|VENDEDOR }

### GET /api/auth/profile
- Header: Authorization: Bearer <token>
- Response data: { id, username, fullName, role, active, createdAt }

### PUT /api/auth/change-password
- Body: { currentPassword: string, newPassword: string (min 6) }
- Response: message

## Modulo Productos

### GET /api/products
- Query: search?: string, categoryId?: number, active?: boolean, lowStock?: boolean
- Response data: Product[]

### GET /api/products/:id
- Response data: Product

### GET /api/products/barcode/:barcode
- Response data: Product

### POST /api/products (ADMIN)
- Body requerido:
  - sku: string
  - name: string
  - categoryId: number
  - costPrice: number
  - salePrice: number
- Body opcional: barcode?: string, description?: string, unit?: string, stock?: number, minStock?: number
- Response data: Product

### PUT /api/products/:id (ADMIN)
- Body: campos del producto a actualizar
- Response data: Product

### DELETE /api/products/:id (ADMIN)
- Desactiva el producto (active=false)

## Modulo Categorias

### GET /api/categories
- Response data: Category[] con _count.products

### POST /api/categories (ADMIN)
- Body: { name: string }
- Response data: Category

### PUT /api/categories/:id (ADMIN)
- Body: { name: string }
- Response data: Category

### DELETE /api/categories/:id (ADMIN)
- Requiere que no existan productos asociados

## Modulo Clientes

### GET /api/customers
- Query: search?: string (name/phone/email)
- Response data: Customer[] + accounts + _count.sales

### GET /api/customers/:id
- Response data: Customer con:
  - accounts (con transactions recientes)
  - sales recientes con details y product

### POST /api/customers
- Body requerido: { name: string }
- Body opcional: phone?: string, email?: string, address?: string, rfc?: string
- Response data: Customer

### PUT /api/customers/:id
- Body: campos del cliente a actualizar
- Response data: Customer

### DELETE /api/customers/:id (ADMIN)
- Requiere que el cliente no tenga ventas asociadas

## Modulo Ventas

### GET /api/sales
- Query: startDate?: YYYY-MM-DD, endDate?: YYYY-MM-DD, customerId?: number, paymentMethod?: string
- Response data: Sale[] con customer, user, details

### GET /api/sales/daily
- Response data: { sales: Sale[], summary: { totalSales, totalTransactions, averageTicket } }

### GET /api/sales/:id
- Response data: Sale con customer, user, details

### POST /api/sales
- Body requerido:
  - items: [{ productId: number, quantity: number }]
  - paymentMethod: EFECTIVO|TARJETA|TRANSFERENCIA|FIADO
- Body opcional: customerId?: number, discount?: number
- Efectos:
  - Valida stock y estado activo del producto
  - Registra movimiento de inventario (SALIDA)
  - Si es FIADO, crea/actualiza cuenta y transaccion
- Response data: Sale con details

### DELETE /api/sales/:id (ADMIN)
- Cancela venta, revierte stock y transacciones de fiado

## Modulo Inventario

### GET /api/inventory/movements
- Query: productId?: number, type?: ENTRADA|SALIDA|AJUSTE, startDate?: YYYY-MM-DD, endDate?: YYYY-MM-DD
- Response data: InventoryMovement[] con product y user

### POST /api/inventory/movements (ADMIN)
- Body: { productId: number, type: ENTRADA|SALIDA|AJUSTE, quantity: number, reason?: string }
- Response data: InventoryMovement

### GET /api/inventory/low-stock
- Response data: Product[] con categoryName

### GET /api/inventory/value
- Response data: { totalCostValue, totalSaleValue, potentialProfit, totalItems, totalProducts }

## Modulo Cuentas por cobrar

### GET /api/accounts
- Query: hasBalance?: boolean
- Response data: Account[] con customer y _count.transactions

### GET /api/accounts/summary
- Response data: { totalPending, accountsWithBalance, totalCreditLimit, accounts[] }

### GET /api/accounts/:id
- Response data: Account con customer y transactions

### GET /api/accounts/customer/:customerId
- Crea la cuenta si no existe
- Response data: Account

### POST /api/accounts/payment
- Body: { accountId: number, amount: number, description?: string }
- Response data: AccountTransaction

### PUT /api/accounts/:id/credit-limit (ADMIN)
- Body: { creditLimit: number }
- Response data: Account

## Modulo Chatbot / IA

### POST /api/chatbot
- Body: { message: string, history?: array, allowWrite?: boolean, sessionId?: string }
- Response data: { reply, sessionId, messageId, meta }
- meta: { usedContext: boolean, toolUsed: string|null, sources: [{ source, title, score }] }

### POST /api/chatbot/feedback
- Body: { sessionId: string, messageId?: number, rating: 1..5, note?: string }

### GET /api/chatbot/session/:id
- Query: limit?: 1..200
- Response data: { sessionId, summary, messages[] }

### GET /api/chatbot/insights
- Query: date?: YYYY-MM-DD, lowStockLimit?: number
- Response data: { lowStock, sales, inventory }

### Tools del agente
- list_low_stock
- get_daily_sales_summary
- find_product
- list_customers
- get_inventory_value
- build_cart_estimate
- create_customer (requiere allowWrite=true)
- create_inventory_movement (requiere allowWrite=true)

## Modelos clave (BD)

### Product
- id: number
- sku: string
- barcode?: string
- name: string
- description?: string
- categoryId: number
- unit: string
- costPrice: number
- salePrice: number
- stock: number
- minStock: number
- active: boolean

### Customer
- id: number
- name: string
- phone?: string
- email?: string
- address?: string
- rfc?: string

### Sale
- id: number
- customerId?: number
- userId: number
- subtotal: number
- discount: number
- tax: number
- total: number
- paymentMethod: EFECTIVO|TARJETA|TRANSFERENCIA|FIADO
- paid: boolean

### Account
- id: number
- customerId: number
- balance: number
- creditLimit: number
- lastActivity: string (ISO)
