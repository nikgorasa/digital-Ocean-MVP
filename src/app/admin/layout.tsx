"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import LoginModal from "@/components/LoginModal";
import Link from "next/link";
import { LayoutDashboard, BarChart3, Package, Tag, Star, Building2, Users, Settings, DollarSign, TrendingUp, Bot, Ticket, FileText } from "lucide-react";

const ADMIN_ICONS: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard size={18} />,
  BarChart3: <BarChart3 size={18} />,
  Package: <Package size={18} />,
  Tag: <Tag size={18} />,
  Star: <Star size={18} />,
  Building2: <Building2 size={18} />,
  Users: <Users size={18} />,
  Settings: <Settings size={18} />,
  DollarSign: <DollarSign size={18} />,
  TrendingUp: <TrendingUp size={18} />,
  Bot: <Bot size={18} />,
  Ticket: <Ticket size={18} />,
  FileText: <FileText size={18} />,
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [adminNav, setAdminNav] = useState<{ href: string; label: string; icon: string }[]>([]);

  useEffect(() => {
    fetch("/api/navigation")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const adminItems = data.filter((i: { section: string }) => i.section === "admin");
          // Filter nav items based on user role
          const filtered = adminItems.filter((item: { requiredRole?: string }) => {
            if (!item.requiredRole) return true; // No role required = show to all
            if (user?.role === "SUPER_ADMIN") return true; // Super admin sees everything
            return item.requiredRole === user?.role;
          });
          setAdminNav(filtered);
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      setShowLogin(true);
    }
  }, [loading, user]);

  useEffect(() => {
    if (!loading && user && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "CUSTOMER_SUPPORT") {
      router.push("/");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-saffron" />
      </div>
    );
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "CUSTOMER_SUPPORT")) {
    return (
      <>
        <Navbar onLoginClick={() => setShowLogin(true)} />
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
        <main className="min-h-screen pt-16 bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <Settings size={48} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-500">You need admin privileges to access this area.</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar onLoginClick={() => setShowLogin(true)} />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />

      <main className="min-h-screen pt-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar */}
            <aside className="md:w-56 shrink-0">
              <nav className="bg-white rounded-2xl border border-slate-200 p-3 sticky top-24">
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Admin Panel
                </p>
                {adminNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    {ADMIN_ICONS[item.icon] || item.icon}
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/admin/blog"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <FileText size={18} />
                  Blog
                </Link>
              </nav>
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        </div>
      </main>
    </>
  );
}
