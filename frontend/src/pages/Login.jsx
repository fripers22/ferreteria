import { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiUser, HiLockClosed, HiEye, HiEyeOff } from 'react-icons/hi';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirigir cuando user cambie
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Limpiar espacios en blanco al inicio y final (fix para copy/paste)
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    const success = await login(cleanUsername, cleanPassword);
    
    if (!success) {
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left panel - illustration */}
        <div className="hidden lg:flex flex-col items-start justify-center gap-6 pl-12 text-white">
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
            <span className="text-3xl">🔧</span>
          </div>
          <h2 className="text-4xl font-bold leading-tight">FerreSync</h2>
          <p className="text-lg text-white/90 max-w-md">Sistema moderno para la gestión de ferreterías — ventas, inventario y más.</p>

          <svg className="w-3/4 mt-6" viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="800" height="500" rx="20" fill="url(#g)" />
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#06b6d4" />
                <stop offset="1" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Right panel - form */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md card">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔧</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Bienvenido a FerreSync</h1>
              <p className="text-gray-500 mt-2">Accede con tu usuario para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <div className="relative">
                <HiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Ingresa tu usuario"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <HiLockClosed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="Ingresa tu contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <HiEyeOff className="w-5 h-5" />
                  ) : (
                    <HiEye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>

            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="text-center mt-2">
              <Link
                to="/register"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                ¿No tienes cuenta? Crear una
              </Link>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Credenciales de prueba:
            </p>
            <div className="mt-2 text-xs text-gray-400 text-center space-y-1">
              <p><strong>Admin:</strong> admin / admin123</p>
              <p><strong>Vendedor:</strong> vendedor1 / vendedor123</p>
            </div>
          </div>
        </div>

        <p className="text-center text-white/80 text-sm mt-6 lg:col-span-2">
          FerreSync v1.0 — Sistema de Gestión
        </p>
      </div>
    </div>
  );
};

export default Login;
