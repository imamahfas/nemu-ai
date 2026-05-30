import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showIOSInstall, setShowIOSInstall] = useState(false);
  const { t, i18n } = useTranslation();
  const isId = i18n.language?.startsWith('id');

  useEffect(() => {
    // Detect iOS devices
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // Check if the application is running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

    // Check if user previously dismissed the iOS install banner
    const isIOSDismissed = localStorage.getItem('nemu_ios_install_dismissed') === 'true';

    if (isIOSDevice && !isStandalone && !isIOSDismissed) {
      setShowIOSInstall(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowInstall(false);
    } else {
      console.log('User dismissed the install prompt');
    }
    setDeferredPrompt(null);
  };

  const handleDismissIOS = () => {
    localStorage.setItem('nemu_ios_install_dismissed', 'true');
    setShowIOSInstall(false);
  };

  return (
    <AnimatePresence>
      {/* Standard Android / Chrome Install Prompt */}
      {showInstall && (
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-4 right-4 z-50 bg-stone-900 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between border border-stone-800"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-stone-900">
              <span className="font-serif italic font-black text-lg">N</span>
            </div>
            <div>
              <p className="font-bold text-sm">{t('install_app_title')}</p>
              <p className="text-xs text-stone-400">{t('install_app_desc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleInstallClick}
              className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform flex items-center gap-2"
            >
              <Download size={14} /> {t('install')}
            </button>
            <button onClick={() => setShowInstall(false)} className="p-2 text-stone-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Premium iOS Safari PWA Install Prompt */}
      {showIOSInstall && (
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-4 right-4 z-50 bg-stone-900 text-white rounded-3xl p-5 shadow-2xl border border-stone-800 space-y-4"
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-stone-900 shadow-lg">
                <span className="font-serif italic font-black text-lg">N</span>
              </div>
              <div>
                <p className="font-bold text-sm">
                  {isId ? 'Instal Nemu di iOS' : 'Install Nemu on iOS'}
                </p>
                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">
                  {isId ? 'Panduan Layar Utama' : 'Home Screen Shortcut'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleDismissIOS} 
              className="p-1.5 text-stone-400 hover:text-white bg-stone-800 rounded-full transition-colors active:scale-90"
              aria-label="Tutup / Dismiss"
            >
              <X size={16} />
            </button>
          </div>

          <div className="bg-stone-800/50 p-3.5 rounded-2xl border border-stone-800 text-xs text-stone-200 space-y-2.5 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <span className="text-base flex-shrink-0">1️⃣</span>
              <p>
                {isId 
                  ? 'Ketuk tombol **Bagikan** (Share) 📤 di menu bar browser Anda.' 
                  : 'Tap the **Share** button 📤 in your browser\'s menu bar.'}
              </p>
            </div>
            <div className="flex items-start gap-2.5 border-t border-stone-800/80 pt-2.5">
              <span className="text-base flex-shrink-0">2️⃣</span>
              <p>
                {isId 
                  ? 'Gulir ke bawah dan pilih **"Tambahkan ke Layar Utama"** (Add to Home Screen) ➕.' 
                  : 'Scroll down and select **"Add to Home Screen"** ➕.'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

