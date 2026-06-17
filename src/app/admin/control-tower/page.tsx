"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  Users,
  Package,
  BarChart3,
  DollarSign,
  Activity,
  Ticket,
  Bot,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalUsers: number;
  activePackages: number;
  totalLeads: number;
  totalBookings: number;
  pendingLeads: number;
  totalRevenue: number;
}

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  escalated: number;
  resolved: number;
}

export default function ControlTowerPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [ticketStats, setTicketStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/tickets?stats=true").then((r) => r.json()).catch(() => null),
    ]).then(([dashboard, tickets]) => {
      setStats(dashboard);
      setTicketStats(tickets);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-saffron" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-6 h-6 text-orange-500" />
        <h1 className="text-2xl font-serif font-bold text-slate-900">Control Tower</h1>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Users", value: stats?.totalUsers || 0, icon: Users, color: "bg-blue-500", href: "/admin/users" },
          { label: "Packages", value: stats?.activePackages || 0, icon: Package, color: "bg-emerald-500", href: "/admin/packages" },
          { label: "Leads", value: stats?.totalLeads || 0, icon: BarChart3, color: "bg-purple-500", href: "/admin/leads" },
          { label: "Revenue", value: `₹${((stats?.totalRevenue || 0) / 1000).toFixed(0)}K`, icon: DollarSign, color: "bg-green-500", href: "/admin" },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link href={card.href} className="block bg-white rounded-2xl p-5 border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                  <card.icon size={20} className="text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
              <p className="text-sm text-slate-500">{card.label}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Ticket Overview */}
      {ticketStats && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-orange-500" />
              Support Tickets
            </h2>
            <Link href="/admin/tickets" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total", value: ticketStats.total, color: "text-slate-900" },
              { label: "Open", value: ticketStats.open, color: "text-blue-600" },
              { label: "In Progress", value: ticketStats.inProgress, color: "text-yellow-600" },
              { label: "Escalated", value: ticketStats.escalated, color: "text-red-600" },
              { label: "Resolved", value: ticketStats.resolved, color: "text-green-600" },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 bg-slate-50 rounded-xl">
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "AI Planner Leads", desc: "View leads from AI Holiday Planner", icon: Bot, href: "/admin/ai-leads", color: "bg-orange-50 text-orange-700" },
          { label: "Support Tickets", desc: "Manage customer support tickets", icon: Ticket, href: "/admin/tickets", color: "bg-blue-50 text-blue-700" },
          { label: "Lead Pipeline", desc: "Manage sales pipeline", icon: Activity, href: "/admin/leads", color: "bg-purple-50 text-purple-700" },
        ].map((action, i) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
          >
            <Link href={action.href} className={`block p-5 rounded-2xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all ${action.color}`}>
              <action.icon className="w-8 h-8 mb-3" />
              <h3 className="font-bold text-sm mb-1">{action.label}</h3>
              <p className="text-xs opacity-70">{action.desc}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
