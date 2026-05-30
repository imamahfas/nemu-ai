import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingDown, Plus, CreditCard, Calendar, BarChart2, DollarSign } from 'lucide-react';
import { formatCurrency, formatNumberInput } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';

interface Debt {
  id: string;
  lender: string;
  principal: number;
  interestRate: number;
  interestType: 'fixed' | 'floating';
  tenor: number;
  paidAmount: number;
  createdAt: string;
}

export function DebtTrackerModal({ isOpen, onClose, totalBalance, onRepay, spaceType, familyId, currency = 'IDR' }: {
  isOpen: boolean;
  onClose: () => void;
  totalBalance: number;
  onRepay: (amount: number, description: string) => Promise<void>;
  spaceType: string;
  familyId: string;
  currency?: string;
}) {
  const { t, i18n } = useTranslation();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [lender, setLender] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [interestType, setInterestType] = useState<'fixed' | 'floating'>('fixed');
  const [tenor, setTenor] = useState('');

  // Sync debts from Firestore real-time collection
  useEffect(() => {
    if (!familyId || !isOpen) return;

    const q = query(
      collection(db, 'debts'),
      where('familyId', '==', familyId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const loadedDebts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Debt[];
      
      // Sort chronologically (descending by createdAt) locally to avoid index requirement
      loadedDebts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDebts(loadedDebts);
    }, (error) => {
      console.error("Firestore loading debts error:", error);
    });

    return unsub;
  }, [familyId, isOpen]);

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lender || !principal || !interestRate || !tenor || !familyId) return;

    try {
      await addDoc(collection(db, 'debts'), {
        familyId,
        lender,
        principal: parseFloat(principal),
        interestRate: parseFloat(interestRate),
        interestType,
        tenor: parseInt(tenor),
        paidAmount: 0,
        createdAt: new Date().toISOString()
      });

      setLender(''); setPrincipal(''); setInterestRate(''); setTenor('');
      setIsAdding(false);
    } catch (err) {
      console.error("Failed to add debt to Firestore:", err);
      const isId = i18n.language?.startsWith('id');
      alert(isId ? "Gagal menambahkan utang." : "Failed to add debt.");
    }
  };

  const handleRepayDebt = async (debtId: string, installment: number) => {
    const isId = i18n.language?.startsWith('id');
    if (totalBalance < installment) {
      alert(isId ? "Saldo Nemu Anda tidak mencukupi!" : "Insufficient funds in your Nemu balance!");
      return;
    }

    const targetDebt = debts.find(d => d.id === debtId);
    if (!targetDebt) return;

    try {
      // Log transaction in parent
      await onRepay(installment, `Repayment to ${targetDebt.lender}`);

      // Update Firestore document
      const totalDebtObligation = targetDebt.principal * (1 + (targetDebt.interestRate / 100) * (targetDebt.tenor / 12));
      const newPaidAmount = Math.min(totalDebtObligation, targetDebt.paidAmount + installment);
      
      await updateDoc(doc(db, 'debts', debtId), {
        paidAmount: newPaidAmount,
        updatedAt: new Date().toISOString()
      });

      alert(isId ? "Pembayaran berhasil!" : "Repayment successful!");
    } catch (e) {
      console.error(e);
      alert(isId ? "Gagal mencatat pembayaran." : "Failed to record repayment.");
    }
  };

  // Calculations
  const activeDebts = debts.filter(d => {
    const totalObligation = d.principal * (1 + (d.interestRate / 100) * (d.tenor / 12));
    return d.paidAmount < totalObligation;
  });

  const totalMonthlyObligation = activeDebts.reduce((sum, d) => {
    const totalObligation = d.principal * (1 + (d.interestRate / 100) * (d.tenor / 12));
    const monthlyInstallment = totalObligation / d.tenor;
    return sum + monthlyInstallment;
  }, 0);

  // Assuming a benchmark monthly income of Rp 12.500.000 for DTI calculations (standard Nemu Income)
  const monthlyIncome = 12500000;
  const dtiRatio = Math.round((totalMonthlyObligation / monthlyIncome) * 100);

  const isId = i18n.language?.startsWith('id');
  let dtiStatus = isId ? 'Aman' : 'Healthy';
  let dtiColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
  if (dtiRatio >= 30 && dtiRatio <= 50) {
    dtiStatus = isId ? 'Siaga' : 'Warning';
    dtiColor = 'text-orange-600 bg-orange-50 border-orange-100';
  } else if (dtiRatio > 50) {
    dtiStatus = isId ? 'Bahaya' : 'Danger';
    dtiColor = 'text-rose-600 bg-rose-50 border-rose-100';
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl z-10 h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-stone-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 shadow-md shadow-rose-100/50">
                  <TrendingDown size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-brand font-bold text-stone-900">{t('debt_tracker')}</h2>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Nemu Premium Suite</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors"><X size={20} /></button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide py-4 space-y-6">
              
              {/* DTI Gauge Panel */}
              <div className={`p-5 rounded-[2rem] border ${dtiColor} flex justify-between items-center transition-all`}>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{isId ? 'Rasio Debt-to-Income (DTI)' : 'Debt-to-Income (DTI) Ratio'}</p>
                  <h3 className="text-2xl font-brand font-bold">{dtiRatio}% <span className="text-xs font-semibold">({dtiStatus})</span></h3>
                  <p className="text-[9px] opacity-75 font-medium leading-relaxed">{isId ? 'Batasi kewajiban Anda di bawah 30% dari pendapatan.' : 'Limit your obligations to below 30% of income.'}</p>
                </div>
                <div className="p-3.5 bg-white rounded-2xl shadow-sm border border-stone-100/50">
                  <BarChart2 size={24} />
                </div>
              </div>

              {isAdding ? (
                <form onSubmit={handleAddDebt} className="space-y-4 bg-stone-50 p-5 rounded-[2rem] border border-stone-100">
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">{t('add_debt')}</h3>
                  <div>
                    <label className="text-[10px] font-bold text-stone-400">{t('lender')}</label>
                    <input type="text" value={lender} onChange={e => setLender(e.target.value)} required className="w-full mt-1 bg-white p-3 rounded-xl font-bold border border-stone-100 text-sm" placeholder="e.g. BCA Credit Card" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-stone-400">{t('principal')}</label>
                      <input type="text" value={formatNumberInput(principal)} onChange={e => setPrincipal(e.target.value.replace(/\D/g, ''))} required className="w-full mt-1 bg-white p-3 rounded-xl font-bold border border-stone-100 text-sm" placeholder="50.000.000" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-400">{t('interest_rate')}</label>
                      <input type="number" step="0.1" value={interestRate} onChange={e => setInterestRate(e.target.value)} required className="w-full mt-1 bg-white p-3 rounded-xl font-bold border border-stone-100 text-sm" placeholder="12" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-stone-400">{t('tenor')}</label>
                      <input type="number" value={tenor} onChange={e => setTenor(e.target.value)} required className="w-full mt-1 bg-white p-3 rounded-xl font-bold border border-stone-100 text-sm" placeholder="12" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-400 font-medium">{t('interest_type')}</label>
                      <select value={interestType} onChange={e => setInterestType(e.target.value as any)} className="w-full mt-1 bg-white p-3 rounded-xl font-bold border border-stone-100 text-sm">
                        <option value="fixed">{t('fixed_rate')}</option>
                        <option value="floating">{t('floating_rate')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setIsAdding(false)} className="flex-1 bg-stone-200 py-3 rounded-xl font-bold text-stone-600 text-xs uppercase tracking-wider">{t('cancel')}</button>
                    <button type="submit" className="flex-1 bg-stone-900 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider">{t('save_obligation')}</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{t('active_obligations')} ({activeDebts.length})</p>
                    <button onClick={() => setIsAdding(true)} className="flex items-center gap-1 text-[10px] bg-stone-900 text-white px-3 py-1.5 rounded-full font-bold uppercase tracking-widest"><Plus size={12} /> {t('add_debt')}</button>
                  </div>

                  <div className="space-y-4">
                    {activeDebts.map(d => {
                      const totalObligation = d.principal * (1 + (d.interestRate / 100) * (d.tenor / 12));
                      const monthlyInstallment = totalObligation / d.tenor;
                      const percentage = Math.min(100, Math.round((d.paidAmount / totalObligation) * 100));

                      return (
                        <div key={d.id} className="border border-stone-100 p-5 rounded-[2rem] space-y-4 bg-white shadow-sm hover:border-stone-200 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-stone-800 text-sm">{d.lender}</h4>
                              <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">{d.interestRate}% p.a. • {d.interestType === 'fixed' ? (isId ? 'Tetap' : 'Fixed') : (isId ? 'Mengambang' : 'Floating')}</p>
                            </div>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{percentage}% {isId ? 'Terbayar' : 'Paid'}</span>
                          </div>

                          <div className="w-full bg-stone-50 h-2 rounded-full overflow-hidden">
                            <div className="bg-rose-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                          </div>

                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">{t('outstanding')}</p>
                              <p className="font-brand font-bold text-stone-800 text-xs mt-0.5">{formatCurrency(totalObligation - d.paidAmount, currency)} / {formatCurrency(totalObligation, currency)}</p>
                            </div>
                            <button
                              onClick={() => handleRepayDebt(d.id, monthlyInstallment)}
                              className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"
                            >
                              <CreditCard size={12} /> {t('pay_installment')} ({formatCurrency(monthlyInstallment, currency)})
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {activeDebts.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-[2.5rem] p-6">
                        <CreditCard className="mx-auto text-stone-200 mb-3" size={36} />
                        <h4 className="font-bold text-stone-700 text-xs">{t('no_active_debts')}</h4>
                        <p className="text-[10px] text-stone-400 font-medium leading-relaxed max-w-[200px] mx-auto mt-1">{t('no_active_debts_desc')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
