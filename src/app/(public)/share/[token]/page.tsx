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
            <div className="w-9 h-9 rounded-xl bg-[oklch(0.64_0.22_30)] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              V
            </div>
            <span className="font-heading font-extrabold text-lg text-[oklch(0.64_0.22_30)] tracking-tight">Voluntrip</span>
          </div>
          <span className="text-[10px] font-bold bg-orange-50 text-[oklch(0.64_0.22_30)] px-3 py-1 rounded-full uppercase tracking-wider">
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

        {/* Public View Tabs */}
        <Tabs defaultValue="rundown" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-white border border-[oklch(0.90_0.008_70)] p-1 h-12 shadow-sm max-w-md mx-auto">
            <TabsTrigger value="rundown" className="rounded-xl text-xs font-semibold data-[state=active]:bg-[oklch(0.96_0.02_30)] data-[state=active]:text-[oklch(0.64_0.22_30)] transition-all">
              Itinerary
            </TabsTrigger>
            <TabsTrigger value="budget" className="rounded-xl text-xs font-semibold data-[state=active]:bg-[oklch(0.96_0.02_30)] data-[state=active]:text-[oklch(0.64_0.22_30)] transition-all">
              Budget & Expenses
            </TabsTrigger>
          </TabsList>

          {/* ITINERARY TAB (Read-only Rundown Days & activities in table format) */}
          <TabsContent value="rundown" className="space-y-8 outline-none">
            {rundown.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[oklch(0.90_0.008_70)] p-12 text-center text-xs text-[oklch(0.48_0.01_40)] w-full">
                Belum ada jadwal yang disusun.
              </div>
            ) : (
              rundown.map((day, idx) => {
                const dayCost = day.activities?.reduce((sum: number, a: any) => sum + (parseFloat(a.cost) || 0), 0) || 0;
                
                return (
                  <Card key={day.id} className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden">
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
                          Total Biaya Hari Ini
                        </span>
                        <span className="font-extrabold text-sm text-teal-600">
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
                                      <div className="flex items-center gap-1">
                                        <MapPin size={12} className="text-orange-500" />
                                        <span>{activity.location}</span>
                                      </div>
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
          </TabsContent>

          {/* BUDGET & EXPENSES TAB (Read-only metrics, pie chart, expenses lists) */}
          <TabsContent value="budget" className="space-y-6 outline-none">
            {/* Summary Progress bar */}
            <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)]">Realisasi Anggaran</span>
                <span className="text-xs font-bold text-[oklch(0.22_0.01_40)]">
                  {formatIDR(totalSpend)} / {formatIDR(totalBudget)} ({budgetPercentage.toFixed(0)}%)
                </span>
              </div>
              <div className="w-full h-3 bg-[oklch(0.94_0.008_70)] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetPercentage > 90 ? 'bg-red-500' : 'bg-[oklch(0.64_0.22_30)]'
                  }`} 
                  style={{ width: `${budgetPercentage}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[oklch(0.48_0.01_40)] font-medium">
                  Terpakai: {formatIDR(totalSpend)}
                </span>
                <span className={`font-semibold ${remainingBudget < 0 ? 'text-red-600' : 'text-teal-600'}`}>
                  {remainingBudget < 0 ? `Over budget: ${formatIDR(Math.abs(remainingBudget))}` : `Sisa: ${formatIDR(remainingBudget)}`}
                </span>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Category Pie Chart */}
              <div className="md:col-span-2 space-y-6">
                <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white p-6 flex flex-col justify-between h-80">
                  <CardTitle className="text-xs font-bold flex items-center gap-1.5 pb-2">
                    <PieChart size={16} className="text-[oklch(0.64_0.22_30)]" /> Kategori Pengeluaran
                  </CardTitle>
                  {chartData.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-xs text-[oklch(0.48_0.01_40)]">
                      Belum ada data pengeluaran dicatat
                    </div>
                  ) : mounted ? (
                    <div className="flex-1 min-h-[180px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ReChartsPie>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatIDR(value as number)} />
                          <Legend 
                            layout="horizontal" 
                            verticalAlign="bottom" 
                            align="center"
                            iconSize={8}
                            iconType="circle"
                            wrapperStyle={{ fontSize: '10px' }}
                          />
                        </ReChartsPie>
                      </ResponsiveContainer>
                    </div>
                  ) : null}
                </Card>

                {/* Expenses list */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold font-heading uppercase tracking-wider text-[oklch(0.48_0.01_40)]">
                    Daftar Pengeluaran
                  </h3>
                  {expenses.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-[oklch(0.90_0.008_70)] p-8 text-center text-xs text-[oklch(0.48_0.01_40)]">
                      Belum ada pengeluaran dicatat.
                    </div>
                  ) : (
                    expenses.map((expense) => (
                      <Card key={expense.id} className="rounded-2xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden">
                        <CardContent className="p-4 flex justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-[oklch(0.22_0.01_40)]">
                                {formatIDR(expense.amount)}
                              </span>
                              <span className="bg-orange-50 text-[oklch(0.64_0.22_30)] font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {expense.category_name || 'Lainnya'}
                              </span>
                            </div>
                            {expense.note && (
                              <p className="text-xs text-[oklch(0.22_0.01_40)] font-medium">{expense.note}</p>
                            )}
                            <p className="text-[10px] text-[oklch(0.48_0.01_40)]">
                              Tanggal: {formatDateString(expense.expense_date)}
                            </p>

                            {/* Splits info */}
                            {expense.participants && expense.participants.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-[oklch(0.90_0.008_70)] mt-1.5">
                                <span className="text-[9px] text-[oklch(0.48_0.01_40)] font-bold uppercase tracking-wider">
                                  Splits:
                                </span>
                                {expense.participants.map((p: any) => (
                                  <span key={p.id} className="text-[9px] bg-teal-50 text-[oklch(0.58_0.16_185)] font-semibold px-2 py-0.5 rounded-md">
                                    {p.participant_name} ({formatIDR(p.share_amount)})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              {/* Splits Balance Summary Widget */}
              <div>
                {trip.expense_mode === 'split' ? (
                  <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white p-6 flex flex-col h-80 overflow-hidden">
                    <CardTitle className="text-xs font-bold flex items-center gap-1.5 pb-2 shrink-0">
                      <Users size={16} className="text-[oklch(0.58_0.16_185)]" /> Ringkasan Split Bill
                    </CardTitle>
                    <p className="text-[10px] text-[oklch(0.48_0.01_40)] pb-4 shrink-0">
                      Tagihan peserta kepada pembuat trip.
                    </p>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {Object.keys(splitBalances).length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-[oklch(0.48_0.01_40)]">
                          Belum ada peserta split bill
                        </div>
                      ) : (
                        Object.keys(splitBalances).map((name) => (
                          <div key={name} className="flex items-center justify-between p-3 rounded-2xl bg-[oklch(0.98_0.006_70)] border border-[oklch(0.90_0.008_70)]">
                            <span className="font-semibold text-xs text-[oklch(0.22_0.01_40)]">{name}</span>
                            <div className="text-right">
                              <span className="text-[8px] uppercase tracking-wider text-[oklch(0.48_0.01_40)] block">
                                Harus Dibayar
                              </span>
                              <span className="font-extrabold text-xs text-[oklch(0.58_0.16_185)]">
                                {formatIDR(splitBalances[name])}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                ) : (
                  <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white p-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[oklch(0.64_0.22_30)]">
                        <Briefcase size={16} />
                      </div>
                      <h4 className="font-bold text-xs">Personal Mode</h4>
                    </div>
                    <p className="text-[10px] text-[oklch(0.48_0.01_40)] leading-relaxed">
                      Trip ini dikelola secara personal. Semua biaya ditanggung perorangan dan tidak dibagi kepada peserta lain.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
