import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, TrendingDown, Store, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { addTransaction, TransactionData } from '../lib/transactionService';
import { formatNumberInput } from '../lib/utils';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  familyId: string;
  initialData?: any; // From AI Scanner
}

const CATEGORIES = [
  'Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Education', 'Other'
];

export function TransactionForm({ isOpen, onClose, userId, familyId, initialData }: TransactionFormProps) {
  const { t, i18n } = useTranslation();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill if initialData is provided
  useEffect(() => {
    if (initialData) {
      setType('expense'); // Receipts are usually expenses
      if (initialData.Total) setAmount(initialData.Total.toString());
      if (initialData['Store Name']) setDescription(initialData['Store Name']);
      
      // Use AI Category if provided, otherwise basic auto-categorization
      if (initialData.Category && CATEGORIES.includes(initialData.Category)) {
        setCategory(initialData.Category);
      } else {
        const descLower = (initialData['Store Name'] || '').toLowerCase();
        if (descLower.includes('shell') || descLower.includes('pertamina')) setCategory('Transport');
        else if (descLower.includes('indomaret') || descLower.includes('alfamart')) setCategory('Shopping');
        else setCategory('Food');
      }
    } else {
      // Reset form
      setType('expense');
      setAmount('');
      setDescription('');
      setCategory('Food');
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    setIsSubmitting(true);
    try {
      const data: TransactionData = {
        amount: parseFloat(amount),
        type,
        description,
        category,
        date: new Date().toISOString()
      };
      
      await addTransaction(userId, familyId, data);
      onClose();
    } catch (error) {
      alert(i18n.language.startsWith('id') ? "Gagal menyimpan transaksi." : "Failed to save transaction.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl z-10"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-brand font-bold text-stone-900">
                {initialData ? t('review_receipt') : t('add_transaction')}
              </h2>
              <button 
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-stone-900 bg-stone-50 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Switcher */}
              <div className="flex p-1 bg-stone-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-stone-500'
                  }`}
                >
                  <TrendingUp size={16} /> {t('expense')}
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500'
                  }`}
                >
                  <TrendingDown size={16} /> {t('income')}
                </button>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">{t('amount')}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">Rp</span>
                  <input 
                    type="text" 
                    value={formatNumberInput(amount)}
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                    placeholder="0"
                    required
                    className="w-full bg-stone-50 border border-stone-100 text-stone-900 rounded-2xl py-4 pl-12 pr-4 font-brand font-bold text-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 transition-all"
                  />
                </div>
              </div>

              {/* Description & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">{t('title')}</label>
                  <div className="relative">
                    <Store size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input 
                      type="text" 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={i18n.language.startsWith('id') ? "Belanja, Gaji..." : "Groceries, Salary..."}
                      required
                      className="w-full bg-stone-50 border border-stone-100 text-stone-900 rounded-2xl py-3 pl-11 pr-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">{t('category')}</label>
                  <div className="relative">
                    <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-100 text-stone-900 rounded-2xl py-3 pl-11 pr-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 transition-all appearance-none"
                    >
                      {CATEGORIES.map(cat => {
                        const translateCategory = (c: string) => {
                          switch (c) {
                            case 'Food': return i18n.language.startsWith('id') ? 'Makanan' : 'Food';
                            case 'Transport': return i18n.language.startsWith('id') ? 'Transportasi' : 'Transport';
                            case 'Utilities': return i18n.language.startsWith('id') ? 'Tagihan/Utilitas' : 'Utilities';
                            case 'Entertainment': return i18n.language.startsWith('id') ? 'Hiburan' : 'Entertainment';
                            case 'Shopping': return i18n.language.startsWith('id') ? 'Belanja' : 'Shopping';
                            case 'Health': return i18n.language.startsWith('id') ? 'Kesehatan' : 'Health';
                            case 'Education': return i18n.language.startsWith('id') ? 'Pendidikan' : 'Education';
                            case 'Other': return i18n.language.startsWith('id') ? 'Lainnya' : 'Other';
                            default: return c;
                          }
                        };
                        return <option key={cat} value={cat}>{translateCategory(cat)}</option>;
                      })}
                    </select>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-stone-900 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 hover:bg-stone-800 transition-all active:scale-95 shadow-lg shadow-stone-200 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>{t('save_transaction')}</>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
