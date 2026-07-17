import React from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { sql } from '@/lib/supabase';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Layers, 
  Plus, 
  ArrowRight,
  TrendingUp,
  Compass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';

// Format currency
function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

// Format date
function formatDateString(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  // 1. Fetch total trips count
  const tripCountRes = await sql`
    SELECT COUNT(*)::int as count FROM trips WHERE user_id = ${session.userId}
  `;
  const totalTrips = tripCountRes[0]?.count || 0;

  // 2. Fetch nearest upcoming trip
  const upcomingTrips = await sql`
    SELECT id, name, destination, start_date, end_date, cover_image, budget_total, expense_mode
    FROM trips 
    WHERE user_id = ${session.userId} AND start_date >= CURRENT_DATE 
    ORDER BY start_date ASC 
    LIMIT 1
  `;
  const upcomingTrip = upcomingTrips[0] || null;

  // 3. Fetch total spending this month
  const currentMonthSpend = await sql`
    SELECT SUM(e.amount)::float as total 
    FROM expenses e
    JOIN trips t ON e.trip_id = t.id
    WHERE t.user_id = ${session.userId} 
      AND EXTRACT(MONTH FROM e.expense_date) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM e.expense_date) = EXTRACT(YEAR FROM CURRENT_DATE)
  `;
  const thisMonthExpenses = currentMonthSpend[0]?.total || 0;

  // 4. Fetch list of latest 3 trips
  const latestTrips = await sql`
    SELECT id, name, destination, start_date, end_date, cover_image, budget_total, expense_mode
    FROM trips
    WHERE user_id = ${session.userId}
    ORDER BY created_at DESC
    LIMIT 3
  `;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-[oklch(0.90_0.008_70)] bg-gradient-to-br from-orange-50/20 to-transparent">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-heading text-[oklch(0.22_0.01_40)] tracking-tight">
            Halo, {session.fullName}! 👋
          </h2>
          <p className="text-sm text-[oklch(0.48_0.01_40)] mt-1.5 font-medium">
            Siap merencanakan liburan berikutnya? Atur rundown dan budget Anda di sini.
          </p>
        </div>
        <Link href="/trips">
          <Button className="rounded-xl bg-[oklch(0.64_0.22_30)] text-white hover:bg-[oklch(0.64_0.22_30)]/90 gap-2 shadow-md shadow-orange-100">
            <Plus size={18} />
            Buat Trip Baru
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Trips */}
        <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)]">Total Perjalanan</span>
              <p className="text-3xl font-extrabold font-heading text-[oklch(0.22_0.01_40)]">{totalTrips}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[oklch(0.64_0.22_30)]">
              <Layers size={22} />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Current Month Expenses */}
        <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)]">Pengeluaran Bulan Ini</span>
              <p className="text-2xl font-extrabold font-heading text-[oklch(0.22_0.01_40)]">{formatIDR(thisMonthExpenses)}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-[oklch(0.58_0.16_185)]">
              <TrendingUp size={22} />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Upcoming Trip Info */}
        <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            {upcomingTrip ? (
              <div className="space-y-1 w-3/4">
                <span className="text-xs font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)]">Trip Terdekat</span>
                <p className="text-base font-extrabold font-heading text-[oklch(0.22_0.01_40)] truncate">{upcomingTrip.name}</p>
                <p className="text-xs text-[oklch(0.48_0.01_40)] flex items-center gap-1">
                  <Calendar size={12} /> {formatDateString(upcomingTrip.start_date)}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)]">Trip Terdekat</span>
                <p className="text-sm font-semibold text-[oklch(0.48_0.01_40)]">Belum ada trip terdekat</p>
              </div>
            )}
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
              <Calendar size={22} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Trips list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-heading">Trip Terbaru</h3>
            <Link href="/trips" className="text-xs font-semibold text-[oklch(0.64_0.22_30)] flex items-center gap-1 hover:underline">
              Lihat semua <ArrowRight size={14} />
            </Link>
          </div>

          <div className="space-y-4">
            {latestTrips.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[oklch(0.90_0.008_70)] p-8 text-center text-[oklch(0.48_0.01_40)] space-y-3">
                <Compass size={40} className="mx-auto text-[oklch(0.48_0.01_40)]/40" />
                <p className="text-sm font-medium">Anda belum membuat rencana perjalanan.</p>
                <Link href="/trips">
                  <Button variant="outline" className="rounded-xl mt-2 text-xs">Buat Trip Sekarang</Button>
                </Link>
              </div>
            ) : (
              latestTrips.map((trip: any) => (
                <Link key={trip.id} href={`/trips/${trip.id}`} className="block group">
                  <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white hover:shadow-md transition-all overflow-hidden">
                    <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {trip.cover_image ? (
                          <img 
                            src={trip.cover_image} 
                            alt={trip.name} 
                            className="w-14 h-14 rounded-2xl object-cover" 
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-orange-50/50 text-[oklch(0.64_0.22_30)] flex items-center justify-center font-bold text-lg">
                            🏝️
                          </div>
                        )}
                        <div className="space-y-1">
                          <h4 className="font-bold text-base text-[oklch(0.22_0.01_40)] group-hover:text-[oklch(0.64_0.22_30)] transition-colors">
                            {trip.name}
                          </h4>
                          <p className="text-xs text-[oklch(0.48_0.01_40)] flex items-center gap-1 font-medium">
                            <MapPin size={12} /> {trip.destination}
                          </p>
                          <p className="text-xs text-[oklch(0.48_0.01_40)]">
                            {formatDateString(trip.start_date)} - {formatDateString(trip.end_date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)] block">
                            Budget
                          </span>
                          <span className="font-extrabold text-sm text-[oklch(0.22_0.01_40)]">
                            {formatIDR(parseFloat(trip.budget_total))}
                          </span>
                        </div>
                        <div className="px-3 py-1 rounded-full text-[10px] font-bold bg-orange-50 text-[oklch(0.64_0.22_30)] capitalize">
                          {trip.expense_mode === 'split' ? 'Split Bill' : 'Per Trip'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Mini Travel Guide / Widget */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold font-heading">Travel Tips</h3>
          <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-[oklch(0.22_0.01_40)]">Mulai Perencanaan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-[oklch(0.48_0.01_40)] leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-50 text-[oklch(0.64_0.22_30)] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <p>Buat trip baru dengan tujuan dan budget keseluruhan trip.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-50 text-[oklch(0.58_0.16_185)] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <p>Susun rundown kegiatan harian secara terstruktur agar perjalanan terarah.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <p>Catat pengeluaran secara real-time. Gunakan fitur split bill jika pergi bersama teman.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">4</span>
                <p>Bagikan link trip publik ke teman perjalanan Anda untuk dilihat bersama.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
