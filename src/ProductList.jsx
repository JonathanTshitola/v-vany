import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

// On définit les couleurs pour faire correspondre les noms aux pastilles visuelles
const PRESET_COLORS = [
  { name: 'Noir', hex: '#000000' },
  { name: 'Brun', hex: '#4B3621' },
  { name: 'Blond', hex: '#faf0be' },
  { name: 'Or', hex: '#D4AF37' },
  { name: 'Rouge', hex: '#8B0000' },
  { name: 'Bleu Nuit', hex: '#000080' }
];

export default function ProductList({ cart, setCart }) {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('Tout');
  const [selectedVariants, setSelectedVariants] = useState({});

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

  const handleAddToCart = (product) => {
    if (product.stock <= 0) return;

    if (product.variants && product.variants.length > 0) {
      const choices = selectedVariants[product.id] || {};
      const allSelected = product.variants.every(v => choices[v.type]);
      
      if (!allSelected) {
        alert("Veuillez sélectionner vos options (Taille/Couleur) avant l'ajout.");
        return;
      }
      
      const uniqueId = `${product.id}-${Object.values(choices).join('-')}`;
      setCart([...cart, { ...product, cartItemId: uniqueId, selectedOptions: choices }]);
    } else {
      setCart([...cart, { ...product, cartItemId: product.id }]);
    }
  };

  return (
    <div className="animate-fadeIn pb-20">
      {/* SECTION RECHERCHE ET FILTRES */}
      <div className="flex flex-col items-center mb-20 gap-10">
        <div className="relative w-full max-w-xl group">
          <input 
            type="text" 
            placeholder="RECHERCHER DANS L'UNIVERS V-VANY..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900/40 border border-zinc-800/50 text-white p-5 rounded-full text-center text-[10px] tracking-[0.3em] outline-none focus:border-vanyGold transition-all duration-500 font-bold placeholder-zinc-600 backdrop-blur-md"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCat(cat)} 
              className={`text-[9px] font-black uppercase tracking-[0.2em] px-6 py-2.5 rounded-full border transition-all duration-500 ${
                activeCat === cat 
                ? 'bg-vanyGold text-white border-vanyGold shadow-lg shadow-vanyGold/20' 
                : 'bg-transparent text-zinc-500 border-zinc-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRILLE DE PRODUITS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20">
        {filtered.map(product => (
          <div key={product.id} className="group">
            {/* Image avec Badge Stock */}
            <div className="relative aspect-[3/4] bg-zinc-900 rounded-[2.5rem] overflow-hidden mb-6 border border-zinc-800 transition-all duration-700 group-hover:border-zinc-600 shadow-2xl">
              <img 
                src={product.image_url} 
                alt={product.name} 
                className={`w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110 ${product.stock <= 0 ? 'grayscale opacity-50' : ''}`} 
              />
              
              {product.stock <= 0 ? (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-2 rounded-full text-[9px] font-black tracking-[0.3em] uppercase">Épuisé</span>
                </div>
              ) : product.stock <= 3 ? (
                <div className="absolute top-6 right-6">
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter animate-pulse">Dernières pièces</span>
                </div>
              ) : null}
            </div>

            {/* Infos Produit */}
            <div className="text-center space-y-3">
              <p className="text-[9px] text-vanyGold uppercase font-black tracking-[0.3em] italic opacity-80">{product.category}</p>
              <h3 className="text-lg font-serif uppercase tracking-[0.1em] text-white italic">{product.name}</h3>
              
              {/* SÉLECTEUR DE VARIANTES LUXE */}
              {product.variants && product.variants.length > 0 && product.stock > 0 && (
                <div className="py-4 space-y-6">
                  {product.variants.map((v, idx) => (
                    <div key={idx} className="space-y-3">
                      <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest italic text-center">
                        {v.type === 'Taille' && product.category === 'Chaussures' ? 'Sélectionner Pointure' : `Choisir ${v.type}`}
                      </p>
                      <div className="flex flex-wrap justify-center gap-3">
                        {v.options.map(opt => {
                          const isSelected = selectedVariants[product.id]?.[v.type] === opt;
                          
                          // RENDU POUR LES COULEURS
                          if (v.type === 'Couleur') {
                            const colorData = PRESET_COLORS.find(c => c.name === opt);
                            return (
                              <button
                                key={opt}
                                onClick={() => setSelectedVariants({
                                  ...selectedVariants,
                                  [product.id]: { ...selectedVariants[product.id], [v.type]: opt }
                                })}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${
                                  isSelected ? 'border-vanyGold bg-vanyGold/5' : 'border-zinc-800'
                                }`}
                              >
                                <div 
                                  className="w-3 h-3 rounded-full border border-white/10" 
                                  style={{ backgroundColor: colorData?.hex || '#333' }} 
                                />
                                <span className={`text-[9px] font-bold uppercase ${isSelected ? 'text-white' : 'text-zinc-500'}`}>
                                  {opt}
                                </span>
                              </button>
                            );
                          }

                          // RENDU POUR LES TAILLES / POINTURES
                          return (
                            <button
                              key={opt}
                              onClick={() => setSelectedVariants({
                                ...selectedVariants,
                                [product.id]: { ...selectedVariants[product.id], [v.type]: opt }
                              })}
                              className={`w-11 h-11 flex items-center justify-center rounded-xl border text-[10px] font-black transition-all duration-500 ${
                                isSelected
                                ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-110'
                                : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col items-center gap-1">
                <p className="font-serif text-2xl text-white italic">{product.price} $</p>
                {product.stock > 0 && (
                   <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Disponibilité immédiate</p>
                )}
              </div>
              
              <button 
                onClick={() => handleAddToCart(product)} 
                disabled={product.stock <= 0}
                className={`w-full mt-4 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 ${
                  product.stock <= 0 
                  ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed border border-zinc-800' 
                  : 'bg-white text-black hover:bg-vanyGold hover:text-white shadow-xl shadow-black/20'
                }`}
              >
                {product.stock <= 0 ? "Momentanément indisponible" : "Ajouter à ma sélection"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}