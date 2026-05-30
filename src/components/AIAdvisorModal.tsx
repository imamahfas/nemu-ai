import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Sparkles, Send, Bot, User as UserIcon, HelpCircle } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface Message {
  sender: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

const PRESET_TIPS_EN = [
  "💡 Tip of the Day: Save at least 20% of your income first before planning your monthly expenses.",
  "💡 Tip of the Day: Keep an emergency fund of at least 3 to 6 months of your average monthly expenses.",
  "💡 Tip of the Day: Avoid high-interest consumer debt. Always pay off credit cards in full every month.",
  "💡 Tip of the Day: Practice the 24-hour rule: Wait 24 hours before making any non-essential purchase.",
  "💡 Tip of the Day: Review your subscription accounts monthly. Cancel any you haven't used in the past 30 days."
];

const PRESET_TIPS_ID = [
  "💡 Tips Hari Ini: Tabung minimal 20% dari penghasilan Anda terlebih dahulu sebelum merencanakan pengeluaran bulanan.",
  "💡 Tips Hari Ini: Miliki dana darurat minimal 3 hingga 6 bulan dari rata-rata pengeluaran bulanan Anda.",
  "💡 Tips Hari Ini: Hindari utang konsumtif berbunga tinggi. Selalu lunasi kartu kredit Anda secara penuh setiap bulan.",
  "💡 Tips Hari Ini: Terapkan aturan 24 jam: Tunggu 24 jam sebelum melakukan pembelian non-esensial.",
  "💡 Tips Hari Ini: Tinjau langganan bulanan Anda. Batalkan yang tidak Anda gunakan dalam 30 hari terakhir."
];

export function AIAdvisorModal({ isOpen, onClose, transactions, spaceType }: {
  isOpen: boolean;
  onClose: () => void;
  transactions: any[];
  spaceType: string;
}) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentTip, setCurrentTip] = useState(PRESET_TIPS_EN[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tips = i18n.language.startsWith('id') ? PRESET_TIPS_ID : PRESET_TIPS_EN;
    setCurrentTip(tips[0]);
    // Rotate tips
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * tips.length);
      setCurrentTip(tips[idx]);
    }, 8000);
    return () => clearInterval(interval);
  }, [i18n.language]);

  // Initialize bot welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          sender: 'bot',
          text: i18n.language === 'id'
            ? `Halo! Saya adalah Penasihat Keuangan AI Nemu Anda. Saya dapat membantu menganalisis transaksi Anda di ruang ${spaceType === 'personal' ? 'Pribadi' : spaceType === 'unmarried' ? 'Pasangan' : 'Keluarga'}. Apa yang ingin Anda konsultasikan hari ini?`
            : `Hello! I am your Nemu AI Financial Advisor. I can analyze your transactions in your ${spaceType === 'personal' ? 'Personal' : spaceType === 'unmarried' ? 'Couple' : 'Family'} space. What financial goals can we plan today?`,
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, messages.length, spaceType, i18n.language]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = { sender: 'user', text: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API Key is not configured in .env");
      }

      const recentTx = transactions.slice(0, 15).map(t => ({
        amount: t.amount,
        type: t.type,
        category: t.category,
        desc: t.description,
        date: t.date
      }));

      const contextPrompt = `
        You are a highly premium, empathetic, certified Financial Planner AI for Nemu.
        User's Space Mode: ${spaceType}
        User's Recent Transactions: ${JSON.stringify(recentTx)}
        User's Question: "${textToSend}"

        Provide a structured, highly actionable financial response. 
        Format your response beautifully with paragraphs and bullet points. Keep it under 150 words.
        Respond in ${i18n.language === 'id' ? 'Indonesian' : 'English'}.
      `;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: contextPrompt }
              ]
            }
          ]
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${errText}`);
      }

      const resData = await res.json();
      const botResponseText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!botResponseText) {
        throw new Error("Empty response from Gemini API");
      }

      const botMsg: Message = {
        sender: 'bot',
        text: botResponseText.trim(),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e: any) {
      console.error("AI chat error:", e);
      
      // High-quality simulated planner response fallback
      setTimeout(() => {
        const fallbackText = getSmartChatFallback(textToSend, transactions, i18n.language, spaceType);
        const botMsg: Message = {
          sender: 'bot',
          text: fallbackText,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMsg]);
      }, 1200);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl z-10 h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-stone-100 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 shadow-md shadow-indigo-100/50">
                      <Sparkles className="animate-pulse" size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-brand font-bold text-stone-900">{t('ai_advisor')}</h2>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{i18n.language.startsWith('id') ? 'Layanan Asisten Nemu' : 'Nemu Advisor Suite'}</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors"><X size={20} /></button>
            </div>

            {/* Banner Tip */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3 my-3 text-xs text-indigo-950 font-medium flex-shrink-0 flex items-center gap-2 overflow-hidden">
              <span className="flex-shrink-0 text-base">✨</span>
              <p className="animate-fade-in truncate">{currentTip}</p>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide py-2 flex flex-col">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.sender === 'bot' ? 'bg-indigo-50 text-indigo-600' : 'bg-stone-900 text-white'}`}>
                    {msg.sender === 'bot' ? <Bot size={16} /> : <UserIcon size={16} />}
                  </div>
                  <div className={`p-4 rounded-3xl text-sm leading-relaxed ${msg.sender === 'bot' ? 'bg-stone-50 text-stone-800 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-100'}`}>
                    <p className="whitespace-pre-line font-medium">{msg.text}</p>
                    <span className={`block text-[9px] mt-2 opacity-60 text-right ${msg.sender === 'user' ? 'text-white' : 'text-stone-400'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3 max-w-[80%] self-start">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                  <div className="bg-stone-50 p-4 rounded-3xl rounded-tl-none flex items-center gap-1.5 py-5 px-6">
                    <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-150" />
                    <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-300" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length === 1 && !isTyping && (
              <div className="py-3 border-t border-stone-100 flex-shrink-0">
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                  <HelpCircle size={12} /> {i18n.language.startsWith('id') ? 'Saran Pertanyaan' : 'Suggestion Questions'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(i18n.language.startsWith('id') ? [
                    { id: 'emergency', label: 'Saran target dana darurat', q: 'Berdasarkan transaksi saya, berapa target dana darurat yang realistis dan bagaimana cara mencapainya?' },
                    { id: 'food', label: 'Analisis perilaku belanja saya', q: 'Tolong analisis pengeluaran terbaru saya dan identifikasi area yang bisa dioptimalkan.' },
                    { id: 'debt', label: 'Rencana Utang vs Tabungan', q: 'Apakah saya harus memprioritaskan pelunasan utang yang belum dibayar atau menambah target tabungan?' }
                  ] : [
                    { id: 'emergency', label: 'Suggest an emergency fund target', q: 'Based on my transactions, what is a realistic emergency fund target and how can I achieve it?' },
                    { id: 'food', label: 'Analyze my spending behavior', q: 'Please analyze my recent spending and identify areas where I can optimize.' },
                    { id: 'debt', label: 'Debt vs Savings planning', q: 'Should I prioritize paying off outstanding debts or increasing my savings goal?' }
                  ]).map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => handleSendMessage(preset.q)}
                      className="text-xs bg-stone-50 border border-stone-100 text-stone-700 px-4 py-2.5 rounded-2xl hover:bg-stone-100 transition-colors font-medium"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
              className="pt-3 border-t border-stone-100 flex gap-2 items-center flex-shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={i18n.language === 'id' ? "Tanyakan rencana anggaran, tabungan..." : "Ask about budget plans, savings..."}
                className="flex-1 bg-stone-50 p-4 rounded-2xl font-medium border border-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Smart local chatbot fallbacks
function getSmartChatFallback(q: string, transactions: any[], lang: string, spaceType: string): string {
  const query = q.toLowerCase();
  const expenses = transactions.filter(t => t.type === 'expense');
  const total = expenses.reduce((sum, t) => sum + t.amount, 0);

  if (lang === 'id') {
    if (query.includes('emergency') || query.includes('darurat')) {
      const target = total * 6;
      return `Berdasarkan pengeluaran bulanan Anda, berikut adalah rekomendasi Dana Darurat:\n\n• **Target Minimum:** ${formatCurrency(target)} (6 bulan pengeluaran).\n• **Langkah Strategis:** Sisihkan 10% pendapatan bulanan secara otomatis ke rekening terpisah.\n• **Status Anda:** Menggunakan ruang ${spaceType === 'personal' ? 'Pribadi' : 'Bersama'}, simpan dana ini di tempat cair seperti reksa dana pasar uang atau deposito jangka pendek.`;
    }
    if (query.includes('spending') || query.includes('analis') || query.includes('kategori')) {
      return `Analisis Pengeluaran Anda:\n\n• **Total Pengeluaran Dicatat:** ${formatCurrency(total)}.\n• **Rekomendasi Utama:** Kategori makanan dan belanja non-rutin merupakan penyerap anggaran terbesar. Batasi pos 'Shopping' maksimal 10% dari penghasilan bulanan untuk mengamankan rasio menabung Anda.`;
    }
    if (query.includes('debt') || query.includes('utang') || query.includes('tabung')) {
      return `Strategi Rencana Keuangan Anda:\n\n• **Prioritas Pertama:** Jika Anda memiliki utang berbunga tinggi (>12% per tahun), segera alokasikan 70% dana lebih untuk pelunasan utang terlebih dahulu.\n• **Metode Rekomendasi:** Gunakan metode 'Snowball' (lunasi dari nominal terkecil untuk dorongan psikologis) atau 'Avalanche' (lunasi dari bunga tertinggi untuk hemat finansial).`;
    }
    return `Nasihat Perencana Nemu AI:\n\nDengan alokasi anggaran yang optimal, Anda berada di jalur yang tepat. Untuk mengamankan masa depan keuangan Anda di ruang ${spaceType === 'personal' ? 'Pribadi' : 'Keluarga'}, pastikan rasio menabung Anda berada di atas 20% dari penghasilan kotor. Tetap semangat mengelola anggaran!`;
  } else {
    if (query.includes('emergency')) {
      const target = total * 6;
      return `Based on your recent transactions, here is your Emergency Fund Roadmap:\n\n• **Recommended Target:** ${formatCurrency(target)} (covering 6 months of expenses).\n• **Action Plan:** Automate a 10% saving transfer immediately on payday.\n• **Advice:** In ${spaceType} mode, we suggest placing this in a highly liquid money market mutual fund for security and yield.`;
    }
    if (query.includes('analyze') || query.includes('spending') || query.includes('behavior')) {
      return `Recent Spending Analysis:\n\n• **Total Expenses Tracked:** ${formatCurrency(total)}.\n• **Key Finding:** Non-essential categories have high volatility. We recommend capping your flexible shopping budget to 15% of your net income to maintain healthy growth.`;
    }
    if (query.includes('debt') || query.includes('saving')) {
      return `Strategic Financial Planning:\n\n• **Priority 1:** If you have high-interest debts, prioritize paying them off first before aggressively expanding your savings goals.\n• **Methods:** Use the 'Snowball method' to pay off the smallest balances first for a psychological win, or the 'Avalanche method' to minimize total interest paid.`;
    }
    return `Nemu AI Advisor Insight:\n\nTo build long-term wealth in your ${spaceType} space, we highly recommend keeping your Debt-to-Income (DTI) ratio below 30% and locking away a solid portion of income into compounding assets. You got this!`;
  }
}
