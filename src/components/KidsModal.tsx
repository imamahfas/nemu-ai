import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Baby, Target, ListTodo } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../lib/firebase';
import { formatNumberInput } from '../lib/utils';
import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';

interface KidsModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
}

export function KidsModal({ isOpen, onClose, familyId }: KidsModalProps) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'kid' | 'task' | 'goal'>('kid');
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title && !name) return;

    try {
      if (activeTab === 'kid') {
        const kidId = `kid_${Date.now()}`;
        await setDoc(doc(db, 'kidWallets', kidId), {
          familyId,
          name,
          balance: 0,
          createdAt: serverTimestamp()
        });
      } else if (activeTab === 'task') {
        await addDoc(collection(db, 'tasks'), {
          familyId,
          title,
          rewardAmount: parseFloat(amount),
          status: 'pending',
          createdAt: serverTimestamp()
        });
      } else if (activeTab === 'goal') {
        await addDoc(collection(db, 'savingGoals'), {
          familyId,
          title,
          targetAmount: parseFloat(amount),
          createdAt: serverTimestamp()
        });
      }
      
      setName(''); setAmount(''); setTitle('');
      alert(i18n.language.startsWith('id') ? "Berhasil ditambahkan!" : "Successfully added!");
    } catch (error) {
      console.error(error);
      alert(i18n.language.startsWith('id') ? "Gagal menambahkan." : "Failed to add.");
    }
  };

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
            className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl z-10"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-brand font-bold text-stone-900">{t('manage_kids_kit')}</h2>
              <button onClick={onClose} className="p-2 bg-stone-50 rounded-full"><X size={20} /></button>
            </div>
 
            <div className="flex gap-2 mb-6">
              <button onClick={() => setActiveTab('kid')} className={`flex-1 py-2 rounded-xl text-xs font-bold ${activeTab === 'kid' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-50 text-stone-500'}`}>{t('add_kid')}</button>
              <button onClick={() => setActiveTab('task')} className={`flex-1 py-2 rounded-xl text-xs font-bold ${activeTab === 'task' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-50 text-stone-500'}`}>{t('add_task')}</button>
              <button onClick={() => setActiveTab('goal')} className={`flex-1 py-2 rounded-xl text-xs font-bold ${activeTab === 'goal' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-50 text-stone-500'}`}>{t('add_goal')}</button>
            </div>
 
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'kid' ? (
                <div>
                  <label className="text-xs font-bold text-stone-400">{t('kids_name')}</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full mt-1 bg-stone-50 p-3 rounded-xl font-bold" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-bold text-stone-400">{t('title')}</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder={activeTab === 'task' ? (i18n.language.startsWith('id') ? "Bersihkan kamar..." : "Clean room...") : (i18n.language.startsWith('id') ? "Sepeda..." : "Bicycle...")} className="w-full mt-1 bg-stone-50 p-3 rounded-xl font-bold" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-400">{activeTab === 'task' ? t('reward_amount') : t('target_amount')}</label>
                    <input type="text" value={formatNumberInput(amount)} onChange={e => setAmount(e.target.value.replace(/\D/g, ''))} required className="w-full mt-1 bg-stone-50 p-3 rounded-xl font-bold" placeholder="50.000" />
                  </div>
                </>
              )}
 
              <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold mt-4">{t('save')}</button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
