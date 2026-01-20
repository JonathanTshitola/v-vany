import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();

    // Système Temps Réel : l'Admin est prévenu dès qu'une commande tombe
    const subscription = supabase
      .channel('admin_orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
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

  if (loading) return <div className="text-center py-20 text-zinc-500 text-[10px] uppercase tracking-widest">Chargement des commandes...</div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-white font-serif text-xl uppercase tracking-widest italic">Journal des ventes</h3>
        <span className="bg-vanyGold/10 text-vanyGold text-[9px] px-4 py-1 rounded-full font-black uppercase tracking-widest border border-vanyGold/20">
          {orders.length} Commandes
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/20 rounded-[2rem] border border-dashed border-zinc-800">
          <p className="text-zinc-600 text-xs uppercase tracking-widest">Aucune vente enregistrée pour le moment.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden">
              {/* Entête de Commande */}
              <div className="p-6 border-b border-zinc-800 flex flex-wrap justify-between items-center gap-4 bg-black/20">
                <div>
                  <p className="text-vanyGold text-[10px] font-black uppercase tracking-[0.2em] mb-1">Commande #{order.id.slice(0, 8)}</p>
                  <p className="text-zinc-500 text-[9px] uppercase">{new Date(order.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <div className="flex items-center gap-3">
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
                </div>
              </div>

              {/* Détails Client & Articles */}
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Infos Client */}
                <div className="space-y-4">
                  <h4 className="text-[9px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-800 pb-2">Destinataire</h4>
                  <div className="space-y-2">
                    <p className="text-white text-sm font-bold uppercase">{order.customer_name || 'Client Anonyme'}</p>
                    <p className="text-zinc-400 text-xs italic">{order.customer_email}</p>
                    <p className="text-vanyGold text-xs font-bold tracking-widest">{order.customer_phone}</p>
                    <p className="text-zinc-300 text-[11px] leading-relaxed bg-black/30 p-3 rounded-xl border border-zinc-800">
                      📍 {order.customer_address || 'Aucune adresse renseignée'}
                    </p>
                  </div>
                </div>

                {/* Panier */}
                <div className="space-y-4">
                  <h4 className="text-[9px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-800 pb-2">Articles ({order.items?.length})</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex justify-between items-center bg-black/20 p-2 rounded-lg">
                        <span className="text-white text-[10px] font-medium uppercase">{item.name}</span>
                        <span className="text-vanyGold text-[10px] font-bold">{item.price} $</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 flex justify-between items-center border-t border-zinc-800">
                    <span className="text-white font-black text-xs uppercase tracking-widest">Total encaissé</span>
                    <span className="text-2xl font-serif font-black italic text-white">{order.total_price} $</span>
                  </div>
                </div>
              </div>

              {/* Action Rapide WhatsApp */}
              <div className="bg-zinc-800/30 p-4 text-center">
                <a 
                  href={`https://wa.me/${order.customer_phone?.replace(/\s/g, '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[9px] font-black text-zinc-400 hover:text-vanyGold uppercase tracking-[0.2em] transition-all"
                >
                  Contacter le client sur WhatsApp →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}