import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Shield, Activity, TrendingDown, ArrowRight, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../lib/utils';

interface HealthDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab: 'health' | 'dti';
  healthScore: number;
  dtiRatio: number;
  totalMonthlyObligation: number;
  monthlyIncome?: number;
  onOpenDebtTracker: () => void;
  onOpenAiAdvisor: () => void;
}

export function HealthDetailModal({
  isOpen,
  onClose,
  initialTab,
  healthScore,
  dtiRatio,
  totalMonthlyObligation,
  monthlyIncome = 12500000,
  onOpenDebtTracker,
  onOpenAiAdvisor
}: HealthDetailModalProps) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'health' | 'dti'>(initialTab);

  // Sync state with prop updates when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const isId = i18n.language?.startsWith('id');

  // DTI status mapping
  let dtiStatus = isId ? 'Batas Aman' : 'Healthy Limit';
  let dtiColor = 'text-emerald-500 bg-emerald-50';
  let dtiDesc = isId 
    ? 'Kondisi keuangan yang sangat baik. Anda memiliki banyak sisa pendapatan untuk ditabung dan diinvestasikan.'
    : 'Excellent financial standing. You have plenty of disposable income left to save and invest.';
  if (dtiRatio >= 30 && dtiRatio <= 50) {
    dtiStatus = isId ? 'Zona Siaga' : 'Warning Zone';
    dtiColor = 'text-orange-500 bg-orange-50';
    dtiDesc = isId
      ? 'Beban utang tinggi. Kami sangat menyarankan untuk mengurangi pengeluaran non-esensial dan fokus melunasi utang berbunga tinggi.'
      : 'High debt load. We strongly recommend reducing non-essential expenditures and focusing on paying off high-interest debts.';
  } else if (dtiRatio > 50) {
    dtiStatus = isId ? 'Zona Bahaya' : 'Danger Zone';
    dtiColor = 'text-rose-500 bg-rose-50';
    dtiDesc = isId
      ? 'Tingkat utang kritis. Segera tinjau kembali anggaran Anda dan konsultasikan dengan Asisten Finansial AI kami untuk rencana konsolidasi utang terstruktur.'
      : 'Critical debt levels. Immediately review your budget and consult our AI Advisor for a structural debt consolidation plan.';
  }

  // Health status mapping
  let healthStatus = isId ? 'Sempurna' : 'Excellent';
  let healthColor = 'text-emerald-500 bg-emerald-50';
  if (healthScore >= 60 && healthScore < 85) {
    healthStatus = isId ? 'Baik' : 'Good';
    healthColor = 'text-indigo-500 bg-indigo-50';
  } else if (healthScore < 60) {
    healthStatus = isId ? 'Butuh Perhatian' : 'Needs Attention';
    healthColor = 'text-rose-500 bg-rose-50';
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl z-10 h-[85vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-stone-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-500 shadow-md shadow-amber-100/50">
                  <Activity size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-brand font-bold text-stone-900">
                    {activeTab === 'health' 
                      ? (i18n.language === 'id' ? 'Detail Kesehatan Finansial' : 'Financial Health Details') 
                      : (i18n.language === 'id' ? 'Detail Rasio Utang (DTI)' : 'Debt-to-Income Details')}
                  </h2>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Nemu Health Center</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors"><X size={20} /></button>
            </div>

            {/* Tab selector */}
            <div className="flex gap-1 bg-stone-100 p-1 rounded-2xl my-4 flex-shrink-0">
              <button
                onClick={() => setActiveTab('health')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'health' ? 'bg-white text-stone-900 shadow-sm font-black' : 'text-stone-400'
                }`}
              >
                ❤️ {i18n.language === 'id' ? 'Skor Kesehatan' : 'Health Score'}
              </button>
              <button
                onClick={() => setActiveTab('dti')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'dti' ? 'bg-white text-stone-900 shadow-sm font-black' : 'text-stone-400'
                }`}
              >
                📊 {i18n.language === 'id' ? 'Rasio DTI' : 'DTI Ratio'}
              </button>
            </div>

            {/* Scrollable breakdown */}
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide py-2 space-y-6 pb-6">
              
              {activeTab === 'health' ? (
                // HEALTH TAB CONTENT
                <div className="space-y-6">
                  {/* Gauge Display */}
                  <div className="bg-stone-50 border border-stone-100 p-6 rounded-[2.5rem] text-center space-y-4">
                    <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                      {/* CSS Circular Progress Ring */}
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="48" stroke="#f5f5f4" strokeWidth="8" fill="transparent" />
                        <circle cx="56" cy="56" r="48" stroke="#10b981" strokeWidth="8" fill="transparent"
                          strokeDasharray={2 * Math.PI * 48}
                          strokeDashoffset={2 * Math.PI * 48 * (1 - healthScore / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-brand font-black text-stone-850">{healthScore}</span>
                        <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">/ 100</span>
                      </div>
                    </div>
                    <div>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest inline-block ${healthColor}`}>
                        {healthStatus}
                      </span>
                      <p className="text-xs text-stone-500 font-medium leading-relaxed max-w-[280px] mx-auto mt-2">
                        {i18n.language === 'id'
                          ? 'Kesehatan finansial Anda berada dalam kondisi luar biasa! Tetap kelola anggaran untuk mempertahankan stabilitas.'
                          : 'Your overall financial health is extremely robust! Keep maintaining positive savings habits.'}
                      </p>
                    </div>
                  </div>

                  {/* Breakdown indicators */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">
                      {i18n.language === 'id' ? 'Rincian Skor Kesehatan' : 'Health Score Breakdown'}
                    </h3>
                    
                    <div className="space-y-3">
                      {/* DTI contribution */}
                      <div className="bg-white border border-stone-100 p-4 rounded-2xl flex justify-between items-center">
                        <div className="flex gap-3 items-center">
                          <CheckCircle2 className="text-emerald-500" size={18} />
                          <div>
                            <p className="text-xs font-bold text-stone-800">{i18n.language === 'id' ? 'Rasio Utang (DTI < 30%)' : 'Debt-to-Income Ratio'}</p>
                            <p className="text-[9px] text-stone-400 font-bold uppercase">Weight: 30 pts</p>
                          </div>
                        </div>
                        <span className="text-xs font-brand font-bold text-stone-800">30 / 30</span>
                      </div>

                      {/* Emergency Shield Contribution */}
                      <div className="bg-white border border-stone-100 p-4 rounded-2xl flex justify-between items-center">
                        <div className="flex gap-3 items-center">
                          <CheckCircle2 className="text-emerald-500" size={18} />
                          <div>
                            <p className="text-xs font-bold text-stone-800">{i18n.language === 'id' ? 'Proteksi Dana Darurat' : 'Emergency Shield Buffer'}</p>
                            <p className="text-[9px] text-stone-400 font-bold uppercase">Weight: 30 pts</p>
                          </div>
                        </div>
                        <span className="text-xs font-brand font-bold text-stone-800">30 / 30</span>
                      </div>

                      {/* Savings Habit Contribution */}
                      <div className="bg-white border border-stone-100 p-4 rounded-2xl flex justify-between items-center">
                        <div className="flex gap-3 items-center">
                          <AlertTriangle className="text-amber-500" size={18} />
                          <div>
                            <p className="text-xs font-bold text-stone-800">{i18n.language === 'id' ? 'Investasi & Investasi Rutin' : 'Investment & Wealth Habits'}</p>
                            <p className="text-[9px] text-stone-400 font-bold uppercase">Weight: 20 pts</p>
                          </div>
                        </div>
                        <span className="text-xs font-brand font-bold text-amber-600">8 / 20</span>
                      </div>

                      {/* Budget consistency */}
                      <div className="bg-white border border-stone-100 p-4 rounded-2xl flex justify-between items-center">
                        <div className="flex gap-3 items-center">
                          <CheckCircle2 className="text-emerald-500" size={18} />
                          <div>
                            <p className="text-xs font-bold text-stone-800">{i18n.language === 'id' ? 'Konsistensi Alokasi Anggaran' : 'Budget Consistency'}</p>
                            <p className="text-[9px] text-stone-400 font-bold uppercase">Weight: 20 pts</p>
                          </div>
                        </div>
                        <span className="text-xs font-brand font-bold text-stone-800">20 / 20</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation action */}
                  <button 
                    onClick={onOpenAiAdvisor}
                    className="w-full bg-stone-900 hover:bg-stone-800 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
                  >
                    <Sparkles size={14} className="fill-amber-400 text-amber-400" />
                    {i18n.language === 'id' ? 'Konsultasikan Saran Peningkatan AI' : 'Boost Your Score with AI Advisor'}
                  </button>
                </div>
              ) : (
                // DTI TAB CONTENT
                <div className="space-y-6">
                  {/* Gauge Display */}
                  <div className="bg-stone-50 border border-stone-100 p-6 rounded-[2.5rem] space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest block">{i18n.language === 'id' ? 'Rasio DTI Anda' : 'Your Current DTI'}</span>
                        <h3 className="text-3xl font-brand font-bold mt-1 text-stone-900">{dtiRatio}%</h3>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${dtiColor}`}>
                        {dtiStatus}
                      </span>
                    </div>

                    {/* Zone Bar */}
                    <div className="space-y-2">
                      <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden flex relative">
                        {/* Green <30% zone */}
                        <div className="h-full bg-emerald-500" style={{ width: '30%' }} />
                        {/* Orange 30-50% zone */}
                        <div className="h-full bg-orange-400" style={{ width: '20%' }} />
                        {/* Red >50% zone */}
                        <div className="h-full bg-rose-500" style={{ width: '50%' }} />
                        
                        {/* Pin marker for current ratio */}
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-stone-900 border-2 border-white shadow-lg transition-all duration-500"
                          style={{ left: `calc(${Math.min(100, dtiRatio)}% - 8px)` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-bold text-stone-400 uppercase tracking-wider">
                        <span>0%</span>
                        <span>30% (Max Safe)</span>
                        <span>50% (High Risk)</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-500 font-medium leading-relaxed">
                      {dtiDesc}
                    </p>
                  </div>

                  {/* Calculations Details */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">
                      {i18n.language === 'id' ? 'Detail Formula Penghitungan' : 'DTI Calculation Details'}
                    </h3>
                    
                    <div className="bg-white border border-stone-100 p-5 rounded-[2rem] space-y-4 shadow-inner">
                      <div className="flex justify-between text-xs font-bold text-stone-700">
                        <span>{i18n.language === 'id' ? 'Total Cicilan Bulanan' : 'Total Monthly Debts'}</span>
                        <span className="text-rose-500">{formatCurrency(totalMonthlyObligation)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-stone-700 border-b border-stone-100 pb-3">
                        <span>{i18n.language === 'id' ? 'Standar Pendapatan Bulanan' : 'Monthly Income Benchmark'}</span>
                        <span className="text-emerald-600">{formatCurrency(monthlyIncome)}</span>
                      </div>
                      <div className="pt-1">
                        <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mb-1">Mathematical Formula</p>
                        <p className="font-brand font-bold text-stone-800 text-sm leading-relaxed">
                          ({formatCurrency(totalMonthlyObligation)} / {formatCurrency(monthlyIncome)}) &times; 100% = {dtiRatio}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action link */}
                  <button 
                    onClick={onOpenDebtTracker}
                    className="w-full bg-stone-900 hover:bg-stone-800 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg"
                  >
                    {i18n.language === 'id' ? 'Kelola Obligasi di Pelacak Utang' : 'Manage Obligations in Debt Tracker'}
                    <ArrowRight size={14} />
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
