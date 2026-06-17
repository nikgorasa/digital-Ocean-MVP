"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { formatCurrency } from "@/lib";
import { Users, Package, BarChart3, DollarSign, TrendingUp, Activity } from "lucide-react";
import AdminDemoPanel from "@/components/AdminDemoPanel";

interface DashboardStats {
  totalUsers: number;
  activePackages: number;
  totalLeads: number;
  totalBookings: number;
  pendingLeads: number;
  totalRevenue: number;
  roleDistribution: Array<{ role: string; count: number }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-saffron" />
      </div>
    );
  }

  const kpiCards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "bg-blue-500" },
    { label: "Active Packages", value: stats?.activePackages || 0, icon: Package, color: "bg-emerald-500" },
    { label: "Total Leads", value: stats?.totalLeads || 0, icon: BarChart3, color: "bg-purple-500" },
    { label: "Total Bookings", value: stats?.totalBookings || 0, icon: Activity, color: "bg-orange-500" },
    { label: "Pending Leads", value: stats?.pendingLeads || 0, icon: TrendingUp, color: "bg-yellow-500" },
    { label: "Total Revenue", value: formatCurrency(stats?.totalRevenue ?? 0), icon: DollarSign, color: "bg-green-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-slate-900 mb-6">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-5 border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                <card.icon size={20} className="text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-sm text-slate-500">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Role Distribution */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-4">User Role Distribution</h2>
        <div className="space-y-3">
          {stats?.roleDistribution?.map((item) => (
            <div key={item.role} className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">{item.role}</span>
              <span className="text-sm font-bold text-slate-900">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Control Panel */}
      <div className="mt-8">
        <AdminDemoPanel />
      </div>
    </div>
  );
}
