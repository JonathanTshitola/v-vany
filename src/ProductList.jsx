import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function ProductList({ cart, setCart }) {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('Tout');

  const categories = ['Tout', 'Perruques', 'Robes', 'Chaussures', 'Chemises', 'Autres produits'];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let res = products.filter(p => 
      (activeCat === 'Tout' || p.category === activeCat) && 
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(res);
  }, [search, activeCat, products]);

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data || []);
    setFiltered(data || []);
  }

  return (
    <div className="animate-fadeIn">
      {/* SECTION RECHERCHE ET FILTRES */}
      <div className="flex flex-col items-center mb-24 gap-12">
        {/* Barre de recherche avec effet de lueur au focus */}
        <div className="relative w-full max-w-xl group">
          <input 
            type="text" 
            placeholder="RECHERCHER DANS L'UNIVERS V-VANY..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 text-white p-6 rounded-full text-center text-[11px] tracking-[0.3em] outline-none focus:border-vanyGold focus:ring-1 focus:ring-vanyGold/50 transition-all duration-500 font-bold placeholder-zinc-600 backdrop-blur-sm"
          />
          <div className="absolute inset-0 rounded-full bg-vanyGold/5 blur-xl group-focus-within:bg-vanyGold/10 transition-all -z-10"></div>
        </div>

        {/* Boutons Catégories avec Contraste Maximum */}
        <div className="flex flex-wrap justify-center gap-4">
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCat(cat)} 
              className={`text-[10px] font-black uppercase tracking-[0.2em] px-8 py-3 rounded-full border transition-all duration-500 transform active:scale-95 ${
                activeCat === cat 
                ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-110' 
                : 'bg-transparent text-zinc-500 border-zinc-800 hover:text-white hover:border-zinc-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRILLE DE PRODUITS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
        {filtered.map(product => (
          <div key={product.id} className="group relative">
            {/* Image avec effet de zoom et ombre portée */}
            <div className="relative aspect-[3/4] bg-zinc-900 rounded-[2.5rem] overflow-hidden mb-8 border border-zinc-800 transition-all duration-700 group-hover:border-vanyGold/50 shadow-2xl">
              <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110" 
              />
              {/* Overlay dégradé subtil sur l'image */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            </div>

            {/* Détails du produit */}
            <div className="text-center space-y-3 px-4">
              <p className="text-[10px] text-vanyGold uppercase font-black tracking-[0.4em] mb-1 animate-pulse">
                {product.category}
              </p>
              <h3 className="text-xl font-serif uppercase tracking-[0.2em] text-white font-bold leading-tight">
                {product.name}
              </h3>
              <p className="font-black text-2xl text-white/90 italic tracking-tighter">
                {product.price} <span className="text-vanyGold">$</span>
              </p>
              
              {/* Bouton d'ajout avec effet de brillance */}
              <button 
                onClick={() => setCart([...cart, product])} 
                className="relative overflow-hidden w-full mt-6 bg-white text-black py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:bg-vanyGold hover:text-white hover:shadow-vanyGold/20 group-active:scale-95"
              >
                <span className="relative z-10">Ajouter au Panier</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Message si aucun résultat */}
      {filtered.length === 0 && (
        <div className="text-center py-40">
          <p className="text-zinc-500 font-serif italic text-2xl tracking-widest">Aucune pièce trouvée dans cette collection.</p>
        </div>
      )}
    </div>
  );
}