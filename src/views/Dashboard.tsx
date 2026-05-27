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
  Languages,
  Compass,
  Users,
  BarChart2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, onSnapshot, collection, query, where, limit, orderBy } from 'firebase/firestore';
import { formatCurrency, cn } from '../lib/utils';
import { CameraScanner } from '../components/CameraScanner';
import { useTranslation } from 'react-i18next';
import { handleFirestoreError, OperationType } from '../lib/error-utils';
import { TransactionForm } from '../components/TransactionForm';
import { KidsModal } from '../components/KidsModal';
import { AnalyticsModal } from '../components/AnalyticsModal';
import { TransactionHistoryModal } from '../components/TransactionHistoryModal';
import { FamilyGoalsModal } from '../components/FamilyGoalsModal';
import { SettingsModal } from '../components/SettingsModal';
import { claimTask } from '../lib/kidsService';
import { generateFinancialAdvice } from '../lib/aiCoach';
import { AIAdvisorModal } from '../components/AIAdvisorModal';
import { DebtTrackerModal } from '../components/DebtTrackerModal';
import { CreditSimulatorModal } from '../components/CreditSimulatorModal';
import { RoadmapModal } from '../components/RoadmapModal';
import { CommunityModal } from '../components/CommunityModal';
import { FirestoreSchema } from '../lib/firestoreSchema';
import { HealthDetailModal } from '../components/HealthDetailModal';

export default function Dashboard() {
  const { user, profile, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [family, setFamily] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isTxFormOpen, setIsTxFormOpen] = useState(false);
  const [isKidsModalOpen, setIsKidsModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyFilterType, setHistoryFilterType] = useState<'income' | 'expense' | 'all'>('all');
  const [isGoalsOpen, setIsGoalsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [scannerData, setScannerData] = useState<any>(null);
  
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  
  const [kidWallets, setKidWallets] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [savingGoals, setSavingGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Premium suite modal state flags
  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState(false);
  const [isDebtTrackerOpen, setIsDebtTrackerOpen] = useState(false);
  const [isCreditSimOpen, setIsCreditSimOpen] = useState(false);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  
  // Financial Health and DTI details state
  const [isHealthDetailOpen, setIsHealthDetailOpen] = useState(false);
  const [healthDetailTab, setHealthDetailTab] = useState<'health' | 'dti'>('health');

  // Sync dashboard debts dynamically from localStorage
  const [dashboardDebts, setDashboardDebts] = useState<any[]>([]);

  useEffect(() => {
    if (family?.spaceType) {
      const saved = localStorage.getItem(`nemu_debts_${family.spaceType}`);
      setDashboardDebts(saved ? JSON.parse(saved) : []);
    } else {
      setDashboardDebts([]);
    }
  }, [family?.spaceType, isDebtTrackerOpen]);

  // Derived Cash Flow Metrics
  const totalIncome = recentTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = recentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Derived Debt Metrics
  const activeDebts = dashboardDebts.filter(d => {
    const totalObligation = d.principal * (1 + (d.interestRate / 100) * (d.tenor / 12));
    return d.paidAmount < totalObligation;
  });

  const totalMonthlyObligation = activeDebts.reduce((sum, d) => {
    const totalObligation = d.principal * (1 + (d.interestRate / 100) * (d.tenor / 12));
    const monthlyInstallment = totalObligation / d.tenor;
    return sum + monthlyInstallment;
  }, 0);

  const monthlyIncome = totalIncome > 0 ? totalIncome : 12500000;
  const dtiRatio = totalMonthlyObligation > 0 ? Math.round((totalMonthlyObligation / monthlyIncome) * 100) : 0;

  // Derived Health Score Engine
  const calculateHealthScore = () => {
    if (recentTransactions.length === 0 && activeDebts.length === 0) return 100;
    
    let score = 100;
    score -= Math.min(40, dtiRatio);
    
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    if (totalIncome > 0) {
      if (savingsRate < 0) score -= 25;
      else if (savingsRate < 10) score -= 15;
      else if (savingsRate < 30) score -= 5;
    } else if (totalExpense > 0) {
      score -= 20;
    }
    return Math.max(10, Math.min(100, score));
  };

  const healthScore = calculateHealthScore();

  const handleRepay = async (amount: number, description: string) => {
    if (!profile?.familyId || !user) return;
    await FirestoreSchema.addTransaction({
      userId: user.uid,
      familyId: profile.familyId,
      amount,
      type: 'expense',
      category: 'Savings',
      description,
      date: new Date().toISOString()
    });
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'id' ? 'en' : 'id');
  };

  const loadAiAdvice = async () => {
    if (isGeneratingAdvice) return;
    setIsGeneratingAdvice(true);
    const advice = await generateFinancialAdvice(recentTransactions, i18n.language, family?.spaceType || 'personal');
    setAiAdvice(advice);
    setIsGeneratingAdvice(false);
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
      limit(100)
    );
    const unsubTransactions = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecentTransactions(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, txPath);
    });

    // Listen to kids data
    const unsubKidWallets = onSnapshot(query(collection(db, 'kidWallets'), where('familyId', '==', profile.familyId)), snapshot => {
      setKidWallets(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubTasks = onSnapshot(query(collection(db, 'tasks'), where('familyId', '==', profile.familyId)), snapshot => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubGoals = onSnapshot(query(collection(db, 'savingGoals'), where('familyId', '==', profile.familyId)), snapshot => {
      setSavingGoals(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubFamily();
      unsubTransactions();
      unsubKidWallets();
      unsubTasks();
      unsubGoals();
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

  const isMarried = family?.spaceType === 'married';
  const isChild = profile?.role === 'child';

  if (loading) return (
    <div className="min-h-screen bg-[#fdfcfb] flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-stone-100 border-t-orange-400 rounded-3xl animate-spin shadow-xl shadow-orange-50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-serif italic font-black text-xs text-orange-400">N</span>
        </div>
      </div>
      <p className="text-stone-300 text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">Synchronizing Financial Ledger</p>
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
            <img 
              onClick={() => setIsSettingsOpen(true)}
              src={user?.photoURL || ''} 
              alt="Profile" 
              className="w-11 h-11 rounded-2xl border-2 border-stone-100 shadow-sm cursor-pointer transition-transform group-hover:scale-105" 
            />
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
                  <LayoutDashboard size={12} /> {
                    family?.spaceType === 'personal' 
                      ? t('personal_balance') 
                      : family?.spaceType === 'unmarried' 
                        ? t('joint_balance') 
                        : t('shared_balance')
                  }
                </p>
                <h2 className="text-5xl font-brand font-bold tracking-tight text-white py-2">
                  {formatCurrency(family?.totalBalance || 0, family?.currency)}
                </h2>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium bg-emerald-400/10 w-max px-3 py-1 rounded-full">
                  <TrendingUp size={12} /> +2.4% {t('vs_last_month')}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 rotate-12">
                <Wallet size={24} className="text-orange-400" />
              </div>
            </div>

            <div className="flex gap-4 relative z-10">
              <button 
                onClick={() => { setScannerData(null); setIsTxFormOpen(true); }}
                className="flex-1 h-14 bg-white text-stone-900 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-50 transition-all active:scale-95 shadow-lg shadow-black/20"
              >
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

        {/* Premium Wealth Indicators */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
          <div 
            onClick={() => { setHealthDetailTab('health'); setIsHealthDetailOpen(true); }}
            className="bg-white p-5 rounded-[2rem] border border-stone-100 flex items-center justify-between shadow-sm cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all active:scale-[0.99] group"
          >
            <div className="space-y-1">
              <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest block">{t('financial_health')}</span>
              <h4 className="text-xl font-brand font-bold text-stone-800">{healthScore} / 100</h4>
              <span className={cn(
                "text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase",
                healthScore >= 80 ? "text-emerald-600 bg-emerald-50" : healthScore >= 50 ? "text-orange-600 bg-orange-50" : "text-rose-600 bg-rose-50"
              )}>
                {healthScore >= 80 ? t('excellent') : healthScore >= 50 ? (isId ? 'Cukup Sehat' : 'Fair') : (isId ? 'Buruk' : 'Critical')}
              </span>
            </div>
            <div className={cn(
              "w-10 h-10 rounded-full border-[3px] border-stone-100 flex items-center justify-center font-bold text-[10px] text-stone-700 shadow-sm group-hover:scale-105 transition-transform animate-spin-slow",
              healthScore >= 80 ? "border-t-emerald-500" : healthScore >= 50 ? "border-t-orange-400" : "border-t-rose-500"
            )}>
              {healthScore}%
            </div>
          </div>
          <div 
            onClick={() => { setHealthDetailTab('dti'); setIsHealthDetailOpen(true); }}
            className="bg-white p-5 rounded-[2rem] border border-stone-100 flex items-center justify-between shadow-sm cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all active:scale-[0.99] group"
          >
            <div className="space-y-1">
              <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest block">{t('debt_to_income')}</span>
              <h4 className="text-xl font-brand font-bold text-stone-800">{dtiRatio}% {t('ratio')}</h4>
              <span className={cn(
                "text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase",
                dtiRatio < 30 ? "text-emerald-600 bg-emerald-50" : dtiRatio <= 50 ? "text-orange-600 bg-orange-50" : "text-rose-600 bg-rose-50"
              )}>
                {dtiRatio < 30 ? (isId ? 'Batas Aman' : 'Healthy Limit') : dtiRatio <= 50 ? (isId ? 'Waspada' : 'Moderate') : (isId ? 'Beban Tinggi' : 'High Obligation')}
              </span>
            </div>
            <div className={cn(
              "w-10 h-10 rounded-full border-[3px] border-stone-100 flex items-center justify-center font-bold text-[10px] text-stone-700 shadow-sm group-hover:scale-105 transition-transform animate-spin-slow",
              dtiRatio < 30 ? "border-t-emerald-500" : dtiRatio <= 50 ? "border-t-orange-400" : "border-t-rose-500"
            )}>
              {dtiRatio}%
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
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{i18n.language.startsWith('id') ? 'Analisis Real-time' : 'Real-time Analysis'}</p>
                </div>
              </div>
              <button 
                onClick={loadAiAdvice} 
                disabled={isGeneratingAdvice}
                className="text-[10px] bg-stone-50 text-stone-400 px-3 py-1.5 rounded-full font-bold uppercase tracking-widest hover:bg-stone-100 transition-colors disabled:opacity-50"
              >
                {isGeneratingAdvice ? (i18n.language.startsWith('id') ? 'Berpikir...' : 'Thinking...') : (i18n.language.startsWith('id') ? 'Analisis' : 'Analyze')}
              </button>
            </div>
            <p className="text-stone-600 text-sm leading-relaxed font-medium italic">
              {aiAdvice || (i18n.language === 'id' 
                ? `"Ketuk tombol Analyze untuk mendapatkan analisis AI terhadap transaksi terbaru Anda."`
                : `"Tap the Analyze button to get an AI analysis of your recent transactions."`
              )}
            </p>
          </div>
        </motion.section>

        {/* Bento Grid Quick Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-5">
          <div 
            onClick={() => { setHistoryFilterType('income'); setIsHistoryOpen(true); }}
            className="bg-white p-6 rounded-[2.5rem] border border-stone-100 space-y-4 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all active:scale-[0.99] cursor-pointer group"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <TrendingDown size={22} />
            </div>
            <div>
              <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">{t('income')}</p>
              <p className="text-xl font-brand font-bold text-stone-800 mt-1">{formatCurrency(totalIncome, family?.currency)}</p>
            </div>
          </div>
          <div 
            onClick={() => { setHistoryFilterType('expense'); setIsHistoryOpen(true); }}
            className="bg-white p-6 rounded-[2.5rem] border border-stone-100 space-y-4 shadow-sm hover:shadow-md hover:border-rose-300 transition-all active:scale-[0.99] cursor-pointer group"
          >
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">{t('expenses')}</p>
              <p className="text-xl font-brand font-bold text-stone-800 mt-1">{formatCurrency(totalExpense, family?.currency)}</p>
            </div>
          </div>
        </motion.div>

        {/* Premium AI Financial Suite */}
        <motion.section variants={itemVariants} className="space-y-4">
          <div>
            <h3 className="font-brand font-bold text-stone-800 text-lg tracking-tight">{t('premium_suite')}</h3>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">{t('advanced_features')}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setIsAiAdvisorOpen(true)}
              className="p-5 rounded-[2rem] border border-stone-100 bg-white text-left shadow-sm hover:border-indigo-200 transition-all flex flex-col justify-between h-36 relative overflow-hidden group active:scale-98"
            >
              <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-indigo-50/50 rounded-full group-hover:scale-110 transition-transform" />
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 w-max"><Sparkles size={18} /></div>
              <div>
                <h4 className="font-bold text-stone-800 text-xs">{t('ai_advisor')}</h4>
                <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">{t('empathetic_advisor')}</p>
              </div>
            </button>

            <button 
              onClick={() => setIsDebtTrackerOpen(true)}
              className="p-5 rounded-[2rem] border border-stone-100 bg-white text-left shadow-sm hover:border-rose-200 transition-all flex flex-col justify-between h-36 relative overflow-hidden group active:scale-98"
            >
              <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-rose-50/50 rounded-full group-hover:scale-110 transition-transform" />
              <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 w-max"><TrendingDown size={18} /></div>
              <div>
                <h4 className="font-bold text-stone-800 text-xs">{t('debt_tracker')}</h4>
                <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">{t('fixed_floating_loans')}</p>
              </div>
            </button>

            <button 
              onClick={() => setIsCreditSimOpen(true)}
              className="p-5 rounded-[2rem] border border-stone-100 bg-white text-left shadow-sm hover:border-emerald-200 transition-all flex flex-col justify-between h-36 relative overflow-hidden group active:scale-98"
            >
              <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-emerald-50/50 rounded-full group-hover:scale-110 transition-transform" />
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 w-max"><BarChart2 size={18} /></div>
              <div>
                <h4 className="font-bold text-stone-800 text-xs">{t('credit_simulator')}</h4>
                <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">{t('kpr_vehicle_loans')}</p>
              </div>
            </button>

            <button 
              onClick={() => setIsRoadmapOpen(true)}
              className="p-5 rounded-[2rem] border border-stone-100 bg-white text-left shadow-sm hover:border-amber-200 transition-all flex flex-col justify-between h-36 relative overflow-hidden group active:scale-98"
            >
              <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-amber-50/50 rounded-full group-hover:scale-110 transition-transform" />
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 w-max"><Compass size={18} /></div>
              <div>
                <h4 className="font-bold text-stone-800 text-xs">{t('roadmap')}</h4>
                <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">{t('emergency_wealth_goals')}</p>
              </div>
            </button>

            <button 
              onClick={() => setIsCommunityOpen(true)}
              className="p-5 rounded-[2rem] border border-stone-100 bg-white text-left shadow-sm hover:border-indigo-200 transition-all flex flex-col justify-between h-36 relative overflow-hidden col-span-2 group active:scale-98"
            >
              <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-indigo-50/50 rounded-full group-hover:scale-110 transition-transform" />
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 w-max"><Users size={18} /></div>
              <div>
                <h4 className="font-bold text-stone-800 text-xs">{t('community')}</h4>
                <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">{t('share_wisdom_interact')}</p>
              </div>
            </button>
          </div>
        </motion.section>

        {/* Dynamic Activity Feed */}
        <motion.section variants={itemVariants} className="space-y-5">
          <div className="flex justify-between items-center px-2">
            <div>
              <h3 className="font-brand font-bold text-stone-800 text-lg tracking-tight">{t('recent_activity')}</h3>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">{t('live_feed')}</p>
            </div>
            <button onClick={() => { setHistoryFilterType('all'); setIsHistoryOpen(true); }} className="text-xs text-stone-400 hover:text-stone-900 font-bold uppercase tracking-widest bg-stone-50 px-4 py-2 rounded-full transition-all">
              {t('view_all')}
            </button>
          </div>
          <div className="grid gap-4">
            {recentTransactions.slice(0, 5).map((tx, idx) => (
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

        {/* Kids Kit - Gamified Visuals (Only shown if Married Mode) */}
        {isMarried && (
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
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">{t('financial_education')}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x relative z-10">
            {savingGoals.map(goal => (
              <div key={goal.id} className="flex-shrink-0 bg-white p-6 rounded-[2.5rem] border border-emerald-50 w-52 space-y-5 shadow-sm snap-center hover:scale-105 transition-transform cursor-pointer">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-orange-50 rounded-2xl text-orange-400">
                    <Target size={24} />
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{t('status')}</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      {kidWallets.length > 0 ? Math.min(100, Math.round((kidWallets[0].balance / goal.targetAmount) * 100)) : 0}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-stone-800 leading-tight">{goal.title}</p>
                  <p className="text-[10px] font-bold text-stone-400 mt-1 uppercase tracking-widest">{t('savings_goal')}</p>
                </div>
                <div className="w-full bg-stone-50 h-2.5 rounded-full overflow-hidden shadow-inner p-0.5">
                  <div 
                    className="bg-emerald-500 h-full rounded-full shadow-lg shadow-emerald-100" 
                    style={{ width: `${kidWallets.length > 0 ? Math.min(100, Math.round((kidWallets[0].balance / goal.targetAmount) * 100)) : 0}%` }}
                  />
                </div>
              </div>
            ))}

            {tasks.filter(t => t.status !== 'completed').map(task => (
              <div key={task.id} className="flex-shrink-0 bg-white p-6 rounded-[2.5rem] border border-emerald-50 w-52 space-y-4 shadow-sm snap-center hover:scale-105 transition-transform cursor-pointer">
                <div className="bg-orange-50 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-orange-100">💰</div>
                <div>
                  <p className="font-bold text-stone-800">{t('task')}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest truncate max-w-[80px]">{task.title}</span>
                    <span className="w-1 h-1 rounded-full bg-stone-300 flex-shrink-0" />
                    <span className="text-[10px] font-bold text-emerald-600 truncate">{formatCurrency(task.rewardAmount)}</span>
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    if (kidWallets.length === 0) return alert("Please add a kid wallet first!");
                    try {
                      await claimTask(profile.familyId, kidWallets[0].id, task.id, task.rewardAmount, task.title);
                    } catch (e: any) { alert(e.message); }
                  }} 
                  className="w-full bg-stone-900 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest"
                >
                  {t('claim')}
                </button>
              </div>
            ))}
            
            {savingGoals.length === 0 && tasks.length === 0 && (
              <div className="flex-shrink-0 bg-white/50 p-6 rounded-[2.5rem] border border-dashed border-emerald-200 w-52 flex flex-col items-center justify-center text-center">
                 <p className="text-xs font-bold text-emerald-600 mb-2">{t('no_goals_or_tasks')}</p>
                 <p className="text-[10px] text-stone-400 font-medium">{t('add_kids_tasks_prompt')}</p>
              </div>
              )}
            </div>
          </motion.section>
        )}
      </motion.main>

      {/* Floating Premium Navigation */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-stone-900/90 backdrop-blur-2xl rounded-[2.5rem] p-3 flex justify-around items-center z-40 shadow-2xl border border-white/5">
        <button className="relative group p-4 rounded-3xl bg-white/10 text-white transition-all active:scale-95">
          <LayoutDashboard size={22} className="group-hover:scale-110" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full" />
        </button>
        <button onClick={() => setIsAnalyticsOpen(true)} className="group p-4 rounded-3xl text-stone-500 hover:text-white transition-all active:scale-95">
          <PieChart size={22} className="group-hover:scale-110" />
        </button>
        <div className="h-4 w-[1px] bg-stone-700/50 mx-2" />
        <button onClick={() => setIsGoalsOpen(true)} className="group p-4 rounded-3xl text-stone-500 hover:text-white transition-all active:scale-95">
          <Target size={22} className="group-hover:scale-110" />
        </button>
        {isMarried && (
          <button onClick={() => setIsKidsModalOpen(true)} className="group p-4 rounded-3xl text-stone-500 hover:text-white transition-all active:scale-95">
            <Baby size={22} className="group-hover:scale-110" />
          </button>
        )}
      </nav>

      {/* Camera Overlay */}
      {isScannerOpen && (
        <CameraScanner 
          onClose={() => setIsScannerOpen(false)}
          onScanComplete={(data) => {
            console.log("Scanned:", data);
            setIsScannerOpen(false);
            setScannerData(data);
            setIsTxFormOpen(true);
          }}
        />
      )}

      {/* Transaction Form */}
      <TransactionForm 
        isOpen={isTxFormOpen}
        onClose={() => { setIsTxFormOpen(false); setScannerData(null); }}
        userId={user?.uid || ''}
        familyId={profile?.familyId || ''}
        initialData={scannerData}
      />

      <KidsModal 
        isOpen={isKidsModalOpen}
        onClose={() => setIsKidsModalOpen(false)}
        familyId={profile?.familyId || ''}
      />

      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        transactions={recentTransactions}
      />

      <TransactionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        familyId={profile?.familyId || ''}
        filterType={historyFilterType}
      />

      <FamilyGoalsModal
        isOpen={isGoalsOpen}
        onClose={() => setIsGoalsOpen(false)}
        familyId={profile?.familyId || ''}
        totalBalance={family?.totalBalance || 0}
        spaceType={family?.spaceType || 'personal'}
        userId={user?.uid || ''}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        family={family}
      />

      <AIAdvisorModal 
        isOpen={isAiAdvisorOpen}
        onClose={() => setIsAiAdvisorOpen(false)}
        transactions={recentTransactions}
        spaceType={family?.spaceType || 'personal'}
      />

      <DebtTrackerModal
        isOpen={isDebtTrackerOpen}
        onClose={() => setIsDebtTrackerOpen(false)}
        totalBalance={family?.totalBalance || 0}
        onRepay={handleRepay}
        spaceType={family?.spaceType || 'personal'}
      />

      <CreditSimulatorModal
        isOpen={isCreditSimOpen}
        onClose={() => setIsCreditSimOpen(false)}
      />

      <RoadmapModal
        isOpen={isRoadmapOpen}
        onClose={() => setIsRoadmapOpen(false)}
        totalBalance={family?.totalBalance || 0}
      />

      <CommunityModal
        isOpen={isCommunityOpen}
        onClose={() => setIsCommunityOpen(false)}
        userProfile={profile}
      />

      <HealthDetailModal
        isOpen={isHealthDetailOpen}
        onClose={() => setIsHealthDetailOpen(false)}
        initialTab={healthDetailTab}
        healthScore={healthScore}
        dtiRatio={dtiRatio}
        totalMonthlyObligation={totalMonthlyObligation}
        onOpenDebtTracker={() => { setIsHealthDetailOpen(false); setIsDebtTrackerOpen(true); }}
        onOpenAiAdvisor={() => { setIsHealthDetailOpen(false); setIsAiAdvisorOpen(true); }}
      />
    </div>
  );
}
