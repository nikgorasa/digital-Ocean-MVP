"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { formatCurrency } from "@/lib";
import {
  Users, Search, X, Save, Shield, User, Mail,
  Wallet, Award, Building2, Calendar, ToggleLeft, ToggleRight,
  ChevronDown, BarChart3
} from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
  companyId: string | null;
  company?: { name: string } | null;
  walletBalance: number;
  loyaltyPoints: number;
  loyaltyTier: string;
  isActive: boolean;
  createdAt: string;
}

const ROLE_COLORS: Record<string, string> = {
  CUSTOMER: "bg-blue-100 text-blue-700",
  CORPORATE_USER: "bg-cyan-100 text-cyan-700",
  SALES: "bg-amber-100 text-amber-700",
  ADMIN: "bg-purple-100 text-purple-700",
  SUPER_ADMIN: "bg-red-100 text-red-700",
};

const ALL_ROLES = ["CUSTOMER", "CORPORATE_USER", "SALES", "ADMIN", "SUPER_ADMIN"];

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ active: 0, admins: 0, customers: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; email: string; role: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "CUSTOMER" });
  const [createdPassword, setCreatedPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const limit = 20;

  const createUser = async () => {
    if (!newUser.name || !newUser.email) return;
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedPassword(data.tempPassword || "");
        setNewUser({ name: "", email: "", role: "CUSTOMER" });
        fetchUsers();
      }
    } catch (err) {
      console.error("Failed to create user:", err);
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setCounts(data.counts || { active: 0, admins: 0, customers: 0 });
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const openUserDetail = (user: UserItem) => {
    setSelectedUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role });
  };

  const toggleActive = async (user: UserItem) => {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, isActive: !user.isActive }),
      });
      if (res.ok) {
        setUsers(users.map((u) => (u.id === user.id ? { ...u, isActive: !user.isActive } : u)));
        if (selectedUser?.id === user.id) setSelectedUser({ ...selectedUser, isActive: !user.isActive });
      }
    } catch (err) {
      console.error("Failed to toggle user:", err);
    }
  };

  const updateUser = async () => {
    if (!selectedUser || !editForm) return;
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUser.id,
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
        }),
      });
      if (res.ok) {
        setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, ...editForm } : u)));
        setSelectedUser({ ...selectedUser, ...editForm });
        setSelectedUser(null);
      }
    } catch (err) {
      console.error("Failed to update user:", err);
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-saffron" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-slate-900">User Management</h1>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-saffron/20"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
        >
          <option value="">All Roles</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>{r.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Users", value: total, color: "text-slate-900" },
          { label: "Active", value: counts.active, color: "text-green-600" },
          { label: "Admins", value: counts.admins, color: "text-purple-600" },
          { label: "Customers", value: counts.customers, color: "text-blue-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 border border-slate-200 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* User List */}
      {users.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Users size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">No users found</h2>
          <p className="text-slate-500">
            {search ? "Try a different search term" : "No users registered yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">User</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Role</th>
                    <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Wallet</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Points</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => openUserDetail(user)}
                      className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-saffron to-brand-burnt flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role] || "bg-slate-100 text-slate-600"}`}>
                          {user.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${user.isActive ? "bg-green-500" : "bg-slate-300"}`} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">{formatCurrency(user.walletBalance)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">{user.loyaltyPoints.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-400 text-xs">
                        {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-xl disabled:opacity-30 cursor-pointer"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-xl disabled:opacity-30 cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSelectedUser(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white rounded-2xl w-full max-w-lg mx-4 shadow-xl border border-slate-200"
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-900">User Details</h2>
              <button onClick={() => setSelectedUser(null)} className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Avatar & Name */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-saffron to-brand-burnt flex items-center justify-center text-white text-xl font-bold shrink-0">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{selectedUser.name}</p>
                  <p className="text-sm text-slate-500">{selectedUser.email}</p>
                </div>
                <button
                  onClick={() => toggleActive(selectedUser)}
                  className="ml-auto cursor-pointer"
                >
                  {selectedUser.isActive ? (
                    <ToggleRight size={36} className="text-green-500" />
                  ) : (
                    <ToggleLeft size={36} className="text-slate-300" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Wallet size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Wallet</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(selectedUser.walletBalance)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Award size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Loyalty</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{selectedUser.loyaltyPoints.toLocaleString()} pts</p>
                  <p className="text-xs text-slate-500">{selectedUser.loyaltyTier}</p>
                </div>
                {selectedUser.company && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Building2 size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Company</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{selectedUser.company.name}</p>
                  </div>
                )}
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Calendar size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Joined</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {new Date(selectedUser.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Edit Form */}
              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Shield size={16} />
                  Edit User
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Name</label>
                    <input
                      value={editForm?.name || ""}
                      onChange={(e) => setEditForm(editForm ? { ...editForm, name: e.target.value } : null)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Email</label>
                    <input
                      value={editForm?.email || ""}
                      onChange={(e) => setEditForm(editForm ? { ...editForm, email: e.target.value } : null)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Role</label>
                    <select
                      value={editForm?.role || ""}
                      onChange={(e) => setEditForm(editForm ? { ...editForm, role: e.target.value } : null)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    >
                      {ALL_ROLES.map((r) => (
                        <option key={r} value={r}>{r.replace("_", " ")}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2 rounded-b-2xl">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={updateUser}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-saffron text-white rounded-xl text-sm font-medium hover:bg-brand-burnt disabled:opacity-50 cursor-pointer"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-4">Add New User</h3>
            <div className="space-y-4 mb-4">
              <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Name</label><input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full Name" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
              <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Email</label><input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@example.com" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
              <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Role</label><select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"><option value="CUSTOMER">Customer</option><option value="CORPORATE_USER">Corporate User</option><option value="SALES">Sales</option><option value="ADMIN">Admin</option></select></div>
            </div>
            <div className="flex gap-2">
              <button onClick={createUser} className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 cursor-pointer">Create User</button>
              <button onClick={() => { setShowCreate(false); setCreatedPassword(""); }} className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Created Password Display */}
      {createdPassword && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setCreatedPassword("")} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 text-xl">✓</span>
            </div>
            <h3 className="font-bold text-slate-900 mb-2">User Created</h3>
            <p className="text-sm text-slate-500 mb-4">Share this temporary password with the user:</p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-4">
              <code className="font-mono text-lg font-bold text-slate-900">{createdPassword}</code>
            </div>
            <p className="text-xs text-slate-400 mb-4">They should change this password on first login.</p>
            <button onClick={() => setCreatedPassword("")} className="w-full py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 cursor-pointer">Done</button>
          </div>
        </div>
      )}

    </div>
  );
}
