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
  X
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
function formatTimeHHMMSS(timeStr: string): string {
  if (!timeStr) return '08:00:00';
  const parts = timeStr.split(':');
  const hh = parts[0].padStart(2, '0');
  const mm = (parts[1] || '00').padStart(2, '0');
  const ss = (parts[2] || '00').padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
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
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-[oklch(0.90_0.008_70)]/60 rounded-2xl hover:shadow-sm transition-all bg-white animate-fade-in"
    >
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        {/* Drag Handle */}
        <button 
          type="button" 
          {...attributes} 
          {...listeners} 
          className="cursor-grab text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.22_0.01_40)] p-1.5 rounded hover:bg-[oklch(0.94_0.008_70)] outline-none mt-0.5 sm:mt-0"
        >
          <GripVertical size={16} />
        </button>

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
      <div className="flex items-center justify-end gap-1.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-[oklch(0.90_0.008_70)]/30 shrink-0">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onEdit(activity)}
          className="text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.22_0.01_40)] hover:bg-[oklch(0.94_0.008_70)] rounded-xl h-8 px-2 gap-1 text-[11px] font-bold"
        >
          <Edit2 size={12} /> Edit
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onDelete(activity.id)}
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

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<RundownActivity | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

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
  
  // Form states
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [cost, setCost] = useState('0');
  const [note, setNote] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Suggestions search states
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const locationSelectedRef = useRef(false);

  // Debounced search for locations using free Nominatim API with fuzzy fallback
  useEffect(() => {
    if (!location || location.length < 3) {
      setSuggestions([]);
      return;
    }
    
    // Skip fetching if user just selected a location from the dropdown
    if (locationSelectedRef.current) {
      locationSelectedRef.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const headers = { 'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8' };
        
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=6&addressdetails=1`,
          { headers }
        );
        
        if (res.ok) {
          const data = await res.json();
          
          if (data && data.length > 0) {
            setSuggestions(data);
          } else {
            const words = location.trim().split(/\s+/).filter((w: string) => w.length >= 3);
            
            if (words.length >= 2) {
              const fallbackQuery = words.slice(1).join(' ');
              const fallbackRes = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=6&addressdetails=1`,
                { headers }
              );
              
              if (fallbackRes.ok) {
                const fallbackData = await fallbackRes.json();
                
                if (fallbackData && fallbackData.length > 0) {
                  setSuggestions(fallbackData);
                } else {
                  const longestWord = words.reduce((a: string, b: string) => a.length >= b.length ? a : b);
                  const keywordRes = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(longestWord)}&limit=6&countrycodes=id&addressdetails=1`,
                    { headers }
                  );
                  
                  if (keywordRes.ok) {
                    const keywordData = await keywordRes.json();
                    setSuggestions(keywordData || []);
                  }
                }
              }
            } else {
              setSuggestions([]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching location suggestions:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [location]);

  const selectLocation = (displayName: string) => {
    locationSelectedRef.current = true;
    setLocation(displayName);
    setSuggestions([]);
  };

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 8,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 300, // 300ms long press to start dragging on mobile
      tolerance: 8, // Allow up to 8px drag tolerance during long press
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
    setStartTime('08:00');
    setEndTime('09:00');
    setCost('0');
    setNote('');
    setSuggestions([]);
    setIsOpen(true);
  };

  // Open Form Modal for Edit
  const openEditModal = useCallback((activity: RundownActivity) => {
    setEditingActivity(activity);
    setSelectedDayId(activity.rundown_day_id);
    setTitle(activity.title);
    setLocation(activity.location || '');
    setStartTime(formatTimeHHMM(activity.start_time));
    setEndTime(formatTimeHHMM(activity.end_time));
    setCost(activity.cost.toString());
    setNote(activity.note || '');
    setSuggestions([]);
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
      const tempActivity: RundownActivity = {
        id: `temp-${Date.now()}`,
        rundown_day_id: selectedDayId,
        title,
        location: location || null,
        start_time: formatTimeHHMMSS(startTime),
        end_time: formatTimeHHMMSS(endTime),
        cost: parsedCost,
        note: note || null,
        order_index: (days.find(d => d.id === selectedDayId)?.activities?.length || 0) + 1,
        latitude: null,
        longitude: null
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
                  <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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
                  </DndContext>
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

            <div className="space-y-1.5 relative">
              <Label htmlFor="location" className="text-xs font-semibold">Lokasi Kegiatan</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Search size={14} className="text-[oklch(0.48_0.01_40)]" />
                </div>
                <Input 
                  id="location" 
                  placeholder="Ketik nama lokasi (contoh: Stasiun Kiara Condong)" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  className="rounded-xl border-[oklch(0.90_0.008_70)] pl-9 pr-9"
                  autoComplete="off"
                />
                {searchLoading ? (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="animate-spin text-[oklch(0.48_0.01_40)]" size={14} />
                  </span>
                ) : location.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => { setLocation(''); setSuggestions([]); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.22_0.01_40)] cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>
              
              {suggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[oklch(0.90_0.008_70)] rounded-xl shadow-lg max-h-52 overflow-y-auto divide-y divide-[oklch(0.90_0.008_70)]/50">
                  {suggestions.map((item: any, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectLocation(item.display_name)}
                      className="w-full text-left px-3 py-2.5 hover:bg-[oklch(0.92_0.008_240)] text-[oklch(0.22_0.01_40)] flex items-start gap-2 transition-colors"
                    >
                      <MapPin size={13} className="text-orange-500 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-snug line-clamp-2">{item.display_name}</span>
                    </button>
                  ))}
                </div>
              )}

              {location.length >= 3 && suggestions.length === 0 && !searchLoading && (
                <div className="flex items-center gap-2 mt-1.5 p-2.5 rounded-xl bg-[oklch(0.96_0.01_220)] border border-[oklch(0.90_0.02_220)]">
                  <MapPin size={13} className="text-[oklch(0.55_0.06_210)] shrink-0" />
                  <p className="text-[10px] text-[oklch(0.35_0.03_220)] flex-1">
                    Teks lokasi Anda tetap tersimpan. Coba verifikasi atau salin nama lengkap dari Google Maps:
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-[oklch(0.38_0.06_210)] hover:underline shrink-0 cursor-pointer"
                  >
                    <ExternalLink size={11} /> Buka Maps
                  </a>
                </div>
              )}

              <p className="text-[10px] text-[oklch(0.48_0.01_40)] mt-1">
                💡 Ketik nama tempat. Rekomendasi akan muncul otomatis, termasuk lokasi mirip jika ejaan kurang tepat.
              </p>
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
