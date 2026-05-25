import { useEffect, useState } from 'react';
import { customersService, salesService } from '../../services';

const POSModal = ({ open, onClose, cartData, onSaleCreated }) => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      try {
        const res = await customersService.getAll({ limit: 50 });
        setCustomers(res.data || []);
      } catch (e) {
        setCustomers([]);
      }
    };
    load();
  }, [open]);

  if (!open) return null;

  const items = (cartData?.data?.cart) || [];
  const total = cartData?.data?.total || items.reduce((s, it) => s + (it.lineTotal || 0), 0);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const payload = {
        customerId: selectedCustomer || null,
        items: items.map((it) => ({ productId: it.product?.id, quantity: it.quantity })),
        paymentMethod,
        discount: Number(discount || 0)
      };

      const result = await salesService.create(payload);
      onSaleCreated(result.data);
      onClose();
    } catch (error) {
      console.error('Error creando venta desde POS modal', error);
      alert(error?.response?.data?.message || 'Error al crear la venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl bg-white rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-3">Confirmar venta propuesta</h3>
        <div className="mb-4">
          <div className="text-sm text-gray-600">Productos:</div>
          <ul className="mt-2 max-h-48 overflow-auto">
            {items.map((it, i) => (
              <li key={i} className="flex justify-between py-1 border-b last:border-b-0">
                <div>
                  <div className="font-medium">{it.product?.name || it.query}</div>
                  <div className="text-xs text-gray-500">SKU: {it.product?.sku || 'N/D'}</div>
                </div>
                <div className="text-right">
                  <div>{it.quantity} x {new Intl.NumberFormat('es-MX', {style:'currency',currency:'MXN'}).format(it.product?.salePrice || it.lineTotal || 0)}</div>
                  <div className="text-sm font-semibold">{new Intl.NumberFormat('es-MX', {style:'currency',currency:'MXN'}).format(it.lineTotal || 0)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-600">Cliente (opcional)</label>
            <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="mt-1 input-field w-full">
              <option value="">Cliente general</option>
              {customers.map((c) => (
                <option value={c.id} key={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600">Método de pago</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 input-field w-full">
              <option>EFECTIVO</option>
              <option>TARJETA</option>
              <option>FIADO</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm text-gray-600">Descuento</label>
          <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="input-field w-32" />
          <div className="ml-auto font-semibold">Total: {new Intl.NumberFormat('es-MX', {style:'currency',currency:'MXN'}).format(total - Number(discount || 0))}</div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-outline">Cancelar</button>
          <button type="button" onClick={handleConfirm} disabled={loading} className="btn-primary">{loading ? 'Procesando...' : 'Crear venta'}</button>
        </div>
      </div>
    </div>
  );
};

export default POSModal;
