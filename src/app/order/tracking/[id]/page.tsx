'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Coffee, MapPin, CheckCircle2, Clock, Loader2, Sparkles } from 'lucide-react';
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
  const [uploading, setUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleConfirmReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('order-proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('order-proofs')
        .getPublicUrl(filePath);

      // 3. Update Order in Supabase
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          order_status: 'completed',
          proof_image_url: publicUrl
        })
        .eq('id', id);

      if (updateError) throw updateError;
      
      // Update local state
      setOrder((prev: any) => ({ ...prev, order_status: 'completed', proof_image_url: publicUrl }));
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Confirm receipt error:', err);
    } finally {
      setUploading(false);
    }
  };

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

    const statusOrder = ['pending', 'brewing', 'on_the_way', 'completed'];
    let currentIndex = statusOrder.indexOf(status);

    // Normalize 'processing' or 'paid' status to advance the stepper
    if (status === 'processing' || (status === 'pending' && order.payment_status === 'paid')) {
      currentIndex = 1;
    }

    return allSteps.map((step, idx) => ({
      label: step.label,
      icon: step.icon,
      status: idx < currentIndex ? 'completed' : idx === currentIndex ? 'current' : 'pending'
    }));
  };

  const steps = getStatusSteps(order.order_status);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <nav className="px-5 md:px-8 py-6 flex items-center justify-between border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
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

          {/* Confirm Receipt Section */}
          {order.order_status === 'on_the_way' && (
            <div className="mt-8 relative animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-[#1a1a1a] p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] text-white relative overflow-hidden group">
                <Sparkles className="absolute top-4 right-8 text-amber-400/20 w-12 h-12 animate-pulse" />
                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-3">Pesanan Sampai! 🎉</h3>
                  <p className="text-white/60 text-sm font-medium mb-8 max-w-sm">
                    Kopimu sudah tiba? Yuk ambil foto kopinya sebagai bukti penerimaan untuk menyelesaikan pesanan.
                  </p>
                  
                  <div className="space-y-4">
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      onChange={handleConfirmReceipt}
                      id="proof-upload"
                      className="hidden"
                      disabled={uploading}
                    />
                    <label 
                      htmlFor="proof-upload"
                      className={`w-full flex items-center justify-center gap-4 p-6 rounded-3xl cursor-pointer transition-all border-2 border-dashed ${
                        uploading 
                        ? 'bg-white/5 border-white/10' 
                        : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-primary active:scale-95'
                      }`}
                    >
                      {uploading ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="animate-spin text-primary" size={24} />
                          <span className="font-bold text-white/50">Mengunggah Bukti...</span>
                        </div>
                      ) : (
                        <>
                          <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                            <MapPin size={24} />
                          </div>
                          <div className="text-left">
                            <p className="font-black text-white">Ambil Foto Bukti</p>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Gunakan Kamera Belakang</p>
                          </div>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {order.order_status === 'completed' && order.proof_image_url && (
            <div className="mt-8 p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 flex items-center gap-6">
               <div className="h-16 w-16 bg-white rounded-2xl overflow-hidden border border-emerald-50 shrink-0 shadow-sm">
                  <img src={order.proof_image_url} alt="Proof" className="w-full h-full object-cover" />
               </div>
               <div>
                  <h4 className="text-lg font-black text-emerald-600">Terima Kasih!</h4>
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Pesanan Selesai & Diterima</p>
               </div>
            </div>
          )}
        </div>

        <Link 
          href="/dashboard"
          className="mt-8 flex items-center justify-center gap-2 text-gray-400 font-bold hover:text-primary transition-colors text-sm"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Success Delivery Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-500"></div>
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 md:p-12 relative z-10 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 overflow-hidden">
             {/* Decorative Background */}
             <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-50 to-transparent -z-10"></div>
             
             <div className="relative flex flex-col items-center text-center">
                <div className="h-24 w-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/30 rotate-3">
                   <CheckCircle2 size={48} />
                </div>
                
                <h2 className="text-3xl font-black text-[#1a1a1a] mb-4">Enjoy Your Coffee! ☕</h2>
                <p className="text-gray-500 font-medium mb-10 leading-relaxed">
                  Terima kasih sudah memesan di Kopiden by UAY. Jangan lupa ajak temanmu dan kumpulkan poin loyalitasnya!
                </p>

                {order.proof_image_url && (
                  <div className="w-full aspect-video rounded-3xl overflow-hidden mb-10 border border-gray-100 shadow-sm relative group">
                    <img src={order.proof_image_url} alt="Delivered" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-xs font-black uppercase tracking-widest">Bukti Penerimaan</span>
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-5 bg-[#1a1a1a] text-white rounded-[2rem] font-black text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-black/20 active:scale-95"
                >
                  Sama-sama!
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
