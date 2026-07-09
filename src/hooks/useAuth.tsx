"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { authClient } from "@/lib/auth-client";
import SessionWarningModal from "@/components/SessionWarningModal";

const SESSION_WARNING_SECONDS = 180; // 3 minutes before expiry
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

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
  const [showWarning, setShowWarning] = useState(false);
  const [sessionExpiresIn, setSessionExpiresIn] = useState(0);

  const expiryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionExpiryRef = useRef<number>(0);

  const clearAllTimers = useCallback(() => {
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    expiryTimerRef.current = null;
    warningTimerRef.current = null;
    checkIntervalRef.current = null;
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return data;
      }
      if (res.status === 401) {
        setUser(null);
        setShowWarning(false);
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      return null;
    }
  };

  const scheduleSessionTimers = useCallback(
    (expiresAt: number) => {
      clearAllTimers();
      sessionExpiryRef.current = expiresAt;

      const now = Date.now();
      const msUntilExpiry = expiresAt - now;
      const msUntilWarning = msUntilExpiry - SESSION_WARNING_SECONDS * 1000;

      if (msUntilExpiry <= 0) {
        setUser(null);
        setShowWarning(false);
        return;
      }

      // Schedule warning
      if (msUntilWarning > 0) {
        warningTimerRef.current = setTimeout(() => {
          const remaining = Math.max(
            0,
            Math.floor((sessionExpiryRef.current - Date.now()) / 1000)
          );
          setSessionExpiresIn(remaining);
          setShowWarning(true);
        }, msUntilWarning);
      } else {
        // Already within warning window
        const remaining = Math.max(0, Math.floor(msUntilExpiry / 1000));
        setSessionExpiresIn(remaining);
        setShowWarning(true);
      }

      // Schedule hard expiry
      expiryTimerRef.current = setTimeout(() => {
        setUser(null);
        setShowWarning(false);
        clearAllTimers();
      }, msUntilExpiry);
    },
    [clearAllTimers]
  );

  const checkSession = useCallback(async () => {
    try {
      const session = await authClient.getSession();
      if (session?.data?.session) {
        const expiresAt = new Date(session.data.session.expiresAt).getTime();
        scheduleSessionTimers(expiresAt);
        if (!user) {
          await fetchUserProfile();
        }
      } else {
        setUser(null);
        setShowWarning(false);
        clearAllTimers();
      }
    } catch (error) {
      console.error("Session check failed:", error);
    }
  }, [user, scheduleSessionTimers, clearAllTimers]);

  // Initial session check
  useEffect(() => {
    const init = async () => {
      await checkSession();
      setLoading(false);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic session validation
  useEffect(() => {
    if (user) {
      checkIntervalRef.current = setInterval(checkSession, SESSION_CHECK_INTERVAL);
    }
    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [user, checkSession]);

  // Global 401 interceptor
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const res = await originalFetch(...args);
      if (res.status === 401 && user) {
        // Check if session is actually expired
        const session = await authClient.getSession().catch(() => null);
        if (!session?.data?.session) {
          setUser(null);
          setShowWarning(false);
          clearAllTimers();
        }
      }
      return res;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, [user, clearAllTimers]);

  const handleExtendSession = useCallback(async () => {
    try {
      // Calling getSession refreshes the token (Better Auth sliding window)
      const session = await authClient.getSession();
      if (session?.data?.session) {
        const expiresAt = new Date(session.data.session.expiresAt).getTime();
        scheduleSessionTimers(expiresAt);
        setShowWarning(false);
      } else {
        // Session already expired
        setUser(null);
        setShowWarning(false);
        clearAllTimers();
      }
    } catch (error) {
      console.error("Failed to extend session:", error);
      setUser(null);
      setShowWarning(false);
      clearAllTimers();
    }
  }, [scheduleSessionTimers, clearAllTimers]);

  const handleLogoutFromWarning = useCallback(async () => {
    await authClient.signOut();
    setUser(null);
    setShowWarning(false);
    clearAllTimers();
    localStorage.removeItem("gorasa_demo_user");
  }, [clearAllTimers]);

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
    await checkSession();
  };

  const signInDemo = async (email: string) => {
    const DEMO_PASSWORDS: Record<string, string> = {
      "hmittal@gorasa.in": "Admin@123",
      "admin@gorasa.in": "Admin@123",
      "sales@gorasa.in": "Sales@123",
      "neha@corp.in": "User@123",
      "amit@example.com": "User@123",
      "priya@example.com": "User@123",
      "support@gorasa.in": "Support@123",
      "test-booking-flow@gorasa.in": "Test@123",
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
    await checkSession();
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
    setShowWarning(false);
    clearAllTimers();
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
      <SessionWarningModal
        isOpen={showWarning}
        onExtend={handleExtendSession}
        onLogout={handleLogoutFromWarning}
        expiresIn={sessionExpiresIn}
      />
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
