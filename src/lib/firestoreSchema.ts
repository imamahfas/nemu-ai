import { doc, getDoc, setDoc, deleteDoc, updateDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Nemu Firestore Schema Helpers
 * These provide a structured way to interact with our collections
 */

export const collections = {
  USERS: 'users',
  FAMILIES: 'families',
  TRANSACTIONS: 'transactions',
  KID_WALLETS: 'kidWallets',
  SAVING_GOALS: 'savingGoals',
  TASKS: 'tasks',
};

export const FirestoreSchema = {
  // Family Operations
  async getFamily(familyId: string) {
    const docRef = doc(db, collections.FAMILIES, familyId);
    return await getDoc(docRef);
  },

  // Transaction Operations
  async addTransaction(data: {
    userId: string;
    familyId: string;
    amount: number;
    type: 'expense' | 'income';
    category: string;
    description: string;
    receiptUrl?: string;
    date: string;
    createdBy?: string;
  }) {
    const txRef = doc(collection(db, collections.TRANSACTIONS));
    await setDoc(txRef, {
      ...data,
      approved: true,
      createdAt: new Date().toISOString(),
    });
    
    // Update family balance (simplified, should be done with transaction/batch or function)
    const familyRef = doc(db, collections.FAMILIES, data.familyId);
    const familyDoc = await getDoc(familyRef);
    if (familyDoc.exists()) {
      const currentBalance = familyDoc.data().totalBalance || 0;
      const newBalance = data.type === 'income' 
        ? currentBalance + data.amount 
        : currentBalance - data.amount;
      await updateDoc(familyRef, { totalBalance: newBalance, updatedAt: new Date().toISOString() });
    }
  },

  // Kid Module
  async getKidWallet(userId: string) {
    const q = query(collection(db, collections.KID_WALLETS), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs[0];
  }
};
