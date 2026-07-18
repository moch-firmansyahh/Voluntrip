'use client';

import React, { useEffect, useState } from 'react';

interface LeafletMapProps {
  routeCoords: { name: string; lat: number; lon: number }[];
  mapTheme: string;
}

export default function LeafletMap({ routeCoords, mapTheme }: LeafletMapProps) {
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Dynamic injection of Leaflet CSS and JS
  useEffect(() => {
    if (routeCoords.length === 0) return;

    // Inject CSS
    let link = document.getElementById('leaflet-css') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Inject JS
    let script = document.getElementById('leaflet-js') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      // @ts-ignore
      if (window.L) {
        setLeafletLoaded(true);
      } else {
        script.addEventListener('load', () => setLeafletLoaded(true));
      }
    }
  }, [routeCoords]);

  // Handle map instance creation and update when Leaflet JS or mapTheme changes
  useEffect(() => {
    if (!leafletLoaded || routeCoords.length === 0) return;

    // @ts-ignore
    const L = window.L;
    if (!L) return;

    // Clean up previous map if exists
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

    // Save markers globally for interactive clicks
    // @ts-ignore
    window.tripMarkers = [];

    const points: any[] = [];

    routeCoords.forEach((coord, index) => {
      const markerLatLng = [coord.lat, coord.lon];
      points.push(markerLatLng);

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div class="w-7 h-7 rounded-full bg-[oklch(0.38_0.06_210)] border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-md hover:scale-110 transition-transform custom-map-marker-glow">${index + 1}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker(markerLatLng, { icon: customIcon })
        .addTo(map)
        .bindPopup(`<div class="p-1 font-sans text-xs"><strong>${index + 1}. ${coord.name}</strong></div>`);

      // @ts-ignore
      window.tripMarkers.push(marker);
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
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    }

    // Set tile layer
    let tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    let attribution = '&copy; OpenStreetMap &copy; CARTO';

    if (mapTheme === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png';
    } else if (mapTheme === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles &copy; Esri &mdash; Community Map';
    }

    const layer = L.tileLayer(tileUrl, { attribution, maxZoom: 20 }).addTo(map);
    // @ts-ignore
    window.activeTileLayer = layer;

    // Trigger immediate resize recalculation for reliable rendering
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      clearTimeout(resizeTimer);
    };
  }, [routeCoords, leafletLoaded, mapTheme]);

  return (
    <div 
      id="trip-route-map" 
      className="w-full h-full rounded-2xl overflow-hidden relative shadow-inner"
      style={{ minHeight: '380px', height: '100%' }}
    />
  );
}
