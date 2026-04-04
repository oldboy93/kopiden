'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { supabase } from '@/lib/supabase';
import {
  Clock, Plus, CheckCircle, X, ChevronDown, Loader2,
  Banknote, TrendingUp, ShoppingBag, AlertCircle, Lock,
  Sun, Sunset, Moon, Coffee, DollarSign
} from 'lucide-react';

type Shift = {
  id: string;
  kasir_name: string;
  shift_date: string;
  shift_period: 'pagi' | 'siang' | 'sore' | 'malam';
  opening_cash: number;
  opening_notes: string | null;
  opened_at: string;
  closing_cash: number | null;
  closing_notes: string | null;
  closed_at: string | null;
  total_orders: number;
  total_revenue: number;
  total_cash_revenue: number;
  total_qris_revenue: number;
  total_transfer_revenue: number;
  status: 'open' | 'closed';
};

const PERIOD_CONFIG = {
  pagi:  { label: 'Shift Pagi',  time: '06:00 – 12:00', icon: <Sun size={18} />,     color: 'bg-yellow-500', light: 'bg-yellow-50 text-yellow-600' },
  siang: { label: 'Shift Siang', time: '12:00 – 17:00', icon: <Coffee size={18} />,  color: 'bg-orange-500', light: 'bg-orange-50 text-orange-600' },
  sore:  { label: 'Shift Sore',  time: '17:00 – 21:00', icon: <Sunset size={18} />,  color: 'bg-red-500',    light: 'bg-red-50 text-red-600' },
  malam: { label: 'Shift Malam', time: '21:00 – 06:00', icon: <Moon size={18} />,    color: 'bg-indigo-500', light: 'bg-indigo-50 text-indigo-600' },
};

export default function ShiftsPage() {
  const router = useRouter();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);

  // Modal Buka Shift
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openForm, setOpenForm] = useState({ kasir_name: '', shift_period: 'pagi' as Shift['shift_period'], opening_cash: '', opening_notes: '' });
  const [saving, setSaving] = useState(false);

  // Modal Tutup Shift
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeForm, setCloseForm] = useState({ closing_cash: '', closing_notes: '' });
  const [closingShift, setClosingShift] = useState<Shift | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/admin/login'); return; }

      const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
      if (!profile || profile.role === 'customer') { router.push('/menu'); return; }

      setUserRole(profile.role);
      setCurrentUser({ ...user, full_name: profile.full_name });

      // Pre-fill nama kasir
      setOpenForm(f => ({ ...f, kasir_name: profile.full_name || '' }));

      fetchShifts();
    };
    init();
  }, [router]);

  const fetchShifts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('shifts')
      .select('*')
      .order('opened_at', { ascending: false })
      .limit(30);

    if (data) {
      setShifts(data as Shift[]);
      const open = data.find(s => s.status === 'open');
      setActiveShift(open as Shift | null);
    }
    setLoading(false);
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openForm.kasir_name.trim()) return;
    setSaving(true);

    const { error } = await supabase.from('shifts').insert({
      kasir_id: currentUser?.id,
      kasir_name: openForm.kasir_name.trim(),
      shift_period: openForm.shift_period,
      opening_cash: parseFloat(openForm.opening_cash) || 0,
      opening_notes: openForm.opening_notes || null,
      shift_date: new Date().toISOString().split('T')[0],
      status: 'open',
    });

    setSaving(false);
    if (!error) {
      setShowOpenModal(false);
      setOpenForm(f => ({ ...f, opening_cash: '', opening_notes: '' }));
      fetchShifts();
    } else {
      alert('Error: ' + error.message);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingShift) return;
    setSaving(true);

    // Hitung rekap dari orders yang dibuat selama shift berlangsung
    const { data: ordersInShift } = await supabase
      .from('orders')
      .select('total_price, payment_method, payment_status')
      .eq('payment_status', 'paid')
      .gte('created_at', closingShift.opened_at)
      .lte('created_at', new Date().toISOString());

    const totalRevenue = ordersInShift?.reduce((s, o) => s + Number(o.total_price), 0) || 0;
    const totalOrders = ordersInShift?.length || 0;
    const cashRev = ordersInShift?.filter(o => o.payment_method === 'cash').reduce((s, o) => s + Number(o.total_price), 0) || 0;
    const qrisRev = ordersInShift?.filter(o => o.payment_method === 'qris').reduce((s, o) => s + Number(o.total_price), 0) || 0;
    const transferRev = ordersInShift?.filter(o => o.payment_method === 'transfer').reduce((s, o) => s + Number(o.total_price), 0) || 0;

    const { error } = await supabase.from('shifts').update({
      closing_cash: parseFloat(closeForm.closing_cash) || 0,
      closing_notes: closeForm.closing_notes || null,
      closed_at: new Date().toISOString(),
      status: 'closed',
      total_orders: totalOrders,
      total_revenue: totalRevenue,
      total_cash_revenue: cashRev,
      total_qris_revenue: qrisRev,
      total_transfer_revenue: transferRev,
    }).eq('id', closingShift.id);

    setSaving(false);
    if (!error) {
      setShowCloseModal(false);
      setCloseForm({ closing_cash: '', closing_notes: '' });
      setClosingShift(null);
      fetchShifts();
    } else {
      alert('Error: ' + error.message);
    }
  };

  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row text-gray-900">
      <AdminSidebar />

      <main className="flex-grow p-4 sm:p-8 md:p-12 overflow-x-hidden">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
              <Clock size={30} className="text-emerald-500" /> Operan Shift
            </h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
              Manajemen Shift Jaga & Rekap Harian
            </p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            {activeShift ? (
              <button
                onClick={() => { setClosingShift(activeShift); setShowCloseModal(true); }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95"
              >
                <Lock size={16} /> Tutup Shift
              </button>
            ) : (
              <button
                onClick={() => setShowOpenModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <Plus size={16} /> Buka Shift Baru
              </button>
            )}
          </div>
        </div>

        {/* Active Shift Banner */}
        {activeShift && (
          <div className="bg-emerald-500 text-white p-5 sm:p-6 rounded-[2rem] mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-emerald-500/25 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center">
                {PERIOD_CONFIG[activeShift.shift_period].icon}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-100">Shift Sedang Berjalan</p>
                <h3 className="text-xl font-black">{PERIOD_CONFIG[activeShift.shift_period].label} — {activeShift.kasir_name}</h3>
                <p className="text-emerald-100 text-sm font-medium">
                  Dibuka: {fmtTime(activeShift.opened_at)} · Modal Awal: {fmt(activeShift.opening_cash)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white/20 px-4 py-2 rounded-full animate-pulse">
              <span className="h-2 w-2 bg-white rounded-full"></span> AKTIF
            </div>
          </div>
        )}

        {/* Shift History */}
        {loading ? (
          <div className="flex justify-center py-20 text-emerald-500">
            <Loader2 className="animate-spin" size={40} />
          </div>
        ) : shifts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
            <Clock size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Belum ada shift tercatat</p>
            <p className="text-gray-300 text-xs mt-2">Buka shift pertama untuk mulai mencatat operan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {shifts.map((shift) => {
              const period = PERIOD_CONFIG[shift.shift_period];
              const cashDiff = shift.status === 'closed' && shift.closing_cash !== null
                ? shift.closing_cash - shift.opening_cash - shift.total_cash_revenue
                : null;
              const isProfit = cashDiff !== null && cashDiff >= 0;

              return (
                <div
                  key={shift.id}
                  className={`bg-white rounded-[2rem] shadow-sm border p-5 sm:p-7 transition-all hover:shadow-md ${shift.status === 'open' ? 'border-emerald-200' : 'border-gray-50'}`}
                >
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {/* Period Icon */}
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${period.light}`}>
                      {period.icon}
                    </div>

                    {/* Main Info */}
                    <div className="flex-grow min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-black text-lg">{period.label}</h3>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          shift.status === 'open' ? 'bg-emerald-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {shift.status === 'open' ? '● Aktif' : '✓ Selesai'}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm font-medium mb-3">
                        <span className="font-bold text-gray-800">{shift.kasir_name}</span>
                        {' · '}{fmtDate(shift.shift_date)}
                        {' · '}{fmtTime(shift.opened_at)}
                        {shift.closed_at && ` – ${fmtTime(shift.closed_at)}`}
                      </p>

                      {/* Stats Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-gray-50 rounded-2xl p-3">
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1 flex items-center gap-1"><DollarSign size={10} /> Modal Awal</p>
                          <p className="font-black text-sm">{fmt(shift.opening_cash)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-3">
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1 flex items-center gap-1"><ShoppingBag size={10} /> Total Order</p>
                          <p className="font-black text-sm">{shift.total_orders} pesanan</p>
                        </div>
                        <div className="bg-emerald-50 rounded-2xl p-3">
                          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1 flex items-center gap-1"><TrendingUp size={10} /> Omset</p>
                          <p className="font-black text-sm text-emerald-600">{fmt(shift.total_revenue)}</p>
                        </div>
                        {shift.status === 'closed' && shift.closing_cash !== null && (
                          <div className={`rounded-2xl p-3 ${isProfit ? 'bg-blue-50' : 'bg-red-50'}`}>
                            <p className={`text-[10px] uppercase tracking-widest font-bold mb-1 flex items-center gap-1 ${isProfit ? 'text-blue-400' : 'text-red-400'}`}>
                              <Banknote size={10} /> Selisih Kas
                            </p>
                            <p className={`font-black text-sm ${isProfit ? 'text-blue-600' : 'text-red-600'}`}>
                              {isProfit ? '+' : ''}{fmt(cashDiff!)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Breakdown Pembayaran (jika closed) */}
                      {shift.status === 'closed' && shift.total_revenue > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {shift.total_cash_revenue > 0 && (
                            <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-xl">
                              💵 Tunai: {fmt(shift.total_cash_revenue)}
                            </span>
                          )}
                          {shift.total_qris_revenue > 0 && (
                            <span className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-bold rounded-xl">
                              📱 QRIS: {fmt(shift.total_qris_revenue)}
                            </span>
                          )}
                          {shift.total_transfer_revenue > 0 && (
                            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl">
                              🏦 Transfer: {fmt(shift.total_transfer_revenue)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {(shift.opening_notes || shift.closing_notes) && (
                        <div className="mt-3 space-y-1">
                          {shift.opening_notes && (
                            <p className="text-xs text-gray-500 italic">📝 Buka: {shift.opening_notes}</p>
                          )}
                          {shift.closing_notes && (
                            <p className="text-xs text-gray-500 italic">📝 Tutup: {shift.closing_notes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ===== Modal Buka Shift ===== */}
      {showOpenModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowOpenModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 z-10">
            <button onClick={() => setShowOpenModal(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors">
              <X size={20} className="text-gray-400" />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="h-14 w-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                <Clock size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black">Buka Shift</h2>
                <p className="text-gray-400 text-sm">Catat siapa yang jaga & modal awal kas</p>
              </div>
            </div>

            <form onSubmit={handleOpenShift} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 block">Nama Kasir / Penjaga *</label>
                <input
                  required
                  value={openForm.kasir_name}
                  onChange={e => setOpenForm(f => ({ ...f, kasir_name: e.target.value }))}
                  placeholder="Nama lengkap kasir yang jaga"
                  className="w-full h-12 px-4 rounded-2xl bg-gray-50 ring-1 ring-gray-100 focus:ring-2 focus:ring-emerald-400 font-medium outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 block">Periode Shift *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(PERIOD_CONFIG) as Array<keyof typeof PERIOD_CONFIG>).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setOpenForm(f => ({ ...f, shift_period: p }))}
                      className={`p-3 rounded-2xl text-sm font-bold border-2 transition-all flex items-center gap-2 ${
                        openForm.shift_period === p
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-100 text-gray-400 hover:border-gray-200'
                      }`}
                    >
                      {PERIOD_CONFIG[p].icon} {PERIOD_CONFIG[p].label.replace('Shift ', '')}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1 ml-1">{PERIOD_CONFIG[openForm.shift_period].time}</p>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 block">Modal Kas Awal (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={openForm.opening_cash}
                  onChange={e => setOpenForm(f => ({ ...f, opening_cash: e.target.value }))}
                  placeholder="Contoh: 200000"
                  className="w-full h-12 px-4 rounded-2xl bg-gray-50 ring-1 ring-gray-100 focus:ring-2 focus:ring-emerald-400 font-medium outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 block">Catatan (Opsional)</label>
                <textarea
                  value={openForm.opening_notes}
                  onChange={e => setOpenForm(f => ({ ...f, opening_notes: e.target.value }))}
                  placeholder="Misalnya: Stok kopi tersisa sedikit, tolong segera order"
                  rows={2}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 ring-1 ring-gray-100 focus:ring-2 focus:ring-emerald-400 font-medium outline-none transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full h-14 bg-emerald-500 text-white rounded-2xl font-black text-base uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={20} className="animate-spin" /> : <><CheckCircle size={20} /> Mulai Shift</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== Modal Tutup Shift ===== */}
      {showCloseModal && closingShift && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCloseModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 z-10">
            <button onClick={() => setShowCloseModal(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors">
              <X size={20} className="text-gray-400" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                <Lock size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black">Tutup Shift</h2>
                <p className="text-gray-400 text-sm">{PERIOD_CONFIG[closingShift.shift_period].label} — {closingShift.kasir_name}</p>
              </div>
            </div>

            {/* Info shift yang akan ditutup */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between font-medium">
                <span className="text-gray-500">Dibuka pukul</span>
                <span className="font-bold">{new Date(closingShift.opened_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-gray-500">Modal awal kas</span>
                <span className="font-bold">{fmt(closingShift.opening_cash)}</span>
              </div>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 block">Jumlah Kas Akhir (Rp) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={closeForm.closing_cash}
                  onChange={e => setCloseForm(f => ({ ...f, closing_cash: e.target.value }))}
                  placeholder="Hitung uang tunai yang ada sekarang"
                  className="w-full h-12 px-4 rounded-2xl bg-gray-50 ring-1 ring-gray-100 focus:ring-2 focus:ring-red-400 font-medium outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 block">Catatan Operan (Opsional)</label>
                <textarea
                  value={closeForm.closing_notes}
                  onChange={e => setCloseForm(f => ({ ...f, closing_notes: e.target.value }))}
                  placeholder="Pesan untuk shift berikutnya, kondisi toko, dll."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 ring-1 ring-gray-100 focus:ring-2 focus:ring-red-400 font-medium outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 p-4 rounded-2xl">
                <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                  Rekap omset & pembayaran akan <strong>dihitung otomatis</strong> dari semua pesanan selama shift ini berlangsung.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full h-14 bg-red-500 text-white rounded-2xl font-black text-base uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/25 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={20} className="animate-spin" /> : <><Lock size={20} /> Selesaikan Shift</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
