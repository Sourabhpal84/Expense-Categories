"use client";

import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { auth, googleProvider, hasFirebaseConfig } from "@/firebase/config";
import { ensureUserProfile } from "@/services/profile-service";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function setAuthHint(value: boolean) {
  document.cookie = `magneetoz-auth-hint=${value ? "true" : "false"}; path=/; max-age=${value ? 60 * 60 * 24 * 30 : 0}; samesite=lax`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthHint(Boolean(currentUser));
      if (currentUser) await ensureUserProfile(currentUser);
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase is not configured.");
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    if (!auth) throw new Error("Firebase is not configured.");
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    await ensureUserProfile(credential.user, name);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (!auth) throw new Error("Firebase is not configured.");
    const credential = await signInWithPopup(auth, googleProvider);
    await ensureUserProfile(credential.user);
  }, []);

  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
    setAuthHint(false);
  }, []);

  const value = useMemo(
    () => ({ user, loading, configured: hasFirebaseConfig, login, signup, loginWithGoogle, logout }),
    [loading, login, loginWithGoogle, logout, signup, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
