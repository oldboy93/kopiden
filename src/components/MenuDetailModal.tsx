'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ShoppingBag, Star, Info, CheckCircle2, Sparkles, Clock } from 'lucide-react';

interface MenuDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onAddToCart: (item: any) => void;
}

export default function MenuDetailModal({ isOpen, onClose, item, onAddToCart }: MenuDetailModalProps) {
  const [added, setAdded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const handleAdd = () => {
    onAddToCart(item);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4 transition-all duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-500"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="bg-white w-full max-w-4xl h-full sm:h-auto sm:max-h-[85vh] sm:rounded-[3rem] relative z-10 shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-20 p-3 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 transition-colors md:hidden"
        >
          <X size={24} />
        </button>

        {/* Left: Image Section */}
        <div className="relative w-full md:w-1/2 h-[45vh] md:h-full bg-gray-100 overflow-hidden">
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt={item.name} 
              className="w-full h-full object-cover animate-in fade-in zoom-in duration-1000"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-20">☕</div>
          )}
          
          {/* Label Tag */}
          <div className="absolute top-8 left-8">
            <span className="px-4 py-2 bg-primary/90 backdrop-blur-sm text-white text-xs font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
              {item.category}
            </span>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -bottom-1 -left-1 w-24 h-24 bg-white rounded-tr-[3rem] hidden md:block"></div>
        </div>

        {/* Right: Content Section */}
        <div className="flex-grow p-8 md:p-12 md:max-w-1/2 overflow-y-auto no-scrollbar flex flex-col">
          {/* Desktop Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-10 right-10 p-2 text-gray-300 hover:text-primary transition-colors hidden md:block"
          >
            <X size={28} />
          </button>

          <div className="flex-grow">
            <div className="flex items-center gap-2 text-amber-500 mb-4 animate-in slide-in-from-left-4 duration-500">
              <Star size={18} className="fill-amber-500" />
              <span className="text-sm font-black tracking-tight uppercase">Top Selection</span>
              <Sparkles size={14} className="animate-pulse" />
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-[#1a1a1a] mb-4 leading-tight">
              {item.name}
            </h2>

            <div className="flex items-center gap-6 mb-8 text-gray-400">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                <span className="text-sm font-bold">{item.preparation_time || '5-10 m'}</span>
              </div>
              <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>
              <div className="flex items-center gap-2">
                <Info size={16} className="text-primary" />
                <span className="text-sm font-bold">{item.serving_note || 'Best Served Cold'}</span>
              </div>
            </div>

            <div className="space-y-6 mb-12">
              <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Our Story</h4>
                <p className="text-lg text-gray-600 leading-relaxed font-medium">
                  {item.description || "Setiap cangkir menyajikan harmoni rasa yang dikurasi khusus untuk pecinta kopi sejati. Dibuat dengan biji kopi pilihan dan kasih sayang."}
                </p>
              </div>
              
              <div className="p-6 bg-[#fafafa] rounded-3xl border border-gray-100 flex items-start gap-4">
                 <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary shrink-0">
                    <Sparkles size={20} />
                 </div>
                 <div>
                    <h5 className="font-bold text-[#1a1a1a] text-sm">{item.highlight_title || 'Signature Taste'}</h5>
                    <p className="text-xs text-gray-400 font-medium">{item.highlight_description || 'Unique blend that brings out the soul of every bean.'}</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-8 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Price per Cup</p>
              <p className="text-3xl font-black text-primary">
                Rp {item.price.toLocaleString('id-ID')}
              </p>
            </div>
            
            <button 
              onClick={handleAdd}
              disabled={added}
              className={`w-full sm:w-auto px-10 py-5 rounded-[2rem] font-extrabold text-lg flex items-center justify-center gap-3 transition-all duration-500 shadow-2xl scale-100 active:scale-95 ${
                added 
                ? 'bg-emerald-500 text-white shadow-emerald-500/30' 
                : 'bg-[#1a1a1a] text-white hover:bg-emerald-600 shadow-black/20'
              }`}
            >
              {added ? (
                <>
                  <CheckCircle2 size={24} />
                  Added to Bag
                </>
              ) : (
                <>
                  <ShoppingBag size={22} />
                  Add to Cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
