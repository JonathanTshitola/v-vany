import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles:user_id (full_name, address, phone)
      `)
      .order('created_at', { ascending: false });

    if (!error) {
      setOrders(data);
    }
    setLoading(false);
  }

  const updateStatus = async (id, currentStatus) => {
    let nextStatus = 'En attente';
    if (currentStatus === 'En attente') nextStatus = 'Payé / Expédié';
    else if (currentStatus === 'Payé / Expédié') nextStatus = 'Livré';

    const { error } = await supabase
      .from('orders')
      .update({ status: nextStatus })
      .eq('id', id);
    
    if (!error) fetchOrders();
  };

  const deleteOrder = async (id) => {
    if (confirm("Supprimer cette commande de l'historique ?")) {
      await supabase.from('orders').delete().eq('id', id);
      fetchOrders();
    }
  };

  if (loading) return <div className="py-20 text-center text-zinc-500 text-xs uppercase tracking-[0.2em]">Chargement des commandes...</div>;

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-xl font-serif text-white uppercase tracking-[0.3em]">Suivi des Commandes</h2>
        <button onClick={fetchOrders} className="text-[9px] text-vanyGold border border-vanyGold/30 px-4 py-1 rounded-full hover:bg-vanyGold hover:text-black transition-all">ACTUALISER</button>
      </div>
      
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="py-20 text-center border border-zinc-900 rounded-3xl">
             <p className="text-zinc-600 text-xs uppercase tracking-widest">Aucune commande enregistrée.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-600 transition-all">
              <div className="flex flex-wrap justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[9px] text-zinc-500 font-mono">#{order.id.slice(0, 8)}</span>
                    <span className={`text-[8px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest ${
                      order.status === 'En attente' ? 'bg-orange-500/10 text-orange-500' : 'bg-green-500/10 text-green-500'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-white font-bold text-sm uppercase tracking-wider">
                    {order.profiles?.full_name || order.customer_email || 'Client V-VANY'}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    {order.profiles?.phone || 'Pas de numéro'} — {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-serif text-vanyGold italic">{order.total_price}$</p>
                  <button onClick={() => deleteOrder(order.id)} className="text-[8px] text-zinc-700 hover:text-red-500 uppercase mt-2 font-bold">Supprimer l'archive</button>
                </div>
              </div>

              <div className="bg-black/30 rounded-2xl p-4 mb-6">
                <p className="text-[8px] text-zinc-600 uppercase font-black mb-3 tracking-widest">Détail du panier</p>
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-800/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-800 rounded-lg overflow-hidden">
                        {item.image_url && <img src={item.image_url} className="w-full h-full object-cover" />}
                      </div>
                      <span className="text-[10px] text-zinc-300 uppercase">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-white">{item.price}$</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => updateStatus(order.id, order.status)}
                className="w-full bg-zinc-800 hover:bg-white hover:text-black text-white text-[9px] font-black py-3 rounded-xl transition-all uppercase tracking-[0.2em]"
              >
                {order.status === 'En attente' ? 'Valider le paiement / Expédition' : 'Marquer comme Livré'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}