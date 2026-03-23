'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Coffee, ShoppingBag, LogOut, Banknote } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const menuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/admin/menu', label: 'Menu Management', icon: <Coffee size={20} /> },
    { href: '/admin/orders', label: 'Orders', icon: <ShoppingBag size={20} /> },
    { href: '/admin/vouchers', label: 'Vouchers', icon: <Banknote size={20} /> },
  ];

  return (
    <aside className="w-full md:w-64 bg-[#1a1a1a] text-white p-4 md:p-8 flex flex-row md:flex-col gap-4 md:gap-12 md:sticky md:top-0 md:h-screen overflow-x-auto md:overflow-y-auto whitespace-nowrap md:whitespace-normal no-scrollbar items-center md:items-start z-50 border-b md:border-b-0 border-white/5">
      <div className="text-xl md:text-2xl font-black text-emerald-500 hidden md:block">Kopiden.</div>
      <nav className="flex flex-row md:flex-col gap-2 md:gap-4 flex-grow w-full">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href}
              href={item.href} 
              className={`flex items-center gap-2 md:gap-4 px-3 py-2 md:px-4 md:py-3.5 rounded-xl md:rounded-2xl font-bold flex-shrink-0 transition-all ${
                isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="text-sm md:text-base hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <button 
        onClick={handleLogout}
        className="flex items-center gap-2 md:gap-4 px-3 py-2 md:p-4 text-red-400 hover:text-red-500 transition-colors text-sm md:text-base font-bold"
      >
        <LogOut size={18} className="md:w-5 md:h-5" /> <span className="hidden sm:inline">Logout</span>
      </button>
    </aside>
  );
}
