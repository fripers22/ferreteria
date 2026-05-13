import { useState, useEffect } from 'react';
import { salesService, inventoryService } from '../services';
import { useAuth } from '../context/AuthContext';
import { HiChartBar, HiCalendar, HiTrendingUp, HiCube } from 'react-icons/hi';

const Reports = () => {
  const { isAdmin } = useAuth();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [salesData, setSalesData] = useState([]);
  const [inventoryValue, setInventoryValue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const loadReports = async () => {
    try {
      const [salesRes, inventoryRes] = await Promise.all([
        salesService.getAll(dateRange),
        inventoryService.getValue()
      ]);
      setSalesData(salesRes.data || []);
      setInventoryValue(inventoryRes.data);
    } catch (error) {
      console.error('Error cargando reportes:', error);
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

  const totalSales = salesData.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
  const totalTransactions = salesData.length;
  const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  const paymentMethodStats = salesData.reduce((acc, sale) => {
    acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + parseFloat(sale.total);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
          <p className="text-gray-500">Análisis de ventas e inventario</p>
        </div>
      </div>

      {/* Filtro de fechas */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <HiCalendar className="w-5 h-5 text-gray-500" />
          <div>
            <label className="block text-xs text-gray-500 mb-1">Desde</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white">
          <HiTrendingUp className="w-8 h-8 text-green-200 mb-2" />
          <p className="text-green-100">Total Ventas</p>
          <p className="text-3xl font-bold">{formatCurrency(totalSales)}</p>
        </div>
        <div className="card">
          <HiChartBar className="w-8 h-8 text-blue-500 mb-2" />
          <p className="text-gray-500">Transacciones</p>
          <p className="text-3xl font-bold text-gray-800">{totalTransactions}</p>
        </div>
        <div className="card">
          <HiTrendingUp className="w-8 h-8 text-purple-500 mb-2" />
          <p className="text-gray-500">Ticket Promedio</p>
          <p className="text-3xl font-bold text-gray-800">{formatCurrency(averageTicket)}</p>
        </div>
        <div className="card">
          <HiCube className="w-8 h-8 text-orange-500 mb-2" />
          <p className="text-gray-500">Valor Inventario</p>
          <p className="text-3xl font-bold text-gray-800">{formatCurrency(inventoryValue?.totalSaleValue || 0)}</p>
        </div>
      </div>

      {/* Ventas por método de pago */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Ventas por Método de Pago</h2>
          <div className="space-y-4">
            {Object.entries(paymentMethodStats).map(([method, amount]) => (
              <div key={method} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">{method}</span>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 rounded-full h-2"
                      style={{ width: `${(amount / totalSales) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumen de Inventario</h2>
          {inventoryValue && (
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">Total de Productos</span>
                <span className="font-medium">{inventoryValue.totalProducts}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">Unidades en Stock</span>
                <span className="font-medium">{inventoryValue.totalItems}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">Valor al Costo</span>
                <span className="font-medium">{formatCurrency(inventoryValue.totalCostValue)}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">Valor de Venta</span>
                <span className="font-medium">{formatCurrency(inventoryValue.totalSaleValue)}</span>
              </div>
              <div className="flex justify-between py-3 bg-green-50 px-3 rounded-lg">
                <span className="text-green-700 font-medium">Ganancia Potencial</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(inventoryValue.potentialProfit)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Últimas ventas */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Últimas Ventas del Período</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">#</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Vendedor</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Método</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {salesData.slice(0, 10).map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{sale.id}</td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(sale.createdAt).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-4 py-3 text-sm">{sale.customer?.name || 'General'}</td>
                  <td className="px-4 py-3 text-sm">{sale.user?.fullName}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      sale.paymentMethod === 'FIADO'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(sale.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
