import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNavigationItems } from './navigation';

const Sidebar = () => {
  const { user, isAdmin } = useAuth();
  const filteredItems = getNavigationItems(isAdmin());

  return (
    <>
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 min-h-[100dvh] flex-col sticky top-0">
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

      <nav className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-xl shadow-[0_-10px_30px_rgba(15,23,42,0.08)]">
        <div className="no-scrollbar flex items-stretch gap-1 overflow-x-auto px-2 py-2">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  'min-w-[72px] flex-1 shrink-0 rounded-2xl px-3 py-2 text-center transition-all duration-200',
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                    : 'text-gray-600 hover:bg-gray-100'
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <span className="flex flex-col items-center gap-1">
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span className="text-[11px] font-medium leading-tight whitespace-nowrap">
                    {item.label}
                  </span>
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
