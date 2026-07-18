import LoadingScreen from '@/components/shared/LoadingScreen';

export default function RootLoading() {
  return (
    <div className="fixed inset-0 bg-[oklch(0.98_0.006_70)] z-[9999] flex items-center justify-center">
      <LoadingScreen message="Memuat Voluntrip..." />
    </div>
  );
}
