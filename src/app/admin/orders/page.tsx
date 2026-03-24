'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, X, Eye, Loader2, Banknote, MapPin, RefreshCw, Truck, Coffee, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<{type: 'error' | 'success' | 'info', text: string} | null>(null);
  const [toastMsg, setToastMsg] = useState<{title: string, desc: string} | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAutoConfirm() {
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const { data: oldOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('order_status', 'on_the_way')
        .lt('updated_at', twoDaysAgo);

      if (oldOrders && oldOrders.length > 0) {
        const ids = oldOrders.map(o => o.id);
        await supabase
          .from('orders')
          .update({ order_status: 'completed' })
          .in('id', ids);
        return true;
      }
      return false;
    }

    async function checkAuthAndFetch() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/admin/login');
        return;
      }

      const didAutoConfirm = await checkAutoConfirm();

      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id (full_name),
          order_items (
            quantity,
            menu:menu_id (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersData) {
        const formattedOrders = ordersData.map((order: any) => ({
          id: order.id.slice(0, 8).toUpperCase(),
          rawId: order.id,
          customer: order.profiles?.full_name || 'Anonymous',
          items: order.order_items?.map((item: any) => `${item.quantity}x ${item.menu?.name}`).join(', ') || 'No items',
          total: `Rp ${order.total_price.toLocaleString('id-ID')}`,
          status: order.order_status,
          paymentStatus: order.payment_status,
          date: new Date(order.created_at).toLocaleDateString('id-ID'),
          time: new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }));
        setOrders(formattedOrders);
      }
      setLoading(false);
    }

    async function fetchSingleOrder(id: string) {
      const { data: order } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id (full_name),
          order_items (
            quantity,
            menu:menu_id (name)
          )
        `)
        .eq('id', id)
        .single();

      if (order) {
        const formatted = {
          id: order.id.slice(0, 8).toUpperCase(),
          rawId: order.id,
          customer: order.profiles?.full_name || 'Anonymous',
          items: order.order_items?.map((item: any) => `${item.quantity}x ${item.menu?.name}`).join(', ') || 'No items',
          total: `Rp ${order.total_price.toLocaleString('id-ID')}`,
          status: order.order_status,
          paymentStatus: order.payment_status,
          date: new Date(order.created_at).toLocaleDateString('id-ID'),
          time: new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        };
        return formatted;
      }
      return null;
    }

    checkAuthAndFetch();

    // Setup Realtime Listener
    const channel = supabase
      .channel('orders_realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        const newOrder = payload.new;
        const oldOrder = payload.old;
        
        setOrders(prev => prev.map(o => {
          if (o.rawId === newOrder.id) {
            return {
              ...o,
              status: newOrder.order_status,
              paymentStatus: newOrder.payment_status
            };
          }
          return o;
        }));

        if (newOrder.payment_status === 'paid' && oldOrder.payment_status !== 'paid') {
          const idShort = newOrder.id.slice(0, 8).toUpperCase();
          setToastMsg({ title: 'Hore! Pembayaran Masuk 🎉', desc: `Pesanan #${idShort} telah lunas dibayar.` });
          setTimeout(() => setToastMsg(null), 5000);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, async (payload) => {
        const newOrderData = await fetchSingleOrder(payload.new.id);
        if (newOrderData) {
          setOrders(prev => [newOrderData, ...prev]);
        }
        setToastMsg({ title: 'Pesanan Baru! ☕', desc: 'Ada pesanan baru yang masuk ke sistem.' });
        setTimeout(() => setToastMsg(null), 5000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ order_status: status })
      .eq('id', orderId);

    if (!error) {
      setOrders(prev => prev.map(o => o.rawId === orderId ? { ...o, status } : o));
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: status })
      .eq('id', orderId);

    if (!error) {
      setOrders(prev => prev.map(o => o.rawId === orderId ? { ...o, paymentStatus: status } : o));
    } else {
       console.error('Failed to update payment status:', error);
    }
  };

  const handleSyncStatus = async (orderId: string) => {
    setSyncingId(orderId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/payment/status/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setOrders(prev => prev.map(o => o.rawId === orderId ? { ...o, paymentStatus: data.payment_status } : o));
        if (data.message) {
           setSyncMessage({ type: 'info', text: data.message });
        }
      } else {
        setSyncMessage({ type: 'error', text: data.error || 'Check Midtrans Sandbox Dashboard' });
      }
    } catch (err) {
      console.error(err);
      setSyncMessage({ type: 'error', text: 'Terjadi kesalahan jaringan saat sync.' });
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-grow p-4 sm:p-8 md:p-12 overflow-x-hidden">
        <h1 className="text-2xl sm:text-3xl font-black mb-8 md:mb-12">Live Orders</h1>
        
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
           {loading ? (
             <div className="flex justify-center py-20 text-emerald-500">
               <Loader2 className="animate-spin" size={48} />
             </div>
           ) : orders.map((order, i) => (
             <div key={i} className="bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 group hover:shadow-xl transition-all border border-gray-50 relative overflow-hidden">
                <div className="h-12 w-12 sm:h-16 sm:w-16 bg-emerald-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-500 font-black text-sm sm:text-base">
                   {order.id}
                </div>
                <div className="flex-grow w-full sm:w-auto">
                   <div className="flex items-center justify-between sm:justify-start gap-3 mb-1">
                     <h3 className="text-lg sm:text-xl font-bold truncate max-w-[150px] sm:max-w-none">{order.customer}</h3>
                     <span className="text-[10px] sm:text-xs text-gray-400 font-medium">• {order.time}</span>
                   </div>
                   <p className="text-gray-500 text-xs sm:text-sm font-medium truncate max-w-full">{order.items}</p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-1 px-0 sm:px-8 sm:border-x border-gray-50 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 mt-2 sm:mt-0">
                   <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black hidden sm:block">Status</p>
                   <div className="flex flex-row sm:flex-col gap-2 scale-90 sm:scale-100">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                       order.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                       order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                       order.status === 'brewing' ? 'bg-orange-100 text-orange-600' :
                       order.status === 'processing' ? 'bg-blue-100 text-blue-600' :
                       'bg-gray-100 text-gray-600'
                     }`}>
                       {order.status}
                     </span>
                     <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                       order.paymentStatus === 'paid' ? 'bg-emerald-500 text-white' :
                       order.paymentStatus === 'pending' ? 'bg-orange-100 text-orange-600' :
                       'bg-red-100 text-red-600'
                     }`}>
                       {order.paymentStatus}
                     </span>
                   </div>
                   <div className="flex-grow sm:hidden"></div>
                   <p className="text-xl font-black sm:hidden">{order.total}</p>
                </div>
                <div className="hidden sm:block text-right min-w-[120px]">
                   <p className="text-2xl font-black">{order.total}</p>
                </div>
                 <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleSyncStatus(order.rawId)}
                      disabled={syncingId === order.rawId}
                      className="flex-grow sm:flex-none h-11 w-full sm:w-12 bg-white border border-gray-100 text-gray-400 rounded-xl flex items-center justify-center hover:text-blue-500 hover:border-blue-100 transition-all disabled:opacity-50"
                      title="Sync Payment Status"
                    >
                      <RefreshCw size={18} className={`sm:w-5 sm:h-5 ${syncingId === order.rawId ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Brewing Action */}
                    <button 
                      disabled={(order.status !== 'pending' && order.status !== 'processing') || order.paymentStatus !== 'paid'}
                      onClick={() => handleUpdateStatus(order.rawId, 'brewing')}
                      className={`flex-grow sm:flex-none h-11 w-full sm:w-12 rounded-xl flex items-center justify-center transition-all ${
                        order.status === 'brewing' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-white border border-gray-100 text-gray-400 hover:text-orange-500 hover:border-orange-100'
                      }`}
                      title="Start Brewing"
                    >
                      <Coffee size={18} className="sm:w-5 sm:h-5" />
                    </button>

                    {/* Out for Delivery Action */}
                    <button 
                      disabled={order.status !== 'brewing' && order.status !== 'processing' && order.status !== 'pending'}
                      onClick={() => handleUpdateStatus(order.rawId, 'on_the_way')}
                      className={`flex-grow sm:flex-none h-11 w-full sm:w-12 rounded-xl flex items-center justify-center transition-all ${
                        order.status === 'on_the_way' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white border border-gray-100 text-gray-400 hover:text-blue-500 hover:border-blue-100'
                      }`}
                      title="Out for Delivery"
                    >
                      <Truck size={18} className="sm:w-5 sm:h-5" />
                    </button>

                    <button 
                      disabled={order.status === 'completed' || order.status === 'cancelled'}
                      onClick={() => handleUpdateStatus(order.rawId, 'completed')}
                      className="flex-grow sm:flex-none h-11 w-full sm:w-12 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center hover:scale-105 sm:hover:scale-110 transition-transform disabled:opacity-30 disabled:hover:scale-100"
                      title="Complete Order (Manual)"
                    >
                      <Check size={18} className="sm:w-5 sm:h-5" />
                    </button>
                    <button 
                      disabled={order.paymentStatus === 'paid'}
                      onClick={() => handleUpdatePaymentStatus(order.rawId, 'paid')}
                      className="flex-grow sm:flex-none h-11 w-full sm:w-12 bg-white border border-gray-100 text-orange-400 rounded-xl flex items-center justify-center hover:text-emerald-500 hover:border-emerald-100 transition-all disabled:opacity-30"
                      title="Mark as Paid"
                    >
                      <Banknote size={18} className="sm:w-5 sm:h-5" />
                    </button>
                    <button 
                      disabled={order.status === 'completed' || order.status === 'cancelled'}
                      onClick={() => handleUpdateStatus(order.rawId, 'cancelled')}
                      className="flex-grow sm:flex-none h-11 w-full sm:w-12 bg-white border border-gray-100 text-gray-400 rounded-xl flex items-center justify-center hover:text-red-500 hover:border-red-100 transition-all disabled:opacity-30"
                      title="Cancel Order"
                    >
                      <X size={18} className="sm:w-5 sm:h-5" />
                    </button>
                 </div>
             </div>
           ))}
        </div>
      </main>

      {/* Sync Message Modal */}
      {syncMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSyncMessage(null)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 relative z-10 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
            <button 
              onClick={() => setSyncMessage(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
            <div className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center mb-6 ${
              syncMessage.type === 'error' ? 'bg-red-50 text-red-500' : 
              syncMessage.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 
              'bg-blue-50 text-blue-500'
            }`}>
              {syncMessage.type === 'error' ? <AlertCircle size={32} /> : 
               syncMessage.type === 'success' ? <Check size={32} /> : 
               <Info size={32} />}
            </div>
            <h3 className="text-2xl font-black mb-2">
              {syncMessage.type === 'error' ? 'Sync Gagal' : 
               syncMessage.type === 'success' ? 'Sync Berhasil' : 
               'Informasi Sync'}
            </h3>
            <p className="text-gray-500 mb-8 leading-relaxed">
              {syncMessage.text}
            </p>
            <button 
              onClick={() => setSyncMessage(null)}
              className="w-full py-4 bg-gray-100 text-gray-600 rounded-full font-bold hover:bg-gray-200 transition-all active:scale-95"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-[200] max-w-sm animate-in slide-in-from-top-4 fade-in duration-500">
          <div className="bg-white rounded-2xl shadow-2xl border border-emerald-100 p-4 pl-5 flex items-start gap-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>
            <div className="flex-grow">
              <h4 className="font-black text-emerald-600 mb-1 flex items-center gap-2">
                <Check size={16} /> {toastMsg.title}
              </h4>
              <p className="text-gray-500 text-sm font-medium">{toastMsg.desc}</p>
            </div>
            <button 
              onClick={() => setToastMsg(null)}
              className="p-1 hover:bg-gray-100 rounded-full flex-shrink-0 transition-colors"
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
