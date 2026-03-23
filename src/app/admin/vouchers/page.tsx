'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2, Ticket, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Form State
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('10');
  
  const router = useRouter();

  useEffect(() => {
    async function checkAuthAndFetch() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/admin/login');
        return;
      }

      const { data } = await supabase
        .from('vouchers')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setVouchers(data);
      setLoading(false);
    }
    checkAuthAndFetch();
  }, [router]);

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    
    const { data, error } = await supabase
      .from('vouchers')
      .insert({
        code: code.toUpperCase(),
        discount_percent: parseInt(discountPercent),
        is_active: true
      })
      .select()
      .single();

    if (!error && data) {
      setVouchers([data, ...vouchers]);
      setCode('');
      setDiscountPercent('10');
    } else {
      alert(error?.message || 'Failed to create voucher');
    }
    setCreating(false);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('vouchers')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (!error) {
      setVouchers(vouchers.map(v => v.id === id ? { ...v, is_active: !currentStatus } : v));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this voucher?')) return;
    
    const { error } = await supabase
      .from('vouchers')
      .delete()
      .eq('id', id);

    if (!error) {
      setVouchers(vouchers.filter(v => v.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-grow p-4 sm:p-8 md:p-12">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-black">Voucher Management</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Form */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 h-fit">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Plus size={20} className="text-emerald-500" /> 
              Create New Voucher
            </h2>
            <form onSubmit={handleCreateVoucher} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Voucher Code</label>
                <input 
                  required
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. SUMMER25" 
                  className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold uppercase"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Discount Percentage (%)</label>
                <input 
                  required
                  type="number" 
                  min="1"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold"
                />
              </div>
              <button 
                disabled={creating}
                className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
              >
                {creating ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                Create Voucher
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="flex justify-center py-20 text-emerald-500">
                <Loader2 className="animate-spin" size={48} />
              </div>
            ) : vouchers.length === 0 ? (
              <div className="bg-white p-12 rounded-[2.5rem] text-center border border-dashed border-gray-200">
                <Ticket size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No active vouchers</p>
              </div>
            ) : vouchers.map((v) => (
              <div key={v.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex items-center gap-6 group">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xl ${v.is_active ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-50 text-gray-300'}`}>
                   {v.discount_percent}%
                </div>
                <div className="flex-grow">
                   <h3 className="text-lg font-black tracking-tight">{v.code}</h3>
                   <span className={`text-[10px] font-black uppercase tracking-widest ${v.is_active ? 'text-emerald-400' : 'text-gray-300'}`}>
                      {v.is_active ? 'Active' : 'Inactive'}
                   </span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleToggleActive(v.id, v.is_active)}
                    className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${v.is_active ? 'bg-gray-50 text-gray-400 hover:text-orange-500' : 'bg-emerald-500 text-white'}`}
                    title={v.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {v.is_active ? <X size={18} /> : <Check size={18} />}
                  </button>
                  <button 
                    onClick={() => handleDelete(v.id)}
                    className="h-10 w-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
