import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Solicitud, 2: Seleccionar usuario
  const [email, setEmail] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  /**
   * Buscar usuarios por email
   */
  const handleSearchEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Este endpoint buscaría usuarios con ese email
      // Por ahora usaremos un enfoque alternativo: solicitar por email y verificar backend
      
      setMessage('Buscando usuarios...');
      // Aquí irá la lógica para buscar usuarios
      
      // Simulamos enviando al backend
      const response = await api.post('/password-reset/request', { email });
      
      setMessage('Si el email existe, recibirás un enlace de recuperación');
      setTimeout(() => {
        setMessage('');
        setEmail('');
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Flujo alternativo: mostrar todos los usuarios para que seleccione
   */
  const handleShowUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Cargar usuarios desde el sistema
      // const response = await api.get('/users'); 
      // setUsers(response.data);
      // setStep(2);
    } catch (err) {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="text-2xl font-bold text-gray-800">Recuperar Contraseña</h1>
          <p className="text-gray-600 mt-2">Ingresa tu email para obtener instrucciones</p>
        </div>

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleSearchEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ✉️ Email o Usuario
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@ejemplo.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                ❌ {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                ✅ {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Buscando...' : 'Enviar Enlace de Recuperación'}
            </button>
          </form>
        )}

        {/* Botón para volver */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Volver al Login
          </button>
        </div>

        {/* Información adicional */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            💡 Si no recuerdas tu email, contacta al administrador.
          </p>
        </div>

      </div>
    </div>
  );
}
