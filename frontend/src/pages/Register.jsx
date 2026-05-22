import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

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
          <h2 className="text-4xl font-bold">Únete a FerreSync</h2>
          <p className="text-lg text-white/90 max-w-md">Crea tu cuenta para gestionar ventas, inventario y más desde una interfaz simple y rápida.</p>
          <div className="w-3/4 mt-6 bg-white/5 rounded-lg p-6">
            <p className="text-white/90">Beneficios:</p>
            <ul className="list-disc list-inside text-white/80 mt-2">
              <li>Control de inventario</li>
              <li>Registro de ventas y clientes</li>
              <li>Soporte para recuperación de contraseña</li>
            </ul>
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
