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
      alert("Profil mis à jour avec succès !");
    }
  }

  // Fonction pour supprimer une commande du côté client
  async function deleteOrder(orderId, status) {
    const statusAllowed = ['Livré', 'Annulé', 'Annulé par le client'];
    if (!statusAllowed.includes(status)) {
      alert("Vous ne pouvez supprimer que les commandes livrées ou annulées.");
      return;
    }

    if (confirm("Voulez-vous retirer cette commande de votre historique ?")) {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (!error) {
        setOrders(orders.filter(o => o.id !== orderId));
      }
    }
  }

  if (loading) return <div className="py-20 text-center text-vanyGold animate-pulse">CHARGEMENT DU PROFIL...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fadeIn space-y-12">
      
      {/* SECTION IDENTITÉ */}
      <section className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
           <span className="text-[10px] text-vanyGold font-black tracking-[0.3em] uppercase">V-VANY Privilège</span>
        </div>

        <h2 className="text-white font-serif text-2xl uppercase tracking-widest mb-8 italic">Mon Profil</h2>
        
        {!isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-zinc-500 text-[9px] uppercase font-black tracking-widest mb-1">Nom Complet</p>
                <p className="text-white text-sm font-bold uppercase">{fullName || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-[9px] uppercase font-black tracking-widest mb-1">Contact WhatsApp</p>
                <p className="text-white text-sm font-bold">{phone || 'Non renseigné'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-zinc-500 text-[9px] uppercase font-black tracking-widest mb-1">Adresse de livraison</p>
                <p className="text-white text-sm font-bold uppercase">{address || 'Non renseignée'}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsEditing(true)}
              className="mt-6 text-vanyGold border-b border-vanyGold pb-1 text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-white transition-all"
            >
              Modifier mes informations
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="NOM COMPLET" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-vanyGold" />
              <input type="text" placeholder="TÉLÉPHONE" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-vanyGold" />
              <input type="text" placeholder="ADRESSE COMPLETE" value={address} onChange={(e) => setAddress(e.target.value)} className="bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-vanyGold md:col-span-2" />
            </div>
            <div className="flex gap-4">
              <button onClick={updateProfile} className="bg-white text-black font-black text-[10px] uppercase tracking-widest px-8 py-3 rounded-full hover:bg-vanyGold transition-all">Enregistrer</button>
              <button onClick={() => setIsEditing(false)} className="text-zinc-500 text-[10px] uppercase font-black tracking-widest px-4">Annuler</button>
            </div>
          </div>
        )}
      </section>

      {/* SECTION HISTORIQUE */}
      <section>
        <div className="flex justify-between items-end mb-8 border-b border-zinc-900 pb-4">
          <h2 className="text-white font-serif text-xl uppercase tracking-widest italic">Historique des commandes</h2>
          <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest">{orders.length} Réservations</span>
        </div>

        {orders.length === 0 ? (
          <div className="py-20 text-center bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
            <p className="text-zinc-600 text-xs uppercase tracking-widest italic">Aucun achat pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-zinc-900/40 border border-zinc-900 p-6 rounded-3xl flex items-center justify-between group hover:border-zinc-700 transition-all">
                <div className="flex gap-6 items-center">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                    <span className="text-vanyGold text-xs italic">V</span>
                  </div>
                  <div>
                    <p className="text-white text-[11px] font-black uppercase tracking-widest mb-1">Commande #{order.id.slice(0, 5)}</p>
                    <p className="text-zinc-500 text-[9px] uppercase tracking-tighter">
                      {new Date(order.created_at).toLocaleDateString('fr-FR')} — {order.total_price} $
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Statut avec couleur adaptée au mode sombre */}
                  <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${
                    order.status === 'Livré' ? 'border-green-900 text-green-500 bg-green-500/5' :
                    order.status.includes('Annulé') ? 'border-red-900 text-red-500 bg-red-500/5' :
                    'border-vanyGold/30 text-vanyGold bg-vanyGold/5'
                  }`}>
                    {order.status}
                  </span>

                  {/* Bouton supprimer (uniquement si fini ou annulé) */}
                  {(order.status === 'Livré' || order.status.includes('Annulé')) && (
                    <button 
                      onClick={() => deleteOrder(order.id, order.status)}
                      className="text-zinc-700 hover:text-red-500 transition-colors p-2"
                      title="Supprimer de l'historique"
                    >
                      <span className="text-sm">✕</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}