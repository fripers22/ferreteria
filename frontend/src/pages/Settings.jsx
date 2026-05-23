import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';
import toast from 'react-hot-toast';
import { HiCog, HiLockClosed, HiUser, HiDatabase } from 'react-icons/hi';
import api from '../services/api';
import { useEffect } from 'react';

const emptyNewUser = { email: '', fullName: '', password: '', role: 'VENDEDOR' };

const Settings = () => {
  const { user, isAdmin } = useAuth();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Contraseña actualizada correctamente');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cambiar contraseña');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
        <p className="text-gray-500">Administra tu cuenta y preferencias</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
        {/* Información de la cuenta */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <HiUser className="w-6 h-6 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-800">Mi Cuenta</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Usuario</label>
              <p className="font-medium text-gray-800">{user?.username}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Nombre completo</label>
              <p className="font-medium text-gray-800">{user?.fullName}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Rol</label>
              <span className={`px-3 py-1 rounded-full text-sm ${
                user?.role === 'ADMIN'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {user?.role === 'ADMIN' ? 'Administrador' : 'Vendedor'}
              </span>
            </div>
          </div>
        </div>

        {/* Cambiar contraseña */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <HiLockClosed className="w-6 h-6 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-800">Cambiar Contraseña</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña actual
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Actualizar Contraseña
            </button>
          </form>
        </div>

        {/* Información del sistema */}
        {isAdmin() && (
            <div className="card lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <HiDatabase className="w-6 h-6 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-800">Información del Sistema</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Versión</p>
                <p className="font-semibold text-gray-800">1.0.0</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Base de datos</p>
                <p className="font-semibold text-gray-800">PostgreSQL</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Backend</p>
                <p className="font-semibold text-gray-800">Node.js + Express</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Frontend</p>
                <p className="font-semibold text-gray-800">React + Vite</p>
              </div>
            </div>
          </div>
          )}

        {isAdmin() && (
          <div className="card lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <HiCog className="w-6 h-6 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-800">Gestión de Usuarios</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 mb-6">
              <div>
                <h3 className="font-semibold mb-3">Crear nuevo usuario</h3>
                <CreateUserForm />
              </div>
              <div>
                <h3 className="font-semibold mb-3">Usuarios existentes</h3>
                <UsersList />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function CreateUserForm() {
  const [form, setForm] = useState(emptyNewUser);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.fullName || !form.password) {
      toast.error('Completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      await api.post('/users', { email: form.email, fullName: form.fullName, password: form.password, role: form.role });
      toast.success('Usuario creado');
      setForm(emptyNewUser);
      window.dispatchEvent(new Event('users:changed'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creando usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input placeholder="Correo" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <input placeholder="Nombre completo" className="input-field" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
      <input placeholder="Contraseña" type="password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
        <option value="VENDEDOR">Vendedor</option>
        <option value="ADMIN">Administrador</option>
      </select>
      <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Creando...' : 'Crear Usuario'}</button>
    </form>
  );
}

function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.data || res.data);
    } catch (err) {
      toast.error('Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener('users:changed', onChange);
    return () => window.removeEventListener('users:changed', onChange);
  }, []);

  const handleRoleChange = async (id, role) => {
    try {
      await api.patch(`/users/${id}/role`, { role });
      toast.success('Rol actualizado');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error actualizando rol');
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="space-y-2">
      {users.length === 0 && <p>No hay usuarios</p>}
      {users.map(u => (
        <div key={u.id} className="flex flex-col gap-3 rounded border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-medium">{u.fullName} <span className="text-xs text-gray-500">({u.username || u.email})</span></p>
            <p className="text-xs text-gray-500">Creado: {new Date(u.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2 sm:w-44">
            <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} className="input-field">
              <option value="VENDEDOR">Vendedor</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Settings;
