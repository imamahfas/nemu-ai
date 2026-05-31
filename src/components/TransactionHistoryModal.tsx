import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export function TransactionHistoryModal({ 
  isOpen, 
  onClose, 
  familyId, 
  currency = 'IDR',
  filterType = 'all' 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  familyId: string, 
  currency?: string,
  filterType?: 'income' | 'expense' | 'all'
}) {
  const { t, i18n } = useTranslation();
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !familyId) return;

    const q = query(
      collection(db, 'transactions'),
      where('familyId', '==', familyId),
      limit(100)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      let docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (profile?.role === 'child') {
        docs = docs.filter((tx: any) => tx.userId === user?.uid);
      }
      
      setTransactions(docs);
    }, (error) => {
      console.error("TransactionHistoryModal error loading transactions:", error);
    });

    return () => unsub();
  }, [isOpen, familyId, profile?.role, user?.uid]);

  const isId = i18n.language?.startsWith('id');
  const translateCategory = (cat: string) => {
    switch (cat) {
      case 'Food': return 'Makanan';
      case 'Transport': return 'Transportasi';
      case 'Utilities': return 'Tagihan/Utilitas';
      case 'Entertainment': return 'Hiburan';
      case 'Shopping': return 'Belanja';
      case 'Health': return 'Kesehatan';
      case 'Education': return 'Pendidikan';
      case 'Other': return 'Lainnya';
      default: return cat;
    }
  };

  // Filter transactions on client-side dynamically
  const filteredTransactions = transactions.filter(tx => {
    if (filterType === 'income') return tx.type === 'income';
    if (filterType === 'expense') return tx.type === 'expense';
    return true;
  });

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
            className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl z-10 flex flex-col h-[85vh] sm:h-[70vh]"
          >
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-stone-100 rounded-xl"><History size={20} /></div>
                <h2 className="text-xl font-brand font-bold text-stone-900">
                  {filterType === 'income' 
                    ? (isId ? 'Detail Pemasukan' : 'Income Details')
                    : filterType === 'expense'
                      ? (isId ? 'Detail Pengeluaran' : 'Expense Details')
                      : (isId ? 'Riwayat Transaksi' : 'Full History')}
                </h2>
              </div>
              <button onClick={onClose} className="p-2 bg-stone-50 rounded-full"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-10 text-stone-400 font-medium">
                  {filterType === 'income'
                    ? (isId ? 'Belum ada pemasukan.' : 'No income recorded yet.')
                    : filterType === 'expense'
                      ? (isId ? 'Belum ada pengeluaran.' : 'No expenses recorded yet.')
                      : (isId ? 'Belum ada transaksi.' : 'No transactions yet.')}
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <div 
                    key={tx.id} 
                    onClick={() => tx.items && setExpandedTxId(expandedTxId === tx.id ? null : tx.id)}
                    className={cn(
                      "bg-stone-50 p-4 rounded-2xl flex flex-col gap-3 transition-all border border-transparent",
                      tx.items ? "cursor-pointer hover:border-stone-200" : ""
                    )}
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className={cn(
                         "w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner flex-shrink-0",
                         tx.type === 'expense' ? "bg-rose-100/50" : "bg-emerald-100/50"
                      )}>
                        {tx.category === 'Food' ? '🍱' : tx.category === 'Transport' ? '⛽' : tx.category === 'Education' ? '📚' : '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-stone-800 truncate mb-0.5 text-sm">{tx.description}</p>
                        <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">
                          {isId ? translateCategory(tx.category) : tx.category} • {new Date(tx.date).toLocaleDateString()}
                          {tx.createdBy && ` • ${isId ? 'oleh' : 'by'} ${tx.createdBy}`}
                          {tx.items && ` • ${isId ? '🧾 Lihat Struk' : '🧾 View Items'}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-sm font-brand font-bold",
                          tx.type === 'expense' ? "text-stone-800" : "text-emerald-600"
                        )}>
                          {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount, currency)}
                        </p>
                      </div>
                    </div>

                    {/* Expandable Items Details */}
                    {expandedTxId === tx.id && tx.items && (
                      <div className="border-t border-dashed border-stone-200 pt-3 mt-1 space-y-2">
                        {tx.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <div className="flex-1 pr-2">
                              <p className="font-semibold text-stone-700">{item.Name}</p>
                              <p className="text-[10px] text-stone-400">
                                {item.Qty} × {formatCurrency(item.Price, currency)}
                              </p>
                            </div>
                            <div className="font-brand font-bold text-stone-600">
                              {formatCurrency(item.Qty * item.Price, currency)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
