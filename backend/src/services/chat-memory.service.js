const { randomUUID } = require('crypto');
const prisma = require('../config/database');
const { createChatCompletion } = require('./ollama.service');

const CHAT_MEMORY_HISTORY = Number.parseInt(process.env.CHAT_MEMORY_HISTORY || '12', 10);
const CHAT_SUMMARY_EVERY = Number.parseInt(process.env.CHAT_SUMMARY_EVERY || '16', 10);
const CHAT_SUMMARY_MAX_CHARS = Number.parseInt(process.env.CHAT_SUMMARY_MAX_CHARS || '1200', 10);

const getOrCreateSession = async ({ sessionId, userId }) => {
  if (sessionId) {
    const existing = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (existing) {
      return existing;
    }
    return prisma.chatSession.create({
      data: {
        id: sessionId,
        userId: userId || null
      }
    });
  }

  return prisma.chatSession.create({
    data: {
      id: randomUUID(),
      userId: userId || null
    }
  });
};

const getSummary = async (sessionId) => {
  const summary = await prisma.chatSummary.findUnique({ where: { sessionId } });
  return summary?.summary || null;
};

const getRecentMessages = async (sessionId) => {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    take: CHAT_MEMORY_HISTORY
  });

  return messages
    .reverse()
    .map((message) => ({ role: message.role, content: message.content, id: message.id }));
};

const storeMessage = async ({ sessionId, userId, role, content }) => {
  return prisma.chatMessage.create({
    data: {
      sessionId,
      userId: userId || null,
      role,
      content: String(content)
    }
  });
};

const buildSummaryPrompt = (previousSummary, messages) => {
  const transcript = messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join('\n');

  return [
    {
      role: 'system',
      content: `
Resume la conversacion para FerreSync en maximo 120 palabras.
Guarda datos utiles: objetivos, preferencias, acciones solicitadas y resultados.
No inventes datos.
`
        .trim()
    },
    {
      role: 'user',
      content: `
RESUMEN ANTERIOR:
${previousSummary || 'SIN RESUMEN'}

MENSAJES RECIENTES:
${transcript}

Genera un nuevo resumen consolidado.
`
        .trim()
    }
  ];
};

const updateSummaryIfNeeded = async (sessionId) => {
  if (CHAT_SUMMARY_EVERY <= 0) {
    return null;
  }

  const summary = await prisma.chatSummary.findUnique({ where: { sessionId } });
  const sinceDate = summary?.updatedAt || summary?.createdAt || null;

  const messages = await prisma.chatMessage.findMany({
    where: {
      sessionId,
      ...(sinceDate ? { createdAt: { gt: sinceDate } } : {})
    },
    orderBy: { createdAt: 'asc' },
    take: CHAT_SUMMARY_EVERY + 6
  });

  if (messages.length < CHAT_SUMMARY_EVERY) {
    return summary?.summary || null;
  }

  const prompt = buildSummaryPrompt(summary?.summary || null, messages);
  const summaryText = await createChatCompletion(prompt, {
    options: { temperature: 0.1 }
  });

  const clippedSummary = summaryText.slice(0, CHAT_SUMMARY_MAX_CHARS).trim();

  if (!clippedSummary) {
    return summary?.summary || null;
  }

  await prisma.chatSummary.upsert({
    where: { sessionId },
    update: { summary: clippedSummary },
    create: { sessionId, summary: clippedSummary }
  });

  return clippedSummary;
};

module.exports = {
  getOrCreateSession,
  getSummary,
  getRecentMessages,
  storeMessage,
  updateSummaryIfNeeded
};
