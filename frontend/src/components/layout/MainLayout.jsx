import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const MainLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-[100dvh] bg-gray-100 flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 flex min-w-0 flex-col">
        <Topbar />
        <main className="flex-1 min-w-0 px-4 py-4 pb-28 overflow-x-hidden overflow-y-auto sm:px-6 sm:py-6 lg:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
