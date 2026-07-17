'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { 
  Home, 
  Map, 
  LogOut, 
  Calendar, 
  DollarSign, 
  ChevronLeft, 
  Menu, 
  X, 
  Compass
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarLayoutProps {
  children: React.ReactNode;
  user: {
    fullName: string;
    username: string;
  } | null;
}

export default function SidebarLayout({ children, user }: SidebarLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const tripId = params?.tripId as string | undefined;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Main navigation links
  const mainNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Trips', href: '/trips', icon: Map },
  ];

  // Specific trip sub-navigation links
  const tripNavItems = tripId ? [
    { name: 'Trip Overview', href: `/trips/${tripId}`, icon: Compass },
    { name: 'Itinerary (Rundown)', href: `/trips/${tripId}/rundown`, icon: Calendar },
    { name: 'Budget & Expenses', href: `/trips/${tripId}/expenses`, icon: DollarSign },
  ] : [];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-[oklch(0.98_0.006_70)] text-[oklch(0.22_0.01_40)] flex flex-col md:flex-row">
      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-[oklch(0.90_0.008_70)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/images/Logo_voluntrip.png" alt="Voluntrip Logo" className="h-8 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-[oklch(0.22_0.01_40)]"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </Button>
        </div>
      </header>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[oklch(0.90_0.008_70)] shrink-0 sticky top-0 h-screen p-6 justify-between shadow-sm">
        <div className="space-y-6">
          {/* Logo Branding */}
          <div className="flex items-center gap-3 px-2">
            <img src="/images/Logo_voluntrip.png" alt="Voluntrip Logo" className="h-10 w-auto object-contain" />
          </div>

          <hr className="border-[oklch(0.90_0.008_70)]" />

          {/* Context switch navigation */}
          {tripId && (
            <div className="space-y-1">
              <Link 
                href="/trips" 
                className="flex items-center gap-2 text-xs font-semibold uppercase text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.64_0.22_30)] transition-colors py-2 px-2"
              >
                <ChevronLeft size={14} /> Back to All Trips
              </Link>
              <div className="mt-2 space-y-1">
                {tripNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                        active 
                          ? 'bg-[oklch(0.96_0.02_30)] text-[oklch(0.64_0.22_30)] font-semibold shadow-sm' 
                          : 'text-[oklch(0.48_0.01_40)] hover:bg-[oklch(0.94_0.008_70)] hover:text-[oklch(0.22_0.01_40)]'
                      }`}
                    >
                      <Icon size={18} className={active ? 'text-[oklch(0.64_0.22_30)]' : ''} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main App Navigation */}
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)] px-3 block mb-2">
              Navigation
            </span>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              // Highlight dashboard when no trip is active, or highlight active main items
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    active 
                      ? 'bg-[oklch(0.94_0.008_70)] text-[oklch(0.22_0.01_40)] font-semibold' 
                      : 'text-[oklch(0.48_0.01_40)] hover:bg-[oklch(0.94_0.008_70)] hover:text-[oklch(0.22_0.01_40)]'
                  }`}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Account Info & Logout */}
        <div className="space-y-3 pt-6 border-t border-[oklch(0.90_0.008_70)]">
          {user && (
            <div className="px-2">
              <p className="font-semibold text-sm truncate">{user.fullName}</p>
              <p className="text-xs text-[oklch(0.48_0.01_40)] truncate">@{user.username}</p>
            </div>
          )}
          <Button 
            variant="ghost" 
            onClick={handleLogout} 
            className="w-full justify-start text-[oklch(0.48_0.01_40)] hover:text-red-600 hover:bg-red-50 rounded-xl gap-3 text-sm py-2 px-3 font-medium transition-colors"
          >
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </aside>

      {/* MOBILE NAVIGATION OVERLAY (Drawer) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative flex flex-col w-72 max-w-xs bg-white h-full p-6 justify-between shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/images/Logo_voluntrip.png" alt="Voluntrip Logo" className="h-8 w-auto object-contain" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                  <X size={20} />
                </Button>
              </div>

              <hr className="border-[oklch(0.90_0.008_70)]" />

              {/* Mobile Trip Context Menu */}
              {tripId && (
                <div className="space-y-1">
                  <Link 
                    href="/trips" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-xs font-semibold uppercase text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.64_0.22_30)] py-2 px-2"
                  >
                    <ChevronLeft size={14} /> All Trips
                  </Link>
                  <div className="mt-2 space-y-1">
                    {tripNavItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                            active 
                              ? 'bg-[oklch(0.96_0.02_30)] text-[oklch(0.64_0.22_30)] font-semibold' 
                              : 'text-[oklch(0.48_0.01_40)] hover:bg-[oklch(0.94_0.008_70)]'
                          }`}
                        >
                          <Icon size={18} />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mobile Main Menu */}
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)] px-3 block mb-2">
                  Navigation
                </span>
                {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                        active 
                          ? 'bg-[oklch(0.94_0.008_70)] text-[oklch(0.22_0.01_40)] font-semibold' 
                          : 'text-[oklch(0.48_0.01_40)] hover:bg-[oklch(0.94_0.008_70)]'
                      }`}
                    >
                      <Icon size={18} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-[oklch(0.90_0.008_70)]">
              {user && (
                <div className="px-2">
                  <p className="font-semibold text-sm truncate">{user.fullName}</p>
                  <p className="text-xs text-[oklch(0.48_0.01_40)] truncate">@{user.username}</p>
                </div>
              )}
              <Button 
                variant="ghost" 
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }} 
                className="w-full justify-start text-[oklch(0.48_0.01_40)] hover:text-red-600 hover:bg-red-50 rounded-xl gap-3 text-sm py-2 px-3 font-medium transition-colors"
              >
                <LogOut size={18} />
                Logout
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION (Quick Access when mobile menu is closed) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[oklch(0.90_0.008_70)] px-6 py-2 flex items-center justify-around shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                active 
                  ? 'text-[oklch(0.64_0.22_30)] font-semibold' 
                  : 'text-[oklch(0.48_0.01_40)]'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px]">{item.name}</span>
            </Link>
          );
        })}
        {tripId && (
          <Link
            href={`/trips/${tripId}`}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
              pathname.includes(`/trips/${tripId}`) && !pathname.endsWith('/expenses') && !pathname.endsWith('/rundown')
                ? 'text-[oklch(0.64_0.22_30)] font-semibold' 
                : 'text-[oklch(0.48_0.01_40)]'
            }`}
          >
            <Compass size={20} />
            <span className="text-[10px]">Overview</span>
          </Link>
        )}
        {tripId && (
          <Link
            href={`/trips/${tripId}/rundown`}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
              pathname.endsWith('/rundown')
                ? 'text-[oklch(0.64_0.22_30)] font-semibold' 
                : 'text-[oklch(0.48_0.01_40)]'
            }`}
          >
            <Calendar size={20} />
            <span className="text-[10px]">Itinerary</span>
          </Link>
        )}
        {tripId && (
          <Link
            href={`/trips/${tripId}/expenses`}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
              pathname.endsWith('/expenses')
                ? 'text-[oklch(0.64_0.22_30)] font-semibold' 
                : 'text-[oklch(0.48_0.01_40)]'
            }`}
          >
            <DollarSign size={20} />
            <span className="text-[10px]">Budget</span>
          </Link>
        )}
      </nav>

      {/* CONTENT AREA */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
