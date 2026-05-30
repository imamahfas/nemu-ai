import { db } from './firebase';
import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';

export interface TransactionData {
  amount: number;
  type: 'income' | 'expense';
  description: string;
  category: string;
  date: string;
  items?: Array<{ Name: string; Qty: number; Price: number; Category?: string }>;
  createdBy?: string;
}

export const addTransaction = async (
  userId: string,
  familyId: string,
  data: TransactionData
) => {
  if (!familyId || !userId) throw new Error("Missing auth context");

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Read the family document first
      const familyRef = doc(db, 'families', familyId);
      const familyDoc = await transaction.get(familyRef);
      
      if (!familyDoc.exists()) {
        throw new Error("Family not found!");
      }

      // 2. Calculate new balance
      const currentBalance = familyDoc.data().totalBalance || 0;
      const amountChange = data.type === 'income' ? data.amount : -data.amount;
      const newBalance = currentBalance + amountChange;

      // 3. Create the new transaction document
      const newTxRef = doc(collection(db, 'transactions'));
      transaction.set(newTxRef, {
        ...data,
        userId,
        familyId,
        createdAt: serverTimestamp(),
      });

      // 4. Update the family balance
      transaction.update(familyRef, {
        totalBalance: newBalance,
        updatedAt: serverTimestamp(),
      });
    });
    
    return true;
  } catch (error) {
    console.error("Transaction failed: ", error);
    throw error;
  }
};
