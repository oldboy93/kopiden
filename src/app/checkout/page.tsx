'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  MapPin,
  Mail,
  User,
  Package,
  Ticket,
  Star,
  X,
  Sparkles
} from 'lucide-react';

declare global {
  interface Window {
    snap: any;
  }
}

export default function Checkout() {
  const { cart, subtotal, clearCart } = useCart();
  const [step, setStep] = useState(1); // 1: Info, 2: Payment, 3: Success
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  // Voucher State
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [voucherError, setVoucherError] = useState('');
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  
  // Points State
  const [availablePoints, setAvailablePoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);

  const tax = subtotal * 0.1;
  const discountAmount = appliedVoucher ? (subtotal * appliedVoucher.discount_percent / 100) : 0;
  const pointsDiscount = usePoints ? Math.floor(availablePoints / 100) : 0;
  const total = Math.max(0, subtotal + tax - discountAmount - pointsDiscount);

  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/checkout');
        return;
      }
      setUser(user);

      // Pre-fill profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setFullName(profile.full_name || '');
        setEmail(profile.email || '');
        setAddress(profile.address || '');
        setAvailablePoints(profile.loyalty_points || 0);
      }
    }
    
    if (cart.length === 0 && step !== 3) {
      router.push('/menu');
      return;
    }

    getUser();
  }, [router, cart.length, step]);

  const handleApplyVoucher = async () => {
    if (!voucherCode) return;
    setCheckingVoucher(true);
    setVoucherError('');
    
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', voucherCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setVoucherError('Invalid or expired voucher code');
        setAppliedVoucher(null);
      } else {
        setAppliedVoucher(data);
        setVoucherError('');
      }
    } catch (err) {
      setVoucherError('Error checking voucher');
    } finally {
      setCheckingVoucher(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePayment = async () => {
    setLoading(true);
    const pointsUsedValue = usePoints ? availablePoints : 0;
    try {
      // 1. Create Order in Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_price: total,
          payment_status: 'pending',
          order_status: 'pending',
          points_used: usePoints ? availablePoints : 0
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create Order Items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        menu_id: item.id,
        quantity: item.quantity,
        price: item.price,
        size: item.size || 'Regular'
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

    // 2.5 Update Order with Discount if applicable
    if (appliedVoucher) {
      await supabase
        .from('orders')
        .update({ 
          voucher_code: appliedVoucher.code,
          discount_amount: discountAmount 
        })
        .eq('id', order.id);
    }

      // 3. Get Snap Token from API
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          gross_amount: total, // This 'total' already includes pointsDiscount from line 51 logic
          discount_amount: discountAmount + pointsDiscount, // Log total discount for record
          voucher_code: appliedVoucher?.code,
          customer_details: {
            first_name: fullName,
            email: email,
            address: address
          },
          items: cart
        })
      });

      const { token, order_id: midtransOrderId, error: paymentError } = await response.json();

      if (paymentError || !token) {
        throw new Error(paymentError || 'No payment token received');
      }

      // Save token and actual midtrans order id
      await supabase
        .from('orders')
        .update({ 
          midtrans_token: token,
          midtrans_order_id: midtransOrderId 
        })
        .eq('id', order.id);

      // 4. Open Midtrans Snap
      window.snap.pay(token, {
        onSuccess: async (result: any) => {
          console.log('Payment success:', result);
          await supabase
            .from('orders')
            .update({ payment_status: 'paid', order_status: 'processing' })
            .eq('id', order.id);

          // Deduct points from profile if used
          if (usePoints) {
            await supabase
              .from('profiles')
              .update({ loyalty_points: availablePoints - pointsUsedValue }) // Wait, pointsUsedValue needs to be defined
              .eq('id', user.id);
          }
          setOrderId(order.id);
          setStep(3);
        },
        onPending: async (result: any) => {
          console.log('Payment pending:', result);
          
          await supabase
            .from('orders')
            .update({ payment_status: 'pending', order_status: 'pending' })
            .eq('id', order.id);

          setOrderId(order.id);
          setStep(3);
        },
        onError: (result: any) => {
          console.error('Payment error:', result);
          alert('Payment failed. Please try again.');
        },
        onClose: () => {
          console.log('Customer closed the popup without finishing the payment');
        }
      });
      
      // CRITICAL: Clear cart immediately for mobile compatibility 
      // (Redirects to payment apps often break browser callbacks)
      clearCart();
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert('Error processing order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Script 
        src="https://app.sandbox.midtrans.com/snap/snap.js" 
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
      />
      
      <div className="container mx-auto px-8 py-12 max-w-4xl">
        <header className="text-center mb-16">
          <Link href="/" className="text-4xl font-black text-primary mb-8 block tracking-tighter hover:scale-105 transition-transform">Kopiden</Link>
          <div className="flex items-center justify-center gap-6 max-w-md mx-auto">
             <div className="flex flex-col items-center gap-2 flex-1">
               <div className={`h-2 w-full rounded-full transition-all duration-500 ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`}></div>
               <span className={`text-[10px] font-black uppercase tracking-widest ${step >= 1 ? 'text-primary' : 'text-gray-300'}`}>Info</span>
             </div>
             <div className="flex flex-col items-center gap-2 flex-1">
               <div className={`h-2 w-full rounded-full transition-all duration-500 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
               <span className={`text-[10px] font-black uppercase tracking-widest ${step >= 2 ? 'text-primary' : 'text-gray-300'}`}>Payment</span>
             </div>
             <div className="flex flex-col items-center gap-2 flex-1">
               <div className={`h-2 w-full rounded-full transition-all duration-500 ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`}></div>
               <span className={`text-[10px] font-black uppercase tracking-widest ${step >= 3 ? 'text-primary' : 'text-gray-300'}`}>Done</span>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start text-[#1a1a1a]">
          {/* Main Flow */}
          <div className="lg:order-1">
            {step === 1 && (
              <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-50 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-2">
                   <div className="h-12 w-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                     <MapPin size={24} />
                   </div>
                   <h2 className="text-3xl font-black">Shipping</h2>
                </div>
                
                <form onSubmit={handleCreateOrder} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Recipient Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input 
                        required
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. John Doe" 
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Email for Receipt</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input 
                        required
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com" 
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Detailed Address</label>
                    <textarea 
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street name, Building number, Floor..." 
                      className="w-full p-6 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 outline-none h-32 transition-all resize-none"
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-primary text-white py-5 rounded-full font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Continue to Payment
                  </button>
                </form>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-50 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-4 mb-2">
                   <div className="h-12 w-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                     <CreditCard size={24} />
                   </div>
                   <h2 className="text-3xl font-black">Payment</h2>
                </div>
                
                <p className="text-gray-400 font-medium">Your transaction is encrypted and secured by Midtrans Snap. We don't store your credit card details.</p>
                
                <div className="space-y-4">
                  <div className="p-6 border-2 border-primary bg-primary/5 rounded-[2rem] flex items-center gap-4 group">
                    <div className="h-10 w-10 bg-primary text-white rounded-xl flex items-center justify-center">
                      <Truck size={20} />
                    </div>
                    <div>
                      <span className="font-bold block">Next Day Delivery</span>
                      <span className="text-xs text-primary font-bold uppercase tracking-widest">Free Shipping</span>
                    </div>
                    <div className="ml-auto font-black text-xl">Rp 0</div>
                  </div>
                </div>

                <div className="pt-10 flex flex-col gap-4">
                  <button 
                    disabled={loading}
                    onClick={handlePayment}
                    className="w-full bg-primary text-white py-6 rounded-full font-black text-xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck />} 
                    {loading ? 'Processing...' : 'Pay with Midtrans'}
                  </button>
                  <button 
                    disabled={loading}
                    onClick={() => setStep(1)}
                    className="text-gray-400 font-bold hover:text-gray-600 flex items-center justify-center gap-2 py-2"
                  >
                    <ArrowLeft size={16} /> Edit Information
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white p-12 rounded-[4rem] text-center space-y-8 shadow-sm border border-gray-50 animate-in zoom-in duration-700">
                <div className="w-28 h-28 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-inner">
                  <CheckCircle2 size={56} />
                </div>
                <div>
                  <h2 className="text-4xl font-black text-[#1a1a1a] mb-4 tracking-tight">Order Confirmed!</h2>
                  <p className="text-gray-400 font-medium max-w-xs mx-auto leading-relaxed">
                    Your coffee beans are already being roasted. Grab your tracking code below.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-3xl border border-dashed border-gray-200 inline-block font-mono text-lg font-black tracking-widest text-primary">
                  #{orderId?.slice(0, 8).toUpperCase()}
                </div>

                <div className="pt-4 flex flex-col gap-4">
                  <Link href={`/order/tracking/${orderId}`} className="inline-flex items-center justify-center gap-2 px-12 py-5 bg-primary text-white rounded-full font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                    Track Live Progress <ArrowLeft className="rotate-180" size={18} />
                  </Link>
                  <Link href="/dashboard" className="text-gray-400 font-bold hover:text-primary transition-colors">Go to My Dashboard</Link>
                </div>
              </div>
            )}
          </div>

          {/* Cart Summary Side */}
          {step !== 3 && (
            <div className="lg:order-2 space-y-6">
              <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-50 sticky top-12">
                <div className="flex items-center gap-3 mb-8">
                  <Package className="text-gray-300" size={20} />
                  <h3 className="text-xl font-black uppercase tracking-widest text-[#1a1a1a]">Order Summary</h3>
                </div>
                
                <div className="space-y-4 mb-10 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center gap-4 group">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-xs font-black text-gray-400 border border-gray-100 italic">
                           x{item.quantity}
                         </div>
                         <div className="font-bold text-sm group-hover:text-primary transition-colors">{item.name}</div>
                      </div>
                      <div className="text-sm font-black whitespace-nowrap">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-8 border-t border-gray-50 text-sm font-bold text-gray-400">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-[#1a1a1a]">Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Tax (10%)</span>
                    <span className="text-[#1a1a1a]">Rp {tax.toLocaleString('id-ID')}</span>
                  </div>
                  {usePoints && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Points Redemption</span>
                      <span className="font-black">- Rp {pointsDiscount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-4 border-t border-gray-100 text-2xl font-black text-[#1a1a1a]">
                    <span>Total Pay</span>
                    <span className="text-primary italic">Rp {total.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-50">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">Voucher Code</label>
                  <div className="space-y-4">
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                        <Ticket size={20} />
                      </div>
                      <input 
                        type="text" 
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        placeholder="MASUKKAN KODE VOUCHER"
                        className="w-full pl-14 pr-5 h-16 bg-gray-50/50 rounded-2xl border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none font-black uppercase text-sm transition-all placeholder:text-gray-300 tracking-widest shadow-sm"
                      />
                    </div>
                    
                    <button 
                      onClick={handleApplyVoucher}
                      disabled={checkingVoucher || !voucherCode}
                      className="w-full h-14 bg-[#1a1a1a] text-white rounded-2xl font-black text-sm hover:bg-black hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-20 disabled:hover:scale-100 shadow-xl shadow-black/10 flex items-center justify-center gap-2 group"
                    >
                      {checkingVoucher ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <>
                          <Sparkles size={18} className="text-amber-400 group-hover:rotate-12 transition-transform" />
                          Apply Voucher
                        </>
                      )}
                    </button>
                  </div>
                  {voucherError && <p className="text-red-500 text-[10px] font-bold mt-2 uppercase tracking-wider">{voucherError}</p>}
                  {appliedVoucher && (
                    <div className="mt-4 p-3 bg-emerald-50 rounded-xl flex items-center justify-between border border-emerald-100">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <Ticket size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">{appliedVoucher.code} (-{appliedVoucher.discount_percent}%)</span>
                      </div>
                      <button onClick={() => setAppliedVoucher(null)} className="text-emerald-400 hover:text-emerald-600">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {availablePoints > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-50">
                    <div 
                      onClick={() => setUsePoints(!usePoints)}
                      className={`p-5 rounded-[2rem] border-2 transition-all cursor-pointer flex items-center justify-between ${usePoints ? 'border-primary bg-primary/5 shadow-inner' : 'border-gray-50 hover:border-gray-100'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${usePoints ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400'}`}>
                          <Star size={24} className={usePoints ? 'fill-white' : ''} />
                        </div>
                        <div>
                          <div className="font-black text-sm text-[#1a1a1a]">Gunakan Semua Poin ({availablePoints.toLocaleString()})</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Potongan Rp {Math.floor(availablePoints / 100).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className={`h-6 w-12 rounded-full relative transition-colors ${usePoints ? 'bg-primary' : 'bg-gray-200'}`}>
                        <div className={`absolute top-1 h-4 w-4 bg-white rounded-full transition-all ${usePoints ? 'right-1' : 'left-1'}`}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-10 p-4 bg-emerald-50/50 rounded-2xl flex items-start gap-3">
                  <ShieldCheck className="text-emerald-500 flex-shrink-0" size={18} />
                  <p className="text-[10px] text-emerald-600 font-bold leading-relaxed uppercase tracking-widest">
                    Your data is safe. We use enterprise-grade encryption for all transactions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
