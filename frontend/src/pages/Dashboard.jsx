import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { salesService, inventoryService, accountsService } from '../services';
import {
  HiCurrencyDollar,
  HiShoppingCart,
  HiCube,
  HiExclamation,
  HiCreditCard,
  HiTrendingUp
} from 'react-icons/hi';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    dailySales: 0,
    transactionCount: 0,
    lowStockCount: 0,
    pendingAccounts: 0,
    inventoryValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [dailyData, lowStockData, accountsData, inventoryData] = await Promise.all([
        salesService.getDaily(),
        inventoryService.getLowStock(),
        accountsService.getSummary(),
        inventoryService.getValue()
      ]);

      setStats({
        dailySales: dailyData.data?.summary?.totalSales || 0,
        transactionCount: dailyData.data?.summary?.totalTransactions || 0,
        lowStockCount: lowStockData.data?.length || 0,
        pendingAccounts: accountsData.data?.totalPending || 0,
        inventoryValue: inventoryData.data?.totalSaleValue || 0
      });

      setRecentSales(dailyData.data?.sales?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  const statCards = [
    {
      title: 'Ventas del Día',
      value: formatCurrency(stats.dailySales),
      icon: HiCurrencyDollar,
      color: 'text-green-600',
      bgLight: 'bg-green-50'
    },
    {
      title: 'Transacciones',
      value: stats.transactionCount,
      icon: HiShoppingCart,
      color: 'text-blue-600',
      bgLight: 'bg-blue-50'
    },
    {
      title: 'Productos Bajo Stock',
      value: stats.lowStockCount,
      icon: HiExclamation,
      color: stats.lowStockCount > 0 ? 'text-red-600' : 'text-gray-600',
      bgLight: stats.lowStockCount > 0 ? 'bg-red-50' : 'bg-gray-50'
    },
    {
      title: 'Cuentas Pendientes',
      value: formatCurrency(stats.pendingAccounts),
      icon: HiCreditCard,
      color: 'text-orange-600',
      bgLight: 'bg-orange-50'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Bienvenido, {user?.fullName}
        </h1>
        <p className="text-gray-500">Resumen de actividad de hoy</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.bgLight} rounded-lg flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Ventas Recientes</h2>
          {recentSales.length > 0 ? (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">Venta #{sale.id}</p>
                    <p className="text-sm text-gray-500">
                      {sale.customer?.name || 'Cliente general'} - {sale.paymentMethod}
                    </p>
                  </div>
                  <p className="font-semibold text-green-600">{formatCurrency(sale.total)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay ventas registradas hoy</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Valor del Inventario</h2>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <HiCube className="w-16 h-16 text-primary-600 mx-auto mb-4" />
              <p className="text-3xl font-bold text-gray-800">{formatCurrency(stats.inventoryValue)}</p>
              <p className="text-gray-500 mt-2">Valor total en productos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Accesos Rápidos</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <a href="/pos" className="p-4 bg-primary-50 rounded-lg text-center hover:bg-primary-100 transition-colors">
            <HiShoppingCart className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <p className="font-medium text-gray-800">Nueva Venta</p>
          </a>
          <a href="/inventory" className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition-colors">
            <HiCube className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-gray-800">Inventario</p>
          </a>
          <a href="/customers" className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors">
            <HiCreditCard className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="font-medium text-gray-800">Clientes</p>
          </a>
          <a href="/accounts" className="p-4 bg-orange-50 rounded-lg text-center hover:bg-orange-100 transition-colors">
            <HiTrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="font-medium text-gray-800">Cuentas</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
