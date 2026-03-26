'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import AppHeader from '@/components/AppHeader';
import MenuDetailModal from '@/components/MenuDetailModal';

function MenuContent() {
  const { addToCart, setTableNumber } = useCart();
  const searchParams = useSearchParams();
  const [categories] = useState(['All', 'Coffee', 'Non-Coffee', 'Snacks']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    fetchMenu();
  }, [activeCategory]);

  useEffect(() => {
    const table = searchParams.get('table');
    if (table) {
      setTableNumber(table);
    }
  }, [searchParams, setTableNumber]);

  const handleOpenDetail = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <AppHeader title="Menu" />

      <div className="container mx-auto px-5 md:px-8 py-8 md:py-12 pb-24">
        <header className="mb-8 md:mb-12">
          <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest mb-3">
             <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
             Kopiden Signature
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#1a1a1a] mb-2">Brewing Moments</h1>
          <p className="text-gray-400 font-medium">Temukan kopi terbaik untuk harimu.</p>
        </header>

        {/* Categories */}
        <div className="flex overflow-x-auto pb-6 gap-3 no-scrollbar -mx-5 px-5 md:mx-0 md:px-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-4 rounded-2xl whitespace-nowrap font-black uppercase tracking-widest text-xs transition-all ${
                activeCategory === cat 
                  ? 'bg-[#1a1a1a] text-white shadow-2xl shadow-black/20 scale-105' 
                  : 'bg-white text-gray-400 hover:text-gray-600 border border-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 mt-4">
          {loading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-[2rem] aspect-[4/5]" />
            ))
          ) : menuItems.length > 0 ? (
            menuItems.map(item => (
              <div 
                key={item.id} 
                className="bg-white rounded-[2rem] p-4 group hover:shadow-2xl transition-all cursor-pointer border border-gray-50 flex flex-col h-full"
                onClick={() => handleOpenDetail(item)}
              >
                <div className="relative aspect-square rounded-[1.5rem] overflow-hidden mb-5 bg-gray-50">
                  {item.image_url ? (
                    <Image 
                      src={item.image_url} 
                      alt={item.name} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200 uppercase font-black tracking-widest text-[10px]">No Image</div>
                  )}
                </div>
                <div className="flex-grow">
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-1 opacity-70 italic">{item.category}</div>
                  <h3 className="font-bold text-lg text-[#1a1a1a] mb-1 group-hover:text-primary transition-colors">{item.name}</h3>
                  <div className="text-gray-400 text-xs font-medium line-clamp-2 leading-relaxed h-8 mb-4">
                    {item.description || "The finest roast in the neighborhood."}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                   <div className="font-black text-lg">Rp {item.price.toLocaleString('id-ID')}</div>
                   <AddToCartButton item={item} addToCart={addToCart} />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-gray-400">
              <p className="font-bold uppercase tracking-widest text-xs">No items found.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && selectedItem && (
        <MenuDetailModal
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddToCart={(itemWithOptions) => {
            addToCart(itemWithOptions);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function AddToCartButton({ item, addToCart }: { item: any, addToCart: (item: any) => void }) {
  const [added, setAdded] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Brewing Menu...</p>
        </div>
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}
