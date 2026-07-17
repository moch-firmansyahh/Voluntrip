'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  MapPin, 
  Calendar, 
  DollarSign, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  Loader2, 
  AlertCircle,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [budgetTotal, setBudgetTotal] = useState('');
  const [expenseMode, setExpenseMode] = useState<'per_trip' | 'split'>('per_trip');
  const [formLoading, setFormLoading] = useState(false);

  // Load trips
  const fetchTrips = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/trips');
      if (!res.ok) throw new Error('Gagal memuat trips');
      const data = await res.json();
      setTrips(data);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !destination || !startDate || !endDate || !budgetTotal) {
      alert('Semua field wajib diisi kecuali Gambar Cover');
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          destination,
          start_date: startDate,
          end_date: endDate,
          cover_image: coverImage || undefined,
          budget_total: parseFloat(budgetTotal),
          expense_mode: expenseMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat trip');

      setIsCreateOpen(false);
      resetForm();
      fetchTrips();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Open Edit Dialog
  const openEditDialog = (trip: Trip) => {
    setSelectedTrip(trip);
    setName(trip.name);
    setDestination(trip.destination);
    // Format YYYY-MM-DD
    setStartDate(new Date(trip.start_date).toISOString().split('T')[0]);
    setEndDate(new Date(trip.end_date).toISOString().split('T')[0]);
    setCoverImage(trip.cover_image || '');
    setBudgetTotal(trip.budget_total.toString());
    setExpenseMode(trip.expense_mode);
    setIsEditOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip) return;

    setFormLoading(true);
    try {
      const res = await fetch(`/api/trips/${selectedTrip.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          destination,
          start_date: startDate,
          end_date: endDate,
          cover_image: coverImage || undefined,
          budget_total: parseFloat(budgetTotal),
          expense_mode: expenseMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah trip');

      setIsEditOpen(false);
      resetForm();
      fetchTrips();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (tripId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus trip ini? Semua data rundown dan pengeluaran terkait akan ikut dihapus.')) {
      return;
    }

    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus trip');
      fetchTrips();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setName('');
    setDestination('');
    setStartDate('');
    setEndDate('');
    setCoverImage('');
    setBudgetTotal('');
    setExpenseMode('per_trip');
    setSelectedTrip(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold font-heading text-[oklch(0.22_0.01_40)] tracking-tight">Rencana Perjalanan</h2>
          <p className="text-xs text-[oklch(0.48_0.01_40)] font-medium mt-0.5">Kelola seluruh trip dan liburan Anda</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          className="rounded-xl bg-[oklch(0.68_0.14_32)] text-white hover:bg-[oklch(0.68_0.14_32)]/90 gap-1.5 shadow-md shadow-rose-100"
        >
          <Plus size={18} />
          Buat Trip
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-[oklch(0.48_0.01_40)]">
          <Loader2 className="animate-spin mb-2" size={32} />
          <p className="text-sm font-medium">Memuat trip Anda...</p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 border border-red-100 rounded-3xl">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[oklch(0.90_0.008_70)] p-12 text-center text-[oklch(0.48_0.01_40)] space-y-4">
          <FolderOpen size={48} className="mx-auto text-[oklch(0.48_0.01_40)]/30" />
          <div>
            <h3 className="font-bold text-base text-[oklch(0.22_0.01_40)]">Belum ada trip aktif</h3>
            <p className="text-xs mt-1">Mulailah merencanakan trip Anda yang pertama!</p>
          </div>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="rounded-xl bg-[oklch(0.68_0.14_32)] text-white hover:bg-[oklch(0.68_0.14_32)]/90"
          >
            Buat Trip Pertama
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <Card key={trip.id} className="group rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
              <div className="relative h-44 bg-gradient-to-tr from-orange-200 to-amber-100">
                {trip.cover_image ? (
                  <img 
                    src={trip.cover_image} 
                    alt={trip.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-5xl">
                    🏝️
                  </div>
                )}
                {/* Mode Tag */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold text-[oklch(0.68_0.14_32)] shadow-sm uppercase tracking-wider">
                  {trip.expense_mode === 'split' ? 'Split Bill' : 'Per Trip'}
                </div>

                {/* Dropdown Menu */}
                <div className="absolute top-4 right-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="w-8 h-8 rounded-full bg-white/95 backdrop-blur border-none hover:bg-white text-[oklch(0.22_0.01_40)] flex items-center justify-center cursor-pointer outline-none">
                      <MoreVertical size={16} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-[oklch(0.90_0.008_70)] bg-white text-xs">
                      <DropdownMenuItem onClick={() => openEditDialog(trip)} className="flex items-center gap-2 py-2 cursor-pointer">
                        <Edit3 size={14} /> Edit Trip
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(trip.id)} className="flex items-center gap-2 py-2 text-red-600 focus:text-red-700 cursor-pointer">
                        <Trash2 size={14} /> Hapus Trip
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <CardContent className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-heading font-extrabold text-base text-[oklch(0.22_0.01_40)] leading-snug group-hover:text-[oklch(0.68_0.14_32)] transition-colors">
                    {trip.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[oklch(0.48_0.01_40)] font-medium">
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate">{trip.destination}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[oklch(0.48_0.01_40)]">
                    <Calendar size={12} className="shrink-0" />
                    <span>{formatDateString(trip.start_date)} - {formatDateString(trip.end_date)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[oklch(0.90_0.008_70)] flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)] block">
                      Total Budget
                    </span>
                    <span className="font-extrabold text-sm text-[oklch(0.22_0.01_40)]">
                      {formatIDR(parseFloat(trip.budget_total as any))}
                    </span>
                  </div>
                  <Link href={`/trips/${trip.id}`}>
                    <Button size="sm" className="rounded-lg bg-[oklch(0.68_0.14_32)] text-white hover:bg-[oklch(0.68_0.14_32)]/90 text-xs font-semibold px-3 py-1.5 shadow-sm shadow-rose-50">
                      Buka Rencana
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md bg-white border-[oklch(0.90_0.008_70)] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold">Buat Rencana Trip Baru</DialogTitle>
            <DialogDescription className="text-xs text-[oklch(0.48_0.01_40)]">
              Tentukan tujuan, tanggal, budget, dan model pengelolaan keuangan trip Anda.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">Nama Trip</Label>
              <Input 
                id="name" 
                placeholder="Contoh: Liburan ke Bali" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="rounded-xl border-[oklch(0.90_0.008_70)]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="destination" className="text-xs font-semibold">Destinasi</Label>
              <Input 
                id="destination" 
                placeholder="Contoh: Badung, Bali" 
                value={destination} 
                onChange={(e) => setDestination(e.target.value)} 
                className="rounded-xl border-[oklch(0.90_0.008_70)]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="text-xs font-semibold">Tanggal Mulai</Label>
                <Input 
                  id="startDate" 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className="rounded-xl border-[oklch(0.90_0.008_70)] text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate" className="text-xs font-semibold">Tanggal Selesai</Label>
                <Input 
                  id="endDate" 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className="rounded-xl border-[oklch(0.90_0.008_70)] text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="coverImage" className="text-xs font-semibold">URL Cover Image (Opsional)</Label>
              <Input 
                id="coverImage" 
                placeholder="https://images.unsplash.com/photo-..." 
                value={coverImage} 
                onChange={(e) => setCoverImage(e.target.value)} 
                className="rounded-xl border-[oklch(0.90_0.008_70)] text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="budget" className="text-xs font-semibold">Total Budget (IDR)</Label>
                <Input 
                  id="budget" 
                  type="number" 
                  placeholder="5000000" 
                  value={budgetTotal} 
                  onChange={(e) => setBudgetTotal(e.target.value)} 
                  className="rounded-xl border-[oklch(0.90_0.008_70)] text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mode" className="text-xs font-semibold">Model Budget</Label>
                <Select value={expenseMode} onValueChange={(val: any) => setExpenseMode(val)}>
                  <SelectTrigger className="rounded-xl border-[oklch(0.90_0.008_70)] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white text-xs">
                    <SelectItem value="per_trip">Per Trip</SelectItem>
                    <SelectItem value="split">Split Bill</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="rounded-xl text-xs">
                Batal
              </Button>
              <Button type="submit" disabled={formLoading} className="rounded-xl bg-[oklch(0.68_0.14_32)] text-white hover:bg-[oklch(0.68_0.14_32)]/90 text-xs">
                {formLoading ? <Loader2 className="animate-spin mr-1.5" size={14} /> : null}
                Buat Trip
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md bg-white border-[oklch(0.90_0.008_70)] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold">Edit Rencana Trip</DialogTitle>
            <DialogDescription className="text-xs text-[oklch(0.48_0.01_40)]">
              Sesuaikan info tujuan, tanggal, budget, atau model pengeluaran Anda.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-xs font-semibold">Nama Trip</Label>
              <Input 
                id="edit-name" 
                placeholder="Contoh: Liburan ke Bali" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="rounded-xl border-[oklch(0.90_0.008_70)]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-destination" className="text-xs font-semibold">Destinasi</Label>
              <Input 
                id="edit-destination" 
                placeholder="Contoh: Badung, Bali" 
                value={destination} 
                onChange={(e) => setDestination(e.target.value)} 
                className="rounded-xl border-[oklch(0.90_0.008_70)]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-startDate" className="text-xs font-semibold">Tanggal Mulai</Label>
                <Input 
                  id="edit-startDate" 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className="rounded-xl border-[oklch(0.90_0.008_70)] text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-endDate" className="text-xs font-semibold">Tanggal Selesai</Label>
                <Input 
                  id="edit-endDate" 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className="rounded-xl border-[oklch(0.90_0.008_70)] text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-coverImage" className="text-xs font-semibold">URL Cover Image (Opsional)</Label>
              <Input 
                id="edit-coverImage" 
                placeholder="https://images.unsplash.com/photo-..." 
                value={coverImage} 
                onChange={(e) => setCoverImage(e.target.value)} 
                className="rounded-xl border-[oklch(0.90_0.008_70)] text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-budget" className="text-xs font-semibold">Total Budget (IDR)</Label>
                <Input 
                  id="edit-budget" 
                  type="number" 
                  placeholder="5000000" 
                  value={budgetTotal} 
                  onChange={(e) => setBudgetTotal(e.target.value)} 
                  className="rounded-xl border-[oklch(0.90_0.008_70)] text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-mode" className="text-xs font-semibold">Model Budget</Label>
                <Select value={expenseMode} onValueChange={(val: any) => setExpenseMode(val)}>
                  <SelectTrigger className="rounded-xl border-[oklch(0.90_0.008_70)] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white text-xs">
                    <SelectItem value="per_trip">Per Trip</SelectItem>
                    <SelectItem value="split">Split Bill</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-xl text-xs">
                Batal
              </Button>
              <Button type="submit" disabled={formLoading} className="rounded-xl bg-[oklch(0.68_0.14_32)] text-white hover:bg-[oklch(0.68_0.14_32)]/90 text-xs">
                {formLoading ? <Loader2 className="animate-spin mr-1.5" size={14} /> : null}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
