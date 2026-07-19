'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface LocationItem {
  name: string;
  city?: string;
  state?: string;
  country?: string;
  formattedName: string;
  lat: number;
  lon: number;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string, lat?: number | null, lon?: number | null) => void;
  placeholder?: string;
  className?: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Cari lokasi (cth: Pantai Pangandaran)...',
  className = '',
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomText, setIsCustomText] = useState(false);
  const selectedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state when external value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced fetch to Photon Komoot OpenStreetMap API
  useEffect(() => {
    if (!inputValue || inputValue.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (selectedRef.current) {
      selectedRef.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(inputValue)}&limit=6&lang=id`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.features) {
            const formatted: LocationItem[] = data.features.map((f: any) => {
              const p = f.properties || {};
              const nameParts = [
                p.name,
                p.city || p.town || p.district,
                p.state,
                p.country
              ].filter(Boolean);
              return {
                name: p.name || inputValue,
                city: p.city || p.town || p.district,
                state: p.state,
                country: p.country,
                formattedName: nameParts.join(', '),
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0],
              };
            });
            setSuggestions(formatted);
            setIsOpen(formatted.length > 0);
          }
        }
      } catch (error) {
        console.error('Photon autocomplete error:', error);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setInputValue(newVal);
    setIsCustomText(true);
    onChange(newVal, null, null); // Clear coords for raw custom input
  };

  const handleSelect = (item: LocationItem) => {
    selectedRef.current = true;
    setInputValue(item.formattedName);
    setIsCustomText(false);
    setIsOpen(false);
    onChange(item.formattedName, item.lat, item.lon);
  };

  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    setIsCustomText(false);
    setIsOpen(false);
    onChange('', null, null);
  };

  return (
    <div ref={containerRef} className={`relative space-y-1 ${className}`}>
      <div className="relative flex items-center">
        <MapPin size={15} className="absolute left-3 text-[oklch(0.70_0.08_40)] pointer-events-none shrink-0" />
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="pl-9 pr-8 rounded-xl border-[oklch(0.90_0.008_70)] text-xs h-9 bg-white"
        />
        {loading ? (
          <Loader2 size={14} className="absolute right-3 animate-spin text-slate-400" />
        ) : inputValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {/* Suggestion Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[oklch(0.90_0.008_70)] rounded-2xl shadow-xl z-50 overflow-hidden max-h-56 overflow-y-auto animate-fade-in divide-y divide-slate-100">
          {suggestions.map((item, idx) => (
            <button
              key={`${item.lat}-${item.lon}-${idx}`}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors flex items-start gap-2 text-xs cursor-pointer group"
            >
              <MapPin size={14} className="text-teal-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[oklch(0.22_0.01_40)] truncate">{item.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{item.formattedName}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Hint for custom un-autocompleted location text */}
      {isCustomText && inputValue.length >= 3 && !isOpen && (
        <p className="text-[10px] text-amber-600 font-medium pt-0.5 flex items-center gap-1">
          <span>ℹ️ Lokasi ini tidak terdeteksi otomatis di peta, pastikan penulisannya jelas.</span>
        </p>
      )}
    </div>
  );
}
