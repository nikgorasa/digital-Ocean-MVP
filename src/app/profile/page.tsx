"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib";
import { motion } from "motion/react";
import {
  User, Mail, Shield, Star, CreditCard, Heart, Settings,
  Plus, Trash2, Copy, Check, Gift, Plane, Building2, Palmtree, Loader2
} from "lucide-react";

const TABS = [
  { id: "details", label: "Personal Info", icon: User },
  { id: "passengers", label: "Saved Travellers", icon: User },
  { id: "preferences", label: "Preferences", icon: Settings },
  { id: "loyalty", label: "Loyalty & Referrals", icon: Star },
  { id: "wishlist", label: "Wishlist", icon: Heart },
];

interface Passenger {
  id: string;
  name: string;
  relation: string;
  gender: string;
  passport: string;
  pan: string;
}

interface WishlistItem {
  id: string;
  name: string;
  type: string;
  price: number;
  imageUrl: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // Passengers state
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [newPassenger, setNewPassenger] = useState({ name: "", relation: "", gender: "Male", passport: "", pan: "" });
  const [showAddPassenger, setShowAddPassenger] = useState(false);

  // Preferences state
  const [preferences, setPreferences] = useState({
    meal: "Vegetarian",
    seat: "Window",
    hotel: "Deluxe Suite",
    carrier: "Indigo",
    whatsapp: true,
    email: true,
    sms: false,
  });

  // Option lists state
  const [mealOptions, setMealOptions] = useState<string[]>(["Vegetarian", "Non-Vegetarian", "Vegan", "Jain"]);
  const [seatOptions, setSeatOptions] = useState<string[]>(["Window", "Aisle", "Middle"]);
  const [hotelOptions, setHotelOptions] = useState<string[]>(["Deluxe Suite", "Presidential Suite", "Royal Suite", "Standard Room"]);
  const [carrierOptions, setCarrierOptions] = useState<string[]>(["Indigo", "Air India", "SpiceJet", "Vistara"]);

  // Wishlist state
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  const saveProfile = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-email": user?.email || "" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!user?.email) return;
    setLoading(true);
    fetch("/api/profile", { headers: { "x-user-email": user.email } })
      .then((res) => res.json())
      .then((data) => {
        if (data.passengers) setPassengers(data.passengers);
        if (data.preferences) setPreferences(data.preferences);
        if (data.wishlist) setWishlist(data.wishlist);
        setEditName(data.name || "");
        setEditEmail(data.email || "");
      })
      .catch((err) => console.error("Profile load error:", err))
      .finally(() => setLoading(false));
  }, [user?.email]);

  useEffect(() => {
    fetch("/api/preferences/options")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const byCategory: Record<string, string[]> = {};
          data.forEach((opt: { category: string; value: string }) => {
            if (!byCategory[opt.category]) byCategory[opt.category] = [];
            byCategory[opt.category].push(opt.value);
          });
          if (byCategory.meal) setMealOptions(byCategory.meal);
          if (byCategory.seat) setSeatOptions(byCategory.seat);
          if (byCategory.hotel) setHotelOptions(byCategory.hotel);
          if (byCategory.carrier) setCarrierOptions(byCategory.carrier);
        }
      })
      .catch(() => {});
  }, []);

  const referralCode = user?.name ? `GORASA-${user.name.split(" ")[0].toUpperCase()}` : "GORASA-USER";

  const copyReferral = () => {
    navigator.clipboard.writeText(`https://cckr.vercel.app?ref=${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addPassenger = () => {
    if (newPassenger.name) {
      const updated = [...passengers, { ...newPassenger, id: Date.now().toString() }];
      setPassengers(updated);
      saveProfile({ passengers: updated });
      setNewPassenger({ name: "", relation: "", gender: "Male", passport: "", pan: "" });
      setShowAddPassenger(false);
    }
  };

  const removePassenger = (id: string) => {
    const updated = passengers.filter((p) => p.id !== id);
    setPassengers(updated);
    saveProfile({ passengers: updated });
  };

  const removeWishlistItem = (id: string) => {
    const updated = wishlist.filter((w) => w.id !== id);
    setWishlist(updated);
    saveProfile({ wishlist: updated });
  };

  if (!user) {
    return (
      <>
        <Navbar onLoginClick={() => setShowLogin(true)} />
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
        <main className="min-h-screen pt-16 bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <User size={48} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Sign in to view profile</h2>
            <button
              onClick={() => setShowLogin(true)}
              className="px-6 py-2.5 bg-brand-saffron text-white rounded-xl font-semibold text-sm hover:bg-brand-burnt transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar onLoginClick={() => setShowLogin(true)} />
        <main className="min-h-screen pt-16 bg-slate-50 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-brand-saffron" />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar onLoginClick={() => setShowLogin(true)} />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />

      <main className="min-h-screen pt-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Profile Header */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-6">
              <div className="flex items-center gap-4">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">{user.name?.[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-serif font-bold text-slate-900">{user.name}</h1>
                  <p className="text-slate-500">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-orange-100 text-brand-saffron rounded-full text-xs font-bold">{user.role}</span>
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">{user.loyaltyTier}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-brand-saffron text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              {/* Details Tab */}
              {activeTab === "details" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
                    {saved && <span className="text-xs text-green-600 font-medium">Saved!</span>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Full Name</label>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => editName !== user.name && saveProfile({ name: editName })}
                        className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 font-medium mt-1 focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</label>
                      <input
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        onBlur={() => editEmail !== user.email && saveProfile({ email: editEmail })}
                        className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 font-medium mt-1 focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Role</label>
                      <p className="text-slate-900 font-medium mt-1">{user.role}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loyalty Tier</label>
                      <p className="text-slate-900 font-medium mt-1">{user.loyaltyTier}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loyalty Points</label>
                      <p className="text-slate-900 font-medium mt-1">{user.loyaltyPoints?.toLocaleString() ?? "0"}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Wallet Balance</label>
                      <p className="text-slate-900 font-medium mt-1">{formatCurrency(user.walletBalance)}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Passport Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Passport Number</label>
                        <p className="text-slate-900 font-medium mt-1">Not added</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Expiry</label>
                        <p className="text-slate-900 font-medium mt-1">Not added</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Country</label>
                        <p className="text-slate-900 font-medium mt-1">India</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Passengers Tab */}
              {activeTab === "passengers" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900">Saved Travellers</h2>
                    <button
                      onClick={() => setShowAddPassenger(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-brand-saffron text-white rounded-xl text-sm font-medium hover:bg-brand-burnt cursor-pointer"
                    >
                      <Plus size={16} />
                      Add Traveller
                    </button>
                  </div>

                  {showAddPassenger && (
                    <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <input
                          placeholder="Full Name"
                          value={newPassenger.name}
                          onChange={(e) => setNewPassenger({ ...newPassenger, name: e.target.value })}
                          className="px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none transition-all"
                        />
                        <input
                          placeholder="Relation"
                          value={newPassenger.relation}
                          onChange={(e) => setNewPassenger({ ...newPassenger, relation: e.target.value })}
                          className="px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none transition-all"
                        />
                        <select
                          value={newPassenger.gender}
                          onChange={(e) => setNewPassenger({ ...newPassenger, gender: e.target.value })}
                          className="px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none transition-all"
                        >
                          <option>Male</option>
                          <option>Female</option>
                        </select>
                        <input
                          placeholder="Passport No."
                          value={newPassenger.passport}
                          onChange={(e) => setNewPassenger({ ...newPassenger, passport: e.target.value })}
                          className="px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none transition-all"
                        />
                        <input
                          placeholder="PAN No."
                          value={newPassenger.pan}
                          onChange={(e) => setNewPassenger({ ...newPassenger, pan: e.target.value.toUpperCase() })}
                          className="px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none transition-all font-mono uppercase"
                          maxLength={10}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={addPassenger} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium cursor-pointer">Save</button>
                        <button onClick={() => setShowAddPassenger(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium cursor-pointer">Cancel</button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {passengers.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="text-sm text-slate-500">{p.relation} • {p.gender} • PAN: {p.pan || "N/A"} • Passport: {p.passport || "N/A"}</p>
                        </div>
                        <button onClick={() => removePassenger(p.id)} className="p-2 text-red-400 hover:text-red-600 cursor-pointer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === "preferences" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">Travel Preferences</h2>
                    {saved && <span className="text-xs text-green-600 font-medium">Saved!</span>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Meal Preference</label>
                      <select
                        value={preferences.meal}
                        onChange={(e) => {
                          const updated = { ...preferences, meal: e.target.value };
                          setPreferences(updated);
                          saveProfile({ preferences: updated });
                        }}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      >
                        {mealOptions.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Seat Preference</label>
                      <select
                        value={preferences.seat}
                        onChange={(e) => {
                          const updated = { ...preferences, seat: e.target.value };
                          setPreferences(updated);
                          saveProfile({ preferences: updated });
                        }}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      >
                        {seatOptions.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Hotel Suite Category</label>
                      <select
                        value={preferences.hotel}
                        onChange={(e) => {
                          const updated = { ...preferences, hotel: e.target.value };
                          setPreferences(updated);
                          saveProfile({ preferences: updated });
                        }}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      >
                        {hotelOptions.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Preferred Carrier</label>
                      <select
                        value={preferences.carrier}
                        onChange={(e) => {
                          const updated = { ...preferences, carrier: e.target.value };
                          setPreferences(updated);
                          saveProfile({ preferences: updated });
                        }}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      >
                        {carrierOptions.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Notification Preferences</h3>
                    <div className="space-y-3">
                      {[
                        { key: "whatsapp", label: "WhatsApp Notifications" },
                        { key: "email", label: "Email Notifications" },
                        { key: "sms", label: "SMS Notifications" },
                      ].map((n) => (
                        <label key={n.key} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences[n.key as keyof typeof preferences] as boolean}
                            onChange={(e) => {
                              const updated = { ...preferences, [n.key]: e.target.checked };
                              setPreferences(updated);
                              saveProfile({ preferences: updated });
                            }}
                            className="w-4 h-4 text-brand-saffron rounded"
                          />
                          <span className="text-sm text-slate-700">{n.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Loyalty Tab */}
              {activeTab === "loyalty" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-slate-900">Loyalty & Referrals</h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-5 text-white">
                      <p className="text-xs opacity-80 uppercase tracking-wider">Loyalty Tier</p>
                      <p className="text-2xl font-bold mt-1">{user.loyaltyTier}</p>
                    </div>
                    <div className="bg-slate-900 rounded-2xl p-5 text-white">
                      <p className="text-xs opacity-80 uppercase tracking-wider">Points Balance</p>
                      <p className="text-2xl font-bold mt-1">{user.loyaltyPoints?.toLocaleString()}</p>
                    </div>
                    <div className="bg-green-600 rounded-2xl p-5 text-white">
                      <p className="text-xs opacity-80 uppercase tracking-wider">Wallet Balance</p>
                      <p className="text-2xl font-bold mt-1">{formatCurrency(user.walletBalance)}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-slate-900 mb-2">Referral Program</h3>
                    <p className="text-sm text-slate-500 mb-3">Share your referral link and earn 500 points for each friend who books.</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none transition-all font-mono text-slate-700">
                        https://cckr.vercel.app?ref={referralCode}
                      </code>
                      <button
                        onClick={copyReferral}
                        className="px-4 py-2 bg-brand-saffron text-white rounded-lg text-sm font-medium cursor-pointer flex items-center gap-1"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                    <div className="flex items-center gap-3">
                      <Gift size={24} className="text-brand-saffron" />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Birthday Reward</h3>
                        <p className="text-xs text-slate-500">Claim 500 bonus points on your birthday!</p>
                      </div>
                      <button className="ml-auto px-4 py-2 bg-brand-saffron text-white rounded-lg text-sm font-medium cursor-pointer">
                        Claim
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Wishlist Tab */}
              {activeTab === "wishlist" && (
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Travel Wishlist</h2>
                  {wishlist.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart size={48} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500">Your wishlist is empty. Browse packages to add favorites!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {wishlist.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                          <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                          <div className="flex-1">
                            <p className="font-bold text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.type}</p>
                            <p className="text-sm font-bold text-brand-saffron mt-1">{formatCurrency(item.price)}</p>
                          </div>
                          <button onClick={() => removeWishlistItem(item.id)} className="p-2 text-red-400 hover:text-red-600 cursor-pointer">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </>
  );
}
