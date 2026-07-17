'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  Plus, 
  Trash2, 
  MapPin, 
  Clock, 
  Loader2, 
  AlertCircle,
  GripVertical,
  DollarSign,
  TrendingDown,
  Percent,
  Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trip } from '@/types/trip';
import { RundownDay, RundownActivity } from '@/types/rundown';

// DND kit imports for sorting table rows
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function formatDayDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short'
  });
}

// SORTABLE TABLE ROW
interface SortableRowProps {
  activity: RundownActivity;
  onDelete: (id: string) => void;
  onEdit: (activity: RundownActivity) => void;
}

function SortableRow({ activity, onDelete, onEdit }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      className="border-b border-[oklch(0.90_0.008_70)] hover:bg-[oklch(0.98_0.006_70)]/40 transition-colors"
    >
      <td className="p-3 text-center align-middle shrink-0 w-8">
        <button 
          type="button" 
          {...attributes} 
          {...listeners} 
          className="cursor-grab text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.22_0.01_40)] p-1 rounded hover:bg-[oklch(0.94_0.008_70)] outline-none"
        >
          <GripVertical size={14} />
        </button>
      </td>
      <td className="p-3 text-xs font-semibold text-[oklch(0.22_0.01_40)] align-middle whitespace-nowrap">
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
        {formatIDR(parseFloat(activity.cost as any || 0))}
      </td>
      <td className="p-3 text-[11px] text-[oklch(0.48_0.01_40)] italic align-middle max-w-xs truncate">
        {activity.note || '-'}
      </td>
      <td className="p-3 text-center align-middle whitespace-nowrap shrink-0">
        <div className="flex items-center justify-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onEdit(activity)}
            className="text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.22_0.01_40)] h-7 w-7 rounded-lg"
          >
            <Edit2 size={13} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onDelete(activity.id)}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 w-7 rounded-lg"
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </td>
    </tr>
  );
}

// MAIN PAGE COMPONENT
export default function RundownPage() {
  const params = useParams();
  const tripId = params?.tripId as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<RundownDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<RundownActivity | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [cost, setCost] = useState('0');
  const [note, setNote] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const fetchRundownData = async () => {
    try {
      setLoading(true);
      const tripRes = await fetch(`/api/trips/${tripId}`);
      if (!tripRes.ok) throw new Error('Trip tidak ditemukan');
      const tripData = await tripRes.json();
      setTrip(tripData);

      const rundownRes = await fetch(`/api/rundown?tripId=${tripId}`);
      if (!rundownRes.ok) throw new Error('Gagal memuat rundown trip');
      const rundownData = await rundownRes.json();
      
      setDays(rundownData || []);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) {
      fetchRundownData();
    }
  }, [tripId]);

  // Open Form Modal for Create
  const openAddModal = (dayId: string) => {
    setSelectedDayId(dayId);
    setEditingActivity(null);
    setTitle('');
    setLocation('');
    setStartTime('08:00');
    setEndTime('09:00');
    setCost('0');
    setNote('');
    setIsOpen(true);
  };

  // Open Form Modal for Edit
  const openEditModal = (activity: RundownActivity) => {
    setEditingActivity(activity);
    setSelectedDayId(activity.rundown_day_id);
    setTitle(activity.title);
    setLocation(activity.location || '');
    setStartTime(activity.start_time.substring(0, 5));
    setEndTime(activity.end_time.substring(0, 5));
    setCost(activity.cost.toString());
    setNote(activity.note || '');
    setIsOpen(true);
  };

  // Submit Activity Form (handles both Create and Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime || !selectedDayId) {
      alert('Tolong isi judul dan waktu kegiatan');
      return;
    }

    setFormLoading(true);
    try {
      const url = editingActivity ? `/api/rundown/${editingActivity.id}` : '/api/rundown';
      const method = editingActivity ? 'PUT' : 'POST';
      
      let parsedCost = parseFloat(cost) || 0;
      if (parsedCost > 0 && parsedCost < 10000) {
        parsedCost = parsedCost * 1000;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rundownDayId: selectedDayId,
          title,
          location,
          start_time: startTime,
          end_time: endTime,
          cost: parsedCost,
          note,
        }),
      });

      if (!res.ok) throw new Error('Gagal menyimpan kegiatan');
      
      setIsOpen(false);
      fetchRundownData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Activity
  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus agenda kegiatan ini?')) return;
    try {
      const res = await fetch(`/api/rundown/${activityId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus kegiatan');
      
      fetchRundownData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Drag & Drop Handler (Within the same day)
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the container day index
    let dayIndex = -1;
    days.forEach((day, index) => {
      if (day.activities?.find(a => a.id === activeId)) {
        dayIndex = index;
      }
    });

    if (dayIndex === -1) return;

    const day = days[dayIndex];
    const activities = [...(day.activities || [])];
    const activeIdx = activities.findIndex(a => a.id === activeId);
    const overIdx = activities.findIndex(a => a.id === overId);

    if (activeIdx !== -1 && overIdx !== -1) {
      const reordered = arrayMove(activities, activeIdx, overIdx);

      // Update locally
      setDays(prevDays => {
        const newDays = [...prevDays];
        newDays[dayIndex].activities = reordered;
        return newDays;
      });

      // Sync with API
      const payload = reordered.map((item, idx) => ({
        id: item.id,
        rundown_day_id: day.id,
        order_index: idx
      }));

      try {
        await fetch('/api/rundown/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activities: payload })
        });
      } catch (error) {
        console.error('Failed to sync reorder:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-[oklch(0.48_0.01_40)]">
        <Loader2 className="animate-spin mb-2" size={32} />
        <p className="text-sm font-medium">Memuat tabel rundown...</p>
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

  // Calculate Itinerary costs summary
  const totalTripBudget = parseFloat(trip.budget_total as any);
  let totalItineraryCost = 0;
  days.forEach(day => {
    day.activities?.forEach(act => {
      totalItineraryCost += parseFloat(act.cost as any || 0);
    });
  });
  const budgetRatio = Math.min((totalItineraryCost / totalTripBudget) * 100, 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href={`/trips/${tripId}`} className="flex items-center gap-1.5 text-xs font-semibold text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.68_0.14_32)] transition-colors">
            <ArrowLeft size={14} /> Back to Overview
          </Link>
          <h2 className="text-2xl font-extrabold font-heading text-[oklch(0.22_0.01_40)] tracking-tight">
            Itinerary & Rencana Kegiatan
          </h2>
          <p className="text-xs text-[oklch(0.48_0.01_40)] font-medium">Satukan waktu kunjungan, lokasi, dan estimasi biaya per agenda</p>
        </div>
      </div>

      {/* Integrated Budget Summary Card */}
      <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)] block">Total Biaya Agenda</span>
          <span className="font-heading font-extrabold text-2xl text-teal-600">{formatIDR(totalItineraryCost)}</span>
          <span className="text-[10px] text-[oklch(0.48_0.01_40)] font-medium block">
            dari budget {formatIDR(totalTripBudget)}
          </span>
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[oklch(0.48_0.01_40)]">Rasio Budget Terpakai</span>
            <span className={totalItineraryCost > totalTripBudget ? 'text-red-600' : 'text-teal-600'}>
              {budgetRatio.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-3 bg-[oklch(0.94_0.008_70)] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                totalItineraryCost > totalTripBudget ? 'bg-red-500' : 'bg-teal-600'
              }`} 
              style={{ width: `${budgetRatio}%` }}
            />
          </div>
          <p className="text-[10px] text-[oklch(0.48_0.01_40)] font-medium">
            {totalItineraryCost > totalTripBudget 
              ? '⚠️ Anggaran agenda melebihi budget trip! Sesuaikan biaya kegiatan Anda.' 
              : '✓ Estimasi anggaran kegiatan Anda masih aman.'}
          </p>
        </div>
      </Card>

      {/* Daily Tables List */}
      <div className="space-y-8">
        {days.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[oklch(0.90_0.008_70)] p-12 text-center text-xs text-[oklch(0.48_0.01_40)]">
            Belum ada rundown hari yang dibuat.
          </div>
        ) : (
          days.map((day, dIdx) => {
            // Calculate day total cost
            const dayCost = day.activities?.reduce((sum, a) => sum + (parseFloat(a.cost as any) || 0), 0) || 0;

            return (
              <Card key={day.id} className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden">
                <CardHeader className="pb-3 px-6 pt-6 flex flex-row items-center justify-between bg-gradient-to-r from-orange-50/20 to-transparent border-b border-[oklch(0.90_0.008_70)]/60">
                  <div className="space-y-0.5">
                    <CardTitle className="font-heading text-base font-extrabold">
                      Hari {dIdx + 1}
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold text-[oklch(0.48_0.01_40)] uppercase tracking-wider">
                      {formatDateString(day.day_date)}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-wider text-[oklch(0.48_0.01_40)] block">
                        Total Biaya Hari Ini
                      </span>
                      <span className="font-extrabold text-sm text-teal-600">
                        {formatIDR(dayCost)}
                      </span>
                    </div>
                    
                    <Button 
                      onClick={() => openAddModal(day.id)}
                      className="rounded-xl bg-[oklch(0.68_0.14_32)] text-white hover:bg-[oklch(0.68_0.14_32)]/90 text-xs h-9 px-3 gap-1 shadow-sm shadow-rose-50"
                    >
                      <Plus size={14} /> Tambah Agenda
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="bg-[oklch(0.98_0.006_70)]/50 border-b border-[oklch(0.90_0.008_70)] text-[10px] font-bold text-[oklch(0.48_0.01_40)] uppercase tracking-wider">
                            <th className="p-3 text-center shrink-0 w-8">Urutan</th>
                            <th className="p-3">Waktu (Jam)</th>
                            <th className="p-3">Agenda / Kegiatan</th>
                            <th className="p-3">Lokasi</th>
                            <th className="p-3">Estimasi Biaya</th>
                            <th className="p-3">Catatan</th>
                            <th className="p-3 text-center shrink-0 w-16">Aksi</th>
                          </tr>
                        </thead>
                        <SortableContext 
                          items={day.activities?.map(a => a.id) || []} 
                          strategy={verticalListSortingStrategy}
                        >
                          <tbody>
                            {day.activities && day.activities.length > 0 ? (
                              day.activities.map((activity) => (
                                <SortableRow 
                                  key={activity.id} 
                                  activity={activity} 
                                  onDelete={handleDeleteActivity}
                                  onEdit={openEditModal}
                                />
                              ))
                            ) : (
                              <tr>
                                <td colSpan={7} className="p-8 text-center text-xs text-[oklch(0.48_0.01_40)]">
                                  Belum ada agenda kegiatan untuk hari ini.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </SortableContext>
                      </table>
                    </DndContext>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* ADD / EDIT ACTIVITY DIALOG */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md bg-white border-[oklch(0.90_0.008_70)] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold">
              {editingActivity ? 'Edit Agenda Kegiatan' : 'Tambah Agenda Kegiatan'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[oklch(0.48_0.01_40)]">
              Masukkan detail agenda kunjungan Anda beserta estimasi biaya lokasi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold">Nama Kegiatan</Label>
              <Input 
                id="title" 
                placeholder="Contoh: Makan Siang di Pantai Kuta" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="rounded-xl border-[oklch(0.90_0.008_70)]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-xs font-semibold">Lokasi</Label>
              <Input 
                id="location" 
                placeholder="Contoh: Pantai Kuta, Badung" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                className="rounded-xl border-[oklch(0.90_0.008_70)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startTime" className="text-xs font-semibold">Jam Mulai</Label>
                <Input 
                  id="startTime" 
                  type="time" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)} 
                  className="rounded-xl border-[oklch(0.90_0.008_70)] text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endTime" className="text-xs font-semibold">Jam Selesai</Label>
                <Input 
                  id="endTime" 
                  type="time" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)} 
                  className="rounded-xl border-[oklch(0.90_0.008_70)] text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cost" className="text-xs font-semibold">Estimasi Biaya Pengeluaran (IDR)</Label>
              <Input 
                id="cost" 
                type="number" 
                placeholder="Contoh: 200 (untuk 200rb) atau 2000 (untuk 2jt)" 
                value={cost} 
                onChange={(e) => setCost(e.target.value)} 
                className="rounded-xl border-[oklch(0.90_0.008_70)]"
              />
              {cost && parseFloat(cost) > 0 && parseFloat(cost) < 10000 && (
                <p className="text-[10px] text-teal-600 font-bold mt-1">
                  ✓ Otomatis menjadi: {formatIDR(parseFloat(cost) * 1000)}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-xs font-semibold">Catatan / Keterangan (Opsional)</Label>
              <Input 
                id="note" 
                placeholder="Contoh: Booking meja outdoor / Bayar cash di lokasi" 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
                className="rounded-xl border-[oklch(0.90_0.008_70)]"
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl text-xs">
                Batal
              </Button>
              <Button type="submit" disabled={formLoading} className="rounded-xl bg-[oklch(0.68_0.14_32)] text-white hover:bg-[oklch(0.68_0.14_32)]/90 text-xs">
                {formLoading ? <Loader2 className="animate-spin mr-1.5" size={14} /> : null}
                {editingActivity ? 'Simpan Perubahan' : 'Tambah Agenda'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
