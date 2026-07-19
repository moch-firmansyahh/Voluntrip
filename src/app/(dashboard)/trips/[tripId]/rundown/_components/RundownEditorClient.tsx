'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Trash2, 
  MapPin, 
  Clock, 
  Loader2, 
  AlertCircle,
  GripVertical,
  DollarSign,
  Plus,
  Edit2,
  ExternalLink,
  Search,
  X,
  LayoutList,
  Table
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trip } from '@/types/trip';
import { RundownDay, RundownActivity } from '@/types/rundown';
import LocationAutocomplete from '@/components/shared/LocationAutocomplete';

// DND kit imports for sorting table rows
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor
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

// Helper to format time strings safely as HH:MM
function formatTimeHHMM(timeStr: string): string {
  if (!timeStr) return '08:00';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    const hh = parts[0].padStart(2, '0');
    const mm = parts[1].padStart(2, '0');
    return `${hh}:${mm}`;
  }
  return '08:00';
}

// Helper to format time strings safely as HH:MM:SS
function formatTimeHHMMSS(time: string): string {
  if (!time) return '00:00:00';
  if (time.length === 5) return `${time}:00`;
  return time;
}

function recalculateSchedule(
  activities: RundownActivity[],
  dayStartTime: string
): { success: boolean; activities?: RundownActivity[]; error?: string } {
  if (!activities || activities.length === 0) {
    return { success: true, activities: [] };
  }

  const result: RundownActivity[] = [];

  for (let index = 0; index < activities.length; index++) {
    const act = activities[index];

    // Original duration in minutes
    const [sH, sM] = act.start_time.substring(0, 5).split(':').map(Number);
    const [eH, eM] = act.end_time.substring(0, 5).split(':').map(Number);
    let durationMinutes = (eH * 60 + eM) - (sH * 60 + sM);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      durationMinutes = 60;
    }

    let newStartHHMM = dayStartTime;
    if (index > 0) {
      newStartHHMM = result[index - 1].end_time.substring(0, 5);
    }

    const [nSH, nSM] = newStartHHMM.split(':').map(Number);
    const totalEndMins = nSH * 60 + nSM + durationMinutes;

    // VALIDATION: Check if end time exceeds 23:59 (1439 mins)
    if (totalEndMins > 23 * 60 + 59) {
      return {
        success: false,
        error: 'Nggak bisa, total durasi activity di hari ini lewat jam 23:59',
      };
    }

    const nEH = Math.floor(totalEndMins / 60) % 24;
    const nEM = totalEndMins % 60;

    const newStartStr = `${newStartHHMM}:00`;
    const newEndStr = `${nEH.toString().padStart(2, '0')}:${nEM.toString().padStart(2, '0')}:00`;

    result.push({
      ...act,
      start_time: newStartStr,
      end_time: newEndStr,
      order_index: index,
    });
  }

  return { success: true, activities: result };
}

// SORTABLE TIMELINE CARD
interface SortableRowProps {
  activity: RundownActivity;
  onDelete: (id: string) => void;
  onEdit: (activity: RundownActivity) => void;
}

const SortableActivityCard = React.memo(function SortableActivityCard({ activity, onDelete, onEdit }: SortableRowProps) {
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
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-2xl transition-all bg-white touch-none select-none ${
        isDragging
          ? 'opacity-25 border-2 border-dashed border-[oklch(0.70_0.08_40)] bg-slate-50 shadow-inner'
          : 'border-[oklch(0.90_0.008_70)]/60 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        {/* Drag Handle Icon */}
        <div className="text-[oklch(0.48_0.01_40)] p-1 rounded shrink-0 mt-0.5 sm:mt-0">
          <GripVertical size={16} />
        </div>

        {/* Time and Title info */}
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[oklch(0.92_0.008_240)] text-[oklch(0.38_0.06_210)]">
              <Clock size={11} />
              {activity.start_time.substring(0, 5)} - {activity.end_time.substring(0, 5)}
            </span>
            {activity.cost > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-50 text-teal-600">
                <DollarSign size={10} />
                {formatIDR(parseFloat(activity.cost as any || 0))}
              </span>
            )}
          </div>
          <h5 className="font-bold text-xs text-[oklch(0.22_0.01_40)] mt-1">
            {activity.title}
          </h5>
          
          {/* Metadata: Location & Notes */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
            {activity.location && (
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[10px] text-teal-600 hover:text-teal-700 hover:underline font-medium cursor-pointer"
              >
                <MapPin size={11} className="text-orange-500 shrink-0" />
                <span className="truncate max-w-[200px]">{activity.location}</span>
              </a>
            )}
            {activity.note && (
              <span className="text-[10px] text-[oklch(0.48_0.01_40)] italic">
                {activity.note}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div 
        className="flex items-center justify-end gap-1.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-[oklch(0.90_0.008_70)]/30 shrink-0"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => { e.stopPropagation(); onEdit(activity); }}
          className="text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.22_0.01_40)] hover:bg-[oklch(0.94_0.008_70)] rounded-xl h-8 px-2 gap-1 text-[11px] font-bold"
        >
          <Edit2 size={12} /> Edit
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => { e.stopPropagation(); onDelete(activity.id); }}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl h-8 px-2 gap-1 text-[11px] font-bold"
        >
          <Trash2 size={12} /> Hapus
        </Button>
      </div>
    </div>
  );
});

interface RundownEditorClientProps {
  initialTrip: Trip;
  initialDays: RundownDay[];
}

export default function RundownEditorClient({ initialTrip, initialDays }: RundownEditorClientProps) {
  const params = useParams();
  const tripId = params?.tripId as string;

  const [trip, setTrip] = useState<Trip | null>(initialTrip);
  const [days, setDays] = useState<RundownDay[]>(initialDays);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View mode switcher: 'timeline' | 'table'
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  // Active activity for DragOverlay
  const [activeActivity, setActiveActivity] = useState<RundownActivity | null>(null);

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<RundownActivity | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [cost, setCost] = useState('0');
  const [note, setNote] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Custom confirm states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);

  const showConfirm = useCallback((title: string, message: string, callback: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setOnConfirm(() => () => {
      callback();
      setConfirmOpen(false);
    });
    setConfirmOpen(true);
  }, []);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      delay: 500, // 500ms long-press required
      tolerance: 5,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 500, // 500ms long-press required on touch screens
      tolerance: 5,
    },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  const fetchRundownData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [tripRes, rundownRes] = await Promise.all([
        fetch(`/api/trips/${tripId}`),
        fetch(`/api/rundown?tripId=${tripId}`)
      ]);

      if (!tripRes.ok) throw new Error('Trip tidak ditemukan');
      const tripData = await tripRes.json();
      setTrip(tripData);

      if (!rundownRes.ok) throw new Error('Gagal memuat rundown trip');
      const rundownData = await rundownRes.json();
      setDays(rundownData || []);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [tripId]);

  // Open Form Modal for Create
  const openAddModal = (dayId: string) => {
    setSelectedDayId(dayId);
    setEditingActivity(null);
    setTitle('');
    setLocation('');
    setLatitude(null);
    setLongitude(null);

    // Auto-fill time from last activity of the day if available
    const targetDay = days.find(d => d.id === dayId);
    const dayActs = targetDay?.activities || [];
    if (dayActs.length > 0) {
      const lastAct = dayActs[dayActs.length - 1];
      const lastEnd = formatTimeHHMM(lastAct.end_time); // e.g. "09:00"
      setStartTime(lastEnd);
      
      const [h, m] = lastEnd.split(':').map(Number);
      const nextH = (h + 1) % 24;
      setEndTime(`${nextH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    } else {
      setStartTime('08:00');
      setEndTime('09:00');
    }

    setCost('0');
    setNote('');
    setIsOpen(true);
  };

  // Open Form Modal for Edit
  const openEditModal = useCallback((activity: RundownActivity) => {
    setEditingActivity(activity);
    setSelectedDayId(activity.rundown_day_id);
    setTitle(activity.title);
    setLocation(activity.location || '');
    setLatitude(activity.latitude || null);
    setLongitude(activity.longitude || null);
    setStartTime(formatTimeHHMM(activity.start_time));
    setEndTime(formatTimeHHMM(activity.end_time));
    setCost(activity.cost.toString());
    setNote(activity.note || '');
    setIsOpen(true);
  }, []);

  // Submit Activity Form (handles both Create and Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime || !selectedDayId) {
      alert('Tolong isi judul dan waktu kegiatan');
      return;
    }

    let parsedCost = parseFloat(cost) || 0;
    if (parsedCost > 0 && parsedCost < 10000) {
      parsedCost = parsedCost * 1000;
    }

    const previousDays = [...days]; // Keep reference for rollback on error

    // Optimistic Update
    if (editingActivity) {
      // Edit mode optimistic update
      setDays(prevDays => prevDays.map(day => {
        if (day.id === selectedDayId) {
          return {
            ...day,
            activities: (day.activities || []).map(act => {
              if (act.id === editingActivity.id) {
                return {
                  ...act,
                  title,
                  location: location || null,
                  latitude,
                  longitude,
                  start_time: formatTimeHHMMSS(startTime),
                  end_time: formatTimeHHMMSS(endTime),
                  cost: parsedCost,
                  note: note || null
                };
              }
              return act;
            })
          };
        }
        return day;
      }));
    } else {
      // Create mode optimistic update
      const targetDay = days.find(d => d.id === selectedDayId);
      const tempActivity: RundownActivity = {
        id: `temp-${Date.now()}`,
        rundown_day_id: selectedDayId,
        title,
        location: location || null,
        latitude,
        longitude,
        start_time: formatTimeHHMMSS(startTime),
        end_time: formatTimeHHMMSS(endTime),
        cost: parsedCost,
        note: note || null,
        order_index: (targetDay?.activities?.length || 0),
      };

      setDays(prevDays => prevDays.map(day => {
        if (day.id === selectedDayId) {
          return {
            ...day,
            activities: [...(day.activities || []), tempActivity]
          };
        }
        return day;
      }));
    }

    setIsOpen(false); // Close dialog instantly for snappy responsiveness
    setFormLoading(true);

    try {
      const url = editingActivity ? `/api/rundown/${editingActivity.id}` : '/api/rundown';
      const method = editingActivity ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rundownDayId: selectedDayId,
          title,
          location,
          latitude,
          longitude,
          start_time: startTime,
          end_time: endTime,
          cost: parsedCost,
          note,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal menyimpan kegiatan');
      }
      
      // Silent refresh to reconcile database fields
      fetchRundownData(true);
    } catch (err: any) {
      alert(err.message);
      setDays(previousDays); // Rollback on failure
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Activity
  const handleDeleteActivity = useCallback((activityId: string) => {
    showConfirm(
      'Hapus Agenda Kegiatan',
      'Apakah Anda yakin ingin menghapus agenda kegiatan ini?',
      async () => {
        const previousDays = [...days]; // Keep reference for rollback

        // Optimistically remove activity instantly
        setDays(prevDays => prevDays.map(day => {
          return {
            ...day,
            activities: (day.activities || []).filter(act => act.id !== activityId)
          };
        }));

        try {
          const res = await fetch(`/api/rundown/${activityId}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Gagal menghapus kegiatan');
          fetchRundownData(true); // Silent background refresh
        } catch (err: any) {
          alert(err.message);
          setDays(previousDays); // Rollback on failure
        }
      }
    );
  }, [days, fetchRundownData, showConfirm]);

  // Delete Day
  const handleDeleteDay = (dayId: string, dayNumber: number) => {
    showConfirm(
      'Hapus Hari Itinerary',
      `Apakah Anda yakin ingin menghapus Hari ${dayNumber} beserta seluruh kegiatannya? Durasi perjalanan Anda akan otomatis disesuaikan (berkurang 1 hari).`,
      async () => {
        const previousDays = [...days]; // Keep reference for rollback

        // Optimistically remove day instantly
        setDays(prevDays => prevDays.filter(day => day.id !== dayId));

        try {
          const res = await fetch(`/api/rundown/day/${dayId}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Gagal menghapus hari');
          fetchRundownData(true); // Silent background refresh
        } catch (err: any) {
          alert(err.message);
          setDays(previousDays); // Rollback on failure
        }
      }
    );
  };

  // Drag & Drop Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const act = days.flatMap(d => d.activities || []).find(a => a.id === active.id);
    if (act) setActiveActivity(act);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveActivity(null);
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
      // Find the earliest start time among activities in this day
      const dayStartTime = activities.reduce((earliest, act) => {
        const time = act.start_time.substring(0, 5);
        return time < earliest ? time : earliest;
      }, activities[0].start_time.substring(0, 5));

      const reorderedRaw = arrayMove(activities, activeIdx, overIdx);
      const resched = recalculateSchedule(reorderedRaw, dayStartTime);

      if (!resched.success || !resched.activities) {
        alert(resched.error || 'Nggak bisa, total durasi activity di hari ini lewat jam 23:59');
        return; // Revert drop
      }

      const reordered = resched.activities;

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
        order_index: idx,
        start_time: item.start_time,
        end_time: item.end_time
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
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-[oklch(0.92_0.008_240)] rounded-xl" />
          <div className="h-6 w-64 bg-[oklch(0.92_0.008_240)] rounded-xl" />
          <div className="h-4 w-96 bg-[oklch(0.92_0.008_240)] rounded-xl" />
        </div>
        <div className="h-32 w-full rounded-3xl bg-[oklch(0.92_0.008_240)]" />
        <div className="space-y-4 pt-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-48 rounded-3xl bg-[oklch(0.92_0.008_240)]" />
          ))}
        </div>
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
          <Link href={`/trips/${tripId}`} className="flex items-center gap-1.5 text-xs font-semibold text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.70_0.08_40)] transition-colors">
            <ArrowLeft size={14} /> Back to Overview
          </Link>
          <h2 className="text-2xl font-extrabold font-heading text-[oklch(0.22_0.01_40)] tracking-tight">
            Itinerary & Rencana Kegiatan
          </h2>
          <p className="text-xs text-[oklch(0.48_0.01_40)] font-medium">Satukan waktu kunjungan, lokasi, dan estimasi biaya per agenda</p>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 self-start sm:self-auto shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'timeline'
                ? 'bg-white text-[oklch(0.22_0.01_40)] shadow-sm'
                : 'text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.22_0.01_40)]'
            }`}
          >
            <LayoutList size={14} /> Timeline Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'table'
                ? 'bg-[oklch(0.38_0.06_210)] text-white shadow-sm'
                : 'text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.22_0.01_40)]'
            }`}
          >
            <Table size={14} /> Tabel View
          </button>
        </div>
      </div>

      {/* Integrated Budget Summary Card */}
      <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[oklch(0.90_0.008_70)]">
          <div className="p-6 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)] block">Total Budget Trip</span>
            <span className="font-heading font-extrabold text-xl text-[oklch(0.38_0.06_210)] block">
              {formatIDR(totalTripBudget)}
            </span>
            <span className="text-[10px] text-[oklch(0.48_0.01_40)] font-medium block">
              Anggaran batas perjalanan
            </span>
          </div>

          <div className="p-6 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)] block">Total Estimasi Terpakai</span>
            <span className="font-heading font-extrabold text-xl text-[oklch(0.70_0.08_40)] block">
              {formatIDR(totalItineraryCost)}
            </span>
            <span className="text-[10px] text-[oklch(0.48_0.01_40)] font-medium block">
              Dari seluruh agenda harian
            </span>
          </div>

          <div className="p-6 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)] block">Sisa Budget (Ditabulasikan)</span>
            <span className={`font-heading font-extrabold text-xl block ${
              totalTripBudget - totalItineraryCost < 0 ? 'text-red-500' : 'text-emerald-600'
            }`}>
              {formatIDR(totalTripBudget - totalItineraryCost)}
            </span>
            <span className="text-[10px] text-[oklch(0.48_0.01_40)] font-medium block">
              {totalTripBudget - totalItineraryCost < 0 ? '⚠️ Melebihi budget!' : '✓ Sisa budget aman'}
            </span>
          </div>
        </div>

        <div className="px-6 pb-6 pt-2 border-t border-[oklch(0.90_0.008_70)]/40 bg-[oklch(0.98_0.006_70)]/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[oklch(0.48_0.01_40)]">Persentase Terpakai</span>
            <span className={totalItineraryCost > totalTripBudget ? 'text-red-500' : 'text-[oklch(0.38_0.06_210)]'}>
              {budgetRatio.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-[oklch(0.92_0.008_240)] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                totalItineraryCost > totalTripBudget ? 'bg-red-500' : 'bg-[oklch(0.70_0.08_40)]'
              }`} 
              style={{ width: `${budgetRatio}%` }}
            />
          </div>
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
            const dayCost = day.activities?.reduce((sum, a) => sum + (parseFloat(a.cost as any) || 0), 0) || 0;

            return (
              <Card key={day.id} className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden">
                <CardHeader className="pb-4 px-6 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-orange-50/10 to-transparent border-b border-[oklch(0.90_0.008_70)]/60">
                  <div className="space-y-1">
                    <CardTitle className="font-heading text-base font-extrabold text-[oklch(0.22_0.01_40)]">
                      Hari {dIdx + 1}
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold text-[oklch(0.48_0.01_40)] uppercase tracking-wider">
                      {formatDateString(day.day_date)}
                    </CardDescription>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[oklch(0.90_0.008_70)]/40">
                    <div className="text-left sm:text-right">
                      <span className="text-[9px] uppercase tracking-wider text-[oklch(0.48_0.01_40)] block">
                        Total Hari Ini
                      </span>
                      <span className="font-extrabold text-sm text-[oklch(0.38_0.06_210)]">
                        {formatIDR(dayCost)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost"
                        onClick={() => handleDeleteDay(day.id, dIdx + 1)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs h-9 px-2 gap-1.5 cursor-pointer"
                      >
                        <Trash2 size={13} /> Hapus Hari
                      </Button>
                      
                      <Button 
                        onClick={() => openAddModal(day.id)}
                        className="rounded-xl bg-[oklch(0.70_0.08_40)] text-white hover:bg-[oklch(0.70_0.08_40)]/90 text-xs h-9 px-3 gap-1 shadow-sm shadow-rose-50 cursor-pointer"
                      >
                        <Plus size={14} /> Tambah Agenda
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {viewMode === 'table' ? (
                    /* Table View Renderer */
                    day.activities && day.activities.length > 0 ? (
                      <div className="rounded-2xl border border-[oklch(0.90_0.008_70)]/60 overflow-hidden">
                        {/* MOBILE STACKED LIST VIEW (md:hidden) */}
                        <div className="md:hidden divide-y divide-[oklch(0.90_0.008_70)]/40 text-xs">
                          {day.activities.map((act) => (
                            <div key={act.id} className="p-3.5 space-y-2 hover:bg-slate-50/80 transition-colors">
                              {/* Top Row: Time & Cost */}
                              <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1 bg-slate-100 text-[oklch(0.38_0.06_210)] px-2 py-0.5 rounded-md font-bold text-[11px]">
                                  <Clock size={11} />
                                  {act.start_time.substring(0, 5)} - {act.end_time.substring(0, 5)}
                                </span>
                                <span className="font-extrabold font-heading text-xs">
                                  {act.cost > 0 ? (
                                    <span className="text-teal-700">{formatIDR(parseFloat(act.cost as any || 0))}</span>
                                  ) : (
                                    <span className="text-slate-400 font-normal">Gratis</span>
                                  )}
                                </span>
                              </div>

                              {/* Title */}
                              <h4 className="font-extrabold text-xs text-[oklch(0.22_0.01_40)]">
                                {act.title}
                              </h4>

                              {/* Location & Notes */}
                              {(act.location || act.note) && (
                                <div className="space-y-1 text-[11px]">
                                  {act.location && (
                                    <a 
                                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.location)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-teal-600 hover:underline font-medium truncate max-w-full"
                                    >
                                      <MapPin size={11} className="text-orange-500 shrink-0" />
                                      <span className="truncate">{act.location}</span>
                                    </a>
                                  )}
                                  {act.note && (
                                    <p className="text-slate-500 italic text-[10px]">
                                      {act.note}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Action Footer */}
                              <div className="flex items-center justify-end gap-1 pt-1.5 border-t border-slate-100">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => openEditModal(act)}
                                  className="h-7 px-2 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg gap-1"
                                >
                                  <Edit2 size={12} /> Edit
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteActivity(act.id)}
                                  className="h-7 px-2 text-[11px] font-bold text-red-500 hover:bg-red-50 rounded-lg gap-1"
                                >
                                  <Trash2 size={12} /> Hapus
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* DESKTOP TABLE VIEW (hidden md:block) */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-[oklch(0.98_0.006_70)]/80 border-b border-[oklch(0.90_0.008_70)]/60 text-[10px] font-extrabold uppercase tracking-wider text-[oklch(0.40_0.02_40)]">
                                <th className="py-3 px-4">Jam</th>
                                <th className="py-3 px-4">Nama Agenda / Kegiatan</th>
                                <th className="py-3 px-4">Lokasi</th>
                                <th className="py-3 px-4 text-right">Estimasi Biaya</th>
                                <th className="py-3 px-4">Catatan</th>
                                <th className="py-3 px-4 text-center">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[oklch(0.90_0.008_70)]/40 text-xs">
                              {day.activities.map((act) => (
                                <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-3 px-4 whitespace-nowrap font-bold text-[oklch(0.38_0.06_210)]">
                                    <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                                      <Clock size={11} />
                                      {act.start_time.substring(0, 5)} - {act.end_time.substring(0, 5)}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-extrabold text-[oklch(0.22_0.01_40)]">
                                    {act.title}
                                  </td>
                                  <td className="py-3 px-4 text-slate-600">
                                    {act.location ? (
                                      <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.location)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-teal-600 hover:underline font-medium"
                                      >
                                        <MapPin size={11} className="text-orange-500 shrink-0" />
                                        <span>{act.location}</span>
                                      </a>
                                    ) : (
                                      <span className="text-slate-300">-</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right font-bold font-heading text-[oklch(0.22_0.01_40)] whitespace-nowrap">
                                    {act.cost > 0 ? (
                                      <span className="text-teal-700">{formatIDR(parseFloat(act.cost as any || 0))}</span>
                                    ) : (
                                      <span className="text-slate-400 font-normal">Gratis</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-slate-500 italic max-w-[200px] truncate">
                                    {act.note || '-'}
                                  </td>
                                  <td className="py-3 px-4 text-center whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => openEditModal(act)}
                                        className="h-7 px-2 rounded-lg text-slate-600 hover:bg-slate-100 text-[11px] font-bold gap-1"
                                      >
                                        <Edit2 size={12} /> Edit
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleDeleteActivity(act.id)}
                                        className="h-7 px-2 rounded-lg text-red-500 hover:bg-red-50 text-[11px] font-bold gap-1"
                                      >
                                        <Trash2 size={12} /> Hapus
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-[oklch(0.48_0.01_40)] bg-[oklch(0.98_0.006_70)]/30 rounded-2xl border border-dashed border-[oklch(0.90_0.008_70)]/60">
                        Belum ada agenda kegiatan untuk hari ini.
                      </div>
                    )
                  ) : (
                    /* Timeline Drag-and-Drop Cards View */
                    <DndContext 
                      sensors={sensors} 
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragCancel={() => setActiveActivity(null)}
                    >
                      <SortableContext 
                        items={day.activities?.map(a => a.id) || []} 
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {day.activities && day.activities.length > 0 ? (
                            day.activities.map((activity) => (
                              <SortableActivityCard 
                                key={activity.id} 
                                activity={activity} 
                                onDelete={handleDeleteActivity}
                                onEdit={openEditModal}
                              />
                            ))
                          ) : (
                            <div className="p-8 text-center text-xs text-[oklch(0.48_0.01_40)] bg-[oklch(0.98_0.006_70)]/30 rounded-2xl border border-dashed border-[oklch(0.90_0.008_70)]/60">
                              Belum ada agenda kegiatan untuk hari ini.
                            </div>
                          )}
                        </div>
                      </SortableContext>
                      
                      <DragOverlay>
                        {activeActivity ? (
                          <div className="scale-103 rotate-1 shadow-2xl rounded-3xl bg-white/95 backdrop-blur-md border-2 border-[oklch(0.70_0.08_40)] p-4 z-50 pointer-events-none cursor-grabbing">
                            <div className="flex items-center justify-between gap-3">
                              <h4 className="font-extrabold text-sm text-[oklch(0.22_0.01_40)]">{activeActivity.title}</h4>
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-teal-700 px-2 py-0.5 rounded-md text-xs font-bold shrink-0">
                                <Clock size={11} />
                                {activeActivity.start_time.substring(0, 5)} - {activeActivity.end_time.substring(0, 5)}
                              </span>
                            </div>
                            {activeActivity.location && (
                              <p className="text-xs text-teal-600 font-medium mt-1 truncate flex items-center gap-1">
                                <MapPin size={11} className="text-orange-500 shrink-0" />
                                <span>{activeActivity.location}</span>
                              </p>
                            )}
                          </div>
                        ) : null}
                      </DragOverlay>
                    </DndContext>
                  )}
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
              <Label htmlFor="location" className="text-xs font-semibold">Lokasi Kegiatan (Opsional)</Label>
              <LocationAutocomplete
                value={location}
                onChange={(val, lat, lon) => {
                  setLocation(val);
                  setLatitude(lat || null);
                  setLongitude(lon || null);
                }}
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
              <Button type="submit" disabled={formLoading} className="rounded-xl bg-[oklch(0.70_0.08_40)] text-white hover:bg-[oklch(0.70_0.08_40)]/90 text-xs">
                {formLoading ? <Loader2 className="animate-spin mr-1.5" size={14} /> : null}
                {editingActivity ? 'Simpan Perubahan' : 'Tambah Agenda'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Custom Confirmation Popup Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-3xl border-[oklch(0.90_0.008_70)] max-w-sm p-6 bg-white animate-fade-in">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold text-base text-[oklch(0.38_0.06_210)]">
              {confirmTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-[oklch(0.48_0.01_40)] pt-2 leading-relaxed">
              {confirmMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setConfirmOpen(false)}
              className="rounded-xl text-xs h-9 border-[oklch(0.90_0.008_70)] text-[oklch(0.22_0.01_40)] hover:bg-[oklch(0.92_0.008_240)] px-3"
            >
              Batal
            </Button>
            <Button 
              onClick={() => {
                if (onConfirm) onConfirm();
              }}
              className="rounded-xl text-xs h-9 bg-red-600 hover:bg-red-700 text-white font-medium px-4 shadow-sm"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
