import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data());
          } else {
            // New user setup
            const defaultProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'Nemu User',
              photoURL: user.photoURL || '',
              role: 'parent', // Default role
              familyId: user.uid, // Default family is self
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', user.uid), defaultProfile);
            
            // Generate a simple 6-char alphanumeric invite code
            const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            // Initialize family
            await setDoc(doc(db, 'families', user.uid), {
              name: `${user.displayName || 'Family'}'s Space`,
              totalBalance: 0,
              currency: 'IDR',
              members: [user.uid],
              spaceType: 'personal', // Default mode
              inviteCode: inviteCode,
              updatedAt: new Date().toISOString(),
            });
            
            setProfile(defaultProfile);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Auth change error captured safely:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Sign in error', error?.message || error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Logout error', error?.message || error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
