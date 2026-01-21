import { useState } from 'react';
import { supabase } from './supabaseClient';

const PRESET_COLORS = [
  { name: 'Noir', hex: '#000000' }, { name: 'Brun', hex: '#4B3621' },
  { name: 'Blond', hex: '#faf0be' }, { name: 'Or', hex: '#D4AF37' },
  { name: 'Rouge', hex: '#8B0000' }, { name: 'Bleu Nuit', hex: '#000080' }
];

export default function Cart({ cart, setCart, session, setView }) {
  const [ordered, setOrdered] = useState(false);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const total = cart.reduce((acc, item) => acc + item.price, 0);

  const handleFinalizeOrder = async () => {
    if (!session) { setView('login'); return; }
    setIsProcessing(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('full_name, address, phone').eq('id', session.user.id).single();
      const { data, error } = await supabase.from('orders').insert([{
        user_id: session.user.id, customer_email: session.user.email,
        customer_name: profile?.full_name || 'Client', customer_address: profile?.address || 'N/A',
        customer_phone: profile?.phone || 'N/A', total_price: total, items: cart, status: 'En attente'
      }]).select();

      if (error) throw error;
      for (const item of cart) { if (item.stock) await supabase.from('products').update({ stock: item.stock - 1 }).eq('id', item.id); }
      setLastOrderId(data[0].id); setOrdered(true); setShowConfirmModal(true);
    } catch (err) { alert(err.message); }
    setIsProcessing(false);
  };

  if (ordered) return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-center animate-fadeIn">
      <div className="w-16 h-16 bg-vanyGold/10 border border-vanyGold rounded-full flex items-center justify-center mx-auto mb-8 text-vanyGold font-serif italic text-2xl">V</div>
      <h2 className="text-2xl font-serif text-white uppercase tracking-widest mb-6">Réservation Confirmée</h2>
      <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[2.5rem] space-y-6">
        <p className="text-vanyGold text-[10px] font-black uppercase tracking-widest">Numéro de paiement</p>
        <p className="text-3xl text-white font-black">+243 977 098 016</p>
        <button onClick={() => setShowConfirmModal(true)} className="w-full bg-white text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-vanyGold hover:text-white transition-all">Notifier sur WhatsApp</button>
        <button onClick={() => {setCart([]); setView('shop');}} className="w-full bg-zinc-800 text-zinc-500 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest">Retour Boutique</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 pb-20">
      <h2 className="text-3xl font-serif text-white uppercase tracking-[0.3em] mb-12 text-center italic">Votre Sélection</h2>
      {cart.length === 0 ? (
        <div className="text-center py-20 border border-zinc-900 rounded-[3rem] bg-zinc-900/10">
          <p className="text-zinc-600 italic mb-6">Votre écrin est vide.</p>
          <button onClick={() => setView('shop')} className="text-vanyGold border-b border-vanyGold/30 pb-1 text-[10px] font-black uppercase tracking-widest">Découvrir</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, i) => (
              <div key={i} className="flex gap-6 items-center bg-zinc-900/40 border border-zinc-900 p-5 rounded-3xl">
                <img src={item.image_url} className="w-20 h-20 object-cover rounded-xl border border-zinc-800" />
                <div className="flex-grow">
                  <h3 className="text-white font-black text-[10px] uppercase tracking-widest">{item.name}</h3>
                  <div className="flex gap-2 mt-2">
                    {item.selectedOptions && Object.entries(item.selectedOptions).map(([k, v]) => {
                      const c = k === 'Couleur' ? PRESET_COLORS.find(pc => pc.name === v) : null;
                      return (
                        <span key={k} className="flex items-center gap-1.5 bg-black/50 text-[8px] text-zinc-400 px-2 py-1 rounded-md uppercase font-bold border border-zinc-800">
                          {c && <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: c.hex}} />}
                          {k === 'Taille' && item.category === 'Chaussures' ? 'P.' : k}: {v}
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-vanyGold font-serif text-lg mt-2">{item.price} $</p>
                </div>
                <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="text-zinc-700 hover:text-white px-4">✕</button>
              </div>
            ))}
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white p-10 rounded-[3rem] sticky top-32 text-black text-center shadow-2xl">
              <p className="text-[9px] font-black uppercase text-zinc-400 mb-2">Total Acquisition</p>
              <p className="text-4xl font-serif italic font-black mb-10">{total} $</p>
              <button onClick={handleFinalizeOrder} disabled={isProcessing} className="w-full bg-black text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-vanyGold transition-all">
                {isProcessing ? "ENVOI..." : "CONFIRMER L'ACQUISITION"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}