const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';
const OLLAMA_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';

const requestOllama = async (path, payload) => {
  const response = await fetch(`${OLLAMA_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const rawError = await response.text();
    throw new Error(`Ollama error (${response.status}): ${rawError}`);
  }

  return response.json();
};

const createChatCompletion = async (messages, config = {}) => {
  const payload = {
    model: OLLAMA_MODEL,
    messages,
    stream: false,
    options: {
      temperature: 0.2,
      ...(config.options || {})
    }
  };

  if (config.format) {
    payload.format = config.format;
  }

  const data = await requestOllama('/api/chat', payload);

  const reply = data?.message?.content?.trim();
  if (!reply) {
    throw new Error('Ollama did not return a valid reply.');
  }

  return reply;
};

const createEmbedding = async (input) => {
  const data = await requestOllama('/api/embeddings', {
    model: OLLAMA_EMBEDDING_MODEL,
    prompt: String(input)
  });

  const embedding = data?.embedding;
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error('Ollama did not return a valid embedding.');
  }

  return embedding;
};

module.exports = {
  OLLAMA_MODEL,
  OLLAMA_EMBEDDING_MODEL,
  createChatCompletion,
  createEmbedding
};
