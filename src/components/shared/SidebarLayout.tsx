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
  ChevronRight,
  Menu, 
  X, 
  Compass,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarLayoutProps {
  children: React.ReactNode;
  user: {
    fullName: string;
    username: string;
    avatarUrl?: string;
  } | null;
}

export default function SidebarLayout({ children, user }: SidebarLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const tripId = params?.tripId as string | undefined;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.href = '/login';
  };

  // Main navigation links
  const mainNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Trips', href: '/trips', icon: Map },
    { name: 'Profile Settings', href: '/profile', icon: User },
  ];

  // Specific trip sub-navigation links
  const tripNavItems = tripId ? [
    { name: 'Trip Overview', href: `/trips/${tripId}`, icon: Compass },
    { name: 'Itinerary', href: `/trips/${tripId}/rundown`, icon: Calendar },
    { name: 'Pengeluaran', href: `/trips/${tripId}/expenses`, icon: DollarSign },
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
      <aside 
        className={`hidden md:flex flex-col relative bg-white border-r border-[oklch(0.90_0.008_70)] shrink-0 sticky top-0 h-screen justify-between shadow-sm transition-all duration-300 ease-in-out ${
          collapsed ? 'w-16 px-2 py-6' : 'w-56 p-6'
        }`}
      >
        {/* Collapse toggle button */}
        <button 
          type="button"
          onClick={() => setCollapsed(!collapsed)} 
          className="absolute -right-3 top-10 bg-white border border-[oklch(0.90_0.008_70)] rounded-full h-6 w-6 p-0 shadow-sm z-50 cursor-pointer flex items-center justify-center hover:bg-[oklch(0.86_0.05_45)] text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.22_0.01_40)]"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        <div className="space-y-6">
          {/* Logo Branding */}
          <div className={`flex items-center transition-all duration-300 ${collapsed ? 'justify-center w-full' : 'gap-3 px-2'}`}>
            <div className={`transition-all duration-300 flex items-center justify-center ${collapsed ? 'w-10 h-10' : 'w-full h-10'}`}>
              <img 
                src="/images/Logo_voluntrip.png" 
                alt="Voluntrip Logo" 
                className="object-contain transition-all duration-300" 
                style={{ 
                  width: collapsed ? '36px' : '140px', 
                  height: collapsed ? '36px' : '40px'
                }}
              />
            </div>
          </div>

          <hr className="border-[oklch(0.90_0.008_70)]" />

          {/* Context switch navigation */}
          {tripId && (
            <div className="space-y-1">
              <Link 
                href="/trips" 
                className={`flex items-center gap-2 text-xs font-semibold uppercase text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.70_0.08_40)] transition-colors py-2 ${
                  collapsed ? 'justify-center' : 'px-2'
                }`}
                title="Back to All Trips"
              >
                <ChevronLeft size={14} /> 
                {!collapsed && <span>All Trips</span>}
              </Link>
              <div className="mt-2 space-y-1">
                {tripNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center transition-all duration-300 rounded-xl font-medium text-sm ${
                        collapsed 
                          ? 'justify-center p-2.5 h-10 w-10 mx-auto' 
                          : 'gap-3 px-3 py-2.5'
                      } ${
                        active 
                          ? 'bg-[oklch(0.86_0.05_45)] text-[oklch(0.70_0.08_40)] font-semibold shadow-sm' 
                          : 'text-[oklch(0.48_0.01_40)] hover:bg-[oklch(0.94_0.008_70)] hover:text-[oklch(0.22_0.01_40)]'
                      }`}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon size={18} className={active ? 'text-[oklch(0.70_0.08_40)]' : ''} />
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main App Navigation */}
          <div className="space-y-1">
            {!collapsed && (
              <span className="text-xs font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)] px-3 block mb-2">
                Navigation
              </span>
            )}
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center transition-all duration-300 rounded-xl font-medium text-sm ${
                    collapsed 
                      ? 'justify-center p-2.5 h-10 w-10 mx-auto' 
                      : 'gap-3 px-3 py-2.5'
                  } ${
                    active 
                      ? 'bg-[oklch(0.94_0.008_70)] text-[oklch(0.22_0.01_40)] font-semibold shadow-sm' 
                      : 'text-[oklch(0.48_0.01_40)] hover:bg-[oklch(0.94_0.008_70)] hover:text-[oklch(0.22_0.01_40)]'
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon size={18} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        <div className={`space-y-3 pt-6 border-t border-[oklch(0.90_0.008_70)] ${collapsed ? 'flex flex-col items-center' : ''}`}>
          {user && (
            collapsed ? (
              <Link href="/profile" title="Profile Settings">
                <img 
                  src={user.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix'} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full object-cover shadow-sm cursor-pointer border border-[oklch(0.90_0.008_70)] p-0.5 bg-gradient-to-tr from-amber-50 to-orange-100" 
                />
              </Link>
            ) : (
              <Link href="/profile" className="px-2 py-1.5 rounded-xl hover:bg-[oklch(0.94_0.008_70)] transition-colors flex items-center gap-3">
                <img 
                  src={user.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix'} 
                  alt="Avatar" 
                  className="w-9 h-9 rounded-full object-cover shrink-0 border border-[oklch(0.90_0.008_70)] p-0.5 bg-gradient-to-tr from-amber-50 to-orange-100" 
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{user.fullName}</p>
                  <p className="text-xs text-[oklch(0.48_0.01_40)] truncate">@{user.username}</p>
                </div>
              </Link>
            )
          )}
          <Button 
            variant="ghost" 
            onClick={handleLogout} 
            className={`text-[oklch(0.48_0.01_40)] hover:text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors ${
              collapsed 
                ? 'justify-center p-2.5 h-10 w-10 mx-auto' 
                : 'w-full justify-start gap-3 text-sm py-2 px-3'
            }`}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
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
                    className="flex items-center gap-2 text-xs font-semibold uppercase text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.70_0.08_40)] py-2 px-2"
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
                              ? 'bg-[oklch(0.86_0.05_45)] text-[oklch(0.70_0.08_40)] font-semibold' 
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
                          ? 'bg-[oklch(0.94_0.008_70)] text-[oklch(0.22_0.01_40)] font-semibold shadow-sm' 
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

            <div className="space-y-4 pt-6 border-t border-[oklch(0.90_0.008_70)]">
              {user && (
                <Link 
                  href="/profile" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-2 py-1.5 rounded-xl hover:bg-[oklch(0.94_0.008_70)] transition-colors flex items-center gap-3"
                >
                  <img 
                    src={user.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix'} 
                    alt="Avatar" 
                    className="w-9 h-9 rounded-full object-cover shrink-0 border border-[oklch(0.90_0.008_70)] p-0.5 bg-gradient-to-tr from-amber-50 to-orange-100" 
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{user.fullName}</p>
                    <p className="text-xs text-[oklch(0.48_0.01_40)] truncate">@{user.username}</p>
                  </div>
                </Link>
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
                  ? 'text-[oklch(0.70_0.08_40)] font-semibold' 
                  : 'text-[oklch(0.48_0.01_40)]'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px]">{item.name.split(' ')[0]}</span>
            </Link>
          );
        })}
        {tripId && (
          <Link
            href={`/trips/${tripId}`}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
              pathname.includes(`/trips/${tripId}`) && !pathname.endsWith('/expenses') && !pathname.endsWith('/rundown')
                ? 'text-[oklch(0.70_0.08_40)] font-semibold' 
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
                ? 'text-[oklch(0.70_0.08_40)] font-semibold' 
                : 'text-[oklch(0.48_0.01_40)]'
            }`}
          >
            <Calendar size={20} />
            <span className="text-[10px]">Itinerary</span>
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
