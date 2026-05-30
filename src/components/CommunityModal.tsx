import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageCircle, Repeat2, Users, Send, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  time: string;
}

interface Post {
  id: string;
  author: string;
  avatar: string;
  role: string;
  text: string;
  likes: number;
  liked: boolean;
  reposts: number;
  reposted: boolean;
  comments: Comment[];
  time: string;
}

export function CommunityModal({ isOpen, onClose, userProfile }: { isOpen: boolean; onClose: () => void; userProfile: any }) {
  const { t, i18n } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostText, setNewPostText] = useState('');
  const [activeReplyPostId, setActiveReplyPostId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [notifications, setNotifications] = useState<string[]>([]);

  // Pre-load mock community feed posts
  useEffect(() => {
    if (isOpen) {
      const isId = i18n.language?.startsWith('id');
      setPosts([
        {
          id: 'post_1',
          author: 'Sarah Wijaya',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
          role: isId ? 'Perencana Keuangan Bersertifikasi' : 'Certified Financial Planner',
          text: isId 
            ? '💡 Tips cepat pelindung inflasi: Coba periksa reksa dana dengan imbal hasil di atas 6% atau obligasi pemerintah. Efek bunga berbunga selama 5 tahun adalah pengubah permainan!'
            : '💡 Quick tip for inflation protection: Try checking out mutual funds yielding higher than 6% or government bonds. The compound interest over 5 years is a game changer!',
          likes: 24,
          liked: false,
          reposts: 8,
          reposted: false,
          comments: [
            { id: 'c_1', author: 'Ahmad Hadi', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', text: isId ? 'Sangat setuju, Sarah! Saya sudah mengunci imbal hasil saya bulan lalu.' : 'Totally agree, Sarah! Locked in my yields last month.', time: isId ? '2 jam lalu' : '2h ago' }
          ],
          time: isId ? '3 jam lalu' : '3h ago'
        },
        {
          id: 'post_2',
          author: 'Deni Setiawan',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
          role: isId ? 'Anggota Premium Nemu' : 'Nemu Premium Member',
          text: isId
            ? 'Baru saja melengkapi dana perisai darurat saya hingga 6 bulan pengeluaran menggunakan Nemu Roadmap. Indikator DTI benar-benar mendorong saya untuk melunasi utang kartu kredit terlebih dahulu! 🚀'
            : 'Just capped my emergency shield fund to 6 months of expenses using the Nemu Roadmap. The DTI indicator really gave me a push to clean up my CC debts first! 🚀',
          likes: 18,
          liked: false,
          reposts: 3,
          reposted: false,
          comments: [],
          time: isId ? '5 jam lalu' : '5h ago'
        }
      ]);
    }
  }, [isOpen, i18n.language]);

  // Social interaction notifications simulator
  useEffect(() => {
    if (!isOpen) return;

    const isId = i18n.language?.startsWith('id');
    const phrases = isId ? [
      "Sarah Wijaya menyukai postingan Anda!",
      "Ahmad Hadi mulai mengikuti Anda.",
      "Deni Setiawan membagikan ulang tips Anda.",
      "Budi Pratama membalas saran anggaran Anda."
    ] : [
      "Sarah Wijaya liked your post!",
      "Ahmad Hadi started following you.",
      "Deni Setiawan reposted your tip.",
      "Budi Pratama replied to your budget suggestion."
    ];

    const interval = setInterval(() => {
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      setNotifications(prev => [randomPhrase, ...prev]);

      // Dismiss after 4 seconds
      setTimeout(() => {
        setNotifications(prev => prev.slice(0, prev.length - 1));
      }, 4000);
    }, 18000);

    return () => clearInterval(interval);
  }, [isOpen, i18n.language]);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const isId = i18n.language?.startsWith('id');
    const newPost: Post = {
      id: Math.random().toString(),
      author: userProfile?.displayName || 'Me',
      avatar: userProfile?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      role: isId ? 'Perencana Keuangan Nemu' : 'Nemu Planner',
      text: newPostText,
      likes: 0,
      liked: false,
      reposts: 0,
      reposted: false,
      comments: [],
      time: isId ? 'Baru saja' : 'Just now'
    };

    setPosts(prev => [newPost, ...prev]);
    setNewPostText('');

    // Trigger immediate simulated like 4 seconds after making a post to wow the user!
    setTimeout(() => {
      setNotifications(prev => [isId ? "Postingan baru Anda menerima Suka dari Sarah Wijaya!" : "Your new post received a Like from Sarah Wijaya!", ...prev]);
      setPosts(prev => prev.map(p => {
        if (p.id === newPost.id) {
          return { ...p, likes: p.likes + 1 };
        }
        return p;
      }));
      setTimeout(() => {
        setNotifications(prev => prev.slice(0, prev.length - 1));
      }, 4000);
    }, 4000);
  };

  const handleLike = (id: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          liked: !p.liked,
          likes: p.liked ? p.likes - 1 : p.likes + 1
        };
      }
      return p;
    }));
  };

  const handleRepost = (id: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          reposted: !p.reposted,
          reposts: p.reposted ? p.reposts - 1 : p.reposts + 1
        };
      }
      return p;
    }));
  };

  const handleCreateComment = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const newComment: Comment = {
      id: Math.random().toString(),
      author: userProfile?.displayName || 'Me',
      avatar: userProfile?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      text: replyText,
      time: 'Just now'
    };

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, newComment]
        };
      }
      return p;
    }));

    setReplyText('');
    setActiveReplyPostId(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
          
          {/* Simulated Toast Notifications */}
          <div className="fixed top-6 right-6 z-50 space-y-2 pointer-events-none max-w-sm">
            <AnimatePresence>
              {notifications.map((notif, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-stone-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-white/10 pointer-events-auto"
                >
                  <div className="p-2 bg-indigo-500 rounded-xl text-white"><Bell size={16} className="animate-bounce" /></div>
                  <p className="text-xs font-semibold leading-normal">{notif}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl z-10 h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-stone-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 shadow-md shadow-indigo-100/50">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-brand font-bold text-stone-900">{t('community_title')}</h2>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{t('community_desc')}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors"><X size={20} /></button>
            </div>

            {/* Post Creation Area */}
            <form onSubmit={handleCreatePost} className="p-4 bg-stone-50 border border-stone-100 rounded-[2rem] my-4 flex-shrink-0 flex gap-3 items-start">
              <img src={userProfile?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} alt="Avatar" className="w-10 h-10 rounded-xl border border-stone-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <textarea
                  value={newPostText}
                  onChange={e => setNewPostText(e.target.value)}
                  placeholder={t('create_post')}
                  className="w-full bg-transparent border-0 text-sm focus:outline-none focus:ring-0 font-medium text-stone-700 resize-none h-14"
                  maxLength={280}
                  required
                />
                <div className="flex justify-end pt-1">
                  <button type="submit" className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all">
                    <Send size={12} /> {t('post_btn')}
                  </button>
                </div>
              </div>
            </form>

            {/* Scrollable Feed */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1 scrollbar-hide py-2 pb-6">
              {posts.map(p => (
                <div key={p.id} className="border-b border-stone-100 pb-6 space-y-4">
                  {/* Author Meta */}
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <img src={p.avatar} alt="Author Avatar" className="w-10 h-10 rounded-xl object-cover" />
                      <div>
                        <h4 className="font-bold text-stone-800 text-xs">{p.author}</h4>
                        <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wide mt-0.5">{p.role}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-stone-300 uppercase tracking-widest">{p.time}</span>
                  </div>

                  {/* Body Text */}
                  <p className="text-stone-700 text-xs font-medium leading-relaxed bg-stone-50/50 p-4 rounded-[1.5rem] border border-stone-100/50">
                    {p.text}
                  </p>

                  {/* Actions Grid */}
                  <div className="flex gap-6 text-stone-400 text-xs pl-2">
                    <button onClick={() => handleLike(p.id)} className={`flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 ${p.liked ? 'text-rose-500 font-bold' : 'hover:text-rose-500'}`}>
                      <Heart size={16} className={p.liked ? 'fill-rose-500 text-rose-500' : ''} /> {p.likes}
                    </button>
                    <button onClick={() => setActiveReplyPostId(p.id === activeReplyPostId ? null : p.id)} className={`flex items-center gap-1.5 hover:text-indigo-600 transition-all hover:scale-105 active:scale-95 ${activeReplyPostId === p.id ? 'text-indigo-600 font-bold' : ''}`}>
                      <MessageCircle size={16} /> {p.comments.length}
                    </button>
                    <button onClick={() => handleRepost(p.id)} className={`flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 ${p.reposted ? 'text-emerald-500 font-bold' : 'hover:text-emerald-500'}`}>
                      <Repeat2 size={16} /> {p.reposts}
                    </button>
                  </div>

                  {/* Comments Log & Reply Box */}
                  <AnimatePresence>
                    {activeReplyPostId === p.id && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={(e) => handleCreateComment(e, p.id)}
                        className="flex gap-2 items-center bg-stone-50 border border-stone-100 p-2.5 rounded-2xl flex-shrink-0"
                      >
                        <input
                          type="text"
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder={t('write_comment')}
                          className="flex-1 bg-white p-2.5 rounded-xl border border-stone-100 text-xs font-medium focus:outline-none"
                          required
                        />
                        <button type="submit" className="bg-indigo-600 text-white w-9 h-9 rounded-xl flex items-center justify-center hover:bg-indigo-700"><Send size={14} /></button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {p.comments.length > 0 && (
                    <div className="bg-stone-50/50 p-4 rounded-[2rem] space-y-3.5 border border-stone-100/50">
                      {p.comments.map(c => (
                        <div key={c.id} className="flex gap-3 items-start border-b border-stone-100/50 pb-3 last:border-b-0 last:pb-0">
                          <img src={c.avatar} alt="Commenter Avatar" className="w-8 h-8 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <h5 className="font-bold text-[10px] text-stone-700">{c.author}</h5>
                              <span className="text-[8px] font-bold text-stone-300 uppercase tracking-widest">{c.time}</span>
                            </div>
                            <p className="text-[11px] text-stone-600 font-medium leading-relaxed mt-0.5">{c.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              ))}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
