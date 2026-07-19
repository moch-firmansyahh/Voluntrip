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
      className={`fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 select-none overflow-hidden transition-opacity duration-300 ease-out ${
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Voluntrip Logo */}
        <div className="relative transform transition-transform duration-500 hover:scale-105">
          <img
            src="/images/Logo_voluntrip.png"
            alt="Voluntrip Logo"
            className="h-16 w-auto object-contain animate-pulse"
          />
        </div>

        {/* Moving Animated Line / Wave Underneath Logo */}
        <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
          <div className="absolute top-0 bottom-0 w-12 bg-gradient-to-r from-transparent via-[oklch(0.70_0.08_40)] to-transparent rounded-full splash-line-move" />
        </div>
      </div>

      {/* Animation Keyframes */}
      <style>{`
        @keyframes splashLineMove {
          0% {
            left: -40%;
          }
          50% {
            left: 100%;
          }
          100% {
            left: -40%;
          }
        }
        .splash-line-move {
          animation: splashLineMove 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
