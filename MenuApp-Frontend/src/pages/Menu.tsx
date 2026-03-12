import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, Search, Plus, Minus, X, Utensils, CheckCircle, ArrowRight } from 'lucide-react';
import api from '../api/axios';
import { useCartStore } from '../context/cartStore';

const Menu = () => {
  const { slug } = useParams();
  const [local, setLocal] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedTableNum, setSelectedTableNum] = useState<string>('');
    const [isOrderSuccess, setIsOrderSuccess] = useState(false);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'MercadoPago'>('Efectivo');
    const [showMercadoPagoModal, setShowMercadoPagoModal] = useState(false);
    const [mpPaymentStatus, setMpPaymentStatus] = useState<'pending' | 'processing' | 'success' | null>(null);
    const [localPaymentInfo, setLocalPaymentInfo] = useState<any>({ cbuAlias: '', mercadoPagoLink: '' });

  const { items, addItem, removeItem, total, clearCart } = useCartStore();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await api.get(`/menu/${slug}`);
                setLocal(response.data);
                if (response.data.categorias.length > 0) {
                  setSelectedCategory(response.data.categorias[0].id);
                }
                // Load payment info
                setLocalPaymentInfo({
                  cbuAlias: response.data.cbuAlias || '',
                  mercadoPagoLink: response.data.mercadoPagoLink || ''
                });
      } catch (err) {
        setError('No se pudo cargar el menú. Verificá el enlace.');
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [slug]);

  const handlePlaceOrder = async () => {
      if (!selectedTableNum) {
        alert('Por favor elegí una mesa para continuar.');
        return;
      }

      // Simular sandbox de Mercado Pago
          if (paymentMethod === 'MercadoPago') {
            // Create preference and init Mercado Pago
            try {
              const preferenceResponse = await api.post('/payment/create-preference', {
                items: items.map(item => ({
                  nombre: item.nombre,
                  precioUnitario: item.precio,
                  cantidad: item.cantidad
                })),
                localId: local.id
              });

              const { preferenceId } = preferenceResponse.data;

              if (preferenceId) {
                // Initialize Mercado Pago SDK
                const mp = new (window as any).MercadoPago('TEST-tu-public-key-aqui', {
                  locale: 'es-AR'
                });

                mp.bricks().create('wallet', 'wallet_container', {
                  initialization: {
                    preferenceId: preferenceId
                  },
                  customization: {
                    visual: {
                      buttonBackground: '#FF6B00',
                      buttonText: 'Pagar ahora'
                    }
                  }
                });

                setShowMercadoPagoModal(true);
              }
            } catch (err) {
              console.error('Error creating preference:', err);
              // Fallback to simulation if Mercado Pago fails
              setShowMercadoPagoModal(true);
              setMpPaymentStatus('processing');
              setTimeout(() => {
                setMpPaymentStatus('success');
                setTimeout(() => {
                  setShowMercadoPagoModal(false);
                  confirmOrder();
                }, 1500);
              }, 2000);
            }

            return;
          }

      confirmOrder();
    };

    const confirmOrder = async () => {
      setPlacingOrder(true);
      try {
        await api.post('/orders', {
          localId: local.id,
          mesa: selectedTableNum,
          metodoPago: paymentMethod,
          total: total(),
          items: items.map(item => ({
            productId: item.productId,
            cantidad: item.cantidad,
            precioUnitario: item.precio,
            aclaracion: ''
          }))
        });
        setIsOrderSuccess(true);
        clearCart();
      } catch (err) {
        alert('Error al enviar el pedido. Por favor intentá de nuevo.');
      } finally {
        setPlacingOrder(false);
      }
    };

  if (loading) return <div className="flex justify-center items-center h-screen bg-gray-950 text-white">Cargando menú...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500 bg-gray-950">{error}</div>;

  if (isOrderSuccess) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-8 animate-bounce">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-4xl font-black text-white mb-4 italic uppercase tracking-tighter">¡Pedido Recibido!</h2>
        <p className="text-gray-400 max-w-sm mb-10 font-medium leading-relaxed">Estamos preparando lo mejor de **{local.nombre}** para servírtelo en la **Mesa {selectedTableNum}**.</p>
        <button 
          onClick={() => setIsOrderSuccess(false)}
          className="bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-primary/20"
        >
                  Volver al Menú
                </button>
              </div>
            );
          }

          // Mercado Pago Modal - Transferencia
            if (showMercadoPagoModal) {
              return (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
                    <h3 className="text-2xl font-black text-gray-800 mb-2">💳 Pago con Mercado Pago</h3>

                    <div className="bg-blue-50 rounded-2xl p-4 mb-4">
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Total a pagar:</p>
                      <p className="text-3xl font-black text-blue-700">${total()}</p>
                    </div>

                    <div id="wallet_container" className="mb-4"></div>

                    <button 
                      onClick={() => {
                        // Simulate payment for testing
                        setMpPaymentStatus('processing');
                        setTimeout(() => {
                          setMpPaymentStatus('success');
                          setTimeout(() => {
                            setShowMercadoPagoModal(false);
                            confirmOrder();
                          }, 1500);
                        }, 2000);
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg"
                    >
                      ✅ Simular pago (Testing)
                    </button>

                    <button 
                      onClick={() => setShowMercadoPagoModal(false)}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-2xl font-bold text-sm transition-all mt-2"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              );
            }

          const filteredCategories = local.categorias.map((cat: any) => ({
    ...cat,
    productos: cat.productos.filter((p: any) => 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter((cat: any) => cat.productos.length > 0);

  return (
    <div className="min-h-screen bg-gray-950 pb-24 text-gray-100">
      {/* Header */}
      <div className="relative h-64 overflow-hidden">
        {local.logo && (
          <div className="absolute inset-0">
            <img src={local.logo} alt="" className="w-full h-full object-cover opacity-30 blur-sm scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent"></div>
          </div>
        )}
        <div className="relative z-10 h-full flex flex-col justify-end p-6 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-5">
            {local.logo && (
              <div className="p-1 bg-gradient-to-br from-primary to-orange-500 rounded-2xl shadow-2xl">
                <img src={local.logo} alt={local.nombre} className="w-20 h-20 rounded-xl object-cover" />
              </div>
            )}
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white mb-1 uppercase italic">{local.nombre}</h1>
              <div className="flex items-center gap-2 text-primary font-medium text-sm">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                Abierto ahora • San Juan, Argentina
              </div>
            </div>
          </div>
          
          <div className="mt-8 relative max-w-md">
            <div className="glass rounded-2xl px-5 py-3 flex items-center gap-3 shadow-xl">
              <Search size={20} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="¿Qué te gustaría comer?" 
                className="bg-transparent border-none outline-none w-full placeholder:text-gray-500 text-sm font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="sticky top-0 bg-gray-950/80 backdrop-blur-xl z-20 shadow-xl border-y border-white/5 overflow-x-auto no-scrollbar py-5 flex gap-4 px-6 justify-start md:justify-center">
        {local.categorias.map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              const element = document.getElementById(`cat-${cat.id}`);
              element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
              selectedCategory === cat.id 
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="px-6 mt-10 space-y-12 max-w-4xl mx-auto">
        {filteredCategories.map((cat: any) => (
          <div key={cat.id} id={`cat-${cat.id}`} className="animate-in fade-in slide-in-from-bottom-5 duration-500">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
              <span className="w-8 h-1 bg-primary rounded-full"></span>
              {cat.nombre}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {cat.productos.map((prod: any) => (
                <div key={prod.id} className="group bg-gray-900/60 rounded-3xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
                  <div className="relative h-48 overflow-hidden">
                    {prod.imagen ? (
                      <img 
                        src={prod.imagen} 
                        alt={prod.nombre} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400'; // Default food fallback
                          (e.target as HTMLImageElement).onerror = null; // Prevent infinite loops
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <Utensils className="text-white/20" size={48} />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 glass px-3 py-1.5 rounded-xl font-black text-white shadow-lg">
                      ${prod.precio}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-xl text-white mb-2 group-hover:text-primary transition-colors">{prod.nombre}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-6 leading-relaxed">{prod.descripcion}</p>
                    <button 
                      onClick={() => addItem({
                        productId: prod.id,
                        nombre: prod.nombre,
                        precio: prod.precio,
                        cantidad: 1,
                        imagen: prod.imagen
                      })}
                      className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20"
                    >
                      <Plus size={18} /> AGREGAR AL CARRITO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cart Button */}
      {items.length > 0 && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-8 right-8 bg-orange-600 hover:bg-orange-700 text-white pl-6 pr-8 py-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex items-center gap-4 animate-bounce-subtle z-30 ring-4 ring-gray-950/50"
        >
          <div className="relative">
            <ShoppingCart size={28} />
            <span className="absolute -top-3 -right-3 bg-white text-orange-600 text-[11px] font-black px-2 py-1 rounded-lg shadow-xl">
              {items.reduce((acc, i) => acc + i.cantidad, 0)}
            </span>
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-tighter opacity-80 leading-none mb-1">Ver Pedido</p>
            <p className="text-lg font-black leading-none">${total()}</p>
          </div>
        </button>
      )}

      {/* Cart Modal */}
            {isCartOpen && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-gray-900/100 w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[80vh] rounded-t-[3rem] sm:rounded-[2.5rem] flex flex-col overflow-hidden border-t border-white/20 sm:border border-white/20 shadow-[0_0_100px_rgba(0,0,0,0.8)] opacity-100">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <ShoppingCart className="text-primary" />
                </div>
                Tu Carrito
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-3 hover:bg-white/5 rounded-2xl text-gray-400 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-5 group">
                  <div className="w-20 h-20 rounded-2xl bg-gray-800 overflow-hidden flex-shrink-0">
                    {item.imagen && <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-white group-hover:text-primary transition-colors">{item.nombre}</h4>
                    <p className="text-primary font-black">${item.precio}</p>
                  </div>
                  <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-2 border border-white/5">
                    <button onClick={() => removeItem(item.productId)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors"><Minus size={14} /></button>
                    <span className="font-black text-lg min-w-[20px] text-center">{item.cantidad}</span>
                    <button onClick={() => addItem(item)} className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors"><Plus size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 border-t border-white/5 bg-black/20">
              {/* Table Selection */}
              <div className="mb-8">
                <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-3">Elegí tu mesa</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                  {local.mesas && local.mesas.map((mesa: any) => (
                    <button 
                      key={mesa.id}
                      onClick={() => setSelectedTableNum(mesa.numero)}
                      className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-black transition-all border ${
                        selectedTableNum === mesa.numero 
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105 select-none' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {mesa.numero}
                    </button>
                  ))}
                  {(!local.mesas || local.mesas.length === 0) && (
                    <p className="text-gray-600 text-[10px] font-bold">No hay mesas configuradas.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-end mb-8">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Total del pedido</p>
                  <p className="text-4xl font-black text-white leading-none">${total()}</p>
                </div>
              </div>

              {/* Payment Method selection */}
              <div className="mb-8">
                <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-3">¿Cómo vas a pagar?</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setPaymentMethod('Efectivo')}
                    className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all font-bold ${
                      paymentMethod === 'Efectivo' 
                      ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5' 
                      : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
                    }`}
                  >
                    💵 Efectivo
                  </button>
                  <button 
                                      onClick={() => setPaymentMethod('MercadoPago')}
                                      className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all font-bold ${
                                        paymentMethod === 'MercadoPago' 
                                        ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5' 
                                        : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
                                      }`}
                                    >
                                      📱 Mercado Pago
                                    </button>
                </div>
              </div>
              <button 
                disabled={placingOrder}
                className={`w-full py-6 rounded-[2.5rem] font-black text-xl tracking-widest shadow-[0_20px_50px_rgba(234,88,12,0.3)] transition-all duration-500 flex items-center justify-center gap-4 group relative overflow-hidden ${
                  placingOrder 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-primary to-orange-600 text-white hover:scale-[1.02] active:scale-95 hover:shadow-[0_25px_60px_rgba(234,88,12,0.4)]'
                }`}
                onClick={handlePlaceOrder}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                {placingOrder ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>ENVIANDO...</span>
                  </div>
                ) : (
                  <>
                    <span>CONFIRMAR PEDIDO</span>
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
