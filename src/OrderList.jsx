import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    // On récupère les commandes et on joint les infos du profil
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles:user_id (full_name, address, phone)
      `)
      .order('created_at', { ascending: false });

    if (!error) setOrders(data);
    setLoading(false);
  }

  const updateStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'En attente' ? 'Expédié' : 'Livré';
    await supabase.from('orders').update({ status: nextStatus }).eq('id', id);
    fetchOrders();
  };

  if (loading) return <p className="text-center text-xs uppercase tracking-widest">Chargement des commandes...</p>;

  return (
    <div className="max-w-5xl mx-auto p-4 animate-fadeIn">
      <h2 className="text-2xl font-serif mb-8 text-center uppercase tracking-[0.3em]">Suivi des Commandes</h2>
      
      <div className="space-y-6">
        {orders.length === 0 ? (
          <p className="text-center text-gray-400 italic">Aucune commande pour le moment.</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-wrap justify-between items-start border-b pb-4 mb-4">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-tighter">ID Commande: {order.id.slice(0, 8)}</p>
                  <p className="font-bold text-sm">{order.profiles?.full_name || 'Client Inconnu'}</p>
                  <p className="text-xs text-gray-500">{order.profiles?.phone} | {order.profiles?.address}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest ${
                    order.status === 'En attente' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {order.status}
                  </span>
                  <p className="text-lg font-bold mt-2 text-vanyGold">{order.total_price}$</p>
                </div>
              </div>

              <div className="text-xs space-y-1 text-gray-600 mb-4">
                <p className="font-bold uppercase text-[9px] text-gray-400 mb-2">Articles :</p>
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between border-b border-gray-50 py-1">
                    <span>{item.name} (x1)</span>
                    <span>{item.price}$</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => updateStatus(order.id, order.status)}
                className="w-full border border-black text-[10px] font-bold py-2 hover:bg-black hover:text-white transition-all uppercase tracking-widest"
              >
                Passer en statut : {order.status === 'En attente' ? 'Expédié' : 'Livré'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}