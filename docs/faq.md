# FAQ FerreSync

## Que es FerreSync?
Sistema de gestion para ferreterias con POS, inventario, clientes, cuentas por cobrar y reportes.

## Que modulos principales existen?
- POS
- Inventario
- Clientes
- Cuentas por cobrar
- Reportes

## Que puede hacer el asistente de IA?
- Responder dudas del sistema en lenguaje natural.
- Consultar inventario, stock, SKU y categoria de productos.
- Sugerir materiales para proyectos como pintura, estantes, muebles o reparaciones.
- Pedir confirmacion antes de ejecutar acciones de escritura.

## Como consulto inventario?
Puedes preguntar por un producto, un SKU o usar frases como "muéstrame el inventario actual" o "qué hay en stock". El asistente devuelve existencias, stock minimo y categoria cuando encuentra coincidencias.

## Que necesito para pedir una lista de materiales para pintar?
Lo ideal es indicar el tipo de superficie, metros aproximados, color deseado y si quieres una o varias manos de pintura. Con eso el asistente puede sugerir pintura, rodillo, brocha, lija, cinta y otros insumos segun el inventario.

## Que necesito para cotizar un estante o una repisa?
Conviene indicar medidas, material, cantidad de soportes y si la instalacion es decorativa o de carga. El asistente usa esa referencia para armar una propuesta de materiales mas contextualizada.

## Que datos pide el sistema para crear un cliente?
- Nombre obligatorio.
- Opcionales: telefono, correo, direccion y RFC.

## Cuándo pide confirmacion el asistente?
Cuando la respuesta implica una accion de escritura, como crear un cliente o registrar un cambio que afecte datos del sistema.

## Que pasa si no hay stock suficiente?
El asistente lo reporta y puede mostrar los productos faltantes para ayudarte a buscar alternativas o completar la compra.

## Que URLs usa el sistema?
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## Que puede hacer el asistente?
- Responder dudas sobre el sistema.
- Ejecutar acciones simples con confirmacion.
- Rechazar temas externos a la app.

## Como mantiene el contexto?
Guarda la conversacion por sesion y genera un resumen automatico para no perder contexto.
