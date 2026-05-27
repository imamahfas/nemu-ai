import { GoogleGenAI } from '@google/genai';

export async function generateFinancialAdvice(transactions: any[], language: string, spaceType = 'personal'): Promise<string> {
  if (!transactions || transactions.length === 0) {
    return language.startsWith('id') 
      ? "Belum ada cukup data transaksi. Mulai catat pengeluaran Anda agar AI bisa memberikan saran!"
      : "Not enough transaction data yet. Start recording expenses so AI can provide advice!";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Summarize data for AI to save tokens
    const recentTx = transactions.slice(0, 20).map(t => ({
      amount: t.amount,
      type: t.type,
      category: t.category,
      desc: t.description
    }));

    const coachRole = spaceType === 'personal' 
      ? 'an expert, empathetic personal financial coach.' 
      : spaceType === 'unmarried'
        ? 'an expert, empathetic financial coach for a couple.'
        : 'an expert, empathetic financial coach for a family.';

    const prompt = `
      You are ${coachRole}
      Here is their recent transaction data (last 20 transactions):
      ${JSON.stringify(recentTx)}
      
      Provide a ONE SENTENCE actionable financial insight or encouragement based on this data. 
      Keep it very concise, friendly, and under 25 words. 
      Write the response in ${language.startsWith('id') ? 'Indonesian' : 'English'}.
      Do not use markdown formatting.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("AI Coach error:", error);
    
    // Smart Client-Side Fallback: Analyze transactions dynamically
    const expenses = transactions.filter(t => t.type === 'expense');
    if (expenses.length === 0) {
      return language.startsWith('id')
        ? "Mulai catat transaksi pertama Anda hari ini untuk melihat analisis keuangan instan!"
        : "Start recording your first transaction today to see instant financial analysis!";
    }

    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const categoryTotals = expenses.reduce((acc: any, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});

    const topCategory = Object.entries(categoryTotals)
      .sort((a: any, b: any) => b[1] - a[1])[0];

    if (topCategory) {
      const catName = topCategory[0];
      const catAmount = topCategory[1] as number;
      const percentage = Math.round((catAmount / totalExpense) * 100);

      if (language.startsWith('id')) {
        if (catName === 'Food' && percentage > 30) {
          return `Pengeluaran makan Anda menyumbang ${percentage}% anggaran. Menyiapkan bekal di rumah minggu ini bisa menghemat pengeluaran!`;
        }
        if (catName === 'Shopping') {
          return `Belanja barang non-rutin mendominasi pengeluaran Anda. Cobalah gunakan metode jeda 24 jam sebelum bertransaksi.`;
        }
        if (catName === 'Transport') {
          return `Biaya perjalanan menyerap ${percentage}% pengeluaran. Gabungkan rute perjalanan untuk meminimalkan BBM minggu ini.`;
        }
        return `Kategori ${catName} menyerap ${percentage}% pengeluaran Anda. Mari batasi anggaran kategori ini untuk mempertebal tabungan.`;
      } else {
        if (catName === 'Food' && percentage > 30) {
          return `Your food expenses account for ${percentage}% of the budget. Preparing meals at home this week can boost your savings!`;
        }
        if (catName === 'Shopping') {
          return `Non-essential shopping dominates your wallet. Try using a 24-hour pause rule before checking out your next shopping item.`;
        }
        if (catName === 'Transport') {
          return `Travel costs absorb ${percentage}% of expenses. Try combining your trips to minimize fuel consumption this week.`;
        }
        return `The ${catName} category takes up ${percentage}% of your budget. Let's limit spending here to increase your savings.`;
      }
    }

    return language.startsWith('id')
      ? "Sangat baik! Pengeluaran Anda berada dalam kondisi sehat minggu ini. Selangkah lebih dekat menuju financial freedom!"
      : "Excellent! Your spending is in a healthy condition this week. You are one step closer to financial freedom!";
  }
}
