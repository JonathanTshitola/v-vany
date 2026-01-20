import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Profile({ session }) {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
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

  async function getProfile() {
    try {
      const { data } = await supabase
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
    else {
      setIsEditing(false);
      alert("Votre profil V-VANY a été mis à jour.");
    }
  }

  async function deleteOrder(orderId, status) {
    const statusAllowed = ['Livré', 'Annulé', 'Annulé par le client'];
    if (!statusAllowed.includes(status)) {
      alert("Impossible : Cette commande est en cours de traitement.");
      return;
    }

    if (confirm("Retirer cette commande de votre historique ?")) {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (!error) {
        setOrders(orders.filter(o => o.id !== orderId));
      }
    }
  }

  if (loading) return <div className="py-40 text-center text-vanyGold font-serif uppercase tracking-[0.3em] animate-pulse">Signature V-VANY...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fadeIn space-y-16">
      
      {/* --- CARTE D'IDENTITÉ LUXE --- */}
      <section className="bg-zinc-900 border border-zinc-800 p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20">
           <span className="text-[40px] font-serif italic text-vanyGold">V</span>
        </div>

        <h2 className="text-white font-serif text-3xl uppercase tracking-widest mb-10 italic">Mon Compte</h2>
        
        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
            <div className="space-y-1">
              <p className="text-zinc-500 text-[9px] uppercase font-black tracking-widest">Membre</p>
              <p className="text-white text-lg font-bold uppercase tracking-tighter">{fullName || 'Invité V-VANY'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-zinc-500 text-[9px] uppercase font-black tracking-widest">Ligne Directe</p>
              <p className="text-vanyGold text-lg font-bold italic">{phone || 'Non renseigné'}</p>
            </div>
            <div className="md:col-span-2 space-y-1">
              <p className="text-zinc-500 text-[9px] uppercase font-black tracking-widest">Résidence de livraison</p>
              <p className="text-zinc-300 text-sm font-medium leading-relaxed uppercase">{address || 'Aucune adresse enregistrée'}</p>
            </div>
            <button onClick={() => setIsEditing(true)} className="w-fit text-vanyGold border-b border-vanyGold/30 pb-1 text-[10px] font-black uppercase tracking-widest hover:border-vanyGold transition-all mt-4">
              Modifier le profil
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="NOM COMPLET" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-black border border-zinc-800 p-5 rounded-2xl text-white text-xs outline-none focus:border-vanyGold transition-all" />
              <input type="text" placeholder="TÉLÉPHONE (WHATSAPP)" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-black border border-zinc-800 p-5 rounded-2xl text-white text-xs outline-none focus:border-vanyGold" />
              <textarea placeholder="ADRESSE COMPLÈTE" value={address} onChange={(e) => setAddress(e.target.value)} className="bg-black border border-zinc-800 p-5 rounded-2xl text-white text-xs outline-none focus:border-vanyGold md:col-span-2 h-32" />
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={updateProfile} className="bg-white text-black font-black text-[10px] uppercase tracking-widest px-10 py-4 rounded-full hover:bg-vanyGold hover:text-white transition-all">Enregistrer</button>
              <button onClick={() => setIsEditing(false)} className="text-zinc-500 text-[10px] uppercase font-black tracking-widest px-4 hover:text-white transition-all">Annuler</button>
            </div>
          </div>
        )}
      </section>

      {/* --- HISTORIQUE DES COMMANDES --- */}
      <section>
        <div className="flex justify-between items-end mb-10 border-b border-zinc-900 pb-6">
          <h2 className="text-white font-serif text-2xl uppercase tracking-[0.2em] italic">Mes Acquisitions</h2>
          <span className="text-vanyGold text-[10px] font-black uppercase tracking-widest">{orders.length} Articles</span>
        </div>

        {orders.length === 0 ? (
          <div className="py-32 text-center bg-zinc-900/10 rounded-[3rem] border border-dashed border-zinc-800/50">
            <p className="text-zinc-700 text-xs uppercase tracking-[0.3em] italic font-medium">Votre garde-robe V-VANY est encore vide.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-zinc-900/30 border border-zinc-900 p-8 rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-zinc-900/50 transition-all border-l-4 border-l-vanyGold/20">
                <div className="flex gap-8 items-start">
                  <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-black border border-zinc-800 items-center justify-center shrink-0 shadow-xl">
                    <span className="text-vanyGold text-xl font-serif italic">V</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-white text-sm font-black uppercase tracking-widest mb-1">Commande #{order.id.slice(0, 5)}</p>
                      <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-tighter">
                        {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>

                    {/* DÉTAIL DES ARTICLES DANS LA COMMANDE */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="bg-black/40 border border-zinc-800 px-3 py-2 rounded-xl">
                          <p className="text-zinc-300 text-[10px] font-bold uppercase">{item.name}</p>
                          {item.selectedOptions && (
                            <p className="text-vanyGold text-[8px] font-black uppercase mt-0.5">
                              {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:flex-col md:items-end gap-4 border-t border-zinc-800 pt-6 md:border-t-0 md:pt-0">
                  <p className="text-white font-serif text-2xl italic">{order.total_price} $</p>
                  
                  <div className="flex items-center gap-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-sm ${
                      order.status === 'Livré' ? 'border-green-800/50 text-green-500 bg-green-500/5' :
                      order.status.includes('Annulé') ? 'border-red-800/50 text-red-500 bg-red-500/5' :
                      'border-vanyGold/30 text-vanyGold bg-vanyGold/5'
                    }`}>
                      {order.status}
                    </span>

                    {(order.status === 'Livré' || order.status.includes('Annulé')) && (
                      <button 
                        onClick={() => deleteOrder(order.id, order.status)}
                        className="w-8 h-8 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}