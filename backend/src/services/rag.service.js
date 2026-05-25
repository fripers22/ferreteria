const prisma = require('../config/database');
const { createChatCompletion, createEmbedding } = require('./ollama.service');

const SYSTEM_PROMPT = `
Eres el asistente de FerreSync.
Responde primero con base en el CONTEXTO RECUPERADO cuando exista.
Si no hay contexto suficiente, responde con criterio practico y general de ferreteria, herramientas, materiales y seguridad.
Si el usuario pregunta algo de FerreSync, usa el contexto recuperado y no inventes datos del sistema.
Si la pregunta es totalmente ajena a FerreSync y a ferreteria, responde con el mensaje de rechazo.
Cuando la consulta sea de ferreteria, estructura la respuesta con enfoque practico: comparacion, compatibilidad, cantidad, seguridad, pasos y mantenimiento segun aplique.
No inventes datos.
Responde en espanol claro y breve.
`;

const FALLBACK_REPLY =
  process.env.RAG_FALLBACK_REPLY ||
  'Puedo ayudarte con FerreSync y con consultas practicas de ferreteria, materiales y herramientas.';

const FERRETERIA_CONTEXTS = [
  {
    name: 'comparacion',
    patterns: /(conviene mas|conviene más|que es mejor|qué es mejor|comparacion|comparación|diferencia entre|brocha o rodillo|rodillo o brocha|taquete o ancla|ancla o taquete)/i,
    guidance: [
      'Cuando pidan comparar productos, explica para que sirve cada opcion, en que superficie funciona mejor y en que caso conviene una u otra.',
      'Si el usuario pregunta por dos alternativas, responde con criterios de uso, resistencia, costo, facilidad de instalacion y durabilidad.',
      'Si no hay un ganador absoluto, di que depende del objetivo, la carga, la superficie y el presupuesto.'
    ]
  },
  {
    name: 'presupuesto_nivel',
    patterns: /(economico|económico|intermedio|medio|premium|alto rendimiento|bajo presupuesto|gama alta|gama media)/i,
    guidance: [
      'Cuando pidan una recomendacion por presupuesto, divide la respuesta en opcion economica, intermedia y premium.',
      'Aclara que economico prioriza precio, intermedio balancea costo y duracion, y premium prioriza vida util y mejor acabado.',
      'Si faltan datos, pide si quieren ahorrar, durabilidad o mejor acabado.'
    ]
  },
  {
    name: 'compatibilidad_materiales',
    patterns: /(block|tablaroca|concreto|madera|metal|superficie|pared de block|pared de tablaroca|muro|muros?)/i,
    guidance: [
      'Identifica la superficie antes de recomendar materiales porque cambia el anclaje, broca, adhesivo, pintura y fijacion.',
      'Para block y concreto, suele requerirse taquete o anclaje mas robusto; para tablaroca, fijaciones especificas de placa; para madera, tornilleria para madera; para metal, tornilleria o fijacion metalica adecuada.',
      'Pregunta si la superficie es hueca, solida, porosa o expuesta a humedad.'
    ]
  },
  {
    name: 'cantidad_merma',
    patterns: /(cuantos comprar|cuanto comprar|cantidad|merma|rendimiento|rinde|extra|sobrante|metraje|metros cuadrados|cuantos litros|cuantos kilos)/i,
    guidance: [
      'Cuando pidan cantidad, explica que debes considerar medidas, rendimiento del producto y un margen extra por merma o ajuste.',
      'Para pintura o recubrimientos, pregunta metros cuadrados y numero de manos; para fijaciones, pregunta cantidad de puntos de sujecion.',
      'Si hace falta precision, sugiere agregar un 5% a 10% extra por cortes, desperdicio o reposicion.'
    ]
  },
  {
    name: 'seguridad_tarea',
    patterns: /(seguridad|proteccion|protección|guantes|lentes|casco|mascarilla|cubrebocas|careta|pintura|corte|perforacion|perforación|electricidad|plomeria|plomería)/i,
    guidance: [
      'Adapta la seguridad al trabajo: pintura requiere respiracion y lentes; corte requiere lentes y guantes; perforacion requiere proteccion ocular y auditiva; electricidad requiere herramientas aisladas; plomeria puede requerir guantes y cierre de agua.',
      'Si la consulta es por una tarea especifica, menciona el EPP minimo antes de listar materiales.',
      'Mantente practico: indica protecciones realmente utiles y no una lista excesiva.'
    ]
  },
  {
    name: 'sustitutos',
    patterns: /(sustituto|sustitutos|alternativa|alternativas|equivalente|equivalentes|no hay stock|sin stock|agotado|no encontro|no encontré)/i,
    guidance: [
      'Si no hay stock, ofrece productos equivalentes por funcion y no solo por nombre.',
      'Propone alternativas por material, medida, resistencia o marca, dejando claro el posible cambio de desempeño.',
      'Si existe duda, sugiere la alternativa mas segura antes que una mas barata.'
    ]
  },
  {
    name: 'dificultad',
    patterns: /(basico|básico|medio|avanzado|nivel de dificultad|facil|fácil|dificil|difícil|principiante|experto)/i,
    guidance: [
      'Cuando pidan dificultad, clasifica el trabajo en basico, medio o avanzado segun herramientas, precision y riesgo.',
      'Bajo dificultad basica van tareas simples como fijar, medir o pintar superficies pequenas; intermedio cubre instalacion y armado; avanzado cubre electricidad, estructuras o cortes precisos.',
      'Si el nivel es alto, recomienda contar con experiencia o apoyo tecnico.'
    ]
  },
  {
    name: 'pasos_preparacion',
    patterns: /(pasos|proceso|orden|preparacion|preparación|como hacerlo|cómo hacerlo|antes de|primero|después|despues)/i,
    guidance: [
      'Cuando pidan pasos, da un orden simple: preparacion de superficie, medicion, corte o perforacion, fijacion, ajuste y revision final.',
      'No solo enumeres materiales; indica el orden de uso para que el usuario pueda ejecutar el proyecto.',
      'Si aplica, incluye tiempos de secado, curado o revisiones intermedias.'
    ]
  },
  {
    name: 'mantenimiento_duracion',
    patterns: /(mantenimiento|duracion|duración|vida util|vida útil|anticorrosion|anticorrosión|sellador|repintado|repintar|fijacion|fijación|revisar)/i,
    guidance: [
      'Si preguntan por duracion o mantenimiento, sugiere revisiones periodicas, limpieza, retoque de pintura, reapriete de tornilleria o reaplicacion de sellador.',
      'Para metal, recuerda proteccion anticorrosiva; para exterior, considera humedad y sol; para fijaciones, revisa carga y aflojamiento con el tiempo.',
      'Aclara que la vida util depende del uso, ambiente y calidad del material.'
    ]
  },
  {
    name: 'uso_final',
    patterns: /(librero|libreros|repisa|repisas|estante|estantes|exterior|humedad|carga pesada|peso pesado|cargar peso|soportar peso|biblioteca)/i,
    guidance: [
      'Valida el uso final antes de recomendar: no es lo mismo una repisa decorativa que un librero de carga pesada o un trabajo en exterior.',
      'Para carga pesada, prioriza anclaje, resistencia del soporte y materiales mas robustos.',
      'Para humedad o exterior, recomienda materiales y acabados resistentes a agua, sol y corrosion.'
    ]
  },
  {
    name: 'presupuesto',
    patterns: /(presupuesto|cotizacion|cotización|precio|costo|coste|cuanto cuesta|cuanto necesito|cantidad de material)/i,
    guidance: [
      'Cuando pidan presupuesto, separa materiales principales, consumibles, herramientas y proteccion personal.',
      'Pide medidas, cantidad, calidad deseada y si el usuario quiere una opcion economica, intermedia o premium.',
      'Aclara que el costo final depende de marca, rendimiento, acabados y mano de obra si aplica.'
    ]
  },
  {
    name: 'medidas',
    patterns: /(medidas|medir|metro|metros|largo|ancho|alto|profundidad|dimensiones|tamano|tamaño)/i,
    guidance: [
      'Si faltan medidas, pide largo, ancho, alto y espesor o diametro segun el proyecto.',
      'Sugiere agregar un 5% a 10% extra por merma, cortes o ajustes.',
      'Cuando haya dudas, recomienda medir dos veces antes de comprar.'
    ]
  },
  {
    name: 'superficie',
    patterns: /(block|tablaroca|concreto|madera|metal|pared|techo|piso|superficie|muros?)/i,
    guidance: [
      'Identifica la superficie porque cambia el tipo de anclaje, adhesivo, pintura, broca y preparacion.',
      'Pide si la superficie es lisa, porosa, humeda, exterior o interior.',
      'Explica que el material recomendado depende de la absorcion y resistencia de la base.'
    ]
  },
  {
    name: 'instalacion',
    patterns: /(instalar|instalacion|instalación|montar|colocar|fijar|anclar|sujetar|armar|ensamblar)/i,
    guidance: [
      'Cuando sea una instalacion, pide si es nueva, reemplazo o reparacion.',
      'Sugiere verificar nivel, alineacion, anclajes y capacidad de carga antes de cerrar la lista.',
      'Incluye herramientas de medicion, perforacion y ajuste segun el caso.'
    ]
  },
  {
    name: 'acabados',
    patterns: /(acabado|acabados|barniz|sellador|pintura|lijado|pulido|textura|resane|resanar)/i,
    guidance: [
      'Para acabados, separa preparacion de superficie, aplicacion y proteccion final.',
      'Si piden pintura o barniz, pregunta por brillo, color, interior/exterior y numero de manos.',
      'Menciona lijas de grano adecuado y limpieza previa antes de aplicar el acabado.'
    ]
  },
  {
    name: 'reparacion',
    patterns: /(reparar|reparacion|reparación|mantenimiento|arreglo|arreglar|restaurar|desperfecto|rotura)/i,
    guidance: [
      'Si es reparacion, pregunta primero que esta dañado y si se busca arreglo temporal o definitivo.',
      'Sugiere diagnosticar la causa antes de comprar material de reemplazo.',
      'Distingue entre reparar una pieza, reforzarla o sustituirla por completo.'
    ]
  },
  {
    name: 'adhesivos',
    patterns: /(pegamento|adhesivo|silicon|silicón|cemento|mortero|resina|epoxico|epóxico|fijador)/i,
    guidance: [
      'Cuando pidan adhesivos, especifica si sirven para madera, metal, ceramica, PVC o muro.',
      'Pide tiempo de secado, resistencia y si la union estara expuesta a humedad o calor.',
      'Aconseja limpiar y secar la superficie antes de aplicar.'
    ]
  },
  {
    name: 'corte',
    patterns: /(cortar|corte|sierra|serrucho|segueta|esmeril|disco|madera|metal|ceramica|cerámica)/i,
    guidance: [
      'Para cortes, pregunta el material a cortar y el tipo de herramienta disponible.',
      'Sugiere disco, hoja o segueta adecuados al material para evitar rebabas o roturas.',
      'Incluye proteccion ocular y de manos como parte de la respuesta.'
    ]
  },
  {
    name: 'exteriores',
    patterns: /(exterior|exteriores|intemperie|lluvia|sol|patio|jardin|jardín|terraza|fascia|fachada)/i,
    guidance: [
      'Para trabajos en exterior, menciona materiales resistentes a humedad, rayos UV y corrosion cuando aplique.',
      'Pide si estara expuesto a lluvia, sol directo o cambios de temperatura.',
      'Sugiere selladores, galvanizado o proteccion anticorrosiva segun el caso.'
    ]
  },
  {
    name: 'pintura',
    patterns: /(pintar|pintura|brocha|rodillo|pared|sellador|primario|primer|lija)/i,
    guidance: [
      'Cuando te pregunten por pintar, responde con una lista base: pintura, rodillo, brocha, cinta masking, lija, charola y proteccion personal.',
      'Si faltan datos, pide superficie, metros aproximados, tipo de acabado y si es interior o exterior.',
      'Aclara que la cantidad depende del rendimiento de la pintura y de las manos de aplicacion.'
    ]
  },
  {
    name: 'estanteria',
    patterns: /(estante|repisa|repisas|estanteria|estantería|mueble|biblioteca|libros)/i,
    guidance: [
      'Para estanterias o repisas, sugiere madera o tablero, escuadras, tornillos, taquetes, nivel, taladro y lija.',
      'Pide medidas, peso estimado de carga, material deseado y si va a pared de block, tablaroca o concreto.',
      'Incluye una nota de seguridad sobre anclaje y carga maxima recomendada.'
    ]
  },
  {
    name: 'electricidad',
    patterns: /(electricidad|electrico|eléctrico|cable|enchufe|interruptor|contacto|lampara|luz)/i,
    guidance: [
      'Para electricidad, menciona cable adecuado, conectores, cinta aislante, canaleta, interruptor o contacto, y herramientas aisladas.',
      'Pide voltaje, distancia del tendido, numero de puntos y si la instalacion es nueva o mantenimiento.',
      'Sugiere cortar la energia y trabajar con proteccion adecuada.'
    ]
  },
  {
    name: 'plomeria',
    patterns: /(plomeria|plomería|fontaneria|fontanería|tuberia|tubería|fuga|llave|grifo|lavabo|wc)/i,
    guidance: [
      'Para plomeria, propone tuberia PVC o CPVC, codos, coples, teflon, pegamento, llaves y sellador segun el caso.',
      'Pide diametro, material de la tuberia y si hay fuga, instalacion nueva o reemplazo.',
      'Incluye seguridad: cerrar la llave de paso antes de intervenir.'
    ]
  },
  {
    name: 'carpinteria',
    patterns: /(carpinteria|carpintería|madera|tablero|melamina|triplay|bisagra|corte|armar|ensamblar)/i,
    guidance: [
      'Para carpinteria, sugiere tablero o madera, tornillos, bisagras, escuadras, pegamento, lija, broca y acabado.',
      'Pide medidas, tipo de madera y uso final para ajustar la recomendacion.',
      'Recomienda lentes, guantes y medicion previa antes de cortar.'
    ]
  },
  {
    name: 'fijacion',
    patterns: /(taquete|taquetes|tornillo|tornillos|clavo|clavos|anclaje|sujecion|sujeción)/i,
    guidance: [
      'Para fijaciones, diferencia entre taquete, tornillo, clavo, pija y anclaje segun la superficie y la carga.',
      'Pide el material de la pared o base y el peso aproximado del objeto a fijar.',
      'Aclara que el diámetro y la longitud dependen de la carga y del tipo de muro.'
    ]
  },
  {
    name: 'seguridad',
    patterns: /(seguridad|proteccion|protección|guantes|lentes|casco|arnes|arnés|mascarilla|cubrebocas|careta)/i,
    guidance: [
      'Cuando pidan seguridad, responde con equipo basico: guantes, lentes, mascarilla, botas y casco segun la tarea.',
      'Relaciona la proteccion con el trabajo: pintura, corte, electricidad, perforacion o soldadura.',
      'No exageres tecnicamente; da recomendaciones practicas y breves.'
    ]
  },
  {
    name: 'herramientas',
    patterns: /(herramienta|herramientas|taladro|segueta|serrucho|martillo|desarmador|destornillador|pinza|llave inglesa)/i,
    guidance: [
      'Si preguntan por herramientas, sugiere las esenciales del trabajo y separa herramienta manual de electrica.',
      'Pide el proyecto antes de decidir la lista para no sobrecargar la respuesta.',
      'Si la consulta es general, entrega un kit basico y luego propone versiones opcionales.'
    ]
  }
];

const buildContextGuide = (message) => {
  const text = String(message || '');
  const matched = FERRETERIA_CONTEXTS.filter((context) => context.patterns.test(text)).slice(0, 5);

  if (!matched.length) {
    return null;
  }

  return matched
    .map((context) => [
      `CONTEXTO GLOBAL DETECTADO: ${context.name}`,
      'Usa este criterio como referencia para responder aunque no exista contexto recuperado exacto.',
      ...context.guidance.map((item) => `- ${item}`)
    ].join('\n'))
    .join('\n\n');
};

const buildSystemPrompt = ({ message, memorySummary, context }) => {
  const memoryBlock = memorySummary ? `\n\nMEMORIA DE CONVERSACION:\n${memorySummary}` : '';
  const contextGuide = buildContextGuide(message);
  const contextGuideBlock = contextGuide ? `\n\nGUÍA DE CONTEXTO:\n${contextGuide}` : '';
  const retrievedBlock = context ? `\n\nCONTEXTO RECUPERADO:\n${context}` : '';

  return `${SYSTEM_PROMPT.trim()}${memoryBlock}${contextGuideBlock}${retrievedBlock}`;
};

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
    const conversation = [
      {
        role: 'system',
        content: `${buildSystemPrompt({ message, memorySummary, context: null })}\n\nNo hay contexto recuperado. Responde de forma util y realista con conocimiento general de ferreteria o del sistema, segun lo que pregunte el usuario. Si faltan datos, sugiere los mas importantes.`
      },
      ...sanitizeHistory(history),
      { role: 'user', content: String(message) }
    ];

    const reply = await createChatCompletion(conversation);

    return {
      reply,
      usedContext: false,
      sources: []
    };
  }

  const conversation = [
    {
      role: 'system',
      content: buildSystemPrompt({ message, memorySummary, context })
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
