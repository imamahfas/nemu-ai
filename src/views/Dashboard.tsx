import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  Camera, 
  ChevronRight,
  PieChart,
  LayoutDashboard,
  Baby,
  LogOut,
  Target,
  Sparkles,
  Languages
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, onSnapshot, collection, query, where, limit, orderBy } from 'firebase/firestore';
import { formatCurrency, cn } from '../lib/utils';
import { CameraScanner } from '../components/CameraScanner';
import { useTranslation } from 'react-i18next';
import { handleFirestoreError, OperationType } from '../lib/error-utils';

export default function Dashboard() {
  const { user, profile, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [family, setFamily] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'id' ? 'en' : 'id');
  };

  useEffect(() => {
    if (!profile?.familyId) return;

    // Listen to family data
    const familyPath = `families/${profile.familyId}`;
    const unsubFamily = onSnapshot(doc(db, 'families', profile.familyId), (doc) => {
      if (doc.exists()) {
        setFamily(doc.data());
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, familyPath);
    });

    // Listen to recent transactions
    const txPath = 'transactions';
    const q = query(
      collection(db, txPath),
      where('familyId', '==', profile.familyId),
      orderBy('date', 'desc'),
      limit(5)
    );
    const unsubTransactions = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecentTransactions(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, txPath);
    });

    return () => {
      unsubFamily();
      unsubTransactions();
    };
  }, [profile?.familyId]);

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#fdfcfb] flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-stone-100 border-t-orange-400 rounded-3xl animate-spin shadow-xl shadow-orange-50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-serif italic font-black text-xs text-orange-400">N</span>
        </div>
      </div>
      <p className="text-stone-300 text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">Synchronizing Family Ledger</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fdfcfb] text-stone-900 pb-32">
      {/* Header */}
      <header className="p-5 flex justify-between items-center bg-white/70 sticky top-0 z-30 backdrop-blur-xl border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-stone-200 rotate-3">
            <span className="font-serif italic font-black text-xl">N</span>
          </div>
          <div>
            <h1 className="text-xl font-brand font-bold tracking-tight text-stone-900 leading-none">{t('app_name')}</h1>
            <p className="text-[10px] text-stone-400 font-medium tracking-widest uppercase mt-1">Premium</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleLanguage}
            className="p-2.5 text-stone-500 hover:bg-stone-50 rounded-2xl flex items-center gap-2 border border-stone-100 transition-all active:scale-95"
          >
            <Languages size={18} />
            <span className="text-xs font-bold uppercase tracking-tight">{i18n.language}</span>
          </button>
          <div className="relative group">
            <img src={user?.photoURL || ''} alt="Profile" className="w-11 h-11 rounded-2xl border-2 border-stone-100 shadow-sm cursor-pointer transition-transform group-hover:scale-105" />
            <button 
              onClick={logout}
              className="absolute -top-1 -right-1 bg-white p-1 rounded-full border border-stone-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-stone-400 hover:text-rose-500"
            >
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </header>

      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-6 max-w-2xl mx-auto space-y-8"
      >
        {/* Modern Balance Hub */}
        <motion.div variants={itemVariants} className="relative">
          <div className="absolute inset-0 bg-stone-900 rounded-[3rem] shadow-2xl shadow-stone-300 transform -rotate-1 scale-[0.98]" />
          <div className="relative bg-stone-900 text-white rounded-[3rem] p-8 space-y-8 overflow-hidden">
            <div className="absolute -right-12 -top-12 w-64 h-64 bg-stone-800 rounded-full blur-[80px] opacity-30" />
            
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <p className="text-stone-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <LayoutDashboard size={12} /> {t('shared_balance')}
                </p>
                <h2 className="text-5xl font-brand font-bold tracking-tight text-white py-2">
                  {formatCurrency(family?.totalBalance || 0, family?.currency)}
                </h2>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium bg-emerald-400/10 w-max px-3 py-1 rounded-full">
                  <TrendingUp size={12} /> +2.4% vs Last month
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 rotate-12">
                <Wallet size={24} className="text-orange-400" />
              </div>
            </div>

            <div className="flex gap-4 relative z-10">
              <button className="flex-1 h-14 bg-white text-stone-900 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-50 transition-all active:scale-95 shadow-lg shadow-black/20">
                <Plus size={20} /> {t('add_income')}
              </button>
              <button 
                onClick={() => setIsScannerOpen(true)}
                className="w-14 h-14 bg-stone-800 text-white rounded-2xl flex items-center justify-center border border-stone-700 hover:bg-stone-700 transition-all active:scale-95 shadow-lg"
              >
                <Camera size={20} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* AI Insight Card - Elevated Design */}
        <motion.section variants={itemVariants} className="relative group">
          <div className="absolute inset-0 bg-orange-400 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
          <div className="bg-white border border-orange-100 rounded-[2.5rem] p-7 space-y-5 shadow-sm relative overflow-hidden active:scale-[0.98] transition-transform">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-orange-50/50 rounded-full blur-3xl" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-50 rounded-2xl text-orange-400 animate-pulse">
                  <Sparkles size={20} className="fill-orange-400" />
                </div>
                <div>
                  <h3 className="font-brand font-bold text-stone-800 tracking-tight">{t('financial_coach')}</h3>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Real-time Analysis</p>
                </div>
              </div>
              <button className="text-[10px] bg-stone-50 text-stone-400 px-3 py-1.5 rounded-full font-bold uppercase tracking-widest hover:bg-stone-100 transition-colors">Details</button>
            </div>
            <p className="text-stone-600 text-sm leading-relaxed font-medium italic">
              {i18n.language === 'id' 
                ? `"Pengeluaran belanja bulanan Anda naik 12%. Coba belanja grosir di pasar tradisional untuk menghemat sekitar ${formatCurrency(250000)} per bulan."`
                : `"Your grocery spending is up 12% this month. Try bulk shopping at local markets to save around ${formatCurrency(250000)} monthly."`
              }
            </p>
          </div>
        </motion.section>

        {/* Bento Grid Quick Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-5">
          <div className="bg-white p-6 rounded-[2.5rem] border border-stone-100 space-y-4 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">{t('income')}</p>
              <p className="text-xl font-brand font-bold text-stone-800 mt-1">{formatCurrency(12500000)}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-stone-100 space-y-4 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
              <TrendingDown size={22} />
            </div>
            <div>
              <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">{t('expenses')}</p>
              <p className="text-xl font-brand font-bold text-stone-800 mt-1">{formatCurrency(8450000)}</p>
            </div>
          </div>
        </motion.div>

        {/* Dynamic Activity Feed */}
        <motion.section variants={itemVariants} className="space-y-5">
          <div className="flex justify-between items-center px-2">
            <div>
              <h3 className="font-brand font-bold text-stone-800 text-lg tracking-tight">{t('recent_activity')}</h3>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">Live Feed</p>
            </div>
            <button className="text-xs text-stone-400 hover:text-stone-900 font-bold uppercase tracking-widest bg-stone-50 px-4 py-2 rounded-full transition-all">
              {t('view_all')}
            </button>
          </div>
          <div className="grid gap-4">
            {recentTransactions.map((tx, idx) => (
              <motion.div 
                key={tx.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-5 rounded-[2rem] border border-stone-100 flex items-center gap-5 hover:border-orange-200 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner",
                  tx.type === 'expense' ? "bg-rose-50/50" : "bg-emerald-50/50"
                )}>
                  {tx.category === 'Food' ? '🍱' : tx.category === 'Transport' ? '⛽' : '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-stone-800 truncate mb-0.5">{tx.description}</p>
                  <p className="text-stone-400 text-xs font-bold uppercase tracking-tighter">{tx.category} • {new Date(tx.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-lg font-brand font-bold",
                    tx.type === 'expense' ? "text-stone-800" : "text-emerald-600"
                  )}>
                    {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                  </p>
                </div>
              </motion.div>
            ))}
            {recentTransactions.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-stone-200">
                <LayoutDashboard size={48} className="mx-auto text-stone-100 mb-4" />
                <p className="text-stone-400 font-medium">{t('no_transactions')}</p>
              </div>
            )}
          </div>
        </motion.section>

        {/* Kids Kit - Gamified Visuals */}
        <motion.section variants={itemVariants} className="bg-emerald-50/30 rounded-[3rem] p-8 space-y-6 border border-emerald-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-emerald-100/50">
            <Baby size={120} strokeWidth={1} />
          </div>
          
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600 shadow-sm shadow-emerald-200">
                <Baby size={22} />
              </div>
              <div>
                <h3 className="font-brand font-bold text-stone-800 tracking-tight">{t('kids_kit')}</h3>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Financial Education</p>
              </div>
            </div>
            <span className="bg-emerald-600 text-white text-[10px] uppercase font-bold py-1.5 px-4 rounded-full shadow-lg shadow-emerald-100">{t('coming_soon')}</span>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x relative z-10">
            <div className="flex-shrink-0 bg-white p-6 rounded-[2.5rem] border border-emerald-50 w-52 space-y-5 shadow-sm snap-center hover:scale-105 transition-transform cursor-pointer">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-orange-50 rounded-2xl text-orange-400">
                  <Target size={24} />
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Status</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">65%</span>
                </div>
              </div>
              <div>
                <p className="font-bold text-stone-800 leading-tight">LEGO Star Wars Set</p>
                <p className="text-[10px] font-bold text-stone-400 mt-1 uppercase tracking-widest">Savings Goal</p>
              </div>
              <div className="w-full bg-stone-50 h-2.5 rounded-full overflow-hidden shadow-inner p-0.5">
                <div className="bg-emerald-500 h-full w-[65%] rounded-full shadow-lg shadow-emerald-100" />
              </div>
            </div>

            <div className="flex-shrink-0 bg-white p-6 rounded-[2.5rem] border border-emerald-50 w-52 space-y-4 shadow-sm snap-center hover:scale-105 transition-transform cursor-pointer">
              <div className="bg-orange-50 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-orange-100">💰</div>
              <div>
                <p className="font-bold text-stone-800">Weekly Task</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Clean Room</span>
                  <span className="w-1 h-1 rounded-full bg-stone-300" />
                  <span className="text-[10px] font-bold text-emerald-600">{formatCurrency(50000)}</span>
                </div>
              </div>
              <button className="w-full bg-stone-900 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest">Claim</button>
            </div>
          </div>
        </motion.section>
      </motion.main>

      {/* Floating Premium Navigation */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-stone-900/90 backdrop-blur-2xl rounded-[2.5rem] p-3 flex justify-around items-center z-40 shadow-2xl border border-white/5">
        <button className="relative group p-4 rounded-3xl bg-white/10 text-white transition-all active:scale-95">
          <LayoutDashboard size={22} className="group-hover:scale-110" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full" />
        </button>
        <button className="group p-4 rounded-3xl text-stone-500 hover:text-white transition-all active:scale-95">
          <PieChart size={22} className="group-hover:scale-110" />
        </button>
        <div className="h-4 w-[1px] bg-stone-700/50 mx-2" />
        <button className="group p-4 rounded-3xl text-stone-500 hover:text-white transition-all active:scale-95">
          <Target size={22} className="group-hover:scale-110" />
        </button>
        <button className="group p-4 rounded-3xl text-stone-500 hover:text-white transition-all active:scale-95">
          <Baby size={22} className="group-hover:scale-110" />
        </button>
      </nav>

      {/* Camera Overlay */}
      {isScannerOpen && (
        <CameraScanner 
          onClose={() => setIsScannerOpen(false)}
          onScanComplete={(data) => {
            console.log("Scanned:", data);
            setIsScannerOpen(false);
            // Handle save logic
          }}
        />
      )}
    </div>
  );
}
