import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, Plus } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

export function FamilyGoalsModal({ isOpen, onClose, familyId, totalBalance, spaceType }: { isOpen: boolean, onClose: () => void, familyId: string, totalBalance: number, spaceType: string }) {
  const [goals, setGoals] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  useEffect(() => {
    if (!isOpen || !familyId) return;
    const unsub = onSnapshot(query(collection(db, 'familyGoals'), where('familyId', '==', familyId)), snapshot => {
      setGoals(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [isOpen, familyId]);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount) return;
    
    try {
      await addDoc(collection(db, 'familyGoals'), {
        familyId,
        title,
        targetAmount: parseFloat(targetAmount),
        currentAmount: 0,
        createdAt: serverTimestamp()
      });
      setTitle(''); setTargetAmount(''); setIsAdding(false);
    } catch (e) {
      console.error(e);
    }
  };

  const allocateFunds = async (goalId: string, current: number, max: number) => {
    const allocation = 100000; // Allocate 100k at a time for demo
    if (totalBalance < allocation) return alert("Not enough family balance!");
    if (current + allocation > max) return; // Full
    
    try {
      await updateDoc(doc(db, 'familyGoals', goalId), { currentAmount: current + allocation });
      await updateDoc(doc(db, 'families', familyId), { totalBalance: totalBalance - allocation });
      
      await addDoc(collection(db, 'transactions'), {
        familyId, userId: 'system', amount: allocation, type: 'expense',
        category: 'Savings', description: `Allocated to Goal`, date: new Date().toISOString(), createdAt: serverTimestamp()
      });
    } catch (e) { console.error(e); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl z-10 min-h-[50vh]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-stone-100 rounded-xl"><Target size={20} /></div>
                <h2 className="text-xl font-brand font-bold text-stone-900">{spaceType === 'married' ? 'Family Goals' : 'Couple Goals'}</h2>
              </div>
              <button onClick={onClose} className="p-2 bg-stone-50 rounded-full"><X size={20} /></button>
            </div>

            {isAdding ? (
              <form onSubmit={handleAddGoal} className="space-y-4 bg-stone-50 p-5 rounded-[2rem]">
                <div>
                  <label className="text-xs font-bold text-stone-400">Goal Name</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full mt-1 bg-white p-3 rounded-xl font-bold border border-stone-100" placeholder="e.g. Bali Holiday" />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-400">Target Amount</label>
                  <input type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} required className="w-full mt-1 bg-white p-3 rounded-xl font-bold border border-stone-100" placeholder="10000000" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsAdding(false)} className="flex-1 bg-stone-200 py-3 rounded-xl font-bold text-stone-600">Cancel</button>
                  <button type="submit" className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold">Save</button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {goals.map(goal => {
                  const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                  return (
                    <div key={goal.id} className="border border-stone-100 p-5 rounded-[2rem] space-y-3 relative overflow-hidden">
                      <div className="flex justify-between items-center relative z-10">
                        <p className="font-bold text-stone-800">{goal.title}</p>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{percentage}%</span>
                      </div>
                      <div className="w-full bg-stone-50 h-2.5 rounded-full overflow-hidden relative z-10">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                      <div className="flex justify-between items-center relative z-10">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</p>
                        <button 
                          onClick={() => allocateFunds(goal.id, goal.currentAmount, goal.targetAmount)}
                          disabled={percentage >= 100}
                          className="bg-stone-900 text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                        >
                          + 100k
                        </button>
                      </div>
                    </div>
                  )
                })}
                
                <button onClick={() => setIsAdding(true)} className="w-full border-2 border-dashed border-stone-200 text-stone-400 py-4 rounded-[2rem] font-bold flex items-center justify-center gap-2 hover:bg-stone-50 hover:border-stone-300 transition-colors">
                  <Plus size={18} /> Add New Goal
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
