import React, { useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './views/Dashboard';
import { InstallPWA } from './components/InstallPWA';
import { LogIn, Sparkles, Languages, Mail, UserX } from 'lucide-react';
import { motion } from 'framer-motion';
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
  const { signIn, signInWithEmail, signInAnonymously, user } = useAuth();
  const { t, i18n } = useTranslation();
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [testError, setTestError] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  // Show test auth panel when ?test=1 is present in URL
  const isTestMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('test') === '1';

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'id' ? 'en' : 'id');
  };
  
  if (user) return <Navigate to="/" />;

  const handleTestEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestError('');
    setTestLoading(true);
    try {
      await signInWithEmail(testEmail, testPassword);
    } catch (err: any) {
      setTestError(err?.message || 'Sign-in failed');
    } finally {
      setTestLoading(false);
    }
  };

  const handleTestAnonymous = async () => {
    setTestError('');
    setTestLoading(true);
    try {
      await signInAnonymously();
    } catch (err: any) {
      setTestError(err?.message || 'Anonymous sign-in failed');
    } finally {
      setTestLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#fdfcfb] flex flex-col items-center justify-center p-8 text-stone-900 overflow-hidden relative">
      {/* Decorative Pastel Background */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-gradient-to-br from-orange-100/40 to-transparent blur-[80px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-gradient-to-br from-emerald-100/40 to-transparent blur-[80px] rounded-full" />
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
            id="btn-google-signin"
            onClick={() => signIn()}
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

        {/* ── Test / Staging Auth Panel ────────────────────────────────────────────
             Visible only when ?test=1 is appended to the URL.
             Provides email/password and anonymous sign-in so automated test
             runners can authenticate without triggering Google's popup-security
             rejection in headless / sandboxed browser environments.
        ──────────────────────────────────────────────────────────────────────── */}
        {isTestMode && (
          <motion.div
            id="test-auth-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-dashed border-amber-300 bg-amber-50/60 rounded-[1.5rem] p-5 text-left space-y-3"
          >
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">🧪 Test Mode Auth</p>

            <form onSubmit={handleTestEmailSignIn} className="space-y-2" id="form-test-email-signin">
              <input
                id="input-test-email"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                required
              />
              <input
                id="input-test-password"
                type="password"
                placeholder="password (min 6 chars)"
                value={testPassword}
                onChange={e => setTestPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                required
                minLength={6}
              />
              <button
                id="btn-test-email-signin"
                type="submit"
                disabled={testLoading}
                className="w-full h-10 bg-amber-400 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-500 transition-all disabled:opacity-50"
              >
                <Mail size={16} />
                {testLoading ? 'Signing in…' : 'Sign in with Email'}
              </button>
            </form>

            <button
              id="btn-test-anonymous-signin"
              onClick={handleTestAnonymous}
              disabled={testLoading}
              className="w-full h-10 bg-stone-200 text-stone-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-stone-300 transition-all disabled:opacity-50"
            >
              <UserX size={16} />
              Sign in Anonymously
            </button>

            {testError && (
              <p id="test-auth-error" className="text-xs text-red-500 text-center">{testError}</p>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const { loading: authLoading } = useAuth();

  return (
    <>
      {showSplash && (
        <SplashScreen 
          authLoading={authLoading} 
          onComplete={() => setShowSplash(false)} 
        />
      )}

      <InstallPWA />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* /app is a canonical alias for the protected dashboard root */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        {/* Catch-all: redirect any unknown path to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
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
