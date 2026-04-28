import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, Search, Plus, Minus, X, Utensils, CheckCircle, ArrowRight, Star, Clock, MapPin } from 'lucide-react';
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

  const { items, addItem, removeItem, total, clearCart } = useCartStore();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await api.get(`/menu/${slug}`);
        setLocal(response.data);
        if (response.data.categorias.length > 0) {
          setSelectedCategory(response.data.categorias[0].id);
        }
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

    if (paymentMethod === 'MercadoPago') {
      try {
        const preferenceResponse = await api.post('/payment/create-preference', {
          items: items.map(item => ({
            nombre: item.nombre,
            precioUnitario: item.precio,
            cantidad: item.cantidad
          })),
          localId: local.id
        });

        const { initPoint } = preferenceResponse.data;
        if (initPoint) {
          window.location.href = initPoint;
        }
      } catch (err) {
        console.error('Error creating preference:', err);
        alert('Hubo un error al iniciar el pago con Mercado Pago.');
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#080B10] text-white">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="font-bold tracking-widest text-xs uppercase animate-pulse">Cargando Experiencia...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#080B10] p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mb-6 border border-red-500/20">
          <X size={40} />
        </div>
        <h2 className="text-2xl font-black text-white mb-2 uppercase italic">¡Ups! Algo salió mal</h2>
        <p className="text-gray-400 font-medium">{error}</p>
      </div>
    );
  }

  if (isOrderSuccess) {
    return (
      <div className="min-h-screen bg-[#080B10] dot-grid flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 animate-fade-up">
          <div className="w-28 h-28 bg-green-500/10 text-green-500 rounded-[2.5rem] flex items-center justify-center mb-10 mx-auto border border-green-500/20 shadow-2xl shadow-green-500/10 animate-bounce-subtle">
            <CheckCircle size={56} strokeWidth={1.5} />
          </div>
          <h2 className="text-5xl font-black text-white mb-4 italic uppercase tracking-tighter leading-none">
            ¡Pedido <span className="gradient-text">Enviado!</span>
          </h2>
          <p className="text-gray-400 max-w-sm mb-12 font-medium leading-relaxed mx-auto text-lg">
            Estamos preparando tu pedido de <span className="text-white font-bold">{local.nombre}</span> para la <span className="text-primary font-black uppercase">Mesa {selectedTableNum}</span>.
          </p>
          <button 
            onClick={() => setIsOrderSuccess(false)}
            className="shimmer-btn relative overflow-hidden bg-primary text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 shadow-2xl shadow-primary/30"
          >
            Volver al Menú
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
    <div className="min-h-screen bg-[#080B10] pb-32 text-gray-100 selection:bg-primary selection:text-white">
      
      {/* Hero Header */}
      <div className="relative h-[300px] sm:h-[420px] overflow-hidden">
        {local.logo && (
          <div className="absolute inset-0">
            <img src={local.logo} alt="" className="w-full h-full object-cover opacity-40 blur-[2px] scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080B10] via-[#080B10]/40 to-transparent"></div>
          </div>
        )}
        
        <div className="relative z-10 h-full flex flex-col justify-end p-6 sm:p-8 max-w-5xl mx-auto w-full animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
            {local.logo && (
              <div className="p-1 bg-gradient-to-br from-primary to-accent rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl w-fit animate-float">
                <img src={local.logo} alt={local.nombre} className="w-16 h-16 sm:w-32 sm:h-32 rounded-[1.2rem] sm:rounded-[2.2rem] object-cover" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 text-primary font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] mb-2 sm:mb-3">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-pulse"></span>
                Abierto Ahora
              </div>
              <h1 className="text-3xl sm:text-7xl font-black tracking-tighter text-white mb-3 sm:mb-4 uppercase italic leading-none">{local.nombre}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-gray-400 font-semibold text-[10px] sm:text-sm">
                <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-white/5">
                  <MapPin size={12} className="text-primary" /> San Juan
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-white/5">
                  <Star size={12} className="text-amber-400 fill-amber-400" /> 4.9
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-white/5">
                  <Clock size={12} className="text-blue-400" /> 20-30 min
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 sm:mt-12 relative max-w-lg">
            <div className="glass-dark rounded-2xl sm:rounded-[2rem] px-4 py-3 sm:px-6 sm:py-4 flex items-center gap-3 sm:gap-4 shadow-2xl border border-white/10 group focus-within:border-primary/50 transition-all">
              <Search size={18} className="text-gray-500 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="¿Qué te gustaría comer?" 
                className="bg-transparent border-none outline-none w-full placeholder:text-gray-600 text-sm sm:text-base font-semibold text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Navigation */}
      <div className="sticky top-0 bg-[#080B10]/80 backdrop-blur-2xl z-30 border-y border-white/5 overflow-x-auto no-scrollbar py-4 sm:py-6 flex gap-2 sm:gap-3 px-4 sm:px-8 justify-start md:justify-center animate-fade-up" style={{ animationDelay: '100ms' }}>
        {local.categorias.map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              const element = document.getElementById(`cat-${cat.id}`);
              const yOffset = -80; 
              if (element) {
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({top: y, behavior: 'smooth'});
              }
            }}
            className={`px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-[9px] sm:text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-500 whitespace-nowrap ${
              selectedCategory === cat.id 
                ? 'bg-primary text-white shadow-[0_10px_30px_rgba(255,77,28,0.3)] scale-105' 
                : 'bg-white/5 text-gray-500 hover:bg-white/10 border border-white/5'
            }`}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Menu Sections */}
      <div className="px-4 sm:px-8 mt-12 sm:mt-16 space-y-16 sm:space-y-24 max-w-5xl mx-auto">
        {filteredCategories.map((cat: any, idx: number) => (
          <div key={cat.id} id={`cat-${cat.id}`} className="animate-fade-up" style={{ animationDelay: `${idx * 150}ms` }}>
            <div className="flex items-center gap-4 sm:gap-6 mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-4xl font-black uppercase italic tracking-tighter flex items-center gap-3 sm:gap-4">
                <span className="w-8 sm:w-12 h-[2px] sm:h-[3px] bg-primary rounded-full"></span>
                {cat.nombre}
              </h2>
              <span className="text-gray-600 font-bold text-[10px] sm:text-sm bg-white/5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg border border-white/5 uppercase tracking-widest">
                {cat.productos.length} items
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
              {cat.productos.map((prod: any) => (
                <div key={prod.id} className="group glass-dark rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-primary/40 transition-all duration-700 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col xs:flex-row h-full">
                  <div className="relative w-full xs:w-[140px] sm:w-[200px] h-[180px] xs:h-auto overflow-hidden shrink-0">
                    {prod.imagen ? (
                      <>
                        <img 
                          src={prod.imagen} 
                          alt={prod.nombre} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <Utensils className="text-white/10 animate-spin-slow" size={32} />
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 price-badge text-xs sm:text-sm">
                      {formatPrice(prod.precio)}
                    </div>
                  </div>
                  
                  <div className="p-5 sm:p-8 flex flex-col flex-1">
                    <div className="flex-1">
                      <h3 className="font-black text-lg sm:text-2xl text-white mb-2 sm:mb-3 group-hover:text-primary transition-colors leading-tight uppercase italic">{prod.nombre}</h3>
                      <p className="text-[11px] sm:text-sm text-gray-500 font-medium leading-relaxed mb-6 sm:mb-8 line-clamp-2 sm:line-clamp-3 italic">
                        {prod.descripcion || 'Sin descripción disponible.'}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => addItem({
                        productId: prod.id,
                        nombre: prod.nombre,
                        precio: prod.precio,
                        cantidad: 1,
                        imagen: prod.imagen
                      })}
                      className="w-full shimmer-btn relative overflow-hidden bg-white/5 hover:bg-primary text-gray-300 hover:text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 sm:gap-3 transition-all active:scale-95 border border-white/5 hover:border-primary shadow-xl"
                    >
                      <Plus size={14} /> AGREGAR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Checkout Button */}
      {items.length > 0 && (
        <div className="fixed bottom-6 sm:bottom-10 left-0 right-0 z-40 px-4 sm:px-8 pointer-events-none flex justify-center">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="pointer-events-auto bg-gradient-to-r from-primary to-orange-600 text-white px-5 sm:px-8 py-3.5 sm:py-5 rounded-2xl sm:rounded-[2.2rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center gap-3 sm:gap-5 animate-bounce-cart ring-4 sm:ring-8 ring-[#080B10] group backdrop-blur-xl"
          >
            <div className="relative">
              <div className="absolute -inset-2 bg-white/20 rounded-full animate-ping opacity-20"></div>
              <ShoppingCart size={20} />
              <span className="absolute -top-2 -right-2 bg-white text-primary text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md sm:rounded-lg shadow-xl">
                {items.reduce((acc, i) => acc + i.cantidad, 0)}
              </span>
            </div>
            <div className="text-left">
              <p className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-white/70 leading-none mb-1 sm:mb-1.5">Revisar Pedido</p>
              <p className="text-base sm:text-xl font-black leading-none">{formatPrice(total())}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform shrink-0">
              <ArrowRight size={16} sm:size={20} />
            </div>
          </button>
        </div>
      )}

      {/* Full Screen Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsCartOpen(false)}></div>
          
          <div className="absolute inset-y-0 right-0 w-full max-w-xl bg-[#080B10] flex flex-col shadow-[-40px_0_100px_rgba(0,0,0,0.8)] border-l border-white/5 animate-in slide-in-from-right duration-500 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 sm:p-10 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 text-primary font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] mb-1 sm:mb-2">
                  <ShoppingCart size={12} sm:size={14} /> Tu Selección
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Carrito</h2>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)} 
                className="w-10 h-10 sm:w-14 sm:h-14 bg-white/5 hover:bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-90 border border-white/5"
              >
                <X size={20} sm:size={28} />
              </button>
            </div>

            {/* Cart Items & Selections */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 sm:space-y-10 custom-scrollbar">
              <div className="space-y-6 sm:space-y-8">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
                    <Utensils size={60} sm:size={80} className="mb-4 sm:mb-6" strokeWidth={1} />
                    <p className="font-bold text-lg sm:text-xl uppercase italic tracking-widest">El carrito está vacío</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-4 sm:gap-6 group animate-fade-up">
                      <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gray-900 overflow-hidden shrink-0 border border-white/5">
                        {item.imagen && <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-base sm:text-xl text-white uppercase italic tracking-tight mb-1 sm:mb-2 group-hover:text-primary transition-colors">{item.nombre}</h4>
                        <p className="text-primary font-black text-sm sm:text-lg">{formatPrice(item.precio)}</p>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                         <div className="flex items-center gap-3 sm:gap-4 bg-white/5 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-white/10">
                          <button onClick={() => removeItem(item.productId)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-white/10 rounded-lg sm:rounded-xl transition-colors"><Minus size={14} /></button>
                          <span className="font-black text-base sm:text-xl min-w-[20px] text-center text-white">{item.cantidad}</span>
                          <button onClick={() => addItem(item)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 rounded-lg sm:rounded-xl transition-colors"><Plus size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Selections (Only if items exist) */}
              {items.length > 0 && (
                <div className="space-y-8 sm:space-y-10 pt-6 sm:pt-8 border-t border-white/5">
                  {/* Table Selection */}
                  <div>
                    <p className="text-gray-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-3 sm:mb-5">Elegí tu mesa</p>
                    <div className="flex flex-wrap gap-2 sm:grid sm:grid-cols-4 sm:gap-3">
                      {local.mesas && local.mesas.map((mesa: any) => (
                        <button
                          key={mesa.id}
                          onClick={() => setSelectedTableNum(mesa.numero)}
                          className={`flex-1 min-w-[70px] sm:min-w-0 py-3 sm:py-4 px-2 rounded-xl sm:rounded-2xl border-2 transition-all font-black text-sm sm:text-lg truncate ${
                            selectedTableNum === mesa.numero
                              ? 'border-primary bg-primary/10 text-primary shadow-[0_0_20px_rgba(255,107,0,0.2)]'
                              : 'border-white/5 bg-white/5 text-gray-500 hover:border-white/10'
                          }`}
                          title={mesa.numero}
                        >
                          {mesa.numero}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <button 
                      onClick={() => setPaymentMethod('Efectivo')}
                      className={`flex items-center justify-center gap-2 sm:gap-3 py-3.5 sm:py-5 rounded-2xl sm:rounded-[1.8rem] border-2 transition-all font-black text-[9px] sm:text-xs uppercase tracking-widest ${
                        paymentMethod === 'Efectivo' 
                        ? 'bg-primary/10 border-primary text-primary shadow-xl shadow-primary/10' 
                        : 'bg-white/5 border-white/5 text-gray-600 hover:bg-white/10'
                      }`}
                    >
                      💵 Efectivo
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('MercadoPago')}
                      className={`flex items-center justify-center gap-2 sm:gap-3 py-3.5 sm:py-5 rounded-2xl sm:rounded-[1.8rem] border-2 transition-all font-black text-[9px] sm:text-xs uppercase tracking-widest ${
                        paymentMethod === 'MercadoPago' 
                        ? 'bg-primary/10 border-primary text-primary shadow-xl shadow-primary/10' 
                        : 'bg-white/5 border-white/5 text-gray-600 hover:bg-white/10'
                      }`}
                    >
                      📱 M. Pago
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer (Fixed at bottom) */}
            <div className="p-6 sm:p-10 bg-black/40 border-t border-white/5 shrink-0">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex justify-between items-end mb-4 sm:mb-6">
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Total</span>
                  <span className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter leading-none">{formatPrice(total())}</span>
                </div>

                <button 
                  disabled={placingOrder || items.length === 0}
                  onClick={handlePlaceOrder}
                  className={`w-full py-5 sm:py-7 rounded-[1.8rem] sm:rounded-[2.5rem] font-black text-sm sm:text-lg tracking-[0.15em] transition-all duration-500 flex items-center justify-center gap-3 sm:gap-5 shimmer-btn relative overflow-hidden ${
                    placingOrder || items.length === 0
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50' 
                    : 'bg-gradient-to-r from-primary to-orange-600 text-white shadow-[0_15px_40px_rgba(255,77,28,0.4)] hover:scale-[1.02] active:scale-95'
                  }`}
                >
                  {placingOrder ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>ENVIANDO...</span>
                    </div>
                  ) : (
                    <>
                      <span>CONFIRMAR PEDIDO</span>
                      <ArrowRight size={20} sm:size={24} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
