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
  BarChart2,
  X,
  Eye,
  EyeOff,
  Settings,
  RefreshCw,
  User,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, onSnapshot, collection, query, where, limit, orderBy, updateDoc, getDoc, getDocs, arrayUnion, setDoc } from 'firebase/firestore';
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
  const { user, profile, loading: authLoading, signIn, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const isId = i18n.language?.startsWith('id');
  const [family, setFamily] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Pending Invite Modal states
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isJoiningInvite, setIsJoiningInvite] = useState(false);

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

  // Sync dashboard debts dynamically from Firestore
  const [dashboardDebts, setDashboardDebts] = useState<any[]>([]);
  const [hideBalances, setHideBalances] = useState(true);

  useEffect(() => {
    if (!profile?.familyId) {
      setDashboardDebts([]);
      return;
    }

    const q = query(
      collection(db, 'debts'),
      where('familyId', '==', profile.familyId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const loadedDebts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDashboardDebts(loadedDebts);
    }, (error) => {
      console.error("Dashboard error loading debts from Firestore:", error);
    });

    return unsub;
  }, [profile?.familyId]);

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

  // Derived Category Spending MTD for current calendar month
  const categorySpentMtd = (() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const spentMap: Record<string, number> = {
      Food: 0,
      Transport: 0,
      Shopping: 0,
      Savings: 0
    };

    recentTransactions.forEach(tx => {
      if (tx.type !== 'expense') return;
      const txDate = new Date(tx.date);
      if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
        spentMap[tx.category] = (spentMap[tx.category] || 0) + tx.amount;
      }
    });

    return spentMap;
  })();

  const totalBudgetLimit: number = (Object.values(family?.budgetLimits || {}) as any[]).reduce((sum: number, lim: any) => sum + (parseFloat(lim) || 0), 0);
  const isOverbudget = totalBudgetLimit > 0 && ((family?.totalBalance || 0) as number) < totalBudgetLimit;

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

  const handleSwitchSpace = async (targetSpaceType: 'personal' | 'unmarried' | 'married') => {
    if (!user || !profile) return;
    
    const activePersonalId = profile.personalSpaceId || `personal_${user.uid}`;
    const activeCoupleId = profile.coupleSpaceId || `couple_${user.uid}`;
    const activeFamilyId = profile.familySpaceId || `family_${user.uid}`;

    let activeSpaceId = '';
    if (targetSpaceType === 'personal') {
      activeSpaceId = activePersonalId;
    } else if (targetSpaceType === 'unmarried') {
      activeSpaceId = activeCoupleId;
    } else {
      activeSpaceId = activeFamilyId;
    }
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        familyId: activeSpaceId
      });
      window.location.reload();
    } catch (err) {
      console.error("Failed to switch space:", err);
      alert(isId ? "Gagal beralih ruang." : "Failed to switch space.");
    }
  };

  const handleSwitchAccount = async () => {
    try {
      await logout();
      setTimeout(async () => {
        await signIn(true);
      }, 300);
    } catch (err) {
      console.error("Failed to switch account:", err);
    }
  };

  const handleConfirmInviteJoin = async () => {
    if (!pendingInviteCode || !user || !profile) return;
    setIsJoiningInvite(true);
    
    try {
      const q = query(collection(db, 'families'), where('inviteCode', '==', pendingInviteCode.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert(isId ? "Kode undangan tidak valid." : "Invalid invite code.");
        setIsInviteModalOpen(false);
        setPendingInviteCode(null);
        setIsJoiningInvite(false);
        return;
      }

      const newFamilyDoc = querySnapshot.docs[0];
      const newFamilyId = newFamilyDoc.id;
      const newFamilyData = newFamilyDoc.data();
      const targetSpaceType = newFamilyData.spaceType || 'unmarried';

      if (newFamilyId === profile?.familyId) {
        alert(isId ? "Anda sudah berada di dalam ruang ini." : "You are already in this space.");
        setIsInviteModalOpen(false);
        setPendingInviteCode(null);
        setIsJoiningInvite(false);
        return;
      }

      // Add user to new family members
      await updateDoc(doc(db, 'families', newFamilyId), {
        members: arrayUnion(user.uid)
      });

      // Update user profile to new familyId and save specific space reference
      const profileUpdates: any = { 
        familyId: newFamilyId,
        role: 'parent' 
      };

      if (targetSpaceType === 'unmarried') {
        profileUpdates.coupleSpaceId = newFamilyId;
      } else if (targetSpaceType === 'married') {
        profileUpdates.familySpaceId = newFamilyId;
      } else {
        profileUpdates.personalSpaceId = newFamilyId;
      }

      await setDoc(doc(db, 'users', user.uid), profileUpdates, { merge: true });

      alert(isId ? "Berhasil bergabung ke ruang! Memuat ulang..." : "Successfully joined the space! Reloading...");
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      alert(isId ? `Gagal bergabung ke ruang: ${error?.message || error}` : `Error joining space: ${error?.message || error}`);
    } finally {
      setIsJoiningInvite(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    const params = new URLSearchParams(window.location.search);
    const inviteParam = params.get('invite');
    if (inviteParam && user && profile) {
      // Clean up the URL query parameter so it doesn't trigger repeatedly on reload
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
      
      setPendingInviteCode(inviteParam.trim().toUpperCase());
      setIsInviteModalOpen(true);
    }
  }, [user, profile, authLoading]);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'id' ? 'en' : 'id');
  };

  const loadAiAdvice = async () => {
    if (isGeneratingAdvice) return;
    setIsGeneratingAdvice(true);
    const advice = await generateFinancialAdvice(
      recentTransactions, 
      i18n.language, 
      family?.spaceType || 'personal',
      family?.budgetLimits || {},
      categorySpentMtd,
      family?.currency || 'IDR'
    );
    setAiAdvice(advice);
    setIsGeneratingAdvice(false);
  };

  useEffect(() => {
    if (recentTransactions.length > 0) {
      loadAiAdvice();
    }
  }, [recentTransactions, i18n.language]);

  useEffect(() => {
    if (authLoading) return;
    if (!profile?.familyId) {
      setLoading(false);
      return;
    }

    // Listen to family data
    const familyPath = `families/${profile.familyId}`;
    const unsubFamily = onSnapshot(doc(db, 'families', profile.familyId), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFamily(data);
        
        // Auto-heal missing or mismatched spaceType field for backward compatibility with old family documents!
        const isPersonal = profile.familyId.startsWith('personal_');
        const isCouple = profile.familyId.startsWith('couple_');
        const expectedSpaceType = isPersonal ? 'personal' : isCouple ? 'unmarried' : 'married';

        if (data.spaceType !== expectedSpaceType) {
          try {
            await updateDoc(doc(db, 'families', profile.familyId), { spaceType: expectedSpaceType });
            setFamily({ ...data, spaceType: expectedSpaceType });
          } catch (err) {
            console.error("Failed to auto-heal mismatched spaceType:", err);
          }
        }
      } else {
        // Automatically create the missing family space document on-the-fly to avoid null database states
        console.log("Family space document is missing, auto-creating:", profile.familyId);
        const isPersonal = profile.familyId.startsWith('personal_');
        const isCouple = profile.familyId.startsWith('couple_');
        const spaceType = isPersonal ? 'personal' : isCouple ? 'unmarried' : 'married';
        const spaceName = isPersonal 
          ? `${profile.displayName || user?.displayName || 'My'} Personal Space`
          : isCouple 
            ? `${profile.displayName || user?.displayName || 'Our'} Couple Space`
            : `${profile.displayName || user?.displayName || 'Our'} Family Space`;
        
        const newFamily = {
          name: spaceName,
          totalBalance: 0,
          currency: 'IDR',
          members: [user?.uid].filter(Boolean),
          spaceType,
          inviteCode: (isPersonal ? 'P-' : isCouple ? 'C-' : 'F-') + Math.random().toString(36).substring(2, 8).toUpperCase(),
          updatedAt: new Date().toISOString(),
        };

        try {
          await setDoc(doc(db, 'families', profile.familyId), newFamily);
          setFamily(newFamily);
        } catch (err) {
          console.error("Failed to auto-create missing family space:", err);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Dashboard error loading family:", error);
      handleFirestoreError(error, OperationType.GET, familyPath);
      setLoading(false);
    });

    // Listen to recent transactions
    // Sort transactions on client side to prevent needing a composite index (familyId, date) in Firestore
    const txPath = 'transactions';
    const q = query(
      collection(db, txPath),
      where('familyId', '==', profile.familyId),
      limit(100)
    );
    const unsubTransactions = onSnapshot(q, async (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentTransactions(docs);

      // Auto-heal empty totalBalance when history exists!
      if (docs.length > 0 && profile?.familyId) {
        const calculatedBalance = docs.reduce((sum, tx: any) => {
          return sum + (tx.type === 'income' ? tx.amount : -tx.amount);
        }, 0);

        try {
          const familyRef = doc(db, 'families', profile.familyId);
          const currentFamilySnap = await getDoc(familyRef);
          if (currentFamilySnap.exists()) {
            const currentBal = currentFamilySnap.data()?.totalBalance ?? 0;
            // If the Firestore balance is 0 but calculated balance is different, heal it!
            if (currentBal === 0 && calculatedBalance !== 0) {
              console.log(`Auto-healing family totalBalance: resetting from 0 to calculated balance ${calculatedBalance}`);
              await updateDoc(familyRef, { 
                totalBalance: calculatedBalance,
                updatedAt: new Date().toISOString()
              });
            }
          }
        } catch (err) {
          console.error("Auto-heal failed:", err);
        }
      }
    }, (error) => {
      console.error("Dashboard error loading transactions:", error);
      handleFirestoreError(error, OperationType.LIST, txPath);
      setLoading(false);
    });

    // Listen to kids data
    const unsubKidWallets = onSnapshot(query(collection(db, 'kidWallets'), where('familyId', '==', profile.familyId)), snapshot => {
      setKidWallets(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("Dashboard error loading kidWallets:", error);
    });
    const unsubTasks = onSnapshot(query(collection(db, 'tasks'), where('familyId', '==', profile.familyId)), snapshot => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("Dashboard error loading tasks:", error);
    });
    const unsubGoals = onSnapshot(query(collection(db, 'savingGoals'), where('familyId', '==', profile.familyId)), snapshot => {
      setSavingGoals(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("Dashboard error loading savingGoals:", error);
    });

    return () => {
      unsubFamily();
      unsubTransactions();
      unsubKidWallets();
      unsubTasks();
      unsubGoals();
    };
  }, [profile?.familyId, authLoading]);

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
      transition: { type: 'spring' as const, stiffness: 100, damping: 15 }
    }
  };

  const isMarried = family?.spaceType === 'married' || profile?.familyId?.startsWith('family_');
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
            id="btn-toggle-language"
            aria-label="Ubah bahasa / Switch language"
            onClick={toggleLanguage}
            className="p-2.5 text-stone-500 hover:bg-stone-50 rounded-2xl flex items-center gap-2 border border-stone-100 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900 focus:outline-none"
          >
            <Languages size={18} />
            <span className="text-xs font-bold uppercase tracking-tight">{i18n.language}</span>
          </button>
          <div className="relative">
            <button
              id="btn-profile-menu"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="relative group transition-transform active:scale-95 focus:outline-none flex-shrink-0"
            >
              <img 
                src={user?.photoURL || ''} 
                alt="Profile" 
                className="w-11 h-11 rounded-2xl border-2 border-stone-100 shadow-sm transition-all hover:border-orange-200" 
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm animate-pulse" />
            </button>

            {isUserMenuOpen && (
              <>
                {/* Click outside overlay to close */}
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setIsUserMenuOpen(false)} 
                />
                
                {/* Dropdown Card */}
                <div 
                  className="absolute right-0 mt-3 w-72 bg-white/95 backdrop-blur-xl border border-stone-100 rounded-3xl shadow-2xl p-4.5 z-50 animate-in fade-in slide-in-from-top-3 duration-200"
                  role="menu"
                >
                  {/* User Profile Info Summary */}
                  <div className="flex items-center gap-3 pb-3.5 border-b border-stone-100">
                    <img 
                      src={user?.photoURL || ''} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-xl border border-stone-50" 
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-brand font-bold text-stone-900 text-sm truncate">{profile?.displayName || user?.displayName || 'User'}</p>
                      <p className="text-[10px] text-stone-400 font-medium truncate mt-0.5">{user?.email}</p>
                    </div>
                  </div>

                  {/* Quick Space Switcher Section */}
                  <div className="py-3.5 space-y-2.5">
                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-1">
                      {isId ? 'Pilih Ruang Finansial' : 'Switch Financial Space'}
                    </p>
                    
                    <div className="space-y-1.5">
                      {/* Personal Space Button */}
                      <button
                        onClick={() => { handleSwitchSpace('personal'); setIsUserMenuOpen(false); }}
                        className={cn(
                          "w-full flex items-center justify-between p-2 rounded-2xl transition-all text-left border",
                          family?.spaceType === 'personal'
                            ? "bg-indigo-50/40 border-indigo-100/50 text-indigo-900"
                            : "bg-transparent border-transparent hover:bg-stone-50/80 text-stone-700"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-xl transition-colors",
                            family?.spaceType === 'personal' ? "bg-indigo-100/60 text-indigo-600" : "bg-stone-50 text-stone-400"
                          )}>
                            <User size={15} />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{t('personal_space')}</p>
                            <p className="text-[8px] font-bold text-stone-400 uppercase tracking-wider mt-0.5">{isId ? 'Ledger Mandiri' : 'Self Ledger'}</p>
                          </div>
                        </div>
                        {family?.spaceType === 'personal' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2" />
                        )}
                      </button>

                      {/* Couple Space Button */}
                      <button
                        onClick={() => { handleSwitchSpace('unmarried'); setIsUserMenuOpen(false); }}
                        className={cn(
                          "w-full flex items-center justify-between p-2 rounded-2xl transition-all text-left border",
                          family?.spaceType === 'unmarried'
                            ? "bg-emerald-50/40 border-emerald-100/50 text-emerald-900"
                            : "bg-transparent border-transparent hover:bg-stone-50/80 text-stone-700"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-xl transition-colors",
                            family?.spaceType === 'unmarried' ? "bg-emerald-100/60 text-emerald-600" : "bg-stone-50 text-stone-400"
                          )}>
                            <Heart size={15} />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{t('couple_space')}</p>
                            <p className="text-[8px] font-bold text-stone-400 uppercase tracking-wider mt-0.5">{isId ? 'Target Pasangan' : 'Joint Goals'}</p>
                          </div>
                        </div>
                        {family?.spaceType === 'unmarried' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                        )}
                      </button>

                      {/* Family Space Button */}
                      <button
                        onClick={() => { handleSwitchSpace('married'); setIsUserMenuOpen(false); }}
                        className={cn(
                          "w-full flex items-center justify-between p-2 rounded-2xl transition-all text-left border",
                          family?.spaceType === 'married'
                            ? "bg-orange-50/40 border-orange-100/50 text-orange-950"
                            : "bg-transparent border-transparent hover:bg-stone-50/80 text-stone-700"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-xl transition-colors",
                            family?.spaceType === 'married' ? "bg-orange-100/60 text-orange-600" : "bg-stone-50 text-stone-400"
                          )}>
                            <Users size={15} />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{t('family_space')}</p>
                            <p className="text-[8px] font-bold text-stone-400 uppercase tracking-wider mt-0.5">{isId ? 'Keluarga & Anak' : 'Pro Family Ledger'}</p>
                          </div>
                        </div>
                        {family?.spaceType === 'married' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="pt-2.5 border-t border-stone-100 space-y-1">
                    {/* Role Switcher Action */}
                    <button
                      onClick={async () => {
                        const newRole = profile?.role === 'child' ? 'parent' : 'child';
                        try {
                          await updateDoc(doc(db, 'users', user.uid), { role: newRole });
                          if (profile) profile.role = newRole;
                          setIsUserMenuOpen(false);
                          alert(isId 
                            ? `Peran diubah menjadi: ${newRole === 'parent' ? 'Orang Tua' : 'Anak'}` 
                            : `Role switched to: ${newRole === 'parent' ? 'Parent' : 'Kid'}`);
                          window.location.reload();
                        } catch (err) {
                          console.error("Failed to switch role:", err);
                        }
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-2xl text-stone-600 hover:text-stone-900 hover:bg-stone-50/80 text-left transition-all text-xs font-bold"
                    >
                      <div className="bg-stone-50 text-stone-500 rounded-lg flex items-center justify-center text-xs w-7 h-7 flex-shrink-0">
                        {profile?.role === 'child' ? '👑' : '🧒'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-stone-855 truncate">
                          {isId ? 'Ubah Peran Akun' : 'Switch User Role'}
                        </p>
                        <p className="text-[8px] text-stone-400 font-bold uppercase tracking-wider mt-0.5 truncate">
                          {isId ? `Aktif: ${profile?.role === 'child' ? 'Anak' : 'Orang Tua'}` : `Active: ${profile?.role === 'child' ? 'Kid' : 'Parent'}`}
                        </p>
                      </div>
                    </button>

                    {/* Settings Modal Trigger */}
                    {!isChild && (
                      <button
                        onClick={() => { setIsSettingsOpen(true); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center gap-3 p-2 rounded-2xl text-stone-600 hover:text-stone-900 hover:bg-stone-50/80 text-left transition-all text-xs font-bold"
                      >
                        <div className="p-1.5 bg-stone-50 text-stone-400 rounded-lg flex items-center justify-center w-7 h-7 flex-shrink-0">
                          <Settings size={13} />
                        </div>
                        {isId ? 'Pengaturan Ruang' : 'Space Config & Invite'}
                      </button>
                    )}

                    {/* Switch Account (Google Chooser) */}
                    <button
                      onClick={handleSwitchAccount}
                      className="w-full flex items-center gap-3 p-2 rounded-2xl text-stone-600 hover:text-stone-900 hover:bg-stone-50/80 text-left transition-all text-xs font-bold"
                    >
                      <div className="p-1.5 bg-stone-50 text-stone-400 rounded-lg flex items-center justify-center w-7 h-7 flex-shrink-0">
                        <RefreshCw size={13} />
                      </div>
                      {isId ? 'Ganti Akun Google' : 'Switch Google Account'}
                    </button>

                    {/* Log Out */}
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 p-2 rounded-2xl text-rose-600 hover:bg-rose-50 text-left transition-all text-xs font-bold"
                    >
                      <div className="p-1.5 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center w-7 h-7 flex-shrink-0">
                        <LogOut size={13} />
                      </div>
                      {isId ? 'Keluar Aplikasi' : 'Log Out / Sign Out'}
                    </button>
                  </div>
                </div>
              </>
            )}
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
                  <LayoutDashboard size={12} /> 
                  <span>
                    {family?.name || (
                      family?.spaceType === 'personal' 
                        ? t('personal_balance') 
                        : family?.spaceType === 'unmarried' 
                          ? t('joint_balance') 
                          : t('shared_balance')
                    )}
                  </span>
                </p>
                <div className="flex items-center gap-3.5 py-1.5 flex-wrap">
                  <h2 className="text-3xl sm:text-5xl font-brand font-bold tracking-tight text-white leading-none break-all">
                    {hideBalances ? '••••••' : formatCurrency(family?.totalBalance || 0, family?.currency)}
                  </h2>
                  <button 
                    onClick={() => setHideBalances(!hideBalances)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-stone-400 hover:text-white flex items-center justify-center active:scale-90 flex-shrink-0"
                    aria-label={hideBalances ? "Tampilkan saldo" : "Sembunyikan saldo"}
                  >
                    {hideBalances ? <Eye size={22} /> : <EyeOff size={22} />}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium bg-emerald-400/10 w-max px-3 py-1 rounded-full">
                    <TrendingUp size={12} /> +2.4% {t('vs_last_month')}
                  </div>
                  {isOverbudget && (
                    <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold bg-rose-400/10 w-max px-3.5 py-1 rounded-full animate-pulse border border-rose-400/20">
                      <span>⚠️</span> {isId ? 'Saldo Menipis (Overbudget)' : 'Low Balance (Overbudget)'}
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 rotate-12">
                <Wallet size={24} className="text-orange-400" />
              </div>
            </div>

            {isChild ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 relative z-10 text-left">
                <span className="text-xl flex-shrink-0">🧒</span>
                <p className="text-stone-300 text-xs font-semibold leading-normal">
                  {isId 
                    ? 'Mode Anak Aktif: Anda dapat memantau saldo, melihat riwayat transaksi, dan mengerjakan tugas Chores di modul anak.' 
                    : 'Kid Mode Active: You can monitor balances, view transaction logs, and claim chore tasks in the Kids Kit.'}
                </p>
              </div>
            ) : (
              <div className="flex gap-4 relative z-10">
                <button 
                  id="btn-add-income"
                  onClick={() => { setScannerData(null); setIsTxFormOpen(true); }}
                  className="flex-1 h-14 bg-white text-stone-900 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-50 transition-all active:scale-95 shadow-lg shadow-black/20 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white focus:outline-none"
                >
                  <Plus size={20} /> {t('add_income')}
                </button>
                <button 
                  id="btn-scan-receipt"
                  aria-label="Scan struk belanja dengan kamera / Scan receipt with camera"
                  onClick={() => setIsScannerOpen(true)}
                  className="w-14 h-14 bg-stone-800 text-white rounded-2xl flex items-center justify-center border border-stone-700 hover:bg-stone-700 transition-all active:scale-95 shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white focus:outline-none"
                >
                  <Camera size={20} />
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Premium Wealth Indicators */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
          <div 
            id="btn-health-score"
            role="button"
            tabIndex={0}
            aria-label="Buka Detail Kesehatan Finansial / Open Financial Health Detail"
            onClick={() => { setHealthDetailTab('health'); setIsHealthDetailOpen(true); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setHealthDetailTab('health'); setIsHealthDetailOpen(true); } }}
            className="bg-white p-5 rounded-[2rem] border border-stone-100 flex items-center justify-between shadow-sm cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all active:scale-[0.99] group focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900 focus:outline-none"
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
            id="btn-dti-ratio"
            role="button"
            tabIndex={0}
            aria-label="Buka Detail Rasio Debt-to-Income / Open Debt-to-Income Ratio Detail"
            onClick={() => { setHealthDetailTab('dti'); setIsHealthDetailOpen(true); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setHealthDetailTab('dti'); setIsHealthDetailOpen(true); } }}
            className="bg-white p-5 rounded-[2rem] border border-stone-100 flex items-center justify-between shadow-sm cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all active:scale-[0.99] group focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900 focus:outline-none"
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
              <p className="text-xl font-brand font-bold text-stone-800 mt-1">{hideBalances ? '••••••' : formatCurrency(totalIncome, family?.currency)}</p>
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
              <p className="text-xl font-brand font-bold text-stone-800 mt-1">{hideBalances ? '••••••' : formatCurrency(totalExpense, family?.currency)}</p>
            </div>
          </div>
        </motion.div>

        {/* Category Budget Caps Section */}
        <motion.section variants={itemVariants} className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <div>
              <h3 className="font-brand font-bold text-stone-800 text-lg tracking-tight">{isId ? 'Anggaran Bulanan' : 'Monthly Budgets'}</h3>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">{isId ? 'Pagu Kategori Aktif' : 'Active Category Caps'}</p>
            </div>
            <button 
              id="btn-edit-budgets"
              onClick={() => setIsSettingsOpen(true)}
              className="text-[10px] text-stone-400 hover:text-stone-900 font-bold uppercase tracking-widest bg-stone-50 px-3.5 py-1.5 rounded-full transition-colors focus:outline-none"
            >
              {isId ? 'Atur Batas' : 'Set Limits'}
            </button>
          </div>

          {family?.budgetLimits && Object.keys(family.budgetLimits).length > 0 ? (
            <div className="grid gap-4 bg-white border border-stone-100 p-6 rounded-[2.5rem] shadow-sm relative overflow-hidden">
              <div className="space-y-5">
                {Object.entries(family.budgetLimits).map(([cat, limitVal]) => {
                  const limit = parseFloat(limitVal as string) || 0;
                  if (limit <= 0) return null;
                  
                  const spent = categorySpentMtd[cat] || 0;
                  const pct = Math.round((spent / limit) * 100);
                  
                  // Color scale: Green (< 70%), Orange (70% - 90%), Red (> 90%)
                  const progressColor = pct >= 90 
                    ? "bg-rose-500" 
                    : pct >= 70 
                      ? "bg-orange-400" 
                      : "bg-emerald-500";

                  const textBadgeColor = pct >= 90 
                    ? "text-rose-600 bg-rose-50" 
                    : pct >= 70 
                      ? "text-orange-600 bg-orange-50" 
                      : "text-emerald-600 bg-emerald-50";

                  return (
                    <div key={cat} className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-stone-700">
                          <span>
                            {cat === 'Food' ? '🍱' : cat === 'Transport' ? '⛽' : cat === 'Shopping' ? '📦' : '💰'}
                          </span>
                          <span>{cat === 'Food' ? (isId ? 'Makanan' : 'Food') : cat === 'Transport' ? (isId ? 'Transportasi' : 'Transport') : cat === 'Shopping' ? (isId ? 'Belanja' : 'Shopping') : (isId ? 'Tabungan' : 'Savings')}</span>
                        </div>
                        <span className={cn("text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider", textBadgeColor)}>
                          {pct}% {pct >= 100 ? (isId ? 'Terlampaui' : 'Overspent') : ''}
                        </span>
                      </div>
                      
                      <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden relative">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, pct)}%` }}
                          transition={{ type: 'spring' as const, stiffness: 60, damping: 12 }}
                          className={cn("h-full rounded-full transition-all", progressColor)}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-bold text-stone-400">
                        <span>{hideBalances ? '••••••' : formatCurrency(spent, family?.currency)} {isId ? 'terpakai' : 'spent'}</span>
                        <span>{isId ? 'Pagu' : 'Limit'} {hideBalances ? '••••••' : formatCurrency(limit, family?.currency)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div 
              onClick={() => setIsSettingsOpen(true)}
              className="bg-white border border-dashed border-stone-200 rounded-[2.5rem] p-7 text-center space-y-3 cursor-pointer hover:border-orange-200 transition-all active:scale-[0.99] group"
            >
              <div className="w-12 h-12 bg-orange-50 text-orange-400 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <span>🛡️</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-stone-700 text-sm">{isId ? 'Anggaran Belum Dipagari' : 'Budget Unprotected'}</h4>
                <p className="text-xs text-stone-400 max-w-[320px] mx-auto leading-relaxed">
                  {isId 
                    ? 'Atur batas anggaran kategori di Pengaturan untuk mencegah kebocoran pengeluaran secara visual.' 
                    : 'Set category budget caps in Settings to prevent accidental overspending with dynamic indicators.'}
                </p>
              </div>
            </div>
          )}
        </motion.section>

        {/* Premium AI Financial Suite */}
        <motion.section variants={itemVariants} className="space-y-4">
          <div>
            <h3 className="font-brand font-bold text-stone-800 text-lg tracking-tight">{t('premium_suite')}</h3>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">{t('advanced_features')}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              id="btn-ai-advisor"
              onClick={() => setIsAiAdvisorOpen(true)}
              className="p-5 rounded-[2rem] border border-stone-100 bg-white text-left shadow-sm hover:border-indigo-200 transition-all flex flex-col justify-between h-36 relative overflow-hidden group active:scale-98 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900 focus:outline-none"
            >
              <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-indigo-50/50 rounded-full group-hover:scale-110 transition-transform" />
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 w-max"><Sparkles size={18} /></div>
              <div>
                <h4 className="font-bold text-stone-800 text-xs">{t('ai_advisor')}</h4>
                <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">{t('empathetic_advisor')}</p>
              </div>
            </button>

            <button 
              id="btn-debt-tracker"
              onClick={() => setIsDebtTrackerOpen(true)}
              className="p-5 rounded-[2rem] border border-stone-100 bg-white text-left shadow-sm hover:border-rose-200 transition-all flex flex-col justify-between h-36 relative overflow-hidden group active:scale-98 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900 focus:outline-none"
            >
              <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-rose-50/50 rounded-full group-hover:scale-110 transition-transform" />
              <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 w-max"><TrendingDown size={18} /></div>
              <div>
                <h4 className="font-bold text-stone-800 text-xs">{t('debt_tracker')}</h4>
                <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">{t('fixed_floating_loans')}</p>
              </div>
            </button>

            <button 
              id="btn-credit-simulator"
              onClick={() => setIsCreditSimOpen(true)}
              className="p-5 rounded-[2rem] border border-stone-100 bg-white text-left shadow-sm hover:border-emerald-200 transition-all flex flex-col justify-between h-36 relative overflow-hidden group active:scale-98 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900 focus:outline-none"
            >
              <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-emerald-50/50 rounded-full group-hover:scale-110 transition-transform" />
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 w-max"><BarChart2 size={18} /></div>
              <div>
                <h4 className="font-bold text-stone-800 text-xs">{t('credit_simulator')}</h4>
                <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">{t('kpr_vehicle_loans')}</p>
              </div>
            </button>

            <button 
              id="btn-roadmap"
              onClick={() => setIsRoadmapOpen(true)}
              className="p-5 rounded-[2rem] border border-stone-100 bg-white text-left shadow-sm hover:border-amber-200 transition-all flex flex-col justify-between h-36 relative overflow-hidden group active:scale-98 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900 focus:outline-none"
            >
              <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-amber-50/50 rounded-full group-hover:scale-110 transition-transform" />
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 w-max"><Compass size={18} /></div>
              <div>
                <h4 className="font-bold text-stone-800 text-xs">{t('roadmap')}</h4>
                <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">{t('emergency_wealth_goals')}</p>
              </div>
            </button>

            <button 
              id="btn-community-feed"
              onClick={() => setIsCommunityOpen(true)}
              className="p-5 rounded-[2rem] border border-stone-100 bg-white text-left shadow-sm hover:border-indigo-200 transition-all flex flex-col justify-between h-36 relative overflow-hidden col-span-2 group active:scale-98 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900 focus:outline-none"
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
            <button 
              id="btn-view-all-transactions"
              onClick={() => { setHistoryFilterType('all'); setIsHistoryOpen(true); }} 
              className="text-xs text-stone-400 hover:text-stone-900 font-bold uppercase tracking-widest bg-stone-50 px-4 py-2 rounded-full transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900 focus:outline-none"
            >
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
                onClick={() => tx.items && setExpandedTxId(expandedTxId === tx.id ? null : tx.id)}
                className={cn(
                  "bg-white p-5 rounded-[2rem] border border-stone-100 flex flex-col gap-4 hover:border-orange-200 transition-all shadow-sm",
                  tx.items ? "cursor-pointer active:scale-[0.99]" : ""
                )}
              >
                <div className="flex items-center gap-5 w-full">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner flex-shrink-0",
                    tx.type === 'expense' ? "bg-rose-50/50" : "bg-emerald-50/50"
                  )}>
                    {tx.category === 'Food' ? '🍱' : tx.category === 'Transport' ? '⛽' : tx.category === 'Education' ? '📚' : '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-stone-800 truncate mb-0.5">{tx.description}</p>
                    <p className="text-stone-400 text-xs font-bold uppercase tracking-tighter">
                      {isId ? (tx.category === 'Food' ? 'Makanan' : tx.category === 'Transport' ? 'Transportasi' : tx.category === 'Shopping' ? 'Belanja' : tx.category) : tx.category} • {new Date(tx.date).toLocaleDateString()}
                      {tx.createdBy && ` • ${isId ? 'oleh' : 'by'} ${tx.createdBy}`}
                      {tx.items && ` • ${isId ? '🧾 Lihat Struk' : '🧾 View Items'}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-lg font-brand font-bold",
                      tx.type === 'expense' ? "text-stone-800" : "text-emerald-600"
                    )}>
                      {tx.type === 'expense' ? '-' : '+'}{hideBalances ? '••••••' : formatCurrency(tx.amount, family?.currency)}
                    </p>
                  </div>
                </div>

                {/* Expandable Items Details */}
                {expandedTxId === tx.id && tx.items && (
                  <div className="border-t border-dashed border-stone-200 pt-3 mt-1 space-y-2">
                    {tx.items.map((item: any, itemIdx: number) => (
                      <div key={itemIdx} className="flex justify-between items-center text-xs">
                        <div className="flex-1 pr-2">
                          <p className="font-semibold text-stone-700">{item.Name}</p>
                          <p className="text-[10px] text-stone-400">
                            {item.Qty} × {hideBalances ? '••••••' : formatCurrency(item.Price, family?.currency)}
                          </p>
                        </div>
                        <div className="font-brand font-bold text-stone-600">
                          {hideBalances ? '••••••' : formatCurrency(item.Qty * item.Price, family?.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
            <button 
              onClick={() => setIsKidsModalOpen(true)}
              className="text-[10px] text-emerald-600 hover:text-emerald-950 font-bold uppercase tracking-widest bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-full transition-all active:scale-95 shadow-sm border border-emerald-100"
            >
              {isId ? 'Kelola' : 'Manage'}
            </button>
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

            {tasks.filter(t => t.status !== 'completed').map(task => {
              const isClaimed = task.status === 'claimed';
              const isParent = profile?.role === 'parent';

              return (
                <div key={task.id} className={cn(
                  "flex-shrink-0 bg-white p-6 rounded-[2.5rem] border w-52 space-y-4 shadow-sm snap-center hover:scale-105 transition-transform cursor-pointer",
                  isClaimed ? "border-amber-200 bg-amber-50/10 shadow-md shadow-amber-50" : "border-emerald-50"
                )}>
                  <div className="flex justify-between items-start">
                    <div className="bg-orange-50 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-orange-100">
                      {isClaimed ? '⏳' : '💰'}
                    </div>
                    {isClaimed && (
                      <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {isId ? 'Menunggu' : 'Awaiting'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-stone-800">{t('task')}</p>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest truncate max-w-[150px]">{task.title}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] font-semibold text-emerald-600">{formatCurrency(task.rewardAmount)}</span>
                        {isClaimed && (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-300 flex-shrink-0" />
                            <span className="text-[9px] font-bold text-indigo-600 truncate">{task.claimedByKidName || 'Kid'}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {isClaimed ? (
                    isParent ? (
                      <div className="flex gap-2 w-full pt-1">
                        <button
                          onClick={async () => {
                            const kidWalletId = task.claimedByKidWalletId || (kidWallets.length > 0 ? kidWallets[0].id : null);
                            if (!kidWalletId) return alert(isId ? "Dompet anak tidak ditemukan!" : "Kid wallet not found!");
                            try {
                              await claimTask(profile.familyId, kidWalletId, task.id, task.rewardAmount, task.title);
                              alert(isId ? "Klaim disetujui! Saldo berhasil ditransfer." : "Claim approved! Balance transferred successfully.");
                            } catch (e: any) {
                              alert(e.message);
                            }
                          }}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold uppercase flex items-center justify-center active:scale-95 transition-transform"
                        >
                          {isId ? 'Setuju' : 'Approve'}
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, 'tasks', task.id), {
                                status: 'pending',
                                claimedByKidWalletId: null,
                                claimedByKidName: null
                              });
                              alert(isId ? "Klaim ditolak dan tugas dikembalikan." : "Claim rejected and task reverted.");
                            } catch (e: any) {
                              console.error(e);
                              alert(isId ? "Gagal menolak klaim." : "Failed to reject claim.");
                            }
                          }}
                          className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-xl active:scale-95 transition-transform flex items-center justify-center"
                          aria-label="Tolak Klaim / Reject Claim"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-stone-100 text-stone-400 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-wider cursor-not-allowed"
                      >
                        {isId ? 'Menunggu Persetujuan' : 'Awaiting Approval'}
                      </button>
                    )
                  ) : (
                    <button 
                      onClick={async () => {
                        if (kidWallets.length === 0) return alert(isId ? "Silakan tambah modul anak terlebih dahulu!" : "Please add a kid wallet first!");
                        try {
                          await updateDoc(doc(db, 'tasks', task.id), {
                            status: 'claimed',
                            claimedByKidWalletId: kidWallets[0].id,
                            claimedByKidName: kidWallets[0].name || 'Kid'
                          });
                          alert(isId ? "Klaim dikirim! Menunggu persetujuan." : "Claim request submitted! Awaiting parent approval.");
                        } catch (e: any) { 
                          console.error(e);
                          alert(isId ? "Gagal mengajukan klaim." : "Failed to submit claim.");
                        }
                      }} 
                      className="w-full bg-stone-900 hover:bg-stone-800 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest active:scale-95 transition-transform"
                    >
                      {t('claim')}
                    </button>
                  )}
                </div>
              );
            })}
            
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
        <button 
          id="btn-nav-dashboard"
          aria-label="Dashboard Beranda / Home Dashboard"
          className="relative group p-4 rounded-3xl bg-white/10 text-white transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus:outline-none"
        >
          <LayoutDashboard size={22} className="group-hover:scale-110" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full" />
        </button>
        <button 
          id="btn-nav-analytics"
          aria-label="Analisis Pengeluaran / Expense Analytics"
          onClick={() => setIsAnalyticsOpen(true)} 
          className="group p-4 rounded-3xl text-stone-500 hover:text-white transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus:outline-none"
        >
          <PieChart size={22} className="group-hover:scale-110" />
        </button>
        <div className="h-4 w-[1px] bg-stone-700/50 mx-2" />
        <button 
          id="btn-nav-goals"
          aria-label="Target Keuangan / Financial Goals"
          onClick={() => setIsGoalsOpen(true)} 
          className="group p-4 rounded-3xl text-stone-500 hover:text-white transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus:outline-none"
        >
          <Target size={22} className="group-hover:scale-110" />
        </button>
        {isMarried && !isChild && (
          <button 
            id="btn-nav-kids"
            aria-label="Modul Tabungan Anak / Kids Financial Kit"
            onClick={() => setIsKidsModalOpen(true)} 
            className="group p-4 rounded-3xl text-stone-500 hover:text-white transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus:outline-none"
          >
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
        familyId={profile?.familyId || ''}
        currency={family?.currency}
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

      {/* Invite Confirmation Popup Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" 
              onClick={() => { setIsInviteModalOpen(false); setPendingInviteCode(null); }} 
            />
            
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 20, opacity: 0 }} 
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl z-10 border border-stone-100 flex flex-col items-center text-center space-y-6"
            >
              {/* Header Icon Visual */}
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                <Users size={28} />
              </div>

              {/* Text Info */}
              <div className="space-y-2">
                <h3 className="font-brand font-bold text-stone-900 text-lg">
                  {isId ? 'Undangan Kolaborasi!' : 'Collaboration Invite!'}
                </h3>
                <p className="text-stone-500 text-xs leading-relaxed font-medium">
                  {isId 
                    ? 'Anda telah diundang untuk bergabung ke ruang keuangan bersama. Masukkan ruang dengan kode undangan:' 
                    : 'You have been invited to join a shared financial space. Enter the space using the invite code:'}
                </p>
                <div className="bg-indigo-50 border border-indigo-100/50 p-3 rounded-2xl font-mono font-bold text-indigo-900 text-xl tracking-widest uppercase mt-3">
                  {pendingInviteCode}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-2 pt-2">
                <button
                  onClick={handleConfirmInviteJoin}
                  disabled={isJoiningInvite}
                  className="w-full h-12 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                  {isJoiningInvite 
                    ? (isId ? 'Bergabung...' : 'Joining...') 
                    : (isId ? 'Ya, Gabung Sekarang' : 'Yes, Join Now')}
                </button>
                <button
                  onClick={() => { setIsInviteModalOpen(false); setPendingInviteCode(null); }}
                  disabled={isJoiningInvite}
                  className="w-full h-12 bg-stone-50 hover:bg-stone-100 text-stone-600 rounded-xl font-bold transition-colors"
                >
                  {isId ? 'Batal' : 'Cancel'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
