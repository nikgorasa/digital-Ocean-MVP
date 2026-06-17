"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Gift, Star, Coffee, Plane, Crown, Check, Plus, Pencil, Trash2, X, Save, ToggleLeft, ToggleRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import LoginModal from "@/components/LoginModal";

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: string;
  imageColor: string;
  icon: string;
  isActive: boolean;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Coffee: <Coffee size={24} />,
  Star: <Star size={24} />,
  Crown: <Crown size={24} />,
  Plane: <Plane size={24} />,
  Gift: <Gift size={24} />,
};

const ICON_OPTIONS = ["Coffee", "Star", "Crown", "Plane", "Gift"];
const COLOR_OPTIONS = [
  "bg-gradient-to-br from-amber-400 to-orange-500",
  "bg-gradient-to-br from-blue-400 to-indigo-500",
  "bg-gradient-to-br from-green-400 to-emerald-500",
  "bg-gradient-to-br from-purple-400 to-pink-500",
  "bg-gradient-to-br from-red-400 to-rose-500",
  "bg-gradient-to-br from-cyan-400 to-teal-500",
];

interface HistoryEntry {
  action: string;
  points: string;
  date: string;
  type: "earned" | "redeemed";
}

export default function LoyaltyPage() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [allRewards, setAllRewards] = useState<Reward[]>([]);
  const [redeemed, setRedeemed] = useState<string[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Reward>>({});
  const [newReward, setNewReward] = useState({
    name: "",
    description: "",
    pointsCost: 100,
    category: "Travel Perks",
    imageColor: COLOR_OPTIONS[0],
    icon: "Gift",
  });

  const fetchRewards = async () => {
    try {
      const [activeRes, allRes] = await Promise.all([
        fetch("/api/rewards"),
        fetch("/api/rewards?all=true"),
      ]);
      const activeData = await activeRes.json();
      const allData = await allRes.json();
      setRewards(activeData || []);
      setAllRewards(allData || []);
    } catch (err) {
      console.error("Failed to fetch rewards:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!user?.id) { setHistoryLoading(false); return; }
    try {
      const res = await fetch(`/api/loyalty/history?userId=${user.id}`);
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
    setUserPoints(user?.loyaltyPoints ?? 0);
  }, [user]);

  useEffect(() => {
    if (user?.id) fetchHistory();
  }, [user?.id]);

  const handleRedeem = async (rewardId: string) => {
    if (!user) { setShowLogin(true); return; }
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward || (user.loyaltyPoints ?? 0) < reward.pointsCost) return;
    try {
      const res = await fetch(`/api/rewards/${rewardId}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        setRedeemed([...redeemed, rewardId]);
        setUserPoints((prev) => prev - reward.pointsCost);
      }
    } catch (err) {
      console.error("Failed to redeem:", err);
    }
  };

  const createReward = async () => {
    if (!newReward.name || newReward.pointsCost <= 0) return;
    try {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReward),
      });
      if (res.ok) {
        setNewReward({ name: "", description: "", pointsCost: 100, category: "Travel Perks", imageColor: COLOR_OPTIONS[0], icon: "Gift" });
        setShowCreate(false);
        fetchRewards();
      }
    } catch (err) {
      console.error("Failed to create reward:", err);
    }
  };

  const startEdit = (reward: Reward) => {
    setEditingId(reward.id);
    setEditForm({ name: reward.name, description: reward.description, pointsCost: reward.pointsCost, category: reward.category, imageColor: reward.imageColor, icon: reward.icon });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const res = await fetch(`/api/rewards/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingId(null);
        fetchRewards();
      }
    } catch (err) {
      console.error("Failed to update reward:", err);
    }
  };

  const deleteReward = async (id: string) => {
    if (!confirm("Delete this reward?")) return;
    try {
      const res = await fetch(`/api/rewards/${id}`, { method: "DELETE" });
      if (res.ok) fetchRewards();
    } catch (err) {
      console.error("Failed to delete reward:", err);
    }
  };

  const toggleRewardActive = async (reward: Reward) => {
    try {
      const res = await fetch(`/api/rewards/${reward.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !reward.isActive }),
      });
      if (res.ok) fetchRewards();
    } catch (err) {
      console.error("Failed to toggle reward:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-saffron" />
      </div>
    );
  }

  return (
    <div>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-slate-900">Loyalty Club</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAdminMode(!adminMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${
              adminMode ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {adminMode ? "Admin Mode ON" : "Admin Mode"}
          </button>
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl px-4 py-2 text-white">
            <p className="text-xs opacity-80">Available Points</p>
            <p className="text-xl font-bold">{userPoints.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {adminMode ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">{allRewards.length} rewards total</p>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-saffron text-white rounded-xl text-sm font-medium hover:bg-brand-burnt cursor-pointer"
            >
              <Plus size={16} /> Create Reward
            </button>
          </div>

          {showCreate && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 border border-slate-200 mb-6">
              <h3 className="font-bold text-slate-900 mb-4">Create New Reward</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Name *</label>
                  <input value={newReward.name} onChange={(e) => setNewReward({ ...newReward, name: e.target.value })} placeholder="Free Airport Lounge" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Points Cost *</label>
                  <input type="number" value={newReward.pointsCost} onChange={(e) => setNewReward({ ...newReward, pointsCost: Number(e.target.value) })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Category</label>
                  <select value={newReward.category} onChange={(e) => setNewReward({ ...newReward, category: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                    <option>Travel Perks</option>
                    <option>Premium</option>
                    <option>Wellness</option>
                    <option>General</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Icon</label>
                  <select value={newReward.icon} onChange={(e) => setNewReward({ ...newReward, icon: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                    {ICON_OPTIONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Description</label>
                  <input value={newReward.description} onChange={(e) => setNewReward({ ...newReward, description: e.target.value })} placeholder="Enjoy complimentary airport lounge access" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Color</label>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button key={color} onClick={() => setNewReward({ ...newReward, imageColor: color })} className={`w-10 h-10 rounded-xl ${color} ${newReward.imageColor === color ? "ring-2 ring-offset-2 ring-brand-saffron" : ""} cursor-pointer`} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={createReward} className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 cursor-pointer">Create</button>
                <button onClick={() => setShowCreate(false)} className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 cursor-pointer">Cancel</button>
              </div>
            </motion.div>
          )}

          <div className="space-y-3">
            {allRewards.map((reward, i) => (
              <motion.div key={reward.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`bg-white rounded-2xl p-5 border transition-all ${reward.isActive ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
                {editingId === reward.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Name</label>
                        <input value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Points</label>
                        <input type="number" value={editForm.pointsCost || 0} onChange={(e) => setEditForm({ ...editForm, pointsCost: Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Category</label>
                        <select value={editForm.category || ""} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                          <option>Travel Perks</option><option>Premium</option><option>Wellness</option><option>General</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Icon</label>
                        <select value={editForm.icon || ""} onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                          {ICON_OPTIONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 cursor-pointer"><Save size={14} /> Save</button>
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 cursor-pointer">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${reward.imageColor} flex items-center justify-center`}>
                        {ICON_MAP[reward.icon] || <Gift size={24} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{reward.name}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{reward.pointsCost.toLocaleString()} pts</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{reward.category}</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{reward.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleRewardActive(reward)} className="cursor-pointer">
                        {reward.isActive ? <ToggleRight size={32} className="text-green-500" /> : <ToggleLeft size={32} className="text-slate-300" />}
                      </button>
                      <button onClick={() => startEdit(reward)} className="p-2 text-slate-400 hover:text-blue-600 cursor-pointer"><Pencil size={16} /></button>
                      <button onClick={() => deleteReward(reward.id)} className="p-2 text-red-400 hover:text-red-600 cursor-pointer"><Trash2 size={16} /></button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex gap-2 mb-6">
            {["All", "Travel Perks", "Premium", "Wellness"].map((cat) => (
              <button key={cat} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-sm font-medium hover:bg-slate-200 cursor-pointer">{cat}</button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward, i) => {
              const isRedeemed = redeemed.includes(reward.id);
              const canAfford = userPoints >= reward.pointsCost;
              return (
                <motion.div key={reward.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`bg-white rounded-2xl border overflow-hidden transition-all ${isRedeemed ? "border-green-200 bg-green-50/30" : "border-slate-200"}`}>
                  <div className={`p-6 ${reward.imageColor}`}>
                    <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center mb-3">
                      {ICON_MAP[reward.icon] || <Gift size={24} />}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{reward.category}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 mb-1">{reward.name}</h3>
                    <p className="text-sm text-slate-500 mb-3">{reward.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">Points Required</p>
                        <p className="text-lg font-bold text-slate-900">{reward.pointsCost.toLocaleString()}</p>
                      </div>
                      {isRedeemed ? (
                        <div className="flex items-center gap-1.5 px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium"><Check size={16} /> Redeemed</div>
                      ) : (
                        <button onClick={() => handleRedeem(reward.id)} disabled={!canAfford} className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${canAfford ? "bg-brand-saffron text-white hover:bg-brand-burnt" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
                          {canAfford ? "Redeem" : "Insufficient"}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 bg-white rounded-2xl p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Points History</h2>
            {historyLoading ? (
              <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-saffron" /></div>
            ) : history.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No points history yet. Book a trip to start earning!</p>
            ) : (
              <div className="space-y-3">
                {history.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-sm text-slate-900">{entry.action}</p>
                      <p className="text-xs text-slate-400">{new Date(entry.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <span className={`font-mono font-bold ${entry.type === "earned" ? "text-green-600" : "text-red-500"}`}>{entry.points}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
