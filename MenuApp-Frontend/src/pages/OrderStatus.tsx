import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, ChefHat, Package, AlertCircle } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';

interface OrderItem {
  cantidad: number;
  nombre: string;
  precioUnitario: number;
}

interface Order {
  id: number;
  mesa: string;
  estado: string;
  pagoConfirmado: boolean;
  total: number;
  metodoPago: string;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_STYLES: Record<string, string> = {
  Recibido: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  'En Preparación': 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  Listo: 'bg-green-500/20 text-green-500 border-green-500/30',
  Entregado: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  Pendiente: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const StatusIcon = ({ estado }: { estado: string }) => {
  if (estado === 'Recibido' || estado === 'Pendiente') return <Clock size={18} />;
  if (estado === 'En Preparación') return <ChefHat size={18} />;
  return <CheckCircle size={18} />;
};

const OrderStatus = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get('id') || sessionStorage.getItem('lastOrderId');
  const slug = sessionStorage.getItem('menuSlug');

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setError('No se encontró un pedido reciente. Realizá un pedido primero.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data);
      setError('');
    } catch {
      setError('No se pudo obtener el estado del pedido. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="text-primary" size={40} />
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Estado del Pedido</h1>
          <p className="text-gray-400 mt-2">Consultá si tu pedido está listo</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 text-center">
            <AlertCircle className="text-red-500 mx-auto mb-4" size={40} />
            <p className="text-red-400 font-bold">{error}</p>
            {slug && (
              <Link to={`/m/${slug}`} className="mt-6 inline-block text-primary font-black text-sm">
                Volver al menú
              </Link>
            )}
          </div>
        ) : order ? (
          <div className="bg-gray-900 rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Pedido #{order.id}</p>
                <h2 className="text-3xl font-black text-white mt-1">Mesa {order.mesa}</h2>
              </div>
              <span className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 border ${STATUS_STYLES[order.estado] ?? STATUS_STYLES['Recibido']}`}>
                <StatusIcon estado={order.estado} />
                {order.estado}
              </span>
            </div>

            <div className="space-y-2 mb-6">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white/5 px-4 py-3 rounded-xl">
                  <span className="text-gray-300 text-sm">{item.cantidad}x {item.nombre}</span>
                  <span className="text-white font-bold text-sm">${item.precioUnitario * item.cantidad}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center border-t border-white/5 pt-4 mb-6">
              <span className="text-gray-400 font-bold">Total</span>
              <span className="text-2xl font-black text-primary">${order.total}</span>
            </div>

            {order.estado === 'Listo' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-black text-green-400 text-sm">¡LISTO PARA RETIRAR!</p>
                  <p className="text-green-400/70 text-xs">Dirigite a la caja</p>
                </div>
              </div>
            )}

            {order.estado === 'En Preparación' && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                  <ChefHat className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-black text-orange-400 text-sm">EN PREPARACIÓN</p>
                  <p className="text-orange-400/70 text-xs">Aguardá unos minutos</p>
                </div>
              </div>
            )}

            {(order.estado === 'Recibido' || order.estado === 'Pendiente') && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-black text-yellow-400 text-sm">PEDIDO RECIBIDO</p>
                  <p className="text-yellow-400/70 text-xs">Estamos preparando tu pedido</p>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="text-center mt-8 space-y-3">
          <button
            onClick={fetchOrder}
            className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all border border-white/10"
          >
            Actualizar
          </button>
          {slug && (
            <div>
              <Link to={`/m/${slug}`} className="text-primary hover:text-primary/80 font-bold text-sm">
                Volver al menú
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;
