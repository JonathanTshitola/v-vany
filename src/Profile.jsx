import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Profile({ session }) {
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [orders, setOrders] = useState([]);
  
  const [fullname, setFullname] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (session) {
      getProfile();
      getUserOrders();
    }
  }, [session]);

  async function getProfile() {
    setLoading(true);
    // On ne sélectionne que les colonnes utiles pour éviter les conflits RLS
    let { data, error } = await supabase
      .from('profiles')
      .select('full_name, address, phone') 
      .eq('id', session.user.id)
      .single();
    
    if (data) {
      setFullname(data.full_name || '');
      setAddress(data.address || '');
      setPhone(data.phone || '');
    }
    setLoading(false);
  }

  async function getUserOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    setOrders(data || []);
  }

  async function updateProfile(e) {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullname,
        address: address,
        phone: phone,
        updated_at: new Date(),
      })
      .eq('id', session.user.id);

    if (error) {
      alert("Erreur de mise à jour : " + error.message);
    } else {
      setShowModal(false);
      // On rafraîchit les données localement
      getProfile();
      alert("Profil mis à jour !");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-20 animate-fadeIn text-white">
      {/* --- CARTE VIP --- */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden mb-12">
        <div className="absolute top-0 right-0 p-8 opacity-10 select-none pointer-events-none">
           <span className="font-serif text-9xl font-black italic">V</span>
        </div>

        <h2 className="text-xl font-serif font-black tracking-[0.3em] uppercase mb-10 border-b border-zinc-800/50 pb-6">
          Membre Privilège
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-6">
            <div className="flex flex-col">
              <span className="text-[9px] text-vanyGold font-black uppercase tracking-widest mb-1 opacity-60">Identité</span>
              <span className="text-lg font-bold">{fullname || 'Client V-VANY'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-vanyGold font-black uppercase tracking-widest mb-1 opacity-60">Email de contact</span>
              <span className="text-xs text-zinc-400">{session.user.email}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col">
              <span className="text-[9px] text-vanyGold font-black uppercase tracking-widest mb-1 opacity-60">Adresse de livraison</span>
              <span className="text-xs text-zinc-300 leading-relaxed">{address || 'Non renseignée'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-vanyGold font-black uppercase tracking-widest mb-1 opacity-60">WhatsApp</span>
              <span className="text-xs text-zinc-300">{phone || 'Non renseigné'}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="mt-12 w-full bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-vanyGold hover:text-white transition-all"
        >
          Modifier mes informations
        </button>
      </div>

      {/* --- HISTORIQUE --- */}
      <div className="px-2">
        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500 mb-6 flex items-center gap-4">
          Historique d'achats <span className="h-px flex-grow bg-zinc-900"></span>
        </h3>
        
        {orders.length === 0 ? (
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest italic text-center py-10">Aucune commande pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="bg-zinc-900/30 border border-zinc-800/50 p-5 rounded-2xl flex justify-between items-center group hover:border-zinc-700 transition-all">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">Commande #{order.id.slice(0,5)}</p>
                  <p className="text-[9px] text-zinc-500 uppercase">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className={`text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest mb-2 ${
                    order.status === 'Livré' ? 'bg-green-500/10 text-green-500' : 'bg-vanyGold/10 text-vanyGold'
                  }`}>
                    {order.status}
                  </span>
                  <p className="text-sm font-serif font-bold italic">{order.total_price} $</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODALE --- */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/80 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 relative shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-8 text-zinc-500 hover:text-white">✕</button>
            <h3 className="text-xl font-serif font-black uppercase tracking-widest mb-8 text-vanyGold text-center">Édition Profil</h3>
            
            <form onSubmit={updateProfile} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest ml-1">Nom & Prénom</label>
                <input type="text" value={fullname} onChange={(e) => setFullname(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-vanyGold transition-colors" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest ml-1">Adresse complète</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-vanyGold transition-colors" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest ml-1">WhatsApp</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-vanyGold transition-colors" />
              </div>
              <button type="submit" className="w-full bg-white text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-vanyGold transition-all mt-4">
                {loading ? 'Enregistrement...' : 'Sauvegarder'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}