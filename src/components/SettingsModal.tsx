import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, Users, KeyRound, ArrowRight } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc, setDoc, collection, query, where, getDocs, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export function SettingsModal({ isOpen, onClose, family }: { isOpen: boolean, onClose: () => void, family: any }) {
  const { user, profile } = useAuth();
  const { t, i18n } = useTranslation();
  const [spaceType, setSpaceType] = useState(family?.spaceType || 'personal');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  
  // Custom Space Config States
  const [customName, setCustomName] = useState('');
  const [currency, setCurrency] = useState('IDR');
  const [limitFood, setLimitFood] = useState<number | string>('');
  const [limitTransport, setLimitTransport] = useState<number | string>('');
  const [limitShopping, setLimitShopping] = useState<number | string>('');
  const [limitSavings, setLimitSavings] = useState<number | string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (family?.spaceType) setSpaceType(family.spaceType);
    if (family) {
      setCustomName(family.name || '');
      setCurrency(family.currency || 'IDR');
      setLimitFood(family.budgetLimits?.Food ?? '');
      setLimitTransport(family.budgetLimits?.Transport ?? '');
      setLimitShopping(family.budgetLimits?.Shopping ?? '');
      setLimitSavings(family.budgetLimits?.Savings ?? '');
    }
  }, [family, isOpen]);

  const handleToggleMode = (mode: string) => {
    setSpaceType(mode);
  };

  const handleJoinSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput || !user || !profile) return;
    setIsJoining(true);

    const isId = i18n.language?.startsWith('id');

    try {
      // Find family with this invite code
      const q = query(collection(db, 'families'), where('inviteCode', '==', inviteCodeInput.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert(isId ? "Kode undangan tidak valid." : "Invalid invite code.");
        setIsJoining(false);
        return;
      }

      const newFamilyDoc = querySnapshot.docs[0];
      const newFamilyId = newFamilyDoc.id;
      const newFamilyData = newFamilyDoc.data();
      const targetSpaceType = newFamilyData.spaceType || 'unmarried';

      if (newFamilyId === profile?.familyId) {
        alert(isId ? "Anda sudah berada di dalam ruang ini." : "You are already in this space.");
        setIsJoining(false);
        return;
      }

      // Add user to new family members
      await updateDoc(doc(db, 'families', newFamilyId), {
        members: arrayUnion(user.uid)
      });

      // Update user profile to new familyId and save specific space reference
      const profileUpdates: any = { 
        familyId: newFamilyId,
        role: 'parent' 
      };

      if (targetSpaceType === 'unmarried') {
        profileUpdates.coupleSpaceId = newFamilyId;
      } else if (targetSpaceType === 'married') {
        profileUpdates.familySpaceId = newFamilyId;
      } else {
        profileUpdates.personalSpaceId = newFamilyId;
      }

      await updateDoc(doc(db, 'users', user.uid), profileUpdates);

      alert(isId ? "Berhasil bergabung ke ruang! Memuat ulang..." : "Successfully joined the space! Reloading...");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert(isId ? "Gagal bergabung ke ruang." : "Error joining space.");
    }
    setIsJoining(false);
  };

  const handleSaveSpaceConfig = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const isId = i18n.language?.startsWith('id');
    
    if (!user) {
      console.error("User is empty");
      return;
    }
    
    const activePersonalId = profile?.personalSpaceId || `personal_${user.uid}`;
    const activeCoupleId = profile?.coupleSpaceId || `couple_${user.uid}`;
    const activeFamilyId = profile?.familySpaceId || `family_${user.uid}`;

    let activeSpaceId = '';
    if (spaceType === 'personal') {
      activeSpaceId = activePersonalId;
    } else if (spaceType === 'unmarried') {
      activeSpaceId = activeCoupleId;
    } else {
      activeSpaceId = activeFamilyId;
    }

    setIsSaving(true);

    try {
      const budgetLimits: Record<string, number> = {};
      
      const f = parseFloat(limitFood as string);
      if (limitFood !== '' && !isNaN(f) && f >= 0) budgetLimits.Food = f;
      
      const tVal = parseFloat(limitTransport as string);
      if (limitTransport !== '' && !isNaN(tVal) && tVal >= 0) budgetLimits.Transport = tVal;
      
      const sh = parseFloat(limitShopping as string);
      if (limitShopping !== '' && !isNaN(sh) && sh >= 0) budgetLimits.Shopping = sh;
      
      const sa = parseFloat(limitSavings as string);
      if (limitSavings !== '' && !isNaN(sa) && sa >= 0) budgetLimits.Savings = sa;

      // Pre-generate invite code on auto-creation if not already existing
      const inviteCodePrefix = spaceType === 'personal' ? 'P-' : spaceType === 'unmarried' ? 'C-' : 'F-';
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const isTargetMatchesCurrent = family?.spaceType === spaceType;
      const targetInviteCode = isTargetMatchesCurrent 
        ? (family?.inviteCode || (inviteCodePrefix + randomCode))
        : (inviteCodePrefix + randomCode);

      const updates: any = {
        name: (customName || '').trim() || (
          spaceType === 'personal' 
            ? `${profile?.displayName || user.displayName || 'My'} Personal Space`
            : spaceType === 'unmarried'
              ? `${profile?.displayName || user.displayName || 'Our'} Couple Space`
              : `${profile?.displayName || user.displayName || 'Our'} Family Space`
        ),
        currency,
        budgetLimits,
        spaceType,
        updatedAt: new Date().toISOString()
      };

      const familyDocRef = doc(db, 'families', activeSpaceId);
      
      await setDoc(familyDocRef, {
        totalBalance: isTargetMatchesCurrent ? (family?.totalBalance || 0) : 0,
        inviteCode: targetInviteCode,
        members: arrayUnion(user.uid),
        ...updates
      }, { merge: true });

      // 2. Sync the user profile document with active familyId and healed space references
      const userUpdates: any = { 
        familyId: activeSpaceId,
        uid: user.uid,
        email: user.email || '',
        displayName: profile?.displayName || user.displayName || 'User',
        photoURL: profile?.photoURL || user.photoURL || '',
        role: profile?.role || 'parent'
      };
      if (spaceType === 'personal') userUpdates.personalSpaceId = activeSpaceId;
      else if (spaceType === 'unmarried') userUpdates.coupleSpaceId = activeSpaceId;
      else if (spaceType === 'married') userUpdates.familySpaceId = activeSpaceId;

      await setDoc(doc(db, 'users', user.uid), userUpdates, { merge: true });

      alert(isId ? "Konfigurasi ruang berhasil disimpan!" : "Space configuration saved successfully!");
      onClose();
      window.location.reload();
    } catch (err: any) {
      console.error("Failed to save space settings:", err);
      alert((isId ? "Gagal menyimpan konfigurasi: " : "Failed to save configuration: ") + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const isId = i18n.language?.startsWith('id');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl z-10 h-[85vh] sm:h-auto sm:max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-stone-100 rounded-xl"><Settings size={20} /></div>
                <h2 className="text-xl font-brand font-bold text-stone-900">{isId ? 'Pengaturan Ruang' : 'Space Settings'}</h2>
              </div>
              <button onClick={onClose} className="p-2 bg-stone-50 rounded-full"><X size={20} /></button>
            </div>

            <div className="space-y-8 flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
              
              {/* Space Mode Selector */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-stone-800 text-sm">{isId ? 'Mode Ruang' : 'Space Mode'}</h3>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">{isId ? 'Sesuaikan antarmuka dengan hubungan Anda' : 'Adapt UI to your relationship'}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    type="button"
                    onClick={() => handleToggleMode('personal')}
                    className={`p-3 rounded-[1.5rem] border-2 text-left transition-all ${spaceType === 'personal' ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-stone-100 bg-white text-stone-400 hover:border-stone-200'}`}
                  >
                    <div className="flex justify-between mb-2">
                      <span className="text-xl">🧑</span>
                      <div className={`w-3.5 h-3.5 rounded-full border-2 ${spaceType === 'personal' ? 'border-indigo-500 bg-indigo-500' : 'border-stone-300'}`} />
                    </div>
                    <p className={`font-bold text-xs ${spaceType === 'personal' ? 'text-indigo-700' : 'text-stone-700'}`}>{t('personal_space')}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-70">{isId ? 'Catatan Privat • Kelola Sendiri' : 'Private UI • Self Ledger'}</p>
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleToggleMode('unmarried')}
                    className={`p-3 rounded-[1.5rem] border-2 text-left transition-all ${spaceType === 'unmarried' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-stone-100 bg-white text-stone-400 hover:border-stone-200'}`}
                  >
                    <div className="flex justify-between mb-2">
                      <span className="text-xl">👩‍❤️‍👨</span>
                      <div className={`w-3.5 h-3.5 rounded-full border-2 ${spaceType === 'unmarried' ? 'border-emerald-500 bg-emerald-500' : 'border-stone-300'}`} />
                    </div>
                    <p className={`font-bold text-xs ${spaceType === 'unmarried' ? 'text-emerald-700' : 'text-stone-700'}`}>{t('couple_space')}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-70">{isId ? 'Akses Bersama • Target Pasangan' : 'Lite UI • Joint Goals'}</p>
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleToggleMode('married')}
                    className={`p-3 rounded-[1.5rem] border-2 text-left transition-all ${spaceType === 'married' ? 'border-orange-400 bg-orange-50 text-orange-900' : 'border-stone-100 bg-white text-stone-400 hover:border-stone-200'}`}
                  >
                    <div className="flex justify-between mb-2">
                      <span className="text-xl">👨‍👩‍👧</span>
                      <div className={`w-3.5 h-3.5 rounded-full border-2 ${spaceType === 'married' ? 'border-orange-400 bg-orange-400' : 'border-stone-300'}`} />
                    </div>
                    <p className={`font-bold text-xs ${spaceType === 'married' ? 'text-orange-700' : 'text-stone-700'}`}>{t('family_space')}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-70">{isId ? 'Akses Keluarga • Modul Anak Aktif' : 'Pro UI • Kids Kit Active'}</p>
                  </button>
                </div>
              </div>

              {/* Space Active Configuration Form */}
              <form onSubmit={e => e.preventDefault()} className="space-y-6 pt-4 border-t border-stone-100">
                <div>
                  <h3 className="font-bold text-stone-800 text-sm">{isId ? 'Konfigurasi Ruang Keuangan' : 'Financial Space Config'}</h3>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">{isId ? 'Sesuaikan nama, mata uang, dan batas anggaran' : 'Customize name, currency, and budget limits'}</p>
                </div>

                {/* Custom Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{isId ? 'Nama Kustom Ruang' : 'Custom Space Name'}</label>
                  <input 
                    type="text"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder={
                      spaceType === 'personal' 
                        ? (isId ? 'Saldo Pribadi' : 'Personal Balance') 
                        : spaceType === 'unmarried' 
                          ? (isId ? 'Saldo Bersama' : 'Joint Balance') 
                          : (isId ? 'Saldo Gabungan Keluarga' : 'Shared Family Balance')
                    }
                    className="w-full bg-stone-50 p-3 rounded-xl font-bold border border-stone-100 focus:outline-none focus:border-stone-300"
                    maxLength={30}
                  />
                </div>

                {/* Active Currency */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{isId ? 'Mata Uang Aktif' : 'Active Currency'}</label>
                  <select 
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full bg-stone-50 p-3 rounded-xl font-bold border border-stone-100 focus:outline-none focus:border-stone-300"
                  >
                    <option value="IDR">IDR (Rp)</option>
                    <option value="USD">USD ($)</option>
                    <option value="SGD">SGD (S$)</option>
                  </select>
                </div>

                {/* Category Budget Limits Accordion */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">{isId ? 'Batas Anggaran Bulanan Kategori' : 'Monthly Category Budget Limits'}</label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                        <span>🍱</span> {isId ? 'Makanan' : 'Food'}
                      </div>
                      <input 
                        type="number"
                        min="0"
                        value={limitFood}
                        onChange={e => setLimitFood(e.target.value)}
                        placeholder={isId ? 'Tanpa batas' : 'No limit'}
                        className="w-full bg-transparent font-bold text-sm text-stone-900 border-b border-transparent focus:border-stone-300 focus:outline-none p-0.5"
                      />
                    </div>

                    <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                        <span>⛽</span> {isId ? 'Transportasi' : 'Transport'}
                      </div>
                      <input 
                        type="number"
                        min="0"
                        value={limitTransport}
                        onChange={e => setLimitTransport(e.target.value)}
                        placeholder={isId ? 'Tanpa batas' : 'No limit'}
                        className="w-full bg-transparent font-bold text-sm text-stone-900 border-b border-transparent focus:border-stone-300 focus:outline-none p-0.5"
                      />
                    </div>

                    <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                        <span>📦</span> {isId ? 'Belanja' : 'Shopping'}
                      </div>
                      <input 
                        type="number"
                        min="0"
                        value={limitShopping}
                        onChange={e => setLimitShopping(e.target.value)}
                        placeholder={isId ? 'Tanpa batas' : 'No limit'}
                        className="w-full bg-transparent font-bold text-sm text-stone-900 border-b border-transparent focus:border-stone-300 focus:outline-none p-0.5"
                      />
                    </div>

                    <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                        <span>💰</span> {isId ? 'Tabungan' : 'Savings'}
                      </div>
                      <input 
                        type="number"
                        min="0"
                        value={limitSavings}
                        onChange={e => setLimitSavings(e.target.value)}
                        placeholder={isId ? 'Tanpa batas' : 'No limit'}
                        className="w-full bg-transparent font-bold text-sm text-stone-900 border-b border-transparent focus:border-stone-300 focus:outline-none p-0.5"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={handleSaveSpaceConfig}
                    disabled={isSaving}
                    type="button" 
                    className="flex-[2] h-12 bg-stone-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-stone-800 disabled:opacity-50 transition-colors active:scale-95 text-xs sm:text-sm"
                  >
                    {isSaving ? (isId ? 'Menyimpan...' : 'Saving...') : (isId ? 'Simpan' : 'Save')}
                  </button>
                  <button 
                    type="button"
                    onClick={onClose}
                    className="flex-1 h-12 bg-stone-100 text-stone-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-stone-200 transition-colors active:scale-95 text-xs sm:text-sm"
                  >
                    {isId ? 'Batal' : 'Cancel'}
                  </button>
                </div>
              </form>

              {spaceType !== 'personal' ? (
                <>
                  {/* Invite Code */}
                  <div className="space-y-4 pt-4 border-t border-stone-100">
                    <div>
                      <h3 className="font-bold text-stone-800 text-sm">{isId ? 'Undang Pasangan' : 'Invite Partner'}</h3>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">{isId ? 'Bagikan kode ini dengan pasangan Anda' : 'Share this code with your partner'}</p>
                    </div>
                    <div className="bg-stone-50 p-4 rounded-2xl flex items-center justify-between border border-stone-100">
                      <div className="flex items-center gap-3 text-stone-500">
                        <KeyRound size={18} />
                        <span className="font-mono font-bold text-lg tracking-widest text-stone-800">{family?.inviteCode || 'N/A'}</span>
                      </div>
                      <button 
                        onClick={() => { navigator.clipboard.writeText(family?.inviteCode || ''); alert(isId ? "Kode disalin!" : "Code copied!"); }}
                        className="text-[10px] bg-stone-200 text-stone-600 px-3 py-1.5 rounded-full font-bold uppercase tracking-widest hover:bg-stone-300"
                      >
                        {isId ? 'Salin' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Join Space */}
                  <div className="space-y-4 pt-4 border-t border-stone-100">
                    <div>
                      <h3 className="font-bold text-stone-800 text-sm">{isId ? 'Gabung Ruang Lain' : 'Join Existing Space'}</h3>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">{isId ? 'Pindahkan data Anda ke ruang pasangan' : "Move your data to a partner's space"}</p>
                    </div>
                    <form onSubmit={handleJoinSpace} className="flex gap-2">
                      <input 
                        type="text" 
                        value={inviteCodeInput}
                        onChange={e => setInviteCodeInput(e.target.value)}
                        placeholder={isId ? "Masukkan kode 6 digit" : "Enter 6-char code"} 
                        className="flex-1 bg-stone-50 p-3 rounded-xl font-mono font-bold border border-stone-100 uppercase" 
                        maxLength={6}
                        required
                      />
                      <button 
                        disabled={isJoining}
                        type="submit" 
                        className="bg-stone-900 text-white px-5 rounded-xl font-bold flex items-center gap-2 hover:bg-stone-800 disabled:opacity-50"
                      >
                        {isId ? 'Gabung' : 'Join'} <ArrowRight size={16} />
                      </button>
                    </form>
                    <p className="text-[10px] text-rose-500 font-bold leading-tight">
                      {isId 
                        ? 'Peringatan: Bergabung dengan ruang lain akan mengabaikan data ruang saat ini (saldo & transaksi).' 
                        : "Warning: Joining another space will abandon your current space's data (balance & transactions)."}
                    </p>
                  </div>
                </>
              ) : (
                <div className="pt-4 border-t border-stone-100 text-center p-5 bg-indigo-50/50 border border-indigo-100 rounded-[1.5rem] space-y-2">
                  <span className="text-xl">✨</span>
                  <p className="text-xs text-indigo-950 font-bold leading-relaxed">
                    {isId ? 'Ini adalah ruang catatan pribadi Anda.' : 'This is your private sandbox.'}
                  </p>
                  <p className="text-[10px] text-indigo-700/80 font-medium leading-relaxed max-w-[280px] mx-auto">
                    {isId 
                      ? 'Untuk mengundang pasangan atau bergabung dengan catatan bersama, ubah ke Mode Pasangan atau Mode Keluarga di atas.' 
                      : 'To invite a partner or join another shared ledger, switch to Couple Space or Family Space above.'}
                  </p>
                </div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
