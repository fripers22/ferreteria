import { useState, useEffect } from 'react';
import { customersService } from '../services';
import toast from 'react-hot-toast';
import { HiSearch, HiPlus, HiPencil, HiUser, HiPhone, HiMail } from 'react-icons/hi';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    rfc: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await customersService.getAll();
      setCustomers(response.data || []);
    } catch (error) {
      toast.error('Error cargando clientes');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '', address: '', rfc: '' });
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      rfc: customer.rfc || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await customersService.update(editingCustomer.id, formData);
        toast.success('Cliente actualizado');
      } else {
        await customersService.create(formData);
        toast.success('Cliente creado');
      }
      setShowModal(false);
      loadCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error guardando cliente');
    }
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
          <p className="text-gray-500">{customers.length} clientes registrados</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center justify-center gap-2 sm:justify-start">
          <HiPlus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      {/* Búsqueda */}
      <div className="card">
        <div className="relative max-w-md">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <HiUser className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{customer.name}</h3>
                  {customer.rfc && (
                    <p className="text-xs text-gray-500">RFC: {customer.rfc}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => openEditModal(customer)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded"
              >
                <HiPencil className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <HiPhone className="w-4 h-4" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <HiMail className="w-4 h-4" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <p className="text-sm text-gray-500">{customer.address}</p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {customer._count?.sales || 0} compras
              </span>
              {customer.accounts?.[0]?.balance > 0 && (
                <span className="text-sm font-medium text-orange-600">
                  Saldo: ${parseFloat(customer.accounts[0].balance).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="card text-center py-12">
          <HiUser className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron clientes</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90dvh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">
                  {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RFC</label>
                  <input
                    type="text"
                    value={formData.rfc}
                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingCustomer ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
