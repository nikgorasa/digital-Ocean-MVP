"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/hooks/useAuth";
import HolidayPlanner from "@/components/HolidayPlanner";

export default function PlannerPage() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <Navbar onLoginClick={() => setShowLogin(true)} />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />

      <main className="min-h-screen pt-16">
        <HolidayPlanner
          userName={user?.name}
          userEmail={user?.email}
        />
      </main>

      <Footer />
    </>
  );
}
