import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Cart({ cart, setCart, session, setView }) {
  const [ordered, setOrdered] = useState(false);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const total = cart.reduce((acc, item) => acc + item.price, 0);

  // 1. Finaliser la commande avec mise à jour des stocks
  const handleFinalizeOrder = async () => {
    if (!session) { setView('login'); return; }
    setIsProcessing(true);

    try {
      // Récupérer les infos du profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, address, phone')
        .eq('id', session.user.id)
        .single();

      // Enregistrement de la commande (on envoie tout le panier avec les variantes choisies)
      const { data, error } = await supabase.from('orders').insert([{
        user_id: session.user.id,
        customer_email: session.user.email,
        customer_name: profile?.full_name || 'Client non renseigné',
        customer_address: profile?.address || 'Adresse manquante',
        customer_phone: profile?.phone || 'Pas de numéro',
        total_price: total,
        items: cart, // Contient les produits + leurs options sélectionnées
        status: 'En attente'
      }]).select();

      if (error) throw error;

      // --- NOUVEAU : MISE À JOUR DES STOCKS DANS SUPABASE ---
      for (const item of cart) {
        if (item.stock !== undefined) {
          const { error: stockError } = await supabase
            .from('products')
            .update({ stock: item.stock - 1 })
            .eq('id', item.id);
          
          if (stockError) console.error("Erreur stock pour " + item.name, stockError);
        }
      }

      setLastOrderId(data[0].id);
      setOrdered(true);
      setShowConfirmModal(true);

    } catch (err) {
      alert("Erreur lors de la réservation : " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelOrder = async () => {
    if (lastOrderId) {
      await supabase.from('orders').update({ status: 'Annulé par le client' }).eq('id', lastOrderId);
    }
    setOrdered(false);
    setLastOrderId(null);
    setView('shop');
  };

  const handleFinish = () => {
    setCart([]); 
    setOrdered(false);
    setLastOrderId(null);
    setView('shop');
  };

  const redirectToWhatsApp = () => {
    const phone = "243977098016";
    const msg = `✨ RÉSERVATION V-VANY ✨\n\nJ'ai effectué une commande de ${total}$.\n\nID Commande : #${lastOrderId?.slice(0,5)}\n\nJe vous envoie ma preuve de paiement pour valider l'expédition.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    setShowConfirmModal(false);
  };

  // --- ÉCRAN DE RÉUSSITE ---
  if (ordered) return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-fadeIn text-center">
      <div className="mb-12">
        <div className="w-20 h-20 bg-vanyGold/10 border border-vanyGold rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-vanyGold text-3xl">✨</span>
        </div>
        <h2 className="text-3xl font-serif font-black text-white tracking-widest uppercase mb-4">Réservation Confirmée</h2>
        <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em]">Votre pièce est mise de côté pour vous</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-[2.5rem] shadow-2xl space-y-8">
        <div className="py-4">
          <p className="text-vanyGold text-[10px] font-black uppercase tracking-[0.3em] mb-6">Instructions de paiement</p>
          <p className="text-white text-xs font-bold uppercase mb-2">M-Pesa / Orange / Airtel Money</p>
          <p className="text-4xl text-white font-black tracking-tighter">+243 977 098 016</p>
          <p className="text-[10px] text-zinc-500 mt-3 font-bold uppercase tracking-widest italic">Compte : V-VANY LUXE</p>
        </div>

        <div className="border-t border-zinc-800 pt-8 flex flex-col gap-4">
          <button onClick={() => setShowConfirmModal(true)} className="w-full bg-white text-black py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-vanyGold hover:text-white transition-all">
            Notifier via WhatsApp
          </button>
          <button onClick={handleFinish} className="w-full bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-700">
            Terminer & Retour à la boutique
          </button>
          <button onClick={cancelOrder} className="text-zinc-600 hover:text-red-500 text-[9px] uppercase font-bold tracking-widest pt-4">
            Annuler la commande
          </button>
        </div>
      </div>
      {/* ... Modal WhatsApp inchangé ... */}
    </div>
  );

  // --- RENDU PANIER ---
  return (
    <div className="max-w-5xl mx-auto px-4 animate-fadeIn">
      <h2 className="text-3xl font-serif font-black text-white uppercase tracking-[0.4em] mb-12 text-center">Votre Bag</h2>
      {cart.length === 0 ? (
        <div className="text-center py-24 border border-zinc-900 rounded-[3rem] bg-zinc-900/10">
          <p className="text-zinc-600 font-serif italic text-xl mb-8">Votre sélection est vide.</p>
          <button onClick={() => setView('shop')} className="text-vanyGold border-b border-vanyGold pb-1 text-[10px] font-black uppercase tracking-widest">Découvrir la collection</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, i) => (
              <div key={i} className="flex gap-6 items-center bg-zinc-900/40 border border-zinc-900 p-5 rounded-3xl">
                <img src={item.image_url} className="w-20 h-20 object-cover rounded-xl border border-zinc-800 shadow-lg" />
                <div className="flex-grow">
                  <h3 className="text-white font-black text-xs uppercase tracking-widest">{item.name}</h3>
                  
                  {/* AFFICHAGE DES VARIANTES CHOISIES */}
                  {item.selectedOptions && (
                    <div className="flex gap-2 mt-1">
                      {Object.entries(item.selectedOptions).map(([key, value]) => (
                        <span key={key} className="text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase font-bold tracking-tighter">
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-vanyGold font-bold font-serif text-lg mt-1">{item.price} $</p>
                </div>
                <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="text-zinc-700 hover:text-red-500 px-4">✕</button>
              </div>
            ))}
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[2.5rem] sticky top-32 text-black shadow-2xl">
              <div className="flex justify-between items-end mb-10">
                <span className="font-black text-xs uppercase tracking-tighter">Total</span>
                <span className="font-black text-4xl font-serif italic">{total} $</span>
              </div>
              <button 
                onClick={handleFinalizeOrder}
                disabled={isProcessing}
                className="w-full bg-black text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-vanyGold transition-all"
              >
                {isProcessing ? "TRAITEMENT..." : "CONFIRMER LA COMMANDE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}