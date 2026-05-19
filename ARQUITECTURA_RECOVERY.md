# 🏗️ Arquitectura del Sistema de Recuperación de Contraseña

## 📐 Estructura General

```
┌─────────────────────────────────────────────────────────────────┐
│                          🌐 FRONTEND (React)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │  Login.jsx       │              │ Navbar/Menu      │         │
│  │  [NUEVO LINK]    │              │                  │         │
│  │ "¿Olvidó pwd?"   │              │  "Recuperar"     │         │
│  └────────┬─────────┘              └────────┬─────────┘         │
│           │                                  │                   │
│           ▼                                  ▼                   │
│  ┌────────────────────────┐    ┌─────────────────────────────┐ │
│  │ ForgotPassword.jsx     │    │ ResetPassword.jsx           │ │
│  │                        │    │ (url: /reset/:token)        │ │
│  │ 1. Email input         │    │                             │ │
│  │ 2. Envía POST          │    │ 1. Verifica token (GET)    │ │
│  │ 3. Muestra mensaje     │    │ 2. Muestra datos usuario   │ │
│  │ 4. Redirige a email    │    │ 3. Input nueva contraseña  │ │
│  └────────┬───────────────┘    │ 4. Envía POST reset        │ │
│           │                     │ 5. Redirige a login        │ │
│           └─────────┬───────────┘                             │ │
│                     │                                          │ │
└─────────────────────┼──────────────────────────────────────────┘
                      │
                      │ HTTP Requests
                      │
┌─────────────────────▼──────────────────────────────────────────┐
│                    🔌 BACKEND (Node.js/Express)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Routes: password-reset.routes.js                        │  │
│  │                                                          │  │
│  │  POST   /api/password-reset/request                     │  │
│  │  GET    /api/password-reset/verify/:token               │  │
│  │  POST   /api/password-reset/reset                       │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Controller: password-reset.controller.js                │  │
│  │                                                          │  │
│  │  requestPasswordReset()                                 │  │
│  │  ├─ Valida email                                        │  │
│  │  ├─ Busca usuario                                       │  │
│  │  ├─ Genera token                                        │  │
│  │  ├─ Guarda en BD                                        │  │
│  │  └─ Envía email                                         │  │
│  │                                                          │  │
│  │  verifyResetToken()                                     │  │
│  │  ├─ Busca token en BD                                   │  │
│  │  ├─ Valida expiración                                   │  │
│  │  └─ Retorna datos usuario                               │  │
│  │                                                          │  │
│  │  resetPassword()                                        │  │
│  │  ├─ Valida token                                        │  │
│  │  ├─ Hashea contraseña                                   │  │
│  │  ├─ Actualiza en BD                                     │  │
│  │  ├─ Marca token como usado                              │  │
│  │  └─ Envía confirmación                                  │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                              │
│                   ▼                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Service: email.service.js                               │  │
│  │                                                          │  │
│  │  sendPasswordResetEmail()                               │  │
│  │  sendPasswordChangedEmail()                             │  │
│  │                                                          │  │
│  │  Support: Mailgun | Resend | Gmail                      │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                              │
│                   ▼                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Database: Prisma ORM                                    │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │ User Table                                       │   │  │
│  │  ├─ id (INT) [PK]                                  │   │  │
│  │  ├─ username (STRING) [UNIQUE]                    │   │  │
│  │  ├─ email (STRING) [UNIQUE] ⭐ NUEVO               │   │  │
│  │  ├─ password (STRING)                             │   │  │
│  │  ├─ fullName (STRING)                             │   │  │
│  │  ├─ role (ENUM: ADMIN, VENDEDOR)                 │   │  │
│  │  └─ timestamps                                     │   │  │
│  │  └─ passwordResets (Relation)                     │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │ PasswordReset Table ⭐ NUEVA                    │   │  │
│  │  ├─ id (INT) [PK]                                  │   │  │
│  │  ├─ userId (INT) [FK → User]                       │   │  │
│  │  ├─ token (STRING) [UNIQUE]                        │   │  │
│  │  ├─ email (STRING)                                 │   │  │
│  │  ├─ expiresAt (TIMESTAMP)                          │   │  │
│  │  ├─ used (BOOLEAN)                                 │   │  │
│  │  └─ createdAt (TIMESTAMP)                          │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                      │
                      │ SMTP/API Calls
                      │
┌─────────────────────▼──────────────────────────────────────────┐
│                  📧 EMAIL PROVIDERS (3 opciones)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│  │ 🎯 MAILGUN       │  │ ⚡ RESEND        │  │ 📬 GMAIL    │  │
│  ├──────────────────┤  ├──────────────────┤  ├─────────────┤  │
│  │ Gratis 5k/mes    │  │ Gratis 100/día   │  │ Gratis ∞    │  │
│  │ API v3           │  │ Moderno          │  │ SMTP        │  │
│  │ Dominio propio   │  │ Sin complicaciones│  │ Tu cuenta   │  │
│  │ Sandbox mode     │  │ Mejor soporte    │  │ Básico      │  │
│  │ Eventos tracking │  │ Testing fácil    │  │             │  │
│  └──────────────────┘  └──────────────────┘  └─────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                      │
                      │ Email delivery
                      │
┌─────────────────────▼──────────────────────────────────────────┐
│                    📬 USUARIO (Bandeja entrada)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Email From: noreply@ferresync.com                               │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🔐 Recupera tu contraseña en FerreSync                  │  │
│  │                                                          │  │
│  │ Hola {user.fullName},                                   │  │
│  │                                                          │  │
│  │ Recibimos una solicitud para recuperar tu contraseña... │  │
│  │                                                          │  │
│  │ [BOTÓN] Recuperar Contraseña                           │  │
│  │ https://yourapp.com/reset-password/{token}             │  │
│  │                                                          │  │
│  │ ⚠️ Este enlace expira en 1 hora                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Datos (Request Response)

### 1️⃣ Solicitar Recuperación

```
Cliente                    Servidor                 Base de Datos
  │                          │                           │
  ├─ POST /password-reset/request ──────────────────>  │
  │  { email: "user@ex.com" }                           │
  │                          │                           │
  │                          ├─ Busca usuario ──────>   │
  │                          │                    <─────┤
  │                          ├─ Genera token            │
  │                          │                           │
  │                          ├─ INSERT PasswordReset ──>│
  │                          │                    <─────┤
  │                          │                           │
  │                          ├─ Envía email (Mailgun)   │
  │                          │                           │
  │  <─────────── { message: "..." } ───────────────────┤
  │
  └─> 📧 Usuario recibe email con link
```

### 2️⃣ Verificar Token

```
Cliente                    Servidor                 Base de Datos
  │                          │                           │
  ├─ GET /password-reset/verify/{token} ────────────>  │
  │                          │                           │
  │                          ├─ Busca token ─────────>  │
  │                          │                    <─────┤
  │                          │                           │
  │                          ├─ Valida expiración       │
  │                          ├─ Valida si fue usado      │
  │                          │                           │
  │  <─ { valid: true, user: {...} } ──────────────────┤
  │
  └─> ✅ Muestra formulario de cambio
```

### 3️⃣ Resetear Contraseña

```
Cliente                    Servidor                 Base de Datos
  │                          │                           │
  ├─ POST /password-reset/reset ──────────────────────>│
  │  { token, newPassword }                             │
  │                          │                           │
  │                          ├─ Valida token ────────>  │
  │                          │                    <─────┤
  │                          │                           │
  │                          ├─ Hash contraseña         │
  │                          │                           │
  │                          ├─ UPDATE User ───────────>│
  │                          │                    <─────┤
  │                          │                           │
  │                          ├─ UPDATE PasswordReset ──>│
  │                          │ (used = true)      <─────┤
  │                          │                           │
  │                          ├─ Envía confirmación      │
  │                          │                           │
  │  <─ { message: "Actualizado" } ───────────────────┤
  │
  └─> 🔄 Redirecciona a login
```

---

## 🔐 Seguridad en Capas

```
┌─────────────────────────────────────────────────┐
│           CAPA 1: VALIDACIÓN (Cliente)          │
├─────────────────────────────────────────────────┤
│ ✅ Email válido                                 │
│ ✅ Contraseña ≥ 6 caracteres                    │
│ ✅ Contraseñas coinciden                        │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│         CAPA 2: VALIDACIÓN (Servidor)           │
├─────────────────────────────────────────────────┤
│ ✅ Token existe                                 │
│ ✅ Token no expirado                            │
│ ✅ Token no fue usado                           │
│ ✅ Email registrado                             │
│ ✅ Contraseña válida                            │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│     CAPA 3: CRIPTOGRAFÍA (Database)             │
├─────────────────────────────────────────────────┤
│ ✅ Token: crypto.randomBytes (32 bytes hex)    │
│ ✅ Contraseña: bcryptjs (rounds: 10)           │
│ ✅ Expiración: 1 hora (no reversible)          │
│ ✅ One-time use: flag "used"                    │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│    CAPA 4: PRIVACIDAD (Información Leak)        │
├─────────────────────────────────────────────────┤
│ ✅ No revelar si email existe                   │
│ ✅ Mensajes genéricos                           │
│ ✅ HTTPS en producción                          │
│ ✅ Logs sin datos sensibles                     │
└─────────────────────────────────────────────────┘
```

---

## 🎨 Componentes React (Estructura)

```
ForgotPassword.jsx
├─ State: email, loading, error, message
├─ Handler: handleSearchEmail()
└─ UI:
   ├─ Header (titulo + icono)
   ├─ Input (email)
   ├─ Messages (error/success)
   └─ Button (submit)

ResetPassword.jsx
├─ Effect: verificar token al montar
├─ State: user, newPassword, confirmPassword, etc
├─ Handlers:
│  ├─ handleResetPassword()
│  └─ toggleShowPassword()
└─ UI:
   ├─ Verificación (cargando)
   ├─ Error (token expirado)
   ├─ Info usuario
   ├─ Input (nueva contraseña)
   ├─ Input (confirmar)
   ├─ Messages
   └─ Button (submit)
```

---

## 📊 Timeline (Cronograma)

```
[Ahora] ────────────────────────────────────────────────────>

  │
  ├─ Usuario solicita recuperar ────────────────────────────┐
  │                                                          │
  ├─ Email enviado                                          │
  │                                                          │
  ├─ Usuario recibe email & hace click [MANUAL ~5min]       │
  │                                                          │
  ├─ Token verificado ✅                                    │
  │                                                          │
  ├─ Usuario ingresa nueva contraseña                       │
  │                                                          │
  ├─ Contraseña actualizada ✅                              │
  │                                                          │
  ├─ Email de confirmación enviado                          │
  │                                                          │
  └─ Usuario login con nueva contraseña ✅                  │

Duración total: ~10 minutos (depende del usuario)
```

---

## 🔌 Integración con Proyecto Existente

```
Proyecto Actual                  Nuevos Componentes
─────────────────                ──────────────────

backend/
├─ src/
│  ├─ controllers/
│  │  ├─ auth.controller.js      password-reset.controller.js ⭐
│  │  └─ ...
│  │
│  ├─ routes/
│  │  ├─ auth.routes.js          password-reset.routes.js ⭐
│  │  ├─ index.js ◄────────────────────────────── actualizado ⭐
│  │  └─ ...
│  │
│  └─ services/
│     ├─ agent.service.js
│     └─ email.service.js ⭐
│
frontend/
├─ src/
│  ├─ pages/
│  │  ├─ Login.jsx ◄────────────── link agregado ⭐
│  │  ├─ ForgotPassword.jsx ⭐
│  │  ├─ ResetPassword.jsx ⭐
│  │  └─ ...
│  │
│  └─ App.jsx ◄────────────────── rutas agregadas ⭐
│
prisma/
└─ schema.prisma ◄────────────── tabla + campo agregados ⭐
```

---

## 💾 Persistencia de Datos

```
Request 1                         BD After                    Request 2
─────────                         ─────────                   ─────────

{ email: "a@ex" }
      ↓
[CREATE PasswordReset]
      ↓
PasswordReset {
  id: 1,
  userId: 5,
  token: "abc123...",
  email: "a@ex.com",
  expiresAt: 2025-05-13T15:00:00Z,
  used: false,  ← Aún no usado
  createdAt: 2025-05-13T14:00:00Z
}
                                                      [GET /verify/abc123]
                                                           ↓
                                                    Token válido ✅
                                                           ↓
                                                  [POST /reset token]
                                                           ↓
                                                  [UPDATE User pwd]
                                                  [UPDATE PasswordReset]
                                                           ↓
                                                  PasswordReset {
                                                    ...
                                                    used: true  ← Ahora usado
                                                  }
```

---

Esta arquitectura permite:
✅ Recuperación segura de contraseña
✅ Tokens con expiración
✅ One-time use
✅ Auditoria de intentos
✅ Emails profesionales
✅ Escalabilidad
