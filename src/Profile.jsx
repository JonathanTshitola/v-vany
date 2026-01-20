import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Profile({ session }) {
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (session) {
      getProfile();
      getUserOrders();
    }
  }, [session]);

  // Récupérer les infos du profil
  async function getProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, address, phone')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setFullName(data.full_name || '');
        setAddress(data.address || '');
        setPhone(data.phone || '');
      }
    } finally {
      setLoading(false);
    }
  }

  // Récupérer les commandes du client
  async function getUserOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    setOrders(data || []);
  }

  async function updateProfile() {
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      full_name: fullName,
      address: address,
      phone: phone,
      updated_at: new Date(),
    });
    if (error) alert(error.message);
    else alert("Profil mis à jour !");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fadeIn space-y-16">
      
      {/* SECTION FORMULAIRE PROFIL */}
      <section className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem]">
        <h2 className="text-white font-serif text-2xl uppercase tracking-widest mb-8 italic">Mon Compte</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input type="text" placeholder="NOM COMPLET" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-vanyGold" />
          <input type="text" placeholder="TÉLÉPHONE WHATSAPP" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-vanyGold" />
          <input type="text" placeholder="ADRESSE DE LIVRAISON" value={address} onChange={(e) => setAddress(e.target.value)} className="bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-vanyGold md:col-span-2" />
        </div>
        <button onClick={updateProfile} className="mt-8 bg-vanyGold text-black font-black text-[10px] uppercase tracking-[0.2em] px-10 py-4 rounded-full hover:bg-white transition-all">
          Sauvegarder mes infos
        </button>
      </section>

      {/* SECTION SUIVI DE COMMANDES */}
      <section>
        <h2 className="text-white font-serif text-xl uppercase tracking-widest mb-8 flex items-center gap-4">
          Suivi de mes pièces <span className="h-[1px] bg-zinc-800 flex-grow"></span>
        </h2>

        {orders.length === 0 ? (
          <p className="text-zinc-600 text-xs uppercase tracking-widest italic">Vous n'avez pas encore passé de commande.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-wrap justify-between items-center gap-4 hover:border-zinc-600 transition-all">
                <div>
                  <p className="text-vanyGold text-[10px] font-black uppercase tracking-widest mb-1">Commande #{order.id.slice(0, 5)}</p>
                  <p className="text-white text-[10px] font-bold">{order.items?.length} article(s) — {order.total_price} $</p>
                </div>
                
                {/* PASTILLE DE STATUT DYNAMIQUE */}
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    order.status === 'En attente' ? 'border-vanyGold/30 text-vanyGold bg-vanyGold/5' :
                    order.status === 'Expédié' ? 'border-blue-500/30 text-blue-400 bg-blue-500/5' :
                    order.status === 'Livré' ? 'border-green-500/30 text-green-400 bg-green-500/5' :
                    'border-zinc-700 text-zinc-500 bg-zinc-800'
                  }`}>
                    ● {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}