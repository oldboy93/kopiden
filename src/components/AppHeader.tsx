'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, User, ArrowLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface AppHeaderProps {
  /** Show a back button instead of logo navigation */
  backHref?: string;
  backLabel?: string;
  /** Page title shown in center on mobile */
  title?: string;
  /** Extra action shown on the right (desktop only handled naturally) */
  rightAction?: React.ReactNode;
}

export default function AppHeader({
  backHref,
  backLabel,
  title,
  rightAction,
}: AppHeaderProps) {
  const pathname = usePathname();
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-8 h-16">
        {/* Left: Logo or Back */}
        <div className="flex items-center gap-3 min-w-[120px]">
          {backHref ? (
            <Link
              href={backHref}
              className="flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all text-sm"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">{backLabel || 'Back'}</span>
            </Link>
          ) : (
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-black text-primary tracking-tighter">
                Kopiden
              </span>
              <span className="hidden md:inline text-xs text-gray-400 font-medium pt-1">
                by UAY
              </span>
            </Link>
          )}
        </div>

        {/* Center: Page title (mobile) or Desktop Nav */}
        <div className="flex-1 flex items-center justify-center">
          {/* Page title on mobile */}
          {title && (
            <span className="md:hidden text-sm font-black text-gray-900 tracking-wide">
              {title}
            </span>
          )}
          {/* Desktop nav */}
          {!backHref && (
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <Link
                href="/"
                className={`transition-colors hover:text-primary ${pathname === '/' ? 'text-primary font-bold' : 'text-gray-500'}`}
              >
                Home
              </Link>
              <Link
                href="/menu"
                className={`transition-colors hover:text-primary ${pathname.startsWith('/menu') ? 'text-primary font-bold' : 'text-gray-500'}`}
              >
                Menu
              </Link>
              <Link
                href="/dashboard"
                className={`transition-colors hover:text-primary ${pathname === '/dashboard' ? 'text-primary font-bold' : 'text-gray-500'}`}
              >
                Account
              </Link>
            </nav>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 min-w-[120px] justify-end">
          {rightAction || (
            <>
              {/* Cart Icon */}
              <Link
                href="/cart"
                className={`relative p-2.5 rounded-xl transition-colors ${
                  pathname === '/cart'
                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                aria-label="Cart"
              >
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-black border border-white">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>
              {/* Profile Icon */}
              <Link
                href="/dashboard"
                className={`p-2.5 rounded-xl transition-colors hidden md:flex ${
                  pathname === '/dashboard'
                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                aria-label="Dashboard"
              >
                <User size={20} />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
