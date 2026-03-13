import { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, ChefHat, Utensils, Package, XCircle } from 'lucide-react';
import api from '../api/axios';

const OrderStatus = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/menu/sanjuan-gourmet');
      const localId = response.data.id;
      
      // Get all orders for this local
      // For demo, we'll simulate with mock data
      setOrders([
        { id: 1, mesa: '1', estado: 'Listo', items: [{ nombre: 'IPA Artesanal', cantidad: 2 }], total: 2400 },
        { id: 2, mesa: '2', estado: 'En Preparación', items: [{ nombre: 'Pizza Margherita', cantidad: 1 }, { nombre: 'Papas Bravas', cantidad: 1 }], total: 5000 },
        { id: 3, mesa: '3', estado: 'Recibido', items: [{ nombre: 'Honey Beer', cantidad: 3 }], total: 3300 },
        { id: 4, mesa: '4', estado: 'Listo', items: [{ nombre: 'Pizza Margherita', cantidad: 2 }], total: 7000 },
        { id: 5, mesa: '5', estado: 'En Preparación', items: [{ nombre: 'Papas Bravas', cantidad: 2 }], total: 3000 },
        { id: 6, mesa: '6', estado: 'Recibido', items: [{ nombre: 'IPA Artesanal', cantidad: 1 }], total: 1200 },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Recibido':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'En Preparación':
        return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
      case 'Listo':
        return 'bg-green-500/20 text-green-500 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'Recibido':
        return <Clock size={18} />;
      case 'En Preparación':
        return <ChefHat size={18} />;
      case 'Listo':
        return <CheckCircle size={18} />;
      default:
        return <Clock size={18} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="text-primary" size={40} />
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Estado de Pedidos</h1>
          <p className="text-gray-400 mt-2">Consultá si tu pedido está listo para retirar</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order) => (
              <div 
                key={order.id}
                className={`bg-gray-900 rounded-3xl p-6 border transition-all ${
                  order.estado === 'Listo' 
                    ? 'border-green-500/30 shadow-lg shadow-green-500/10' 
                    : 'border-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl ${
                      order.estado === 'Listo' 
                        ? 'bg-green-500 text-white' 
                        : order.estado === 'En Preparación'
                        ? 'bg-orange-500 text-white'
                        : 'bg-yellow-500 text-white'
                    }`}>
                      {order.mesa}
                    </div>
                    <div>
                      <h3 className="font-black text-lg">Mesa {order.mesa}</h3>
                      <p className="text-gray-500 text-xs">{order.items.length} item(s)</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 border ${getStatusColor(order.estado)}`}>
                    {getStatusIcon(order.estado)}
                    {order.estado}
                  </span>
                </div>
                
                {/* Items */}
                <div className="space-y-2 mb-4">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-400">{item.cantidad}x {item.nombre}</span>
                    </div>
                  ))}
                </div>

                {/* Status Message */}
                {order.estado === 'Listo' ? (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="text-white" size={20} />
                      </div>
                      <div>
                        <p className="font-black text-green-400 text-sm">¡LISTO PARA RETIRAR!</p>
                        <p className="text-green-400/70 text-xs">Dirigite a la caja</p>
                      </div>
                    </div>
                  </div>
                ) : order.estado === 'En Preparación' ? (
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                        <ChefHat className="text-white" size={20} />
                      </div>
                      <div>
                        <p className="font-black text-orange-400 text-sm">EN PREPARACIÓN</p>
                        <p className="text-orange-400/70 text-xs">Aguarda unos minutos</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="text-white" size={20} />
                      </div>
                      <div>
                        <p className="font-black text-yellow-400 text-sm">PEDIDO RECIBIDO</p>
                        <p className="text-yellow-400/70 text-xs">Estamos preparando tu pedido</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <button
            onClick={fetchOrders}
            className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all border border-white/10"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;
