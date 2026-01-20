import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    
    if (error) alert(error.message);
    else if (isSignUp) alert("Bienvenue chez V-VANY ! Votre compte est créé.");
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-10 bg-zinc-900 border border-zinc-700 rounded-[2.5rem] shadow-2xl">
      <h2 className="text-3xl font-serif font-black text-center mb-10 tracking-[0.2em] uppercase text-white">
        {isSignUp ? "Créer un compte" : "Espace Privé"}
      </h2>
      
      <form onSubmit={handleAuth} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] text-vanyGold font-black uppercase tracking-widest ml-2">Email</label>
          <input 
            type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 bg-black border border-zinc-700 rounded-xl text-white font-bold outline-none focus:border-vanyGold transition-colors"
            required 
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-vanyGold font-black uppercase tracking-widest ml-2">Mot de passe</label>
          <input 
            type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 bg-black border border-zinc-700 rounded-xl text-white font-bold outline-none focus:border-vanyGold transition-colors"
            required 
          />
        </div>
        <button 
          disabled={loading}
          className="w-full py-5 bg-white text-black rounded-2xl font-black tracking-[0.3em] uppercase hover:bg-vanyGold hover:text-white transition-all shadow-lg active:scale-95"
        >
          {loading ? "TRAITEMENT..." : isSignUp ? "S'INSCRIRE" : "SE CONNECTER"}
        </button>
      </form>

      <button 
        onClick={() => setIsSignUp(!isSignUp)}
        className="w-full mt-8 text-[11px] text-zinc-400 hover:text-white underline uppercase tracking-widest font-bold"
      >
        {isSignUp ? "Déjà membre ? Se connecter" : "Pas encore de compte ? Créer ici"}
      </button>
    </div>
  );
}