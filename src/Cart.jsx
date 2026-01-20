import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Cart({ cart, setCart, session, setView }) {
  const [ordered, setOrdered] = useState(false);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const total = cart.reduce((acc, item) => acc + item.price, 0);

  // Étape 1 : Enregistrement de la commande
  const handleFinalizeOrder = async () => {
    if (!session) { setView('login'); return; }
    setIsProcessing(true);

    try {
      // AJOUT : On inclut customer_email pour l'affichage Admin
      const { data, error } = await supabase.from('orders').insert([{
        user_id: session.user.id,
        customer_email: session.user.email, // Important pour l'Admin !
        total_price: total,
        items: cart,
        status: 'En attente'
      }]).select();

      if (!error) {
        setLastOrderId(data[0].id);
        setOrdered(true);
        setShowConfirmModal(true);
      } else {
        throw error;
      }
    } catch (err) {
      alert("Erreur lors de la réservation : " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Annuler la commande (si l'utilisateur change d'avis sur l'écran final)
  const cancelOrder = async () => {
    if (lastOrderId) {
      await supabase.from('orders').delete().eq('id', lastOrderId);
    }
    setOrdered(false);
    setLastOrderId(null);
    setView('shop');
  };

  const redirectToWhatsApp = () => {
    // Remplace les XXXXXXXXX par ton numéro de téléphone réel
    const msg = `✨ RÉSERVATION V-VANY ✨\n\nJ'ai effectué une commande de ${total}$.\n\nID Commande : ${lastOrderId}\n\nJe vous envoie ma preuve de paiement pour valider l'expédition.`;
    window.open(`https://wa.me/243977098016?text=${encodeURIComponent(msg)}`, '_blank');
    setShowConfirmModal(false);
    setCart([]); // On vide le panier seulement ici
  };

  // --- ÉCRAN DE SUCCÈS (Le même que le tien, avec le bouton annuler) ---
  if (ordered) return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-fadeIn">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-vanyGold/10 border border-vanyGold rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-vanyGold text-3xl">✨</span>
        </div>
        <h2 className="text-3xl font-serif font-black text-white tracking-widest uppercase mb-4">Réservation Confirmée</h2>
        <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em]">Votre pièce est mise de côté pour vous</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-[2.5rem] shadow-2xl text-center space-y-8 relative overflow-hidden">
        <div className="py-4">
          <p className="text-vanyGold text-[10px] font-black uppercase tracking-[0.3em] mb-6">Instructions de transfert</p>
          <p className="text-white text-xs font-bold uppercase mb-2">M-Pesa / Orange / Airtel Money</p>
          <p className="text-4xl text-white font-black tracking-tighter">+243 977 098 016</p>
          <p className="text-[10px] text-zinc-500 mt-3 font-bold uppercase tracking-widest italic">Compte : V-VANY LUXE</p>
        </div>

        <div className="border-t border-zinc-800 pt-8 space-y-4">
          <button 
            onClick={() => setShowConfirmModal(true)}
            className="w-full bg-white text-black py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-vanyGold hover:text-white transition-all shadow-xl"
          >
            Notifier le service client
          </button>
          <button onClick={cancelOrder} className="w-full text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
            Annuler la commande
          </button>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md bg-black/80 animate-fadeIn text-center">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl">
            <h4 className="text-white font-serif font-black uppercase tracking-widest mb-4 italic">V-VANY Concierge</h4>
            <p className="text-zinc-400 text-[11px] mb-8 leading-relaxed">
              Souhaitez-vous envoyer votre preuve de paiement sur WhatsApp maintenant ?
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={redirectToWhatsApp} className="w-full bg-[#25D366] text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg">Ouvrir WhatsApp</button>
              <button onClick={() => setShowConfirmModal(false)} className="w-full bg-transparent text-zinc-500 py-4 font-bold text-[10px] uppercase tracking-widest hover:text-white">Plus tard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // --- RENDU DU PANIER CLASSIQUE ---
  return (
    <div className="max-w-5xl mx-auto px-4 animate-fadeIn">
      <h2 className="text-3xl font-serif font-black text-white uppercase tracking-[0.4em] mb-12 text-center">Votre Bag</h2>
      {cart.length === 0 ? (
        <div className="text-center py-24 border border-zinc-900 rounded-[3rem] bg-zinc-900/10">
          <p className="text-zinc-600 font-serif italic text-xl mb-8">Votre sélection est vide.</p>
          <button onClick={() => setView('shop')} className="text-vanyGold border-b border-vanyGold pb-1 text-[10px] font-black uppercase tracking-widest">Parcourir la boutique</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, i) => (
              <div key={i} className="flex gap-6 items-center bg-zinc-900/40 border border-zinc-900 p-5 rounded-3xl">
                <img src={item.image_url} className="w-20 h-20 object-cover rounded-xl border border-zinc-800" />
                <div className="flex-grow">
                  <h3 className="text-white font-black text-xs uppercase tracking-widest">{item.name}</h3>
                  <p className="text-vanyGold font-bold font-serif text-lg">{item.price} $</p>
                </div>
                <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="text-zinc-700 hover:text-red-500 transition-colors px-4">✕</button>
              </div>
            ))}
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[2.5rem] sticky top-32 text-black shadow-2xl">
              <h3 className="font-black uppercase text-[10px] tracking-widest mb-8 border-b border-black/10 pb-4 text-center">Résumé</h3>
              <div className="flex justify-between items-end mb-10">
                <span className="font-black text-xs uppercase">Total</span>
                <span className="font-black text-4xl font-serif italic">{total} $</span>
              </div>
              <button 
                onClick={handleFinalizeOrder}
                disabled={isProcessing}
                className="w-full bg-black text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-vanyGold hover:text-white transition-all"
              >
                {isProcessing ? "RÉSERVATION..." : "PASSER COMMANDE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}