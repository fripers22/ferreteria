require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const prisma = require('../config/database');
const { createEmbedding } = require('../services/ollama.service');

const ROOT_PATH = path.resolve(__dirname, '../../..');
const DEFAULT_FILES = [
  path.join(ROOT_PATH, 'README.md'),
  path.join(ROOT_PATH, 'COMANDOS_INICIO.md'),
  path.join(ROOT_PATH, 'docs', 'agent-profile.md'),
  path.join(ROOT_PATH, 'docs', 'skills-flujos.md'),
  path.join(ROOT_PATH, 'docs', 'faq.md'),
  path.join(ROOT_PATH, 'docs', 'flujo-modulos.md'),
  path.join(ROOT_PATH, 'docs', 'proyecto-cobertizo.md'),
  path.join(ROOT_PATH, 'docs', 'ia-capacidades.md'),
  path.join(ROOT_PATH, 'docs', 'modulos-api.md')
];

const CHUNK_MAX_CHARS = Number.parseInt(process.env.RAG_CHUNK_MAX_CHARS || '1200', 10);
const CHUNK_OVERLAP_CHARS = Number.parseInt(process.env.RAG_CHUNK_OVERLAP_CHARS || '200', 10);
const RAG_EMBEDDING_DIM = Number.parseInt(process.env.RAG_EMBEDDING_DIM || '768', 10);

const chunkText = (text, maxChars, overlapChars) => {
  const normalized = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return [];
  }

  const chunks = [];
  const step = Math.max(1, maxChars - overlapChars);

  for (let start = 0; start < normalized.length; start += step) {
    let end = Math.min(start + maxChars, normalized.length);
    let slice = normalized.slice(start, end);

    const lastBreak = slice.lastIndexOf('\n');
    if (lastBreak > 200) {
      end = start + lastBreak;
      slice = normalized.slice(start, end);
    }

    const trimmed = slice.trim();
    if (trimmed) {
      chunks.push(trimmed);
    }
  }

  return chunks;
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

const resolveInputFiles = (args) => {
  const files = args.filter((arg) => !arg.startsWith('--'));
  if (files.length === 0) {
    return DEFAULT_FILES;
  }

  return files.map((file) => path.resolve(ROOT_PATH, file));
};

const ingestFile = async (filePath) => {
  const content = await fs.readFile(filePath, 'utf8');
  const chunks = chunkText(content, CHUNK_MAX_CHARS, CHUNK_OVERLAP_CHARS);

  if (!chunks.length) {
    return 0;
  }

  const source = path.relative(ROOT_PATH, filePath).replace(/\\/g, '/');
  let inserted = 0;

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const embedding = await createEmbedding(chunk);
    const vectorLiteral = getVectorLiteral(embedding);
    const metadata = JSON.stringify({
      source,
      chunk: index + 1,
      totalChunks: chunks.length
    });

    await prisma.$executeRaw`
      INSERT INTO "KnowledgeChunk" ("source", "title", "content", "metadata", "embedding")
      VALUES (${source}, ${null}, ${chunk}, ${metadata}::jsonb, ${vectorLiteral}::vector)
    `;

    inserted += 1;
  }

  return inserted;
};

const run = async () => {
  const args = process.argv.slice(2);
  const shouldReset = args.includes('--reset');
  const filePaths = resolveInputFiles(args);

  if (shouldReset) {
    await prisma.$executeRaw`TRUNCATE TABLE "KnowledgeChunk" RESTART IDENTITY;`;
  }

  let totalInserted = 0;

  for (const filePath of filePaths) {
    try {
      const count = await ingestFile(filePath);
      totalInserted += count;
      console.log(`Ingested ${count} chunks from ${filePath}`);
    } catch (error) {
      console.error(`Failed to ingest ${filePath}:`, error.message);
    }
  }

  console.log(`Done. Total chunks inserted: ${totalInserted}`);
};

run()
  .catch((error) => {
    console.error('Ingestion failed:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
