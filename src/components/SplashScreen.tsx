import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function SplashScreen({ 
  authLoading, 
  onComplete 
}: { 
  authLoading: boolean; 
  onComplete: () => void; 
}) {
  const [progress, setProgress] = useState(0);

  // Ultra-safe synchronous browser-level language detection bypassing React i18n Suspense boundaries
  const isId = typeof navigator !== 'undefined' && (
    navigator.language?.startsWith('id') || 
    (navigator.languages && navigator.languages.some(l => l.startsWith('id')))
  );

  // Increment percentage smooth-loading simulation (Tokopedia-style)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }

        // If the database has finished loading, surge progress to 100% instantly!
        if (!authLoading) {
          return Math.min(100, prev + 15);
        }

        // If the database is still loading, cruise and hold at 92% to wait for auth state
        if (prev >= 92) {
          return 92;
        }

        // Normal dynamic increment step
        const step = prev < 30 ? 4 : prev < 75 ? 3 : 2;
        return Math.min(92, prev + step);
      });
    }, 20); // Super fast 20ms cycles for ultra-responsive feedback
    return () => clearInterval(interval);
  }, [authLoading]);

  // Smooth fade-out delay after loading achieves 100%
  useEffect(() => {
    if (progress === 100) {
      const delay = setTimeout(() => {
        onComplete();
      }, 350); // Snappy exit delay
      return () => clearTimeout(delay);
    }
  }, [progress, onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-[9999] bg-[#fdfcfb] flex flex-col items-center justify-between p-12 overflow-hidden text-stone-900"
    >
      {/* Decorative Pastel Background */}
      <div className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-15%] w-[70%] h-[70%] bg-gradient-to-br from-orange-100/40 to-transparent blur-[80px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[70%] h-[70%] bg-gradient-to-br from-emerald-100/40 to-transparent blur-[80px] rounded-full" />
      </div>

      {/* Spacing dummy */}
      <div className="h-10" />

      {/* Central Brand Identity Squircle */}
      <div className="flex flex-col items-center space-y-6 z-10">
        <motion.div 
          initial={{ scale: 0.4, rotate: -25, opacity: 0 }}
          animate={{ scale: 1, rotate: 12, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 15, delay: 0.15 }}
          className="w-32 h-32 bg-stone-900 text-white rounded-[2.8rem] flex items-center justify-center shadow-2xl relative"
        >
          {/* Logo glow ring */}
          <div className="absolute inset-0 bg-orange-400 rounded-[2.8rem] blur-2xl opacity-20 animate-pulse" />
          <span className="text-6xl font-serif italic font-black select-none">N</span>
        </motion.div>

        <div className="text-center space-y-2">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-brand font-bold tracking-tight text-stone-900"
          >
            Nemu
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-stone-400 text-xs font-semibold uppercase tracking-[0.25em]"
          >
            {isId ? 'Harmoni Keuangan Keluarga' : 'Family Financial Harmony'}
          </motion.p>
        </div>
      </div>

      {/* Progress loading bar and watermark at footer */}
      <div className="w-full max-w-xs flex flex-col items-center space-y-8 z-10">
        
        {/* Sleek dynamic loading bar */}
        <div className="w-full space-y-2.5">
          <div className="flex justify-between items-center text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">
            <span className="flex items-center gap-1.5 animate-pulse">
              <Sparkles size={10} className="text-orange-400 fill-orange-400" />
              {isId ? 'Memuat sistem...' : 'Syncing Engine...'}
            </span>
            <span>{progress}%</span>
          </div>

          <div className="w-full bg-stone-200/50 h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner relative border border-stone-100/30">
            {/* Pulsing indicator line */}
            <motion.div 
              className="h-full bg-gradient-to-r from-orange-400 via-amber-400 to-emerald-500 rounded-full relative"
              style={{ width: `${progress}%` }}
              transition={{ ease: "easeOut" }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white rounded-full blur-[2px] opacity-80 animate-pulse" />
            </motion.div>
          </div>
        </div>

        {/* Dynamic Watermark */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.7 }}
          className="text-center space-y-1"
        >
          <p className="text-[9px] font-bold text-stone-300 uppercase tracking-[0.4em] select-none">
            {isId ? 'Didukung AI Finansial' : 'AI Financial Framework'}
          </p>
          <p className="text-[8px] font-medium text-stone-400 uppercase tracking-widest select-none">
            Version 1.3.0
          </p>
        </motion.div>

      </div>
    </motion.div>
  );
}
