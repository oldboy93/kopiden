'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, Users, DollarSign, Loader2, ShoppingBag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';

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
      const { count: totalOrdersCount, error: countError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      if (countError) console.error('Count Error:', countError);

      // Get Total Revenue (where payment_status is 'paid')
      const { data: revenueData, error: revError } = await supabase
        .from('orders')
        .select('total_price')
        .eq('payment_status', 'paid');
      
      if (revError) console.error('Revenue Error:', revError);

      const totalRevenueSum = revenueData?.reduce((acc, curr) => acc + Number(curr.total_price), 0) || 0;

      // Get Active Customers (Unique user_id in orders)
      const { data: customerData, error: custError } = await supabase
        .from('orders')
        .select('user_id');
      
      if (custError) console.error('Customer Error:', custError);

      const uniqueCustomers = new Set(customerData?.map(o => o.user_id)).size;

      // Get Pending Orders Count
      const { count: pendingCount, error: pendingError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('order_status', 'pending');

      if (pendingError) console.error('Pending Error:', pendingError);

      setStatsData({
        totalRevenue: totalRevenueSum,
        totalOrders: totalOrdersCount || 0,
        activeCustomers: uniqueCustomers || 0,
        pendingOrders: pendingCount || 0
      });
    } catch (error) {
      console.error('Catch Error fetching admin stats:', error);
    }
  }

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
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Fetch Orders Error:', error);
      return;
    }

    if (data) {
      const formatted = data.map((o: any) => ({
        id: `#${o.id.split('-')[0].toUpperCase()}`,
        customer: o.profiles?.full_name || 'Pelanggan',
        item: o.order_items?.map((item: any) => `${item.quantity}x ${item.menu?.name}`).join(', ') || 'Tak ada item',
        status: o.order_status,
        paymentStatus: o.payment_status,
        total: `Rp ${Number(o.total_price).toLocaleString('id-ID')}`
      }));
      setRecentOrders(formatted);
    }
  }


  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row">
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-8 md:p-12 overflow-x-hidden">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 md:mb-12 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#1a1a1a]">Good Morning, Boss!</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-400">Here's what's happening today at Kopiden.</p>
          </div>
          <div className="flex gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white rounded-full shadow-sm border border-gray-100"></div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-8 mb-8 md:mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className={`h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 ${stat.color} text-white rounded-xl md:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 shadow-lg shadow-emerald-500/10`}>
                <span className="scale-75 sm:scale-90 md:scale-100">{stat.icon}</span>
              </div>
              <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm font-medium mb-0.5 sm:mb-1">{stat.label}</p>
              <h3 className="text-sm sm:text-xl md:text-2xl font-black truncate w-full">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white p-5 sm:p-6 md:p-10 rounded-[2.5rem] sm:rounded-3xl md:rounded-[3rem] shadow-sm border border-gray-50">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Recent Orders</h2>
            <Link href="/admin/orders" className="text-emerald-500 font-bold hover:underline text-xs sm:text-sm md:text-base">View All</Link>
          </div>
          <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
            <table className="w-full text-left min-w-[600px] mb-4">
              <thead>
                <tr className="text-gray-400 text-[10px] sm:text-xs md:text-sm uppercase tracking-widest border-b border-gray-50">
                  <th className="pb-4 sm:pb-6 px-4">Order ID</th>
                  <th className="pb-4 sm:pb-6 px-4">Customer</th>
                  <th className="pb-4 sm:pb-6 px-4">Payment</th>
                  <th className="pb-4 sm:pb-6 px-4">Status</th>
                  <th className="pb-4 sm:pb-6 px-4">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-[12px] sm:text-sm md:text-base">
                {recentOrders.map((order, i) => (
                  <tr key={i} className="hover:bg-emerald-50 transition-colors group">
                    <td className="py-4 sm:py-6 px-4 font-bold">{order.id}</td>
                    <td className="py-4 sm:py-6 px-4 text-gray-600">{order.customer}</td>
                    <td className="py-4 sm:py-6 px-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        order.paymentStatus === 'paid' ? 'bg-emerald-500 text-white' :
                        order.paymentStatus === 'pending' ? 'bg-orange-100 text-orange-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-4 sm:py-6 px-4">
                      <span className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black tracking-widest uppercase ${order.status === 'Brewing' ? 'bg-orange-100 text-orange-600' :
                          order.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' :
                            'bg-red-100 text-red-600'
                        }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 sm:py-6 px-4 font-black whitespace-nowrap">{order.total}</td>
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
