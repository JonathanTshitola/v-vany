import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const PRESET_COLORS = [
  { name: 'Noir', hex: '#000000' }, { name: 'Brun', hex: '#4B3621' },
  { name: 'Blond', hex: '#faf0be' }, { name: 'Or', hex: '#D4AF37' },
  { name: 'Rouge', hex: '#8B0000' }, { name: 'Bleu Nuit', hex: '#000080' }
];

export default function ProductList({ cart, setCart }) {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('Tout');
  const [selectedVariants, setSelectedVariants] = useState({});

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    let res = products.filter(p => (activeCat === 'Tout' || p.category === activeCat) && p.name.toLowerCase().includes(search.toLowerCase()));
    setFiltered(res);
  }, [search, activeCat, products]);

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data || []); setFiltered(data || []);
  }

  const handleAddToCart = (product) => {
    if (product.stock <= 0) return;
    const choices = selectedVariants[product.id] || {};
    if (product.variants && !product.variants.every(v => choices[v.type])) {
      alert("Veuillez choisir vos options."); return;
    }
    const uniqueId = `${product.id}-${Object.values(choices).join('-')}`;
    setCart([...cart, { ...product, cartItemId: uniqueId, selectedOptions: choices }]);
  };

  return (
    <div className="animate-fadeIn pb-20 px-4 bg-black text-white">
      {/* RECHERCHE */}
      <div className="flex flex-col items-center mb-20 gap-10">
        <input type="text" placeholder="RECHERCHER DANS L'UNIVERS V-VANY..." value={search} onChange={e=>setSearch(e.target.value)}
          className="w-full max-w-xl bg-zinc-900/60 border border-zinc-800 text-white p-5 rounded-full text-center text-[10px] tracking-[0.3em] outline-none focus:border-vanyGold transition-all font-bold" />
        
        <div className="flex flex-wrap justify-center gap-3">
          {['Tout', 'Perruques', 'Robes', 'Chaussures', 'Chemises', 'Autres produits'].map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)} 
              className={`text-[9px] font-black uppercase tracking-[0.2em] px-6 py-2.5 rounded-full border transition-all duration-500 ${
                activeCat === cat 
                ? 'bg-vanyGold text-white border-vanyGold' 
                : 'bg-transparent text-zinc-500 border-zinc-800 hover:text-white hover:border-vanyGold'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRILLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20">
        {filtered.map(product => (
          <div key={product.id} className="group">
            <div className="relative aspect-[3/4] bg-zinc-900 rounded-[2.5rem] overflow-hidden mb-8 border border-zinc-800 group-hover:border-vanyGold/50 transition-all duration-700">
              <img src={product.image_url} alt={product.name} className={`w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110 ${product.stock <= 0 ? 'grayscale opacity-50' : ''}`} />
            </div>

            <div className="text-center space-y-4">
              <p className="text-[9px] text-vanyGold uppercase font-black tracking-[0.3em] italic">{product.category}</p>
              <h3 className="text-xl font-serif text-white uppercase italic tracking-wider">{product.name}</h3>

              {/* VARIANTES */}
              {product.variants?.map((v, idx) => (
                <div key={idx} className="space-y-4">
                  <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest italic">{v.type}</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {v.options.map(opt => {
                      const isSelected = selectedVariants[product.id]?.[v.type] === opt;
                      const colorInfo = v.type === 'Couleur' ? PRESET_COLORS.find(c => c.name === opt) : null;
                      
                      return (
                        <button key={opt} onClick={() => setSelectedVariants({...selectedVariants, [product.id]: {...selectedVariants[product.id], [v.type]: opt}})}
                          className={`flex items-center justify-center transition-all duration-500 border ${
                            v.type === 'Couleur' ? 'px-4 py-2 rounded-full gap-2' : 'w-11 h-11 rounded-xl'
                          } ${
                            isSelected 
                            ? 'bg-white text-black border-white' 
                            : 'bg-transparent text-zinc-600 border-zinc-800 hover:text-white hover:border-white'
                          }`}>
                          {colorInfo && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorInfo.hex }} />}
                          <span className="text-[9px] font-black uppercase">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <p className="font-serif text-2xl text-white italic">{product.price} $</p>
              
              {/* BOUTON PANIER - CORRIGÉ POUR LE THÈME SOMBRE */}
              <button 
                onClick={() => handleAddToCart(product)} 
                disabled={product.stock <= 0} 
                className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-500 border ${
                  product.stock <= 0 
                  ? 'bg-zinc-900 text-zinc-700 border-zinc-800' 
                  : 'bg-transparent text-white border-zinc-800 hover:bg-white hover:text-black hover:border-white'
                  // Ici : Par défaut transparent/bordure grise. Au survol : devient blanc avec écritures noires pour flasher.
                }`}
              >
                {product.stock <= 0 ? "Indisponible" : "Ajouter au Panier"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}