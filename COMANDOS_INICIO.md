# Comandos para iniciar el proyecto

## 1) Primera vez (configuración inicial)

### Desde la raíz del proyecto
```bash
docker-compose up -d
```

### Backend
```bash
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run rag:ingest
## Nota
Si cambias documentos o reglas, vuelve a correr:
```bash
npm run rag:ingest -- --reset
```
```

### IA local (Ollama)
```bash
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```
> Asegurate de tener Ollama abierto (usa `http://localhost:11434`).

### Frontend
```bash
cd ../frontend
npm install
```

## 2) Iniciar el proyecto (uso diario)

### Opción recomendada: 3 terminales

### Terminal 1 (Ollama - Chatbot IA)
```bash
ollama serve
```
> Si ya tienes Ollama abierto como aplicación, este paso puede no ser necesario.

### Terminal 2 (Backend)
```bash
cd backend
npm run dev
```

### Terminal 3 (Frontend)
```bash
cd frontend
npm run dev
```

## 3) URLs de acceso

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- Ollama API: http://localhost:11434

## 4) Apagar servicios

### Detener PostgreSQL (Docker)
```bash
docker-compose down
```

### Nota
Si no tienes la base de datos corriendo, vuelve a ejecutar:
```bash
docker-compose up -d
```
