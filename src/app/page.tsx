'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import AppHeader from '@/components/AppHeader';
import MenuDetailModal from '@/components/MenuDetailModal';
import { useCart } from '@/context/CartContext';

export default function Home() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchFavorites() {
      const { data } = await supabase.from('menu').select('*').limit(4);
      if (data) setFavorites(data);
    }
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    fetchFavorites();
    checkUser();
  }, []);

  const handleOpenDetail = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-white">
      <AppHeader />

      {/* Hero Section */}
      <section className="relative min-h-[60vh] md:h-[80vh] flex items-center overflow-hidden py-10 md:py-0">
        <div className="container mx-auto px-5 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center relative z-10">
          <div className="space-y-6 md:space-y-8 text-center md:text-left">
            <h1 className="text-5xl md:text-7xl font-extrabold text-[#1a1a1a] leading-[1.1]">
              Brewing <span className="text-primary italic">Perfection</span> <br /> 
              in Every Cup.
            </h1>
            <p className="text-lg md:text-xl text-gray-500 max-w-md mx-auto md:mx-0 leading-relaxed">
              Experience the finest selection of coffee beans, roasted to perfection and served with passion at Kopiden by UAY.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link href="/menu" className="px-8 py-4 bg-primary text-white rounded-full text-lg font-bold hover:scale-105 transition-transform shadow-xl shadow-primary/30">
                Order Now
              </Link>
              <Link href="/our-story" className="px-8 py-4 border-2 border-primary text-primary rounded-full text-lg font-bold hover:bg-primary/5 transition-colors">
                Our Story
              </Link>
            </div>
          </div>
          <div className="relative h-[400px] md:h-[600px] w-full flex items-center justify-center">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-secondary/50 rounded-full blur-3xl -z-10 animate-pulse"></div>
             <div className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px] hover:rotate-2 transition-transform duration-700">
               <Image 
                src="/images/aren_latte.png" 
                alt="Signature Coffee" 
                fill 
                className="object-contain drop-shadow-[0_35px_35px_rgba(2,87,38,0.4)]"
               />
             </div>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-24 bg-[#fcfcfc]">
        <div className="container mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2 md:mb-4">Our Favorites</h2>
              <p className="text-gray-500">Hand-picked selections from our master baristas.</p>
            </div>
            <Link href="/menu" className="text-primary font-bold hover:underline underline-offset-4 decoration-2">View Full Menu →</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {favorites.length > 0 ? favorites.map((item) => (
              <div key={item.id} className="group bg-white p-4 rounded-3xl shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-gray-100">
                <button 
                  onClick={() => handleOpenDetail(item)}
                  className="block w-full text-left"
                >
                  <div className="relative h-64 w-full rounded-2xl bg-gray-50 mb-6 overflow-hidden">
                     {item.image_url ? (
                       <Image 
                        src={item.image_url} 
                        alt={item.name} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-700" 
                       />
                     ) : (
                       <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:scale-110 transition-transform duration-700 text-4xl">☕</div>
                     )}
                  </div>
                </button>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{item.name}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-1">{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-black text-primary">Rp {item.price.toLocaleString('id-ID')}</span>
                </div>
              </div>
            )) : (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-gray-100 h-80 rounded-3xl"></div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Menu Detail Modal */}
      <MenuDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
        onAddToCart={addToCart}
      />
    </main>
  );
}
