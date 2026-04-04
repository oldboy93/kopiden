'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Plus, Minus, Trash2, Loader2, Coffee, Search,
  CheckCircle2, Monitor, Clock, X, ChevronRight, Banknote, QrCode, Timer
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Script from 'next/script';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  description?: string;
  is_available: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
}

const CATEGORIES = ['All', 'Coffee', 'Non-Coffee', 'Snacks'];

const TAX_RATE = 0.1;

export default function CashierPOS() {
  const router = useRouter();

  // Auth
  const [cashierName, setCashierName] = useState('Kasir');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Menu
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Order details
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'midtrans'>('cash');

  // UI State
  const [processing, setProcessing] = useState(false);
  const [successOrder, setSuccessOrder] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [midtransToken, setMidtransToken] = useState<string | null>(null);
  const [snapLoaded, setSnapLoaded] = useState(false);

  // Real-time clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auth check
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/admin/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role === 'customer') {
        router.push('/menu');
        return;
      }
      if (profile.role === 'barista') {
        router.push('/admin/orders');
        return;
      }

      setUserRole(profile.role);
      setCashierName(profile.full_name || 'Kasir');
      setAuthLoading(false);
    }
    checkAuth();
  }, [router]);

  // Fetch menu
  const fetchMenu = useCallback(async () => {
    setMenuLoading(true);
    let query = supabase.from('menu').select('*');
    if (activeCategory !== 'All') query = query.eq('category', activeCategory);
    const { data } = await query;
    if (data) setMenuItems(data);
    setMenuLoading(false);
  }, [activeCategory]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  // Filtered menu
  const filteredMenu = menuItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  // Cart actions
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev
      .map(c => c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)
      .filter(c => c.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.id !== id));

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setTableNumber('');
    setOrderType('dine-in');
    setPaymentMethod('cash');
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const getTableValue = () => {
    if (orderType === 'takeaway') return 'Takeaway';
    return tableNumber || 'Kasir'; // Default to "Kasir" if no table number
  };

  // Process order
  const processOrder = async () => {
    if (cart.length === 0) return;
    if (!customerName.trim()) {
      alert('Mohon isi nama pelanggan terlebih dahulu.');
      return;
    }
    if (orderType === 'dine-in' && !tableNumber.trim()) {
      alert('Mohon masukkan nomor meja.');
      return;
    }

    setProcessing(true);

    try {
      // 1. Create the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name_guest: customerName,
          table_number: getTableValue(),
          order_status: 'pending',
          payment_status: paymentMethod === 'cash' ? 'paid' : 'pending',
          payment_method: paymentMethod === 'cash' ? 'cashier' : 'midtrans',
          total_price: total,
        })
        .select()
        .single();

      if (orderError || !orderData) throw new Error(orderError?.message || 'Gagal membuat order');

      // 2. Insert order items
      const orderItemsPayload = cart.map(item => ({
        order_id: orderData.id,
        menu_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload);
      if (itemsError) throw new Error(itemsError.message);

      // 3. Handle payment method
      if (paymentMethod === 'cash') {
        // Cash: immediately mark as processing since it's paid
        await supabase
          .from('orders')
          .update({ order_status: 'processing' })
          .eq('id', orderData.id);

        const shortId = orderData.id.slice(0, 8).toUpperCase();
        setSuccessOrder(shortId);
        clearCart();
        setTimeout(() => setSuccessOrder(null), 4000);
      } else {
        // Midtrans: fetch token then open Snap
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/payment/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            order_id: orderData.id,
            gross_amount: total,
            customer_details: { first_name: customerName },
          }),
        });

        const paymentData = await res.json();
        if (paymentData.token) {
          setMidtransToken(paymentData.token);
          (window as any).snap.pay(paymentData.token, {
            onSuccess: () => {
              const shortId = orderData.id.slice(0, 8).toUpperCase();
              setSuccessOrder(shortId);
              clearCart();
              setTimeout(() => setSuccessOrder(null), 4000);
              setMidtransToken(null);
            },
            onPending: () => {
              clearCart();
              setMidtransToken(null);
            },
            onError: () => {
              alert('Pembayaran gagal. Silakan coba lagi atau pilih metode tunai.');
              setMidtransToken(null);
            },
            onClose: () => setMidtransToken(null),
          });
        }
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <>
      <Script
        src={`https://app.sandbox.midtrans.com/snap/snap.js`}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        onLoad={() => setSnapLoaded(true)}
      />

      <div className="h-screen bg-[#f4f4f5] flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <header className="bg-[#1a1a1a] text-white flex items-center justify-between px-6 py-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Monitor size={16} />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight">Kopiden</span>
              <span className="text-emerald-400 font-black text-lg"> · Kasir POS</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Coffee size={14} className="text-emerald-500" />
              <span className="font-medium">{cashierName}</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-white font-bold">
              <Clock size={14} className="text-emerald-500" />
              {currentTime}
            </div>
            <button
              onClick={() => router.push('/admin/orders')}
              className="text-gray-500 hover:text-white transition-colors flex items-center gap-1 text-xs"
            >
              Dashboard <ChevronRight size={14} />
            </button>
          </div>
        </header>

        {/* ── Main split-screen body ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ──────── LEFT PANEL: Menu Catalog ──────── */}
          <div className="flex flex-col w-[60%] border-r border-gray-200 overflow-hidden">

            {/* Search + Category Filter */}
            <div className="bg-white px-5 py-3 border-b border-gray-100 flex-shrink-0 space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari menu..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-gray-100"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full whitespace-nowrap font-bold text-xs transition-all ${activeCategory === cat
                      ? 'bg-[#1a1a1a] text-white shadow-md'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {menuLoading ? (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                  {Array(6).fill(0).map((_, i) => (
                    <div key={i} className="animate-pulse bg-white rounded-2xl h-40" />
                  ))}
                </div>
              ) : filteredMenu.length > 0 ? (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredMenu.map(item => {
                    const inCart = cart.find(c => c.id === item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => addToCart(item)}
                        className={`relative bg-white rounded-2xl p-3 text-left hover:shadow-lg transition-all active:scale-[0.98] border ${inCart ? 'border-emerald-400 shadow-md shadow-emerald-500/10' : 'border-transparent'}`}
                      >
                        {/* Image */}
                        <div className="relative h-28 w-full rounded-xl overflow-hidden bg-gray-100 mb-3">
                          {item.image_url ? (
                            <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-3xl">☕</div>
                          )}
                          {/* Badge quantity in cart */}
                          {inCart && (
                            <div className="absolute top-2 right-2 h-6 w-6 bg-emerald-500 text-white text-xs font-black rounded-full flex items-center justify-center shadow-md">
                              {inCart.quantity}
                            </div>
                          )}
                        </div>
                        <p className="font-bold text-sm text-[#1a1a1a] leading-tight truncate">{item.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-emerald-600 font-black text-sm">Rp {item.price.toLocaleString('id-ID')}</p>
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors ${inCart ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            {inCart ? <CheckCircle2 size={14} /> : <Plus size={14} />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                  <Coffee size={40} className="opacity-20" />
                  <p className="font-bold text-sm uppercase tracking-widest">Tidak ada menu ditemukan</p>
                </div>
              )}
            </div>
          </div>

          {/* ──────── RIGHT PANEL: Order Panel ──────── */}
          <div className="flex flex-col w-[40%] bg-white overflow-hidden">

            {/* Order Panel Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="font-black text-lg text-[#1a1a1a]">Pesanan Baru</h2>
                <p className="text-gray-400 text-xs font-medium">{cart.length > 0 ? `${cart.reduce((s, c) => s + c.quantity, 0)} item` : 'Belum ada item'}</p>
              </div>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3 py-12">
                  <div className="text-5xl opacity-30">🛒</div>
                  <p className="text-sm font-bold text-gray-400">Ketuk menu untuk menambah</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 group">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{item.name}</p>
                      <p className="text-emerald-600 text-xs font-bold">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => updateQty(item.id, -1)} className="h-7 w-7 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center font-black text-sm">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="h-7 w-7 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-emerald-600 transition-colors">
                        <Plus size={12} />
                      </button>
                      <button onClick={() => removeFromCart(item.id)} className="h-7 w-7 ml-1 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Order Details & Payment */}
            <div className="border-t border-gray-100 px-5 py-4 flex-shrink-0 space-y-4">
              {/* Customer Name */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Nama Pelanggan *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Tulis nama..."
                  className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-gray-100 font-medium"
                />
              </div>

              {/* Order Type + Table */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Tipe</label>
                  <div className="flex gap-1.5">
                    {(['dine-in', 'takeaway'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setOrderType(type)}
                        className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${orderType === type ? 'bg-[#1a1a1a] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        {type === 'dine-in' ? '🪑 Meja' : '📦 Bawa'}
                      </button>
                    ))}
                  </div>
                </div>
                {orderType === 'dine-in' && (
                  <div className="w-24">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">No. Meja *</label>
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={e => setTableNumber(e.target.value)}
                      placeholder="Meja..."
                      className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-gray-100 font-bold text-center"
                    />
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Pembayaran</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${paymentMethod === 'cash' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    <Banknote size={14} /> TUNAI
                  </button>
                  <button
                    onClick={() => setPaymentMethod('midtrans')}
                    disabled={!snapLoaded}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 ${paymentMethod === 'midtrans' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    <QrCode size={14} /> QRIS / E-WALLET
                  </button>
                </div>
              </div>

              {/* Price breakdown */}
              {cart.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-bold">Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Pajak (10%)</span>
                    <span className="font-bold">Rp {tax.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div className="flex justify-between items-center">
                    <span className="font-black text-sm">TOTAL</span>
                    <span className="font-black text-xl text-emerald-600">Rp {total.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}

              {/* Process Button */}
              <button
                onClick={processOrder}
                disabled={cart.length === 0 || processing}
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-base shadow-xl shadow-emerald-500/30 hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <><Loader2 size={18} className="animate-spin" /> Memproses...</>
                ) : (
                  <><CheckCircle2 size={18} /> PROSES PESANAN</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Success Toast ── */}
      {successOrder && (
        <div className="fixed top-6 right-6 z-[200] bg-[#1a1a1a] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="h-10 w-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="font-black text-sm">Pesanan Berhasil!</p>
            <p className="text-gray-400 text-xs">Order <span className="text-emerald-400 font-bold">#{successOrder}</span> masuk ke antrian</p>
          </div>
        </div>
      )}
    </>
  );
}
