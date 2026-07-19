'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingScreen from '@/components/shared/OnboardingScreen';
import SplashScreen from '@/components/shared/SplashScreen';

export default function IndexPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [viewState, setViewState] = useState<'onboarding' | 'splash'>('splash');

  useEffect(() => {
    setMounted(true);
    try {
      const onboardingSeen = localStorage.getItem('voluntrip_onboarding_seen');
      if (!onboardingSeen) {
        setViewState('onboarding');
      } else {
        setViewState('splash');
      }
    } catch (e) {
      setViewState('splash');
    }
  }, []);

  const handleFinishOnboarding = () => {
    router.push('/login');
  };

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

  // Wait until mounted on client to prevent SSR state mismatch
  if (!mounted) {
    return <SplashScreen onFinish={() => {}} durationMs={999999} />;
  }

  if (viewState === 'onboarding') {
    return <OnboardingScreen onFinish={handleFinishOnboarding} />;
  }

  return <SplashScreen onFinish={handleFinishSplash} durationMs={1200} />;
}
