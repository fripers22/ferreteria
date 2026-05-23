import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { HiBell, HiLogout, HiUser } from 'react-icons/hi';
import { getNavigationItems } from './navigation';

const Topbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationItems = getNavigationItems(user?.role === 'ADMIN');
  const activeItem = navigationItems.find((item) => item.path === location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">FerreSync</p>
          <div className="flex flex-col gap-0.5">
            <p className="truncate text-sm font-semibold text-gray-800">
              {activeItem?.label || 'Sistema de Gestión'}
            </p>
            <p className="text-xs text-gray-500 capitalize">{getCurrentDate()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700" aria-label="Notificaciones">
            <HiBell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-2 border-l border-gray-200 pl-3 sm:gap-3 sm:pl-4">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <HiUser className="w-4 h-4 text-primary-600" />
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-sm font-medium text-gray-700">{user?.fullName}</p>
              <p className="text-xs text-gray-500">{user?.username}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Cerrar sesión"
            >
              <HiLogout className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
