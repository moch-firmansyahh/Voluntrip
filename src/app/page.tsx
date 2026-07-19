'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/shared/SplashScreen';

export default function IndexPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFinishSplash = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    } catch (e) {
      router.push('/login');
    }
  };

  if (!mounted) {
    return <SplashScreen onFinish={() => {}} durationMs={999999} />;
  }

  return <SplashScreen onFinish={handleFinishSplash} durationMs={1200} />;
}
