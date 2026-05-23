import { useState, useEffect } from 'react';
import { accountsService } from '../services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiCash, HiCreditCard, HiUser, HiClock } from 'react-icons/hi';

const Accounts = () => {
  const { isAdmin } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const [accountsRes, summaryRes] = await Promise.all([
        accountsService.getAll({ hasBalance: true }),
        accountsService.getSummary()
      ]);
      setAccounts(accountsRes.data || []);
      setSummary(summaryRes.data);
    } catch (error) {
      toast.error('Error cargando cuentas');
    } finally {
      setLoading(false);
    }
  };

  const openPaymentModal = (account) => {
    setSelectedAccount(account);
    setPaymentAmount('');
    setPaymentDescription('');
    setShowPaymentModal(true);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await accountsService.createPayment(
        selectedAccount.id,
        parseFloat(paymentAmount),
        paymentDescription || 'Abono a cuenta'
      );
      toast.success('Abono registrado correctamente');
      setShowPaymentModal(false);
      loadAccounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error registrando abono');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Cuentas por Cobrar</h1>
        <p className="text-gray-500">Gestión de créditos y pagos de clientes</p>
      </div>

      {/* Resumen */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          <div className="card bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Total Pendiente</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(summary.totalPending)}</p>
              </div>
              <HiCreditCard className="w-12 h-12 text-orange-200" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Cuentas Activas</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{summary.accountsWithBalance}</p>
              </div>
              <HiUser className="w-12 h-12 text-gray-300" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Límite Total</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{formatCurrency(summary.totalCreditLimit)}</p>
              </div>
              <HiCash className="w-12 h-12 text-gray-300" />
            </div>
          </div>
        </div>
      )}

      {/* Lista de cuentas */}
      <div className="card overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Cuentas con Saldo</h2>
        {accounts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Cliente</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Saldo</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Límite</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Última Actividad</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accounts.map(account => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <HiUser className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{account.customer?.name}</p>
                          <p className="text-xs text-gray-500">{account._count?.transactions} transacciones</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${
                        parseFloat(account.balance) > parseFloat(account.creditLimit) * 0.8
                          ? 'text-red-600'
                          : 'text-orange-600'
                      }`}>
                        {formatCurrency(account.balance)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatCurrency(account.creditLimit)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                        <HiClock className="w-4 h-4" />
                        {formatDate(account.lastActivity)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openPaymentModal(account)}
                        className="btn-success text-sm py-1 px-3"
                      >
                        Registrar Abono
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <HiCreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay cuentas con saldo pendiente</p>
          </div>
        )}
      </div>

      {/* Modal de pago */}
      {showPaymentModal && selectedAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90dvh] overflow-y-auto">
            <form onSubmit={handlePayment}>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Registrar Abono</h2>
                <p className="text-gray-500 mt-1">{selectedAccount.customer?.name}</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saldo actual:</span>
                    <span className="font-bold text-orange-600">
                      {formatCurrency(selectedAccount.balance)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto del abono *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={parseFloat(selectedAccount.balance)}
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <input
                    type="text"
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                    className="input-field"
                    placeholder="Ej: Pago en efectivo, Transferencia..."
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-success">
                  Registrar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
