import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Circle, Compass } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export function RoadmapModal({ isOpen, onClose, totalBalance, currency = 'IDR' }: { isOpen: boolean; onClose: () => void; totalBalance: number; currency?: string }) {
  const { t, i18n } = useTranslation();
  // Configurable investment target state
  const [investTarget, setInvestTarget] = useState(100000000); // 100M default

  // Let's assume a benchmark monthly expense of Rp 8.450.000 (Expenses from Quick Stats!)
  const monthlyExpenses = 8450000;
  const emergencyFundTarget = monthlyExpenses * 6; // 6 months of expenses

  // Calculations for milestones
  const emergencyProgress = Math.min(100, Math.round((totalBalance / emergencyFundTarget) * 100));
  const emergencyCompleted = totalBalance >= emergencyFundTarget;

  // Assume a couple of mock check-off states for other phases
  const [debtsCleared, setDebtsCleared] = useState(false);
  const investProgress = Math.min(100, Math.round((totalBalance / investTarget) * 100));
  const investCompleted = totalBalance >= investTarget;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl z-10 h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-stone-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 shadow-md shadow-amber-100/50">
                  <Compass size={20} className="animate-spin-slow" />
                </div>
                <div>
                  <h2 className="text-lg font-brand font-bold text-stone-900">{t('roadmap_title')}</h2>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{t('roadmap_desc')}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors"><X size={20} /></button>
            </div>

            {/* Scrollable roadmap timeline */}
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide py-6 space-y-6">
              
              {/* Emergency Fund Block (Step 1) */}
              <div className="flex gap-4 relative">
                {/* Visual Connector Line */}
                <div className="absolute top-8 left-6 bottom-0 w-0.5 bg-stone-100 -z-10" />
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm border border-stone-100 z-10">
                  {emergencyCompleted ? (
                    <CheckCircle2 size={24} className="text-emerald-500 fill-emerald-50" />
                  ) : (
                    <Circle size={24} className="text-stone-300" />
                  )}
                </div>
                 <div className="flex-grow space-y-3 pb-8">
                   <div>
                     <h3 className="font-bold text-stone-800 text-sm">{t('phase1')}</h3>
                     <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">{t('phase1_desc')}</p>
                   </div>
                   <div className="bg-stone-50 border border-stone-100 p-4 rounded-2xl space-y-3">
                     <div className="flex justify-between items-baseline text-xs font-bold">
                       <span className="text-stone-700">{i18n.language.startsWith('id') ? 'Dana Pelindung' : 'Shield Fund'}</span>
                       <span className="text-stone-400">{formatCurrency(totalBalance, currency)} / {formatCurrency(emergencyFundTarget, currency)}</span>
                     </div>
                     <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                       <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${emergencyProgress}%` }} />
                     </div>
                     <p className="text-[9px] text-stone-400 font-medium leading-relaxed">
                       {emergencyCompleted 
                         ? (i18n.language.startsWith('id') ? "🎉 Perisai darurat aktif sepenuhnya! Anda terlindungi secara struktural dari guncangan finansial utama." : "🎉 Emergency shield fully active! You are structurally protected against major shocks.") 
                         : (i18n.language.startsWith('id') ? `Kumpulkan ${formatCurrency(emergencyFundTarget - totalBalance, currency)} lagi untuk menyelesaikan langkah 1.` : `Collect ${formatCurrency(emergencyFundTarget - totalBalance, currency)} more to lock down step 1.`)}
                     </p>
                   </div>
                 </div>
              </div>

              {/* Debt Clearance Block (Step 2) */}
              <div className="flex gap-4 relative">
                <div className="absolute top-8 left-6 bottom-0 w-0.5 bg-stone-100 -z-10" />
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm border border-stone-100 z-10">
                  {debtsCleared ? (
                    <CheckCircle2 size={24} className="text-emerald-500 fill-emerald-50" />
                  ) : (
                    <Circle size={24} className="text-stone-300" />
                  )}
                </div>
                 <div className="flex-grow space-y-3 pb-8">
                   <div>
                     <h3 className="font-bold text-stone-800 text-sm">{t('phase2')}</h3>
                     <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">{t('phase2_desc')}</p>
                   </div>
                   <div className="bg-stone-50 border border-stone-100 p-4 rounded-2xl space-y-3">
                     <div className="flex justify-between items-center">
                       <div>
                         <span className="block text-xs font-bold text-stone-700">{i18n.language.startsWith('id') ? 'Target Keamanan DTI' : 'DTI Safety Goal'}</span>
                         <span className="block text-[9px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">{i18n.language.startsWith('id') ? 'Target: 0% Utang Konsumtif Aktif' : 'Target: 0% Active Consumer Debts'}</span>
                       </div>
                       <button 
                         onClick={() => setDebtsCleared(prev => !prev)}
                         className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-colors ${
                           debtsCleared ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-600'
                         }`}
                       >
                         {debtsCleared ? (i18n.language.startsWith('id') ? 'Lunas' : 'Eradicated') : (i18n.language.startsWith('id') ? 'Tandai Lunas' : 'Mark Cleared')}
                       </button>
                     </div>
                     <p className="text-[9px] text-stone-400 font-medium leading-relaxed">
                       {i18n.language.startsWith('id') ? 'Lunasi kewajiban berbunga tinggi untuk mengarahkan arus kas ke aset kekayaan yang berkembang.' : 'Zero out high-interest obligations to direct cash flow into compounding wealth assets.'}
                     </p>
                   </div>
                 </div>
              </div>

              {/* Wealth Compounding Block (Step 3) */}
              <div className="flex gap-4 relative">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm border border-stone-100 z-10">
                  {investCompleted ? (
                    <CheckCircle2 size={24} className="text-emerald-500 fill-emerald-50" />
                  ) : (
                    <Circle size={24} className="text-stone-300" />
                  )}
                </div>
                <div className="flex-grow space-y-3">
                  <div>
                    <h3 className="font-bold text-stone-800 text-sm">{t('phase3')}</h3>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">{t('phase3_desc')}</p>
                  </div>
                   <div className="bg-stone-50 border border-stone-100 p-4 rounded-2xl space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline text-xs font-bold">
                        <span className="text-stone-700">{i18n.language.startsWith('id') ? 'Target Investasi' : 'Compounding Goal'}</span>
                        <span className="text-[9px] text-stone-400">{formatCurrency(investTarget, currency)}</span>
                      </div>
                      <input 
                        type="range"
                        min={10000000}
                        max={1000000000}
                        step={10000000}
                        value={investTarget}
                        onChange={e => setInvestTarget(parseInt(e.target.value))}
                        className="w-full accent-amber-500 h-1 bg-stone-200 rounded-full cursor-pointer appearance-none"
                      />
                    </div>
                    <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${investProgress}%` }} />
                    </div>
                    <p className="text-[9px] text-stone-400 font-medium leading-relaxed">
                      {investCompleted 
                        ? (i18n.language.startsWith('id') ? "🎉 Target tercapai! Saldo bersih aktif Anda berkembang pesat." : "🎉 Milestone reached! Your active net balance is compounding rapidly.")
                        : (i18n.language.startsWith('id') ? `Tumbuh sebesar ${investProgress}% menuju target aset kustom Anda.` : `Compounding at ${investProgress}% towards your custom asset target.`)}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
