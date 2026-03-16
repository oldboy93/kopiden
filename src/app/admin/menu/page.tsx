'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Coffee, 
  ShoppingBag, 
  LogOut, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2,
  X,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  
  // Modal/Delete State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Coffee',
    price: '',
    description: '',
    image_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  async function fetchMenu() {
    setLoading(true);
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMenuItems(data);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        price: item.price.toString(),
        description: item.description || '',
        image_url: item.image_url || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: 'Coffee',
        price: '',
        description: '',
        image_url: ''
      });
    }
    setIsModalOpen(true);
  };

  const confirmDelete = (item: any) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch(`/api/menu/${itemToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setMenuItems(prev => prev.filter(i => i.id !== itemToDelete.id));
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsSubmitting(false);
      setItemToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `/api/menu/${editingItem.id}` : '/api/menu';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        })
      });

      if (res.ok) {
        await fetchMenu();
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || item.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row">
      {/* Sidebar - Same fixed sidebar as Dashboard */}
      <aside className="w-full md:w-64 bg-[#1a1a1a] text-white p-6 md:p-8 flex flex-row md:flex-col gap-6 md:gap-12 md:sticky md:top-0 md:h-screen overflow-x-auto whitespace-nowrap md:whitespace-normal no-scrollbar items-center md:items-start z-50">
        <div className="text-2xl font-black text-emerald-500 hidden md:block">Kopiden.</div>
        <nav className="flex flex-row md:flex-col gap-2 md:gap-4 flex-grow w-full">
          <Link href="/admin/dashboard" className="flex items-center gap-2 md:gap-4 px-4 py-3 md:p-4 text-gray-400 hover:text-white transition-colors flex-shrink-0">
            <LayoutDashboard size={20} /> <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link href="/admin/menu" className="flex items-center gap-2 md:gap-4 px-4 py-3 md:p-4 bg-emerald-500 rounded-xl md:rounded-2xl font-bold flex-shrink-0">
            <Coffee size={20} /> <span className="hidden sm:inline">Menu Management</span>
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-2 md:gap-4 px-4 py-3 md:p-4 text-gray-400 hover:text-white transition-colors flex-shrink-0">
            <ShoppingBag size={20} /> <span className="hidden sm:inline">Orders</span>
          </Link>
        </nav>
        <button className="flex items-center gap-4 p-4 text-red-400 hover:text-red-500 transition-colors">
          <LogOut size={20} /> Logout
        </button>
      </aside>

      <main className="flex-grow p-12">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-3xl font-black text-[#1a1a1a]">Menu Catalog</h1>
            <p className="text-gray-400">Organize and manage your digital coffee shop.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="px-6 py-4 bg-[#1a1a1a] text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-primary/10"
          >
            <Plus size={20} /> Add New Item
          </button>
        </header>

        {/* Toolbar */}
        <div className="flex gap-4 mb-8">
           <div className="flex-grow relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
              type="text" 
              placeholder="Search menu items..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/10 shadow-sm" 
             />
           </div>
           <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none shadow-sm font-medium"
           >
             <option value="All">All Categories</option>
             <option value="Coffee">Coffee</option>
             <option value="Non-Coffee">Non-Coffee</option>
             <option value="Snacks">Snacks</option>
           </select>
        </div>

        {/* Menu Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-emerald-500" size={48} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 group hover:border-emerald-500/20 transition-all">
                <div className="h-48 w-full bg-emerald-50 rounded-[2rem] mb-6 flex items-center justify-center overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <Coffee size={48} className="text-emerald-200" />
                  )}
                </div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full mb-2 inline-block">{item.category}</span>
                    <h3 className="text-xl font-bold">{item.name}</h3>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <p className="text-2xl font-black text-[#1a1a1a]">Rp {item.price.toLocaleString('id-ID')}</p>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-100 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={() => handleOpenModal(item)}
                    className="flex-grow py-3 bg-gray-50 text-gray-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 hover:text-emerald-500 transition-all"
                   >
                    <Edit size={16} /> Edit
                   </button>
                   <button 
                    onClick={() => confirmDelete(item)}
                    className="flex-grow py-3 bg-red-50 text-red-500 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
                   >
                    <Trash2 size={16} /> Delete
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[3rem] p-10 relative shadow-2xl animate-in zoom-in duration-300 text-center">
              <div className="h-20 w-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h2 className="text-2xl font-black mb-2 text-[#1a1a1a]">Are you sure?</h2>
              <p className="text-gray-400 mb-8">
                You are about to delete <span className="font-bold text-[#1a1a1a]">"{itemToDelete?.name}"</span>. This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-grow py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-grow py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
                  Delete Item
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 relative shadow-2xl animate-in zoom-in duration-300">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-8 right-8 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-3xl font-black mb-8 text-[#1a1a1a]">
                {editingItem ? 'Edit Item' : 'New Item'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Item Name</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Arabica Roast"
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/10" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Category</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/10"
                    >
                      <option>Coffee</option>
                      <option>Non-Coffee</option>
                      <option>Snacks</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Price (Rp)</label>
                    <input 
                      required
                      type="number" 
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="35000"
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/10" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Image URL</label>
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      value={formData.image_url}
                      onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                      placeholder="/images/example.png"
                      className="flex-grow px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/10" 
                    />
                    <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                      <ImageIcon size={24} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Description</label>
                  <textarea 
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Brief details about this item..."
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/10 resize-none" 
                  />
                </div>

                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full py-5 bg-emerald-500 text-white rounded-[2rem] font-bold text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : null}
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
