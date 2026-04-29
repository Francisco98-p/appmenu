import { useState } from 'react';
import { X, Plus, Trash2, Utensils } from 'lucide-react';
import type { Kitchen } from '../../types';

interface KitchenModalProps {
  kitchens: Kitchen[];
  onAdd: (nombre: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onClose: () => void;
  showToast: (msg: string, tone?: 'success' | 'error') => void;
}

export const KitchenModal = ({ kitchens, onAdd, onDelete, onClose, showToast }: KitchenModalProps) => {
  const [nombre, setNombre] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    try {
      await onAdd(nombre);
      setNombre('');
      showToast(`Cocina "${nombre}" creada`, 'success');
    } catch {
      showToast('Error al agregar cocina');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await onDelete(id);
      showToast('Cocina eliminada', 'success');
    } catch {
      showToast('Error al eliminar cocina. Verificá si tiene productos asociados.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
      <div className="bg-gray-900 w-full max-w-lg rounded-[3.5rem] shadow-3xl border border-white/10 flex flex-col overflow-hidden">
        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-black/20">
          <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">Gestión de Cocinas</h2>
          <button onClick={onClose} className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all">
            <X size={24} />
          </button>
        </div>
        <div className="p-10 space-y-8">
          <form onSubmit={handleAdd} className="flex gap-4">
            <input
              required
              type="text"
              placeholder="Nombre de la cocina..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold"
            />
            <button type="submit" className="bg-primary hover:bg-primary-dark text-white p-4 rounded-2xl transition-all">
              <Plus size={24} />
            </button>
          </form>
          <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
            {kitchens.map((kitchen) => (
              <div key={kitchen.id} className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/5 group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4">
                  <Utensils className="text-primary" size={20} />
                  <span className="font-bold text-white uppercase tracking-tight">{kitchen.nombre}</span>
                </div>
                <button onClick={() => handleDelete(kitchen.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {kitchens.length === 0 && (
              <p className="text-center text-gray-600 italic py-8">No hay cocinas registradas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
