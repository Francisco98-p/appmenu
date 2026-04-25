import { X } from 'lucide-react';
import type { Category, Kitchen } from '../../types';

interface NewProductForm {
  nombre: string;
  descripcion: string;
  precio: string;
  categoryId: string;
  kitchenId: string;
  imagen: string;
  stock: string;
}

interface NewProductModalProps {
  form: NewProductForm;
  categories: Category[];
  kitchens: Kitchen[];
  onChange: (form: NewProductForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const NewProductModal = ({ form, categories, kitchens, onChange, onSubmit, onClose }: NewProductModalProps) => (
  <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
    <div className="bg-gray-900 w-full max-w-2xl rounded-[3.5rem] shadow-3xl border border-white/10 flex flex-col overflow-hidden">
      <div className="p-10 border-b border-white/5 flex justify-between items-center bg-black/20">
        <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">Nuevo Producto</h2>
        <button onClick={onClose} className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all">
          <X size={24} />
        </button>
      </div>
      <form onSubmit={onSubmit} className="p-10 space-y-8 overflow-y-auto max-h-[70vh] no-scrollbar">
        <div className="grid grid-cols-2 gap-8">
          <div className="col-span-2">
            <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-3">Nombre del Producto</label>
            <input required type="text" placeholder="Ej: Hamburguesa Especial" value={form.nombre} onChange={(e) => onChange({ ...form, nombre: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-primary/50 transition-all font-bold text-lg" />
          </div>
          <div>
            <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-3">Categoría</label>
            <select required value={form.categoryId} onChange={(e) => onChange({ ...form, categoryId: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none">
              <option value="">Seleccionar...</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-3">Cocina</label>
            <select required value={form.kitchenId} onChange={(e) => onChange({ ...form, kitchenId: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none">
              <option value="">General / Ninguna</option>
              {kitchens.map((k) => <option key={k.id} value={k.id}>{k.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-3">Precio ($)</label>
            <input required type="number" placeholder="0.00" value={form.precio} onChange={(e) => onChange({ ...form, precio: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-primary/50 transition-all font-bold" />
          </div>
          <div>
            <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-3">Stock Inicial</label>
            <input required type="number" value={form.stock} onChange={(e) => onChange({ ...form, stock: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-primary/50 transition-all font-bold" />
          </div>
          <div className="col-span-2">
            <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-3">URL de Imagen (Opcional)</label>
            <input type="text" placeholder="https://images.unsplash.com/..." value={form.imagen} onChange={(e) => onChange({ ...form, imagen: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-primary/50 transition-all font-bold text-sm" />
          </div>
          <div className="col-span-2">
            <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-3">Descripción (Opcional)</label>
            <textarea placeholder="Breve descripción del producto..." value={form.descripcion} onChange={(e) => onChange({ ...form, descripcion: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-primary/50 transition-all font-bold h-32 resize-none" />
          </div>
        </div>
        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 py-6 rounded-3xl font-black uppercase tracking-widest text-xs transition-all border border-white/5">
            Cancelar
          </button>
          <button type="submit" className="flex-[2] bg-primary hover:bg-primary-dark text-white py-6 rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 transition-all active:scale-95">
            Guardar Producto
          </button>
        </div>
      </form>
    </div>
  </div>
);
