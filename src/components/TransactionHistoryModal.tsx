import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, History } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

export function TransactionHistoryModal({ isOpen, onClose, familyId }: { isOpen: boolean, onClose: () => void, familyId: string }) {
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen || !familyId) return;

    const q = query(
      collection(db, 'transactions'),
      where('familyId', '==', familyId),
      orderBy('date', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [isOpen, familyId]);

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
                <h2 className="text-xl font-brand font-bold text-stone-900">Full History</h2>
              </div>
              <button onClick={onClose} className="p-2 bg-stone-50 rounded-full"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {transactions.length === 0 ? (
                <div className="text-center py-10 text-stone-400 font-medium">No transactions yet.</div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="bg-stone-50 p-4 rounded-2xl flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner",
                      tx.type === 'expense' ? "bg-rose-100/50" : "bg-emerald-100/50"
                    )}>
                      {tx.category === 'Food' ? '🍱' : tx.category === 'Transport' ? '⛽' : tx.category === 'Education' ? '📚' : '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-stone-800 truncate mb-0.5 text-sm">{tx.description}</p>
                      <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">{tx.category} • {new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-sm font-brand font-bold",
                        tx.type === 'expense' ? "text-stone-800" : "text-emerald-600"
                      )}>
                        {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                      </p>
                    </div>
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
