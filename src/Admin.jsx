import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import OrderList from './OrderList';

export default function Admin({ session }) {
  const [tab, setTab] = useState('stock');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null); // null = chargement en cours

  // --- ÉTATS PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // --- ÉTATS FORMULAIRE ---
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Perruques');
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (session) {
      checkRole();
      fetchProducts();
    }
  }, [session]);

  async function checkRole() {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    setUserRole(data?.role || 'client');
  }

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
      
      if (editingId) {
        await supabase.from('products').update(payload).eq('id', editingId);
      } else {
        await supabase.from('products').insert([payload]);
      }
      
      setEditingId(null); setName(''); setPrice(''); setImageFile(null);
      fetchProducts();
      alert("Mise à jour réussie !");
    } catch (err) { 
      alert("Erreur : " + err.message); 
    }
    setLoading(false);
  };

  // --- ÉCRANS DE SÉCURITÉ ---
  if (userRole === null) return <div className="py-20 text-center text-zinc-500 font-serif uppercase tracking-widest">Vérification...</div>;
  
  if (userRole !== 'admin') return (
    <div className="py-40 text-center">
      <h2 className="text-white font-serif text-2xl uppercase tracking-[0.2em]">Accès Refusé</h2>
      <p className="text-vanyGold text-[10px] mt-4 uppercase tracking-widest font-black">Cette zone est réservée à la direction V-VANY.</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 pb-20 animate-fadeIn">
      {/* Menu Onglets */}
      <div className="flex justify-center gap-10 mb-12 border-b border-zinc-900">
        <button onClick={() => setTab('stock')} className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all ${tab === 'stock' ? 'border-b-2 border-vanyGold text-vanyGold' : 'text-zinc-600'}`}>Gestion Stock</button>
        <button onClick={() => setTab('orders')} className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all ${tab === 'orders' ? 'border-b-2 border-vanyGold text-vanyGold' : 'text-zinc-600'}`}>Commandes Clients</button>
      </div>

      {tab === 'stock' ? (
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* FORMULAIRE */}
          <div className="w-full lg:w-1/3">
            <div className="bg-zinc-900 p-8 rounded-[2rem] border border-zinc-800 sticky top-32">
              <h3 className="text-white font-serif text-lg uppercase tracking-widest mb-8 text-center text-vanyGold">
                {editingId ? 'Modifier Article' : 'Nouveau Stock'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder="NOM DE L'ARTICLE" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-vanyGold" required />
                <input type="number" placeholder="PRIX EN $" value={price} onChange={e=>setPrice(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs outline-none focus:border-vanyGold" required />
                <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-[10px] uppercase font-bold outline-none cursor-pointer">
                  <option>Perruques</option><option>Robes</option><option>Chaussures</option><option>Chemises</option><option>Autres produits</option>
                </select>
                <div className="bg-black/50 p-4 rounded-xl border border-dashed border-zinc-800">
                   <p className="text-[9px] text-zinc-500 mb-2 uppercase font-bold">Image du produit :</p>
                   <input type="file" onChange={e=>setImageFile(e.target.files[0])} className="text-[9px] text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[9px] file:font-black file:bg-zinc-800 file:text-white" />
                </div>
                <button className="w-full bg-white text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-vanyGold transition-all">
                  {loading ? 'CHARGEMENT...' : 'VALIDER L\'ARTICLE'}
                </button>
                {editingId && (
                  <button type="button" onClick={()=>{setEditingId(null); setName(''); setPrice('');}} className="w-full text-zinc-500 text-[9px] uppercase mt-2 font-bold tracking-widest">Annuler la modification</button>
                )}
              </form>
            </div>
          </div>

          {/* LISTE DES PRODUITS */}
          <div className="w-full lg:w-2/3">
            <div className="flex justify-between items-center mb-6">
               <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total Stock : {products.length} articles</p>
            </div>
            
            <div className="space-y-3">
              {currentProducts.map(p => (
                <div key={p.id} className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-900 flex items-center justify-between group hover:border-zinc-700 transition-all">
                  <div className="flex items-center gap-4">
                    <img src={p.image_url} className="w-14 h-14 object-cover rounded-xl bg-black border border-zinc-800" />
                    <div>
                      <h4 className="text-white font-bold text-xs uppercase tracking-wider">{p.name}</h4>
                      <p className="text-vanyGold font-bold text-xs">{p.price} $</p>
                      <span className="text-[8px] text-zinc-600 uppercase font-black">{p.category}</span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => { setEditingId(p.id); setName(p.name); setPrice(p.price); setCategory(p.category); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="text-[9px] font-black text-zinc-500 hover:text-vanyGold uppercase transition-colors">Editer</button>
                    <button onClick={async() => { if(confirm("Supprimer définitivement cet article ?")) { await supabase.from('products').delete().eq('id',p.id); fetchProducts(); }}} className="text-[9px] font-black text-red-900 hover:text-red-500 uppercase transition-colors">Suppr.</button>
                  </div>
                </div>
              ))}
            </div>

            {/* BARRE DE PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-6 mt-12">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo(0,0); }}
                  className={`px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border transition-all ${currentPage === 1 ? 'border-zinc-900 text-zinc-800' : 'border-zinc-700 text-white hover:bg-white hover:text-black'}`}
                >
                  Précédent
                </button>
                
                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                  Page <span className="text-white">{currentPage}</span> / {totalPages}
                </span>

                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo(0,0); }}
                  className={`px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border transition-all ${currentPage === totalPages ? 'border-zinc-900 text-zinc-800' : 'border-zinc-700 text-white hover:bg-white hover:text-black'}`}
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