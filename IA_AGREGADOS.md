# Informe de agregados IA (FerreSync)

## Resumen ejecutivo
Se integro un agente IA con RAG, herramientas de lectura/escritura, memoria persistente, trazabilidad de fuentes, feedback de calidad e insights proactivos. Todo corre local con Ollama y Postgres con pgvector.

## 1) RAG (Retrieval Augmented Generation)
- Base vectorial en Postgres (pgvector) con tabla KnowledgeChunk.
- Respuestas basadas en contexto recuperado; rechazo si no hay contexto suficiente.
- Documentos ingestados desde docs/ y raiz.
- Script de ingesta: npm run rag:ingest

## 2) Agente personalizado (tools)
- Motor de decision para elegir entre responder o ejecutar una herramienta.
- Confirmacion obligatoria para acciones de escritura (allowWrite=true).

### Tools disponibles
- list_low_stock
- get_daily_sales_summary
- find_product
- list_customers
- get_inventory_value
- build_cart_estimate (carrito estimado)
- create_customer (escritura, requiere confirmacion)
- create_inventory_movement (escritura, requiere confirmacion)

## 3) Proyecto ejemplo (cobertizo)
- Plantilla en docs/proyecto-cobertizo.md
- El agente pregunta medidas y genera carrito estimado usando inventario real.

## 4) Memoria persistente
- Se guardan sesiones y mensajes en BD.
- Se genera resumen automatico para mantener contexto largo.
- Se puede consultar historial por sesion.

## 5) Trazabilidad
- Cada respuesta devuelve meta con:
  - usedContext
  - toolUsed
  - sources (fuentes RAG)

## 6) Feedback de calidad
- Endpoint para calificar respuestas (1-5) y comentario opcional.

## 7) Insights proactivos
- Endpoint rapido con bajo stock, ventas del dia y valor de inventario.

## Endpoints nuevos
- POST /api/chatbot
  - body: { message, history?, allowWrite?, sessionId? }
  - response: { reply, sessionId, messageId, meta }
- POST /api/chatbot/feedback
  - body: { sessionId, messageId?, rating, note? }
- GET /api/chatbot/session/:id
- GET /api/chatbot/insights

## Modelos y migraciones
- KnowledgeChunk para RAG.
- ChatSession, ChatMessage, ChatSummary, ChatFeedback para memoria y feedback.
- Migraciones:
  - 20260427193000_add_rag
  - 20260427211500_add_chat_memory

## Servicios clave
- backend/src/services/ollama.service.js
- backend/src/services/rag.service.js
- backend/src/services/agent.service.js
- backend/src/services/agent-tools.service.js
- backend/src/services/chat-memory.service.js

## Documentos RAG
- docs/agent-profile.md
- docs/skills-flujos.md
- docs/flujo-modulos.md
- docs/proyecto-cobertizo.md
- docs/faq.md
- docs/ia-capacidades.md
- README.md
- COMANDOS_INICIO.md

## Requisitos para ejecutar
- Docker (Postgres con pgvector)
- Ollama
- Modelos:
  - llama3.2:3b (chat)
  - nomic-embed-text (embeddings)

## Scripts utiles
- npm run db:generate
- npm run db:migrate
- npm run rag:ingest
- npm run rag:ingest -- --reset

## Variables de entorno (opcionales)
- OLLAMA_BASE_URL
- OLLAMA_MODEL
- OLLAMA_EMBEDDING_MODEL
- RAG_TOP_K
- RAG_MIN_SCORE
- RAG_MAX_CONTEXT_CHARS
- RAG_EMBEDDING_DIM
- CHAT_MEMORY_HISTORY
- CHAT_SUMMARY_EVERY
- CHAT_SUMMARY_MAX_CHARS
- RAG_DECISION_TEMPERATURE
- RAG_RESPONSE_TEMPERATURE

## Verificacion rapida
- Pregunta interna: "Cuales son los modulos principales?" -> responde con POS/Inventario/etc.
- Pregunta externa: "Quien gano el mundial?" -> rechaza.
- Tool lectura: "Muestrame productos con bajo stock".
- Tool escritura: "Crea un cliente Juan Perez" -> pide confirmacion; repetir con allowWrite=true.
- Trazabilidad: ver meta.sources y meta.toolUsed.
