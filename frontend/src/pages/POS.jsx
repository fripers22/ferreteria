import { useState, useEffect, useRef } from 'react';
import { productsService, customersService, salesService } from '../services';
import toast from 'react-hot-toast';
import {
  HiSearch,
  HiPlus,
  HiMinus,
  HiTrash,
  HiCash,
  HiCreditCard,
  HiUser
} from 'react-icons/hi';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    loadInitialData();
    searchRef.current?.focus();
  }, []);

  const loadInitialData = async () => {
    try {
      const [productsRes, customersRes] = await Promise.all([
        productsService.getAll({ active: true }),
        customersService.getAll()
      ]);
      setProducts(productsRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (error) {
      toast.error('Error cargando datos');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search)
  );

  const addToCart = (product) => {
    const existing = cart.find(item => item.productId === product.id);

    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error(`Stock insuficiente. Disponible: ${product.stock}`);
        return;
      }
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      if (product.stock < 1) {
        toast.error('Producto sin stock');
        return;
      }
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: parseFloat(product.salePrice),
        quantity: 1,
        maxStock: product.stock
      }]);
    }
    setSearch('');
    searchRef.current?.focus();
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        if (newQty > item.maxStock) {
          toast.error(`Stock máximo: ${item.maxStock}`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.16;
  const total = subtotal - discount + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Agrega productos al carrito');
      return;
    }

    if (paymentMethod === 'FIADO' && !selectedCustomer) {
      toast.error('Selecciona un cliente para venta a crédito');
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        paymentMethod,
        discount,
        customerId: selectedCustomer?.id
      };

      const response = await salesService.create(saleData);

      if (response.success) {
        toast.success(`Venta #${response.data.id} registrada correctamente`);

        try {
          const pdfBlob = await salesService.getPdf(response.data.id);
          const blobUrl = window.URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `venta-${response.data.id}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(blobUrl);
        } catch (pdfError) {
          console.error('Error descargando PDF de venta:', pdfError);
          toast.error('La venta se registró, pero no se pudo generar el PDF');
        }

        setCart([]);
        setSelectedCustomer(null);
        setDiscount(0);
        loadInitialData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al procesar venta');
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

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)]">
      {/* Panel de productos */}
      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, SKU o código de barras..."
              className="input-field pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-white rounded-xl border border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
            {filteredProducts.slice(0, 20).map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className={`p-3 rounded-lg border text-left transition-all hover:shadow-md ${
                  product.stock <= product.minStock
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-200 hover:border-primary-300 bg-white'
                }`}
              >
                <p className="font-medium text-gray-800 text-sm truncate">{product.name}</p>
                <p className="text-xs text-gray-500">{product.sku}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-semibold text-primary-600">{formatCurrency(product.salePrice)}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    product.stock <= product.minStock
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {product.stock} {product.unit}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Panel de carrito */}
      <div className="w-96 bg-white rounded-xl border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Carrito de Venta</h2>
        </div>

        {/* Cliente */}
        <div className="p-4 border-b border-gray-200">
          <label className="block text-sm text-gray-600 mb-2">Cliente</label>
          <select
            value={selectedCustomer?.id || ''}
            onChange={(e) => setSelectedCustomer(customers.find(c => c.id === parseInt(e.target.value)) || null)}
            className="input-field"
          >
            <option value="">Cliente general</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
        </div>

        {/* Items del carrito */}
        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Carrito vacío</p>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.productId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="w-7 h-7 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                    >
                      <HiMinus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="w-7 h-7 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                    >
                      <HiPlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="w-7 h-7 bg-red-100 text-red-600 rounded flex items-center justify-center hover:bg-red-200"
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Método de pago */}
        <div className="p-4 border-t border-gray-200">
          <label className="block text-sm text-gray-600 mb-2">Método de pago</label>
          <div className="grid grid-cols-2 gap-2">
            {['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'FIADO'].map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  paymentMethod === method
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Totales */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">IVA (16%):</span>
            <span className="font-medium">{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-gray-600">Descuento:</span>
            <input
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-24 px-2 py-1 border rounded text-right"
            />
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total:</span>
            <span className="text-primary-600">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Botón de cobrar */}
        <div className="p-4">
          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className="w-full btn-success py-3 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <HiCash className="w-5 h-5" />
                <span>Cobrar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;
