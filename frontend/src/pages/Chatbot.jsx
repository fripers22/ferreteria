import { useEffect, useState } from 'react';
import { HiChat, HiPaperAirplane } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { chatbotService } from '../services';

const FAQ_ITEMS = [
  {
    question: '¿Qué puede hacer el asistente de IA de FerreSync?',
    answer:
      'Puede responder dudas del sistema, consultar inventario, ayudarte a cotizar materiales y mostrar contexto sobre clientes, cuentas y reportes.'
  },
  {
    question: '¿Cómo consulto el inventario actual?',
    answer:
      'Pide el nombre del producto, SKU o una consulta como “muéstrame el inventario actual”. El asistente busca existencias, stock mínimo y categoría.'
  },
  {
    question: '¿Me ayuda a armar una lista de materiales para pintar?',
    answer:
      'Sí. Puedes decir “qué necesito para pintar una pared” y el bot sugiere pintura, lija, cinta, rodillo y otros insumos según lo que encuentre en inventario.'
  },
  {
    question: '¿Qué información necesito para cotizar una repisa o un estante?',
    answer:
      'Lo ideal es indicar medidas, material, cantidad de soportes y el tipo de instalación. Con eso el asistente arma una propuesta de materiales más contextualizada.'
  },
  {
    question: '¿Puedo crear clientes desde el chat?',
    answer:
      'Sí. El asistente pide al menos nombre y, si los tienes, teléfono, correo, dirección o RFC. Las acciones de escritura siempre solicitan confirmación.'
  },
  {
    question: '¿Qué pasa si no hay stock suficiente?',
    answer:
      'El asistente puede indicarlo y ayudarte a identificar productos faltantes para que busques alternativas o completes la compra.'
  }
];

const Chatbot = () => {
  const defaultMessage = {
    role: 'assistant',
    content: '¡Hola! Soy el asistente virtual de FerreSync. Puedo ayudarte con:\n\n- Consultar precios y stock de productos\n- Información sobre clientes y cuentas\n- Reportes de ventas\n- Cualquier duda sobre el sistema\n\n¿En qué puedo ayudarte?'
  };

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [allowWrite, setAllowWrite] = useState(false);
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('chatbotSessionId'));
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      if (!sessionId) {
        if (isMounted) {
          setMessages([defaultMessage]);
          setLoadingSession(false);
        }
        return;
      }

      try {
        const response = await chatbotService.getSession(sessionId, 80);
        const history = response?.data?.messages || [];

        if (isMounted) {
          if (history.length) {
            setMessages(
              history.map((msg) => ({
                role: msg.role,
                content: msg.content
              }))
            );
          } else {
            setMessages([defaultMessage]);
          }
          setLoadingSession(false);
        }
      } catch (error) {
        localStorage.removeItem('chatbotSessionId');
        if (isMounted) {
          setMessages([defaultMessage]);
          setLoadingSession(false);
        }
      }
    };

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    await handleSend(input.trim());
  };

  const handleSend = async (displayMessage, options = {}) => {
    if (loading) return;

    const backendMessage = options.backendMessage || displayMessage;
    const allowWriteFlag = options.allowWrite ?? allowWrite;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: displayMessage }]);
    setLoading(true);

    try {
      const response = await chatbotService.sendMessage({
        message: backendMessage,
        allowWrite: allowWriteFlag,
        sessionId
      });

      const reply = response?.data?.reply || '';
      const newSessionId = response?.data?.sessionId;
      const meta = response?.data?.meta || {};

      if (newSessionId) {
        setSessionId(newSessionId);
        localStorage.setItem('chatbotSessionId', newSessionId);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply,
          meta
        }
      ]);

      if (meta.requiresConfirmation) {
        setPendingConfirmation({ message: backendMessage });
      } else {
        setPendingConfirmation(null);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'No se pudo obtener respuesta del asistente';
      const details = error.response?.data?.details;
      toast.error(message);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: details
            ? `${message}\n\nDetalle: ${details}`
            : 'No pude conectarme al motor de IA online. Verifica la configuracion de Gemini y vuelve a intentar.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const confirmPendingAction = async () => {
    if (!pendingConfirmation?.message) return;

    await handleSend('Confirmo la accion', {
      allowWrite: true,
      backendMessage: pendingConfirmation.message
    });
  };

  const sendFaqQuestion = (question) => {
    if (loading) {
      return;
    }

    setInput(question);
    window.setTimeout(() => {
      handleSend(question);
    }, 0);
  };

  return (
    <div className="min-h-[calc(100dvh-160px)] flex flex-col gap-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <HiChat className="w-8 h-8 text-primary-600" />
          Asistente Virtual
        </h1>
        <p className="text-gray-500">Consulta información del sistema usando lenguaje natural</p>
      </div>

      <section className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-amber-50 p-4 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Preguntas frecuentes</h2>
            <p className="text-sm text-gray-600">
              Basadas en lo que ya resuelve el asistente: inventario, materiales, clientes y confirmaciones.
            </p>
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">
            Respuestas contextuales del sistema
          </p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {FAQ_ITEMS.map((item) => (
            <article
              key={item.question}
              className="rounded-2xl border border-white bg-white/90 p-4 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="font-semibold text-gray-800">{item.question}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{item.answer}</p>
              <button
                type="button"
                onClick={() => sendFaqQuestion(item.question)}
                disabled={loading}
                className="mt-4 inline-flex items-center rounded-full bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Usar esta pregunta
              </button>
            </article>
          ))}
        </div>
      </section>

      <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
        {/* Mensajes */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {loadingSession && messages.length === 0 && (
            <div className="text-sm text-gray-400">Cargando conversacion...</div>
          )}
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[92%] sm:max-w-[80%] px-4 py-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-3 pb-3 text-sm text-gray-600">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allowWrite}
                onChange={(e) => setAllowWrite(e.target.checked)}
                className="h-4 w-4"
              />
              Permitir acciones
            </label>
            {pendingConfirmation?.message && (
              <button
                type="button"
                onClick={confirmPendingAction}
                disabled={loading}
                className="btn-primary px-3 py-1"
              >
                Confirmar ejecucion
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="flex-1 input-field"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="btn-primary px-4"
            >
              <HiPaperAirplane className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
