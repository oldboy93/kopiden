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
      <div className="bg-white w-full max-w-2xl h-full sm:h-auto sm:max-h-[80vh] sm:rounded-[3rem] relative z-10 shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-20 p-3 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 transition-colors md:hidden"
        >
          <X size={24} />
        </button>

        {/* Left: Image Section */}
        <div className="relative w-full md:w-[35%] h-[25vh] md:h-auto bg-gray-100 overflow-hidden">
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt={item.name} 
              className="w-full h-full object-cover animate-in fade-in zoom-in duration-1000"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20">☕</div>
          )}
          
          {/* Label Tag */}
          <div className="absolute top-6 left-6">
            <span className="px-3 py-1.5 bg-primary/90 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
              {item.category}
            </span>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -bottom-1 -left-1 w-20 h-20 bg-white rounded-tr-[2.5rem] hidden md:block"></div>
        </div>

        {/* Right: Content Section */}
        <div className="flex-grow p-6 md:p-8 md:w-[65%] overflow-y-auto no-scrollbar flex flex-col">
          {/* Desktop Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-2 text-gray-300 hover:text-primary transition-colors hidden md:block"
          >
            <X size={24} />
          </button>

          <div className="flex-grow">
            <div className="flex items-center gap-2 text-amber-500 mb-3 animate-in slide-in-from-left-4 duration-500">
              <Star size={16} className="fill-amber-500" />
              <span className="text-xs font-black tracking-tight uppercase">Top Selection</span>
            </div>

            <h2 className="text-3xl md:text-3xl font-black text-[#1a1a1a] mb-3 leading-tight tracking-tight">
              {item.name}
            </h2>

            <div className="flex items-center gap-4 mb-6 text-gray-400">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-primary" />
                <span className="text-xs font-bold">{item.preparation_time || '5-10 m'}</span>
              </div>
              <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
              <div className="flex items-center gap-2">
                <Info size={14} className="text-primary" />
                <span className="text-xs font-bold">{item.serving_note || 'Best Served Cold'}</span>
              </div>
            </div>

            <div className="space-y-5 mb-8">
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Our Story</h4>
                <p className="text-base text-gray-600 leading-relaxed font-medium">
                  {item.description || "Setiap cangkir menyajikan harmoni rasa yang dikurasi khusus untuk pecinta kopi sejati."}
                </p>
              </div>
              
              <div className="p-4 bg-[#fafafa] rounded-[1.5rem] border border-gray-100 flex items-start gap-3">
                 <div className="h-8 w-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-primary shrink-0">
                    <Sparkles size={16} />
                 </div>
                 <div>
                    <h5 className="font-bold text-[#1a1a1a] text-xs leading-none mb-1">{item.highlight_title || 'Signature Taste'}</h5>
                    <p className="text-[10px] text-gray-400 font-medium leading-tight">{item.highlight_description || 'Unique blend that brings out the soul of every bean.'}</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-6 border-t border-gray-50 flex flex-row items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Price</p>
              <p className="text-2xl font-black text-primary">
                Rp {item.price.toLocaleString('id-ID')}
              </p>
            </div>
            
            <button 
              onClick={handleAdd}
              disabled={added}
              className={`px-8 py-4 rounded-[1.5rem] font-extrabold text-base flex items-center justify-center gap-2 transition-all duration-500 shadow-xl scale-100 active:scale-95 ${
                added 
                ? 'bg-emerald-500 text-white shadow-emerald-500/30' 
                : 'bg-[#1a1a1a] text-white hover:bg-emerald-600 shadow-black/20'
              }`}
            >
              {added ? (
                <>
                  <CheckCircle2 size={20} />
                  Done
                </>
              ) : (
                <>
                  <ShoppingBag size={20} />
                  Add
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
