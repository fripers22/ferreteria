const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GEMINI_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

const requestGemini = async (path, payload) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Falta configurar GEMINI_API_KEY en el backend.');
  }

  const response = await fetch(`${GEMINI_BASE_URL}${path}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const rawError = await response.text();
    throw new Error(`Gemini error (${response.status}): ${rawError}`);
  }

  return response.json();
};

const toGeminiContents = (messages) => {
  return (Array.isArray(messages) ? messages : [])
    .filter((message) => message && message.role && message.role !== 'system' && message.content)
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(message.content) }]
    }));
};

const getSystemInstruction = (messages) => {
  const systemMessage = (Array.isArray(messages) ? messages : []).find((message) => message?.role === 'system' && message.content);

  if (!systemMessage) {
    return undefined;
  }

  return {
    parts: [{ text: String(systemMessage.content) }]
  };
};

const createChatCompletion = async (messages, config = {}) => {
  const payload = {
    contents: toGeminiContents(messages),
    generationConfig: {
      temperature: Number.isFinite(config?.options?.temperature) ? config.options.temperature : 0.2,
      ...(config.format === 'json' ? { responseMimeType: 'application/json' } : {})
    }
  };

  const systemInstruction = getSystemInstruction(messages);
  if (systemInstruction) {
    payload.systemInstruction = systemInstruction;
  }

  const data = await requestGemini(`/models/${GEMINI_MODEL}:generateContent`, payload);

  const reply = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || '')
    .join('')
    .trim();

  if (!reply) {
    throw new Error('Gemini no retorno una respuesta valida.');
  }

  return reply;
};

const createEmbedding = async (input) => {
  const data = await requestGemini(`/models/${GEMINI_EMBEDDING_MODEL}:embedContent`, {
    content: {
      parts: [{ text: String(input) }]
    }
  });

  const embedding = data?.embedding?.values;
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error('Gemini no retorno un embedding valido.');
  }

  return embedding;
};

module.exports = {
  GEMINI_MODEL,
  GEMINI_EMBEDDING_MODEL,
  createChatCompletion,
  createEmbedding
};
