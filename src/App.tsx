import React, { useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './views/Dashboard';
import { InstallPWA } from './components/InstallPWA';
import { LogIn, Sparkles, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { SplashScreen } from './components/SplashScreen';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen bg-[#fdfcfb] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-stone-100 border-t-orange-400 rounded-full animate-spin" />
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
}

function LoginPage() {
  const { signIn, user } = useAuth();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'id' ? 'en' : 'id');
  };
  
  if (user) return <Navigate to="/" />;
  
  return (
    <div className="min-h-screen bg-[#fdfcfb] flex flex-col items-center justify-center p-8 text-stone-900 overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-gradient-to-br from-orange-100/50 to-transparent blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], rotate: [0, -5, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-gradient-to-br from-emerald-100/50 to-transparent blur-[120px] rounded-full" 
        />
      </div>

      <div className="absolute top-8 right-8 z-20">
        <button 
          onClick={toggleLanguage}
          className="p-3 glass rounded-2xl border border-stone-100 text-stone-500 hover:text-stone-900 flex items-center gap-2 transition-all active:scale-95 shadow-sm"
        >
          <Languages size={18} className="text-orange-400" />
          <span className="text-xs font-bold uppercase tracking-tight">{i18n.language}</span>
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 50, damping: 20 }}
        className="z-10 text-center space-y-12 max-w-sm w-full"
      >
        <div className="space-y-6">
          <motion.div 
            initial={{ scale: 0.5, rotate: -20 }}
            animate={{ scale: 1, rotate: 12 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
            className="w-28 h-28 bg-stone-900 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl relative"
          >
            <div className="absolute inset-0 bg-orange-400 rounded-[2.5rem] blur-xl opacity-20 -z-10 animate-pulse" />
            <span className="text-5xl font-serif italic font-black">N</span>
          </motion.div>
          
          <div className="space-y-3">
            <h1 className="text-6xl font-brand font-bold tracking-tighter text-stone-900">{t('app_name')}</h1>
            <p className="text-stone-400 text-lg leading-tight font-medium tracking-tight">
              {t('slogan')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-left">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white/80 p-5 rounded-[2rem] border border-stone-100 shadow-sm backdrop-blur-sm"
          >
            <Sparkles size={20} className="text-orange-400 mb-3 fill-orange-400/20" />
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{i18n.language.startsWith('id') ? 'Didukung AI' : 'AI Powered'}</p>
            <p className="text-xs font-bold text-stone-700 leading-tight">{t('smart_scanning')}</p>
          </motion.div>
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white/80 p-5 rounded-[2rem] border border-stone-100 shadow-sm backdrop-blur-sm"
          >
            <div className="flex gap-1.5 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-sm shadow-orange-200" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-200" />
            </div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{i18n.language.startsWith('id') ? 'Kolaboratif' : 'Collaborative'}</p>
            <p className="text-xs font-bold text-stone-700 leading-tight">{t('shared_wallets')}</p>
          </motion.div>
        </div>

        <div className="space-y-4">
          <button 
            onClick={signIn}
            className="w-full h-16 bg-stone-900 text-white rounded-[2rem] font-bold flex items-center justify-center gap-3 hover:bg-stone-800 transition-all active:scale-95 shadow-2xl shadow-stone-300"
          >
            <LogIn size={22} className="text-orange-400" />
            {t('sign_in_google')}
          </button>
          
          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] flex-1 bg-stone-100" />
            <p className="text-[10px] text-stone-300 uppercase tracking-[0.3em] font-bold">
              {i18n.language.startsWith('id') ? 'Kualitas Premium' : 'Premium Quality'}
            </p>
            <div className="h-[1px] flex-1 bg-stone-100" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const { loading: authLoading } = useAuth();

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen 
            authLoading={authLoading} 
            onComplete={() => setShowSplash(false)} 
          />
        )}
      </AnimatePresence>

      <InstallPWA />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fdfcfb] flex items-center justify-center">
        <div className="w-12 h-12 bg-stone-900 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-stone-200 animate-pulse rotate-3">
          <span className="font-serif italic font-black text-xl">N</span>
        </div>
      </div>
    }>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </Suspense>
  );
}
