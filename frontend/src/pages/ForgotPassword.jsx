import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const WrenchMark = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
    <path
      d="M21 7.5a6.5 6.5 0 0 1-8.77 6.1L7 18.83a2 2 0 0 1-2.83 0l-.01-.01a2 2 0 0 1 0-2.82l5.23-5.23A6.5 6.5 0 0 1 16.5 2c.45 0 .88.05 1.3.14l-3.05 3.05 1.06 3.96 3.96 1.06 3.05-3.05c.09.42.14.85.14 1.3Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSearchEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await api.post('/password-reset/request', { email });
      setMessage('Si el correo existe en el sistema, recibirás un enlace de recuperación.');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:flex flex-col items-start justify-center gap-6 pl-12 text-white">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
            <WrenchMark className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-4xl font-bold leading-tight">Recupera tu acceso</h2>
          <p className="text-lg text-white/90 max-w-md">Te enviaremos un enlace seguro para restablecer tu contraseña y volver al sistema en minutos.</p>
          <div className="w-3/4 mt-6 bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/10 shadow-2xl">
            <p className="text-sm uppercase tracking-[0.24em] text-white/60">Importante</p>
            <div className="mt-3 grid gap-3 text-sm text-white/85">
              <div className="rounded-xl bg-white/10 p-3">El enlace expira en 1 hora</div>
              <div className="rounded-xl bg-white/10 p-3">Usa tu correo registrado en la base de datos</div>
              <div className="rounded-xl bg-white/10 p-3">Si no lo recibes, revisa spam</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-md card">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <WrenchMark className="w-9 h-9 text-primary-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Recuperar Contraseña</h1>
              <p className="text-gray-500 mt-2">Ingresa tu correo para recibir instrucciones</p>
            </div>

            <form onSubmit={handleSearchEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Correo o usuario</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sabado2202@gmail.com"
                  className="input-field"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3"
              >
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3 text-center">
              <button onClick={() => navigate('/login')} className="text-primary-600 font-medium">
                ← Volver al Login
              </button>
              <p className="text-xs text-gray-500">Si no recuerdas tu correo, contacta al administrador.</p>
            </div>
          </div>
        </div>

        <p className="text-center text-white/80 text-sm mt-6 lg:col-span-2">FerreSync v1.0 — Sistema de Gestión</p>
      </div>
    </div>
  );
}
