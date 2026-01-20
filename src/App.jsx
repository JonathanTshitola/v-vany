import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Admin from './Admin';
import ProductList from './ProductList';
import Auth from './Auth';
import Profile from './Profile';
import Cart from './Cart';

export default function App() {
  const [session, setSession] = useState(null);
  const [view, setView] = useState('shop'); 
  const [cart, setCart] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [hasNewOrder, setHasNewOrder] = useState(false); // État pour la notification

  useEffect(() => {
    // 1. Gestion de la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserRole(session.user.id);
    });

    // 2. Écouteur de changement d'état (connexion/déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole('client');
        setView('shop');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Écouteur Temps Réel pour les commandes (uniquement pour l'admin)
  useEffect(() => {
    if (userRole === 'admin') {
      const channels = supabase.channel('order-notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            setHasNewOrder(true);
            // Petit son discret de notification
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.log("Audio bloqué par le navigateur"));
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channels); };
    }
  }, [userRole]);

  async function fetchUserRole(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    setUserRole(data?.role || 'client');
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-vanyGold selection:text-black font-sans">
      <header className="py-10 border-b border-zinc-900 sticky top-0 z-50 bg-black/95 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center">
          <h1 className="text-5xl font-serif font-black tracking-[0.5em] mb-8 text-white cursor-pointer hover:text-vanyGold transition-colors" onClick={() => setView('shop')}>
            V-VANY
          </h1>
          
          <nav className="flex flex-wrap justify-center gap-8 text-[11px] font-black uppercase tracking-[0.3em]">
            <button onClick={() => setView('shop')} className={view === 'shop' ? 'text-vanyGold' : 'text-zinc-400 hover:text-white'}>Boutique</button>
            <button onClick={() => setView('cart')} className={`relative ${view === 'cart' ? 'text-vanyGold' : 'text-zinc-400 hover:text-white'}`}>
              Panier {cart.length > 0 && <span className="text-vanyGold">({cart.length})</span>}
            </button>
            
            {session ? (
              <>
                <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-vanyGold' : 'text-zinc-400 hover:text-white'}>Profil</button>
                
                {userRole === 'admin' && (
                  <button 
                    onClick={() => { setView('admin'); setHasNewOrder(false); }} 
                    className={`relative transition-all ${view === 'admin' ? 'text-vanyGold' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Admin
                    {/* PASTILLE DE NOTIFICATION */}
                    {hasNewOrder && (
                      <span className="absolute -top-1 -right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vanyGold opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-vanyGold"></span>
                      </span>
                    )}
                  </button>
                )}
                
                <button onClick={handleLogout} className="text-red-600 hover:text-red-400 font-black italic">Quitter</button>
              </>
            ) : (
              <button onClick={() => setView('login')} className={view === 'login' ? 'text-vanyGold' : 'text-zinc-400 hover:text-white'}>Espace Privé</button>
            )}
          </nav>
        </div>
      </header>

      <main className="py-12 px-4 max-w-7xl mx-auto animate-fadeIn">
        {view === 'shop' && <ProductList cart={cart} setCart={setCart} />}
        {view === 'cart' && <Cart cart={cart} setCart={setCart} session={session} setView={setView} />}
        {view === 'login' && <Auth />}
        {view === 'profile' && session && <Profile session={session} />}
        
        {view === 'admin' && (
          session && userRole === 'admin' ? (
            <Admin session={session} />
          ) : (
            <div className="py-40 text-center">
              <h2 className="text-white font-serif text-2xl uppercase tracking-[0.2em]">Accès Refusé</h2>
              <p className="text-vanyGold text-[10px] mt-4 uppercase tracking-widest font-black">Zone réservée à la direction.</p>
            </div>
          )
        )}
      </main>

      <footer className="py-20 border-t border-zinc-900 text-center opacity-30">
        <p className="text-[10px] tracking-[0.5em] uppercase font-bold text-white">V-VANY Maison de Luxe</p>
      </footer>
    </div>
  );
}