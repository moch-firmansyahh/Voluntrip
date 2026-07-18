'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  TrendingDown, 
  Briefcase, 
  Share2, 
  Copy, 
  Check, 
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Map,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Trip {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  cover_image: string | null;
  budget_total: string;
  is_public: boolean;
  share_token: string | null;
  expense_mode: string;
}

// Format IDR helper
function formatIDR(val: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val);
}

function formatDateString(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
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
  const [rundown, setRundown] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sharing states
  const [sharingLoading, setSharingLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchTripData = async () => {
    try {
      setLoading(true);
      
      // Fetch details and rundown IN PARALLEL to prevent sequential loading lag (NFR performance optimization)
      const [tripRes, rundownRes] = await Promise.all([
        fetch(`/api/trips/${tripId}`),
        fetch(`/api/rundown?tripId=${tripId}`)
      ]);

      if (!tripRes.ok) {
        if (tripRes.status === 404) throw new Error('Trip tidak ditemukan');
        throw new Error('Gagal memuat detail trip');
      }

      const tripData = await tripRes.json();
      setTrip(tripData);

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

  // Route Geocoding Coordinates State
  const [routeCoords, setRouteCoords] = useState<{ name: string; lat: number; lon: number }[]>([]);
  const [mapLoading, setMapLoading] = useState(false);

  // Helper to extract unique sequential locations
  const getItineraryRoute = () => {
    const route: string[] = [];
    const sortedDays = [...rundown].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

    sortedDays.forEach(day => {
      if (day.activities) {
        const sortedActivities = [...day.activities].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
        sortedActivities.forEach(act => {
          if (act.location && act.location.trim()) {
            route.push(act.location.trim());
          }
        });
      }
    });

    return route.filter((loc, idx) => idx === 0 || loc !== route[idx - 1]);
  };

  const getGoogleMapsDirUrl = () => {
    const locations = getItineraryRoute();
    if (locations.length === 0) return '';
    if (locations.length === 1) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locations[0])}`;
    }
    const origin = encodeURIComponent(locations[0]);
    const destination = encodeURIComponent(locations[locations.length - 1]);
    const waypoints = locations.slice(1, -1).map(loc => encodeURIComponent(loc)).join('|');
    
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    if (waypoints) {
      url += `&waypoints=${waypoints}`;
    }
    return url;
  };

  // Fetch coordinates for unique locations
  useEffect(() => {
    const locations = getItineraryRoute();
    if (locations.length === 0) {
      setRouteCoords([]);
      return;
    }

    const fetchCoords = async () => {
      setMapLoading(true);
      const coordsList: { name: string; lat: number; lon: number }[] = [];
      const targetLocations = locations.slice(0, 10); // Limit to first 10 locations to respect API limits

      try {
        const promises = targetLocations.map(async (loc) => {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(loc)}&limit=1`);
            if (res.ok) {
              const data = await res.json();
              if (data && data[0]) {
                return {
                  name: loc,
                  lat: parseFloat(data[0].lat),
                  lon: parseFloat(data[0].lon)
                };
              }
            }
          } catch (e) {
            console.error('Error geocoding location:', loc, e);
          }
          return null;
        });

        const results = await Promise.all(promises);
        results.forEach(res => {
          if (res) coordsList.push(res);
        });
        setRouteCoords(coordsList);
      } catch (err) {
        console.error('Error fetching route coordinates:', err);
      } finally {
        setMapLoading(false);
      }
    };

    fetchCoords();
  }, [rundown]);

  // Leaflet Dynamic Integration and Initialization
  useEffect(() => {
    if (routeCoords.length === 0) return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    let script = document.getElementById('leaflet-js') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      document.body.appendChild(script);
    }

    const initMap = () => {
      // @ts-ignore
      const L = window.L;
      if (!L) return;

      // @ts-ignore
      if (window.tripOverviewMap) {
        // @ts-ignore
        window.tripOverviewMap.remove();
      }

      const mapContainer = document.getElementById('trip-route-map');
      if (!mapContainer) return;

      // @ts-ignore
      const map = L.map('trip-route-map', { zoomControl: true });
      // @ts-ignore
      window.tripOverviewMap = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      const points: any[] = [];

      routeCoords.forEach((coord, index) => {
        const markerLatLng = [coord.lat, coord.lon];
        points.push(markerLatLng);

        const customIcon = L.divIcon({
          className: 'custom-map-marker',
          html: `<div class="w-6 h-6 rounded-full bg-[oklch(0.38_0.06_210)] border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow">${index + 1}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        L.marker(markerLatLng, { icon: customIcon })
          .addTo(map)
          .bindPopup(`<div class="p-1 font-sans text-xs"><strong>${index + 1}. ${coord.name}</strong></div>`);
      });

      if (points.length >= 2) {
        L.polyline(points, {
          color: '#C79E8D',
          weight: 4,
          dashArray: '6, 6',
          opacity: 0.85
        }).addTo(map);
      }

      if (points.length > 0) {
        map.fitBounds(L.latLngBounds(points), { padding: [30, 30] });
      }
    };

    if (script) {
      if (script.getAttribute('data-loaded') === 'true') {
        initMap();
      } else {
        script.addEventListener('load', () => {
          script.setAttribute('data-loaded', 'true');
          initMap();
        });
      }
    }

    const resizeTimer = setTimeout(() => {
      // @ts-ignore
      if (window.tripOverviewMap) {
        // @ts-ignore
        window.tripOverviewMap.invalidateSize();
      }
    }, 500);

    return () => {
      clearTimeout(resizeTimer);
    };
  }, [routeCoords]);

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

  // Skeleton shimmer loaders to optimize user interface responsiveness under load (NFR implementation)
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header link */}
        <div className="h-4 w-32 bg-[oklch(0.92_0.008_240)] rounded-xl" />
        
        {/* Banner image skeleton */}
        <div className="h-64 md:h-80 w-full rounded-3xl bg-[oklch(0.92_0.008_240)]" />
        
        {/* Stats row skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-3xl bg-[oklch(0.92_0.008_240)]" />
          ))}
        </div>
        
        {/* Content split card skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-44 rounded-3xl bg-[oklch(0.92_0.008_240)]" />
          <div className="h-44 rounded-3xl bg-[oklch(0.92_0.008_240)]" />
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

  // Calculate metrics based on rundown activities
  const totalBudget = parseFloat(trip.budget_total as any);
  const totalSpend = rundown.reduce((sum, day) => sum + (day.activities?.reduce((s: number, a: any) => s + parseFloat(a.cost || 0), 0) || 0), 0);
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
        
        {/* Back navigation button */}
        <Link 
          href="/trips" 
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-xs font-semibold text-[oklch(0.22_0.01_40)] shadow-sm backdrop-blur transition-all"
        >
          <ArrowLeft size={14} /> Kembali
        </Link>

        {/* Text descriptions */}
        <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold bg-white/20 backdrop-blur px-2.5 py-1 rounded-full uppercase tracking-wider">
              {trip.expense_mode === 'split' ? 'Split Bill' : 'Personal'} Mode
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-heading tracking-tight drop-shadow-sm">
            {trip.name}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/90">
            <span className="flex items-center gap-1">
              <MapPin size={13} className="text-[oklch(0.70_0.08_40)]" /> {trip.destination}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={13} /> {formatDateString(trip.start_date)} - {formatDateString(trip.end_date)}
            </span>
          </div>
        </div>

        {/* Top-right Budget floating badge */}
        <div className="absolute top-4 right-4 text-white">
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
              <p className={`text-xl font-extrabold font-heading ${remainingBudget < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
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
        {/* Navigation shortcut card */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold font-heading">Menu Perencanaan</h3>
          
          <div className="grid grid-cols-1 gap-6">
            {/* Unified Rundown & Budget Link Card */}
            <Link href={`/trips/${tripId}/rundown`} className="group block">
              <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white hover:shadow-md transition-all p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[oklch(0.86_0.05_45)] flex items-center justify-center text-[oklch(0.70_0.08_40)] shrink-0">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-[oklch(0.22_0.01_40)] group-hover:text-[oklch(0.70_0.08_40)] transition-colors">
                      Itinerary
                    </h4>
                    <p className="text-xs text-[oklch(0.48_0.01_40)] mt-1 leading-relaxed">
                      Susun jadwal kegiatan harian trip Anda secara visual, atur urutan aktivitas dengan drag and drop, serta kelola anggaran terpadu.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-[oklch(0.70_0.08_40)] pt-2 sm:pt-0 group-hover:translate-x-1 transition-transform shrink-0">
                  Atur Itinerary <ArrowRight size={14} />
                </div>
              </Card>
            </Link>

            {/* Travel Route Map Card */}
            <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden flex flex-col">
              <CardHeader className="pb-3 border-b border-[oklch(0.90_0.008_70)]/40 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-heading text-base font-bold text-[oklch(0.22_0.01_40)] flex items-center gap-2">
                    <Map size={18} className="text-[oklch(0.70_0.08_40)]" />
                    Alur Perjalanan Trip
                  </CardTitle>
                  <p className="text-[10px] text-[oklch(0.48_0.01_40)] mt-0.5">Rute visual menghubungkan lokasi-lokasi itinerary Anda.</p>
                </div>
                {routeCoords.length >= 2 && (
                  <a
                    href={getGoogleMapsDirUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100/80 text-[10px] font-bold text-orange-600 border border-orange-100 transition-colors cursor-pointer"
                  >
                    <ExternalLink size={12} />
                    Petunjuk Google Maps
                  </a>
                )}
              </CardHeader>

              <CardContent className="p-0 relative flex-1 min-h-[300px]">
                {mapLoading ? (
                  <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
                    <Loader2 className="animate-spin text-[oklch(0.70_0.08_40)]" size={24} />
                    <span className="text-xs text-[oklch(0.48_0.01_40)] font-medium">Memetakan rute perjalanan...</span>
                  </div>
                ) : null}

                {routeCoords.length === 0 ? (
                  <div className="absolute inset-0 bg-slate-50/30 flex flex-col items-center justify-center text-center p-6 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-[oklch(0.92_0.008_240)] flex items-center justify-center text-[oklch(0.38_0.06_210)]">
                      <MapPin size={22} />
                    </div>
                    <h5 className="font-bold text-sm text-[oklch(0.22_0.01_40)]">Belum Ada Lokasi Rute</h5>
                    <p className="text-xs text-[oklch(0.48_0.01_40)] max-w-sm leading-relaxed">
                      Tambahkan kegiatan yang berisi nama lokasi di menu **Itinerary** untuk menampilkan visualisasi alur rute perjalanan di sini.
                    </p>
                  </div>
                ) : (
                  <div className="w-full h-full min-h-[300px] relative">
                    <div id="trip-route-map" className="w-full h-full min-h-[300px] rounded-b-3xl" />
                    
                    {/* Floating Info Overlay showing the Route stops count */}
                    <div className="absolute bottom-4 left-4 z-[400] bg-white/90 backdrop-blur-sm border border-[oklch(0.90_0.008_70)] px-3 py-2 rounded-2xl shadow-sm text-[10px] text-[oklch(0.22_0.01_40)] font-semibold flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                      <span>{routeCoords.length} Pemberhentian Terdeteksi</span>
                    </div>

                    <style>{`
                      .leaflet-popup-content-wrapper {
                        border-radius: 16px !important;
                        border: 1px solid oklch(0.90 0.008 70) !important;
                        box-shadow: 0 4px 12px -2px rgb(0 0 0 / 0.08) !important;
                        padding: 2px !important;
                      }
                      .leaflet-popup-content {
                        margin: 8px 12px !important;
                      }
                      .leaflet-popup-tip-container {
                        display: none !important;
                      }
                    `}</style>
                  </div>
                )}
              </CardContent>
            </Card>
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
                      className="h-8 w-8 shrink-0 rounded-lg bg-[oklch(0.92_0.008_240)] text-[oklch(0.22_0.01_40)] hover:bg-[oklch(0.90_0.008_70)]"
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
