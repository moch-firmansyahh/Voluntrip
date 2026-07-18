'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function TripsListLoading() {
  return (
    <div className="fixed inset-0 bg-[oklch(0.98_0.006_70)] flex flex-col items-center justify-center gap-4 z-50 animate-fade-in">
      <div className="relative flex flex-col items-center">
        <div className="absolute inset-0 rounded-full bg-[oklch(0.70_0.08_40)]/10 blur-xl animate-pulse scale-150" />
        <img 
          src="/images/Logo_voluntrip.png" 
          alt="Voluntrip Logo" 
          className="h-16 w-auto object-contain relative z-10 animate-bounce" 
          style={{ animationDuration: '2s' }}
        />
      </div>
      <div className="flex items-center gap-2 text-xs font-bold text-[oklch(0.48_0.01_40)] relative z-10 mt-2">
        <Loader2 className="animate-spin text-[oklch(0.70_0.08_40)]" size={16} />
        <span>Memuat daftar perjalanan Anda...</span>
      </div>
    </div>
  );
}
