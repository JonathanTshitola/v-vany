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
    <div className="animate-fadeIn pb-32 px-4 bg-black">
      {/* HEADER MINIMALISTE */}
      <div className="flex flex-col items-center mb-28 space-y-12">
        <h1 className="text-vanyGold font-serif italic text-sm tracking-[0.8em] uppercase opacity-60">La Maison V-Vany</h1>
        
        <input type="text" placeholder="RECHERCHER UNE PIÈCE..." value={search} onChange={e=>setSearch(e.target.value)}
          className="w-full max-w-md bg-transparent border-b border-zinc-800 text-white p-4 text-center text-[10px] tracking-[0.4em] outline-none focus:border-vanyGold transition-all uppercase" />
        
        <div className="flex flex-wrap justify-center gap-8">
          {['Tout', 'Perruques', 'Robes', 'Chaussures', 'Chemises', 'Autres produits'].map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)} 
              className={`text-[8px] font-black uppercase tracking-[0.3em] transition-all duration-700 ${
                activeCat === cat ? 'text-vanyGold border-b border-vanyGold pb-1' : 'text-zinc-600 hover:text-white'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRILLE D'EXPOSITION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
        {filtered.map(product => (
          <div key={product.id} className="group relative">
            {/* IMAGE AVEC OVERLAY RÉVÉLATEUR */}
            <div className="relative aspect-[3/4] rounded-[3rem] overflow-hidden mb-8 shadow-2xl bg-zinc-950">
              <img src={product.image_url} alt={product.name} 
                className={`w-full h-full object-cover transition-transform duration-[2.5s] ease-out group-hover:scale-110 ${product.stock <= 0 ? 'grayscale opacity-30' : ''}`} />
              
              {/* PANNEAU D'OPTIONS QUI MONTE AU SURVOL */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col justify-center items-center p-8 space-y-6">
                {product.variants?.map((v, idx) => (
                  <div key={idx} className="w-full text-center">
                    <p className="text-vanyGold text-[7px] font-black uppercase tracking-[0.4em] mb-3">{v.type}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {v.options.map(opt => {
                        const isSelected = selectedVariants[product.id]?.[v.type] === opt;
                        const colorInfo = v.type === 'Couleur' ? PRESET_COLORS.find(c => c.name === opt) : null;
                        return (
                          <button key={opt} onClick={(e) => { e.stopPropagation(); setSelectedVariants({...selectedVariants, [product.id]: {...selectedVariants[product.id], [v.type]: opt}}); }}
                            className={`transition-all duration-500 border ${v.type === 'Couleur' ? 'w-6 h-6 rounded-full' : 'px-3 py-1 rounded-md text-[8px] font-bold'} ${
                              isSelected ? 'border-white bg-white text-black scale-110' : 'border-zinc-700 text-white hover:border-vanyGold'
                            }`} style={colorInfo && !isSelected ? { backgroundColor: colorInfo.hex } : {}}>
                            {!colorInfo && opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => handleAddToCart(product)}
                  className="mt-4 bg-white text-black text-[9px] font-black uppercase tracking-[0.3em] px-8 py-4 rounded-full hover:bg-vanyGold hover:text-white transition-all duration-500"
                >
                  Acquérir
                </button>
              </div>
              
              {product.stock <= 0 && (
                <div className="absolute top-10 left-10 text-white text-[8px] font-black uppercase tracking-widest border border-white/20 px-4 py-2 rounded-full backdrop-blur-md">
                  Épuisé
                </div>
              )}
            </div>

            {/* INFOS PRODUIT TOUJOURS VISIBLES */}
            <div className="text-center space-y-2 transition-transform duration-700 group-hover:-translate-y-2">
              <h3 className="text-xl font-serif text-white uppercase tracking-wider opacity-90 group-hover:text-vanyGold transition-colors">{product.name}</h3>
              <div className="flex items-center justify-center gap-4">
                 <div className="h-[1px] w-8 bg-zinc-800"></div>
                 <p className="font-serif text-lg text-zinc-400 italic">{product.price} $</p>
                 <div className="h-[1px] w-8 bg-zinc-800"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}