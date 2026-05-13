const prisma = require('../config/database');
const { createChatCompletion, createEmbedding } = require('./ollama.service');

const SYSTEM_PROMPT = `
Eres el asistente de FerreSync.
Responde solo con base en el CONTEXTO RECUPERADO.
Si la pregunta no esta relacionada con la app o no hay contexto suficiente, responde con el mensaje de rechazo.
No inventes datos.
Responde en espanol claro y breve.
`;

const FALLBACK_REPLY =
  process.env.RAG_FALLBACK_REPLY ||
  'Solo puedo responder preguntas sobre FerreSync y sus modulos.';

const RAG_TOP_K = Number.parseInt(process.env.RAG_TOP_K || '5', 10);
const RAG_MIN_SCORE = Number.parseFloat(process.env.RAG_MIN_SCORE || '0.35');
const RAG_MAX_CONTEXT_CHARS = Number.parseInt(process.env.RAG_MAX_CONTEXT_CHARS || '2000', 10);
const RAG_MAX_HISTORY = Number.parseInt(process.env.RAG_MAX_HISTORY || '8', 10);
const RAG_EMBEDDING_DIM = Number.parseInt(process.env.RAG_EMBEDDING_DIM || '768', 10);

const buildContextText = (chunks, maxChars) => {
  let context = '';

  for (const chunk of chunks) {
    const labelParts = [chunk.source];
    if (chunk.title) {
      labelParts.push(chunk.title);
    }

    const block = `Fuente: ${labelParts.join(' - ')}\n${chunk.content}`;
    const nextLength = context.length ? context.length + 2 + block.length : block.length;

    if (nextLength > maxChars) {
      break;
    }

    context = context ? `${context}\n\n${block}` : block;
  }

  return context.trim();
};

const sanitizeHistory = (history) => {
  if (!Array.isArray(history)) {
    return [];
  }

  const cleaned = history
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && item.content)
    .map((item) => ({ role: item.role, content: String(item.content) }));

  if (RAG_MAX_HISTORY <= 0) {
    return [];
  }

  return cleaned.slice(-RAG_MAX_HISTORY);
};

const getVectorLiteral = (embedding) => {
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error('Embedding is empty.');
  }

  if (embedding.length !== RAG_EMBEDDING_DIM) {
    throw new Error(`Embedding size mismatch. Expected ${RAG_EMBEDDING_DIM}, got ${embedding.length}.`);
  }

  const values = embedding.map((value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      throw new Error('Embedding contains non-numeric values.');
    }
    return numericValue;
  });

  return `[${values.join(',')}]`;
};

const retrieveRelevantChunks = async (message) => {
  const embedding = await createEmbedding(message);
  const vectorLiteral = getVectorLiteral(embedding);

  const rows = await prisma.$queryRaw`
    SELECT
      id,
      source,
      title,
      content,
      1 - (embedding <=> ${vectorLiteral}::vector) AS score
    FROM "KnowledgeChunk"
    ORDER BY embedding <=> ${vectorLiteral}::vector
    LIMIT ${RAG_TOP_K};
  `;

  const chunks = Array.isArray(rows)
    ? rows.map((row) => ({
        ...row,
        score: Number(row.score)
      }))
    : [];

  const filtered = chunks.filter((chunk) => Number.isFinite(chunk.score) && chunk.score >= RAG_MIN_SCORE);
  const context = buildContextText(filtered, RAG_MAX_CONTEXT_CHARS);
  const topScore = chunks[0]?.score || 0;

  return {
    context,
    topScore,
    chunks: filtered
  };
};

const getRagReply = async ({ message, history, memorySummary }) => {
  const { context, chunks } = await retrieveRelevantChunks(message);

  if (!context) {
    return {
      reply: FALLBACK_REPLY,
      usedContext: false,
      sources: []
    };
  }

  const memoryBlock = memorySummary ? `\n\nMEMORIA DE CONVERSACION:\n${memorySummary}` : '';
  const conversation = [
    {
      role: 'system',
      content: `${SYSTEM_PROMPT.trim()}${memoryBlock}\n\nCONTEXTO RECUPERADO:\n${context}`
    },
    ...sanitizeHistory(history),
    { role: 'user', content: String(message) }
  ];

  const reply = await createChatCompletion(conversation);

  return {
    reply,
    usedContext: true,
    sources: (chunks || []).map((chunk) => ({
      source: chunk.source,
      title: chunk.title || null,
      score: chunk.score
    }))
  };
};

module.exports = {
  getRagReply,
  retrieveRelevantChunks,
  buildContextText,
  SYSTEM_PROMPT,
  FALLBACK_REPLY
};
