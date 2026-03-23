'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Coffee, MapPin, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface OrderStep {
  label: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'pending';
}

export default function OrderTracking({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            menu:menu_id (name)
          )
        `)
        .eq('id', id)
        .single();

      if (data) {
        setOrder(data);
      }
      setLoading(false);
    }

    fetchOrder();

    // Realtime subscription
    const channel = supabase
      .channel(`order-tracking-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setOrder((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-black mb-4 text-[#1a1a1a]">Order Not Found</h1>
        <p className="text-gray-400 mb-8 tracking-tight">We couldn't find an order with that ID.</p>
        <Link href="/" className="px-8 py-3 bg-primary text-white font-bold rounded-full shadow-lg shadow-primary/20">Go Home</Link>
      </div>
    );
  }

  const getStatusSteps = (status: string): OrderStep[] => {
    const allSteps = [
      { label: 'Order Received', icon: <CheckCircle2 size={20} />, key: 'pending' },
      { label: 'Brewing', icon: <Coffee size={20} />, key: 'processing' },
      { label: 'Out for Delivery', icon: <MapPin size={20} />, key: 'shipped' },
      { label: 'Delivered', icon: <Clock size={20} />, key: 'completed' },
    ];

    const statusOrder = ['pending', 'processing', 'shipped', 'completed'];
    const currentIndex = statusOrder.indexOf(status);

    return allSteps.map((step, idx) => ({
      label: step.label,
      icon: step.icon,
      status: idx < currentIndex ? 'completed' : idx === currentIndex ? 'current' : 'pending'
    }));
  };

  const steps = getStatusSteps(order.order_status);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <nav className="px-5 md:px-8 py-6 flex items-center justify-between border-b bg-white backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="font-black text-2xl text-primary tracking-tighter">Kopiden</Link>
        <span className="font-black text-[10px] md:text-sm tracking-widest text-gray-400 uppercase">Order #{order.id.slice(0, 8).toUpperCase()}</span>
        <div className="w-10"></div>
      </nav>

      <div className="container mx-auto px-5 md:px-8 py-8 md:py-12 max-w-2xl">
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm border border-gray-50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-secondary animate-pulse"></div>
          
          <div className="flex justify-between items-start mb-12">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Tracking Your Brew</h1>
            <div className="text-right">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Status</p>
                <div className="font-black text-primary capitalize">{order.order_status}</div>
            </div>
          </div>

          <div className="space-y-12 mb-12">
            {steps.map((step, idx) => (
              <div key={idx} className="flex gap-6 md:gap-8 items-start relative group">
                {idx < steps.length - 1 && (
                  <div className={`absolute left-6 md:left-6 top-10 w-0.5 h-12 transition-colors duration-1000 ${
                    step.status === 'completed' ? 'bg-primary' : 'bg-gray-100'
                  }`}></div>
                )}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-700 z-10 ${
                  step.status === 'completed' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' : 
                  step.status === 'current' ? 'bg-secondary text-primary animate-pulse' : 
                  'bg-gray-50 text-gray-300'
                }`}>
                  {step.icon}
                </div>
                <div className="pt-2">
                  <h3 className={`text-lg font-black tracking-tight ${step.status === 'pending' ? 'text-gray-300' : 'text-[#1a1a1a]'}`}>{step.label}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                    {step.status === 'completed' ? 'Past Step' : step.status === 'current' ? 'Live Progress' : 'Coming Up'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 md:p-8 bg-gray-50 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100">
             <div className="flex items-center gap-4 md:gap-6">
                <div className="h-14 w-14 md:h-16 md:w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl border border-gray-50">☕</div>
                <div>
                   <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Now Brewing</p>
                   <p className="font-black text-[#1a1a1a] text-sm md:text-base">
                      {order.order_items?.[0]?.menu?.name || 'Your Delicious Coffee'}
                      {order.order_items?.length > 1 && ` + ${order.order_items.length - 1} more`}
                   </p>
                </div>
             </div>
          </div>
        </div>

        <Link 
          href="/dashboard"
          className="mt-8 flex items-center justify-center gap-2 text-gray-400 font-bold hover:text-primary transition-colors text-sm"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
