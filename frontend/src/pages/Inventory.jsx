import { useState, useEffect } from 'react';
import { productsService, categoriesService, inventoryService } from '../services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiSearch,
  HiPlus,
  HiPencil,
  HiFilter,
  HiExclamation,
  HiRefresh
} from 'react-icons/hi';

const Inventory = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [movementProduct, setMovementProduct] = useState(null);

  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    name: '',
    description: '',
    categoryId: '',
    unit: 'pza',
    costPrice: '',
    salePrice: '',
    stock: 0,
    minStock: 5
  });

  const [movementData, setMovementData] = useState({
    type: 'ENTRADA',
    quantity: 1,
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productsService.getAll(),
        categoriesService.getAll()
      ]);
      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      toast.error('Error cargando productos');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                         p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || p.categoryId === parseInt(selectedCategory);
    const matchesLowStock = !showLowStock || p.stock <= p.minStock;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      sku: '',
      barcode: '',
      name: '',
      description: '',
      categoryId: categories[0]?.id || '',
      unit: 'pza',
      costPrice: '',
      salePrice: '',
      stock: 0,
      minStock: 5
    });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      barcode: product.barcode || '',
      name: product.name,
      description: product.description || '',
      categoryId: product.categoryId,
      unit: product.unit,
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      stock: product.stock,
      minStock: product.minStock
    });
    setShowModal(true);
  };

  const openMovementModal = (product) => {
    setMovementProduct(product);
    setMovementData({ type: 'ENTRADA', quantity: 1, reason: '' });
    setShowMovementModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productsService.update(editingProduct.id, formData);
        toast.success('Producto actualizado');
      } else {
        await productsService.create(formData);
        toast.success('Producto creado');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error guardando producto');
    }
  };

  const handleMovement = async (e) => {
    e.preventDefault();
    try {
      await inventoryService.createMovement({
        productId: movementProduct.id,
        ...movementData
      });
      toast.success('Movimiento registrado');
      setShowMovementModal(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error registrando movimiento');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
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
          <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
          <p className="text-gray-500">{products.length} productos registrados</p>
        </div>
        {isAdmin() && (
          <button onClick={openCreateModal} className="btn-primary flex items-center justify-center gap-2 sm:justify-start">
            <HiPlus className="w-5 h-5" />
            Nuevo Producto
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field w-full lg:w-56"
          >
            <option value="">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              showLowStock ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <HiExclamation className="w-5 h-5" />
            Bajo stock
          </button>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">SKU</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Producto</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Categoría</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Costo</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Precio</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Stock</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{product.sku}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{product.name}</p>
                    {product.barcode && (
                      <p className="text-xs text-gray-500">{product.barcode}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{product.category?.name}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(product.costPrice)}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">{formatCurrency(product.salePrice)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-sm ${
                      product.stock <= product.minStock
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {product.stock} {product.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openMovementModal(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Agregar movimiento"
                      >
                        <HiRefresh className="w-4 h-4" />
                      </button>
                      {isAdmin() && (
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                          title="Editar"
                        >
                          <HiPencil className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de producto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90dvh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código de barras</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="sm:col-span-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="input-field"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="input-field"
                  >
                    <option value="pza">Pieza</option>
                    <option value="kg">Kilogramo</option>
                    <option value="m">Metro</option>
                    <option value="l">Litro</option>
                    <option value="bolsa">Bolsa</option>
                    <option value="rollo">Rollo</option>
                    <option value="cubeta">Cubeta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio costo *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio venta *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock inicial</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 5 })}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de movimiento */}
      {showMovementModal && movementProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90dvh] overflow-y-auto">
            <form onSubmit={handleMovement}>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Movimiento de Inventario</h2>
                <p className="text-gray-500 mt-1">{movementProduct.name}</p>
                <p className="text-sm text-gray-400">Stock actual: {movementProduct.stock} {movementProduct.unit}</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de movimiento</label>
                  <select
                    value={movementData.type}
                    onChange={(e) => setMovementData({ ...movementData, type: e.target.value })}
                    className="input-field"
                  >
                    <option value="ENTRADA">Entrada</option>
                    <option value="SALIDA">Salida</option>
                    <option value="AJUSTE">Ajuste (establecer cantidad)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={movementData.quantity}
                    onChange={(e) => setMovementData({ ...movementData, quantity: parseInt(e.target.value) || 1 })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razón / Motivo</label>
                  <input
                    type="text"
                    value={movementData.reason}
                    onChange={(e) => setMovementData({ ...movementData, reason: e.target.value })}
                    placeholder="Ej: Compra a proveedor, Ajuste de inventario..."
                    className="input-field"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowMovementModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
