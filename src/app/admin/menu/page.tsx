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
    image_url: '',
    preparation_time: '5-10 m',
    serving_note: 'Best Served Cold',
    highlight_title: 'Signature Taste',
    highlight_description: 'Unique blend that brings out the soul of every bean.'
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
        image_url: item.image_url || '',
        preparation_time: item.preparation_time || '5-10 m',
        serving_note: item.serving_note || 'Best Served Cold',
        highlight_title: item.highlight_title || 'Signature Taste',
        highlight_description: item.highlight_description || 'Unique blend that brings out the soul of every bean.'
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: 'Coffee',
        price: '',
        description: '',
        image_url: '',
        preparation_time: '5-10 m',
        serving_note: 'Best Served Cold',
        highlight_title: 'Signature Taste',
        highlight_description: 'Unique blend that brings out the soul of every bean.'
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
                  <label className="block text-sm font-bold text-gray-400 mb-2">Menu Image</label>
                  <div className="space-y-4">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        setIsSubmitting(true);
                        try {
                          const fileExt = file.name.split('.').pop();
                          const fileName = `${Math.random()}.${fileExt}`;
                          const filePath = `${fileName}`;

                          const { data, error } = await supabase.storage
                            .from('menu-items')
                            .upload(filePath, file);

                          if (error) throw error;

                          const { data: { publicUrl } } = supabase.storage
                            .from('menu-items')
                            .getPublicUrl(filePath);

                          setFormData({ ...formData, image_url: publicUrl });
                        } catch (err: any) {
                          console.error('Upload failed:', err);
                          alert('Upload failed: ' + err.message);
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      id="menu-image-upload"
                      className="hidden"
                    />
                    
                    {formData.image_url ? (
                      <div className="relative h-48 w-full rounded-2xl overflow-hidden group">
                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <label 
                            htmlFor="menu-image-upload"
                            className="px-6 py-2 bg-white text-black rounded-full font-bold text-sm cursor-pointer hover:bg-emerald-500 hover:text-white transition-all scale-90 group-hover:scale-100 duration-300"
                          >
                            Change Photo
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label 
                        htmlFor="menu-image-upload"
                        className="w-full h-48 bg-gray-50 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-emerald-500/30 hover:bg-emerald-50/10 transition-all group"
                      >
                         <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-gray-300 shadow-sm group-hover:scale-110 transition-transform">
                            <ImageIcon size={24} />
                         </div>
                         <div className="text-center">
                            <p className="text-sm font-bold text-gray-400 group-hover:text-emerald-500 transition-colors">Click to Upload Image</p>
                            <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest mt-1">PNG, JPG up to 5MB</p>
                         </div>
                      </label>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Description / Our Story</label>
                  <textarea 
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Brief details about this item..."
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/10 resize-none" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Prep Time</label>
                    <input 
                      type="text" 
                      value={formData.preparation_time}
                      onChange={(e) => setFormData({...formData, preparation_time: e.target.value})}
                      placeholder="e.g. 5-10 m"
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/10" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Serving Note</label>
                    <input 
                      type="text" 
                      value={formData.serving_note}
                      onChange={(e) => setFormData({...formData, serving_note: e.target.value})}
                      placeholder="e.g. Best Served Cold"
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/10" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Signature Highlight</h4>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Highlight Title</label>
                    <input 
                      type="text" 
                      value={formData.highlight_title}
                      onChange={(e) => setFormData({...formData, highlight_title: e.target.value})}
                      placeholder="e.g. Signature Taste"
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/10" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Highlight Description</label>
                    <textarea 
                      rows={2}
                      value={formData.highlight_description}
                      onChange={(e) => setFormData({...formData, highlight_description: e.target.value})}
                      placeholder="e.g. Unique blend that brings out the soul of every bean."
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/10 resize-none" 
                    />
                  </div>
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
