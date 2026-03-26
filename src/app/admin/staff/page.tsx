'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { supabase } from '@/lib/supabase';
import { Users, ShieldCheck, Coffee, Banknote, Search, Loader2, AlertCircle, Save, UserMinus, Plus } from 'lucide-react';

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'barista' | 'cashier' | 'customer';
  is_active: boolean;
  created_at: string;
};

export default function StaffManagement() {
  const [staff, setStaff] = useState<Profile[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const MAX_STAFF = 3; // Pro Package Limit

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('role', 'customer')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setStaff(data as Profile[]);
    }
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    setSearching(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', searchEmail.trim().toLowerCase())
      .single();

    if (!error && data) {
      setSearchResult(data as Profile);
    } else {
      alert('User not found. Ensure they have signed up first.');
      setSearchResult(null);
    }
    setSearching(false);
  };

  const updateRole = async (userId: string, newRole: string) => {
    // Only limit if PROMOTING from customer to staff
    const isCurrentlyCustomer = !staff.find(s => s.id === userId); // If not in staff list, it's a search result (customer)
    if (isCurrentlyCustomer && newRole !== 'customer' && activeStaffCount >= MAX_STAFF) {
      alert(`Limit Terlampaui! Paket Pro hanya membolehkan maksimal ${MAX_STAFF} akun staff.`);
      return;
    }

    setSaving(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      alert('Error updating role: ' + error.message);
    } else {
      fetchStaff();
      setSearchResult(null);
      setSearchEmail('');
    }
    setSaving(null);
  };

  const activeStaffCount = staff.filter(s => s.role !== 'customer').length;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row text-gray-900">
      <AdminSidebar />

      <main className="flex-grow p-4 sm:p-8 md:p-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3">
              <Users size={32} className="text-primary" /> Staff Management
            </h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
              CONTROL TEAM ACCESS & ROLES
            </p>
          </div>

          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase">Usage Plan</span>
              <span className="text-lg font-black text-primary">{activeStaffCount} / {MAX_STAFF} Accounts</span>
            </div>
            <div className="h-8 w-px bg-gray-100"></div>
            <div className={`h-3 w-3 rounded-full ${activeStaffCount >= MAX_STAFF ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`}></div>
          </div>
        </div>

        {/* Promote / Add Section */}
        <section className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-black mb-6 flex items-center gap-2">
            <Plus size={20} className="text-primary" /> Jalankan Promosi Staff
          </h2>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-grow relative">
              <input
                type="email"
                placeholder="Cari Email Member untuk dipromosikan (Contoh: staff@kopiden.com)"
                className="w-full h-14 pl-12 pr-6 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-primary transition-all font-medium"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            </div>
            <button 
              type="submit" 
              disabled={searching || activeStaffCount >= MAX_STAFF}
              className="h-14 px-8 bg-primary text-white rounded-2xl font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
            >
              {searching ? <Loader2 className="animate-spin" /> : 'Cari Member'}
            </button>
          </form>

          {searchResult && (
            <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-primary font-black shadow-sm">
                  {searchResult.email[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{searchResult.full_name || 'Member No Name'}</div>
                  <div className="text-sm text-gray-500">{searchResult.email}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => updateRole(searchResult.id, 'barista')}
                  className="px-4 py-2 bg-white text-orange-600 border border-orange-100 rounded-xl text-[10px] font-black uppercase hover:bg-orange-50 transition-all"
                >
                  Jadikan Barista
                </button>
                <button 
                  onClick={() => updateRole(searchResult.id, 'cashier')}
                  className="px-4 py-2 bg-white text-amber-600 border border-amber-100 rounded-xl text-[10px] font-black uppercase hover:bg-amber-50 transition-all"
                >
                  Jadikan Kasir
                </button>
                <button 
                  onClick={() => updateRole(searchResult.id, 'admin')}
                  className="px-4 py-2 bg-white text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase hover:bg-red-50 transition-all"
                >
                  Jadikan Admin
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Staff List */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="flex justify-center py-20 text-primary">
              <Loader2 className="animate-spin" size={48} />
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
              <AlertCircle size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Belum ada staff terdaftar</p>
            </div>
          ) : (
            staff.map((member) => (
              <div key={member.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-6 group hover:shadow-md transition-all">
                <div className="flex items-center gap-6">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xl ${
                    member.role === 'admin' ? 'bg-red-50 text-red-500' : 
                    member.role === 'barista' ? 'bg-orange-50 text-orange-500' : 
                    'bg-amber-50 text-amber-500'
                  }`}>
                    {member.role === 'admin' ? <ShieldCheck /> : member.role === 'barista' ? <Coffee /> : <Banknote />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{member.full_name || 'Staff Member'}</h3>
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                        member.role === 'admin' ? 'bg-red-500 text-white' : 
                        member.role === 'barista' ? 'bg-orange-500 text-white' : 
                        'bg-amber-500 text-white'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select 
                      value={member.role}
                      onChange={(e) => updateRole(member.id, e.target.value)}
                      disabled={saving === member.id}
                      className="bg-gray-50 border-none ring-1 ring-gray-100 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary h-11 flex-grow sm:flex-none"
                    >
                      <option value="admin">Admin / Owner</option>
                      <option value="barista">Barista</option>
                      <option value="cashier">Kasir</option>
                      <option value="customer">Demote to Customer</option>
                    </select>
                    
                    <button 
                      onClick={() => updateRole(member.id, 'customer')}
                      className="h-11 w-11 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100"
                      title="Remove Staff"
                    >
                      <UserMinus size={18} />
                    </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
