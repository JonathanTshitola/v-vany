import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Profile({ session }) {
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Données du profil
  const [fullname, setFullname] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    getProfile();
  }, [session]);

  async function getProfile() {
    setLoading(true);
    let { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (data) {
      setFullname(data.full_name || '');
      setAddress(data.address || '');
      setPhone(data.phone || '');
    }
    setLoading(false);
  }

  async function updateProfile(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      full_name: fullname,
      address,
      phone,
      updated_at: new Date(),
    });
    if (error) alert(error.message);
    else {
      setShowModal(false);
      getProfile();
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* --- AFFICHAGE STYLE "CARTE VIP" --- */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
           <span className="text-vanyGold/20 font-serif text-6xl font-black italic">V</span>
        </div>

        <h2 className="text-2xl font-serif font-black tracking-[0.3em] uppercase text-white mb-10 border-b border-zinc-800 pb-6">
          Se connecter
        </h2>

        <div className="space-y-8">
          <div className="flex flex-col">
            <span className="text-[10px] text-vanyGold font-black uppercase tracking-widest mb-1">Nom du Membre</span>
            <span className="text-xl text-white font-bold">{fullname || 'Non renseigné'}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-vanyGold font-black uppercase tracking-widest mb-1">Destination de livraison</span>
            <span className="text-sm text-zinc-300 font-medium">{address || 'Aucune adresse enregistrée'}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-vanyGold font-black uppercase tracking-widest mb-1">Contact WhatsApp</span>
            <span className="text-sm text-zinc-300 font-medium">{phone || 'Aucun numéro'}</span>
          </div>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="mt-12 w-full bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-vanyGold hover:text-white transition-all"
        >
          Modifier mes informations
        </button>
      </div>

      {/* --- LE PANEL (MODAL) DE MODIFICATION --- */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/80 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-[2.5rem] p-10 shadow-[0_0_50px_rgba(0,0,0,1)] relative">
            
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-8 text-zinc-500 hover:text-white text-xl"
            >
              ✕
            </button>

            <h3 className="text-xl font-serif font-black text-white uppercase tracking-widest mb-8">Mise à jour</h3>

            <form onSubmit={updateProfile} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-vanyGold font-black uppercase tracking-widest ml-1">Nom Complet</label>
                <input 
                  type="text" value={fullname} onChange={(e) => setFullname(e.target.value)}
                  className="w-full bg-black border border-zinc-700 p-4 rounded-xl text-white font-bold outline-none focus:border-vanyGold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-vanyGold font-black uppercase tracking-widest ml-1">Adresse livraison</label>
                <input 
                  type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-black border border-zinc-700 p-4 rounded-xl text-white font-bold outline-none focus:border-vanyGold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-vanyGold font-black uppercase tracking-widest ml-1">WhatsApp</label>
                <input 
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black border border-zinc-700 p-4 rounded-xl text-white font-bold outline-none focus:border-vanyGold"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="submit"
                  className="flex-1 bg-white text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-vanyGold transition-all"
                >
                  {loading ? 'Enregistrement...' : 'Confirmer'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 border border-zinc-700 text-zinc-400 rounded-xl text-[10px] font-bold uppercase"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}