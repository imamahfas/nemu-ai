import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, Users, KeyRound, ArrowRight } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc, collection, query, where, getDocs, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export function SettingsModal({ isOpen, onClose, family }: { isOpen: boolean, onClose: () => void, family: any }) {
  const { user, profile } = useAuth();
  const { t, i18n } = useTranslation();
  const [spaceType, setSpaceType] = useState(family?.spaceType || 'personal');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (family?.spaceType) setSpaceType(family.spaceType);
  }, [family]);

  const handleToggleMode = async (mode: string) => {
    setSpaceType(mode);
    if (!profile?.familyId) return;
    try {
      await updateDoc(doc(db, 'families', profile.familyId), { spaceType: mode });
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoinSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput || !user) return;
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

      if (newFamilyId === profile?.familyId) {
        alert(isId ? "Anda sudah berada di dalam ruang ini." : "You are already in this space.");
        setIsJoining(false);
        return;
      }

      // Add user to new family members
      await updateDoc(doc(db, 'families', newFamilyId), {
        members: arrayUnion(user.uid)
      });

      // Update user profile to new familyId
      await updateDoc(doc(db, 'users', user.uid), {
        familyId: newFamilyId,
        role: 'parent' // Join as Co-Manager by default for now
      });

      alert(isId ? "Berhasil bergabung ke ruang! Memuat ulang..." : "Successfully joined the space! Reloading...");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert(isId ? "Gagal bergabung ke ruang." : "Error joining space.");
    }
    setIsJoining(false);
  };

  const isId = i18n.language?.startsWith('id');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl z-10 min-h-[60vh] flex flex-col">
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
