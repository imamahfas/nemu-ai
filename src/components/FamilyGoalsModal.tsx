import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, Plus, PiggyBank, Sparkles, AlertCircle, Coins, ChevronRight, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatNumberInput, cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

export function FamilyGoalsModal({ 
  isOpen, 
  onClose, 
  familyId, 
  totalBalance, 
  spaceType,
  userId = 'system'
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  familyId: string, 
  totalBalance: number, 
  spaceType: string,
  userId?: string
}) {
  const { t, i18n } = useTranslation();
  const isId = i18n.language?.startsWith('id');
  
  // Navigation tabs for Married/Family mode
  const [activeTab, setActiveTab] = useState<'family' | 'kids'>('family');
  
  const [goals, setGoals] = useState<any[]>([]);
  const [kidGoals, setKidGoals] = useState<any[]>([]);
  const [kidWallets, setKidWallets] = useState<any[]>([]);
  
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  // Allocation drawer states
  const [allocatingGoalId, setAllocatingGoalId] = useState<string | null>(null);
  const [allocatingKidGoalId, setAllocatingKidGoalId] = useState<string | null>(null);
  const [customAllocAmount, setCustomAllocAmount] = useState<string>('');

  // Roadmap Sync Calculator: Emergency buffer is 6x expenses (monthly expenses Rp 8.450.000)
  const monthlyExpenses = 8450000;
  const emergencyFundTarget = monthlyExpenses * 6;
  const isEmergencyFundShort = totalBalance < emergencyFundTarget;

  // Real-time synchronization
  useEffect(() => {
    if (!isOpen || !familyId) return;

    // 1. Sync Family/Couple goals
    const unsubFamilyGoals = onSnapshot(
      query(collection(db, 'familyGoals'), where('familyId', '==', familyId)), 
      snapshot => {
        setGoals(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    // 2. Sync Kids saving goals if Married/Family Space is active
    let unsubKidGoals = () => {};
    let unsubKidWallets = () => {};
    
    if (spaceType === 'married') {
      unsubKidGoals = onSnapshot(
        query(collection(db, 'savingGoals'), where('familyId', '==', familyId)), 
        snapshot => {
          setKidGoals(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      );
      unsubKidWallets = onSnapshot(
        query(collection(db, 'kidWallets'), where('familyId', '==', familyId)),
        snapshot => {
          setKidWallets(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      );
    }

    return () => {
      unsubFamilyGoals();
      unsubKidGoals();
      unsubKidWallets();
    };
  }, [isOpen, familyId, spaceType]);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount) return;
    
    try {
      if (activeTab === 'family') {
        await addDoc(collection(db, 'familyGoals'), {
          familyId,
          title,
          targetAmount: parseFloat(targetAmount),
          currentAmount: 0,
          createdAt: serverTimestamp()
        });
      } else {
        // Add direct kid goal
        await addDoc(collection(db, 'savingGoals'), {
          familyId,
          title,
          targetAmount: parseFloat(targetAmount),
          createdAt: serverTimestamp()
        });
      }
      setTitle(''); 
      setTargetAmount(''); 
      setIsAdding(false);
    } catch (e) {
      console.error("Error adding goal: ", e);
    }
  };

  // Perform dynamic custom fund allocation for family/couple goals
  const handleAllocateCustom = async (goalId: string, title: string, current: number, max: number) => {
    const amountToAlloc = parseFloat(customAllocAmount.replace(/\D/g, '')) || 0;
    if (amountToAlloc <= 0) return alert(isId ? "Masukkan nominal yang valid!" : "Enter a valid amount!");
    if (totalBalance < amountToAlloc) return alert(isId ? "Saldo dompet keluarga tidak mencukupi!" : "Not enough family balance!");
    if (current + amountToAlloc > max) return alert(isId ? "Nominal melebihi sisa target!" : "Amount exceeds target remainder!");
    
    try {
      // 1. Update family goal progress
      await updateDoc(doc(db, 'familyGoals', goalId), { currentAmount: current + amountToAlloc });
      
      // 2. Deduct from family total balance
      await updateDoc(doc(db, 'families', familyId), { totalBalance: totalBalance - amountToAlloc });
      
      // 3. Log a detailed synced ledger transaction
      await addDoc(collection(db, 'transactions'), {
        familyId, 
        userId, 
        amount: amountToAlloc, 
        type: 'expense',
        category: 'Savings', 
        description: isId ? `Tabungan: ${title}` : `Savings: ${title}`, 
        date: new Date().toISOString(), 
        createdAt: serverTimestamp()
      });

      setCustomAllocAmount('');
      setAllocatingGoalId(null);
    } catch (e) { 
      console.error("Allocation error: ", e); 
    }
  };

  // Pocket Money allocation directly to Kids goals (Married Mode sync)
  const handleAllocatePocketMoney = async (goalTitle: string, targetMax: number) => {
    const amountToAlloc = parseFloat(customAllocAmount.replace(/\D/g, '')) || 0;
    if (amountToAlloc <= 0) return alert(isId ? "Masukkan nominal yang valid!" : "Enter a valid amount!");
    if (totalBalance < amountToAlloc) return alert(isId ? "Saldo keluarga tidak mencukupi!" : "Not enough family balance!");
    
    if (kidWallets.length === 0) {
      return alert(isId ? "Harap tambahkan dompet anak terlebih dahulu!" : "Please add a kid wallet first!");
    }

    const firstKid = kidWallets[0];
    if (firstKid.balance + amountToAlloc > targetMax) {
      return alert(isId ? "Nominal melebihi sisa target anak!" : "Amount exceeds child goal limit!");
    }

    try {
      // 1. Fund kid's wallet balance directly
      await updateDoc(doc(db, 'kidWallets', firstKid.id), { balance: firstKid.balance + amountToAlloc });
      
      // 2. Deduct from family total balance
      await updateDoc(doc(db, 'families', familyId), { totalBalance: totalBalance - amountToAlloc });
      
      // 3. Log synced expense transaction
      await addDoc(collection(db, 'transactions'), {
        familyId,
        userId,
        amount: amountToAlloc,
        type: 'expense',
        category: 'Savings',
        description: isId ? `Uang Saku: ${goalTitle}` : `Pocket Money: ${goalTitle}`,
        date: new Date().toISOString(),
        createdAt: serverTimestamp()
      });

      setCustomAllocAmount('');
      setAllocatingKidGoalId(null);
    } catch (e) {
      console.error("Pocket money transfer error: ", e);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" 
            onClick={onClose} 
          />
          
          {/* Modal */}
          <motion.div 
            initial={{ y: '100%' }} 
            animate={{ y: 0 }} 
            exit={{ y: '100%' }} 
            className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl z-10 flex flex-col h-[90vh] sm:h-[80vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-50 rounded-2xl text-orange-400 shadow-md shadow-orange-50">
                  <Target size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-brand font-bold text-stone-900 leading-tight">
                    {spaceType === 'personal' 
                      ? (isId ? 'Catatan Target Pribadi' : 'Personal Space Goals') 
                      : spaceType === 'married' 
                        ? (isId ? 'Catatan Target Keluarga' : 'Family Space Goals') 
                        : (isId ? 'Catatan Target Pasangan' : 'Couple Space Goals')}
                  </h2>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">
                    {isId ? 'Rencana & Alokasi Saldo' : 'Goals & Balance Allocation'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Premium Space Segments (Only shown in Married/Family mode) */}
            {spaceType === 'married' && (
              <div className="bg-stone-100/70 p-1.5 rounded-2xl flex items-center justify-between mb-5 flex-shrink-0">
                <button 
                  onClick={() => { setActiveTab('family'); setIsAdding(false); }}
                  className={cn(
                    "flex-grow py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                    activeTab === 'family' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-900"
                  )}
                >
                  <Target size={14} />
                  {isId ? 'Target Keluarga' : 'Family Goals'}
                </button>
                <button 
                  onClick={() => { setActiveTab('kids'); setIsAdding(false); }}
                  className={cn(
                    "flex-grow py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                    activeTab === 'kids' ? "bg-white text-emerald-600 shadow-sm" : "text-stone-500 hover:text-stone-900"
                  )}
                >
                  <PiggyBank size={14} />
                  {isId ? 'Tabungan Anak' : 'Kids Savings'}
                </button>
              </div>
            )}

            {/* Scrollable Content Pane */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar pb-6">
              
              {/* Financial Roadmap Sync Alert Caution (Bento Sync) */}
              {isEmergencyFundShort && activeTab === 'family' && !isAdding && (
                <div className="bg-amber-50/70 border border-amber-100 p-4 rounded-3xl flex items-start gap-3 shadow-sm shadow-amber-50">
                  <div className="p-2 bg-amber-50 rounded-xl text-amber-500 flex-shrink-0">
                    <Sparkles size={16} className="fill-amber-400" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-stone-800">{isId ? 'Prioritas Peta Jalan AI' : 'Roadmap AI Caution'}</p>
                    <p className="text-[9px] text-stone-500 leading-relaxed mt-0.5 font-medium">
                      {isId 
                        ? '⚠️ Saldo gabungan keluarga Anda belum mencukupi Dana Darurat (Fase 1). Batasi alokasi ke target sekunder demi proteksi finansial utama.' 
                        : '⚠️ Your total family balance is currently short of your Step 1 Emergency Fund. Focus on Roadmap Phase 1 before excessive discretionary targets.'}
                    </p>
                  </div>
                </div>
              )}

              {isAdding ? (
                <motion.form 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleAddGoal} 
                  className="space-y-4 bg-stone-50/70 border border-stone-100 p-5 rounded-[2rem]"
                >
                  <h3 className="font-brand font-bold text-sm text-stone-800">
                    {isId ? 'Buat Rencana Target Baru' : 'Create New Target Goal'}
                  </h3>
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t('goal_name')}</label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={e => setTitle(e.target.value)} 
                      required 
                      className="w-full mt-1 bg-white p-3 rounded-2xl font-bold border border-stone-100 text-sm focus:outline-none focus:border-orange-200" 
                      placeholder={isId ? "misal: Liburan Bali, Kulkas Baru" : "e.g. Bali Trip, Family Laptop"} 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t('target_amount')}</label>
                    <input 
                      type="text" 
                      value={formatNumberInput(targetAmount)} 
                      onChange={e => setTargetAmount(e.target.value.replace(/\D/g, ''))} 
                      required 
                      className="w-full mt-1 bg-white p-3 rounded-2xl font-bold border border-stone-100 text-sm focus:outline-none focus:border-orange-200" 
                      placeholder="10.000.000" 
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsAdding(false)} 
                      className="flex-grow bg-stone-200/70 hover:bg-stone-200 py-3 rounded-2xl font-bold text-xs text-stone-600 transition-colors"
                    >
                      {t('cancel')}
                    </button>
                    <button 
                      type="submit" 
                      className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      {t('save')}
                    </button>
                  </div>
                </motion.form>
              ) : (
                <div className="space-y-4">
                  
                  {/* TAB 1: FAMILY / COUPLE GOALS */}
                  {activeTab === 'family' && (
                    <>
                      {goals.map(goal => {
                        const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                        const isAllocating = allocatingGoalId === goal.id;
                        const remainder = Math.max(0, goal.targetAmount - goal.currentAmount);
                        const maxTransferable = Math.min(totalBalance, remainder);

                        return (
                          <div 
                            key={goal.id} 
                            className="bg-white border border-stone-100 p-5 rounded-[2rem] space-y-4 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-brand font-bold text-stone-800 text-sm leading-tight">{goal.title}</p>
                                <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mt-1">
                                  {isId ? 'Target Utama' : 'Core Target'}
                                </p>
                              </div>
                              <span className={cn(
                                "text-[10px] font-bold px-3 py-1 rounded-full border shadow-sm",
                                percentage >= 100 
                                  ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                                  : "bg-orange-50 border-orange-100 text-orange-600"
                              )}>
                                {percentage}%
                              </span>
                            </div>

                            {/* visual progress bar */}
                            <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner">
                              <motion.div 
                                className="bg-gradient-to-r from-orange-400 to-emerald-500 h-full rounded-full" 
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                              />
                            </div>

                            <div className="flex justify-between items-center">
                              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-tight">
                                {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                              </p>
                              {percentage < 100 ? (
                                <button 
                                  onClick={() => {
                                    setAllocatingGoalId(isAllocating ? null : goal.id);
                                    setCustomAllocAmount('');
                                  }}
                                  className="bg-stone-900 text-white px-4 py-2 rounded-2xl text-[9px] font-bold uppercase tracking-widest hover:bg-stone-800 active:scale-95 transition-all flex items-center gap-1 shadow-sm"
                                >
                                  {isId ? 'Isi Saldo' : 'Fund Goal'}
                                  <ChevronRight size={10} />
                                </button>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                  <CheckCircle2 size={12} className="fill-emerald-50" />
                                  {isId ? 'Selesai' : 'Completed'}
                                </span>
                              )}
                            </div>

                            {/* Slider Allocation Drawer inside goal card */}
                            <AnimatePresence>
                              {isAllocating && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden border-t border-dashed border-stone-100 pt-4 mt-2 space-y-3"
                                >
                                  <div className="flex justify-between items-center text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                                    <span>{isId ? 'Nominal Pengisian' : 'Amount to Fund'}</span>
                                    <span>{isId ? `Tersedia: ${formatCurrency(totalBalance)}` : `Available: ${formatCurrency(totalBalance)}`}</span>
                                  </div>

                                  <div className="flex gap-2">
                                    <input 
                                      type="text" 
                                      value={formatNumberInput(customAllocAmount)}
                                      onChange={e => {
                                        const cleanVal = e.target.value.replace(/\D/g, '');
                                        const valNum = parseFloat(cleanVal) || 0;
                                        if (valNum <= maxTransferable) {
                                          setCustomAllocAmount(cleanVal);
                                        } else {
                                          setCustomAllocAmount(maxTransferable.toString());
                                        }
                                      }}
                                      className="flex-1 bg-stone-50 border border-stone-100 p-2.5 rounded-xl font-bold text-xs text-stone-800 focus:outline-none"
                                      placeholder="Nominal e.g. 500.000"
                                    />
                                    <button 
                                      onClick={() => handleAllocateCustom(goal.id, goal.title, goal.currentAmount, goal.targetAmount)}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 rounded-xl shadow-md transition-colors"
                                    >
                                      {isId ? 'Kirim' : 'Send'}
                                    </button>
                                  </div>

                                  {/* Presets Grid */}
                                  <div className="grid grid-cols-4 gap-1.5">
                                    {[50000, 100000, 500000, maxTransferable].map((preset, pIdx) => {
                                      if (preset <= 0) return null;
                                      const label = pIdx === 3 ? (isId ? 'Maks' : 'Max') : `+${preset / 1000}k`;
                                      return (
                                        <button 
                                          key={pIdx}
                                          type="button"
                                          onClick={() => setCustomAllocAmount(preset.toString())}
                                          className="bg-stone-50 hover:bg-stone-100 border border-stone-100 py-1.5 rounded-lg text-[9px] font-bold text-stone-600 transition-colors"
                                        >
                                          {label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {/* TAB 2: KIDS SAVING GOALS (Married sync) */}
                  {activeTab === 'kids' && (
                    <>
                      {kidGoals.map(goal => {
                        const kidBalance = kidWallets.length > 0 ? kidWallets[0].balance : 0;
                        const percentage = Math.min(100, Math.round((kidBalance / goal.targetAmount) * 100));
                        const isAllocating = allocatingKidGoalId === goal.id;
                        const remainder = Math.max(0, goal.targetAmount - kidBalance);
                        const maxTransferable = Math.min(totalBalance, remainder);

                        return (
                          <div 
                            key={goal.id} 
                            className="bg-white border border-emerald-50 p-5 rounded-[2rem] space-y-4 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-brand font-bold text-stone-800 text-sm leading-tight">{goal.title}</p>
                                <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                                  <Coins size={10} />
                                  {isId ? 'Target Tabungan Anak' : 'Kids Target'}
                                </p>
                              </div>
                              <span className={cn(
                                "text-[10px] font-bold px-3 py-1 rounded-full border shadow-sm",
                                percentage >= 100 
                                  ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                                  : "bg-teal-50 border-teal-100 text-teal-600"
                              )}>
                                {percentage}%
                              </span>
                            </div>

                            {/* visual progress bar */}
                            <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner">
                              <motion.div 
                                className="bg-gradient-to-r from-teal-400 to-emerald-500 h-full rounded-full" 
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                              />
                            </div>

                            <div className="flex justify-between items-center">
                              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-tight">
                                {formatCurrency(kidBalance)} / {formatCurrency(goal.targetAmount)}
                              </p>
                              {percentage < 100 ? (
                                <button 
                                  onClick={() => {
                                    setAllocatingKidGoalId(isAllocating ? null : goal.id);
                                    setCustomAllocAmount('');
                                  }}
                                  className="bg-emerald-600 text-white px-4 py-2 rounded-2xl text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-1 shadow-sm"
                                >
                                  {isId ? 'Beri Uang Saku' : 'Fund pocket money'}
                                  <ChevronRight size={10} />
                                </button>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                  <CheckCircle2 size={12} className="fill-emerald-50" />
                                  {isId ? 'Selesai' : 'Completed'}
                                </span>
                              )}
                            </div>

                            {/* Slide drawer for Pocket Money Allocation */}
                            <AnimatePresence>
                              {isAllocating && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden border-t border-dashed border-emerald-100 pt-4 mt-2 space-y-3"
                                >
                                  <div className="flex justify-between items-center text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                                    <span>{isId ? 'Nominal Uang Saku' : 'Transfer Amount'}</span>
                                    <span>{isId ? `Tersedia: ${formatCurrency(totalBalance)}` : `Available: ${formatCurrency(totalBalance)}`}</span>
                                  </div>

                                  <div className="flex gap-2">
                                    <input 
                                      type="text" 
                                      value={formatNumberInput(customAllocAmount)}
                                      onChange={e => {
                                        const cleanVal = e.target.value.replace(/\D/g, '');
                                        const valNum = parseFloat(cleanVal) || 0;
                                        if (valNum <= maxTransferable) {
                                          setCustomAllocAmount(cleanVal);
                                        } else {
                                          setCustomAllocAmount(maxTransferable.toString());
                                        }
                                      }}
                                      className="flex-1 bg-stone-50 border border-stone-100 p-2.5 rounded-xl font-bold text-xs text-stone-800 focus:outline-none"
                                      placeholder="Nominal e.g. 50.000"
                                    />
                                    <button 
                                      onClick={() => handleAllocatePocketMoney(goal.title, goal.targetAmount)}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 rounded-xl shadow-md transition-colors"
                                    >
                                      {isId ? 'Kirim' : 'Send'}
                                    </button>
                                  </div>

                                  {/* Preset Pills */}
                                  <div className="grid grid-cols-4 gap-1.5">
                                    {[20000, 50000, 100000, maxTransferable].map((preset, pIdx) => {
                                      if (preset <= 0) return null;
                                      const label = pIdx === 3 ? (isId ? 'Maks' : 'Max') : `+${preset / 1000}k`;
                                      return (
                                        <button 
                                          key={pIdx}
                                          type="button"
                                          onClick={() => setCustomAllocAmount(preset.toString())}
                                          className="bg-stone-50 hover:bg-stone-100 border border-stone-100 py-1.5 rounded-lg text-[9px] font-bold text-stone-600 transition-colors"
                                        >
                                          {label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {goals.length === 0 && activeTab === 'family' && (
                    <div className="text-center py-16 bg-stone-50 rounded-[2.5rem] border border-dashed border-stone-200">
                      <Target size={36} className="mx-auto text-stone-200 mb-3" />
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isId ? 'Belum Ada Target Aktif' : 'No Active Goals'}</p>
                      <p className="text-[10px] text-stone-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
                        {isId ? 'Mulai buat target impian keluarga atau pasangan Anda.' : 'Define your family or couple savings targets.'}
                      </p>
                    </div>
                  )}

                  {kidGoals.length === 0 && activeTab === 'kids' && (
                    <div className="text-center py-16 bg-stone-50 rounded-[2.5rem] border border-dashed border-stone-200">
                      <PiggyBank size={36} className="mx-auto text-stone-200 mb-3" />
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isId ? 'Belum Ada Target Anak' : 'No Kids Goals'}</p>
                      <p className="text-[10px] text-stone-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
                        {isId ? 'Tambahkan target tabungan baru untuk mengedukasi finansial anak.' : 'Create savings challenges for your children.'}
                      </p>
                    </div>
                  )}

                  <button 
                    onClick={() => setIsAdding(true)} 
                    className="w-full border-2 border-dashed border-stone-200 text-stone-400 py-4 rounded-[2rem] font-bold flex items-center justify-center gap-2 hover:bg-stone-50 hover:border-stone-300 transition-all active:scale-[0.99] duration-300 text-xs uppercase tracking-widest"
                  >
                    <Plus size={16} /> {isId ? 'Tambah Target Baru' : 'Add New Goal'}
                  </button>

                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
