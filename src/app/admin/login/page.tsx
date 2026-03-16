'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Mail, Lock, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData?.user) {
      // Check if user is an admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profile?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        // Not an admin, sign them out and show error
        await supabase.auth.signOut();
        setError('Access denied. You do not have administrator privileges.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dark theme background pattern for admin */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-emerald-500 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-emerald-700 rounded-full blur-[100px]"></div>
      </div>
      
      <div className="bg-[#242424]/90 backdrop-blur-xl w-full max-w-md rounded-[3rem] p-12 shadow-2xl shadow-emerald-900/20 relative z-10 border border-white/5">
        
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-6">
            <ShieldAlert size={32} />
          </div>
          <div className="text-3xl font-black text-white mb-2">Admin Portal</div>
          <p className="text-gray-400 text-sm">Restricted access required.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-sm font-medium mb-6 text-center border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2 ml-1">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                required
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kopiden.com"
                className="w-full pl-14 pr-6 py-5 bg-[#1a1a1a] text-white border border-white/10 rounded-[1.5rem] outline-none focus:border-emerald-500 transition-all placeholder:text-gray-600"
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                required
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-14 pr-6 py-5 bg-[#1a1a1a] text-white border border-white/10 rounded-[1.5rem] outline-none focus:border-emerald-500 transition-all placeholder:text-gray-600"
              />
            </div>
          </div>

          <button 
            disabled={loading}
            type="submit"
            className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-bold text-lg hover:bg-emerald-500 active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Authorize Access"}
          </button>
        </form>

        <div className="mt-8 text-center">
            <Link href="/" className="text-gray-500 text-sm hover:text-white transition-colors">← Return to Storefront</Link>
        </div>
      </div>
    </div>
  );
}
