const prisma = require('../config/database');
const { getAgentReply } = require('../services/agent.service');
const {
  getOrCreateSession,
  getSummary,
  getRecentMessages,
  storeMessage,
  updateSummaryIfNeeded
} = require('../services/chat-memory.service');
const { executeTool } = require('../services/agent-tools.service');

const getChatbotErrorMessage = (error) => {
  const message = String(error?.message || '');

  if (message.includes('GEMINI_API_KEY')) {
    return 'Falta configurar GEMINI_API_KEY en el backend desplegado.';
  }

  if (message.includes('Gemini error (401)') || message.includes('Gemini error (403)')) {
    return 'Gemini rechazo la solicitud. Revisa la API key y que la API este habilitada.';
  }

  if (message.includes('Gemini error (404)')) {
    return 'El modelo de Gemini configurado no existe o no esta disponible.';
  }

  if (message.includes('Gemini error (429)')) {
    return 'Se excedio la cuota de Gemini o hay demasiadas solicitudes. Intenta mas tarde.';
  }

  return 'No fue posible procesar la respuesta del asistente. Verifica la conexion con Gemini y la base de datos.';
};

const sendMessage = async (req, res) => {
  const { message, history = [], allowWrite = false, sessionId } = req.body;

  try {
    const session = await getOrCreateSession({
      sessionId,
      userId: req.user?.userId
    });

    const memorySummary = await getSummary(session.id);
    const storedHistory = await getRecentMessages(session.id);
    const runtimeHistory = history.length ? history : storedHistory;

    const { reply, usedContext, tool, sources, requiresConfirmation, toolResult } = await getAgentReply({
      message,
      history: runtimeHistory,
      allowWrite: Boolean(allowWrite),
      userId: req.user?.userId,
      memorySummary
    });

    const userMessage = await storeMessage({
      sessionId: session.id,
      userId: req.user?.userId,
      role: 'user',
      content: message
    });

    const assistantMessage = await storeMessage({
      sessionId: session.id,
      userId: null,
      role: 'assistant',
      content: reply
    });

    await updateSummaryIfNeeded(session.id);

    return res.json({
      success: true,
      data: {
        reply,
        sessionId: session.id,
        messageId: assistantMessage.id,
        meta: {
            usedContext: Boolean(usedContext),
            toolUsed: tool || null,
            toolResult: toolResult || null,
            sources: sources || [],
            requiresConfirmation: Boolean(requiresConfirmation)
          }
      }
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    return res.status(502).json({
      success: false,
      message: getChatbotErrorMessage(error),
      details: String(error?.message || 'Error desconocido')
    });
  }
};

const submitFeedback = async (req, res) => {
  const { sessionId, messageId, rating, note } = req.body;

  try {
    const feedback = await prisma.chatFeedback.create({
      data: {
        sessionId,
        messageId: messageId ? parseInt(messageId, 10) : null,
        userId: req.user?.userId || null,
        rating: parseInt(rating, 10),
        note: note ? String(note) : null
      }
    });

    return res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Chatbot feedback error:', error);
    return res.status(500).json({
      success: false,
      message: 'No fue posible guardar el feedback'
    });
  }
};

const getSessionHistory = async (req, res) => {
  const { id } = req.params;
  const limit = Number.parseInt(req.query.limit || '50', 10);

  try {
    const session = await prisma.chatSession.findUnique({
      where: { id },
      include: {
        summary: true
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sesion no encontrada'
      });
    }

    if (session.userId && session.userId !== req.user?.userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver esta sesion'
      });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 200)
    });

    return res.json({
      success: true,
      data: {
        sessionId: id,
        summary: session.summary?.summary || null,
        messages: messages.reverse()
      }
    });
  } catch (error) {
    console.error('Chatbot session error:', error);
    return res.status(500).json({
      success: false,
      message: 'No fue posible obtener la sesion'
    });
  }
};

const getInsights = async (req, res) => {
  const date = req.query.date ? String(req.query.date) : null;
  const lowStockLimit = Number.parseInt(req.query.lowStockLimit || '5', 10);

  try {
    const lowStock = await executeTool('list_low_stock', { limit: lowStockLimit });
    const sales = await executeTool('get_daily_sales_summary', date ? { date } : {});
    const inventory = await executeTool('get_inventory_value', {});

    return res.json({
      success: true,
      data: {
        lowStock,
        sales,
        inventory
      }
    });
  } catch (error) {
    console.error('Chatbot insights error:', error);
    return res.status(500).json({
      success: false,
      message: 'No fue posible generar insights'
    });
  }
};

module.exports = {
  sendMessage,
  submitFeedback,
  getSessionHistory,
  getInsights
};
