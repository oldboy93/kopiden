'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Mail, Lock, User, ArrowLeft } from 'lucide-react';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData?.user) {
      // 2. Create profile entry
      // Note: We'll assume a trigger handles this in a real prod app, 
      // but for robustness we'll ensure the profile exists.
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: authData.user.id, 
            full_name: fullName, 
            email: email,
            role: 'user' 
          }
        ]);

      if (profileError && profileError.code !== '23505') { // Ignore if already exists (trigger handled it)
        console.error('Profile creation error:', profileError);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm"></div>
      
      <div className="bg-white/90 backdrop-blur-xl w-full max-w-md rounded-[3rem] p-12 shadow-2xl relative z-10 border border-white/20">
        <Link href="/login" className="inline-flex items-center gap-2 text-primary font-bold mb-10 hover:gap-3 transition-all">
          <ArrowLeft size={20} /> Back to Login
        </Link>
        
        <div className="mb-10 text-center">
          <div className="text-3xl font-black text-primary mb-2">Join the Family.</div>
          <p className="text-gray-400">Start your coffee journey today.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-medium mb-6 text-center border border-red-100">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-50 text-green-600 p-8 rounded-3xl text-center border border-green-100 animate-in zoom-in duration-500">
            <div className="text-5xl mb-4">🎉</div>
            <div className="font-bold text-xl mb-2">Welcome Aboard!</div>
            <p className="text-sm opacity-80">Your account has been created successfully. Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="relative">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input 
                  required
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm"
                />
              </div>
            </div>

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
              {loading ? <Loader2 className="animate-spin" /> : "Sign Up"}
            </button>
          </form>
        )}

        {!success && (
          <div className="mt-10 text-center text-gray-400 text-sm">
            Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Sign In</Link>
          </div>
        )}
      </div>
    </div>
  );
}
