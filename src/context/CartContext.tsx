'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  image_url?: string;
  size?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: any) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  setTableNumber: (table: string | null) => void;
  totalItems: number;
  subtotal: number;
  tableNumber: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState<string | null>(null);

  // Load cart and table number from localStorage on mount
  useEffect(() => {
    async function loadInitialData() {
      // 1. Load cart
      const savedCart = localStorage.getItem('kopiden_cart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          console.error('Failed to parse local cart', e);
        }
      }

      // 2. Load table number
      const savedTable = localStorage.getItem('kopiden_table');
      if (savedTable) {
        setTableNumber(savedTable);
      }

      // 2. Sync from Supabase if logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('cart_draft')
          .eq('id', user.id)
          .single();
        
        if (profile?.cart_draft && Array.isArray(profile.cart_draft) && profile.cart_draft.length > 0) {
          setCart(profile.cart_draft);
          localStorage.setItem('kopiden_cart', JSON.stringify(profile.cart_draft));
        }
      }
    }
    
    loadInitialData();
  }, []);

  // Save cart and table number to localStorage on change
  useEffect(() => {
    localStorage.setItem('kopiden_cart', JSON.stringify(cart));
    if (tableNumber) {
      localStorage.setItem('kopiden_table', tableNumber);
    } else {
      localStorage.removeItem('kopiden_table');
    }
    
    const syncToDB = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ cart_draft: cart })
          .eq('id', user.id);
      }
    };

    // Debounce sync slightly to avoid hitting API limit on rapid quantity changes
    const timer = setTimeout(syncToDB, 1000);
    return () => clearTimeout(timer);
  }, [cart]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      setTableNumber,
      totalItems, 
      subtotal,
      tableNumber
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
