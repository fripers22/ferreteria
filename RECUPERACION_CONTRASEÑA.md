# 🔐 Sistema de Recuperación de Contraseña - Guía Completa

## 📋 Resumen

He creado un sistema completo de recuperación de contraseña con las siguientes características:

✅ Solicitud de recuperación por email
✅ Generación de tokens seguros con expiración
✅ Verificación de tokens
✅ Actualización segura de contraseña
✅ Emails HTML profesionales
✅ Compatible con Mailgun y Resend (ambos gratuitos)

---

## 🚀 Pasos de Implementación

### 1️⃣ Actualizar la Base de Datos

```bash
cd backend

# Aplicar la migración que agrega:
# - Campo email a User
# - Tabla PasswordReset
npx prisma migrate dev --name add_password_reset

# O si usas Supabase:
npx prisma db push
```

### 2️⃣ Instalar Dependencias

```bash
cd backend

# Instalar axios para llamadas HTTP y crypto que ya viene con Node
npm install axios  # Si no está instalado
```

### 3️⃣ Elegir y Configurar Email Provider

#### Opción A: **Mailgun** (Recomendado - 5,000 emails/mes gratis)

1. **Crear cuenta en Mailgun:**
   - Ir a https://www.mailgun.com/
   - Registrarse con tu email
   - Verificar email

2. **Obtener credenciales:**
   - Ir a Dashboard
   - Click en "Sending" → "Domains"
   - Copiar tu dominio (ej: `sandboxXXXXXXX.mailgun.org`)
   - Copiar API Key (en Settings)

3. **Agregar variables de entorno** en `backend/.env`:

```env
# Email Configuration - Mailgun
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=tu_api_key_aqui
MAILGUN_DOMAIN=sandboxXXXXXXX.mailgun.org
MAILGUN_FROM_EMAIL=noreply@sandboxXXXXXXX.mailgun.org

# Frontend URL (importante para generar links)
FRONTEND_URL=http://localhost:5173
# O en producción:
# FRONTEND_URL=https://tu-dominio.com
```

#### Opción B: **Resend** (100 emails/día gratis)

1. **Crear cuenta en Resend:**
   - Ir a https://resend.com/
   - Registrarse

2. **Obtener API Key:**
   - Ir a Dashboard
   - Copiar API Key

3. **Agregar variables de entorno** en `backend/.env`:

```env
# Email Configuration - Resend
EMAIL_PROVIDER=resend
RESEND_API_KEY=tu_api_key_aqui
RESEND_FROM_EMAIL=noreply@resend.dev

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

#### Opción C: **Gmail + Nodemailer** (Ilimitado - tu propia cuenta)

```env
# Email Configuration - Gmail
EMAIL_PROVIDER=gmail
GMAIL_USER=tu_email@gmail.com
GMAIL_APP_PASSWORD=tu_contraseña_app_específica

# Generar contraseña de app:
# 1. Habilitar 2FA en tu cuenta Google
# 2. Ir a https://myaccount.google.com/apppasswords
# 3. Copiar la contraseña generada

FRONTEND_URL=http://localhost:5173
```

---

### 4️⃣ Registrar Rutas en el Backend

El archivo `backend/src/routes/index.js` ya está actualizado y exporta `passwordResetRoutes`.

Ahora necesitas registrarlo en `backend/src/index.js`:

```javascript
const routes = require('./routes');

// ... código existente ...

// Agregar la ruta de recuperación de contraseña
app.use('/api/password-reset', routes.passwordResetRoutes);
```

### 5️⃣ Crear Rutas en el Frontend

Actualiza el archivo `frontend/src/App.jsx` o tu router para agregar las nuevas páginas:

```jsx
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// En tu configuración de rutas:
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password/:token" element={<ResetPassword />} />
```

### 6️⃣ Actualizar el Componente de Login

Agregar enlace a "¿Olvidaste tu contraseña?" en `frontend/src/pages/Login.jsx`:

```jsx
<div className="text-center mt-4">
  <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
    ¿Olvidaste tu contraseña?
  </Link>
</div>
```

---

## 📦 Archivos Creados/Modificados

### Backend
- ✅ `backend/src/services/email.service.js` - Servicio de emails
- ✅ `backend/src/controllers/password-reset.controller.js` - Lógica de reset
- ✅ `backend/src/routes/password-reset.routes.js` - Rutas API
- ✅ `backend/prisma/schema.prisma` - Agregadas tabla PasswordReset y campo email a User
- ✅ `backend/src/routes/index.js` - Exporta nueva ruta

### Frontend
- ✅ `frontend/src/pages/ForgotPassword.jsx` - Formulario de solicitud
- ✅ `frontend/src/pages/ResetPassword.jsx` - Formulario de actualización

---

## 🧪 Cómo Funciona

### Flujo de Recuperación:

```
1. Usuario va a /forgot-password
   ↓
2. Ingresa su email
   ↓
3. Backend verifica si el email existe
   ↓
4. Si existe, genera token seguro + lo guarda en BD
   ↓
5. Envía email con link: /reset-password/{token}
   ↓
6. Usuario hace click en el email
   ↓
7. Frontend verifica que el token sea válido
   ↓
8. Muestra formulario para nueva contraseña
   ↓
9. Usuario ingresa nueva contraseña
   ↓
10. Backend hashea y actualiza contraseña
    ↓
11. Marca token como usado (no se puede reutilizar)
    ↓
12. Envía email de confirmación
    ↓
13. Redirecciona a login
```

---

## 🔐 Seguridad Implementada

✅ **Tokens únicos y seguros** - Generados con crypto.randomBytes()
✅ **Expiración** - Los tokens expiran en 1 hora
✅ **One-time use** - Los tokens no se pueden reutilizar
✅ **Contraseñas hasheadas** - Usando bcryptjs
✅ **No revelar información** - El sistema dice "si el email existe" sin confirmar
✅ **HTTPS en producción** - Los links incluyen el frontend URL

---

## 📊 Endpoints Disponibles

### 1. Solicitar Recuperación
```
POST /api/password-reset/request
Content-Type: application/json

{
  "email": "usuario@ejemplo.com"
}

Response:
{
  "message": "Si el email existe en nuestro sistema, recibirás un enlace de recuperación en 5 minutos"
}
```

### 2. Verificar Token
```
GET /api/password-reset/verify/{token}

Response:
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "admin",
    "fullName": "Administrador",
    "role": "ADMIN"
  }
}
```

### 3. Resetear Contraseña
```
POST /api/password-reset/reset
Content-Type: application/json

{
  "token": "xxxxx",
  "newPassword": "nuevaContraseña123"
}

Response:
{
  "message": "Contraseña actualizada exitosamente"
}
```

---

## 🐛 Solución de Problemas

### Error: "Cannot find module 'axios'"
```bash
cd backend
npm install axios
```

### Email no se envía
1. Verifica que las variables de entorno están correctas
2. En Mailgun: verifica que el dominio está en la lista autorizada
3. En Resend: verifica que tienes acceso a la API

### Token expirado
- Los tokens duran 1 hora
- Usuario debe solicitar uno nuevo

### Contraseña se actualiza pero no recibe email de confirmación
- Verifica la conexión de email
- Revisa los logs del servidor

---

## 📧 Comparativa de Proveedores

| Característica | Mailgun | Resend | Gmail |
|----------------|---------|--------|-------|
| Emails/mes | 5,000 | 3,000 | Ilimitado |
| Costo | Gratis | Gratis | Gratis (tu cuenta) |
| Facilidad | Media | Muy Fácil | Fácil |
| Dominio propio | Sí | Sí | No (solo Gmail) |
| Recomendado para | Producción | Desarrollo | Pequeños volúmenes |

---

## 🎯 Próximos Pasos

1. Elegir e instalar el proveedor de email
2. Agregar las variables de entorno
3. Ejecutar migración de BD
4. Registrar rutas en `backend/src/index.js`
5. Agregar rutas en frontend (App.jsx)
6. Actualizar componente Login
7. Actualizar seed para agregar emails a usuarios existentes
8. Probar con un email real

---

## 💡 Tips

- **En desarrollo:** Usa Mailgun o Resend (gratis y probado)
- **Dominios:** Si tienes dominio propio, configúralo en Mailgun
- **Eventos:** Mailgun permite trackear opens y clicks
- **Testing:** Los proveedores tienen sandbox para pruebas

¿Preguntas? Revisa los archivos comentados en el código.
