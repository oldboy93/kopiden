'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { supabase } from '@/lib/supabase';
import AppHeader from '@/components/AppHeader';
import {
  Package,
  ChevronRight,
  Clock,
  Coffee,
  LogOut,
  Sparkles,
  ArrowRight,
  Star,
  ShoppingBag
} from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function getDashboardData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profileData);

      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price,
            menu:menu_id (name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (ordersData) setOrders(ordersData);

      setLoading(false);
    }
    getDashboardData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleRetryPayment = async (order: any) => {
    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          gross_amount: order.total_price,
          customer_details: {
            first_name: profile?.full_name || 'Customer',
            email: user?.email,
            address: 'Stored Address' // In a real app, you'd fetch this or ask again
          },
          items: order.order_items.map((item: any) => ({
            id: item.menu_id,
            price: item.price,
            quantity: item.quantity,
            name: item.menu?.name
          }))
        })
      });

      const { token, order_id: midtransOrderId, error } = await response.json();

      if (error || !token) {
        throw new Error(error || 'No payment token received');
      }

      // Save token and actual midtrans order id for future reuse
      await supabase
        .from('orders')
        .update({ 
          midtrans_token: token,
          midtrans_order_id: midtransOrderId 
        })
        .eq('id', order.id);

      window.snap.pay(token, {
        onSuccess: async () => {
          // Localhost fallback: Update directly in Supabase since Midtrans webhook can't reach localhost
          await supabase
            .from('orders')
            .update({ payment_status: 'paid', order_status: 'processing' })
            .eq('id', order.id);

          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, payment_status: 'paid', order_status: 'processing' } : o));
          router.refresh();
        },
        onPending: () => {
          router.refresh();
        }
      });
    } catch (error) {
      console.error('Retry payment error:', error);
      alert('Failed to initiate payment. Please try again.');
    }
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Coffee Lover';
  const activeOrders = orders.filter(o => o.order_status === 'pending' || o.order_status === 'processing');
  const totalSpent = orders.reduce((acc, o) => acc + (o.total_price || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Brewing your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Script 
        src="https://app.sandbox.midtrans.com/snap/snap.js" 
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
      />
      <AppHeader title="My Account" />

      <div className="container mx-auto px-4 md:px-8 max-w-3xl py-6 md:py-10 pb-28 md:pb-16">

        {/* Hero Welcome Banner */}
        <div className="relative bg-primary rounded-3xl p-6 md:p-8 mb-6 overflow-hidden">
          <Coffee className="absolute -right-6 -bottom-6 w-36 h-36 text-white/10 rotate-12" />
          <Sparkles className="absolute top-4 right-16 w-5 h-5 text-white/30" />
          <div className="relative z-10">
            <p className="text-white/70 text-sm font-medium mb-1">Good day,</p>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-4">
              {firstName} ☕
            </h1>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 bg-white text-primary font-black px-5 py-2.5 rounded-full text-sm hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-black/20"
            >
              Order Now <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-50">
            <div className="text-2xl font-black text-[#1a1a1a]">{orders.length}</div>
            <div className="text-xs text-gray-400 font-bold mt-0.5">Orders</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-50">
            <div className="text-2xl font-black text-amber-500">{activeOrders.length}</div>
            <div className="text-xs text-gray-400 font-bold mt-0.5">Active</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-50">
            <div className="text-lg font-black text-primary">
              {totalSpent > 0 ? `${(totalSpent / 1000).toFixed(0)}k` : '0'}
            </div>
            <div className="text-xs text-gray-400 font-bold mt-0.5">Spent (Rp)</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link
            href="/menu"
            className="bg-white rounded-2xl p-5 flex items-center gap-4 border border-gray-50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group"
          >
            <div className="h-11 w-11 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
              <Coffee size={22} />
            </div>
            <div>
              <div className="font-black text-[#1a1a1a] text-sm">Browse Menu</div>
              <div className="text-xs text-gray-400">Order your brew</div>
            </div>
          </Link>
          <Link
            href="/cart"
            className="bg-white rounded-2xl p-5 flex items-center gap-4 border border-gray-50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group"
          >
            <div className="h-11 w-11 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors text-amber-500">
              <ShoppingBag size={22} />
            </div>
            <div>
              <div className="font-black text-[#1a1a1a] text-sm">My Cart</div>
              <div className="text-xs text-gray-400">View items</div>
            </div>
          </Link>
        </div>

        {/* Order History */}
        <div className="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden mb-6">
          <div className="flex justify-between items-center px-5 md:px-6 py-5 border-b border-gray-50">
            <h2 className="font-black text-[#1a1a1a] flex items-center gap-2">
              <Package size={18} className="text-primary" />
              Recent Orders
            </h2>
            {orders.length > 0 && (
              <Link href="/menu" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                New Order <ChevronRight size={14} />
              </Link>
            )}
          </div>

          {orders.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="px-5 md:px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Coffee size={18} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-black text-[#1a1a1a] text-sm truncate">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <Clock size={11} />
                        {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        order.order_status === 'completed' ? 'bg-green-100 text-green-600' :
                        order.order_status === 'processing' ? 'bg-blue-100 text-blue-600' :
                        order.payment_status === 'pending' ? 'bg-amber-100 text-amber-600' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {order.order_status === 'pending' && order.payment_status === 'pending' ? 'Unpaid' : order.order_status}
                      </span>
                      <div className="text-right">
                        <div className="font-black text-sm text-[#1a1a1a]">Rp {(order.total_price || 0).toLocaleString('id-ID')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/order/tracking/${order.id}`}
                        className="text-[10px] font-black uppercase text-gray-400 hover:text-primary transition-colors px-2 py-1"
                      >
                        Track Order
                      </Link>
                      {order.payment_status === 'pending' && order.order_status === 'pending' && (
                        <button
                          onClick={() => handleRetryPayment(order)}
                          className="bg-primary text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                          Bayar Sekarang
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 flex flex-col items-center gap-4 text-center px-6">
              <div className="text-6xl">☕</div>
              <div>
                <div className="font-black text-lg text-[#1a1a1a]">No orders yet</div>
                <p className="text-gray-400 text-sm mt-1">Your first great coffee is just a tap away.</p>
              </div>
              <Link
                href="/menu"
                className="mt-2 px-8 py-3 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform text-sm inline-flex items-center gap-2"
              >
                Start Ordering <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>

        {/* Account Info / Sign Out */}
        <div className="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
          <div className="px-5 md:px-6 py-5 border-b border-gray-50">
            <h2 className="font-black text-[#1a1a1a] flex items-center gap-2">
              <Star size={18} className="text-amber-400" />
              Account
            </h2>
          </div>
          <div className="px-5 md:px-6 py-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-lg text-primary">
                {firstName[0].toUpperCase()}
              </div>
              <div>
                <div className="font-black text-[#1a1a1a]">{profile?.full_name || 'Coffee Lover'}</div>
                <div className="text-xs text-gray-400">{user?.email}</div>
              </div>
            </div>
          </div>
          <div className="px-5 md:px-6 pb-5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border-2 border-red-100 text-red-500 font-bold text-sm hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
