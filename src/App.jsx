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
  const [userRole, setUserRole] = useState('client'); // État pour stocker le rôle

  useEffect(() => {
    // 1. Récupérer la session et le rôle au démarrage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserRole(session.user.id);
    });

    // 2. Écouter les changements (Connexion / Déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole('client');
      }
      setView('shop'); 
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fonction pour aller chercher le rôle "admin" ou "client" dans la table profiles
  async function fetchUserRole(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (data) setUserRole(data.role);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserRole('client');
    setView('shop');
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-vanyGold selection:text-black font-sans">
      <header className="py-10 border-b border-zinc-900 sticky top-0 z-50 bg-black/95 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center">
          <h1 
            className="text-5xl font-serif font-black tracking-[0.5em] mb-8 text-white cursor-pointer hover:text-vanyGold transition-colors"
            onClick={() => setView('shop')}
          >
            V-VANY
          </h1>
          
          <nav className="flex flex-wrap justify-center gap-8 text-[11px] font-black uppercase tracking-[0.3em]">
            <button onClick={() => setView('shop')} className={view === 'shop' ? 'text-vanyGold' : 'text-zinc-400 hover:text-white transition-colors'}>Boutique</button>
            <button onClick={() => setView('cart')} className={`relative ${view === 'cart' ? 'text-vanyGold' : 'text-zinc-400 hover:text-white transition-colors'}`}>
              Panier {cart.length > 0 && <span className="text-vanyGold">({cart.length})</span>}
            </button>
            
            {session ? (
              <>
                <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-vanyGold' : 'text-zinc-400 hover:text-white'}>Profil</button>
                
                {/* LE BOUTON ADMIN EST MAINTENANT SÉCURISÉ ICI */}
                {userRole === 'admin' && (
                  <button onClick={() => setView('admin')} className={view === 'admin' ? 'text-vanyGold' : 'text-zinc-400 hover:text-white'}>Admin</button>
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
        {/* SÉCURITÉ SUPPLÉMENTAIRE : On passe la session au composant Admin */}
        {view === 'admin' && session && userRole === 'admin' && <Admin session={session} />}
      </main>

      <footer className="py-20 border-t border-zinc-900 text-center opacity-30">
        <p className="text-[10px] tracking-[0.5em] uppercase font-bold text-white">V-VANY Maison de Luxe</p>
      </footer>
    </div>
  );
}