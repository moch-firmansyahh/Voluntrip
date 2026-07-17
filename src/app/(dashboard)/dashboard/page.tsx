import React from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { sql } from '@/lib/supabase';
import { 
  Calendar, 
  MapPin, 
  Layers, 
  Plus, 
  TrendingUp,
  Compass,
  ArrowRight,
  Clock
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

  // Fetch dashboard metrics and upcoming activities in parallel to eliminate database waterfalls (NFR latency optimization)
  const [tripCountRes, upcomingTrips, currentMonthSpend, latestTrips, upcomingActivities] = await Promise.all([
    sql`SELECT COUNT(*)::int as count FROM trips WHERE user_id = ${session.userId}`,
    sql`
      SELECT id, name, destination, start_date, end_date, cover_image, budget_total, expense_mode
      FROM trips 
      WHERE user_id = ${session.userId} AND start_date >= CURRENT_DATE 
      ORDER BY start_date ASC 
      LIMIT 1
    `,
    sql`
      SELECT SUM(ra.cost)::float as total 
      FROM rundown_activities ra
      JOIN rundown_days rd ON ra.rundown_day_id = rd.id
      JOIN trips t ON rd.trip_id = t.id
      WHERE t.user_id = ${session.userId} 
        AND EXTRACT(MONTH FROM rd.day_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM rd.day_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    `,
    sql`
      SELECT id, name, destination, start_date, end_date, cover_image, budget_total, expense_mode
      FROM trips
      WHERE user_id = ${session.userId}
      ORDER BY created_at DESC
      LIMIT 3
    `,
    sql`
      SELECT 
        ra.id,
        ra.title,
        ra.start_time,
        ra.end_time,
        ra.location,
        ra.cost,
        rd.day_date,
        t.name as trip_name,
        t.id as trip_id
      FROM rundown_activities ra
      JOIN rundown_days rd ON ra.rundown_day_id = rd.id
      JOIN trips t ON rd.trip_id = t.id
      WHERE t.user_id = ${session.userId}
        AND rd.day_date >= CURRENT_DATE
      ORDER BY rd.day_date ASC, ra.start_time ASC
      LIMIT 6
    `
  ]);

  const totalTrips = tripCountRes[0]?.count || 0;
  const upcomingTrip = upcomingTrips[0] || null;
  const thisMonthExpenses = currentMonthSpend[0]?.total || 0;

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
          <Button className="rounded-xl bg-[oklch(0.70_0.08_40)] text-white hover:bg-[oklch(0.70_0.08_40)]/90 gap-2 shadow-md shadow-rose-50">
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
            <div className="w-12 h-12 rounded-2xl bg-[oklch(0.86_0.05_45)] flex items-center justify-center text-[oklch(0.70_0.08_40)]">
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
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-[oklch(0.38_0.06_210)]">
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
        {/* Left Column: Upcoming Activities Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-heading text-[oklch(0.38_0.06_210)]">Agenda Selanjutnya (Rundown)</h3>
            <span className="text-xs text-[oklch(0.48_0.01_40)] font-medium">Jadwal kunjungan terdekat</span>
          </div>

          <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[oklch(0.98_0.006_70)] border-b border-[oklch(0.90_0.008_70)] text-[10px] font-bold text-[oklch(0.48_0.01_40)] uppercase tracking-wider">
                    <th className="p-4 pl-6">Tanggal & Waktu</th>
                    <th className="p-4">Trip</th>
                    <th className="p-4">Agenda / Kegiatan</th>
                    <th className="p-4">Lokasi & Navigasi</th>
                    <th className="p-4 pr-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingActivities.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-[oklch(0.48_0.01_40)] space-y-2">
                        <Calendar size={32} className="mx-auto text-[oklch(0.48_0.01_40)]/30 mb-2" />
                        <p className="font-semibold text-sm">Belum ada agenda kegiatan terdekat.</p>
                        <p className="text-[10px] text-[oklch(0.48_0.01_40)]">Silakan buka menu trip Anda dan tambahkan rundown harian baru.</p>
                      </td>
                    </tr>
                  ) : (
                    upcomingActivities.map((act: any) => (
                      <tr key={act.id} className="border-b border-[oklch(0.90_0.008_70)]/60 hover:bg-[oklch(0.98_0.006_70)]/30 transition-colors">
                        {/* Date & Time */}
                        <td className="p-4 pl-6 text-xs text-[oklch(0.22_0.01_40)] align-middle whitespace-nowrap">
                          <span className="font-semibold block">{formatDateString(act.day_date)}</span>
                          <span className="text-[10px] text-[oklch(0.48_0.01_40)] mt-0.5 block flex items-center gap-1">
                            <Clock size={11} /> {act.start_time.substring(0, 5)} - {act.end_time.substring(0, 5)}
                          </span>
                        </td>
                        
                        {/* Trip Name */}
                        <td className="p-4 text-xs font-bold text-[oklch(0.38_0.06_210)] align-middle truncate max-w-[120px]">
                          {act.trip_name}
                        </td>
                        
                        {/* Activity Title */}
                        <td className="p-4 text-xs font-bold text-[oklch(0.22_0.01_40)] align-middle">
                          {act.title}
                        </td>
                        
                        {/* Location & GMaps redirection */}
                        <td className="p-4 text-xs text-[oklch(0.22_0.01_40)] align-middle">
                          {act.location ? (
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.location)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[oklch(0.70_0.08_40)] hover:underline cursor-pointer"
                              title="Navigasi ke Google Maps"
                            >
                              <MapPin size={12} className="text-orange-500 shrink-0" />
                              <span className="truncate max-w-[120px] font-medium">{act.location}</span>
                            </a>
                          ) : (
                            <span className="text-[oklch(0.48_0.01_40)] italic">-</span>
                          )}
                        </td>

                        {/* Action link */}
                        <td className="p-4 pr-6 text-center align-middle whitespace-nowrap">
                          <Link href={`/trips/${act.trip_id}/rundown`}>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="rounded-xl text-[10px] h-8 text-[oklch(0.38_0.06_210)] hover:bg-[oklch(0.86_0.05_45)]/40 hover:text-[oklch(0.38_0.06_210)] font-bold px-3 border border-[oklch(0.90_0.008_70)]"
                            >
                              Itinerary
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Mini Travel Guide / Widget */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold font-heading text-[oklch(0.38_0.06_210)]">Panduan Cepat</h3>
          <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-[oklch(0.22_0.01_40)]">Mulai Perencanaan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-[oklch(0.48_0.01_40)] leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[oklch(0.86_0.05_45)] text-[oklch(0.70_0.08_40)] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <p>Buat trip baru dengan tujuan dan budget keseluruhan trip.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-50 text-[oklch(0.38_0.06_210)] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <p>Susun rundown kegiatan harian secara terstruktur agar perjalanan terarah.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <p>Ketik nama lokasi pada agenda untuk memunculkan pilihan otomatis dari Peta.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">4</span>
                <p>Bagikan link trip publik ke teman perjalanan Anda untuk dipantau bersama.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
