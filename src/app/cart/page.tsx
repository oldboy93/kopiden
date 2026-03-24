'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, ArrowRight, AlertTriangle, X } from 'lucide-react';
import AppHeader from '@/components/AppHeader';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, subtotal } = useCart();
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const [deleteSource, setDeleteSource] = useState<'minus' | 'trash' | null>(null);
  
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleMinus = (item: any) => {
    if (item.quantity === 1) {
      setConfirmDelete(item);
      setDeleteSource('minus');
    } else {
      updateQuantity(item.id, -1);
    }
  };

  const handleTrash = (item: any) => {
    setConfirmDelete(item);
    setDeleteSource('trash');
  };

  const confirmRemove = () => {
    if (confirmDelete) {
      removeFromCart(confirmDelete.id);
      setConfirmDelete(null);
      setDeleteSource(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      <AppHeader backHref="/menu" backLabel="Back to Menu" title="My Cart" />

      <div className="container mx-auto px-5 md:px-8 py-8 md:py-12 max-w-4xl">
        {cart.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
            <div className="lg:col-span-2 space-y-6">
              {cart.map((item) => (
                <div key={item.id} className="bg-white p-4 md:p-6 rounded-[2rem] shadow-sm flex gap-4 md:gap-6 items-center border border-gray-50 group hover:shadow-md transition-all">
                  <div className="h-20 w-20 md:h-24 md:w-24 bg-gray-100 rounded-2xl flex-shrink-0 relative overflow-hidden">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20 text-primary">☕</div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-bold text-base md:text-lg truncate">{item.name}</h3>
                    <p className="text-gray-400 text-xs md:text-sm mb-3 md:mb-4 capitalize">{item.category}</p>
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="flex items-center bg-gray-50 rounded-full px-2 py-1 border border-gray-100">
                        <button 
                          onClick={() => handleMinus(item)}
                          className="p-1 hover:text-primary transition-colors"
                        >
                          <Minus size={14} className="md:w-4 md:h-4" />
                        </button>
                        <span className="w-6 md:w-8 text-center font-bold text-sm md:text-base">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 hover:text-primary transition-colors"
                        >
                          <Plus size={14} className="md:w-4 md:h-4" />
                        </button>
                      </div>
                      <button 
                        onClick={() => handleTrash(item)}
                        className="text-gray-300 hover:text-red-500 transition-colors ml-auto p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-base md:text-lg whitespace-nowrap">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-50 sticky top-32">
                <h2 className="text-2xl font-bold mb-6">Summary</h2>
                <div className="space-y-4 mb-8 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-bold text-[#1a1a1a]">Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Tax (10%)</span>
                    <span className="font-bold text-[#1a1a1a]">Rp {tax.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="h-px bg-gray-100 my-4"></div>
                  <div className="flex justify-between font-black text-xl">
                    <span>Total</span>
                    <span className="text-primary">Rp {total.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <Link href="/checkout" className="w-full bg-primary text-white py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20">
                  Checkout Now <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-8xl mb-6 opacity-20">🛒</div>
            <p className="text-gray-400 mb-8 max-w-xs mx-auto">Your cart is as empty as a morning without coffee.</p>
            <Link href="/menu" className="px-8 py-4 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/20 inline-block hover:scale-105 transition-all">
              Browse Menu
            </Link>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 relative z-10 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
            <button 
              onClick={() => setConfirmDelete(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
            <div className="h-16 w-16 bg-red-50 rounded-[1.5rem] flex items-center justify-center mb-6">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h3 className="text-2xl font-black mb-2">Hapus dari Keranjang?</h3>
            <p className="text-gray-500 mb-8">
              Apakah Anda yakin ingin menghapus <span className="font-bold text-gray-900">{confirmDelete.name}</span>? 
              {deleteSource === 'minus' ? ' Pesanan tidak bisa dikurangi di bawah 1 porsi.' : ''}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="py-4 bg-gray-100 text-gray-600 rounded-full font-bold hover:bg-gray-200 transition-all active:scale-95"
              >
                Batal
              </button>
              <button 
                onClick={confirmRemove}
                className="py-4 bg-red-500 text-white rounded-full font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-95"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
