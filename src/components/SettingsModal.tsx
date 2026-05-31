import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Users, KeyRound, ArrowRight, Share2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc, setDoc, collection, query, where, getDocs, getDoc, arrayUnion } from 'firebase/firestore';
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
  
  // Members & Roles management states
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

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

  useEffect(() => {
    if (!isOpen || !family?.id) return;
    
    const fetchMembers = async () => {
      setIsLoadingMembers(true);
      try {
        // Use family.members array as source of truth (most reliable)
        // Avoids race conditions where a newly joined member's familyId might not yet match
        const memberUids: string[] = family.members || [];
        
        if (memberUids.length === 0) {
          setFamilyMembers([]);
          return;
        }

        // Fetch each member's user doc individually by UID
        const memberPromises = memberUids.map((uid: string) =>
          getDoc(doc(db, 'users', uid))
        );
        const memberDocs = await Promise.all(memberPromises);
        const membersList = memberDocs
          .filter(d => d.exists())
          .map(d => ({ uid: d.id, ...d.data() }));
        
        console.log('[fetchMembers] loaded', membersList.map(m => ({ uid: m.uid, role: m.role, familyId: m.familyId })));
        setFamilyMembers(membersList);
      } catch (err) {
        console.error("Failed to fetch family members:", err);
        // Fallback: query by familyId
        try {
          const q = query(collection(db, 'users'), where('familyId', '==', family.id));
          const snap = await getDocs(q);
          const membersList = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
          setFamilyMembers(membersList);
        } catch (fallbackErr) {
          console.error("Fallback fetch also failed:", fallbackErr);
        }
      } finally {
        setIsLoadingMembers(false);
      }
    };
    
    fetchMembers();
  }, [isOpen, family?.id, family?.members]);


  const handleUpdateRole = async (targetUid: string, newRole: 'parent' | 'child') => {
    const isId = i18n.language?.startsWith('id');
    if ((profile?.role || 'parent') !== 'parent') {
      alert(isId ? "Hanya Orang Tua yang dapat mengubah peran!" : "Only Parents can change roles!");
      return;
    }
    
    // Find target member currently
    const targetMember = familyMembers.find(m => m.uid === targetUid);
    if (!targetMember) return;
    const currentRole = targetMember.role || 'parent';
    if (currentRole === newRole) return; // No change
    
    if (newRole === 'parent') {
      // Calculate parents count (excluding the target member in case they are child currently)
      const parentCount = familyMembers.filter(m => m.uid !== targetUid && (m.role === 'parent' || !m.role)).length;
      // Since the logged-in user is a parent, parentCount includes at least 1.
      // Maximum parents is 2 (the user themselves + 1 spouse/parent)
      if (parentCount >= 2) {
        alert(isId 
          ? "Maksimal Orang Tua (Parent) di ruang ini adalah 2 orang (Anda dan Pasangan/Istri)!" 
          : "Maximum Parents in this space is 2 (You and your spouse)!");
        return;
      }
    } else if (newRole === 'child') {
      // Calculate children count (excluding the target member in case they are parent currently)
      const childCount = familyMembers.filter(m => m.uid !== targetUid && m.role === 'child').length;
      if (childCount >= 3) {
        alert(isId 
          ? "Maksimal Anak (Child) di ruang ini adalah 3 anak!" 
          : "Maximum Children in this space is 3!");
        return;
      }
    }
    
    try {
      console.log('[handleUpdateRole] attempting update', { targetUid, newRole, callerUid: user?.uid, callerRole: profile?.role });
      await updateDoc(doc(db, 'users', targetUid), {
        role: newRole
      });
      setFamilyMembers(prev => prev.map(m => m.uid === targetUid ? { ...m, role: newRole } : m));
      alert(isId ? "Peran berhasil diperbarui!" : "Role updated successfully!");
    } catch (err: any) {
      console.error('[handleUpdateRole] FAILED', { targetUid, newRole, err });
      alert((isId ? "Gagal memperbarui peran: " : "Failed to update role: ") + (err?.message || err));
    }
  };

  const handleToggleMode = (mode: string) => {
    setSpaceType(mode);
  };

  const handleShareInviteLink = async () => {
    const isId = i18n.language?.startsWith('id');
    const inviteLink = `${window.location.origin}/?invite=${family?.inviteCode}`;
    const shareData = {
      title: isId ? 'Undangan Ruang Keuangan Nemu' : 'Nemu Financial Space Invitation',
      text: isId 
        ? `Mari kelola keuangan bersama di ruang ${family?.name || 'keuangan'} menggunakan aplikasi Nemu! Klik link ini untuk bergabung:` 
        : `Let's manage our finances together in ${family?.name || 'our space'} using Nemu app! Click this link to join:`,
      url: inviteLink
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Web Share cancelled or failed, falling back to clipboard copy", err);
        await navigator.clipboard.writeText(inviteLink);
        alert(isId ? "Link undangan berhasil disalin!" : "Invite link copied to clipboard!");
      }
    } else {
      await navigator.clipboard.writeText(inviteLink);
      alert(isId ? "Link undangan berhasil disalin!" : "Invite link copied to clipboard!");
    }
  };

  const handleJoinSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput || !user || !profile) return;
    setIsJoining(true);

    const isId = i18n.language?.startsWith('id');

    try {
      // Find family with this invite code
      const q = query(collection(db, 'families'), where('inviteCode', '==', inviteCodeInput.trim().toUpperCase()));
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

      // Count target family members to check capacity and set default role
      const targetMembersQuery = query(collection(db, 'users'), where('familyId', '==', newFamilyId));
      const targetMembersSnap = await getDocs(targetMembersQuery);
      const targetMembers = targetMembersSnap.docs.map(doc => doc.data());

      const parentCount = targetMembers.filter(m => m.role === 'parent' || !m.role).length;
      const childCount = targetMembers.filter(m => m.role === 'child').length;

      let assignedRole: 'parent' | 'child' = 'parent';
      if (parentCount >= 2) {
        assignedRole = 'child';
      }

      if (assignedRole === 'child' && childCount >= 3) {
        alert(isId 
          ? "Gagal bergabung: Ruang ini sudah mencapai kapasitas maksimal (2 Orang Tua dan 3 Anak)!" 
          : "Failed to join: This space has reached its maximum capacity (2 Parents and 3 Children)!");
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
        role: assignedRole 
      };

      if (targetSpaceType === 'unmarried') {
        profileUpdates.coupleSpaceId = newFamilyId;
      } else if (targetSpaceType === 'married') {
        profileUpdates.familySpaceId = newFamilyId;
      } else {
        profileUpdates.personalSpaceId = newFamilyId;
      }

      await setDoc(doc(db, 'users', user.uid), profileUpdates, { merge: true });

      alert(isId ? "Berhasil bergabung ke ruang! Memuat ulang..." : "Successfully joined the space! Reloading...");
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      alert(isId ? `Gagal bergabung ke ruang: ${error?.message || error}` : `Error joining space: ${error?.message || error}`);
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

      const familyDocRef = doc(db, 'families', activeSpaceId);
      
      // Fetch target document to preserve its existing totalBalance and inviteCode
      const targetDocSnap = await getDoc(familyDocRef);
      const targetDocData = targetDocSnap.exists() ? targetDocSnap.data() : null;

      const existingBalance = targetDocData ? (targetDocData.totalBalance ?? 0) : 0;

      const inviteCodePrefix = spaceType === 'personal' ? 'P-' : spaceType === 'unmarried' ? 'C-' : 'F-';
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const targetInviteCode = targetDocData?.inviteCode || (inviteCodePrefix + randomCode);

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
      
      await setDoc(familyDocRef, {
        totalBalance: existingBalance,
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
              {profile?.role === 'child' ? (
                <div className="flex flex-col items-center justify-center text-center p-8 space-y-6 bg-stone-50 rounded-[2.5rem] border border-stone-100 mt-4">
                  <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                    🧒
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-brand font-bold text-stone-900 text-base">
                      {isId ? 'Akses Terbatas (Akun Anak)' : 'Restricted Access (Kid Account)'}
                    </h3>
                    <p className="text-stone-500 text-xs leading-relaxed font-medium">
                      {isId 
                        ? 'Hanya akun Orang Tua yang memiliki kontrol penuh untuk mengubah konfigurasi nama, mata uang, batas anggaran, serta beralih mode ruang keuangan.' 
                        : 'Only Parent accounts have full permission to change space configuration, currency, budget limits, or switch active spaces.'}
                    </p>
                  </div>
                  <div className="w-full border-t border-stone-200/60 pt-4 text-[10px] text-stone-400 font-bold uppercase tracking-widest leading-normal">
                    {isId ? 'Hubungi orang tua Anda untuk mengubah pengaturan' : 'Ask your parents to change these configurations'}
                  </div>
                </div>
              ) : (
                <>
              
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
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => { navigator.clipboard.writeText(family?.inviteCode || ''); alert(isId ? "Kode disalin!" : "Code copied!"); }}
                          className="text-[10px] bg-stone-200 text-stone-600 px-3 py-1.5 rounded-full font-bold uppercase tracking-widest hover:bg-stone-300 transition-colors"
                        >
                          {isId ? 'Salin' : 'Copy'}
                        </button>
                        <button 
                          type="button"
                          onClick={handleShareInviteLink}
                          className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors flex items-center justify-center"
                          title={isId ? "Bagikan Link" : "Share Link"}
                        >
                          <Share2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Members & Roles */}
                  <div className="space-y-4 pt-4 border-t border-stone-100">
                    <div>
                      <h3 className="font-bold text-stone-800 text-sm">{isId ? 'Anggota & Peran' : 'Members & Roles'}</h3>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">{isId ? 'Lihat anggota ruang dan kelola peran mereka' : 'View space members and manage their roles'}</p>
                    </div>

                    {isLoadingMembers ? (
                      <div className="text-center py-4 text-xs text-stone-400 font-bold uppercase tracking-widest animate-pulse">
                        {isId ? 'Memuat Anggota...' : 'Loading Members...'}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {familyMembers.map((member: any) => {
                          const isSelf = member.uid === user?.uid;
                          const memberRole = member.role || 'parent';
                          
                          return (
                            <div key={member.uid} className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-100/50">
                              <div className="flex items-center gap-3">
                                {member.photoURL ? (
                                  <img src={member.photoURL} alt={member.displayName} className="w-9 h-9 rounded-full object-cover border border-stone-200" />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-600 text-sm">
                                    {member.displayName?.substring(0, 1).toUpperCase() || 'U'}
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-bold text-stone-800">
                                    {member.displayName} {isSelf && <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full font-bold ml-1">{isId ? 'Saya' : 'Me'}</span>}
                                  </p>
                                  <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">
                                    {memberRole === 'parent' ? (isId ? 'Orang Tua' : 'Parent') : (isId ? 'Anak' : 'Child')}
                                  </p>
                                </div>
                              </div>
                              
                              {!isSelf && (profile?.role || 'parent') === 'parent' ? (
                                <div 
                                  className="flex gap-1 bg-stone-100 p-1 rounded-xl flex-shrink-0 border border-stone-200/40 relative z-20"
                                  onClick={(e) => e.stopPropagation()}
                                  onTouchStart={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRole(member.uid, 'parent')}
                                    className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${memberRole === 'parent' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                                  >
                                    {isId ? 'Ortu' : 'Parent'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRole(member.uid, 'child')}
                                    className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${memberRole === 'child' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                                  >
                                    {isId ? 'Anak' : 'Child'}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 bg-stone-100 px-2.5 py-1 rounded-lg flex-shrink-0">
                                  {memberRole === 'parent' ? (isId ? 'Orang Tua' : 'Parent') : (isId ? 'Anak' : 'Child')}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
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
                        placeholder={isId ? "Contoh: F-XXXXXX" : "e.g. F-XXXXXX"} 
                        className="flex-1 bg-stone-50 p-3 rounded-xl font-mono font-bold border border-stone-100 uppercase" 
                        maxLength={8}
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
            </>
          )}
        </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
