import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // --- LOGIQUE DES STATISTIQUES ---
  const stats = {
    totalRevenue: orders
      .filter(o => o.status === 'Livré' || o.status === 'Expédié' || o.status === 'Payé / Préparation')
      .reduce((acc, curr) => acc + (curr.total_price || 0), 0),
    countSuccess: orders.filter(o => o.status === 'Livré').length,
    countPending: orders.filter(o => o.status === 'En attente').length,
    countTotal: orders.length
  };

  async function updateStatus(id, newStatus) {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if (!error) fetchOrders();
  }

  async function deleteOrder(id) {
    if (confirm("🚨 Supprimer définitivement cette commande de la base de données ?")) {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (!error) fetchOrders();
    }
  }

  if (loading) return <div className="text-center py-20 text-zinc-500 text-[10px] uppercase tracking-widest">Analyse des données...</div>;

  return (
    <div className="space-y-12 animate-fadeIn pb-20">
      
      {/* --- TABLEAU DE BORD DES REVENUS (STATISTIQUES) --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] text-center">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-2">Chiffre d'Affaires</p>
          <p className="text-vanyGold text-3xl font-serif italic">{stats.totalRevenue} $</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] text-center">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-2">Ventes Livrées</p>
          <p className="text-white text-3xl font-serif italic">{stats.countSuccess}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] text-center">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-2">En Attente</p>
          <p className="text-white text-3xl font-serif italic text-orange-500">{stats.countPending}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] text-center">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-2">Total Dossiers</p>
          <p className="text-white text-3xl font-serif italic">{stats.countTotal}</p>
        </div>
      </div>

      <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
        <h3 className="text-white font-serif text-xl uppercase tracking-widest italic text-vanyGold">Flux de commandes</h3>
      </div>

      {/* --- LISTE DES COMMANDES --- */}
      <div className="grid gap-6">
        {orders.map((order) => (
          <div key={order.id} className={`bg-zinc-900 border rounded-[2.5rem] overflow-hidden transition-all ${order.status === 'Livré' ? 'border-zinc-800 opacity-60' : 'border-zinc-700 shadow-xl shadow-black/40'}`}>
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-black/20">
              <div>
                <p className="text-vanyGold text-[10px] font-black uppercase tracking-[0.2em]">Commande #{order.id.slice(0, 8)}</p>
                <p className="text-zinc-500 text-[9px] uppercase">{new Date(order.created_at).toLocaleDateString('fr-FR')} à {new Date(order.created_at).toLocaleTimeString()}</p>
              </div>
              <div className="flex items-center gap-4">
                <select 
                  value={order.status} 
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  className="bg-black border border-zinc-700 text-white text-[9px] font-black uppercase p-2 rounded-lg outline-none focus:border-vanyGold cursor-pointer"
                >
                  <option value="En attente">En attente</option>
                  <option value="Payé / Préparation">Payé / Préparation</option>
                  <option value="Expédié">Expédié</option>
                  <option value="Livré">Livré</option>
                  <option value="Annulé">Annulé</option>
                </select>
                <button onClick={() => deleteOrder(order.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-950/20 text-red-900 hover:bg-red-500 hover:text-white transition-all">✕</button>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <h4 className="text-[9px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-800 pb-2">Destinataire</h4>
                <div className="space-y-1">
                  <p className="text-white text-sm font-bold uppercase">{order.customer_name}</p>
                  <p className="text-vanyGold text-xs font-bold tracking-widest">{order.customer_phone}</p>
                  <p className="text-zinc-300 text-[11px] leading-relaxed bg-black/40 p-3 rounded-xl border border-zinc-800 mt-2 italic">📍 {order.customer_address}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[9px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-800 pb-2">Contenu</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-[10px] uppercase font-bold">
                      <span className="text-zinc-400">{item.name}</span>
                      <span className="text-white">{item.price} $</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                  <span className="text-white font-black text-xs uppercase">Encaissement</span>
                  <span className="text-2xl font-serif italic text-white">{order.total_price} $</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}