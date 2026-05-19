const { createChatCompletion } = require('./ollama.service');
const { getRagReply, retrieveRelevantChunks, FALLBACK_REPLY } = require('./rag.service');
const { TOOL_DEFS, executeTool } = require('./agent-tools.service');

const AGENT_MAX_CONTEXT_CHARS = Number.parseInt(process.env.RAG_MAX_CONTEXT_CHARS || '2000', 10);
const AGENT_DECISION_TEMPERATURE = Number.parseFloat(process.env.RAG_DECISION_TEMPERATURE || '0');
const AGENT_RESPONSE_TEMPERATURE = Number.parseFloat(process.env.RAG_RESPONSE_TEMPERATURE || '0.2');

const WRITE_TOOLS = new Set(TOOL_DEFS.filter((tool) => tool.write).map((tool) => tool.name));

const toolKeywordMap = {
  list_low_stock: /(bajo\s+stock|stock\s+bajo|bajo\s+inventario|faltan\s+productos|productos\s+bajo\s+stock)/,
  get_daily_sales_summary: /(ventas\s+del\s+dia|ventas\s+hoy|resumen\s+de\s+ventas|ticket\s+promedio)/,
  find_product: /(producto|productos|sku|codigo\s+de\s+barras|buscar\s+producto|precio|stock\s+de\s+producto)/,
  list_inventory: /(inventario\s+actual|inventario\s+total|existencias|catalogo\s+de\s+productos|lista\s+de\s+productos|productos\s+en\s+inventario|que\s+hay\s+en\s+inventario)/,
  list_customers: /(clientes|buscar\s+cliente|listar\s+clientes|cliente\s+con\s+nombre)/,
  get_inventory_value: /(valor\s+del\s+inventario|inventario\s+total|valor\s+inventario|costo\s+inventario)/,
  build_cart_estimate: /(carrito|cotizacion|presupuesto|lista\s+de\s+materiales|cotizar|necesito|necesitar|necesitas|necesitamos|necesito\s+poner|necesito\s+instalar|poner\s+un|instalar\s+un|colocar\s+un|colocar\s+una|instalar\s+una|poner\s+un|proyecto|cobertizo|estante|repisa|repisas|estantes|estanteria|estantería|montar|colgar|mueble|muebles|puerta|ventana|reparar|reparación|reparaciones|reparar\s+una|reparar\s+puerta|electricidad|eléctrico|electrico|cable|enchufe|interruptor|tubería|tuberias|fontanería|plomería|plomeria|azulejo|cerámica|ceramica|yeso|cemento|pegamento|silicón|silicon)/i,
  create_customer: /(crear|agregar|registrar|alta|dar\s+de\s+alta).*(cliente)|cliente\s+nuevo/,
  create_inventory_movement: /(movimiento\s+de\s+inventario|entrada|salida|ajuste|registrar\s+inventario)/
};

const isCreateCustomerIntent = (message) => {
  const text = String(message || '').toLowerCase();
  const hasVerb = /(crear|agregar|registrar|alta|dar\s+de\s+alta)/.test(text);
  const hasCliente = /cliente/.test(text);
  return hasVerb && hasCliente;
};

const isCustomerInfoRequest = (message) => {
  const text = String(message || '').toLowerCase();
  const mentionsCliente = /cliente/.test(text);
  const mentionsInfo = /(informacion|datos|requisitos|necesito|que\s+se\s+requiere)/.test(text);
  return mentionsCliente && mentionsInfo;
};

const isInventorySnapshotRequest = (message) => {
  const text = String(message || '').toLowerCase();
  const mentionsInventory = /(inventario|existencias|stock|catalogo|productos)/.test(text);
  const mentionsSnapshot = /(actual|actualizado|completo|detalle|lista|ver|mostrar|hay|tiene|dispone)/.test(text);
  return mentionsInventory && mentionsSnapshot;
};

const isLikelyCustomerPayload = (parsed) => {
  if (!parsed?.name) {
    return false;
  }
  return Boolean(parsed.email || parsed.phone || parsed.address || parsed.rfc);
};

const isToolRelevant = (toolName, message) => {
  const pattern = toolKeywordMap[toolName];
  if (!pattern) {
    return true;
  }
  return pattern.test(String(message || '').toLowerCase());
};

const CART_RECOMMENDATION_RULES = [
  {
    pattern: /(pintar|pintura|pared|brocha|rodillo)/i,
    items: ['pintura', 'lija', 'cinta adhesiva', 'guantes', 'gafas de seguridad']
  },
  {
    pattern: /(estante|repisa|repisas|estantes|estanteria|estantería|montar|colgar|colocar|poner|instalar)/i,
    items: ['tabla de madera', 'tornillos', 'taquetes', 'escuadras de soporte', 'lija', 'barniz o sellador', 'taladro', 'brocha o pincel']
  },
  {
    pattern: /(mueble|muebles|puerta|ventana|reparar|reparación|reparaciones)/i,
    items: ['madera o paneles', 'tornillos', 'bisagras', 'manijas', 'clavos', 'martillo', 'lijas', 'barniz o pintura']
  },
  {
    pattern: /(electrico|eléctrico|cable|enchufe|interruptor|instalación eléctrica|luces)/i,
    items: ['cable eléctrico', 'interruptores', 'tomas/enchufes', 'conectores', 'fusibles', 'destornillador aislado', 'cinta aislante']
  },
  {
    pattern: /(fontanería|plomería|tubería|tuberias|grifos|llave|fuga)/i,
    items: ['tubería (PVC o cobre)', 'codos y uniones', 'sellador/teflón', 'grifos o llaves', 'abrazaderas', 'pegamento para tubería']
  },
  {
    pattern: /(azulejo|cerámica|ceramica|colocar azulejos|baldosa)/i,
    items: ['azulejos', 'adherente/pegamento para azulejo', 'crita o lechada', 'espaciadores', 'cortador de azulejos']
  }
];

const buildDefaultCartItems = (message) => {
  const text = String(message || '');

  for (const rule of CART_RECOMMENDATION_RULES) {
    if (rule.pattern.test(text)) {
      return rule.items.map((query) => ({ query, quantity: 1 }));
    }
  }

  return [];
};

const isMaterialRecommendationRequest = (message) => {
  return buildDefaultCartItems(message).length > 0;
};

const normalizeCartItems = (message, input) => {
  const items = Array.isArray(input?.items) ? input.items : [];
  const normalized = items
    .map((item) => {
      const quantity = Number.parseFloat(item?.quantity);
      const query = item?.query || item?.name;
      const sku = item?.sku;
      const barcode = item?.barcode;

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return null;
      }

      if (!query && !sku && !barcode) {
        return null;
      }

      return { query, sku, barcode, quantity };
    })
    .filter(Boolean);

  if (normalized.length > 0) {
    return normalized;
  }

  return buildDefaultCartItems(message);
};

const enrichCartItemsFromInventory = async (items) => {
  const enriched = [];

  for (const item of items) {
    const lookup = item.sku || item.barcode || item.query;
    if (!lookup) {
      continue;
    }

    const productResult = await executeTool('find_product', {
      query: item.query || lookup,
      sku: item.sku || undefined,
      barcode: item.barcode || undefined,
      limit: 5
    });

    const matches = Array.isArray(productResult?.data) ? productResult.data : [];
    const firstMatch = matches[0];

    enriched.push({
      ...item,
      sku: item.sku || firstMatch?.sku || undefined,
      barcode: item.barcode || firstMatch?.barcode || undefined,
      quantity: item.quantity || 1
    });
  }

  return enriched;
};

const formatCurrency = (value) => {
  const amount = Number.parseFloat(value || 0);
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(Number.isFinite(amount) ? amount : 0);
};

const formatCartEstimateReply = (toolResult) => {
  const data = toolResult?.data || {};
  const cart = Array.isArray(data.cart) ? data.cart : [];
  const missing = Array.isArray(data.missing) ? data.missing : [];
  const needsSelection = Array.isArray(data.needsSelection) ? data.needsSelection : [];

  if (!toolResult?.success) {
    return toolResult?.message || 'No fue posible generar el carrito estimado.';
  }

  if (cart.length === 0 && missing.length === 0 && needsSelection.length === 0) {
    return 'No encontré productos suficientes en inventario para generar el carrito.';
  }

  const lines = ['Productos agregados desde inventario:'];

  for (const item of cart) {
    const productName = item.product?.name || item.query || 'Producto';
    lines.push(`- ${productName} x${item.quantity} = ${formatCurrency(item.lineTotal)}`);
  }

  if (needsSelection.length > 0) {
    lines.push('');
    lines.push('Productos con varias coincidencias en inventario:');
    for (const item of needsSelection) {
      const candidateNames = item.candidates
        .map((candidate) => candidate.name)
        .slice(0, 3)
        .join(', ');
      lines.push(`- ${item.query}: ${candidateNames}`);
    }
  }

  if (missing.length > 0) {
    lines.push('');
    lines.push('Productos no encontrados en inventario:');
    for (const item of missing) {
      lines.push(`- ${item.query}`);
    }
  }

  lines.push('');
  lines.push(`Total estimado: ${formatCurrency(data.total)}`);

  return lines.join('\n');
};

const parseCustomerInput = (message) => {
  const text = String(message || '').replace(/\s+/g, ' ').trim();
  const lower = text.toLowerCase();

  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = text.match(/(tel(?:e?fono)?|cel(?:ular)?|movil)[:\s-]*([+\d][\d\s-]{6,})/i);
  const rfcMatch = text.match(/rfc[:\s-]*([A-Z0-9]{12,13})/i);
  const addressMatch = text.match(/(direccion|dir)[:\s-]*([^,]+)/i);

  let name = '';
  const nameLabelMatch = text.match(/nombre[:\s-]*([A-Za-zÁÉÍÓÚÑáéíóúñ\s]{3,})/i);
  const clienteMatch = text.match(/cliente\s*(?:nuevo\s*)?[:\-]?\s*([A-Za-zÁÉÍÓÚÑáéíóúñ\s]{3,})/i);

  if (nameLabelMatch) {
    name = nameLabelMatch[1] || '';
  } else if (clienteMatch) {
    name = clienteMatch[1] || '';
  }

  if (name) {
    const stopTokens = ['telefono', 'tel', 'cel', 'email', 'correo', 'rfc', 'direccion', 'dir'];
    const stopRegex = new RegExp(`\\b(${stopTokens.join('|')})\\b`, 'i');
    const parts = name.split(stopRegex);
    name = parts[0].trim();
  }

  return {
    name: name ? name.trim() : '',
    phone: phoneMatch ? phoneMatch[2].trim() : '',
    email: emailMatch ? emailMatch[0].trim() : '',
    address: addressMatch ? addressMatch[2].trim() : '',
    rfc: rfcMatch ? rfcMatch[1].trim() : ''
  };
};

const buildCustomerRequirementsReply = () => {
  return 'Para crear un cliente necesito al menos el nombre. Opcionales: telefono, email, direccion y RFC.';
};

const isInfoRequest = (message) => {
  const text = String(message || '').toLowerCase();
  const patterns = [
    /que\s+datos\s+necesito/,
    /que\s+informacion\s+necesito/,
    /que\s+se\s+requiere/,
    /requisitos\s+para/,
    /como\s+(creo|crear|registro|registrar|agrego|agregar)/,
    /informacion\s+(necesaria\s+)?para\s+(crear|registrar|agregar)/,
    /datos\s+(necesarios\s+)?para\s+(crear|registrar|agregar)/
  ];

  if (patterns.some((pattern) => pattern.test(text))) {
    return true;
  }

  const mentionsCliente = /cliente/.test(text);
  const mentionsInfo = /(informacion|datos|requisitos|necesito)/.test(text);
  const mentionsCreate = /(crear|agregar|registrar|alta)/.test(text);

  return mentionsCliente && mentionsInfo && mentionsCreate;
};

const buildToolCatalog = () => {
  return TOOL_DEFS.map((tool) => {
    const inputs = Object.entries(tool.inputs || {})
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    return `- ${tool.name}: ${tool.description} Inputs: ${inputs || 'ninguno'}.`;
  }).join('\n');
};

const safeJsonParse = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

const buildDecisionPrompt = (message, context, allowWrite) => {
  const trimmedContext = String(context || '').slice(0, AGENT_MAX_CONTEXT_CHARS);

  return {
    system: `
Eres un enrutador de acciones para FerreSync.
Decide si el usuario necesita una herramienta o una respuesta normal.
Responde SOLO JSON con este esquema:
{
  "action": "respond|tool|reject|confirm",
  "tool": "nombre_herramienta_opcional",
  "input": { },
  "message": "respuesta breve si no usas herramienta"
}
Reglas:
- Si la pregunta NO es sobre FerreSync, usa action = "reject" y message = "${FALLBACK_REPLY}".
- Si faltan datos para ejecutar, usa action = "respond" y pide lo que falta.
- Si necesitas ejecutar una herramienta, usa action = "tool".
- Si la herramienta es de escritura y allowWrite es false, usa action = "confirm" y pide confirmacion.
- No inventes datos ni herramientas.
- IMPORTANTE: Si el usuario pide una lista de materiales, cotizacion, presupuesto, o pregunta "que necesito para ..." / "necesito ..." para realizar un proyecto (ejemplos: pintar una pared, poner un estante, instalar una repisa, montar un mueble), debes preferir action = "tool" con tool = "build_cart_estimate" y, si es posible, devolver en input.items un arreglo con objetos { query, quantity } que el sistema pueda usar para buscar en inventario.
- Si la pregunta solicita el estado o listado de inventario, usar tool = "list_inventory".
`,
    user: `
allowWrite: ${allowWrite ? 'true' : 'false'}
CONTEXTO RECUPERADO:
${trimmedContext || 'SIN CONTEXTO'}
HERRAMIENTAS DISPONIBLES:
${buildToolCatalog()}
PREGUNTA DEL USUARIO:
${String(message || '')}
`
  };
};

const buildToolResponsePrompt = (context, toolName, toolResult, memorySummary) => {
  const trimmedContext = String(context || '').slice(0, AGENT_MAX_CONTEXT_CHARS);
  const memoryBlock = memorySummary ? `\n\nMEMORIA DE CONVERSACION:\n${memorySummary}` : '';

  return {
    system: `
Eres el asistente de FerreSync.
Responde SOLO con base en el CONTEXTO RECUPERADO y el RESULTADO DE LA ACCION.
Si el resultado indica error, explica el error de forma clara.
No inventes datos.
Responde en espanol claro y breve.
`,
    user: `
  CONTEXTO RECUPERADO:
  ${trimmedContext || 'SIN CONTEXTO'}${memoryBlock}

RESULTADO DE LA ACCION (${toolName}):
${JSON.stringify(toolResult, null, 2)}

Genera la respuesta para el usuario.
`
  };
};

const normalizeDecision = (decision) => {
  if (!decision || typeof decision !== 'object') {
    return null;
  }

  const action = String(decision.action || '').toLowerCase();
  if (!['respond', 'tool', 'reject', 'confirm'].includes(action)) {
    return null;
  }

  return {
    action,
    tool: decision.tool ? String(decision.tool) : null,
    input: decision.input && typeof decision.input === 'object' ? decision.input : {},
    message: decision.message ? String(decision.message) : null
  };
};

const decideAction = async ({ message, context, allowWrite }) => {
  const prompt = buildDecisionPrompt(message, context, allowWrite);

  const rawDecision = await createChatCompletion(
    [
      { role: 'system', content: prompt.system.trim() },
      { role: 'user', content: prompt.user.trim() }
    ],
    {
      format: 'json',
      options: { temperature: AGENT_DECISION_TEMPERATURE }
    }
  );

  const parsed = safeJsonParse(rawDecision);
  return normalizeDecision(parsed);
};

const getAgentReply = async ({ message, history, allowWrite, userId, memorySummary }) => {
  if (isInfoRequest(message)) {
    return getRagReply({ message, history, memorySummary });
  }

  if (isCustomerInfoRequest(message)) {
    return {
      reply: buildCustomerRequirementsReply(),
      usedContext: false,
      sources: []
    };
  }

  if (isMaterialRecommendationRequest(message)) {
    try {
      const cartItems = buildDefaultCartItems(message);
      const toolResult = await executeTool('build_cart_estimate', {
        items: cartItems,
        limit: 5
      });

      return {
        reply: formatCartEstimateReply(toolResult),
        usedContext: true,
        tool: 'build_cart_estimate',
        sources: []
      };
    } catch (error) {
      return {
        reply: `No pude generar la recomendacion de materiales. ${error.message}`,
        usedContext: false,
        sources: []
      };
    }
  }

  if (isInventorySnapshotRequest(message)) {
    try {
      const toolResult = await executeTool('list_inventory', { limit: 20 });
      return {
        reply: formatInventorySnapshotReply(toolResult),
        usedContext: true,
        tool: 'list_inventory',
        sources: []
      };
    } catch (error) {
      return {
        reply: `No pude consultar el inventario actual. ${error.message}`,
        usedContext: false,
        sources: []
      };
    }
  }

  if (isCreateCustomerIntent(message)) {
    if (!allowWrite) {
      return {
        reply: 'Para crear un cliente necesito confirmacion. Activa "Permitir acciones" o envia allowWrite=true.',
        usedContext: false,
        sources: [],
        requiresConfirmation: true
      };
    }

    const input = parseCustomerInput(message);
    if (!input.name) {
      return {
        reply: buildCustomerRequirementsReply(),
        usedContext: false,
        sources: []
      };
    }

    try {
      const toolResult = await executeTool('create_customer', input, { userId });
      return {
        reply: toolResult.message || `Cliente creado correctamente: ${toolResult.data?.name || input.name}.`,
        usedContext: false,
        tool: 'create_customer',
        sources: []
      };
    } catch (error) {
      return {
        reply: `No pude crear el cliente. ${error.message}`,
        usedContext: false,
        sources: []
      };
    }
  }

  const parsedCustomer = parseCustomerInput(message);
  if (isLikelyCustomerPayload(parsedCustomer)) {
    if (!allowWrite) {
      return {
        reply: 'Detecte datos de un cliente. Si deseas crearlo, activa "Permitir acciones" o envia allowWrite=true.',
        usedContext: false,
        sources: [],
        requiresConfirmation: true
      };
    }

    try {
      const toolResult = await executeTool('create_customer', parsedCustomer, { userId });
      return {
        reply: toolResult.message || `Cliente creado correctamente: ${toolResult.data?.name || parsedCustomer.name}.`,
        usedContext: false,
        tool: 'create_customer',
        sources: []
      };
    } catch (error) {
      return {
        reply: `No pude crear el cliente. ${error.message}`,
        usedContext: false,
        sources: []
      };
    }
  }

  const { context, chunks } = await retrieveRelevantChunks(message);
  const sources = (chunks || []).map((chunk) => ({
    source: chunk.source,
    title: chunk.title || null,
    score: chunk.score
  }));

  const decision = await decideAction({ message, context, allowWrite });
  if (!decision) {
    return getRagReply({ message, history, memorySummary });
  }

  if (decision.action === 'reject') {
    return { reply: decision.message || FALLBACK_REPLY, usedContext: false, sources: [] };
  }

  if (decision.action === 'confirm') {
    const confirmMessage =
      decision.message ||
      'Para ejecutar esta accion necesito confirmacion. Envia allowWrite=true.';
    return { reply: confirmMessage, usedContext: false, sources: [], requiresConfirmation: true };
  }

  if (decision.action === 'respond' || !decision.tool) {
    return getRagReply({ message, history, memorySummary });
  }

  if (!TOOL_DEFS.some((tool) => tool.name === decision.tool)) {
    return { reply: FALLBACK_REPLY, usedContext: false, sources: [] };
  }

  if (!isToolRelevant(decision.tool, message)) {
    return getRagReply({ message, history, memorySummary });
  }

  if (WRITE_TOOLS.has(decision.tool) && !allowWrite) {
    return {
      reply: 'Para ejecutar esta accion necesito confirmacion. Envia allowWrite=true.',
      usedContext: false,
      sources: [],
      requiresConfirmation: true
    };
  }

  try {
    let toolInput = decision.input;
    let bypassModelResponse = false;

    if (decision.tool === 'build_cart_estimate') {
      const cartItems = normalizeCartItems(message, decision.input);
      if (cartItems.length === 0) {
        return {
          reply: 'Necesito que indiques productos o un tipo de proyecto para consultar el inventario y armar el carrito.',
          usedContext: false,
          sources: []
        };
      }

      toolInput = {
        ...decision.input,
        items: await enrichCartItemsFromInventory(cartItems)
      };
      bypassModelResponse = true;
    }

    const toolResult = await executeTool(decision.tool, toolInput, { userId });

    if (bypassModelResponse) {
      return {
        reply: formatCartEstimateReply(toolResult),
        usedContext: true,
        tool: decision.tool,
        sources
      };
    }

    const responsePrompt = buildToolResponsePrompt(context, decision.tool, toolResult, memorySummary);

    const reply = await createChatCompletion(
      [
        { role: 'system', content: responsePrompt.system.trim() },
        { role: 'user', content: responsePrompt.user.trim() }
      ],
      {
        options: { temperature: AGENT_RESPONSE_TEMPERATURE }
      }
    );

    return { reply, usedContext: true, tool: decision.tool, sources };
  } catch (error) {
    return {
      reply: `No pude ejecutar la accion solicitada. ${error.message}`,
      usedContext: false,
      sources: []
    };
  }
};

const formatInventorySnapshotReply = (toolResult) => {
  if (!toolResult?.success) {
    return toolResult?.message || 'No fue posible consultar el inventario actual.';
  }

  const products = Array.isArray(toolResult.data) ? toolResult.data : [];

  if (products.length === 0) {
    return 'No encontré productos activos en el inventario.';
  }

  const lines = [`Inventario actual: ${products.length} productos mostrados.`];

  for (const product of products.slice(0, 10)) {
    const categoryName = product.category?.name || 'Sin categoria';
    lines.push(`- ${product.name} | SKU: ${product.sku || 'N/D'} | Stock: ${product.stock} | Min: ${product.minStock} | Categoria: ${categoryName}`);
  }

  if (products.length > 10) {
    lines.push(`... y ${products.length - 10} productos mas.`);
  }

  return lines.join('\n');
};

module.exports = {
  getAgentReply
};
