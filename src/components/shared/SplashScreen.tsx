'use client';

import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
}

export default function SplashScreen({ onFinish, durationMs = 1600 }: SplashScreenProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Trigger exit animation shortly before calling onFinish
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
      className={`fixed inset-0 z-50 bg-[#12151c] flex flex-col items-center justify-center p-6 select-none overflow-hidden transition-all duration-300 ease-out ${
        exiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Radial Light Glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-amber-500/15 via-orange-500/20 to-teal-500/10 blur-3xl pointer-events-none mate-bg-glow" />

      {/* Ripple Rings Animation */}
      <div className="absolute w-32 h-32 rounded-full border border-amber-500/30 mate-ripple-1 pointer-events-none" />
      <div className="absolute w-32 h-32 rounded-full border border-orange-500/20 mate-ripple-2 pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-6">
        
        {/* Logo Reveal Box */}
        <div className="relative mate-logo-container">
          {/* Subtle Outer Glow */}
          <div className="absolute -inset-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-[2rem] blur-xl opacity-50 mate-logo-glow" />
          
          <div className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/80 p-4 shadow-2xl flex items-center justify-center">
            <img
              src="/images/Logo_voluntrip.png"
              alt="Voluntrip Logo"
              className="w-full h-full object-contain filter drop-shadow-md mate-logo-icon"
            />
          </div>
        </div>

        {/* Brand Typography Reveal */}
        <div className="space-y-1.5 mate-text-reveal">
          <h1 className="text-3xl font-black font-heading tracking-widest text-white uppercase drop-shadow-lg">
            Voluntrip
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-wider">
            Plan your journey, share the fun
          </p>
        </div>

        {/* Minimalist Dot Pulse Loader */}
        <div className="flex items-center gap-2 pt-2 mate-loader-dots">
          <span className="w-2 h-2 rounded-full bg-amber-400 mate-dot-1" />
          <span className="w-2 h-2 rounded-full bg-orange-500 mate-dot-2" />
          <span className="w-2 h-2 rounded-full bg-teal-400 mate-dot-3" />
        </div>
      </div>

      {/* Custom CSS Keyframe Animations for Dribbble MATEEFFECTS Style */}
      <style>{`
        @keyframes mateLogoIn {
          0% {
            transform: scale(0) rotate(-15deg);
            opacity: 0;
          }
          65% {
            transform: scale(1.15) rotate(2deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes mateRipple {
          0% {
            transform: scale(0.6);
            opacity: 0.8;
          }
          100% {
            transform: scale(2.8);
            opacity: 0;
          }
        }

        @keyframes mateTextUp {
          0% {
            transform: translateY(20px);
            opacity: 0;
            filter: blur(4px);
          }
          100% {
            transform: translateY(0);
            opacity: 1;
            filter: blur(0);
          }
        }

        @keyframes mateDotPulse {
          0%, 100% {
            transform: scale(0.6);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.3);
            opacity: 1;
          }
        }

        @keyframes mateGlowPulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.95);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }

        .mate-logo-container {
          animation: mateLogoIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .mate-logo-glow {
          animation: mateGlowPulse 2s ease-in-out infinite;
        }

        .mate-ripple-1 {
          animation: mateRipple 1.4s cubic-bezier(0, 0.2, 0.8, 1) 0.1s infinite;
        }

        .mate-ripple-2 {
          animation: mateRipple 1.4s cubic-bezier(0, 0.2, 0.8, 1) 0.5s infinite;
        }

        .mate-text-reveal {
          animation: mateTextUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both;
        }

        .mate-loader-dots {
          animation: mateTextUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both;
        }

        .mate-dot-1 {
          animation: mateDotPulse 1s ease-in-out 0.1s infinite;
        }
        .mate-dot-2 {
          animation: mateDotPulse 1s ease-in-out 0.3s infinite;
        }
        .mate-dot-3 {
          animation: mateDotPulse 1s ease-in-out 0.5s infinite;
        }
      `}</style>
    </div>
  );
}
