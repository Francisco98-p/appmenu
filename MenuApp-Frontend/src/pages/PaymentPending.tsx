import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, Utensils } from 'lucide-react';

const PaymentPending = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080B10] dot-grid flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 animate-fade-up">
        <div className="w-28 h-28 bg-amber-500/10 text-amber-500 rounded-[2.5rem] flex items-center justify-center mb-10 mx-auto border border-amber-500/20 shadow-2xl shadow-amber-500/10 animate-pulse">
          <Clock size={56} strokeWidth={1.5} />
        </div>
        
        <h1 className="text-5xl font-black text-white mb-4 italic uppercase tracking-tighter leading-none">
          Pago <span className="text-amber-500">Pendiente</span>
        </h1>
        
        <p className="text-gray-400 max-w-sm mb-12 font-medium leading-relaxed mx-auto text-lg">
          Mercado Pago está procesando tu pago. Te avisaremos cuando se confirme para empezar a preparar tu pedido.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate('/')}
            className="shimmer-btn relative overflow-hidden bg-primary text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 shadow-2xl shadow-primary/30 flex items-center justify-center gap-3"
          >
            VOLVER AL MENÚ <ArrowRight size={18} />
          </button>
        </div>

        <div className="mt-16 flex items-center justify-center gap-2 text-gray-700 font-bold uppercase tracking-widest text-[10px]">
          <Utensils size={14} /> Sincronizando con Mercado Pago
        </div>
      </div>
    </div>
  );
};

export default PaymentPending;
