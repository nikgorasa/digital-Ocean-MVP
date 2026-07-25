"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/hooks/useAuth";
import { X, Mail, Lock, User, Info } from "lucide-react";
import FormInput from "./ui/FormInput";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegistering) {
        await signUpWithEmail(email, password, name);
        setError("Registration successful! Please check your email to verify your account.");
      } else {
        await signInWithEmail(email, password);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-title"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8 border border-slate-100 max-h-[90vh] overflow-y-auto"
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-6 right-6 p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer rounded-xl hover:bg-slate-100"
          >
            <X size={20} />
          </button>

          <div className="mb-6">
            <span className="text-brand-saffron font-bold uppercase tracking-widest text-[11px] bg-orange-50 px-3 py-1 rounded-full">
              GoRASA Gateway
            </span>
            <h2 id="login-title" className="text-3xl font-serif font-bold text-slate-900 mt-3 mb-2">
              {isRegistering ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-slate-500 text-sm">
              {isRegistering
                ? "Create your GoRASA account to start exploring luxury travel."
                : "Sign in to unlock live pricing, corporate wallets, and premium loyalty."}
            </p>
          </div>

          {error && (
            <div className={`mb-4 p-3 rounded-xl text-sm flex items-start gap-2 ${error.includes("successful") ? "bg-green-50 border border-green-200 text-green-600" : "bg-red-50 border border-red-200 text-red-600"}`} role="alert">
              {error}
            </div>
          )}
          {info && (
            <div className="mb-4 p-3 rounded-xl text-sm flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-700" role="status">
              <Info size={16} className="shrink-0 mt-0.5" />
              <span>{info}</span>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 rounded-xl font-semibold text-slate-700 transition-all hover:shadow-lg disabled:opacity-50 cursor-pointer group"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Sign in with Google</span>
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegistering && (
              <FormInput
                id="login-name"
                label="Full Name"
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                icon={User}
                autoComplete="name"
              />
            )}
            <FormInput
              id="login-email"
              label="Email"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              icon={Mail}
              autoComplete="email"
              autoFocus
            />
            <FormInput
              id="login-password"
              label="Password"
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              icon={Lock}
              autoComplete={isRegistering ? "new-password" : "current-password"}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-saffron text-white rounded-xl font-bold hover:bg-brand-burnt transition-colors shadow-lg disabled:opacity-50 cursor-pointer text-sm"
            >
              {loading ? "Loading..." : isRegistering ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="mt-3 text-center space-y-2">
            {!isRegistering && (
              <button
                type="button"
                onClick={() => { setInfo("Password reset is available via the API. Contact support for assistance."); setError(""); }}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Forgot password?
              </button>
            )}
            <button
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setError(""); }}
              className="text-sm text-brand-saffron hover:text-brand-burnt font-medium cursor-pointer"
            >
              {isRegistering ? "Already have an account? Sign in" : "Don't have an account? Register"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
