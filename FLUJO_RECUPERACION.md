# Diagrama de Flujo - Recuperación de Contraseña

## Flujo Completo

```mermaid
graph TD
    A["🔐 Usuario en Login"] -->|Click| B["¿Olvidaste tu contraseña?"]
    B --> C["📄 ForgotPassword.jsx"]
    C --> D["Ingresa Email"]
    D --> E{"Email<br/>Válido?"}
    E -->|No| F["❌ Error"]
    E -->|Sí| G["📬 POST /password-reset/request"]
    
    G --> H["🔍 Backend busca usuario"]
    H --> I{"Usuario<br/>Existe?"}
    I -->|No| J["✅ Respuesta genérica<br/>por seguridad"]
    I -->|Sí| K["🔑 Genera token seguro<br/>crypto.randomBytes"]
    
    K --> L["💾 Guarda PasswordReset<br/>en BD"]
    L --> M["✉️ Construye URL<br/>reset-password/{token}"]
    M --> N["📧 Envía email<br/>vía Mailgun/Resend"]
    N --> O["✅ Respuesta<br/>al usuario"]
    
    O --> P["📧 Usuario revisa email"]
    P --> Q["🔗 Click en enlace"]
    Q --> R["🎯 ResetPassword.jsx"]
    R --> S["🔐 GET /password-reset/verify/{token}"]
    
    S --> T{"Token<br/>Válido?"}
    T -->|No| U["❌ Token inválido/expirado"]
    T -->|Sí| V["✅ Muestra datos usuario"]
    
    V --> W["Ingresa nueva contraseña"]
    W --> X{"Contraseñas<br/>coinciden?"}
    X -->|No| Y["❌ Error"]
    X -->|Sí| Z["📬 POST /password-reset/reset"]
    
    Z --> AA["🔓 Verifica token nuevamente"]
    AA --> AB["🔐 Hash contraseña"]
    AB --> AC["💾 Actualiza en BD"]
    AC --> AD["⛔ Marca token como usado"]
    AD --> AE["📧 Envía email de confirmación"]
    AE --> AF["✅ Contraseña actualizada"]
    
    AF --> AG["🔄 Redirecciona a Login"]
    AG --> AH["✅ Login con nueva contraseña"]
```

## Base de Datos

```mermaid
erDiagram
    USER ||--o{ PASSWORD_RESET : has
    
    USER {
        int id PK
        string username UK
        string email UK
        string password
        string fullName
        enum role
        boolean active
        timestamp createdAt
        timestamp updatedAt
    }
    
    PASSWORD_RESET {
        int id PK
        int userId FK
        string token UK
        string email
        timestamp expiresAt
        boolean used
        timestamp createdAt
    }
```

## Tabla PasswordReset

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PRIMARY KEY | ID único |
| userId | INT FOREIGN KEY | Relación con User |
| token | STRING UNIQUE | Token de recuperación |
| email | STRING | Email para confirmación |
| expiresAt | TIMESTAMP | Expiración en 1 hora |
| used | BOOLEAN | Flag de una sola use |
| createdAt | TIMESTAMP | Fecha de creación |

## Seguridad de Tokens

```
Generación:
random bytes → 32 bytes → hex string
❌ Predecibles
✅ Criptográficamente seguros
✅ Únicos
✅ No reversibles

Ejemplo Token:
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

## Seguridad de Contraseña

```
Nueva contraseña
      ↓
bcryptjs.hash()
      ↓
Rounds = 10 (configurable)
      ↓
$2a$10$XL6Zr7VlvXHLflU8kTvu2O8d71wicHUl/.VoPC6Axx6AkPOPTo2yq
```

## Estados Posibles

```
Token Válido:
✅ Existe en BD
✅ No está marcado como usado
✅ No ha expirado (< 1 hora)
→ Usuario puede resetear contraseña

Token Inválido:
❌ No existe en BD
✅ Ya fue usado
✅ Expiró
→ Usuario debe solicitar nuevo token
```
