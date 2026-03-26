'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, X, Eye, Loader2, Banknote, MapPin, RefreshCw, Truck, Coffee, Package, Printer, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'cashier' | 'barista'>('all');
  const [userRole, setUserRole] = useState<'admin' | 'barista' | 'cashier' | 'customer' | null>(null);
  const [confirming, setConfirming] = useState<{ id: string, action: string } | null>(null);
  const [syncMessage, setSyncMessage] = useState<{ type: 'error' | 'success' | 'info', text: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<{ title: string, desc: string } | null>(null);
  const router = useRouter();

  const [audioContext, setAudioContext] = useState<any>(null);

  useEffect(() => {
    const initAudio = () => {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContext && !audioContext) {
        setAudioContext(new AudioContext());
      }
    };

    window.addEventListener('click', initAudio, { once: true });
    return () => window.removeEventListener('click', initAudio);
  }, [audioContext]);

  const playSound = (type: 'new' | 'paid' = 'new') => {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const context = audioContext || new AudioContext();
      if (!audioContext) {
        setAudioContext(context);
      }

      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.connect(gain);
      gain.connect(context.destination);

      if (type === 'new') {
        // "Kitchen Bell" Ting!
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1500, context.currentTime); // High pitch
        gain.gain.setValueAtTime(0.3, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.4);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.5);
      } else {
        // "Double Success" Chime for Paid
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(880, context.currentTime);
        gain.gain.setValueAtTime(0.2, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.3);

        // Second chime
        setTimeout(() => {
          const osc2 = context.createOscillator();
          const g2 = context.createGain();
          osc2.connect(g2); g2.connect(context.destination);
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(1174.66, context.currentTime); // D6
          g2.gain.setValueAtTime(0.2, context.currentTime);
          g2.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.4);
          osc2.start();
          osc2.stop(context.currentTime + 0.4);
        }, 150);
      }
    } catch (err) {
      console.error('Kitchen Bell playback failed:', err);
    }
  };

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

      // Fetch Profile Role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role === 'customer') {
        router.push('/menu');
        return;
      }

      setUserRole(profile.role as any);
      if (profile.role === 'barista') setActiveTab('barista');
      else if (profile.role === 'cashier') setActiveTab('cashier');
      else setActiveTab('all');

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
          customer: order.profiles?.full_name || order.customer_name_guest || 'Guest',
          table: order.table_number,
          items: order.order_items?.map((item: any) => `${item.quantity}x ${item.menu?.name}`).join(', ') || 'No items',
          total: `Rp ${order.total_price.toLocaleString('id-ID')}`,
          status: order.order_status,
          paymentStatus: order.payment_status,
          paymentMethod: order.payment_method,
          address: order.delivery_address,
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
          customer: order.profiles?.full_name || order.customer_name_guest || 'Guest',
          table: order.table_number,
          items: order.order_items?.map((item: any) => `${item.quantity}x ${item.menu?.name}`).join(', ') || 'No items',
          total: `Rp ${order.total_price.toLocaleString('id-ID')}`,
          status: order.order_status,
            paymentStatus: order.payment_status,
            paymentMethod: order.payment_method,
            address: order.delivery_address,
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
          // To the Barista, a paid order is a "New Work"
          playSound('new');
          setToastMsg({ title: 'Pembayaran Dikonfirmasi! ✅', desc: `Pesanan #${idShort} siap diproses.` });
          setTimeout(() => setToastMsg(null), 5000);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, async (payload) => {
        const newOrderData = await fetchSingleOrder(payload.new.id);
        if (newOrderData) {
          setOrders(prev => [newOrderData, ...prev]);
        }

        // Only play bell on insert if it's already paid (Online Payment)
        // If it's "waiting_at_counter", the Barista shouldn't see it yet.
        if (payload.new.payment_status === 'paid') {
          playSound('new');
          setToastMsg({ title: 'Pesanan Baru! ☕', desc: 'Ada pesanan baru yang sudah lunas.' });
        } else if (activeTab === 'cashier' || activeTab === 'all') {
          // Cashiers MUST hear the bell for new unpaid orders
          playSound('new');
          setToastMsg({ title: 'Pelanggan Menunggu di Kasir 🏪', desc: 'Seseorang ingin melakukan pembayaran tunai.' });
        } else {
          // Baristas: Silent info for unpaid orders
          setToastMsg({ title: 'Pesanan Baru (Pending) ☕', desc: 'Seseorang sedang melakukan pemesanan.' });
        }

        setTimeout(() => setToastMsg(null), 5000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, activeTab]);

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

  const handlePrint = (order: any) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const receiptHtml = `
      <html>
        <head>
          <title>Struk Kopiden - ${order.id}</title>
          <style>
            @font-face {
              font-family: 'Inter';
              src: url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 80mm; 
              margin: 0 auto; 
              padding: 10px;
              color: #000;
            }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -1px; }
            .info { font-size: 12px; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .item { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px; }
            .totals { margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; font-weight: bold; }
            .footer { text-align: center; margin-top: 25px; font-size: 11px; font-style: italic; }
            .qr-placeholder { margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>KOPIDEN</h1>
            <div style="font-size: 10px;">Modern Coffee Experience</div>
          </div>
          <div class="info">
            <div>Order: #${order.id}</div>
            <div>Date: ${new Date().toLocaleString('id-ID')}</div>
            <div>Customer: ${order.customer}</div>
            <div>Type: ${order.table === 'Delivery' ? 'DELIVERY' : (order.table === 'Takeaway' ? 'TAKEAWAY' : 'DINE-IN (' + order.table + ')')}</div>
            ${order.address ? `<div style="margin-top:5px; font-style:italic;">Addr: ${order.address}</div>` : ''}
          </div>
          <div class="items">
            ${order.items.split(', ').map((item: string) => {
      const parts = item.match(/(\\d+)x (.+)/);
      if (parts) {
        return `<div class="item"><span>${parts[1]}x ${parts[2]}</span></div>`;
      }
      return `<div class="item"><span>${item}</span></div>`;
    }).join('')}
          </div>
          <div class="totals">
            <div class="item"><span>TOTAL</span><span>${order.total}</span></div>
          </div>
          <div class="footer">
            <div>Terima Kasih Atas Kunjungan Anda!</div>
            <div style="margin-top:5px;">Follow us @kopiden.id</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onafterprint = () => {
      printWindow.close();
    };
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row text-gray-900">
      <AdminSidebar />

      <main className="flex-grow p-4 sm:p-8 md:p-12 overflow-x-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
              {activeTab === 'all' && <><ShieldCheck size={28} className="text-primary" /> Dashboard Owner</>}
              {activeTab === 'cashier' && <><Banknote size={28} className="text-amber-500" /> Dashboard Kasir</>}
              {activeTab === 'barista' && <><Coffee size={28} className="text-orange-500" /> Dashboard Barista</>}
            </h1>
            <p className="text-gray-400 text-xs font-medium mt-1 uppercase tracking-widest leading-relaxed">
              {activeTab === 'all' ? 'Akses Penuh: Monitoring & Management' : 
               activeTab === 'cashier' ? 'Fokus: Pembayaran & Konfirmasi Tunai' : 
               'Fokus: Produksi & Status Pesanan'}
            </p>
          </div>

          {userRole === 'admin' && (
            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 self-start overflow-x-auto max-w-full no-scrollbar">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <ShieldCheck size={14} /> Admin
              </button>
              <button
                onClick={() => setActiveTab('cashier')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'cashier' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Banknote size={14} /> Kasir
              </button>
              <button
                onClick={() => setActiveTab('barista')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'barista' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Coffee size={14} /> Barista
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {loading ? (
            <div className="flex justify-center py-20 text-emerald-500">
              <Loader2 className="animate-spin" size={48} />
            </div>
          ) : orders.filter(o => {
            if (activeTab === 'cashier') return o.paymentStatus === 'waiting_at_counter';
            if (activeTab === 'barista') return o.paymentStatus === 'paid' && (o.status === 'pending' || o.status === 'processing' || o.status === 'brewing' || o.status === 'on_the_way');
            return true;
          }).length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
              <div className="text-gray-300 mb-4 flex justify-center"><Info size={48} /></div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Tidak ada pesanan di kategori ini</p>
            </div>
          ) : orders.filter(o => {
            if (activeTab === 'cashier') return o.paymentStatus === 'waiting_at_counter';
            if (activeTab === 'barista') return o.paymentStatus === 'paid' && (o.status === 'pending' || o.status === 'processing' || o.status === 'brewing' || o.status === 'on_the_way');
            return true;
          }).map((order, i) => (
            <div key={i} className="bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 group hover:shadow-xl transition-all border border-gray-50 relative overflow-hidden">
              <div className="h-12 w-12 sm:h-16 sm:w-16 bg-emerald-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-500 font-black text-sm sm:text-base">
                {order.id}
              </div>
              <div className="flex-grow w-full sm:w-auto">
                <div className="flex items-center justify-between sm:justify-start gap-3 mb-1">
                  <h3 className="text-lg sm:text-xl font-bold truncate max-w-[150px] sm:max-w-none">{order.customer}</h3>
                  <span className="text-[10px] sm:text-xs text-gray-400 font-medium">• {order.time}</span>
                  
                  {/* Stale Warning (>2h) */}
                  {order.status !== 'completed' && order.status !== 'cancelled' && (new Date().getTime() - new Date(order.createdAt).getTime()) > 7200000 && (
                    <span className="px-2 py-0.5 bg-red-50 text-red-500 text-[9px] font-bold rounded-lg animate-pulse border border-red-100">
                      STALE &gt; 2H
                    </span>
                  )}
                  {order.table === 'Delivery' ? (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-500 text-[10px] font-black rounded-lg flex items-center gap-1">
                      <MapPin size={10} /> DELIVERY (DIGOS)
                    </span>
                  ) : order.table === 'Takeaway' ? (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-500 text-[10px] font-black rounded-lg flex items-center gap-1">
                      <Package size={10} /> TAKEAWAY
                    </span>
                  ) : order.table ? (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-lg">
                      MEJA {order.table}
                    </span>
                  ) : null}
                </div>
                <p className="text-gray-500 text-xs sm:text-sm font-medium truncate max-w-full italic mb-1">
                  {order.items}
                </p>
                {order.address && order.address.trim() !== '' && (
                  <div className="flex items-start gap-2 text-xs text-blue-600 bg-blue-50/50 p-3 rounded-2xl border border-blue-100 mt-3 shadow-sm">
                    <MapPin className="mt-0.5 flex-shrink-0" size={14} />
                    <div className="flex flex-col">
                       <span className="font-black uppercase tracking-widest text-[8px] mb-0.5">Alamat Pengiriman:</span>
                       <span className="font-medium leading-relaxed">{order.address}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-1 px-0 sm:px-8 sm:border-x border-gray-50 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 mt-2 sm:mt-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black hidden sm:block">Status</p>
                <div className="flex flex-row sm:flex-col gap-2 scale-90 sm:scale-100">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                        order.status === 'brewing' ? 'bg-orange-100 text-orange-600' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-600' :
                            'bg-gray-100 text-gray-600'
                    }`}>
                    {order.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.paymentStatus === 'paid' ? 'bg-emerald-500 text-white' :
                      order.paymentStatus === 'waiting_at_counter' ? 'bg-amber-100 text-amber-600 animate-pulse' :
                        order.paymentStatus === 'pending' ? 'bg-orange-100 text-orange-600' :
                          'bg-red-100 text-red-600'
                    }`}>
                    {order.paymentStatus === 'waiting_at_counter' ? 'Bayar di Kasir' : order.paymentStatus}
                  </span>
                </div>
                <div className="flex-grow sm:hidden"></div>
                <p className="text-xl font-black sm:hidden">{order.total}</p>
              </div>
              <div className="hidden sm:block text-right min-w-[120px]">
                <p className="text-2xl font-black">{order.total}</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Print Receipt - ALWAYS Visible */}
                <button
                  onClick={() => handlePrint(order)}
                  className="flex-grow sm:flex-none h-11 w-full sm:w-12 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:text-primary hover:bg-primary/5 transition-all"
                  title="Print Receipt"
                >
                  <Printer size={18} className="sm:w-5 sm:h-5" />
                </button>

                {/* Sync Payment - Cashier Only */}
                {(activeTab === 'all' || activeTab === 'cashier') && (
                  <button
                    onClick={() => handleSyncStatus(order.rawId)}
                    disabled={syncingId === order.rawId}
                    className="flex-grow sm:flex-none h-11 w-full sm:w-12 bg-white border border-gray-100 text-gray-400 rounded-xl flex items-center justify-center hover:text-blue-500 hover:border-blue-100 transition-all disabled:opacity-50"
                    title="Sync Payment Status"
                  >
                    <RefreshCw size={18} className={`sm:w-5 sm:h-5 ${syncingId === order.rawId ? 'animate-spin' : ''}`} />
                  </button>
                )}

                {/* Brewing/Otw - Barista/Delivery Only */}
                {(activeTab === 'all' || activeTab === 'barista') && (
                  <>
                    <button
                      disabled={(order.status !== 'pending' && order.status !== 'processing') || order.paymentStatus !== 'paid'}
                      onClick={() => handleUpdateStatus(order.rawId, 'brewing')}
                      className={`flex-grow sm:flex-none h-11 w-full sm:w-12 rounded-xl flex items-center justify-center transition-all ${order.status === 'brewing' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-white border border-gray-100 text-gray-400 hover:text-orange-500 hover:border-orange-100'
                        }`}
                      title="Start Brewing"
                    >
                      <Coffee size={18} className="sm:w-5 sm:h-5" />
                    </button>

                    <button
                      disabled={order.status !== 'brewing' && order.status !== 'processing' && order.status !== 'pending'}
                      onClick={() => handleUpdateStatus(order.rawId, 'on_the_way')}
                      className={`flex-grow sm:flex-none h-11 w-full sm:w-12 rounded-xl flex items-center justify-center transition-all ${order.status === 'on_the_way' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white border border-gray-100 text-gray-400 hover:text-blue-500 hover:border-blue-100'
                        }`}
                      title="Out for Delivery"
                    >
                      <Truck size={18} className="sm:w-5 sm:h-5" />
                    </button>
                  </>
                )}

                {/* Financial Actions - Cashier Only */}
                {(activeTab === 'all' || activeTab === 'cashier') && (
                  <button
                    disabled={order.paymentStatus === 'paid'}
                    onClick={async () => {
                      if (confirming?.id === order.rawId && confirming?.action === 'pay') {
                        await handleUpdatePaymentStatus(order.rawId, 'paid');
                        if (order.status === 'pending') {
                          await handleUpdateStatus(order.rawId, 'processing');
                        }
                        setConfirming(null);
                      } else {
                        setConfirming({ id: order.rawId, action: 'pay' });
                        setTimeout(() => setConfirming(null), 3000);
                      }
                    }}
                    className={`flex-grow sm:flex-none h-11 w-full sm:w-auto sm:min-w-[44px] px-2 rounded-xl flex items-center justify-center transition-all ${order.paymentStatus === 'waiting_at_counter'
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                      : 'bg-white border border-gray-100 text-orange-400 hover:text-emerald-500 hover:border-emerald-100'
                      } ${confirming?.id === order.rawId && confirming?.action === 'pay' ? 'bg-red-500 border-red-500 text-white ring-4 ring-red-100' : ''}`}
                  >
                    {confirming?.id === order.rawId && confirming?.action === 'pay' ? (
                      <span className="text-[10px] font-black px-2">CONFIRM?</span>
                    ) : (
                      <Banknote size={18} className="sm:w-5 sm:h-5" />
                    )}
                  </button>
                )}

                {/* Conclusion Actions - Barista/All - HIDDEN FOR STAFF UNLESS STALE */}
                {(activeTab === 'all' || ((activeTab === 'barista' || activeTab === 'cashier') && (new Date().getTime() - new Date(order.createdAt).getTime()) > 7200000)) && (
                  <button
                    disabled={order.status === 'completed' || order.status === 'cancelled'}
                    onClick={() => {
                      if (confirming?.id === order.rawId && confirming?.action === 'complete') {
                        handleUpdateStatus(order.rawId, 'completed');
                        setConfirming(null);
                      } else {
                        setConfirming({ id: order.rawId, action: 'complete' });
                        setTimeout(() => setConfirming(null), 3000);
                      }
                    }}
                    className={`flex-grow sm:flex-none h-11 w-full sm:w-auto sm:min-w-[44px] px-2 rounded-xl flex items-center justify-center transition-all ${confirming?.id === order.rawId && confirming?.action === 'complete' ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}
                  >
                    {confirming?.id === order.rawId && confirming?.action === 'complete' ? (
                      <span className="text-[10px] font-black px-2">LUNAS?</span>
                    ) : (
                      <Check size={18} className="sm:w-5 sm:h-5" />
                    )}
                  </button>
                )}

                {/* Cancel - All (With High Discipline) - HIDDEN FOR STAFF UNLESS STALE */}
                {(activeTab === 'all' || ((activeTab === 'barista' || activeTab === 'cashier') && (new Date().getTime() - new Date(order.createdAt).getTime()) > 7200000)) && (
                  <button
                    disabled={order.status === 'completed' || order.status === 'cancelled'}
                    onClick={() => {
                      if (confirming?.id === order.rawId && confirming?.action === 'cancel') {
                        handleUpdateStatus(order.rawId, 'cancelled');
                        setConfirming(null);
                      } else {
                        setConfirming({ id: order.rawId, action: 'cancel' });
                        setTimeout(() => setConfirming(null), 3000);
                      }
                    }}
                    className={`flex-grow sm:flex-none h-11 w-full sm:w-auto sm:min-w-[44px] px-2 rounded-xl flex items-center justify-center transition-all border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 ${confirming?.id === order.rawId && confirming?.action === 'cancel' ? 'bg-red-600 border-red-600 text-white ring-4 ring-red-100 animate-pulse' : ''}`}
                  >
                    {confirming?.id === order.rawId && confirming?.action === 'cancel' ? (
                      <span className="text-[10px] font-black px-2">BATAL?</span>
                    ) : (
                      <X size={18} className="sm:w-5 sm:h-5" />
                    )}
                  </button>
                )}
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
            <div className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center mb-6 ${syncMessage.type === 'error' ? 'bg-red-50 text-red-500' :
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
