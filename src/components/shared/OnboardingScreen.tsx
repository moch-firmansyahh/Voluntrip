'use client';

import React, { useState } from 'react';
import { Compass, Clock, DollarSign, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingScreenProps {
  onFinish: () => void;
}

const SLIDES = [
  {
    icon: Compass,
    title: 'Rencanakan Trip dengan Mudah',
    description: 'Atur tanggal perjalanan dan destinasi impianmu dalam satu tampilan yang rapi dan elegan.',
    badge: 'Fitur Perencanaan',
    bgGradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-100',
  },
  {
    icon: Clock,
    title: 'Susun Rundown Jam Otomatis',
    description: 'Jadwal kegiatan harian tersusun sekuensial bebas bentrok, lengkap dengan drag and drop gelembung.',
    badge: 'Fitur Itinerary',
    bgGradient: 'from-teal-500/10 via-emerald-500/5 to-transparent',
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-100',
  },
  {
    icon: DollarSign,
    title: 'Pantau Budget & Pengeluaran',
    description: 'Lacak pengeluaran per kategori, kelola anggaran perjalanan, dan dukung mode Split Bill kelompok.',
    badge: 'Fitur Transaksi',
    bgGradient: 'from-rose-500/10 via-orange-500/5 to-transparent',
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-100',
  },
];

export default function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = () => {
    try {
      localStorage.setItem('voluntrip_onboarding_seen', 'true');
    } catch (e) {
      console.error('Failed to set localStorage flag:', e);
    }
    onFinish();
  };

  const slide = SLIDES[currentSlide];
  const IconComponent = slide.icon;

  return (
    <div className="fixed inset-0 z-50 bg-[oklch(0.98_0.006_70)] flex flex-col items-center justify-between p-6 md:p-10 select-none animate-fade-in overflow-hidden">
      {/* Top Header Logo */}
      <div className="w-full max-w-md flex items-center justify-between pt-2">
        <img src="/images/Logo_voluntrip.png" alt="Voluntrip Logo" className="h-9 w-auto object-contain" />
        <button
          type="button"
          onClick={finishOnboarding}
          className="text-xs font-bold text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.22_0.01_40)] transition-colors cursor-pointer"
        >
          Lewati
        </button>
      </div>

      {/* Slide Content Card */}
      <div className="w-full max-w-md my-auto flex flex-col items-center text-center space-y-6 animate-fade-in key={currentSlide}">
        {/* Animated Icon Circle */}
        <div className={`relative w-32 h-32 rounded-full ${slide.iconBg} flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-105`}>
          <div className="absolute inset-0 rounded-full bg-white/40 animate-ping opacity-25" />
          <IconComponent size={56} className={`${slide.iconColor} stroke-[2]`} />
        </div>

        {/* Text Details */}
        <div className="space-y-3 px-4">
          <span className="inline-block px-3 py-1 rounded-full bg-white border border-[oklch(0.90_0.008_70)] text-[10px] font-extrabold uppercase tracking-widest text-[oklch(0.70_0.08_40)] shadow-sm">
            {slide.badge}
          </span>
          <h2 className="text-2xl md:text-3xl font-black font-heading text-[oklch(0.22_0.01_40)] leading-tight">
            {slide.title}
          </h2>
          <p className="text-xs md:text-sm text-[oklch(0.48_0.01_40)] leading-relaxed max-w-xs mx-auto">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Footer Indicators & Next Button */}
      <div className="w-full max-w-md space-y-6 pb-4">
        {/* Dot Indicators */}
        <div className="flex items-center justify-center gap-2">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentSlide
                  ? 'w-8 bg-[oklch(0.70_0.08_40)] shadow-sm'
                  : 'w-2.5 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Action Button */}
        <Button
          type="button"
          onClick={handleNext}
          className="w-full h-12 rounded-2xl bg-[oklch(0.70_0.08_40)] text-white hover:bg-[oklch(0.70_0.08_40)]/90 text-sm font-bold shadow-lg shadow-rose-200/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {currentSlide === SLIDES.length - 1 ? (
            <>
              Mulai Sekarang <Check size={18} />
            </>
          ) : (
            <>
              Lanjut <ChevronRight size={18} />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
