import { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiUser, HiLockClosed, HiEye, HiEyeOff } from 'react-icons/hi';

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
    <div className="relative min-h-[100dvh] overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-6 xl:grid-cols-2 xl:gap-10">
        <div className="hidden xl:flex flex-col items-start justify-center gap-6 pl-8 text-white 2xl:pl-12">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
            <WrenchMark className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-4xl font-bold leading-tight">FerreSync</h2>
          <p className="text-lg text-white/90 max-w-md">Gestiona ventas, inventario y clientes con facilidad.</p>
          <div className="w-3/4 mt-6 bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/10 shadow-2xl">
            <p className="text-sm uppercase tracking-[0.24em] text-white/60">Acceso rápido</p>
            <h3 className="mt-2 text-2xl font-semibold">Todo el control en un solo lugar</h3>
            <p className="mt-3 text-white/80">Entrarás al panel para administrar ventas, inventario, clientes y cuentas con una vista más limpia.</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-white/85">
              <div className="rounded-xl bg-white/10 p-3">Inventario</div>
              <div className="rounded-xl bg-white/10 p-3">Ventas</div>
              <div className="rounded-xl bg-white/10 p-3">Clientes</div>
              <div className="rounded-xl bg-white/10 p-3">Reportes</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-[28rem] card sm:p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <WrenchMark className="w-9 h-9 text-primary-600" />
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

        <p className="text-center text-white/80 text-sm mt-2 xl:col-span-2">FerreSync v1.0 — Sistema de Gestión</p>
      </div>
    </div>
  );
};

export default Login;
