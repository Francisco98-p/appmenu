import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

const PaymentFailure = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-8">
        <XCircle size={48} />
      </div>
      <h2 className="text-4xl font-black text-white mb-4 italic uppercase tracking-tighter">Pago Fallido</h2>
      <p className="text-gray-400 max-w-sm mb-10 font-medium leading-relaxed">
        Hubo un problema al procesar tu pago. Por favor intentá de nuevo.
      </p>
      <button 
        onClick={() => navigate('/')}
        className="bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-primary/20"
      >
        Volver al Menú
      </button>
    </div>
  );
};

export default PaymentFailure;
