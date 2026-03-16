'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Coffee, ShoppingBag, LogOut, Check, X, Eye, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row">
      {/* Sidebar - Same fixed sidebar as Dashboard */}
      <aside className="w-full md:w-64 bg-[#1a1a1a] text-white p-6 md:p-8 flex flex-row md:flex-col gap-6 md:gap-12 md:sticky md:top-0 md:h-screen overflow-x-auto whitespace-nowrap md:whitespace-normal no-scrollbar items-center md:items-start z-50">
        <div className="text-2xl font-black text-emerald-500 hidden md:block">Kopiden.</div>
        <nav className="flex flex-row md:flex-col gap-2 md:gap-4 flex-grow w-full">
          <Link href="/admin/dashboard" className="flex items-center gap-2 md:gap-4 px-4 py-3 md:p-4 text-gray-400 hover:text-white transition-colors flex-shrink-0">
            <LayoutDashboard size={20} /> <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link href="/admin/menu" className="flex items-center gap-2 md:gap-4 px-4 py-3 md:p-4 text-gray-400 hover:text-white transition-colors flex-shrink-0">
            <Coffee size={20} /> <span className="hidden sm:inline">Menu Management</span>
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-2 md:gap-4 px-4 py-3 md:p-4 bg-emerald-500 rounded-xl md:rounded-2xl font-bold flex-shrink-0">
            <ShoppingBag size={20} /> <span className="hidden sm:inline">Orders</span>
          </Link>
        </nav>
        <button className="flex items-center gap-4 p-4 text-red-400 hover:text-red-500 transition-colors">
          <LogOut size={20} /> Logout
        </button>
      </aside>

      <main className="flex-grow p-12">
        <h1 className="text-3xl font-black mb-12">Live Orders</h1>
        
        <div className="grid grid-cols-1 gap-6">
           {loading ? (
             <div className="flex justify-center py-20 text-emerald-500">
               <Loader2 className="animate-spin" size={48} />
             </div>
           ) : orders.map((order, i) => (
             <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm flex items-center gap-8 group hover:shadow-xl transition-all border border-gray-50">
                <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 font-black">
                   {order.id}
                </div>
                <div className="flex-grow">
                   <div className="flex items-center gap-3 mb-1">
                     <h3 className="text-xl font-bold">{order.customer}</h3>
                     <span className="text-xs text-gray-400 font-medium">• {order.time}</span>
                   </div>
                   <p className="text-gray-500 font-medium truncate max-w-sm">{order.items}</p>
                </div>
                <div className="text-center px-8 border-x border-gray-50">
                   <p className="text-xs text-gray-400 uppercase tracking-widest font-black mb-1">Status</p>
                   <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                     order.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                     order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                     order.status === 'brewing' ? 'bg-orange-100 text-orange-600' :
                     'bg-gray-100 text-gray-600'
                   }`}>
                     {order.status}
                   </span>
                </div>
                <div className="text-right">
                   <p className="text-2xl font-black">{order.total}</p>
                </div>
                <div className="flex items-center gap-3 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                     disabled={order.status === 'completed' || order.status === 'cancelled'}
                     onClick={() => handleUpdateStatus(order.rawId, 'completed')}
                     className="h-12 w-12 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-30 disabled:hover:scale-100"
                   >
                     <Check size={20} />
                   </button>
                   <button 
                     disabled={order.status === 'completed' || order.status === 'cancelled'}
                     onClick={() => handleUpdateStatus(order.rawId, 'cancelled')}
                     className="h-12 w-12 bg-white border border-gray-100 text-gray-400 rounded-xl flex items-center justify-center hover:text-red-500 hover:border-red-100 transition-all disabled:opacity-30"
                   >
                     <X size={20} />
                   </button>
                </div>
             </div>
           ))}
        </div>
      </main>
    </div>
  );
}
