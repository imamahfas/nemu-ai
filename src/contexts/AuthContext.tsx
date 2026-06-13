import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signIn: (forceSelectAccount?: boolean) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
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
          const pSpaceId = `personal_${user.uid}`;
          const cSpaceId = `couple_${user.uid}`;
          const fSpaceId = `family_${user.uid}`;

          if (userDoc.exists()) {
            let profileData = userDoc.data();

            // Auto-reset: if user's familyId points to a space where they're no longer a member, fall back to personal space
            if (profileData.familyId) {
              try {
                const familySnap = await getDoc(doc(db, 'families', profileData.familyId));
                const members: string[] = familySnap.exists() ? (familySnap.data().members || []) : [];
                if (!members.includes(user.uid)) {
                  const fallbackSpaceId = profileData.personalSpaceId || `personal_${user.uid}`;
                  await updateDoc(doc(db, 'users', user.uid), { familyId: fallbackSpaceId, role: 'parent' });
                  profileData = { ...profileData, familyId: fallbackSpaceId, role: 'parent' };
                }
              } catch (_) {}
            }

            // Check if spaces are already initialized in user profile and have correct prefixes
            const isCorrupted = !profileData.personalSpaceId ||
                                profileData.personalSpaceId.startsWith('couple_') || 
                                profileData.personalSpaceId.startsWith('family_') ||
                                !profileData.coupleSpaceId || 
                                profileData.coupleSpaceId.startsWith('personal_') || 
                                profileData.coupleSpaceId.startsWith('family_') ||
                                !profileData.familySpaceId || 
                                profileData.familySpaceId.startsWith('personal_') || 
                                profileData.familySpaceId.startsWith('couple_');

            if (isCorrupted) {
              // Lazily initialize/heal missing or corrupted spaces for backward compatibility
              const personalDoc = await getDoc(doc(db, 'families', pSpaceId));
              if (!personalDoc.exists()) {
                await setDoc(doc(db, 'families', pSpaceId), {
                  name: `${profileData.displayName || user.displayName || 'My'} Personal Space`,
                  totalBalance: 0,
                  currency: 'IDR',
                  members: [user.uid],
                  spaceType: 'personal',
                  inviteCode: 'P-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
                  updatedAt: new Date().toISOString(),
                });
              }

              const coupleDoc = await getDoc(doc(db, 'families', cSpaceId));
              if (!coupleDoc.exists()) {
                await setDoc(doc(db, 'families', cSpaceId), {
                  name: `${profileData.displayName || user.displayName || 'Our'} Couple Space`,
                  totalBalance: 0,
                  currency: 'IDR',
                  members: [user.uid],
                  spaceType: 'unmarried',
                  inviteCode: 'C-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
                  updatedAt: new Date().toISOString(),
                });
              }

              const familyDoc = await getDoc(doc(db, 'families', fSpaceId));
              if (!familyDoc.exists()) {
                await setDoc(doc(db, 'families', fSpaceId), {
                  name: `${profileData.displayName || user.displayName || 'Our'} Family Space`,
                  totalBalance: 0,
                  currency: 'IDR',
                  members: [user.uid],
                  spaceType: 'married',
                  inviteCode: 'F-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
                  updatedAt: new Date().toISOString(),
                });
              }

              // Update profile in users collection
              const profileUpdates = {
                personalSpaceId: pSpaceId,
                coupleSpaceId: cSpaceId,
                familySpaceId: fSpaceId,
                familyId: profileData.familyId || pSpaceId
              };
              await updateDoc(doc(db, 'users', user.uid), profileUpdates);
              setProfile({
                ...profileData,
                ...profileUpdates
              });
            } else {
              setProfile(profileData);
            }
          } else {
            // New user setup with isolated triple spaces
            await setDoc(doc(db, 'families', pSpaceId), {
              name: `${user.displayName || 'My'} Personal Space`,
              totalBalance: 0,
              currency: 'IDR',
              members: [user.uid],
              spaceType: 'personal',
              inviteCode: 'P-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
              updatedAt: new Date().toISOString(),
            });

            await setDoc(doc(db, 'families', cSpaceId), {
              name: `${user.displayName || 'Our'} Couple Space`,
              totalBalance: 0,
              currency: 'IDR',
              members: [user.uid],
              spaceType: 'unmarried',
              inviteCode: 'C-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
              updatedAt: new Date().toISOString(),
            });

            await setDoc(doc(db, 'families', fSpaceId), {
              name: `${user.displayName || 'Our'} Family Space`,
              totalBalance: 0,
              currency: 'IDR',
              members: [user.uid],
              spaceType: 'married',
              inviteCode: 'F-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
              updatedAt: new Date().toISOString(),
            });

            const defaultProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'Nemu User',
              photoURL: user.photoURL || '',
              role: 'parent',
              familyId: pSpaceId, // default active space is Personal
              personalSpaceId: pSpaceId,
              coupleSpaceId: cSpaceId,
              familySpaceId: fSpaceId,
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', user.uid), defaultProfile);
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

  const signIn = async (forceSelectAccount = false) => {
    try {
      if (forceSelectAccount) {
        googleProvider.setCustomParameters({ prompt: 'select_account' });
      } else {
        googleProvider.setCustomParameters({});
      }
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Sign in error', error?.message || error);
    }
  };

  /**
   * Email/password sign-in — staging-friendly, works in headless/automated browsers.
   * Creates the account on first use, then signs in on subsequent calls.
   */
  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error?.code === 'auth/user-not-found' || error?.code === 'auth/invalid-credential') {
        // Create the account and sign in
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        console.error('Email sign-in error', error?.message || error);
        throw error;
      }
    }
  };

  /**
   * Anonymous sign-in — zero-friction path for automated tests that only
   * need a valid session to reach protected routes.
   */
  const signInAnonymously = async () => {
    try {
      await firebaseSignInAnonymously(auth);
    } catch (error: any) {
      console.error('Anonymous sign-in error', error?.message || error);
      throw error;
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
    <AuthContext.Provider value={{ user, profile, loading, signIn, signInWithEmail, signInAnonymously, logout }}>
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
