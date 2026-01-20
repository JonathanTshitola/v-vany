import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import OrderList from './OrderList';

export default function Admin() {
  const [tab, setTab] = useState('stock');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- ÉTATS PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Tu peux changer ce nombre (5, 8, 10...)

  // --- ÉTATS FORMULAIRE ---
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Perruques');
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data || []);
  }

  // --- LOGIQUE DE PAGINATION ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = products.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(products.length / itemsPerPage);

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
      const payload = { name, price: parseFloat(price), category, image_url: imageUrl };
      if (editingId) await supabase.from('products').update(payload).eq('id', editingId);
      else await supabase.from('products').insert([payload]);
      
      setEditingId(null); setName(''); setPrice(''); setImageFile(null);
      fetchProducts();
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-20">
      {/* Menu Onglets */}
      <div className="flex justify-center gap-10 mb-12 border-b border-zinc-900">
        <button onClick={() => setTab('stock')} className={`pb-4 text-[11px] font-black uppercase tracking-widest ${tab === 'stock' ? 'border-b-2 border-vanyGold text-vanyGold' : 'text-zinc-600'}`}>Stock</button>
        <button onClick={() => setTab('orders')} className={`pb-4 text-[11px] font-black uppercase tracking-widest ${tab === 'orders' ? 'border-b-2 border-vanyGold text-vanyGold' : 'text-zinc-600'}`}>Commandes</button>
      </div>

      {tab === 'stock' ? (
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* FORMULAIRE (Fixe sur ordinateur, normal sur mobile) */}
          <div className="w-full lg:w-1/3">
            <div className="bg-zinc-900 p-8 rounded-[2rem] border border-zinc-800 sticky top-32">
              <h3 className="text-white font-serif text-lg uppercase tracking-widest mb-8 text-center">
                {editingId ? 'Modifier Article' : 'Nouveau Stock'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder="NOM" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-vanyGold" required />
                <input type="number" placeholder="PRIX ($)" value={price} onChange={e=>setPrice(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-vanyGold" required />
                <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-[10px] uppercase font-bold outline-none">
                  <option>Perruques</option><option>Robes</option><option>Chaussures</option><option>Chemises</option><option>Autres produits</option>
                </select>
                <input type="file" onChange={e=>setImageFile(e.target.files[0])} className="text-[9px] text-zinc-500" />
                <button className="w-full bg-white text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-vanyGold transition-all">
                  {loading ? 'EN COURS...' : 'VALIDER'}
                </button>
                {editingId && <button type="button" onClick={()=>{setEditingId(null); setName(''); setPrice('');}} className="w-full text-zinc-500 text-[9px] uppercase mt-2">Annuler</button>}
              </form>
            </div>
          </div>

          {/* LISTE DES PRODUITS AVEC PAGINATION */}
          <div className="w-full lg:w-2/3">
            <div className="space-y-3">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-6">Articles enregistrés : {products.length}</p>
              
              {currentProducts.map(p => (
                <div key={p.id} className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-900 flex items-center justify-between group hover:border-zinc-700 transition-all">
                  <div className="flex items-center gap-4">
                    <img src={p.image_url} className="w-12 h-12 object-cover rounded-lg bg-black" />
                    <div>
                      <h4 className="text-white font-bold text-xs uppercase tracking-wider">{p.name}</h4>
                      <p className="text-vanyGold font-bold text-xs">{p.price} $</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => { setEditingId(p.id); setName(p.name); setPrice(p.price); setCategory(p.category); window.scrollTo(0,0); }} className="text-[9px] font-black text-zinc-500 hover:text-white uppercase">Editer</button>
                    <button onClick={async() => { if(confirm("Supprimer?")) { await supabase.from('products').delete().eq('id',p.id); fetchProducts(); }}} className="text-[9px] font-black text-red-900 hover:text-red-500 uppercase">Suppr.</button>
                  </div>
                </div>
              ))}
            </div>

            {/* BARRE DE PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border ${currentPage === 1 ? 'border-zinc-800 text-zinc-700' : 'border-zinc-700 text-white hover:bg-zinc-800'}`}
                >
                  Précédent
                </button>
                
                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                  Page {currentPage} / {totalPages}
                </span>

                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border ${currentPage === totalPages ? 'border-zinc-800 text-zinc-700' : 'border-zinc-700 text-white hover:bg-zinc-800'}`}
                >
                  Suivant
                </button>
              </div>
            )}
          </div>

        </div>
      ) : <OrderList />}
    </div>
  );
}