import { useNavigate } from 'react-router-dom';
import { XCircle, RotateCcw } from 'lucide-react';

const PaymentFailure = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080B10] dot-grid flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 animate-fade-up">
        <div className="w-28 h-28 bg-red-500/10 text-red-500 rounded-[2.5rem] flex items-center justify-center mb-10 mx-auto border border-red-500/20 shadow-2xl shadow-red-500/10">
          <XCircle size={56} strokeWidth={1.5} />
        </div>
        
        <h1 className="text-5xl font-black text-white mb-4 italic uppercase tracking-tighter leading-none">
          ¡Pago <span className="text-red-500">Fallido!</span>
        </h1>
        
        <p className="text-gray-400 max-w-sm mb-12 font-medium leading-relaxed mx-auto text-lg">
          Hubo un problema con la transacción. No te preocupes, podés volver a intentarlo o elegir otro medio de pago.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate(-1)}
            className="shimmer-btn relative overflow-hidden bg-primary text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 shadow-2xl shadow-primary/30 flex items-center justify-center gap-3"
          >
            REINTENTAR PAGO <RotateCcw size={18} />
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="glass hover:bg-white/10 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 border border-white/10 flex items-center justify-center gap-3"
          >
            VOLVER AL MENÚ
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
