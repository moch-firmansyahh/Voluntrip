export default function LoadingScreen({ message = 'Memuat...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full select-none">
      {/* Central logo cluster */}
      <div className="relative flex items-center justify-center">
        {/* Soft glow behind logo */}
        <div className="absolute w-28 h-28 rounded-full bg-gradient-to-tr from-[oklch(0.70_0.08_40)]/8 to-[oklch(0.85_0.07_70)]/8 loading-glow-pulse" />

        {/* Logo */}
        <img 
          src="/images/Logo_voluntrip.png" 
          alt="Voluntrip" 
          className="h-14 w-auto object-contain relative z-10 loading-logo-entry" 
        />
      </div>

      {/* Text */}
      <div className="mt-5 flex flex-col items-center gap-3 loading-text-fade">
        <span className="text-xs font-bold text-[oklch(0.40_0.02_40)] tracking-wide">
          {message}
        </span>

        {/* Shimmer bar */}
        <div className="w-24 h-1 rounded-full loading-shimmer-bar" />
      </div>
    </div>
  );
}
