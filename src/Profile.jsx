import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Profile({ session }) {
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [orders, setOrders] = useState([]); // Pour l'historique client
  
  // Données du profil
  const [fullname, setFullname] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (session) {
      getProfile();
      getUserOrders();
    }
  }, [session]);

  // Récupérer les infos du profil
  async function getProfile() {
    setLoading(true);
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (data) {
      setFullname(data.full_name || '');
      setAddress(data.address || '');
      setPhone(data.phone || '');
    }
    setLoading(false);
  }

  // Récupérer l'historique des commandes du client
  async function getUserOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    setOrders(data || []);
  }

  // Mettre à jour le profil (Correction de la récursion)
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
      alert("Erreur : " + error.message);
    } else {
      setShowModal(false);
      getProfile();
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-20 animate-fadeIn">
      {/* --- CARTE DE MEMBRE VIP --- */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden mb-12">
        <div className="absolute top-0 right-0 p-8">
           <span className="text-vanyGold/10 font-serif text-8xl font-black italic select-none">V</span>
        </div>

        <h2 className="text-xl font-serif font-black tracking-[0.3em] uppercase text-white mb-10 border-b border-zinc-800/50 pb-6">
          Compte Privilège
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-6">
            <div className="flex flex-col">
              <span className="text-[9px] text-vanyGold font-black uppercase tracking-widest mb-1 opacity-60">Nom du Membre</span>
              <span className="text-lg text-white font-bold">{fullname || 'Client V-VANY'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-vanyGold font-black uppercase tracking-widest mb-1 opacity-60">Email</span>
              <span className="text-xs text-zinc-400 font-medium">{session.user.email}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col">
              <span className="text-[9px] text-vanyGold font-black uppercase tracking-widest mb-1 opacity-60">Livraison</span>
              <span className="text-xs text-zinc-300 font-medium leading-relaxed">{address || 'Non renseignée'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-vanyGold font-black uppercase tracking-widest mb-1 opacity-60">WhatsApp</span>
              <span className="text-xs text-zinc-300 font-medium">{phone || 'Non renseigné'}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="mt-12 w-full bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-vanyGold hover:text-white transition-all shadow-lg"
        >
          Mettre à jour mes coordonnées
        </button>
      </div>

      {/* --- HISTORIQUE DES COMMANDES --- */}
      <div className="px-6">
        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500 mb-6 flex items-center gap-4">
          Mes Commandes <span className="h-px flex-grow bg-zinc-900"></span>
        </h3>
        
        {orders.length === 0 ? (
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest italic text-center py-10">Aucune commande enregistrée.</p>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-zinc-900/40 border border-zinc-800/50 p-5 rounded-2xl flex justify-between items-center group hover:border-vanyGold/30 transition-all">
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Commande #{order.id.slice(0,5)}</p>
                  <p className="text-[9px] text-zinc-500 uppercase">{new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest mb-2 inline-block ${
                    order.status === 'Livré' ? 'bg-green-500/10 text-green-500' : 'bg-vanyGold/10 text-vanyGold'
                  }`}>
                    {order.status}
                  </span>
                  <p className="text-sm font-serif font-bold text-white italic">{order.total_price} $</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODALE DE MODIFICATION (Inchangée mais stylisée) --- */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/90 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-8 text-zinc-500 hover:text-white">✕</button>
            <h3 className="text-xl font-serif font-black text-white uppercase tracking-widest mb-8 text-center text-vanyGold">Mise à jour</h3>
            
            <form onSubmit={updateProfile} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest ml-1">Nom Complet</label>
                <input type="text" value={fullname} onChange={(e) => setFullname(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-vanyGold" placeholder="EX: VAVIANE M..." />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest ml-1">Adresse de livraison</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-vanyGold" placeholder="VILLE, QUARTIER, N°" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest ml-1">WhatsApp</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-vanyGold" placeholder="+243..." />
              </div>
              <button type="submit" className="w-full bg-white text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-vanyGold transition-all mt-4 shadow-xl">
                {loading ? 'Traitement...' : 'Enregistrer les modifications'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}