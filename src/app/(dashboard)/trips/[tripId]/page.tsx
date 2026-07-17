'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Share2, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  TrendingDown,
  Briefcase,
  Compass,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trip } from '@/types/trip';

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

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params?.tripId as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [rundown, setRundown] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sharing states
  const [sharingLoading, setSharingLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchTripData = async () => {
    try {
      setLoading(true);
      
      // Fetch trip details
      const tripRes = await fetch(`/api/trips/${tripId}`);
      if (!tripRes.ok) {
        if (tripRes.status === 404) throw new Error('Trip tidak ditemukan');
        throw new Error('Gagal memuat detail trip');
      }
      const tripData = await tripRes.json();
      setTrip(tripData);

      // Fetch expenses for budget summary
      const expRes = await fetch(`/api/expenses?tripId=${tripId}`);
      if (expRes.ok) {
        const expData = await expRes.json();
        setExpenses(expData.expenses || []);
      }

      // Fetch rundown for statistics
      const rundownRes = await fetch(`/api/rundown?tripId=${tripId}`);
      if (rundownRes.ok) {
        const rundownData = await rundownRes.json();
        setRundown(rundownData || []);
      }

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) {
      fetchTripData();
    }
  }, [tripId]);

  // Toggle Sharing
  const handleToggleShare = async () => {
    if (!trip) return;
    setSharingLoading(true);
    try {
      const nextPublicState = !trip.is_public;
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: trip.id,
          isPublic: nextPublicState,
        }),
      });

      if (!res.ok) throw new Error('Gagal memperbarui status sharing');
      const data = await res.json();
      
      setTrip(prev => prev ? {
        ...prev,
        is_public: data.is_public,
        share_token: data.share_token,
      } : null);

    } catch (err: any) {
      alert(err.message);
    } finally {
      setSharingLoading(false);
    }
  };

  // Copy share link
  const handleCopyLink = () => {
    if (!trip || !trip.share_token) return;
    const shareUrl = `${window.location.origin}/share/${trip.share_token}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-[oklch(0.48_0.01_40)]">
        <Loader2 className="animate-spin mb-2" size={32} />
        <p className="text-sm font-medium">Memuat rencana perjalanan...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 border border-red-100 rounded-3xl">
        <AlertCircle size={20} className="shrink-0" />
        <p className="text-sm font-medium">{error || 'Trip tidak ditemukan'}</p>
      </div>
    );
  }

  // Calculate metrics
  const totalBudget = parseFloat(trip.budget_total as any);
  const totalSpend = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  const remainingBudget = totalBudget - totalSpend;
  const totalActivities = rundown.reduce((sum, day) => sum + (day.activities?.length || 0), 0);
  const totalDays = rundown.length;

  const shareUrl = trip.share_token ? `${window.location.origin}/share/${trip.share_token}` : '';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Trip Header Banner */}
      <div className="relative h-64 md:h-80 w-full rounded-3xl overflow-hidden border border-[oklch(0.90_0.008_70)] bg-gradient-to-tr from-orange-200 to-amber-100">
        {trip.cover_image && (
          <img 
            src={trip.cover_image} 
            alt={trip.name} 
            className="w-full h-full object-cover" 
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Banner Details */}
        <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {trip.expense_mode === 'split' ? 'Split Bill' : 'Personal Trip'}
            </span>
            <h1 className="font-heading font-extrabold text-2xl md:text-4xl tracking-tight text-white leading-tight">
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
          
          <div className="bg-white/10 backdrop-blur px-5 py-3 rounded-2xl border border-white/20">
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider block">Total Budget</span>
            <span className="font-heading font-extrabold text-lg md:text-xl">{formatIDR(totalBudget)}</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Spent */}
        <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)]">Terpakai</span>
              <p className="text-xl font-extrabold font-heading text-[oklch(0.22_0.01_40)]">{formatIDR(totalSpend)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[oklch(0.86_0.05_45)] flex items-center justify-center text-[oklch(0.70_0.08_40)]">
              <TrendingDown size={18} />
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Remaining */}
        <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)]">Sisa Budget</span>
              <p className={`text-xl font-extrabold font-heading ${remainingBudget < 0 ? 'text-red-600' : 'text-teal-600'}`}>
                {formatIDR(remainingBudget)}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${remainingBudget < 0 ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-600'}`}>
              <DollarSign size={18} />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Total Days */}
        <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)]">Durasi</span>
              <p className="text-xl font-extrabold font-heading text-[oklch(0.22_0.01_40)]">{totalDays} Hari</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
              <Calendar size={18} />
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Total Activities */}
        <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)]">Kegiatan</span>
              <p className="text-xl font-extrabold font-heading text-[oklch(0.22_0.01_40)]">{totalActivities} Agenda</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
              <Briefcase size={18} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Options & Sharing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation shortcut cards */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold font-heading">Menu Perencanaan</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Rundown Link Card */}
            <Link href={`/trips/${tripId}/rundown`} className="group block">
              <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white hover:shadow-md transition-all p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[oklch(0.86_0.05_45)] flex items-center justify-center text-[oklch(0.70_0.08_40)]">
                  <Calendar size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-base text-[oklch(0.22_0.01_40)] group-hover:text-[oklch(0.70_0.08_40)] transition-colors">
                    Itinerary (Rundown)
                  </h4>
                  <p className="text-xs text-[oklch(0.48_0.01_40)] mt-1 leading-relaxed">
                    Susun jadwal kegiatan harian trip Anda secara visual, atur urutan aktivitas dengan drag and drop.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-[oklch(0.70_0.08_40)] pt-2 group-hover:translate-x-1 transition-transform">
                  Atur Itinerary <ArrowRight size={14} />
                </div>
              </Card>
            </Link>

            {/* Budget & Expenses Link Card */}
            <Link href={`/trips/${tripId}/expenses`} className="group block">
              <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white hover:shadow-md transition-all p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-[oklch(0.38_0.06_210)]">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-base text-[oklch(0.22_0.01_40)] group-hover:text-[oklch(0.38_0.06_210)] transition-colors">
                    Budget & Pengeluaran
                  </h4>
                  <p className="text-xs text-[oklch(0.48_0.01_40)] mt-1 leading-relaxed">
                    Catat pengeluaran trip Anda. Dapatkan visualisasi chart per kategori, dan hitung pembagian biaya bersama teman.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-[oklch(0.38_0.06_210)] pt-2 group-hover:translate-x-1 transition-transform">
                  Atur Keuangan <ArrowRight size={14} />
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Sharing Widget Card */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold font-heading">Bagikan Trip</h3>
          
          <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[oklch(0.86_0.05_45)] flex items-center justify-center text-[oklch(0.70_0.08_40)]">
                <Share2 size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm">Public Link Sharing</h4>
                <p className="text-[10px] text-[oklch(0.48_0.01_40)]">Beri akses lihat ke orang lain</p>
              </div>
            </div>

            <p className="text-xs text-[oklch(0.48_0.01_40)] leading-relaxed">
              Aktifkan link publik agar teman atau keluarga dapat memantau rundown perjalanan Anda tanpa perlu login ke aplikasi.
            </p>

            <div className="space-y-3 pt-2">
              <Button
                variant={trip.is_public ? 'outline' : 'default'}
                onClick={handleToggleShare}
                className={`w-full rounded-xl text-xs h-10 font-medium ${
                  trip.is_public 
                    ? 'border-[oklch(0.90_0.008_70)] hover:bg-[oklch(0.86_0.05_45)]/50 text-[oklch(0.70_0.08_40)]' 
                    : 'bg-[oklch(0.70_0.08_40)] text-white hover:bg-[oklch(0.70_0.08_40)]/90 shadow-sm shadow-rose-100'
                }`}
                disabled={sharingLoading}
              >
                {sharingLoading ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : trip.is_public ? (
                  'Nonaktifkan Link Publik'
                ) : (
                  'Aktifkan Link Publik'
                )}
              </Button>

              {trip.is_public && trip.share_token && (
                <div className="space-y-2 animate-fade-in">
                  <span className="text-[10px] font-bold text-[oklch(0.48_0.01_40)] uppercase tracking-wider block">
                    Link Sharing Aktif:
                  </span>
                  <div className="flex gap-2 items-center">
                    <Input 
                      readOnly 
                      value={shareUrl} 
                      className="rounded-lg border-[oklch(0.90_0.008_70)] text-[10px] h-8 bg-[oklch(0.98_0.006_70)]/50 select-all" 
                    />
                    <Button 
                      size="icon" 
                      onClick={handleCopyLink}
                      className="h-8 w-8 shrink-0 rounded-lg bg-[oklch(0.94_0.008_70)] text-[oklch(0.22_0.01_40)] hover:bg-[oklch(0.90_0.008_70)]"
                    >
                      {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
