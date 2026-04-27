import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Utensils, Settings, LogOut, Package, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../context/authStore';
import { useNavigate } from 'react-router-dom';
import type { Category, Kitchen, LocalSettings } from '../types';

import { useAdminOrders } from '../hooks/useAdminOrders';
import { useTableManager } from '../hooks/useTableManager';
import { TableGrid, type TableGroup } from '../components/admin/TableGrid';
import { TableDetailModal } from '../components/admin/TableDetailModal';
import { StockTable } from '../components/admin/StockTable';
import { NewProductModal } from '../components/admin/NewProductModal';
import { KitchenModal } from '../components/admin/KitchenModal';
import type { Product } from '../types';

const EMPTY_PRODUCT = {
  nombre: '', descripcion: '', precio: '', categoryId: '', kitchenId: '', imagen: '', stock: '0',
};

const AdminDashboard = () => {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'salon' | 'config' | 'stock'>('salon');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKitchen, setSelectedKitchen] = useState<string>('all');
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showKitchenModal, setShowKitchenModal] = useState(false);
  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT);
  const [localSettings, setLocalSettings] = useState<LocalSettings>({ nombre: '', slug: '', logo: '', cbuAlias: '', mercadoPagoLink: '' });
  const [newTableNum, setNewTableNum] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [toastTone, setToastTone] = useState<'success' | 'error'>('error');

  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const { orders, loading, updateStatus, togglePayment, closeTable } = useAdminOrders();
  const { allTables, fetchTables, addTable, deleteTable } = useTableManager();

  const showToast = useCallback((msg: string, tone: 'success' | 'error' = 'error') => {
    setToastMsg(msg);
    setToastTone(tone);
    setTimeout(() => setToastMsg(''), 3500);
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get<Product[]>('/admin/products');
      setProducts(res.data);
    } catch { /* retain */ }
  }, []);

  const fetchKitchens = useCallback(async () => {
    try {
      const res = await api.get<Kitchen[]>('/admin/kitchens');
      setKitchens(res.data);
    } catch { /* retain */ }
  }, []);

  const updateStock = useCallback(async (productId: number, newStock: number) => {
    await api.put(`/admin/products/${productId}/stock`, { stock: Math.max(0, newStock) });
    await fetchProducts();
  }, [fetchProducts]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/products', newProduct);
      setShowNewProductModal(false);
      setNewProduct(EMPTY_PRODUCT);
      await fetchProducts();
      showToast('Producto creado correctamente', 'success');
    } catch {
      showToast('Error al crear producto');
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum) return;
    try {
      await addTable(newTableNum);
      showToast(`Mesa ${newTableNum} agregada`, 'success');
      setNewTableNum('');
    } catch {
      showToast('Error al agregar mesa');
    }
  };

  const handleDeleteTable = async (id: number) => {
    try {
      await deleteTable(id);
      showToast('Mesa eliminada', 'success');
    } catch {
      showToast('Error al eliminar mesa');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/admin/local', localSettings);
      showToast('Configuración guardada correctamente', 'success');
    } catch {
      showToast('Error al guardar configuración');
    }
  };

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  useEffect(() => {
    fetchTables();
    api.get<LocalSettings>('/admin/local').then((r) => { if (r.data) setLocalSettings(r.data); }).catch(() => {});
    api.get<Category[]>('/admin/categories').then((r) => setCategories(r.data)).catch(() => {});
    fetchKitchens();
  }, [fetchTables, fetchKitchens]);

  useEffect(() => {
    if (activeTab === 'stock') { fetchProducts(); fetchKitchens(); }
  }, [activeTab, fetchProducts, fetchKitchens]);

  // Build table groups
  const tableGroups = allTables.reduce<Record<string, TableGroup>>((acc, tableRecord) => {
    const mesa = tableRecord.numero;
    const tableOrders = orders.filter((o) => o.mesa === mesa);
    const statuses = tableOrders.map((o) => o.estado);
    let status = tableOrders.length > 0 ? 'Recibido' : 'Libre';
    if (statuses.includes('En preparación')) status = 'En preparación';
    else if (statuses.includes('Listo')) status = 'Listo';
    else if (tableOrders.length > 0 && statuses.every((s) => s === 'Entregado')) status = 'Entregado';

    acc[mesa] = {
      mesa,
      orders: tableOrders,
      total: tableOrders.reduce((s, o) => s + o.total, 0),
      status,
      pagoConfirmado: tableOrders.length > 0 && tableOrders.every((o) => o.pagoConfirmado),
      metodosPago: Array.from(new Set(tableOrders.map((o) => o.metodoPago))),
    };
    return acc;
  }, {});

  const tableList = Object.values(tableGroups).sort((a, b) =>
    a.mesa.localeCompare(b.mesa, undefined, { numeric: true })
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-gray-900 border-r border-white/5 flex flex-col fixed inset-y-0 z-30 shadow-2xl">
        <div className="p-8 pb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Utensils className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">MenuApp</h1>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mt-1">Premium Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-2">
          <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] px-4 mb-4">Gestión de Salón</div>
          {([
            ['salon', 'Mesas Activas', LayoutDashboard],
            ['stock', 'Gestión Stock', Package],
            ['config', 'Configurar Mesas', Settings],
          ] as const).map(([tab, label, Icon]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border group ${activeTab === tab ? 'bg-primary/10 text-primary border-primary/20' : 'text-gray-500 hover:text-white hover:bg-white/5 border-transparent'}`}>
              <Icon size={22} className="group-hover:scale-110 transition-transform" />
              <span className="font-bold tracking-tight">{label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-4 mb-6 px-2">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-orange-500 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg">
              {user?.email[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-black text-white truncate">{user?.local?.nombre || 'Mi Local'}</p>
              <p className="text-xs text-gray-500 truncate font-medium">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-red-500/10 hover:text-red-500 p-4 rounded-2xl transition-all text-xs font-black uppercase tracking-widest border border-white/5 hover:border-red-500/20">
            <LogOut size={18} /> Salir
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-72 p-10 lg:p-14">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-5xl font-black text-white tracking-tighter">
                {activeTab === 'salon' ? 'Mesas' : activeTab === 'stock' ? 'Stock' : 'Config'}
              </h2>
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border border-primary/20">
                {activeTab === 'salon' ? 'Activas' : activeTab === 'stock' ? 'Inventario' : 'Ajustes'}
              </div>
            </div>
            <p className="text-gray-500 font-medium">
              {activeTab === 'salon' ? 'Control de cuentas y pedidos por mesa.' :
               activeTab === 'stock' ? 'Control de disponibilidad de productos en tiempo real.' :
               'Gestión de mesas y configuración local.'}
            </p>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gray-900 border border-white/5 p-6 rounded-[2rem] shadow-xl">
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Mesas Abiertas</p>
            <h3 className="text-3xl font-black text-white">{tableList.length}</h3>
          </div>
          <div className="bg-gray-900 border border-white/5 p-6 rounded-[2rem] shadow-xl">
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Pedidos Totales</p>
            <h3 className="text-3xl font-black text-white">{orders.length}</h3>
          </div>
          <div className="bg-gray-900 border border-white/5 p-6 rounded-[2rem] shadow-xl col-span-2">
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Total por Cobrar</p>
            <h3 className="text-3xl font-black text-primary">${tableList.reduce((acc, t) => acc + t.total, 0)}</h3>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'salon' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <TableGrid tableList={tableList} onSelect={setSelectedTable} />
          </div>
        ) : activeTab === 'stock' ? (
          <StockTable
            products={products}
            kitchens={kitchens}
            searchTerm={searchTerm}
            selectedKitchen={selectedKitchen}
            onSearchChange={setSearchTerm}
            onKitchenFilterChange={setSelectedKitchen}
            onUpdateStock={updateStock}
            onNewProduct={() => setShowNewProductModal(true)}
            onManageKitchens={() => setShowKitchenModal(true)}
            showToast={showToast}
          />
        ) : (
          <div className="max-w-4xl">
            {/* Payment settings */}
            <div className="bg-gray-900 rounded-[2.5rem] p-10 border border-white/5 shadow-2xl mb-10">
              <h3 className="text-2xl font-black text-white mb-6 italic uppercase tracking-tighter">Configuración de Pagos</h3>
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div>
                  <label className="block text-gray-400 text-xs font-black uppercase tracking-widest mb-2">CBU o Alias para transferencias</label>
                  <input type="text" placeholder="Ej: 1234567890123456789012 o mi.alias"
                    value={localSettings.cbuAlias || ''} onChange={(e) => setLocalSettings({ ...localSettings, cbuAlias: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold" />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Link de Mercado Pago</label>
                  <input type="text" placeholder="Ej: https://mpago.la/xxxxxx"
                    value={localSettings.mercadoPagoLink || ''} onChange={(e) => setLocalSettings({ ...localSettings, mercadoPagoLink: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold" />
                </div>
                <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-primary/20">
                  Guardar Configuración
                </button>
              </form>
            </div>

            {/* Table management */}
            <div className="bg-gray-900 rounded-[2.5rem] p-10 border border-white/5 shadow-2xl mb-10">
              <h3 className="text-2xl font-black text-white mb-6 italic uppercase tracking-tighter">Agregar Nueva Mesa</h3>
              <form onSubmit={handleAddTable} className="flex gap-4">
                <input type="text" placeholder="Número de mesa (Ej: 1, 10, VIP-A)" value={newTableNum} onChange={(e) => setNewTableNum(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold" />
                <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-primary/20 flex items-center gap-2">
                  <Plus size={18} /> Agregar Mesa
                </button>
              </form>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {allTables.map((table) => (
                <div key={table.id} className="bg-gray-900 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center group relative overflow-hidden">
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Mesa</span>
                  <h4 className="text-4xl font-black text-white italic">{table.numero}</h4>
                  <button onClick={() => handleDeleteTable(table.id)}
                    className="mt-4 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100">
                    Eliminar
                  </button>
                </div>
              ))}
              {allTables.length === 0 && (
                <p className="col-span-full text-gray-500 text-center font-bold py-10">No hay mesas configuradas aún.</p>
              )}
            </div>
          </div>
        )}

        {/* Toast */}
        {toastMsg && (
          <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm animate-in slide-in-from-bottom-4 duration-300 ${
            toastTone === 'success' ? 'bg-green-500 text-white' : 'bg-red-500/90 text-white'
          }`}>
            {toastTone === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {toastMsg}
          </div>
        )}

        {/* Modals */}
        {selectedTable && tableGroups[selectedTable] && (
          <TableDetailModal
            selectedTable={selectedTable}
            tableData={tableGroups[selectedTable]}
            onClose={() => setSelectedTable(null)}
            onUpdateStatus={updateStatus}
            onTogglePayment={togglePayment}
            onCloseTable={closeTable}
            showToast={showToast}
          />
        )}

        {showNewProductModal && (
          <NewProductModal
            form={newProduct}
            categories={categories}
            kitchens={kitchens}
            onChange={setNewProduct}
            onSubmit={handleCreateProduct}
            onClose={() => setShowNewProductModal(false)}
          />
        )}

        {showKitchenModal && (
          <KitchenModal
            kitchens={kitchens}
            onAdd={async (nombre) => { await api.post('/admin/kitchens', { nombre }); await fetchKitchens(); }}
            onDelete={async (id) => { await api.delete(`/admin/kitchens/${id}`); await fetchKitchens(); }}
            onClose={() => setShowKitchenModal(false)}
            showToast={showToast}
          />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
