'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Mail, Lock, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm"></div>
      
      <div className="bg-white/90 backdrop-blur-xl w-full max-w-md rounded-[3rem] p-12 shadow-2xl relative z-10 border border-white/20">
        <Link href="/" className="inline-flex items-center gap-2 text-primary font-bold mb-10 hover:gap-3 transition-all">
          <ArrowLeft size={20} /> Back to Shop
        </Link>
        
        <div className="mb-10 text-center">
          <div className="text-3xl font-black text-primary mb-2">Welcome Back.</div>
          <p className="text-gray-400">Coffee is waiting for you.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-medium mb-6 text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
              <input 
                required
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
              <input 
                required
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm"
              />
            </div>
          </div>

          <button 
            disabled={loading}
            type="submit"
            className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
          </button>
        </form>

        <div className="mt-10 text-center text-gray-400 text-sm">
          Don't have an account? <Link href="/register" className="text-primary font-bold hover:underline">Join the family</Link>
        </div>
      </div>
    </div>
  );
}
