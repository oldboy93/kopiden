'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2,
  X,
  Loader2,
  Image as ImageIcon,
  Coffee
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const router = useRouter();
  
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
      <AdminSidebar />

      <main className="flex-grow p-4 sm:p-8 md:p-12 overflow-x-hidden">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 md:mb-12 gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1a1a1a]">Menu Catalog</h1>
            <p className="text-xs sm:text-sm text-gray-400">Organize and manage your digital coffee shop.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto px-6 py-4 bg-[#1a1a1a] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-primary/10"
          >
            <Plus size={20} /> Add New Item
          </button>
        </header>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
           <div className="flex-grow relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
              type="text" 
              placeholder="Search menu items..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/10 shadow-sm text-sm" 
             />
           </div>
           <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full sm:w-auto px-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none shadow-sm font-medium text-sm"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 group hover:border-emerald-500/20 transition-all">
                <div className="h-40 sm:h-48 w-full bg-emerald-50 rounded-[1.5rem] sm:rounded-[2rem] mb-4 sm:mb-6 flex items-center justify-center overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <Coffee size={40} className="text-emerald-200" />
                  )}
                </div>
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full mb-1.5 sm:mb-2 inline-block">{item.category}</span>
                    <h3 className="text-lg sm:text-xl font-bold leading-tight">{item.name}</h3>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <p className="text-xl sm:text-2xl font-black text-[#1a1a1a]">Rp {item.price.toLocaleString('id-ID')}</p>
                </div>
                <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-100 flex gap-3 sm:gap-4 md:opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={() => handleOpenModal(item)}
                    className="flex-grow py-2.5 sm:py-3 bg-gray-50 text-gray-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 hover:text-emerald-500 transition-all text-sm"
                   >
                    <Edit size={16} /> Edit
                   </button>
                   <button 
                    onClick={() => confirmDelete(item)}
                    className="flex-grow py-2.5 sm:py-3 bg-red-50 text-red-500 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all text-sm"
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
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 relative shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 sm:top-8 sm:right-8 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
              
              <h2 className="text-2xl sm:text-3xl font-black mb-6 sm:mb-8 text-[#1a1a1a]">
                {editingItem ? 'Edit Item' : 'New Item'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
