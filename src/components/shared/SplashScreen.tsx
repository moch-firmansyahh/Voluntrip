'use client';

import React, { useEffect } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
}

export default function SplashScreen({ onFinish, durationMs = 1200 }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [onFinish, durationMs]);

  return (
    <div className="fixed inset-0 z-50 bg-[#c17a5f] flex flex-col items-center justify-center p-6 select-none animate-fade-in">
      <div className="flex flex-col items-center gap-4 text-center animate-pulse">
        <div className="w-24 h-24 rounded-3xl bg-white p-3 shadow-2xl flex items-center justify-center border-2 border-white/40 transform scale-105">
          <img
            src="/images/Logo_voluntrip.png"
            alt="Voluntrip Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="space-y-1 text-white">
          <h1 className="text-2xl font-black font-heading tracking-tight drop-shadow-md">Voluntrip</h1>
          <p className="text-xs text-white/80 font-medium tracking-wide">Plan your journey, share the fun</p>
        </div>
      </div>
    </div>
  );
}
