import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Utensils, Star } from 'lucide-react';
import { useCartStore } from '../context/cartStore';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const clearCart = useCartStore((state) => state.clearCart);
  
  // El orderId viene en external_reference según la config de MP de tu amigo
  const orderId = searchParams.get('external_reference');

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-[#080B10] dot-grid flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 animate-fade-up">
        <div className="w-28 h-28 bg-green-500/10 text-green-500 rounded-[2.5rem] flex items-center justify-center mb-10 mx-auto border border-green-500/20 shadow-2xl shadow-green-500/10 animate-bounce-subtle">
          <CheckCircle size={56} strokeWidth={1.5} />
        </div>
        
        <h1 className="text-5xl font-black text-white mb-4 italic uppercase tracking-tighter leading-none">
          ¡Pago <span className="text-green-400">Exitoso!</span>
        </h1>
        
        <p className="text-gray-400 max-w-sm mb-12 font-medium leading-relaxed mx-auto text-lg">
          Tu transacción se completó correctamente. Ya estamos preparando tu pedido.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => orderId ? navigate(`/status/${orderId}`) : navigate('/')}
            className="shimmer-btn relative overflow-hidden bg-primary text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 shadow-2xl shadow-primary/30 flex items-center justify-center gap-3"
          >
            VER ESTADO DEL PEDIDO <ArrowRight size={18} />
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="glass hover:bg-white/10 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 border border-white/10 flex items-center justify-center gap-3"
          >
            VOLVER AL MENÚ
          </button>
        </div>

        {/* Decorative elements */}
        <div className="mt-16 flex items-center justify-center gap-4 text-gray-600">
           <Star size={16} />
           <Utensils size={20} />
           <Star size={16} />
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
