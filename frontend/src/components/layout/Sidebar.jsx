import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiHome,
  HiShoppingCart,
  HiCube,
  HiUsers,
  HiCreditCard,
  HiChartBar,
  HiCog,
  HiChat
} from 'react-icons/hi';

const Sidebar = () => {
  const { user, isAdmin } = useAuth();

  const menuItems = [
    { path: '/', icon: HiHome, label: 'Dashboard' },
    { path: '/pos', icon: HiShoppingCart, label: 'Punto de Venta' },
    { path: '/inventory', icon: HiCube, label: 'Inventario' },
    { path: '/customers', icon: HiUsers, label: 'Clientes' },
    { path: '/accounts', icon: HiCreditCard, label: 'Cuentas por Cobrar' },
    { path: '/reports', icon: HiChartBar, label: 'Reportes', adminOnly: true },
    { path: '/chatbot', icon: HiChat, label: 'Asistente IA' },
    { path: '/settings', icon: HiCog, label: 'Configuración', adminOnly: true },
  ];

  const filteredItems = menuItems.filter(
    item => !item.adminOnly || isAdmin()
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-primary-600 flex items-center gap-2">
          <span className="text-3xl">🔧</span>
          FerreSync
        </h1>
        <p className="text-sm text-gray-500 mt-1">Sistema de Gestión</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {filteredItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  isActive ? 'sidebar-link-active' : 'sidebar-link'
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-700">{user?.fullName}</p>
          <p className="text-xs text-gray-500">
            {user?.role === 'ADMIN' ? 'Administrador' : 'Vendedor'}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
