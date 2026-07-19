'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingScreen from '@/components/shared/OnboardingScreen';
import SplashScreen from '@/components/shared/SplashScreen';

function getInitialViewState() {
  if (typeof window === 'undefined') return 'splash';
  try {
    const onboardingSeen = localStorage.getItem('voluntrip_onboarding_seen');
    return onboardingSeen ? 'splash' : 'onboarding';
  } catch (e) {
    return 'splash';
  }
}

export default function IndexPage() {
  const router = useRouter();
  const [viewState] = useState<'onboarding' | 'splash'>(getInitialViewState);

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

  if (viewState === 'onboarding') {
    return <OnboardingScreen onFinish={handleFinishOnboarding} />;
  }

  return <SplashScreen onFinish={handleFinishSplash} durationMs={1200} />;
}
