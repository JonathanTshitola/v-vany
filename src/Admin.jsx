import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import OrderList from './OrderList';

// CONFIGURATION DES OPTIONS
const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const PRESET_COLORS = [
  { name: 'Noir', hex: '#000000' },
  { name: 'Brun', hex: '#4B3621' },
  { name: 'Blond', hex: '#faf0be' },
  { name: 'Or', hex: '#D4AF37' },
  { name: 'Rouge', hex: '#8B0000' },
  { name: 'Bleu Nuit', hex: '#000080' }
];

export default function Admin({ session }) {
  const [tab, setTab] = useState('stock');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // --- ÉTATS FORMULAIRE ---
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Perruques');
  const [stock, setStock] = useState(1);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (session) { checkRole(); fetchProducts(); }
  }, [session]);

  async function checkRole() {
    const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    setUserRole(data?.role || 'client');
  }

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data || []);
  }

  // --- LOGIQUE SÉLECTION ---
  const toggleSize = (size) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };

  const toggleColor = (colorName) => {
    setSelectedColors(prev => prev.includes(colorName) ? prev.filter(c => c !== colorName) : [...prev, colorName]);
  };

  const toggleAllSizes = () => {
    setSelectedSizes(selectedSizes.length === ALL_SIZES.length ? [] : ALL_SIZES);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = editingId ? products.find(p => p.id === editingId).image_url : "";
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name}`;
        await supabase.storage.from('product-images').upload(fileName, imageFile);
        imageUrl = supabase.storage.from('product-images').getPublicUrl(fileName).data.publicUrl;
      }

      // Construction des variantes
      const variants = [];
      if (selectedSizes.length > 0) variants.push({ type: 'Taille', options: selectedSizes });
      if (selectedColors.length > 0) variants.push({ type: 'Couleur', options: selectedColors });

      const payload = { 
        name, price: parseFloat(price), category, image_url: imageUrl,
        stock: parseInt(stock), variants
      };
      
      if (editingId) {
        await supabase.from('products').update(payload).eq('id', editingId);
      } else {
        await supabase.from('products').insert([payload]);
      }
      
      // Reset complet
      setEditingId(null); setName(''); setPrice(''); setStock(1);
      setSelectedSizes([]); setSelectedColors([]); setImageFile(null);
      fetchProducts();
      alert("Catalogue V-VANY mis à jour !");
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  if (userRole !== 'admin') return <div className="py-40 text-center text-white font-serif uppercase tracking-widest">Accès Direction Uniquement</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 pb-20 animate-fadeIn">
      <div className="flex justify-center gap-10 mb-12 border-b border-zinc-900">
        <button onClick={() => setTab('stock')} className={`pb-4 text-[11px] font-black uppercase tracking-widest ${tab === 'stock' ? 'border-b-2 border-vanyGold text-vanyGold' : 'text-zinc-600'}`}>Stock</button>
        <button onClick={() => setTab('orders')} className={`pb-4 text-[11px] font-black uppercase tracking-widest ${tab === 'orders' ? 'border-b-2 border-vanyGold text-vanyGold' : 'text-zinc-600'}`}>Commandes</button>
      </div>

      {tab === 'stock' ? (
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* FORMULAIRE */}
          <div className="w-full lg:w-1/3">
            <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 sticky top-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <input type="text" placeholder="NOM DE L'ARTICLE" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-vanyGold" required />
                
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="PRIX ($)" value={price} onChange={e=>setPrice(e.target.value)} className="bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none" required />
                  <input type="number" placeholder="STOCK" value={stock} onChange={e=>setStock(e.target.value)} className="bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none" required />
                </div>

                {/* TAILLES */}
                <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-zinc-800/50">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest italic">Tailles</span>
                    <button type="button" onClick={toggleAllSizes} className="text-[7px] text-vanyGold border border-vanyGold/20 px-2 py-0.5 rounded uppercase">Tout</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ALL_SIZES.map(s => (
                      <button key={s} type="button" onClick={() => toggleSize(s)} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all ${selectedSizes.includes(s) ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500'}`}>{s}</button>
                    ))}
                  </div>
                </div>

                {/* COULEURS */}
                <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-zinc-800/50">
                  <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest italic">Couleurs</span>
                  <div className="flex flex-wrap gap-3">
                    {PRESET_COLORS.map(c => (
                      <button key={c.name} type="button" onClick={() => toggleColor(c.name)} className="flex flex-col items-center gap-1">
                        <div style={{ backgroundColor: c.hex }} className={`w-6 h-6 rounded-full border-2 ${selectedColors.includes(c.name) ? 'border-white scale-110' : 'border-transparent'}`} />
                        <span className={`text-[7px] font-bold ${selectedColors.includes(c.name) ? 'text-white' : 'text-zinc-600'}`}>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-[10px] uppercase font-bold outline-none">
                  <option>Perruques</option><option>Robes</option><option>Chaussures</option><option>Chemises</option><option>Autres produits</option>
                </select>

                <div className="bg-black/50 p-4 rounded-xl border border-dashed border-zinc-800">
                   <input type="file" onChange={e=>setImageFile(e.target.files[0])} className="text-[9px] text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-zinc-800 file:text-white" />
                </div>

                <button className="w-full bg-white text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-vanyGold transition-all duration-500">
                  {loading ? 'ENREGISTREMENT...' : 'VALIDER L\'ARTICLE'}
                </button>
              </form>
            </div>
          </div>

          {/* LISTE DES PRODUITS */}
          <div className="w-full lg:w-2/3 space-y-3">
            {products.map(p => (
              <div key={p.id} className="bg-zinc-900/40 p-5 rounded-3xl border border-zinc-900 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <img src={p.image_url} className="w-16 h-16 object-cover rounded-2xl border border-zinc-800" />
                  <div>
                    <h4 className="text-white font-bold text-xs uppercase">{p.name}</h4>
                    <p className="text-vanyGold font-black text-xs">{p.price} $ <span className="text-zinc-600 text-[10px] ml-2">STOCK: {p.stock}</span></p>
                    <div className="flex gap-2 mt-1">
                      {p.variants?.map((v, i) => (
                        <span key={i} className="text-[7px] text-zinc-500 uppercase font-bold bg-black/50 px-2 py-0.5 rounded border border-zinc-800">
                          {v.type}: {v.options.length}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => { 
                    setEditingId(p.id); setName(p.name); setPrice(p.price); setCategory(p.category); setStock(p.stock || 0);
                    setSelectedSizes(p.variants?.find(v => v.type === 'Taille')?.options || []);
                    setSelectedColors(p.variants?.find(v => v.type === 'Couleur')?.options || []);
                    window.scrollTo({top: 0, behavior: 'smooth'}); 
                  }} className="text-[9px] font-black text-zinc-500 hover:text-white uppercase transition-all">Editer</button>
                  <button onClick={async() => { if(confirm("Supprimer ?")) { await supabase.from('products').delete().eq('id',p.id); fetchProducts(); }}} className="text-[9px] font-black text-red-900 hover:text-red-500 uppercase transition-all">Suppr.</button>
                </div>
              </div>
            ))}
          </div>

        </div>
      ) : <OrderList />}
    </div>
  );
}