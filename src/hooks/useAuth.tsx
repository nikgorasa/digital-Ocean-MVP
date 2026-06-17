"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authClient } from "@/lib/auth-client";

interface AppUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  companyId?: string;
  walletBalance: number;
  loyaltyPoints: number;
  loyaltyTier: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInDemo: (email: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await authClient.getSession();
        if (session?.data?.user) {
          await fetchUserProfile();
        } else {
          // Check for demo user
          const cached = localStorage.getItem("gorasa_demo_user");
          if (cached) {
            try {
              const { email } = JSON.parse(cached);
              const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
              });
              if (res.ok) {
                const userData = await res.json();
                setUser(userData);
              } else {
                localStorage.removeItem("gorasa_demo_user");
              }
            } catch {
              localStorage.removeItem("gorasa_demo_user");
            }
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: `${window.location.origin}/auth/callback`,
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await authClient.signIn.email({
      email,
      password,
    });

    if (error) {
      // If Better Auth fails, try demo mode
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        return;
      }

      const apiErr = await res.json().catch(() => ({}));
      throw new Error(apiErr.error || error.message);
    }

    // If auth succeeds, fetch user profile
    await fetchUserProfile();
  };

  const signInDemo = async (email: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Demo login failed");
    }

    const userData = await res.json();
    setUser(userData);
    localStorage.setItem(
      "gorasa_demo_user",
      JSON.stringify({ email: userData.email })
    );
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    name: string
  ) => {
    const { error } = await authClient.signUp.email({
      email,
      password,
      name,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await authClient.signOut();
    setUser(null);
    localStorage.removeItem("gorasa_demo_user");
  };

  const refreshUser = async () => {
    await fetchUserProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signInDemo,
        signUpWithEmail,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
