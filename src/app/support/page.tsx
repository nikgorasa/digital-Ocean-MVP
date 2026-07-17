"use client";

import React, { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Volume2,
  VolumeX,
  Phone,
  ExternalLink,
  Ticket,
  Plus,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TicketCategory, TicketPriority } from "@/lib/ticket/types";
import Breadcrumb, { BreadcrumbJsonLd } from "@/components/Breadcrumb";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

interface UserTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
}

type Tab = "chat" | "tickets";

async function getAIResponse(query: string, categories: { id: string; label: string; keywords: string }[]): Promise<string> {
  const lower = query.toLowerCase();
  let matchedId = "default";
  for (const cat of categories) {
    const kws: string[] = JSON.parse(cat.keywords || "[]");
    if (kws.some((k) => lower.includes(k))) { matchedId = cat.id; break; }
  }
  try {
    const res = await fetch(`/api/faq?keyword=${matchedId}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) return data[0].answer;
  } catch {}
  return "I'm the GoRASA AI Concierge! I can help you with flights, hotels, packages, and more. What would you like to know?";
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  open: <AlertCircle size={14} className="text-blue-500" />,
  in_progress: <Clock size={14} className="text-yellow-500" />,
  resolved: <CheckCircle2 size={14} className="text-green-500" />,
  closed: <CheckCircle2 size={14} className="text-slate-400" />,
  escalated: <AlertCircle size={14} className="text-red-500" />,
  pending: <Clock size={14} className="text-purple-500" />,
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-slate-100 text-slate-500",
  escalated: "bg-red-100 text-red-700",
  pending: "bg-purple-100 text-purple-700",
};

export default function SupportPage() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "ai",
      text: "Welcome to GoRASA AI Support! 🌴 I'm here to help you with flights, hotels, packages, and more. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [faqCategories, setFaqCategories] = useState<{ id: string; label: string; keywords: string }[]>([]);
  const [siteConfig, setSiteConfig] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ticket state
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketCategory, setTicketCategory] = useState<TicketCategory>("general");
  const [ticketPriority, setTicketPriority] = useState<TicketPriority>("medium");
  const [ticketBookingRef, setTicketBookingRef] = useState("");
  const [ticketPhone, setTicketPhone] = useState("");
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [userTickets, setUserTickets] = useState<UserTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    Promise.all([
      fetch("/api/faq/categories").then(r => r.json()),
      fetch("/api/site-config").then(r => r.json()),
    ]).then(([cats, config]) => {
      if (Array.isArray(cats)) setFaqCategories(cats);
      if (config && !config.error) setSiteConfig(config);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === "tickets" && user) {
      fetchUserTickets();
    }
  }, [activeTab, user]);

  const fetchUserTickets = async () => {
    if (!user) return;
    setTicketsLoading(true);
    try {
      const res = await fetch(`/api/tickets?userId=${user.id}`);
      const data = await res.json();
      if (Array.isArray(data)) setUserTickets(data);
    } catch {}
    setTicketsLoading(false);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const response = await getAIResponse(text, faqCategories);
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: "ai",
      text: response,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMsg]);
    setIsTyping(false);
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ""));
      utterance.lang = "en-IN";
      utterance.rate = 1;
      speechSynthesis.speak(utterance);
      setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setSpeaking(false);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowLogin(true);
      return;
    }

    setTicketError(null);
    setTicketSuccess(null);
    setTicketSubmitting(true);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: ticketSubject,
          description: ticketDescription,
          category: ticketCategory,
          priority: ticketPriority,
          userId: user.id,
          userName: user.name || user.email,
          userEmail: user.email,
          userPhone: ticketPhone || undefined,
          bookingRef: ticketBookingRef || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create ticket");
      }

      setTicketSuccess(data.id);
      setTicketSubject("");
      setTicketDescription("");
      setTicketCategory("general");
      setTicketPriority("medium");
      setTicketBookingRef("");
      setTicketPhone("");
      fetchUserTickets();
    } catch (err) {
      setTicketError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setTicketSubmitting(false);
    }
  };

  return (
    <>
      <Navbar onLoginClick={() => setShowLogin(true)} />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />

      <main className="min-h-screen pt-16 bg-slate-50">
        <BreadcrumbJsonLd items={[
          { name: "Home", href: "/" },
          { name: "Support", href: "/support" },
        ]} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb items={[
            { name: "Home", href: "/" },
            { name: "Support", href: "/support" },
          ]} />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-saffron flex items-center justify-center">
                <MessageSquare size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-slate-900">Support Center</h1>
                <p className="text-sm text-slate-500">AI Concierge & Ticket Support</p>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-slate-200 w-fit">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === "chat"
                    ? "bg-brand-saffron text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <MessageSquare size={16} />
                AI Chat
              </button>
              <button
                onClick={() => setActiveTab("tickets")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === "tickets"
                    ? "bg-brand-saffron text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Ticket size={16} />
                My Tickets
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Main Content */}
              <div className="md:col-span-3">
                <AnimatePresence mode="wait">
                  {activeTab === "chat" ? (
                    <motion.div
                      key="chat"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col" style={{ height: "500px" }}>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                              <div className={`flex items-start gap-2 max-w-[80%] ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                  msg.sender === "user" ? "bg-brand-saffron" : "bg-slate-900"
                                }`}>
                                  {msg.sender === "user" ? (
                                    <User size={16} className="text-white" />
                                  ) : (
                                    <Bot size={16} className="text-white" />
                                  )}
                                </div>
                                <div className={`rounded-2xl px-4 py-3 ${
                                  msg.sender === "user"
                                    ? "bg-brand-saffron text-white"
                                    : "bg-slate-100 text-slate-900"
                                }`}>
                                  <p className="text-sm whitespace-pre-line">{msg.text}</p>
                                  {msg.sender === "ai" && (
                                    <button
                                      onClick={() => speaking ? stopSpeaking() : speakText(msg.text)}
                                      className="mt-2 text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                                    >
                                      {speaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                                      {speaking ? "Stop" : "Hear response"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {isTyping && (
                            <div className="flex items-start gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
                                <Bot size={16} className="text-white" />
                              </div>
                              <div className="bg-slate-100 rounded-2xl px-4 py-3">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                                </div>
                              </div>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Replies */}
                        <div className="px-4 py-2 border-t border-slate-100 flex gap-2 overflow-x-auto">
                          {faqCategories.map((qr) => (
                            <button
                              key={qr.id}
                              onClick={() => sendMessage(qr.label)}
                              className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium hover:bg-slate-200 whitespace-nowrap cursor-pointer"
                            >
                              {qr.label}
                            </button>
                          ))}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-slate-200">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              sendMessage(input);
                            }}
                            className="flex gap-2"
                          >
                            <input
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              placeholder="Type your message..."
                              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-saffron outline-none"
                            />
                            <button
                              type="submit"
                              disabled={!input.trim()}
                              className="px-4 py-2.5 bg-brand-saffron text-white rounded-xl hover:bg-brand-burnt transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <Send size={18} />
                            </button>
                          </form>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="tickets"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      {/* Create Ticket Form */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Plus size={18} className="text-brand-saffron" />
                          <h2 className="font-bold text-slate-900">Create Support Ticket</h2>
                        </div>

                        {!user ? (
                          <div className="text-center py-8">
                            <p className="text-sm text-slate-500 mb-3">Sign in to create a support ticket</p>
                            <button
                              onClick={() => setShowLogin(true)}
                              className="px-4 py-2 bg-brand-saffron text-white rounded-xl text-sm font-medium hover:bg-brand-burnt transition-colors cursor-pointer"
                            >
                              Sign In
                            </button>
                          </div>
                        ) : ticketSuccess ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-8"
                          >
                            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
                            <p className="font-bold text-slate-900 mb-1">Ticket Created!</p>
                            <p className="text-sm text-slate-500 mb-1">Ticket ID: <span className="font-mono text-xs">{ticketSuccess.slice(0, 8)}...</span></p>
                            <p className="text-xs text-slate-400 mb-4">Our team will review and respond within 24 hours.</p>
                            <button
                              onClick={() => setTicketSuccess(null)}
                              className="px-4 py-2 bg-brand-saffron text-white rounded-xl text-sm font-medium hover:bg-brand-burnt transition-colors cursor-pointer"
                            >
                              Create Another
                            </button>
                          </motion.div>
                        ) : (
                          <form onSubmit={handleCreateTicket} className="space-y-4">
                            {ticketError && (
                              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                                {ticketError}
                              </div>
                            )}

                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Subject *</label>
                              <input
                                value={ticketSubject}
                                onChange={(e) => setTicketSubject(e.target.value)}
                                placeholder="Brief summary of your issue"
                                required
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-saffron outline-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Category *</label>
                                <select
                                  value={ticketCategory}
                                  onChange={(e) => setTicketCategory(e.target.value as TicketCategory)}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-saffron outline-none cursor-pointer"
                                >
                                  {TICKET_CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Priority</label>
                                <select
                                  value={ticketPriority}
                                  onChange={(e) => setTicketPriority(e.target.value as TicketPriority)}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-saffron outline-none cursor-pointer"
                                >
                                  {TICKET_PRIORITIES.map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Description *</label>
                              <textarea
                                value={ticketDescription}
                                onChange={(e) => setTicketDescription(e.target.value)}
                                placeholder="Describe your issue in detail..."
                                required
                                rows={4}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-saffron outline-none resize-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Booking Ref (optional)</label>
                                <input
                                  value={ticketBookingRef}
                                  onChange={(e) => setTicketBookingRef(e.target.value)}
                                  placeholder="e.g. GR-12345"
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-saffron outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Phone (optional)</label>
                                <input
                                  value={ticketPhone}
                                  onChange={(e) => setTicketPhone(e.target.value)}
                                  placeholder="+91 XXXXX XXXXX"
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-saffron outline-none"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={ticketSubmitting || !ticketSubject.trim() || !ticketDescription.trim()}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-saffron text-white rounded-xl font-medium hover:bg-brand-burnt transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {ticketSubmitting ? (
                                <>
                                  <Loader2 size={16} className="animate-spin" />
                                  Creating...
                                </>
                              ) : (
                                <>
                                  <Ticket size={16} />
                                  Submit Ticket
                                </>
                              )}
                            </button>
                          </form>
                        )}
                      </div>

                      {/* User's Existing Tickets */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h2 className="font-bold text-slate-900 mb-4">Your Tickets</h2>
                        {!user ? (
                          <p className="text-sm text-slate-500 text-center py-4">Sign in to view your tickets</p>
                        ) : ticketsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 size={20} className="animate-spin text-slate-400" />
                          </div>
                        ) : userTickets.length === 0 ? (
                          <p className="text-sm text-slate-500 text-center py-4">No tickets yet</p>
                        ) : (
                          <div className="space-y-2">
                            {userTickets.map((ticket) => (
                              <div key={ticket.id} className="border border-slate-100 rounded-xl overflow-hidden">
                                <button
                                  onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                                  className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    {STATUS_ICONS[ticket.status] || STATUS_ICONS.open}
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-slate-900 truncate">{ticket.subject}</p>
                                      <p className="text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[ticket.status] || STATUS_COLORS.open}`}>
                                      {ticket.status.replace("_", " ")}
                                    </span>
                                    {expandedTicket === ticket.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </div>
                                </button>
                                <AnimatePresence>
                                  {expandedTicket === ticket.id && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="border-t border-slate-100 overflow-hidden"
                                    >
                                      <div className="p-3 space-y-2">
                                        <div className="flex gap-2 text-xs">
                                          <span className="px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">{ticket.category}</span>
                                          <span className="px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">{ticket.priority}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 whitespace-pre-line">{ticket.description}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">ID: {ticket.id.slice(0, 8)}...</p>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                  <h3 className="font-bold text-slate-900 text-sm mb-3">WhatsApp Support</h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Chat with us directly on WhatsApp for instant support.
                  </p>
                  <a
                    href={`https://wa.me/${siteConfig.whatsapp_number || "+919528500383"}?text=Hi%20GoRASA%2C%20I%20need%20help`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    <Phone size={16} />
                    Open WhatsApp
                    <ExternalLink size={12} className="ml-auto" />
                  </a>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                  <h3 className="font-bold text-slate-900 text-sm mb-3">Contact Info</h3>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p>📞 {siteConfig.contact_phone || "+91 95285 00383"}</p>
                    <p>📧 {siteConfig.contact_email || "rasatravelindia@gmail.com"}</p>
                    <p>🏢 RASA Travel Services India Pvt Ltd</p>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Premium Support</h3>
                  <p className="text-xs text-slate-500">
                    Platinum members get priority support with dedicated concierge.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </>
  );
}
