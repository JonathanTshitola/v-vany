import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import OrderList from './OrderList';

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
  const [stock, setStock] = useState(1); // Nouveau : Gestion du stock
  const [variants, setVariants] = useState(''); // Nouveau : ex: "Taille: S, M, L"
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (session) {
      checkRole();
      fetchProducts();
    }
  }, [session]);

  async function checkRole() {
    const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    setUserRole(data?.role || 'client');
  }

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data || []);
  }

  // --- LOGIQUE TRANSFORMATION DES VARIANTES ---
  // Transforme "Taille: S, M, L" en JSON [{"type": "Taille", "options": ["S", "M", "L"]}]
  const formatVariants = (str) => {
    if (!str || !str.includes(':')) return [];
    const [type, optionsStr] = str.split(':');
    const options = optionsStr.split(',').map(o => o.trim());
    return [{ type: type.trim(), options }];
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

      const payload = { 
        name, 
        price: parseFloat(price), 
        category, 
        image_url: imageUrl,
        stock: parseInt(stock), // Enregistre le stock
        variants: formatVariants(variants) // Enregistre les variantes
      };
      
      if (editingId) {
        await supabase.from('products').update(payload).eq('id', editingId);
      } else {
        await supabase.from('products').insert([payload]);
      }
      
      // Reset
      setEditingId(null); setName(''); setPrice(''); setStock(1); setVariants(''); setImageFile(null);
      fetchProducts();
      alert("Article V-VANY mis à jour !");
    } catch (err) { 
      alert("Erreur : " + err.message); 
    }
    setLoading(false);
  };

  if (userRole === null) return <div className="py-20 text-center text-zinc-500 font-serif uppercase tracking-widest">Vérification...</div>;
  if (userRole !== 'admin') return <div className="py-40 text-center text-white font-serif uppercase tracking-widest">Accès Refusé</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 pb-20 animate-fadeIn">
      <div className="flex justify-center gap-10 mb-12 border-b border-zinc-900">
        <button onClick={() => setTab('stock')} className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all ${tab === 'stock' ? 'border-b-2 border-vanyGold text-vanyGold' : 'text-zinc-600'}`}>Gestion Stock</button>
        <button onClick={() => setTab('orders')} className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all ${tab === 'orders' ? 'border-b-2 border-vanyGold text-vanyGold' : 'text-zinc-600'}`}>Commandes Clients</button>
      </div>

      {tab === 'stock' ? (
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* FORMULAIRE ADMIN */}
          <div className="w-full lg:w-1/3">
            <div className="bg-zinc-900 p-8 rounded-[2rem] border border-zinc-800 sticky top-32">
              <h3 className="text-vanyGold font-serif text-lg uppercase tracking-widest mb-8 text-center italic">
                {editingId ? 'Modifier l\'Édition' : 'Nouvelle Création'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder="NOM DE L'ARTICLE" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-vanyGold" required />
                
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="PRIX ($)" value={price} onChange={e=>setPrice(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-vanyGold" required />
                  <input type="number" placeholder="STOCK" value={stock} onChange={e=>setStock(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-vanyGold" required />
                </div>

                <input 
                  type="text" 
                  placeholder="VARIANTES (Ex: Taille: 12, 14, 16)" 
                  value={variants} 
                  onChange={e=>setVariants(e.target.value)} 
                  className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-[10px] outline-none focus:border-vanyGold" 
                />
                <p className="text-[8px] text-zinc-600 uppercase font-bold px-2 italic">Format obligatoire - Type: Option1, Option2</p>

                <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-[10px] uppercase font-bold outline-none cursor-pointer">
                  <option>Perruques</option><option>Robes</option><option>Chaussures</option><option>Chemises</option><option>Autres produits</option>
                </select>

                <div className="bg-black/50 p-4 rounded-xl border border-dashed border-zinc-800">
                   <input type="file" onChange={e=>setImageFile(e.target.files[0])} className="text-[9px] text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-zinc-800 file:text-white" />
                </div>

                <button className="w-full bg-white text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-vanyGold transition-all">
                  {loading ? 'TRAITEMENT...' : 'ENREGISTRER'}
                </button>
              </form>
            </div>
          </div>

          {/* LISTE PRODUITS */}
          <div className="w-full lg:w-2/3 space-y-3">
            {products.map(p => (
              <div key={p.id} className="bg-zinc-900/40 p-5 rounded-3xl border border-zinc-900 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <img src={p.image_url} className="w-16 h-16 object-cover rounded-2xl border border-zinc-800" />
                  <div>
                    <h4 className="text-white font-bold text-xs uppercase">{p.name}</h4>
                    <p className="text-vanyGold font-black text-xs">{p.price} $ <span className="text-zinc-600 text-[10px] ml-2">— STOCK: {p.stock}</span></p>
                    {p.variants?.[0] && (
                      <p className="text-[8px] text-zinc-500 uppercase mt-1 italic">{p.variants[0].type}: {p.variants[0].options.join(', ')}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => { 
                    setEditingId(p.id); setName(p.name); setPrice(p.price); setCategory(p.category); setStock(p.stock || 0);
                    setVariants(p.variants?.[0] ? `${p.variants[0].type}: ${p.variants[0].options.join(', ')}` : '');
                    window.scrollTo({top: 0, behavior: 'smooth'}); 
                  }} className="text-[9px] font-black text-zinc-500 hover:text-white uppercase">Editer</button>
                  <button onClick={async() => { if(confirm("Supprimer ?")) { await supabase.from('products').delete().eq('id',p.id); fetchProducts(); }}} className="text-[9px] font-black text-red-900 hover:text-red-500 uppercase">Suppr.</button>
                </div>
              </div>
            ))}
          </div>

        </div>
      ) : <OrderList />}
    </div>
  );
}