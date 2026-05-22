import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

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

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await api.post('/users/register', { email, fullName, password, confirmPassword });
      toast.success('Usuario creado. Revisa tu correo si corresponde.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creando usuario');
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
          <h2 className="text-4xl font-bold">Únete a FerreSync</h2>
          <p className="text-lg text-white/90 max-w-md">Crea tu cuenta para gestionar ventas, inventario y más desde una interfaz simple y rápida.</p>
          <div className="w-3/4 mt-6 bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/10 shadow-2xl">
            <p className="text-sm uppercase tracking-[0.24em] text-white/60">Beneficios</p>
            <ul className="list-disc list-inside text-white/80 mt-2">
              <li>Control de inventario</li>
              <li>Registro de ventas y clientes</li>
              <li>Soporte para recuperación de contraseña</li>
            </ul>
            <div className="mt-5 rounded-xl bg-white/10 p-3 text-sm text-white/85">
              El registro crea un usuario con rol de vendedor por defecto.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-md card">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">Crear Cuenta</h1>
              <p className="text-gray-500 mt-2">Regístrate con correo y contraseña</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" />
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary">
                {loading ? 'Creando...' : 'Crear cuenta'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button onClick={() => navigate('/login')} className="text-primary-600">← Volver al Login</button>
            </div>
          </div>
        </div>

        <p className="text-center text-white/80 text-sm mt-6 lg:col-span-2">
          FerreSync v1.0 — Sistema de Gestión
        </p>
      </div>
    </div>
  );
}
