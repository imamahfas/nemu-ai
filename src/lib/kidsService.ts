import { db } from './firebase';
import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';

export const claimTask = async (
  familyId: string,
  kidWalletId: string,
  taskId: string,
  rewardAmount: number,
  taskName: string
) => {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Get Family, Wallet, and Task docs
      const familyRef = doc(db, 'families', familyId);
      const walletRef = doc(db, 'kidWallets', kidWalletId);
      const taskRef = doc(db, 'tasks', taskId);

      const [familyDoc, walletDoc, taskDoc] = await Promise.all([
        transaction.get(familyRef),
        transaction.get(walletRef),
        transaction.get(taskRef)
      ]);

      if (!familyDoc.exists()) throw new Error("Family not found");
      if (!walletDoc.exists()) throw new Error("Kid wallet not found");
      if (!taskDoc.exists() || taskDoc.data().status === 'completed') {
        throw new Error("Task already completed or not found");
      }

      // 2. Calculate new balances
      const currentFamilyBalance = familyDoc.data().totalBalance || 0;
      const currentKidBalance = walletDoc.data().balance || 0;

      // 3. Update documents
      transaction.update(familyRef, {
        totalBalance: currentFamilyBalance - rewardAmount,
        updatedAt: serverTimestamp()
      });

      transaction.update(walletRef, {
        balance: currentKidBalance + rewardAmount,
        updatedAt: serverTimestamp()
      });

      transaction.update(taskRef, {
        status: 'completed',
        completedAt: serverTimestamp()
      });

      // 4. Record as family transaction (Expense)
      const newTxRef = doc(collection(db, 'transactions'));
      transaction.set(newTxRef, {
        familyId,
        userId: 'system', // Automatically generated
        amount: rewardAmount,
        type: 'expense',
        category: 'Education',
        description: `Pocket Money: ${taskName}`,
        date: new Date().toISOString(),
        createdAt: serverTimestamp()
      });
    });
    return true;
  } catch (error) {
    console.error("Failed to claim task:", error);
    throw error;
  }
};
