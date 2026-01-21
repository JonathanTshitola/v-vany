import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import OrderList from './OrderList';

// CONFIGURATION LUXE
const CLOTHING_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = ['37', '38', '39', '40', '41', '42', '43', '44', '45'];
const PRESET_COLORS = [
  { name: 'Noir', hex: '#000000' }, { name: 'Brun', hex: '#4B3621' },
  { name: 'Blond', hex: '#faf0be' }, { name: 'Or', hex: '#D4AF37' },
  { name: 'Rouge', hex: '#8B0000' }, { name: 'Bleu Nuit', hex: '#000080' }
];

export default function Admin({ session }) {
  const [tab, setTab] = useState('stock');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // ÉTATS FORMULAIRE
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Perruques');
  const [stock, setStock] = useState(1);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data || []);
  }

  const currentSizeList = category === 'Chaussures' ? SHOE_SIZES : CLOTHING_SIZES;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name}`;
        await supabase.storage.from('product-images').upload(fileName, imageFile);
        imageUrl = supabase.storage.from('product-images').getPublicUrl(fileName).data.publicUrl;
      }

      const variants = [];
      if (selectedSizes.length > 0) variants.push({ type: 'Taille', options: selectedSizes });
      if (selectedColors.length > 0) variants.push({ type: 'Couleur', options: selectedColors });

      const { error } = await supabase.from('products').insert([{
        name, price: parseFloat(price), category, image_url: imageUrl, stock: parseInt(stock), variants
      }]);

      if (error) throw error;
      alert("Article ajouté au catalogue V-VANY");
      setName(''); setPrice(''); setSelectedSizes([]); setSelectedColors([]);
      fetchProducts();
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex justify-center gap-8 mb-12">
        <button onClick={() => setTab('stock')} className={`text-[11px] font-black uppercase tracking-[0.3em] pb-2 ${tab === 'stock' ? 'text-vanyGold border-b-2 border-vanyGold' : 'text-zinc-600'}`}>Gestion Stock</button>
        <button onClick={() => setTab('orders')} className={`text-[11px] font-black uppercase tracking-[0.3em] pb-2 ${tab === 'orders' ? 'text-vanyGold border-b-2 border-vanyGold' : 'text-zinc-600'}`}>Commandes</button>
      </div>

      {tab === 'stock' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* FORMULAIRE ADMIN */}
          <div className="lg:col-span-1 bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 space-y-6 h-fit">
            <h2 className="text-white font-serif text-xl italic text-center">Nouvelle Pièce</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <input type="text" placeholder="NOM" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-[10px] outline-none focus:border-vanyGold" required />
              
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="PRIX $" value={price} onChange={e=>setPrice(e.target.value)} className="bg-black border border-zinc-800 p-4 rounded-xl text-white text-[10px] outline-none" required />
                <input type="number" placeholder="STOCK" value={stock} onChange={e=>setStock(e.target.value)} className="bg-black border border-zinc-800 p-4 rounded-xl text-white text-[10px] outline-none" required />
              </div>

              <select value={category} onChange={e => {setCategory(e.target.value); setSelectedSizes([]);}} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-[10px] font-bold uppercase outline-none">
                <option>Perruques</option><option>Robes</option><option>Chaussures</option><option>Chemises</option><option>Autres produits</option>
              </select>

              {/* SÉLECTEUR TAILLES DYNAMIQUE */}
              <div className="p-4 bg-black/40 rounded-2xl border border-zinc-800/50 space-y-3">
                <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">{category === 'Chaussures' ? 'Pointures' : 'Tailles'}</p>
                <div className="flex flex-wrap gap-2">
                  {currentSizeList.map(s => (
                    <button key={s} type="button" onClick={() => setSelectedSizes(prev => prev.includes(s) ? prev.filter(x=>x!==s) : [...prev, s])}
                      className={`w-9 h-9 rounded-lg text-[9px] font-bold transition-all ${selectedSizes.includes(s) ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500 hover:text-white'}`}>{s}</button>
                  ))}
                </div>
              </div>

              {/* SÉLECTEUR COULEURS VISUEL */}
              <div className="p-4 bg-black/40 rounded-2xl border border-zinc-800/50 space-y-3">
                <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Couleurs</p>
                <div className="flex flex-wrap gap-4 justify-center">
                  {PRESET_COLORS.map(c => (
                    <button key={c.name} type="button" onClick={() => setSelectedColors(prev => prev.includes(c.name) ? prev.filter(x=>x!==c.name) : [...prev, c.name])} className="flex flex-col items-center gap-1">
                      <div style={{ backgroundColor: c.hex }} className={`w-6 h-6 rounded-full border-2 transition-all ${selectedColors.includes(c.name) ? 'border-white scale-110' : 'border-transparent'}`} />
                      <span className={`text-[7px] font-bold ${selectedColors.includes(c.name) ? 'text-white' : 'text-zinc-700'}`}>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <input type="file" onChange={e=>setImageFile(e.target.files[0])} className="text-[9px] text-zinc-500" />
              <button className="w-full bg-white text-black py-4 rounded-xl font-black text-[10px] tracking-[0.2em] uppercase hover:bg-vanyGold hover:text-white transition-all">{loading ? 'EN COURS...' : 'AJOUTER AU CATALOGUE'}</button>
            </form>
          </div>

          {/* LISTE PRODUITS */}
          <div className="lg:col-span-2 space-y-4">
            {products.map(p => (
              <div key={p.id} className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-3xl flex items-center justify-between group hover:border-zinc-700 transition-all">
                <div className="flex items-center gap-6">
                  <img src={p.image_url} className="w-16 h-16 object-cover rounded-xl border border-zinc-800" />
                  <div>
                    <h3 className="text-white text-[11px] font-black uppercase">{p.name}</h3>
                    <p className="text-vanyGold text-xs font-serif italic">{p.price} $</p>
                  </div>
                </div>
                <button onClick={async() => {if(confirm("Supprimer ?")){await supabase.from('products').delete().eq('id', p.id); fetchProducts();}}} className="text-zinc-700 hover:text-red-500 p-4 transition-colors">✕</button>
              </div>
            ))}
          </div>
        </div>
      ) : <OrderList />}
    </div>
  );
}