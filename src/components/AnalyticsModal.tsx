import { motion, AnimatePresence } from 'motion/react';
import { X, PieChart as PieChartIcon } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export function AnalyticsModal({ isOpen, onClose, transactions }: { isOpen: boolean, onClose: () => void, transactions: any[] }) {
  const { t } = useTranslation();

  // Calculate expenses by category
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  
  const categoryTotals = expenses.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  const data = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value: value as number,
    percentage: Math.round(((value as number) / totalExpense) * 100) || 0
  })).sort((a, b) => b.value - a.value);

  // Simplified pie chart colors
  const colors = ['bg-rose-500', 'bg-orange-400', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-stone-500'];

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
            className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl z-10 min-h-[50vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-stone-100 rounded-xl"><PieChartIcon size={20} /></div>
                <h2 className="text-xl font-brand font-bold text-stone-900">Analytics</h2>
              </div>
              <button onClick={onClose} className="p-2 bg-stone-50 rounded-full"><X size={20} /></button>
            </div>

            {data.length === 0 ? (
              <div className="text-center py-10 text-stone-400 font-medium">No expense data yet.</div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Total Expenses</p>
                  <p className="text-3xl font-brand font-bold text-stone-900 mt-1">{formatCurrency(totalExpense)}</p>
                </div>

                {/* Custom CSS Bar Chart for simplicity and elegance */}
                <div className="space-y-4">
                  {data.map((item, index) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-stone-700">{item.name}</span>
                        <span className="text-stone-400">{formatCurrency(item.value)} ({item.percentage}%)</span>
                      </div>
                      <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percentage}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className={`h-full rounded-full ${colors[index % colors.length]}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
