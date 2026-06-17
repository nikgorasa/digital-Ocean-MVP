"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LoginModal from "@/components/LoginModal";
import { useRouter } from "next/navigation";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const [showModal, setShowModal] = useState(true);

  const handleClose = () => {
    setShowModal(false);
    router.push(redirect);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <LoginModal isOpen={showModal} onClose={handleClose} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-saffron" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
