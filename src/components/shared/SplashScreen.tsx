'use client';

import React, { useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[oklch(0.98_0.006_70)] via-orange-50/40 to-[oklch(0.94_0.01_70)] flex flex-col items-center justify-center p-6 select-none animate-fade-in overflow-hidden">
      {/* Background Decorative Blurs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-orange-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Main Glassmorphism Card */}
      <div className="relative z-10 bg-white/80 backdrop-blur-2xl border border-white/80 shadow-2xl rounded-3xl p-8 max-w-xs w-full flex flex-col items-center text-center space-y-6 transition-all duration-500 transform hover:scale-[1.02]">
        
        {/* Logo Container with Glowing Aura */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-3xl blur-md opacity-40 animate-pulse" />
          <div className="relative w-20 h-20 rounded-3xl bg-white p-3 shadow-xl flex items-center justify-center border border-white/60">
            <img
              src="/images/Logo_voluntrip.png"
              alt="Voluntrip Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Text Slogan */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black font-heading text-[oklch(0.22_0.01_40)] tracking-tight">
            Voluntrip
          </h1>
          <p className="text-xs text-[oklch(0.48_0.01_40)] font-medium flex items-center justify-center gap-1">
            <span>Plan your journey, share the fun</span>
          </p>
        </div>

        {/* Progress Bar Loading Indicator */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden relative">
          <div className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-teal-500 animate-pulse rounded-full w-full" />
        </div>
      </div>
    </div>
  );
}
