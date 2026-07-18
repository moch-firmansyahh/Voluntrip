export default function LoadingScreen({ message = 'Memuat...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full select-none">
      {/* Central logo cluster */}
      <div className="relative flex items-center justify-center">
        {/* Outer glow ring */}
        <div className="absolute w-32 h-32 rounded-full bg-gradient-to-tr from-[oklch(0.70_0.08_40)]/10 to-[oklch(0.85_0.07_70)]/10 loading-glow-pulse" />
        
        {/* Orbital ring */}
        <div className="absolute w-24 h-24 rounded-full border-2 border-dashed border-[oklch(0.88_0.02_40)] loading-orbit" />
        
        {/* Orbital dot */}
        <div className="absolute w-24 h-24 loading-orbit" style={{ animationDuration: '2.5s' }}>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[oklch(0.70_0.08_40)] to-[oklch(0.60_0.12_30)] shadow-sm shadow-[oklch(0.70_0.08_40)]/30" />
        </div>

        {/* Logo */}
        <img 
          src="/images/Logo_voluntrip.png" 
          alt="Voluntrip" 
          className="h-14 w-auto object-contain relative z-10 loading-logo-entry" 
        />
      </div>

      {/* Text + bouncing dots */}
      <div className="mt-6 flex flex-col items-center gap-2.5 loading-text-fade">
        <span className="text-xs font-bold text-[oklch(0.40_0.02_40)] tracking-wide">
          {message}
        </span>

        {/* Bouncing dots */}
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[oklch(0.70_0.08_40)] loading-dot" />
          <div className="w-1.5 h-1.5 rounded-full bg-[oklch(0.70_0.08_40)] loading-dot loading-dot-2" />
          <div className="w-1.5 h-1.5 rounded-full bg-[oklch(0.70_0.08_40)] loading-dot loading-dot-3" />
        </div>
      </div>
    </div>
  );
}
