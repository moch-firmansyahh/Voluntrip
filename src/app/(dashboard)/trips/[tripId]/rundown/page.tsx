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
  AlignLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trip } from '@/types/trip';
import { RundownDay, RundownActivity } from '@/types/rundown';

// DND kit imports
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  UniqueIdentifier
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function formatDateString(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

// SORTABLE ACTIVITY ITEM
function SortableActivityItem({ activity, onDelete }: { activity: RundownActivity; onDelete: (id: string) => void }) {
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
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="group bg-white p-4 rounded-2xl border border-[oklch(0.90_0.008_70)] shadow-sm flex items-start gap-3 hover:shadow transition-shadow"
    >
      {/* Drag Handle */}
      <button 
        type="button" 
        {...attributes} 
        {...listeners} 
        className="cursor-grab text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.22_0.01_40)] shrink-0 self-center p-1 rounded-md hover:bg-[oklch(0.98_0.006_70)]"
      >
        <GripVertical size={16} />
      </button>

      {/* Details */}
      <div className="flex-1 space-y-1 min-w-0">
        <h4 className="font-bold text-sm text-[oklch(0.22_0.01_40)] truncate">{activity.title}</h4>
        
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[oklch(0.48_0.01_40)] font-medium">
          <span className="flex items-center gap-1">
            <Clock size={12} /> {activity.start_time.substring(0, 5)} - {activity.end_time.substring(0, 5)}
          </span>
          {activity.location && (
            <span className="flex items-center gap-0.5 truncate max-w-[150px]">
              <MapPin size={12} /> {activity.location}
            </span>
          )}
        </div>
        
        {activity.note && (
          <p className="text-[10px] text-[oklch(0.48_0.01_40)] leading-relaxed italic border-l-2 border-[oklch(0.90_0.008_70)] pl-2 mt-1 truncate">
            {activity.note}
          </p>
        )}
      </div>

      {/* Actions */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => onDelete(activity.id)}
        className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 rounded-xl shrink-0 self-center"
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
}

// MAIN RUNDOWN COMPONENT
export default function RundownPage() {
  const params = useParams();
  const tripId = params?.tripId as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<RundownDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Form States
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [note, setNote] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Active dragged item overlay state
  const [activeActivity, setActiveActivity] = useState<RundownActivity | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Avoid accidental drags during clicks
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

  // Open Form Modal
  const openAddModal = (dayId: string) => {
    setSelectedDayId(dayId);
    setTitle('');
    setLocation('');
    setStartTime('08:00');
    setEndTime('09:00');
    setNote('');
    setIsOpen(true);
  };

  // Submit Activity Form
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime || !selectedDayId) {
      alert('Tolong isi judul dan waktu kegiatan');
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch('/api/rundown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rundownDayId: selectedDayId,
          title,
          location,
          start_time: startTime,
          end_time: endTime,
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

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    // Find active activity object
    let activeObj = null;
    for (const day of days) {
      const act = day.activities?.find(a => a.id === active.id);
      if (act) {
        activeObj = act;
        break;
      }
    }
    setActiveActivity(activeObj);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find source and target containers
    let activeDayIndex = -1;
    let overDayIndex = -1;

    days.forEach((day, index) => {
      if (day.activities?.find(a => a.id === activeId)) activeDayIndex = index;
      if (day.activities?.find(a => a.id === overId) || day.id === overId) overDayIndex = index;
    });

    if (activeDayIndex === -1 || overDayIndex === -1 || activeDayIndex === overDayIndex) return;

    setDays(prevDays => {
      const newDays = [...prevDays];
      const activeDay = newDays[activeDayIndex];
      const overDay = newDays[overDayIndex];

      const activeActivities = [...(activeDay.activities || [])];
      const overActivities = [...(overDay.activities || [])];

      const activeIndex = activeActivities.findIndex(a => a.id === activeId);
      const [draggedItem] = activeActivities.splice(activeIndex, 1);

      // Add to new list
      const overIndex = overActivities.findIndex(a => a.id === overId);
      if (overIndex !== -1) {
        overActivities.splice(overIndex, 0, draggedItem);
      } else {
        overActivities.push(draggedItem);
      }

      // Update in container objects
      activeDay.activities = activeActivities;
      overDay.activities = overActivities;

      return newDays;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveActivity(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    let activeDayIndex = -1;
    let overDayIndex = -1;

    days.forEach((day, index) => {
      if (day.activities?.find(a => a.id === activeId)) activeDayIndex = index;
      if (day.activities?.find(a => a.id === overId) || day.id === overId) overDayIndex = index;
    });

    if (activeDayIndex === -1 || overDayIndex === -1) return;

    if (activeDayIndex === overDayIndex) {
      // Reordering within the same container
      const day = days[activeDayIndex];
      const activities = [...(day.activities || [])];
      const activeIndex = activities.findIndex(a => a.id === activeId);
      const overIndex = activities.findIndex(a => a.id === overId);

      if (activeIndex !== overIndex) {
        const reordered = arrayMove(activities, activeIndex, overIndex);
        
        // Update local state
        setDays(prevDays => {
          const newDays = [...prevDays];
          newDays[activeDayIndex].activities = reordered;
          return newDays;
        });

        // Sync with API
        await syncReorderedActivities(reordered, day.id);
      }
    } else {
      // Moving between containers has been handled onDragOver, let's sync state
      const targetDay = days[overDayIndex];
      const activities = [...(targetDay.activities || [])];
      await syncReorderedActivities(activities, targetDay.id);

      // Also update source day index positions
      const sourceDay = days[activeDayIndex];
      const sourceActivities = [...(sourceDay.activities || [])];
      await syncReorderedActivities(sourceActivities, sourceDay.id);
    }
  };

  // Sync to database
  const syncReorderedActivities = async (activities: RundownActivity[], dayId: string) => {
    const payload = activities.map((item, idx) => ({
      id: item.id,
      rundown_day_id: dayId,
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
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-[oklch(0.48_0.01_40)]">
        <Loader2 className="animate-spin mb-2" size={32} />
        <p className="text-sm font-medium">Memuat itinerary & rundown...</p>
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="space-y-1">
        <Link href={`/trips/${tripId}`} className="flex items-center gap-1.5 text-xs font-semibold text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.64_0.22_30)] transition-colors">
          <ArrowLeft size={14} /> Back to Overview
        </Link>
        <h2 className="text-2xl font-extrabold font-heading text-[oklch(0.22_0.01_40)] tracking-tight">
          Itinerary & Rundown Kegiatan
        </h2>
        <p className="text-xs text-[oklch(0.48_0.01_40)] font-medium">Susun jadwal liburan harian Anda dengan mudah (Drag & Drop)</p>
      </div>

      {/* Drag & Drop Context */}
      <DndContext 
        sensors={sensors} 
        onDragStart={handleDragStart} 
        onDragOver={handleDragOver} 
        onDragEnd={handleDragEnd}
      >
        {/* Days Columns Grid */}
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin select-none items-start min-h-[500px]">
          {days.map((day, dIdx) => (
            <div key={day.id} className="w-80 shrink-0 bg-[oklch(0.94_0.008_70)]/50 border border-[oklch(0.90_0.008_70)] p-4 rounded-3xl space-y-4">
              {/* Column Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-extrabold text-sm text-[oklch(0.22_0.01_40)]">
                    Hari {dIdx + 1}
                  </h3>
                  <p className="text-[10px] text-[oklch(0.48_0.01_40)] font-semibold uppercase">
                    {formatDateString(day.day_date)}
                  </p>
                </div>
                
                <Button 
                  size="icon" 
                  onClick={() => openAddModal(day.id)}
                  className="w-8 h-8 rounded-xl bg-white border border-[oklch(0.90_0.008_70)] text-[oklch(0.64_0.22_30)] hover:bg-[oklch(0.96_0.02_30)] shadow-sm shrink-0"
                >
                  <Plus size={16} />
                </Button>
              </div>

              {/* Column Body (Drop Zone) */}
              <SortableContext items={day.activities?.map(a => a.id) || []} strategy={verticalListSortingStrategy}>
                <div 
                  id={day.id} 
                  className="space-y-3 min-h-[300px] rounded-2xl transition-colors duration-150"
                >
                  {day.activities && day.activities.length > 0 ? (
                    day.activities.map((activity) => (
                      <SortableActivityItem 
                        key={activity.id} 
                        activity={activity} 
                        onDelete={handleDeleteActivity} 
                      />
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-[oklch(0.90_0.008_70)] rounded-2xl text-[oklch(0.48_0.01_40)] min-h-[300px]">
                      <Calendar size={28} className="text-[oklch(0.48_0.01_40)]/30 mb-1.5" />
                      <p className="text-[10px] font-semibold">Kosong</p>
                      <p className="text-[9px] mt-0.5 max-w-[150px] mx-auto leading-relaxed">
                        Tarik agenda ke sini atau tekan tombol "+" untuk menambahkan.
                      </p>
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeActivity ? (
            <div className="bg-white p-4 rounded-2xl border-2 border-[oklch(0.64_0.22_30)] shadow-lg flex items-start gap-3 w-80 opacity-90 cursor-grabbing">
              <GripVertical size={16} className="text-[oklch(0.48_0.01_40)] shrink-0 self-center" />
              <div className="flex-1 space-y-1 min-w-0">
                <h4 className="font-bold text-sm text-[oklch(0.22_0.01_40)] truncate">{activeActivity.title}</h4>
                <div className="flex items-center gap-3 text-[11px] text-[oklch(0.48_0.01_40)] font-medium">
                  <Clock size={12} /> {activeActivity.start_time.substring(0, 5)} - {activeActivity.end_time.substring(0, 5)}
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ADD ACTIVITY DIALOG */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md bg-white border-[oklch(0.90_0.008_70)] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold">Tambah Agenda Kegiatan</DialogTitle>
            <DialogDescription className="text-xs text-[oklch(0.48_0.01_40)]">
              Masukkan judul agenda, jam pelaksanaan, lokasi, dan catatan tambahan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold">Nama Kegiatan</Label>
              <Input 
                id="title" 
                placeholder="Contoh: Sarapan di Hotel / Check-in Penerbangan" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="rounded-xl border-[oklch(0.90_0.008_70)]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-xs font-semibold">Lokasi (Opsional)</Label>
              <Input 
                id="location" 
                placeholder="Contoh: Hotel Discovery Kuta" 
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
              <Label htmlFor="note" className="text-xs font-semibold">Catatan Tambahan (Opsional)</Label>
              <Input 
                id="note" 
                placeholder="Contoh: Bawa kemeja cadangan / Simpan boarding pass" 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
                className="rounded-xl border-[oklch(0.90_0.008_70)]"
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl text-xs">
                Batal
              </Button>
              <Button type="submit" disabled={formLoading} className="rounded-xl bg-[oklch(0.64_0.22_30)] text-white hover:bg-[oklch(0.64_0.22_30)]/90 text-xs">
                {formLoading ? <Loader2 className="animate-spin mr-1.5" size={14} /> : null}
                Tambah Agenda
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
