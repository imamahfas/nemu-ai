import { GoogleGenAI } from '@google/genai';

export async function generateFinancialAdvice(transactions: any[], language: string): Promise<string> {
  if (!transactions || transactions.length === 0) {
    return language === 'id' 
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

    const prompt = `
      You are an expert, empathetic financial coach for a family.
      Here is their recent transaction data (last 20 transactions):
      ${JSON.stringify(recentTx)}
      
      Provide a ONE SENTENCE actionable financial insight or encouragement based on this data. 
      Keep it very concise, friendly, and under 25 words. 
      Write the response in ${language === 'id' ? 'Indonesian' : 'English'}.
      Do not use markdown formatting.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("AI Coach error:", error);
    return language === 'id'
      ? "Sistem pelatih keuangan AI sedang beristirahat. Coba lagi nanti."
      : "The AI financial coach is currently resting. Try again later.";
  }
}
