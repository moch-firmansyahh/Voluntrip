'use client';

import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
}

export default function SplashScreen({ onFinish, durationMs = 1500 }: SplashScreenProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, Math.max(0, durationMs - 300));

    const finishTimer = setTimeout(() => {
      onFinish();
    }, durationMs);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish, durationMs]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-white flex flex-col items-center justify-between py-12 px-6 select-none overflow-hidden transition-all duration-300 ease-out ${
        exiting ? 'opacity-0 scale-98 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Spacer Top */}
      <div />

      {/* Traveloka Style Centered Logo & Loader */}
      <div className="flex flex-col items-center gap-6 text-center animate-fade-in">
        {/* Main Brand Logo */}
        <div className="relative transform transition-transform duration-500 hover:scale-105">
          <img
            src="/images/Logo_voluntrip.png"
            alt="Voluntrip Logo"
            className="h-14 md:h-16 w-auto object-contain drop-shadow-sm"
          />
        </div>

        {/* Traveloka Style Smooth Moving Line Indicator */}
        <div className="w-28 h-1 bg-slate-100 rounded-full overflow-hidden relative">
          <div className="absolute top-0 bottom-0 w-10 bg-gradient-to-r from-sky-400 via-[oklch(0.70_0.08_40)] to-amber-500 rounded-full traveloka-loader-move" />
        </div>
      </div>

      {/* Traveloka Style Footer Branding Tagline */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
          Voluntrip
        </p>
        <p className="text-[10px] text-slate-300 font-medium">
          Plan your journey, share the fun
        </p>
      </div>

      {/* Traveloka Loader Motion Keyframe */}
      <style>{`
        @keyframes travelokaLoaderMove {
          0% {
            left: -35%;
          }
          50% {
            left: 100%;
          }
          100% {
            left: -35%;
          }
        }
        .traveloka-loader-move {
          animation: travelokaLoaderMove 1.3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
