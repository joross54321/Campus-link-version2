import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isProfessor: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isProfessor: false,
  isStudent: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        if (user) {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile({ uid: user.uid, ...docSnap.data() } as UserProfile);
          } else {
            // Legacy/Seeding fallback: check if profile is stored under human ID (e.g., studentId)
            const academicId = user.email?.split('@')[0]?.toUpperCase();
            if (academicId) {
              const legacyRef = doc(db, 'users', academicId);
              const legacySnap = await getDoc(legacyRef);
              if (legacySnap.exists()) {
                const data = legacySnap.data();
                // Found it! Map it to the profile state
                setProfile({ uid: user.uid, ...data } as UserProfile);
                
                // CRITICAL: Since you are now logged in with this UID, 
                // we should "migrate" the doc to use the real UID for security/rules
                try {
                   await setDoc(doc(db, 'users', user.uid), data);
                } catch (e) {
                   console.warn("Auto-migration failed:", e);
                }
              } else {
                setProfile(null);
              }
            } else {
              setProfile(null);
            }
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'registrar',
    isProfessor: profile?.role === 'professor',
    isStudent: profile?.role === 'student',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
