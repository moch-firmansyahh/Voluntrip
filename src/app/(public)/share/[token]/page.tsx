'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Compass, 
  Clock, 
  PieChart, 
  Briefcase,
  Layers,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cell, Pie, PieChart as ReChartsPie, ResponsiveContainer, Tooltip, Legend } from 'recharts';

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDateString(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function formatDayDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

const COLORS = ['#FF6B4A', '#0D9488', '#EAB308', '#3B82F6', '#A855F7', '#EC4899', '#10B981'];

export default function PublicSharePage() {
  const params = useParams();
  const token = params?.token as string;

  const [trip, setTrip] = useState<any>(null);
  const [rundown, setRundown] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchSharedData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/share/${token}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Rencana perjalanan tidak ditemukan atau link dinonaktifkan.');
        throw new Error('Gagal memuat rencana perjalanan');
      }
      const data = await res.json();
      
      setTrip(data.trip);
      setRundown(data.rundown || []);
      setExpenses(data.expenses || []);
      setCategories(data.categories || []);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (token) {
      fetchSharedData();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[oklch(0.98_0.006_70)] flex flex-col items-center justify-center p-6 text-[oklch(0.48_0.01_40)]">
        <Loader2 className="animate-spin mb-2" size={36} />
        <p className="text-sm font-semibold">Memuat rencana perjalanan bersama...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-[oklch(0.98_0.006_70)] flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md bg-white border-[oklch(0.90_0.008_70)] p-6 rounded-3xl text-center space-y-4 shadow-sm">
          <AlertCircle size={40} className="mx-auto text-red-500" />
          <h2 className="font-heading font-extrabold text-lg">Error</h2>
          <p className="text-xs text-[oklch(0.48_0.01_40)] leading-relaxed">{error}</p>
        </Card>
      </div>
    );
  }

  // Calculate budget stats
  const totalBudget = parseFloat(trip.budget_total);
  const totalSpend = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  const remainingBudget = totalBudget - totalSpend;
  const budgetPercentage = Math.min((totalSpend / totalBudget) * 100, 100);

  // Group by category for chart
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(item => {
    const catName = item.category_name || 'Lainnya';
    categoryTotals[catName] = (categoryTotals[catName] || 0) + parseFloat(item.amount);
  });
  const chartData = Object.keys(categoryTotals).map(name => ({
    name,
    value: categoryTotals[name]
  }));

  // Group split balances
  const splitBalances: Record<string, number> = {};
  expenses.forEach(item => {
    if (item.participants) {
      item.participants.forEach((p: any) => {
        splitBalances[p.participant_name] = (splitBalances[p.participant_name] || 0) + parseFloat(p.share_amount);
      });
    }
  });

  return (
    <div className="min-h-screen bg-[oklch(0.98_0.006_70)] text-[oklch(0.22_0.01_40)] pb-12">
      {/* BRAND PUBLIC HEADER */}
      <header className="bg-white border-b border-[oklch(0.90_0.008_70)] sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/Logo_voluntrip.png" alt="Voluntrip Logo" className="h-8 w-auto object-contain" />
          </div>
          <span className="text-[10px] font-bold bg-[oklch(0.86_0.05_45)] text-[oklch(0.70_0.08_40)] px-3 py-1 rounded-full uppercase tracking-wider">
            Shared Plan View
          </span>
        </div>
      </header>

      {/* CORE CONTENT */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
        {/* Banner Card */}
        <div className="relative h-64 md:h-80 w-full rounded-3xl overflow-hidden border border-[oklch(0.90_0.008_70)] bg-gradient-to-tr from-orange-200 to-amber-100">
          {trip.cover_image && (
            <img 
              src={trip.cover_image} 
              alt={trip.name} 
              className="w-full h-full object-cover" 
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {trip.expense_mode === 'split' ? 'Split Bill Mode' : 'Personal Trip'}
              </span>
              <h1 className="font-heading font-extrabold text-2xl md:text-3xl tracking-tight text-white leading-tight">
                {trip.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs md:text-sm font-medium text-white/90">
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> {trip.destination}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} /> {formatDateString(trip.start_date)} - {formatDateString(trip.end_date)}
                </span>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur px-5 py-3 rounded-2xl border border-white/20 shrink-0">
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider block">Total Budget</span>
              <span className="font-heading font-extrabold text-base md:text-lg">{formatIDR(totalBudget)}</span>
            </div>
          </div>
        </div>

        {/* Integrated Budget Summary Card */}
        <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[oklch(0.90_0.008_70)]">
            {/* Column 1: Total Budget */}
            <div className="p-6 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)] block">Total Budget Trip</span>
              <span className="font-heading font-extrabold text-xl text-[oklch(0.38_0.06_210)] block">
                {formatIDR(totalBudget)}
              </span>
              <span className="text-[10px] text-[oklch(0.48_0.01_40)] font-medium block">
                Anggaran batas perjalanan
              </span>
            </div>

            {/* Column 2: Total Terpakai */}
            <div className="p-6 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)] block">Total Estimasi Terpakai</span>
              <span className="font-heading font-extrabold text-xl text-[oklch(0.70_0.08_40)] block">
                {formatIDR(
                  rundown.reduce((sum, d) => sum + (d.activities?.reduce((s: number, a: any) => s + (parseFloat(a.cost) || 0), 0) || 0), 0)
                )}
              </span>
              <span className="text-[10px] text-[oklch(0.48_0.01_40)] font-medium block">
                Dari seluruh agenda harian
              </span>
            </div>

            {/* Column 3: Sisa Budget */}
            <div className="p-6 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)] block">Sisa Budget (Ditabulasikan)</span>
              <span className={`font-heading font-extrabold text-xl block ${
                totalBudget - rundown.reduce((sum, d) => sum + (d.activities?.reduce((s: number, a: any) => s + (parseFloat(a.cost) || 0), 0) || 0), 0) < 0 
                  ? 'text-red-500' 
                  : 'text-emerald-600'
              }`}>
                {formatIDR(
                  totalBudget - rundown.reduce((sum, d) => sum + (d.activities?.reduce((s: number, a: any) => s + (parseFloat(a.cost) || 0), 0) || 0), 0)
                )}
              </span>
              <span className="text-[10px] text-[oklch(0.48_0.01_40)] font-medium block">
                {totalBudget - rundown.reduce((sum, d) => sum + (d.activities?.reduce((s: number, a: any) => s + (parseFloat(a.cost) || 0), 0) || 0), 0) < 0 
                  ? '⚠️ Melebihi budget!' 
                  : '✓ Sisa budget aman'}
              </span>
            </div>
          </div>

          {/* Progress bar footer */}
          <div className="px-6 pb-6 pt-2 border-t border-[oklch(0.90_0.008_70)]/40 bg-[oklch(0.98_0.006_70)]/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[oklch(0.48_0.01_40)]">Persentase Terpakai</span>
              <span className="text-[oklch(0.38_0.06_210)]">
                {((rundown.reduce((sum, d) => sum + (d.activities?.reduce((s: number, a: any) => s + (parseFloat(a.cost) || 0), 0) || 0), 0) / (totalBudget || 1)) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-[oklch(0.92_0.008_240)] rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500 bg-[oklch(0.70_0.08_40)]" 
                style={{ 
                  width: `${Math.min((rundown.reduce((sum, d) => sum + (d.activities?.reduce((s: number, a: any) => s + (parseFloat(a.cost) || 0), 0) || 0), 0) / (totalBudget || 1)) * 100, 100)}%` 
                }}
              />
            </div>
          </div>
        </Card>

        {/* Daily Itinerary Section */}
        <div className="space-y-8 pt-4">
          {rundown.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[oklch(0.90_0.008_70)] p-12 text-center text-xs text-[oklch(0.48_0.01_40)] w-full">
              Belum ada jadwal yang disusun.
            </div>
          ) : (
            rundown.map((day, idx) => {
              const dayCost = day.activities?.reduce((sum: number, a: any) => sum + (parseFloat(a.cost) || 0), 0) || 0;
              
              return (
                <Card key={day.id} className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden animate-fade-in">
                  <CardHeader className="pb-3 px-6 pt-6 flex flex-row items-center justify-between bg-gradient-to-r from-orange-50/20 to-transparent border-b border-[oklch(0.90_0.008_70)]/60">
                    <div className="space-y-0.5">
                      <CardTitle className="font-heading text-sm font-extrabold">
                        Hari {idx + 1}
                      </CardTitle>
                      <CardDescription className="text-[10px] font-bold text-[oklch(0.48_0.01_40)] uppercase tracking-wider">
                        {formatDateString(day.day_date)}
                      </CardDescription>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-wider text-[oklch(0.48_0.01_40)] block">
                        Total Hari Ini
                      </span>
                      <span className="font-extrabold text-sm text-[oklch(0.38_0.06_210)]">
                        {formatIDR(dayCost)}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[650px]">
                        <thead>
                          <tr className="bg-[oklch(0.98_0.006_70)]/50 border-b border-[oklch(0.90_0.008_70)] text-[10px] font-bold text-[oklch(0.48_0.01_40)] uppercase tracking-wider">
                            <th className="p-3 pl-6">Waktu (Jam)</th>
                            <th className="p-3">Agenda / Kegiatan</th>
                            <th className="p-3">Lokasi</th>
                            <th className="p-3">Estimasi Biaya</th>
                            <th className="p-3 pr-6">Catatan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {day.activities && day.activities.length > 0 ? (
                            day.activities.map((activity: any) => (
                              <tr key={activity.id} className="border-b border-[oklch(0.90_0.008_70)] hover:bg-[oklch(0.98_0.006_70)]/30 transition-colors">
                                <td className="p-3 pl-6 text-xs font-semibold text-[oklch(0.22_0.01_40)] align-middle whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <Clock size={12} className="text-[oklch(0.48_0.01_40)]" />
                                    {activity.start_time.substring(0, 5)} - {activity.end_time.substring(0, 5)}
                                  </div>
                                </td>
                                <td className="p-3 text-xs font-bold text-[oklch(0.22_0.01_40)] align-middle">
                                  {activity.title}
                                </td>
                                <td className="p-3 text-xs text-[oklch(0.22_0.01_40)] align-middle">
                                  {activity.location ? (
                                    <a 
                                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-teal-600 hover:text-teal-700 hover:underline cursor-pointer"
                                      title="Buka di Google Maps"
                                    >
                                      <MapPin size={12} className="text-orange-500 shrink-0" />
                                      <span className="truncate max-w-[150px]">{activity.location}</span>
                                    </a>
                                  ) : (
                                    <span className="text-[oklch(0.48_0.01_40)] italic">-</span>
                                  )}
                                </td>
                                <td className="p-3 text-xs font-extrabold text-teal-600 align-middle">
                                  {formatIDR(parseFloat(activity.cost || 0))}
                                </td>
                                <td className="p-3 pr-6 text-[11px] text-[oklch(0.48_0.01_40)] italic align-middle max-w-xs truncate">
                                  {activity.note || '-'}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-xs text-[oklch(0.48_0.01_40)]">
                                Belum ada agenda kegiatan untuk hari ini.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
