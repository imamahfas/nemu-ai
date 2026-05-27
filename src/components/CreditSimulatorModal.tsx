import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BarChart3, HelpCircle, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useTranslation } from 'react-i18next';

type SimulatorType = 'kpr' | 'kpr_syariah' | 'car' | 'motorcycle' | 'kta';

export function CreditSimulatorModal({ isOpen, onClose, currency = 'IDR' }: { isOpen: boolean; onClose: () => void; currency?: string }) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<SimulatorType>('kpr');
  
  // Slider states
  const [amount, setAmount] = useState(500000000); // 500 million default
  const [tenor, setTenor] = useState(15); // 15 years
  const [rate, setRate] = useState(8.5); // 8.5%

  // Helpers for limits based on loan types
  const getLimits = () => {
    switch (activeTab) {
      case 'kpr':
      case 'kpr_syariah':
        return { maxAmount: 5000000000, stepAmount: 50000000, maxTenor: 30, unit: t('years') };
      case 'car':
        return { maxAmount: 1500000000, stepAmount: 20000000, maxTenor: 7, unit: t('years') };
      case 'motorcycle':
        return { maxAmount: 100000000, stepAmount: 2000000, maxTenor: 5, unit: t('years') };
      case 'kta':
      default:
        return { maxAmount: 250000000, stepAmount: 5000000, maxTenor: 60, unit: t('months') };
    }
  };

  const limits = getLimits();

  // Reset sliders when tab changes to avoid weird out-of-bound values
  const handleTabChange = (tab: SimulatorType) => {
    setActiveTab(tab);
    if (tab === 'kpr' || tab === 'kpr_syariah') {
      setAmount(500000000); setTenor(15); setRate(8.5);
    } else if (tab === 'car') {
      setAmount(300000000); setTenor(5); setRate(6.0);
    } else if (tab === 'motorcycle') {
      setAmount(25000000); setTenor(3); setRate(12.0);
    } else {
      setAmount(50000000); setTenor(24); setRate(15.0); // KTA
    }
  };

  // Calculations
  const calculateLoan = () => {
    const isKta = activeTab === 'kta';
    const totalMonths = isKta ? tenor : tenor * 12;
    
    let monthlyInstallment = 0;
    let floatingInstallment = 0;
    let totalObligation = 0;
    let totalInterest = 0;
    let interestRatio = 0;
    let isConventionalKpr = activeTab === 'kpr';

    if (activeTab === 'kpr') {
      // Conventional KPR: Fixed rate for 3 years (36 months) then jumps to floating rate (+4.5% p.a. promo adjustment)
      const monthlyRateFixed = (rate / 100) / 12;
      const floatingRate = rate + 4.5;
      const monthlyRateFloating = (floatingRate / 100) / 12;

      // Fixed segment installment
      if (monthlyRateFixed === 0) {
        monthlyInstallment = amount / totalMonths;
      } else {
        monthlyInstallment = amount * (monthlyRateFixed * Math.pow(1 + monthlyRateFixed, totalMonths)) / (Math.pow(1 + monthlyRateFixed, totalMonths) - 1);
      }

      if (totalMonths > 36) {
        // Calculate outstanding balance after 36 months of annuity payments
        const fixedPaidMonths = 36;
        let outstandingAfter36 = amount;
        if (monthlyRateFixed > 0) {
          const compoundFactorTotal = Math.pow(1 + monthlyRateFixed, totalMonths);
          const compoundFactorPaid = Math.pow(1 + monthlyRateFixed, fixedPaidMonths);
          outstandingAfter36 = amount * (compoundFactorTotal - compoundFactorPaid) / (compoundFactorTotal - 1);
        } else {
          outstandingAfter36 = amount - (monthlyInstallment * fixedPaidMonths);
        }

        // Calculate floating segment installment
        const remainingMonths = totalMonths - 36;
        if (monthlyRateFloating === 0) {
          floatingInstallment = outstandingAfter36 / remainingMonths;
        } else {
          floatingInstallment = outstandingAfter36 * (monthlyRateFloating * Math.pow(1 + monthlyRateFloating, remainingMonths)) / (Math.pow(1 + monthlyRateFloating, remainingMonths) - 1);
        }

        totalObligation = (monthlyInstallment * 36) + (floatingInstallment * remainingMonths);
      } else {
        totalObligation = monthlyInstallment * totalMonths;
        floatingInstallment = 0;
      }
      totalInterest = Math.max(0, totalObligation - amount);
    } else if (activeTab === 'kpr_syariah') {
      // Syariah Murabahah (Flat Margin pricing - locked forever)
      const totalMargin = amount * (rate / 100) * tenor;
      totalObligation = amount + totalMargin;
      monthlyInstallment = totalObligation / totalMonths;
      floatingInstallment = 0;
      totalInterest = totalMargin;
    } else if (activeTab === 'car' || activeTab === 'motorcycle') {
      // Flat Rate formula for Auto Loans
      const totalInterestFlat = amount * (rate / 100) * tenor;
      totalObligation = amount + totalInterestFlat;
      monthlyInstallment = totalObligation / totalMonths;
      floatingInstallment = 0;
      totalInterest = totalInterestFlat;
    } else {
      // KTA: Flat short-term personal rate
      const totalInterestFlat = amount * (rate / 100) * (tenor / 12);
      totalObligation = amount + totalInterestFlat;
      monthlyInstallment = totalObligation / totalMonths;
      floatingInstallment = 0;
      totalInterest = totalInterestFlat;
    }

    interestRatio = totalObligation > 0 ? Math.round((totalInterest / totalObligation) * 100) : 0;

    return {
      monthlyInstallment,
      floatingInstallment,
      totalObligation,
      totalInterest,
      interestRatio,
      isConventionalKpr
    };
  };

  const { monthlyInstallment, floatingInstallment, totalObligation, totalInterest, interestRatio, isConventionalKpr } = calculateLoan();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl z-10 h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-stone-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-md shadow-emerald-100/50">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-brand font-bold text-stone-900">{t('credit_simulator')}</h2>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Nemu Financial Suite</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors"><X size={20} /></button>
            </div>

            {/* Tab selector */}
            <div className="flex gap-1 bg-stone-100 p-1 rounded-2xl my-4 overflow-x-auto scrollbar-hide flex-shrink-0">
              {(['kpr', 'kpr_syariah', 'car', 'motorcycle', 'kta'] as SimulatorType[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all uppercase ${
                    activeTab === tab ? 'bg-white text-stone-900 shadow-sm font-black' : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  {tab === 'kpr' ? '🏠 KPR' : tab === 'kpr_syariah' ? '🌙 Syariah' : tab === 'car' ? '🚗 Car' : tab === 'motorcycle' ? '🏍️ Motor' : '💵 KTA'}
                </button>
              ))}
            </div>

            {/* Scrollable inputs & result */}
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide space-y-6 pb-6">
              
              {/* Output Card */}
              <div className="bg-stone-900 text-white rounded-[2rem] p-6 space-y-6 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
                
                <div className="space-y-4">
                  {isConventionalKpr && floatingInstallment > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-stone-300 font-bold uppercase tracking-widest block">{t('fixed_period_installment')}</span>
                        <h3 className="text-xl font-brand font-bold mt-1 text-emerald-400">{formatCurrency(monthlyInstallment, currency)}</h3>
                        <span className="text-[8px] text-stone-400 font-bold uppercase block mt-0.5">Rate: {rate}% p.a.</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-300 font-bold uppercase tracking-widest block">{t('floating_period_installment')}</span>
                        <h3 className="text-xl font-brand font-bold mt-1 text-rose-400">{formatCurrency(floatingInstallment, currency)}</h3>
                        <span className="text-[8px] text-stone-400 font-bold uppercase block mt-0.5">Est. Rate: {rate + 4.5}% p.a.</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] text-stone-300 font-bold uppercase tracking-widest block">{t('monthly_installment')}</span>
                      <h3 className="text-3xl font-brand font-bold mt-1 text-white">{formatCurrency(monthlyInstallment, currency)}</h3>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-white/5">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                      {activeTab === 'kpr' 
                        ? t('loan_mode_annuity') 
                        : activeTab === 'kpr_syariah' 
                          ? t('loan_mode_syariah') 
                          : t('loan_mode_flat')}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full uppercase tracking-wider">
                      {activeTab === 'kpr_syariah' ? (i18n.language.startsWith('id') ? 'Syariah Murabahah Tetap' : 'Murabahah Fixed') : activeTab === 'kpr' ? (i18n.language.startsWith('id') ? 'Anuitas + Mengambang' : 'Annuity + Floating') : (i18n.language.startsWith('id') ? 'Suku Bunga Flat' : 'Flat Pricing')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div>
                    <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">{t('total_repayment')}</span>
                    <p className="font-bold text-sm text-stone-200 mt-0.5">{formatCurrency(totalObligation, currency)}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">{t('total_interest_margin')}</span>
                    <p className="font-bold text-sm text-rose-400 mt-0.5">{formatCurrency(totalInterest, currency)}</p>
                  </div>
                </div>

                {/* CSS Bar Chart */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-stone-400">
                    <span>{i18n.language.startsWith('id') ? 'Pokok' : 'Principal'} ({100 - interestRatio}%)</span>
                    <span>{i18n.language.startsWith('id') ? 'Bunga' : 'Interest'} ({interestRatio}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-stone-800 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-400" style={{ width: `${100 - interestRatio}%` }} />
                    <div className="h-full bg-rose-400" style={{ width: `${interestRatio}%` }} />
                  </div>
                </div>
              </div>

              {/* Sliders Input Panel */}
              <div className="space-y-6">
                
                {/* Principal Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{t('loan_principal')}</label>
                    <span className="text-sm font-brand font-bold text-stone-800">{formatCurrency(amount, currency)}</span>
                  </div>
                  <input
                    type="range"
                    min={limits.stepAmount}
                    max={limits.maxAmount}
                    step={limits.stepAmount}
                    value={amount}
                    onChange={e => setAmount(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 h-1.5 bg-stone-100 rounded-full appearance-none cursor-pointer"
                  />
                </div>

                {/* Tenor Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{t('loan_tenor')}</label>
                    <span className="text-sm font-brand font-bold text-stone-800">{tenor} {limits.unit}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={limits.maxTenor}
                    step={1}
                    value={tenor}
                    onChange={e => setTenor(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 h-1.5 bg-stone-100 rounded-full appearance-none cursor-pointer"
                  />
                </div>

                {/* Interest Rate Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                      {activeTab === 'kpr_syariah' ? t('islamic_margin') : t('interest_rate')}
                    </label>
                    <span className="text-sm font-brand font-bold text-stone-800">{rate}% p.a.</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={25}
                    step={0.1}
                    value={rate}
                    onChange={e => setRate(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 h-1.5 bg-stone-100 rounded-full appearance-none cursor-pointer"
                  />
                </div>

              </div>

              {/* Syariah or Conventional Disclaimer Banner */}
              <div className="p-4 bg-stone-50 rounded-[1.5rem] border border-stone-100 text-[10px] text-stone-500 font-medium leading-relaxed flex gap-3">
                <HelpCircle size={20} className="text-stone-400 flex-shrink-0 mt-0.5" />
                <div>
                  {activeTab === 'kpr_syariah' ? (
                    <p>
                      {t('sim_disclaimer_islamic')}
                    </p>
                  ) : (
                    <p>
                      {t('sim_disclaimer_conventional')}
                    </p>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
