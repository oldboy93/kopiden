'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Coffee, ShoppingBag, Settings, LogOut, TrendingUp, Users, DollarSign, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeCustomers: 0,
    pendingOrders: 0
  });
  const router = useRouter();

  const stats = [
    {
      label: 'Total Revenue',
      value: `Rp ${Number(statsData.totalRevenue).toLocaleString('id-ID')}`,
      icon: <DollarSign />,
      color: 'bg-emerald-500'
    },
    {
      label: 'Total Orders',
      value: statsData.totalOrders.toLocaleString('id-ID'),
      icon: <ShoppingBag />,
      color: 'bg-blue-500'
    },
    {
      label: 'Active Customers',
      value: statsData.activeCustomers.toLocaleString('id-ID'),
      icon: <Users />,
      color: 'bg-purple-500'
    },
    {
      label: 'Pending Orders',
      value: statsData.pendingOrders.toLocaleString('id-ID'),
      icon: <TrendingUp />,
      color: 'bg-orange-500'
    },
  ];

  useEffect(() => {
    async function checkAuthAndFetch() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/admin/login');
        return;
      }

      // Fetch stats and orders in parallel
      await Promise.all([
        fetchStats(),
        fetchOrders()
      ]);
      setLoading(false);
    }
    checkAuthAndFetch();
  }, [router]);

  async function fetchStats() {
    try {
      // Get All Orders Count
      const { count: totalOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Get Total Revenue (where payment_status is 'paid')
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_price')
        .eq('payment_status', 'paid');

      const totalRevenueSum = revenueData?.reduce((acc, curr) => acc + Number(curr.total_price), 0) || 0;

      // Get Active Customers (Unique user_id in orders)
      const { data: customerData } = await supabase
        .from('orders')
        .select('user_id');

      const uniqueCustomers = new Set(customerData?.map(o => o.user_id)).size;

      // Get Pending Orders Count
      const { count: pendingCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('order_status', 'pending');

      setStatsData({
        totalRevenue: totalRevenueSum,
        totalOrders: totalOrdersCount || 0,
        activeCustomers: uniqueCustomers || 0,
        pendingOrders: pendingCount || 0
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  }

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
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      const formatted = data.map((o: any) => ({
        id: `#${o.id.split('-')[0].toUpperCase()}`,
        customer: o.profiles?.full_name || 'Pelanggan',
        item: o.order_items?.map((item: any) => `${item.quantity}x ${item.menu?.name}`).join(', ') || 'Tak ada item',
        status: o.order_status,
        total: `Rp ${Number(o.total_price).toLocaleString('id-ID')}`
      }));
      setRecentOrders(formatted);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#1a1a1a] text-white p-6 md:p-8 flex flex-row md:flex-col gap-6 md:gap-12 md:sticky md:top-0 md:h-screen overflow-x-auto whitespace-nowrap md:whitespace-normal no-scrollbar items-center md:items-start z-50">
        <div className="text-2xl font-black text-emerald-500 hidden md:block">Kopiden.</div>
        <nav className="flex flex-row md:flex-col gap-2 md:gap-4 flex-grow w-full">
          <Link href="/admin/dashboard" className="flex items-center gap-2 md:gap-4 px-4 py-3 md:p-4 bg-emerald-500 rounded-xl md:rounded-2xl font-bold flex-shrink-0">
            <LayoutDashboard size={20} /> <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link href="/admin/menu" className="flex items-center gap-2 md:gap-4 px-4 py-3 md:p-4 text-gray-400 hover:text-white transition-colors flex-shrink-0">
            <Coffee size={20} /> <span className="hidden sm:inline">Menu Management</span>
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-2 md:gap-4 px-4 py-3 md:p-4 text-gray-400 hover:text-white transition-colors flex-shrink-0">
            <ShoppingBag size={20} /> <span className="hidden sm:inline">Orders</span>
          </Link>
          <div className="mt-12 opacity-20 h-px bg-white"></div>
          <Link href="/admin/settings" className="flex items-center gap-4 p-4 text-gray-400 hover:text-white transition-colors">
            <Settings size={20} /> Settings
          </Link>
        </nav>
        <button className="flex items-center gap-4 p-4 text-red-400 hover:text-red-500 transition-colors">
          <LogOut size={20} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-6 md:p-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1a1a1a]">Good Morning, Boss!</h1>
            <p className="text-sm md:text-base text-gray-400">Here's what's happening today at Kopiden.</p>
          </div>
          <div className="flex gap-4">
            <div className="h-10 w-10 md:h-12 md:w-12 bg-white rounded-full shadow-sm border border-gray-100"></div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-8 md:mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-5 md:p-6 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-50">
              <div className={`h-10 w-10 md:h-12 md:w-12 ${stat.color} text-white rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-lg shadow-emerald-500/10`}>
                {stat.icon}
              </div>
              <p className="text-gray-400 text-xs md:text-sm font-medium mb-1">{stat.label}</p>
              <h3 className="text-xl md:text-2xl font-black">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[3rem] shadow-sm border border-gray-50">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold">Recent Orders</h2>
            <Link href="/admin/orders" className="text-emerald-500 font-bold hover:underline text-sm md:text-base">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-sm uppercase tracking-widest border-b border-gray-50">
                  <th className="pb-6 px-4">Order ID</th>
                  <th className="pb-6 px-4">Customer</th>
                  <th className="pb-6 px-4">Item</th>
                  <th className="pb-6 px-4">Status</th>
                  <th className="pb-6 px-4">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order, i) => (
                  <tr key={i} className="hover:bg-emerald-50 transition-colors group">
                    <td className="py-6 px-4 font-bold">{order.id}</td>
                    <td className="py-6 px-4 text-gray-600">{order.customer}</td>
                    <td className="py-6 px-4">{order.item}</td>
                    <td className="py-6 px-4">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase ${order.status === 'Brewing' ? 'bg-orange-100 text-orange-600' :
                          order.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' :
                            'bg-red-100 text-red-600'
                        }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-6 px-4 font-black">{order.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
