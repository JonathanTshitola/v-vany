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

  async function updateStatus(id, newStatus) {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id);
    if (!error) fetchOrders();
  }

  // --- NOUVELLE FONCTION DE SUPPRESSION ADMIN ---
  async function deleteOrder(id) {
    if (confirm("🚨 SUPPRESSION DÉFINITIVE ? Cette commande sera effacée de la base de données.")) {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);
      
      if (!error) {
        setOrders(orders.filter(o => o.id !== id));
      } else {
        alert("Erreur lors de la suppression : " + error.message);
      }
    }
  }

  if (loading) return <div className="text-center py-20 text-zinc-500 text-[10px] uppercase tracking-widest">Chargement des commandes...</div>;

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-white font-serif text-xl uppercase tracking-widest italic">Journal des ventes</h3>
        <span className="bg-vanyGold/10 text-vanyGold text-[9px] px-4 py-1 rounded-full font-black uppercase tracking-widest border border-vanyGold/20">
          {orders.length} Commandes au total
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/20 rounded-[2rem] border border-dashed border-zinc-800">
          <p className="text-zinc-600 text-xs uppercase tracking-widest">Aucune commande dans les archives.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <div key={order.id} className={`bg-zinc-900 border rounded-[2rem] overflow-hidden transition-all ${order.status === 'Livré' ? 'border-zinc-800 opacity-80' : 'border-zinc-700'}`}>
              
              {/* Entête avec Bouton Supprimer */}
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-black/20">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-vanyGold text-[10px] font-black uppercase tracking-[0.2em]">Commande #{order.id.slice(0, 8)}</p>
                    <p className="text-zinc-500 text-[9px] uppercase">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                   <select 
                    value={order.status} 
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="bg-black border border-zinc-700 text-white text-[9px] font-black uppercase p-2 rounded-lg outline-none focus:border-vanyGold"
                  >
                    <option value="En attente">En attente</option>
                    <option value="Expédié">Expédié</option>
                    <option value="Livré">Livré</option>
                    <option value="Annulé">Annulé</option>
                  </select>

                  {/* BOUTON SUPPRIMER (POUR L'ADMIN) */}
                  <button 
                    onClick={() => deleteOrder(order.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-red-950/30 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-900/50"
                    title="Supprimer définitivement"
                  >
                    <span className="text-xs font-bold">✕</span>
                  </button>
                </div>
              </div>

              {/* Détails (Infos Client & Articles) */}
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <h4 className="text-[9px] text-zinc-500 font-black uppercase border-b border-zinc-800 pb-2">Client</h4>
                  <div className="text-white text-xs space-y-1 uppercase font-bold">
                    <p>{order.customer_name}</p>
                    <p className="text-vanyGold tracking-widest">{order.customer_phone}</p>
                    <p className="text-zinc-400 normal-case font-normal italic">{order.customer_email}</p>
                    <p className="bg-black/30 p-3 rounded-xl border border-zinc-800 mt-2 normal-case font-medium">📍 {order.customer_address}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[9px] text-zinc-500 font-black uppercase border-b border-zinc-800 pb-2">Panier</h4>
                  <div className="space-y-2">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex justify-between text-[10px] uppercase">
                        <span className="text-zinc-300">{item.name}</span>
                        <span className="text-white font-bold">{item.price} $</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                    <span className="text-white font-black text-xs uppercase">Total</span>
                    <span className="text-2xl font-serif italic text-vanyGold">{order.total_price} $</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}