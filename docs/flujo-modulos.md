# Flujos y modulos de FerreSync

## Modulos
- POS: ventas rapidas, carrito y pago.
- Inventario: movimientos y control de stock minimo.
- Clientes: registro y consulta de historial.
- Cuentas por cobrar: ventas a credito (fiado) y pagos.
- Reportes: ventas del dia y resumen de inventario.

## Flujos clave

### Venta (POS)
1) Buscar producto por nombre, SKU o codigo de barras.
2) Agregar productos y cantidades al carrito.
3) Elegir metodo de pago (EFECTIVO, TARJETA, TRANSFERENCIA, FIADO).
4) Confirmar venta y registrar salida de inventario.
5) Si es FIADO, registrar cargo en cuenta del cliente.

### Inventario
1) Revisar productos con bajo stock.
2) Registrar entrada de mercancia.
3) Registrar salida por merma o ajuste.
4) Ver valor total del inventario.

### Clientes
1) Registrar cliente.
2) Consultar ventas y cuentas.

### Cuentas por cobrar
1) Registrar venta a credito.
2) Consultar saldo y limite.
3) Registrar pagos.

### Reportes
1) Consultar ventas del dia.
2) Revisar ticket promedio y total de transacciones.

## Endpoints principales
- POST /api/auth/login
- GET /api/auth/profile
- GET /api/products
- POST /api/products
- GET /api/inventory/low-stock
- POST /api/inventory/movements
- GET /api/sales/daily
- POST /api/sales
- GET /api/customers
- POST /api/customers
- POST /api/accounts/payment
- POST /api/chatbot
