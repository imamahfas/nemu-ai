import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PieChart as PieChartIcon, TrendingUp, TrendingDown, Landmark, Sparkles, Activity, ShieldAlert } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export function AnalyticsModal({ 
  isOpen, 
  onClose, 
  transactions, 
  currency = 'IDR' 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  transactions: any[], 
  currency?: string 
}) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'expense' | 'income' | 'summary'>('summary');

  const isId = i18n.language?.startsWith('id');

  // Filter transactions
  const expenses = transactions.filter(t => t.type === 'expense');
  const incomes = transactions.filter(t => t.type === 'income');

  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);

  // Group by category
  const expenseCategoryTotals = expenses.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  const incomeCategoryTotals = incomes.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  const expenseData = Object.entries(expenseCategoryTotals).map(([name, value]) => ({
    name,
    value: value as number,
    percentage: Math.round(((value as number) / totalExpense) * 100) || 0
  })).sort((a, b) => b.value - a.value);

  const incomeData = Object.entries(incomeCategoryTotals).map(([name, value]) => ({
    name,
    value: value as number,
    percentage: Math.round(((value as number) / totalIncome) * 100) || 0
  })).sort((a, b) => b.value - a.value);

  // Math metrics
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Category translation and emojis
  const translateCategory = (cat: string) => {
    switch (cat) {
      // Expenses
      case 'Food': return isId ? 'Makanan' : 'Food';
      case 'Transport': return isId ? 'Transportasi' : 'Transport';
      case 'Utilities': return isId ? 'Tagihan/Utilitas' : 'Utilities';
      case 'Entertainment': return isId ? 'Hiburan' : 'Entertainment';
      case 'Shopping': return isId ? 'Belanja' : 'Shopping';
      case 'Health': return isId ? 'Kesehatan' : 'Health';
      case 'Education': return isId ? 'Pendidikan' : 'Education';
      // Income
      case 'Salary': return isId ? 'Gaji Utama' : 'Primary Salary';
      case 'Freelance': return isId ? 'Kerja Sampingan' : 'Side Hustle';
      case 'Investment': return isId ? 'Investasi' : 'Investment';
      case 'Bonus': return isId ? 'Bonus/THR' : 'Bonus';
      case 'Savings': return isId ? 'Tabungan' : 'Savings';
      case 'Other': return isId ? 'Lainnya' : 'Other';
      default: return cat;
    }
  };

  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'Food': return '🍱';
      case 'Transport': return '⛽';
      case 'Utilities': return '🔌';
      case 'Entertainment': return '🎬';
      case 'Shopping': return '🛍️';
      case 'Health': return '🏥';
      case 'Education': return '📚';
      case 'Salary': return '💼';
      case 'Freelance': return '💻';
      case 'Investment': return '📈';
      case 'Bonus': return '🎁';
      case 'Savings': return '💰';
      default: return '📦';
    }
  };

  // Simplified pie chart colors
  const expenseColors = ['bg-rose-500', 'bg-orange-400', 'bg-amber-500', 'bg-red-400', 'bg-purple-500', 'bg-pink-400', 'bg-stone-500'];
  const incomeColors = ['bg-emerald-500', 'bg-teal-400', 'bg-blue-500', 'bg-indigo-500', 'bg-lime-400', 'bg-cyan-500', 'bg-stone-500'];

  // AI Rule-based Insight Engine
  const getInsight = () => {
    if (totalIncome === 0 && totalExpense === 0) {
      return isId 
        ? 'Belum ada data transaksi yang tercatat. Silakan tambah transaksi atau scan struk untuk mengaktifkan modul analisis.'
        : 'No transaction data available yet. Please add a transaction or scan a receipt to unlock analytics.';
    }

    if (totalIncome === 0 && totalExpense > 0) {
      return isId
        ? '⚠️ Peringatan: Anda mencatat pengeluaran tanpa mencatat pemasukan. Masukkan pemasukan Anda untuk mengetahui rasio menabung yang akurat.'
        : '⚠️ Alert: You have recorded expenses without any income details. Add your income source to check your savings rate.';
    }

    if (savingsRate < 0) {
      return isId
        ? '🚨 Bahaya: Pengeluaran Anda melebihi pemasukan bulan ini! Anda menggunakan tabungan cadangan atau utang. Kurangi segera pengeluaran non-primer seperti hiburan atau belanja.'
        : '🚨 Danger: Your expenses exceed your income this month! You are drawing down reserves or taking on debt. Immediately cut back on non-essential categories.';
    }

    if (savingsRate < 10) {
      return isId
        ? '⚠️ Perhatian: Rasio menabung Anda sangat rendah (di bawah 10%). Anda rentan jika terjadi keadaan darurat finansial. Cobalah menabung minimal 10-20% di awal bulan.'
        : '⚠️ Caution: Your savings rate is very low (under 10%). You are vulnerable to financial emergencies. Try setting aside 10-20% at the start of the month.';
    }

    // Category specific insights
    const foodPercent = expenseCategoryTotals['Food'] ? Math.round((expenseCategoryTotals['Food'] / totalExpense) * 100) : 0;
    if (foodPercent > 35) {
      return isId
        ? `🍔 Tips Diet Kantong: Pengeluaran Makanan Anda menyerap ${foodPercent}% dari total belanja. Kurangi frekuensi makan di luar atau pesan antar dengan memasak di rumah.`
        : `🍔 Smart Budgeting: Food consumption accounts for ${foodPercent}% of your spending. Try meal-prepping or dining out less frequently to balance this out.`;
    }

    const shoppingPercent = expenseCategoryTotals['Shopping'] ? Math.round((expenseCategoryTotals['Shopping'] / totalExpense) * 100) : 0;
    if (shoppingPercent > 25) {
      return isId
        ? `🛍️ Rem Belanja: Pengeluaran Belanja Anda mencapai ${shoppingPercent}%. Terapkan aturan "Tunggu 48 Jam" sebelum melakukan pembelian impulsif.`
        : `🛍️ Shopping Pause: Discretionary shopping is at ${shoppingPercent}%. Consider practicing the "48-Hour Rule" before making impulse purchases.`;
    }

    if (savingsRate >= 30) {
      return isId
        ? '✨ Sempurna! Rasio menabung Anda berada di zona luar biasa (>30%). Anda berada di jalur cepat menuju kebebasan finansial. Alokasikan dana lebih ke investasi produktif.'
        : '✨ Prime Zone! Your savings rate is phenomenal (>30%). You are on a fast track to financial freedom. Direct these surplus funds into wealth-building investments.';
    }

    return isId
      ? '👍 Finansial Sehat: Rasio menabung Anda aman (10-30%). Anda mengelola arus kas dengan bijak. Teruskan konsistensi mencatat keuangan ini!'
      : '👍 Healthy Cashflow: Your savings rate is in the safe zone (10-30%). You manage your money wisely. Keep maintaining this tracking consistency!';
  };

  const getSavingsRateRating = () => {
    if (savingsRate < 0) return { label: isId ? 'Bahaya' : 'Deficit', color: 'text-rose-500 bg-rose-50 border-rose-100' };
    if (savingsRate < 10) return { label: isId ? 'Perlu Perbaikan' : 'Weak', color: 'text-amber-600 bg-amber-50 border-amber-100' };
    if (savingsRate < 30) return { label: isId ? 'Sehat' : 'Healthy', color: 'text-blue-600 bg-blue-50 border-blue-100' };
    return { label: isId ? 'Sempurna' : 'Excellent', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
  };

  const rating = getSavingsRateRating();

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
          
          {/* Modal Container */}
          <motion.div 
            initial={{ y: '100%' }} 
            animate={{ y: 0 }} 
            exit={{ y: '100%' }}
            className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl z-10 flex flex-col h-[90vh] sm:h-[82vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-orange-50 rounded-2xl text-orange-400 shadow-sm shadow-orange-50">
                  <PieChartIcon size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-brand font-bold text-stone-900 leading-tight">
                    {isId ? 'Analisis Arus Kas' : 'Financial Analytics'}
                  </h2>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">
                    {isId ? 'Ringkasan & Kategori' : 'Summary & Segments'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2.5 bg-stone-50 text-stone-500 hover:text-stone-900 rounded-full hover:bg-stone-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Premium Interactive Tabs */}
            <div className="bg-stone-100/70 p-1.5 rounded-2xl flex items-center justify-between mb-5 flex-shrink-0">
              <button 
                onClick={() => setActiveTab('summary')}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  activeTab === 'summary' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-900"
                )}
              >
                <Activity size={14} />
                {isId ? 'Ikhtisar' : 'Summary'}
              </button>
              <button 
                onClick={() => setActiveTab('expense')}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  activeTab === 'expense' ? "bg-white text-rose-500 shadow-sm" : "text-stone-500 hover:text-stone-900"
                )}
              >
                <TrendingUp size={14} className="text-rose-500" />
                {isId ? 'Pengeluaran' : 'Expenses'}
              </button>
              <button 
                onClick={() => setActiveTab('income')}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  activeTab === 'income' ? "bg-white text-emerald-600 shadow-sm" : "text-stone-500 hover:text-stone-900"
                )}
              >
                <TrendingDown size={14} className="text-emerald-600" />
                {isId ? 'Pemasukan' : 'Income'}
              </button>
            </div>

            {/* Scrollable Content Workspace */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-6 custom-scrollbar pb-6">
              
              {/* Tab 1: CASHFLOW SUMMARY */}
              {activeTab === 'summary' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Summary Dual Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50/40 p-4 rounded-3xl border border-emerald-100/50 flex flex-col justify-between h-28">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{isId ? 'Total Masuk' : 'Total In'}</span>
                        <div className="p-1.5 bg-emerald-50 rounded-xl text-emerald-600"><TrendingDown size={14} /></div>
                      </div>
                      <div>
                        <h4 className="text-lg font-brand font-bold text-stone-800">{formatCurrency(totalIncome, currency)}</h4>
                        <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">+{incomes.length} {isId ? 'transaksi' : 'tx'}</p>
                      </div>
                    </div>

                    <div className="bg-rose-50/40 p-4 rounded-3xl border border-rose-100/50 flex flex-col justify-between h-28">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{isId ? 'Total Keluar' : 'Total Out'}</span>
                        <div className="p-1.5 bg-rose-50 rounded-xl text-rose-500"><TrendingUp size={14} /></div>
                      </div>
                      <div>
                        <h4 className="text-lg font-brand font-bold text-stone-800">{formatCurrency(totalExpense, currency)}</h4>
                        <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest mt-0.5">-{expenses.length} {isId ? 'transaksi' : 'tx'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Savings Circle & Rate Card */}
                  <div className="bg-stone-50/80 p-5 rounded-[2rem] border border-stone-100 flex items-center justify-between shadow-inner">
                    <div className="space-y-2">
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{isId ? 'Rasio Menabung' : 'Savings Rate'}</p>
                      <div>
                        <h3 className="text-3xl font-brand font-bold text-stone-800">{savingsRate}%</h3>
                        <p className="text-[10px] text-stone-400 font-medium mt-0.5">
                          {isId ? `Tersisa ${formatCurrency(netSavings, currency)}` : `${formatCurrency(netSavings, currency)} remaining`}
                        </p>
                      </div>
                      <div className={cn("text-[9px] font-bold px-2.5 py-0.5 border rounded-full uppercase tracking-wider w-max", rating.color)}>
                        {rating.label}
                      </div>
                    </div>

                    {/* Progress Circle Visualizer */}
                    <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background track */}
                        <circle 
                          cx="50" cy="50" r="40" 
                          stroke="#e5e5e0" strokeWidth="10" 
                          fill="transparent" 
                        />
                        {/* Foreground active ring */}
                        <motion.circle 
                          cx="50" cy="50" r="40" 
                          stroke={savingsRate >= 30 ? "#10b981" : savingsRate >= 10 ? "#3b82f6" : savingsRate >= 0 ? "#f59e0b" : "#f43f5e"}
                          strokeWidth="10" 
                          fill="transparent"
                          strokeDasharray="251.2"
                          initial={{ strokeDashoffset: 251.2 }}
                          animate={{ strokeDashoffset: 251.2 - (251.2 * Math.max(0, Math.min(100, savingsRate))) / 100 }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-700">
                        <span className="font-brand font-bold text-lg">{Math.max(0, savingsRate)}%</span>
                        <span className="text-[8px] text-stone-400 font-bold uppercase tracking-wider">{isId ? 'Hemat' : 'Saved'}</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Rule-based Advisor Panel */}
                  <div className="bg-orange-50/30 rounded-[2rem] border border-orange-100 p-6 relative overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-orange-100/20 rounded-full blur-xl" />
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="p-2 bg-orange-50 rounded-xl text-orange-400"><Sparkles size={16} className="fill-orange-400" /></div>
                      <h4 className="font-brand font-bold text-xs text-stone-800">{isId ? 'Penasihat Arus Kas AI' : 'AI Cashflow Insights'}</h4>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed font-medium italic">
                      "{getInsight()}"
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Tab 2: EXPENSES GRAPH */}
              {activeTab === 'expense' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center py-2 bg-stone-50 rounded-2xl">
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{isId ? 'Total Pengeluaran Bulan Ini' : 'Total Monthly Expenses'}</p>
                    <p className="text-2xl font-brand font-bold text-rose-500 mt-0.5">{formatCurrency(totalExpense, currency)}</p>
                  </div>

                  {expenseData.length === 0 ? (
                    <div className="text-center py-16 bg-stone-50 rounded-[2rem] border border-dashed border-stone-200">
                      <ShieldAlert size={36} className="mx-auto text-stone-200 mb-3" />
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isId ? 'Tidak ada data pengeluaran' : 'No expense data logged'}</p>
                      <p className="text-[10px] text-stone-400 mt-1 max-w-[200px] mx-auto leading-relaxed">{isId ? 'Tambahkan pengeluaran atau scan struk belanja Anda.' : 'Please add a transaction or scan a shopping receipt.'}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {expenseData.map((item, index) => (
                        <div key={item.name} className="bg-stone-50 p-4 rounded-2xl space-y-2 hover:shadow-sm transition-all">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-lg leading-none">{getCategoryEmoji(item.name)}</span>
                              <span className="font-bold text-stone-700">{translateCategory(item.name)}</span>
                            </div>
                            <span className="font-brand font-bold text-stone-800">
                              {formatCurrency(item.value, currency)} <span className="text-stone-400 font-medium text-[10px]">({item.percentage}%)</span>
                            </span>
                          </div>
                          
                          {/* Visual progress bar */}
                          <div className="w-full bg-stone-200/50 h-2.5 rounded-full overflow-hidden p-0.5">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${item.percentage}%` }}
                              transition={{ duration: 1, delay: index * 0.08 }}
                              className={cn("h-full rounded-full", expenseColors[index % expenseColors.length])}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Tab 3: INCOME GRAPH */}
              {activeTab === 'income' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center py-2 bg-stone-50 rounded-2xl">
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{isId ? 'Total Pemasukan Bulan Ini' : 'Total Monthly Income'}</p>
                    <p className="text-2xl font-brand font-bold text-emerald-600 mt-0.5">{formatCurrency(totalIncome, currency)}</p>
                  </div>

                  {incomeData.length === 0 ? (
                    <div className="text-center py-16 bg-stone-50 rounded-[2rem] border border-dashed border-stone-200">
                      <Landmark size={36} className="mx-auto text-stone-200 mb-3" />
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isId ? 'Tidak ada data pemasukan' : 'No income data logged'}</p>
                      <p className="text-[10px] text-stone-400 mt-1 max-w-[200px] mx-auto leading-relaxed">{isId ? 'Masukan transaksi berjenis pemasukan.' : 'Please add a transaction classified as income.'}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {incomeData.map((item, index) => (
                        <div key={item.name} className="bg-stone-50 p-4 rounded-2xl space-y-2 hover:shadow-sm transition-all">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-lg leading-none">{getCategoryEmoji(item.name)}</span>
                              <span className="font-bold text-stone-700">{translateCategory(item.name)}</span>
                            </div>
                            <span className="font-brand font-bold text-stone-800">
                              {formatCurrency(item.value, currency)} <span className="text-stone-400 font-medium text-[10px]">({item.percentage}%)</span>
                            </span>
                          </div>
                          
                          {/* Visual progress bar */}
                          <div className="w-full bg-stone-200/50 h-2.5 rounded-full overflow-hidden p-0.5">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${item.percentage}%` }}
                              transition={{ duration: 1, delay: index * 0.08 }}
                              className={cn("h-full rounded-full", incomeColors[index % incomeColors.length])}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
