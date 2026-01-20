import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all'); // 'today', 'month', 'all'

  useEffect(() => {
    fetchOrders();
    const subscription = supabase
      .channel('admin_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }

  // --- LOGIQUE DE FILTRAGE PAR PÉRIODE ---
  const filteredByTime = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    const now = new Date();
    if (timeFilter === 'today') {
      return orderDate.toDateString() === now.toDateString();
    } else if (timeFilter === 'month') {
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // --- STATISTIQUES BASÉES SUR LE FILTRE ---
  const stats = {
    revenue: filteredByTime
      .filter(o => ['Livré', 'Expédié', 'Payé / Préparation'].includes(o.status))
      .reduce((acc, curr) => acc + (curr.total_price || 0), 0),
    success: filteredByTime.filter(o => o.status === 'Livré').length,
    pending: filteredByTime.filter(o => o.status === 'En attente').length,
    total: filteredByTime.length
  };

  async function updateStatus(id, newStatus) {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if (!error) fetchOrders();
  }

  async function deleteOrder(id) {
    if (confirm("🚨 Supprimer définitivement cette commande ?")) {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (!error) fetchOrders();
    }
  }

  if (loading) return <div className="text-center py-20 text-zinc-500 text-[10px] uppercase tracking-widest animate-pulse">Calcul des performances...</div>;

  return (
    <div className="space-y-10 animate-fadeIn pb-20">
      
      {/* SÉLECTEUR DE PÉRIODE */}
      <div className="flex justify-center gap-2 bg-zinc-900/50 p-1 rounded-full border border-zinc-800 w-fit mx-auto">
        {['today', 'month', 'all'].map((t) => (
          <button
            key={t}
            onClick={() => setTimeFilter(t)}
            className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
              timeFilter === t ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
            }`}
          >
            {t === 'today' ? "Aujourd'hui" : t === 'month' ? "Ce mois" : "Global"}
          </button>
        ))}
      </div>

      {/* --- DASHBOARD STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] shadow-xl">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-2">Chiffre d'Affaires</p>
          <p className="text-vanyGold text-3xl font-serif italic">{stats.revenue} $</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem]">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-2">Livraisons Terminées</p>
          <p className="text-white text-3xl font-serif italic">{stats.success}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem]">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-2">Commandes en attente</p>
          <p className="text-orange-500 text-3xl font-serif italic">{stats.pending}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem]">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-2">Total Dossiers</p>
          <p className="text-white text-3xl font-serif italic">{stats.total}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <h3 className="text-white font-serif text-xl uppercase tracking-widest italic whitespace-nowrap">Gestion des flux</h3>
        <div className="h-[1px] bg-zinc-800 w-full"></div>
      </div>

      {/* --- LISTE DES COMMANDES --- */}
      <div className="grid gap-6">
        {filteredByTime.map((order) => (
          <div key={order.id} className={`bg-zinc-900 border rounded-[2.5rem] overflow-hidden transition-all ${order.status === 'Livré' ? 'border-zinc-800 opacity-60' : 'border-zinc-700 shadow-2xl'}`}>
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-black/20">
              <div>
                <p className="text-vanyGold text-[10px] font-black uppercase tracking-[0.2em]">REF: {order.id.slice(0, 8)}</p>
                <p className="text-zinc-500 text-[9px] uppercase font-bold">{new Date(order.created_at).toLocaleDateString()} — {new Date(order.created_at).toLocaleTimeString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <select 
                  value={order.status} 
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  className="bg-black border border-zinc-700 text-white text-[9px] font-black uppercase p-2 rounded-xl outline-none focus:border-vanyGold"
                >
                  <option value="En attente">En attente</option>
                  <option value="Payé / Préparation">Payé / Préparation</option>
                  <option value="Expédié">Expédié</option>
                  <option value="Livré">Livré</option>
                  <option value="Annulé">Annulé</option>
                </select>
                <button onClick={() => deleteOrder(order.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-950/20 text-red-700 hover:bg-red-500 hover:text-white transition-all">✕</button>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="bg-black/20 p-5 rounded-3xl border border-zinc-800/50">
                <h4 className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-4">Fiche Client</h4>
                <p className="text-white text-sm font-bold uppercase mb-1">{order.customer_name}</p>
                <p className="text-vanyGold text-xs font-black mb-3">{order.customer_phone}</p>
                <p className="text-zinc-400 text-[11px] leading-relaxed italic border-l-2 border-vanyGold/30 pl-3">📍 {order.customer_address}</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-4">Détail Panier</h4>
                <div className="space-y-2">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
                      <div>
                        <p className="text-white text-[10px] font-bold uppercase">{item.name}</p>
                        {item.selectedOptions && (
                          <p className="text-vanyGold text-[8px] font-black">
                            {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                          </p>
                        )}
                      </div>
                      <span className="text-white font-serif italic text-xs">{item.price} $</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 flex justify-between items-center">
                  <span className="text-zinc-500 font-black text-[10px] uppercase">Net à payer</span>
                  <span className="text-2xl font-serif italic text-vanyGold">{order.total_price} $</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}