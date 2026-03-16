'use client';

import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import AppHeader from '@/components/AppHeader';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, subtotal } = useCart();
  
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      <AppHeader backHref="/menu" backLabel="Back to Menu" title="My Cart" />

      <div className="container mx-auto px-8 py-12 max-w-4xl">
        {cart.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              {cart.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-[2rem] shadow-sm flex gap-6 items-center border border-gray-50 group hover:shadow-md transition-all">
                  <div className="h-24 w-24 bg-gray-100 rounded-2xl flex-shrink-0 relative overflow-hidden">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20 text-primary">☕</div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <p className="text-gray-400 text-sm mb-4 capitalize">{item.category}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-gray-50 rounded-full px-2 py-1 border border-gray-100">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 hover:text-primary transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 hover:text-primary transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-300 hover:text-red-500 transition-colors ml-auto"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-lg">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 sticky top-32">
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
    </div>
  );
}
