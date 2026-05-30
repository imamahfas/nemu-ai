import { formatCurrency } from './utils';

export async function generateFinancialAdvice(
  transactions: any[], 
  language: string, 
  spaceType = 'personal',
  budgetLimits: Record<string, number> = {},
  categorySpent: Record<string, number> = {},
  currency = 'IDR'
): Promise<string> {
  if (!transactions || transactions.length === 0) {
    return language.startsWith('id') 
      ? "Belum ada cukup data transaksi. Mulai catat pengeluaran Anda agar AI bisa memberikan saran!"
      : "Not enough transaction data yet. Start recording expenses so AI can provide advice!";
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API Key is not configured in .env");
    }
    
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

    // Construct budget context for Gemini prompt
    const budgetContext = Object.entries(budgetLimits)
      .map(([cat, limit]) => {
        if (!limit || limit <= 0) return null;
        const spent = categorySpent[cat] || 0;
        const pct = Math.round((spent / limit) * 100);
        return { category: cat, limit, spent, percent: pct };
      })
      .filter((b): b is NonNullable<typeof b> => b !== null);

    const prompt = `
      You are ${coachRole}
      Here is their recent transaction data (last 20 transactions):
      ${JSON.stringify(recentTx)}

      Category Budget Limits and current monthly spending in ${currency}:
      ${JSON.stringify(budgetContext)}
      
      Provide a ONE SENTENCE actionable financial insight or encouragement based on this data. If any category budget limits are approaching (over 80%) or exceeded (over 100%), prioritize giving a warm but firm warning regarding those specific categories (mentioning the category name).
      Keep it very concise, friendly, and under 25 words. 
      Write the response in ${language.startsWith('id') ? 'Indonesian' : 'English'}.
      Do not use markdown formatting.
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
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
    const adviceText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!adviceText) {
      throw new Error("Empty response from Gemini API");
    }

    return adviceText.trim();
  } catch (error) {
    console.error("AI Coach error:", error);
    
    // Smart Client-Side Fallback: Check category budget warnings first
    const warnings = Object.entries(budgetLimits)
      .map(([cat, limit]) => {
        if (!limit || limit <= 0) return null;
        const spent = categorySpent[cat] || 0;
        const pct = Math.round((spent / limit) * 100);
        if (pct >= 80) {
          return { category: cat, percent: pct, spent, limit };
        }
        return null;
      })
      .filter((w): w is NonNullable<typeof w> => w !== null);

    if (warnings.length > 0) {
      warnings.sort((a, b) => b.percent - a.percent);
      const topWarning = warnings[0];
      if (language.startsWith('id')) {
        if (topWarning.percent >= 100) {
          return `Perhatian! Anggaran ${topWarning.category} Anda sudah terlampaui (${topWarning.percent}%). Segera batasi transaksi di kategori ini!`;
        } else {
          return `Awas! Anggaran ${topWarning.category} sudah mendekati batas (${topWarning.percent}% terpakai). Kendalikan pengeluaran Anda agar tidak bocor.`;
        }
      } else {
        if (topWarning.percent >= 100) {
          return `Warning! Your ${topWarning.category} budget has been exceeded (${topWarning.percent}%). Limit transactions in this category immediately!`;
        } else {
          return `Watch out! Your ${topWarning.category} budget is approaching its limit (${topWarning.percent}% used). Keep tight control of your spending.`;
        }
      }
    }

    // Standard fallback logic analyzing transactions
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
