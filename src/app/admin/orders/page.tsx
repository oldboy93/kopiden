'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, X, Eye, Loader2, Banknote } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuthAndFetch() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/admin/login');
        return;
      }
      fetchOrders();
    }
    checkAuthAndFetch();
  }, [router]);

  async function fetchOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        total_price,
        order_status,
        payment_status,
        created_at,
        profiles:user_id (full_name),
        order_items (
          quantity,
          menu:menu_id (name)
        )
      `)
      .order('created_at', { ascending: false });

    if (data) {
      const formatted = data.map((o: any) => ({
        rawId: o.id,
        id: `#${o.id.split('-')[0].toUpperCase()}`,
        customer: o.profiles?.full_name || 'Unknown',
        time: new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        items: o.order_items?.map((item: any) => `${item.quantity}x ${item.menu?.name}`).join(', ') || 'No items',
        status: o.order_status,
        paymentStatus: o.payment_status,
        total: `Rp ${o.total_price.toLocaleString('id-ID')}`
      }));
      setOrders(formatted);
    }
    setLoading(false);
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ order_status: newStatus })
      .eq('id', id);
    
    if (!error) {
       setOrders(prev => prev.map(o => o.rawId === id ? { ...o, status: newStatus } : o));
    } else {
       console.error('Failed to update status:', error);
    }
  };

  const handleUpdatePaymentStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: newStatus })
      .eq('id', id);
    
    if (!error) {
       setOrders(prev => prev.map(o => o.rawId === id ? { ...o, paymentStatus: newStatus } : o));
    } else {
       console.error('Failed to update payment status:', error);
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
                     disabled={order.status === 'completed' || order.status === 'cancelled'}
                     onClick={() => handleUpdateStatus(order.rawId, 'completed')}
                     className="flex-grow sm:flex-none h-11 w-full sm:w-12 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center hover:scale-105 sm:hover:scale-110 transition-transform disabled:opacity-30 disabled:hover:scale-100"
                     title="Complete Order"
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
    </div>
  );
}
