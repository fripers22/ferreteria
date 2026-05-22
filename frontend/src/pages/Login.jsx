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

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(username.trim(), password.trim());
    if (!success) setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:flex flex-col items-start justify-center gap-6 pl-12 text-white">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
            <span className="text-3xl">🔧</span>
          </div>
          <h2 className="text-4xl font-bold leading-tight">FerreSync</h2>
          <p className="text-lg text-white/90 max-w-md">Gestiona ventas, inventario y clientes con facilidad.</p>
          <div className="w-3/4 mt-6 rounded-lg" style={{ height: 220, background: 'linear-gradient(90deg,#06b6d4,#7c3aed)' }} />
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-md card">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔧</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Bienvenido a FerreSync</h1>
              <p className="text-gray-500 mt-2">Inicia sesión para acceder a tu panel</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                <div className="relative">
                  <HiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input className="input-field pl-10" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                <div className="relative">
                  <HiLockClosed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type={showPassword ? 'text' : 'password'} className="input-field pl-10 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary py-3">
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>

              <div className="text-center">
                <Link to="/forgot-password" className="text-sm text-primary-600">¿Olvidaste tu contraseña?</Link>
              </div>

              <div className="text-center">
                <Link to="/register" className="text-sm text-primary-600">¿No tienes cuenta? Crear una</Link>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">Credenciales de prueba:</p>
              <p className="text-xs text-gray-400">Admin: admin / admin123</p>
            </div>
          </div>
        </div>

        <p className="text-center text-white/80 text-sm mt-6 lg:col-span-2">FerreSync v1.0 — Sistema de Gestión</p>
      </div>
    </div>
  );
};

export default Login;
