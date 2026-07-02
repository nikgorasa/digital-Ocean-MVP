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
      throw new Error(error.message || "Authentication failed");
    }

    await fetchUserProfile();
  };

  const signInDemo = async (email: string) => {
    // Demo login uses the password associated with each demo account
    const DEMO_PASSWORDS: Record<string, string> = {
      "hmittal@gorasa.in": "Admin@123",
      "admin@gorasa.in": "Admin@123",
      "sales@gorasa.in": "Sales@123",
      "neha@corp.in": "User@123",
      "amit@example.com": "User@123",
      "priya@example.com": "User@123",
      "support@gorasa.in": "Support@123",
    };

    const password = DEMO_PASSWORDS[email];
    if (!password) {
      throw new Error("Demo login not available for this account");
    }

    const { error } = await authClient.signIn.email({
      email,
      password,
    });

    if (error) throw new Error(error.message || "Demo login failed");

    await fetchUserProfile();
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
