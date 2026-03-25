'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Filter, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import AppHeader from '@/components/AppHeader';
import MenuDetailModal from '@/components/MenuDetailModal';

export default function Menu() {
  const { addToCart, totalItems } = useCart();
  const [categories, setCategories] = useState(['All', 'Coffee', 'Non-Coffee', 'Snacks']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchMenu() {
      setLoading(true);
      let query = supabase.from('menu').select('*');
      if (activeCategory !== 'All') {
        query = query.eq('category', activeCategory);
      }
      const { data, error } = await query;
      if (!error && data) setMenuItems(data);
      setLoading(false);
    }
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    fetchMenu();
    checkUser();
  }, [activeCategory]);

  const handleOpenDetail = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <AppHeader title="Menu" />

      <div className="container mx-auto px-5 md:px-8 py-8 md:py-12">
        <header className="mb-8 md:mb-12">
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-400 mb-3">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight size={14} />
            <span className="text-gray-900 font-medium">Menu</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-[#1a1a1a]">Choose Your Brew</h1>
        </header>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                activeCategory === cat 
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                : 'bg-white text-gray-400 hover:text-gray-600 border border-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
          <button className="ml-auto px-4 py-2 bg-white border border-gray-100 rounded-full text-gray-500 hover:text-primary flex items-center gap-2 transition-colors">
            <Filter size={16} /> Filters
          </button>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
          {loading ? (
            <div className="col-span-full py-20 text-center text-gray-400 italic">Brewing your menu...</div>
          ) : menuItems.length > 0 ? (
            menuItems.map((item) => (
              <div key={item.id} className="group">
                <button 
                  onClick={() => handleOpenDetail(item)}
                  className="block w-full text-left"
                >
                  <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-gray-100 mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-500">
                    {item.image_url ? (
                      <Image 
                        src={item.image_url} 
                        alt={item.name} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:scale-110 transition-transform duration-700 text-6xl">☕</div>
                    )}
                    <div className="absolute top-4 left-4 z-10">
                       <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-primary text-[10px] font-black uppercase tracking-widest rounded-full">{item.category}</span>
                    </div>
                  </div>
                </button>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{item.name}</h3>
                  <p className="text-gray-400 text-sm line-clamp-1">{item.description}</p>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xl font-black text-[#1a1a1a]">Rp {item.price.toLocaleString('id-ID')}</span>
                    <AddToCartButton item={item} addToCart={addToCart} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-gray-400">No items found in this category.</div>
          )}
        </div>
      </div>

      <MenuDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
        onAddToCart={addToCart}
      />
    </div>
  );
}

function AddToCartButton({ item, addToCart }: { item: any, addToCart: (item: any) => void }) {
  const [added, setAdded] = useState(false);

  const handleClick = () => {
    addToCart(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <button 
      onClick={handleClick}
      className={`h-11 w-11 rounded-full flex items-center justify-center transition-all duration-500 font-bold shadow-sm ${
        added 
        ? 'bg-primary text-white scale-110 shadow-primary/30 rotate-[360deg] animate-bounce-scale' 
        : 'bg-secondary/30 text-primary hover:bg-primary hover:text-white active:scale-95'
      }`}
    >
      {added ? <CheckCircle2 size={24} /> : <span className="text-xl">+</span>}
    </button>
  );
}
