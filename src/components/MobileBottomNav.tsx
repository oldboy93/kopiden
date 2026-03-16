'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Coffee, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  // Hide nav on these routes
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register')
  ) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex justify-around items-center p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe rounded-t-2xl">
      <Link 
        href="/" 
        className={`flex flex-col items-center gap-1 p-2 transition-colors ${pathname === '/' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
      >
        <Home size={24} className={pathname === '/' ? 'fill-primary/20' : ''} />
        <span className="text-[10px] font-bold">Home</span>
      </Link>
      
      <Link 
        href="/menu" 
        className={`flex flex-col items-center gap-1 p-2 transition-colors ${pathname.startsWith('/menu') ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
      >
        <Coffee size={24} className={pathname.startsWith('/menu') ? 'fill-primary/20' : ''} />
        <span className="text-[10px] font-bold">Menu</span>
      </Link>
      
      <Link 
        href="/cart" 
        className={`relative flex flex-col items-center gap-1 p-2 transition-colors ${pathname === '/cart' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
      >
        <div className="relative">
          <ShoppingBag size={24} className={pathname === '/cart' ? 'fill-primary/20' : ''} />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-2 h-4 w-4 bg-primary text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">
              {totalItems}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold">Cart</span>
      </Link>
      
      <Link 
        href="/dashboard" 
        className={`flex flex-col items-center gap-1 p-2 transition-colors ${pathname === '/dashboard' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
      >
        <User size={24} className={pathname === '/dashboard' ? 'fill-primary/20' : ''} />
        <span className="text-[10px] font-bold">Profile</span>
      </Link>
    </nav>
  );
}
