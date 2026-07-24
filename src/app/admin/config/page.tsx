"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  Settings, Wifi, WifiOff, RotateCw, CheckCircle2, XCircle,
  Building2, Plane, Database, RefreshCw, History,
  ChevronDown, ChevronUp, Plus, Trash2, Pencil, X,
  Globe, MapPin, Hotel, Search, CreditCard, FileText,
  Loader2, ArrowRight, ExternalLink, Copy, Check,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ConfigProvider {
  id: string;
  provider: string;
  label: string;
  baseUrl: string | null;
  bookingUrl: string | null;
  staticUrl: string | null;
  clientId: string | null;
  hasUsername: boolean;
  hasPassword: boolean;
  hasStaticUsername: boolean;
  hasStaticPassword: boolean;
  forceMock: boolean;
  isActive: boolean;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuditLog {
  id: string;
  provider: string;
  action: string;
  field: string | null;
  performedBy: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface EnvStatus {
  hasEncryptionKey: boolean;
  tboHotel: { hasEndpoint: boolean; endpointUrl: string; hasBookingEndpoint: boolean; bookingUrl: string; hasClientId: boolean; hasUsername: boolean; hasPassword: boolean; forceMock: boolean };
  tboHotelStatic: { hasEndpoint: boolean; hasUsername: boolean; hasPassword: boolean };
  tboFlight: { hasClientId: boolean; hasUsername: boolean; hasPassword: boolean; forceMock: boolean };
}

const PROVIDER_META: Record<string, { label: string; icon: React.ReactNode; description: string; defaultBaseUrl: string; defaultBookingUrl: string; defaultStaticUrl: string; defaultClientId: string; defaultUsername: string; defaultPassword: string }> = {
  tbo_hotel: {
    label: "TBO Hotel (Search/Book)",
    icon: <Building2 size={20} />,
    description: "Production hotel search, prebook, book, cancel endpoints using RasaT agency credentials",
    defaultBaseUrl: "https://affiliate.tektravels.com/HotelAPI",
    defaultBookingUrl: "https://HotelBE.tektravels.com/hotelservice.svc/rest",
    defaultStaticUrl: "",
    defaultClientId: "ApiIntegrationNew",
    defaultUsername: "",
    defaultPassword: "",
  },
  tbo_hotel_static: {
    label: "TBO Hotel (Static Data)",
    icon: <Database size={20} />,
    description: "Staging static data endpoints — CountryList, CityList, TBOHotelCodeList, HotelDetails using TBOStaticAPITest credentials",
    defaultBaseUrl: "",
    defaultBookingUrl: "",
    defaultStaticUrl: "http://api.tbotechnology.in/TBOHolidays_HotelAPI",
    defaultClientId: "",
    defaultUsername: "TBOStaticAPITest",
    defaultPassword: "",
  },
  tbo_flight: {
    label: "TBO Flight",
    icon: <Plane size={20} />,
    description: "Flight search, fare rule, fare quote, SSR, book, ticket endpoints using RasaT agency credentials",
    defaultBaseUrl: "https://affiliate.tektravels.com/FlightAPI",
    defaultBookingUrl: "",
    defaultStaticUrl: "",
    defaultClientId: "ApiIntegrationNew",
    defaultUsername: "",
    defaultPassword: "",
  },
};

const HOTEL_ENDPOINTS = {
  static: [
    { method: "GET", url: "/CountryList", desc: "Returns 249 countries with codes", params: "None", response: "CountryList[] with Code, Name" },
    { method: "POST", url: "/CityList", desc: "Returns cities for a country (1089 for IN)", params: '{"CountryCode":"IN"}', response: "CityList[] with CityCode, CityName, CountryCode" },
    { method: "POST", url: "/TBOHotelCodeList", desc: "Returns hotels for a city (4356 for Goa)", params: '{"CityCode":"119805"}', response: "Hotels[] with HotelCode, HotelName, HotelRating, Address" },
    { method: "POST", url: "/HotelDetails", desc: "Returns full hotel details, images, amenities", params: '{"HotelCodes":"1218373"}', response: "HotelDetails[] with Images, Amenities, Facilities" },
    { method: "GET", url: "/HotelCodes", desc: "Returns all hotel codes (not currently used)", params: "None", response: "HotelCodes[] as integers" },
  ],
  search: [
    { method: "POST", url: "/Search", desc: "Search hotels by city code or hotel codes", tag: "Search", params: '{"CheckIn":"2026-07-01","CheckOut":"2026-07-02","HotelCodes":"1218373","GuestNationality":"IN","PaxRooms":[{"Adults":1,"Children":0,"ChildrenAges":[]}],"PreferredCurrency":"INR"}', response: "HotelResult[] with Rooms, TotalFare, BookingCode" },
    { method: "POST", url: "/PreBook", desc: "Validate pricing and cancellation policy before booking", tag: "Search", params: '{"BookingCode":"xxx","PaymentMode":"Limit"}', response: "NetAmount, RoomRate, TaxBreakup, CancelPolicies" },
    { method: "POST", url: "/Book", desc: "Confirm a hotel booking with passenger details", tag: "Booking", params: '{"BookingCode":"xxx","IsVoucherBooking":true,"GuestNationality":"IN","RequestedBookingMode":5,"NetAmount":1000,"HotelRoomsDetails":[...]}', response: "BookingId, ConfirmationNo, BookingRefNo" },
    { method: "POST", url: "/GetBookingDetail", desc: "Retrieve booking details by BookingId", tag: "Booking", params: '{"BookingId":12345}', response: "HotelName, CheckIn, CheckOut, Rooms, PriceBreakup" },
    { method: "POST", url: "/GenerateVoucher", desc: "Generate voucher for a confirmed booking", tag: "Booking", params: '{"BookingId":12345}', response: "VoucherStatus, ConfirmationNo, InvoiceNumber" },
    { method: "POST", url: "/SendChangeRequest", desc: "Cancel or modify a booking", tag: "Booking", params: '{"BookingMode":5,"RequestType":4,"Remarks":"Customer requested","BookingId":12345}', response: "ChangeRequestId, ChangeRequestStatus" },
    { method: "POST", url: "/GetChangeRequestStatus", desc: "Check status of a cancellation/modification", tag: "Booking", params: '{"BookingMode":5,"ChangeRequestId":67890}', response: "RefundedAmount, CancellationCharge, ChangeRequestStatus" },
  ],
};

const FLIGHT_ENDPOINTS = [
  { method: "POST", url: "/Search", desc: "Search flights by origin/destination", params: '{"EndUserIp":"1.1.1.1","TokenId":"xxx","AdultCount":1,"ChildCount":0,"InfantCount":0,"JourneyType":1,"Segments":[{"Origin":"BOM","Destination":"DEL","FlightCabinClass":1,"PreferredDepartureTime":"","PreferredArrivalTime":""}]}', response: "Results[] with Segments, Fare, IsLCC" },
  { method: "POST", url: "/FareRule", desc: "Get fare rules and cancellation policy", params: '{"EndUserIp":"1.1.1.1","TokenId":"xxx","TraceId":"xxx","ResultIndex":"xxx"}', response: "FareRules[] with details" },
  { method: "POST", url: "/FareQuote", desc: "Get real-time fare quote before booking", params: '{"EndUserIp":"1.1.1.1","TokenId":"xxx","TraceId":"xxx","ResultIndex":"xxx"}', response: "IsPriceChanged, Fare, FareBreakdown" },
  { method: "POST", url: "/SSR", desc: "Get ancillary services (baggage, meals, seats)", params: '{"EndUserIp":"1.1.1.1","TokenId":"xxx","TraceId":"xxx","ResultIndex":"xxx"}', response: "SSR.Baggage, SSR.MealDynamic, SSR.SeatDynamic" },
  { method: "POST", url: "/Book", desc: "Book a flight with passenger details", params: '{"EndUserIp":"1.1.1.1","TokenId":"xxx","TraceId":"xxx","ResultIndex":"xxx","Passengers":[...]}', response: "FlightItinerary.BookingId, PNR" },
  { method: "POST", url: "/Ticket", desc: "Issue ticket (LCC auto-tickets, non-LCC needs separate call)", params: '{"EndUserIp":"1.1.1.1","TokenId":"xxx","TraceId":"xxx","ResultIndex":"xxx","Passengers":[...]}', response: "BookingId, PNR" },
  { method: "POST", url: "/GetBookingDetail", desc: "Retrieve booking details by BookingId", params: '{"EndUserIp":"1.1.1.1","TokenId":"xxx","BookingId":"xxx"}', response: "FlightItinerary with PNR, Segments, Fare" },
];

const EMPTY_FORM = { provider: "", label: "", baseUrl: "", bookingUrl: "", staticUrl: "", clientId: "", username: "", password: "", staticUsername: "", staticPassword: "", forceMock: false, isActive: true };

type Tab = "providers" | "static" | "booking" | "audit";

export default function ConfigPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("providers");
  const [providers, setProviders] = useState<ConfigProvider[]>([]);
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Static data browser state
  const [staticData, setStaticData] = useState<{ countries: any[]; cities: any[]; hotels: any[]; details: any[] }>({ countries: [], cities: [], hotels: [], details: [] });
  const [staticLoading, setStaticLoading] = useState(false);
  const [countryFilter, setCountryFilter] = useState("IN");
  const [cityFilter, setCityFilter] = useState("");
  const [hotelFilter, setHotelFilter] = useState("");

  // Booking test state
  const [bookingTest, setBookingTest] = useState<{ loading: boolean; result: any; error: string }>({ loading: false, result: null, error: "" });

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/config");
      const data = await res.json();
      setProviders(data.providers || []);
      setEnvStatus(data.envStatus || null);
    } catch (err) {
      console.error("Failed to fetch config providers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await fetch("/api/admin/config/audit-logs?limit=50");
      const data = await res.json();
      setAuditLogs(data.logs || []);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const openCreate = (providerKey: string) => {
    const meta = PROVIDER_META[providerKey];
    setModalMode("create");
    setForm({ provider: providerKey, label: meta.label, baseUrl: meta.defaultBaseUrl, bookingUrl: meta.defaultBookingUrl, staticUrl: meta.defaultStaticUrl, clientId: meta.defaultClientId, username: meta.defaultUsername, password: meta.defaultPassword, staticUsername: providerKey === "tbo_hotel_static" ? meta.defaultUsername : "", staticPassword: "", forceMock: false, isActive: true });
    setShowModal(true);
  };

  const openEdit = (p: ConfigProvider) => {
    setModalMode("edit");
    setForm({ provider: p.provider, label: p.label, baseUrl: p.baseUrl || "", bookingUrl: p.bookingUrl || "", staticUrl: p.staticUrl || "", clientId: p.clientId || "", username: "", password: "", staticUsername: "", staticPassword: "", forceMock: p.forceMock, isActive: p.isActive });
    setShowModal(true);
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload: Record<string, any> = { provider: form.provider, label: form.label, baseUrl: form.baseUrl || null, bookingUrl: form.bookingUrl || null, staticUrl: form.staticUrl || null, clientId: form.clientId || null, forceMock: form.forceMock, isActive: form.isActive, updatedBy: user?.name || user?.email || "admin" };
      if (form.username) payload.username = form.username;
      if (form.password) payload.password = form.password;
      if (form.staticUsername) payload.staticUsername = form.staticUsername;
      if (form.staticPassword) payload.staticPassword = form.staticPassword;
      const res = await fetch("/api/admin/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { setMessage({ type: "success", text: `Configuration ${modalMode === "create" ? "created" : "updated"} successfully` }); setShowModal(false); fetchProviders(); } else { setMessage({ type: "error", text: data.error || "Failed to save" }); }
    } catch { setMessage({ type: "error", text: "Failed to save configuration" }); } finally { setSaving(false); }
  };

  const deleteConfig = async (provider: string) => {
    try {
      const res = await fetch(`/api/admin/config?provider=${provider}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { setMessage({ type: "success", text: "Configuration deleted" }); setDeleteConfirm(null); fetchProviders(); } else { setMessage({ type: "error", text: data.error || "Failed to delete" }); }
    } catch { setMessage({ type: "error", text: "Failed to delete configuration" }); }
  };

  const testConnection = async (provider: string) => {
    setTesting(provider);
    setTestResults(prev => ({ ...prev, [provider]: { success: false, message: "Testing..." } }));
    try {
      const res = await fetch(`/api/admin/config/${provider}/test`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      setTestResults(prev => ({ ...prev, [provider]: data }));
    } catch { setTestResults(prev => ({ ...prev, [provider]: { success: false, message: "Connection test failed" } })); } finally { setTesting(null); }
  };

  // Static data browser
  const fetchCountries = async () => {
    setStaticLoading(true);
    try {
      const res = await fetch("/api/tbo-hotels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "static-data/countries" }) });
      const data = await res.json();
      setStaticData(prev => ({ ...prev, countries: data.countries || [] }));
    } catch { } finally { setStaticLoading(false); }
  };

  const fetchCities = async () => {
    if (!countryFilter) return;
    setStaticLoading(true);
    try {
      const res = await fetch("/api/tbo-hotels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "static-data/cities", countryCode: countryFilter }) });
      const data = await res.json();
      setStaticData(prev => ({ ...prev, cities: data.cities || [] }));
    } catch { } finally { setStaticLoading(false); }
  };

  const fetchHotels = async () => {
    if (!cityFilter) return;
    setStaticLoading(true);
    try {
      const res = await fetch("/api/tbo-hotels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "static-data/hotel-codes", cityCode: cityFilter }) });
      const data = await res.json();
      setStaticData(prev => ({ ...prev, hotels: data.hotels || [] }));
    } catch { } finally { setStaticLoading(false); }
  };

  const missingProviders = Object.keys(PROVIDER_META).filter(key => !providers.find(p => p.provider === key));

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "providers", label: "Providers", icon: <Settings size={16} /> },
    { key: "static", label: "Static Data", icon: <Database size={16} /> },
    { key: "booking", label: "Booking Flow", icon: <CreditCard size={16} /> },
    { key: "audit", label: "Audit Log", icon: <History size={16} /> },
  ];

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-saffron" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-slate-900">API Configuration</h1>
        <div className="flex gap-2">
          {missingProviders.length > 0 && tab === "providers" && missingProviders.map(key => (
            <button key={key} onClick={() => openCreate(key)} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 cursor-pointer">
              <Plus size={14} /> {PROVIDER_META[key].label}
            </button>
          ))}
          <button onClick={fetchProviders} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 cursor-pointer"><RefreshCw size={16} /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); if (t.key === "audit" && auditLogs.length === 0) fetchAuditLogs(); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {message && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="cursor-pointer"><X size={14} /></button>
        </motion.div>
      )}

      {/* PROVIDERS TAB */}
      {tab === "providers" && (
        <div className="space-y-4">
          {/* Environment Status */}
          {envStatus && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Settings size={16} /> Environment Variable Status</h3>
              <p className="text-xs text-slate-400 mb-4">These are the environment variables available as fallback when no database configuration exists. The database configuration (above) takes priority.</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Encryption</h4>
                  <div className="flex items-center gap-2">
                    {envStatus.hasEncryptionKey ? <CheckCircle2 size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-red-500" />}
                    <span className="text-xs font-medium">CONFIG_ENCRYPTION_KEY</span>
                  </div>
                </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">TBO Hotel (Search/Book)</h4>
                    <div className="space-y-1">
                      {[
                        { label: "Search/PreBook Endpoint", ok: envStatus.tboHotel.hasEndpoint, val: envStatus.tboHotel.endpointUrl },
                        { label: "Booking Endpoint", ok: envStatus.tboHotel.hasBookingEndpoint, val: envStatus.tboHotel.bookingUrl },
                        { label: "Client ID", ok: envStatus.tboHotel.hasClientId, val: null },
                        { label: "Username (RasaT)", ok: envStatus.tboHotel.hasUsername, val: null },
                        { label: "Password", ok: envStatus.tboHotel.hasPassword, val: null },
                      ].map(v => (
                        <div key={v.label} className="flex items-start gap-2">
                          <span className="mt-0.5">{v.ok ? <CheckCircle2 size={12} className="text-emerald-500" /> : <XCircle size={12} className="text-slate-300" />}</span>
                          <div>
                            <span className={`text-xs ${v.ok ? "text-slate-600" : "text-slate-300"}`}>{v.label}</span>
                            {v.val && <p className="text-[10px] font-mono text-slate-400 break-all">{v.val}</p>}
                          </div>
                        </div>
                      ))}
                      {envStatus.tboHotel.forceMock && <p className="text-xs font-bold text-amber-600 mt-1">Force Mock: ON</p>}
                    </div>
                  </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">TBO Hotel (Static Data)</h4>
                  <div className="space-y-1">
                    {[
                      { label: "Endpoint", ok: envStatus.tboHotelStatic.hasEndpoint },
                      { label: "Username (TBOStaticAPITest)", ok: envStatus.tboHotelStatic.hasUsername },
                      { label: "Password", ok: envStatus.tboHotelStatic.hasPassword },
                    ].map(v => (
                      <div key={v.label} className="flex items-center gap-2">
                        {v.ok ? <CheckCircle2 size={12} className="text-emerald-500" /> : <XCircle size={12} className="text-slate-300" />}
                        <span className={`text-xs ${v.ok ? "text-slate-600" : "text-slate-300"}`}>{v.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">TBO Flight</h4>
                  <div className="space-y-1">
                    {[
                      { label: "Client ID", ok: envStatus.tboFlight.hasClientId },
                      { label: "Username (RasaT)", ok: envStatus.tboFlight.hasUsername },
                      { label: "Password", ok: envStatus.tboFlight.hasPassword },
                    ].map(v => (
                      <div key={v.label} className="flex items-center gap-2">
                        {v.ok ? <CheckCircle2 size={12} className="text-emerald-500" /> : <XCircle size={12} className="text-slate-300" />}
                        <span className={`text-xs ${v.ok ? "text-slate-600" : "text-slate-300"}`}>{v.label}</span>
                      </div>
                    ))}
                    {envStatus.tboFlight.forceMock && <p className="text-xs font-bold text-amber-600 mt-1">Force Mock: ON</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {providers.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Settings size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">No Config Providers Yet</h3>
              <p className="text-sm text-slate-500">Click a button above to create a configuration provider.</p>
            </div>
          )}
          {providers.map((p, i) => {
            const meta = PROVIDER_META[p.provider] || { label: p.label, icon: <Settings size={20} />, description: "" };
            const testResult = testResults[p.provider];
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl p-5 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100">{meta.icon}</div>
                    <div>
                      <h3 className="font-bold text-slate-900">{meta.label}</h3>
                      <p className="text-xs text-slate-400">{meta.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.isActive ? <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg"><Wifi size={12} /> Active</span> : <span className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg"><WifiOff size={12} /> Inactive</span>}
                    {p.forceMock && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">Mock</span>}
                    <button onClick={() => testConnection(p.provider)} disabled={testing === p.provider} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 cursor-pointer">
                      {testing === p.provider ? <RotateCw size={12} className="animate-spin" /> : <RotateCw size={12} />} Test
                    </button>
                    <button onClick={() => openEdit(p)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer"><Pencil size={12} /> Edit</button>
                    <button onClick={() => setDeleteConfirm(p.provider)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer"><Trash2 size={12} /> Delete</button>
                  </div>
                </div>
                {testResult && <div className={`mb-3 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 ${testResult.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{testResult.success ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {testResult.message}</div>}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div><h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Base URL</h4><p className="font-mono text-slate-600 break-all">{p.baseUrl || <span className="text-slate-300">Not set</span>}</p></div>
                  <div><h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Booking URL</h4><p className="font-mono text-slate-600 break-all">{p.bookingUrl || <span className="text-slate-300">Not set</span>}</p></div>
                  <div><h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Static URL</h4><p className="font-mono text-slate-600 break-all">{p.staticUrl || <span className="text-slate-300">Not set</span>}</p></div>
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Credentials</h4>
                    <div className="space-y-1">
                      {p.clientId && <p><span className="text-slate-400">Client ID:</span> <span className="font-mono">{p.clientId}</span></p>}
                      {p.provider === "tbo_hotel_static" ? (
                        <>
                          <p><span className="text-slate-400">Username:</span> {p.hasStaticUsername ? <span className="text-emerald-600 font-bold">Set (TBOStaticAPITest)</span> : <span className="text-slate-300">Not set</span>}</p>
                          <p><span className="text-slate-400">Password:</span> {p.hasStaticPassword ? <span className="text-emerald-600 font-bold">Set</span> : <span className="text-slate-300">Not set</span>}</p>
                        </>
                      ) : (
                        <>
                          <p><span className="text-slate-400">Username:</span> {p.hasUsername ? <span className="text-emerald-600 font-bold">Set (RasaT)</span> : <span className="text-slate-300">Not set</span>}</p>
                          <p><span className="text-slate-400">Password:</span> {p.hasPassword ? <span className="text-emerald-600 font-bold">Set</span> : <span className="text-slate-300">Not set</span>}</p>
                          {p.hasStaticUsername && <p><span className="text-slate-400">Static User:</span> <span className="text-emerald-600 font-bold">Set (TBOStaticAPITest)</span></p>}
                          {p.hasStaticPassword && <p><span className="text-slate-400">Static Pass:</span> <span className="text-emerald-600 font-bold">Set</span></p>}
                        </>
                      )}
                    </div>
                    <p className="mt-2 text-slate-400">v{p.version} · Updated {new Date(p.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* STATIC DATA TAB */}
      {tab === "static" && (
        <div className="space-y-6">
          {/* Endpoints Reference */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-1">Static Data Endpoints</h3>
            <p className="text-xs text-slate-400 mb-4">Base URL: <span className="font-mono">http://api.tbotechnology.in/TBOHolidays_HotelAPI</span> · Auth: TBOStaticAPITest</p>
            <div className="space-y-2">
              {HOTEL_ENDPOINTS.static.map((ep, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${ep.method === "GET" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{ep.method}</span>
                  <div className="flex-1">
                    <p className="font-mono text-sm text-slate-700">{ep.url}</p>
                    <p className="text-xs text-slate-500 mt-1">{ep.desc}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div><p className="text-[10px] font-bold uppercase text-slate-400">Request</p><pre className="text-xs text-slate-600 bg-white p-2 rounded mt-1 overflow-x-auto">{ep.params}</pre></div>
                      <div><p className="text-[10px] font-bold uppercase text-slate-400">Response</p><pre className="text-xs text-slate-600 bg-white p-2 rounded mt-1 overflow-x-auto">{ep.response}</pre></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Data Browser */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4">Live Data Browser</h3>

            {/* Countries */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Globe size={16} /> Countries</h4>
                <button onClick={fetchCountries} disabled={staticLoading} className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 cursor-pointer">
                  {staticLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Load Countries
                </button>
                <span className="text-xs text-slate-400">{staticData.countries.length > 0 && `${staticData.countries.length} countries`}</span>
              </div>
              {staticData.countries.length > 0 && (
                <div className="max-h-96 overflow-y-auto bg-slate-50 rounded-xl p-3">
                  <div className="grid grid-cols-4 gap-1 text-xs">
                    {staticData.countries.map((c: any, i: number) => (
                      <div key={i} className="px-2 py-1 rounded hover:bg-white cursor-pointer" onClick={() => setCountryFilter(c.Code)}><span className="font-mono text-slate-400 mr-1">{c.Code}</span> {c.Name}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cities */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><MapPin size={16} /> Cities</h4>
                <input value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} placeholder="Country Code" className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono w-24" />
                <button onClick={fetchCities} disabled={staticLoading || !countryFilter} className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 cursor-pointer">
                  {staticLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Load Cities
                </button>
                <span className="text-xs text-slate-400">{staticData.cities.length > 0 && `${staticData.cities.length} cities for ${countryFilter}`}</span>
              </div>
              {staticData.cities.length > 0 && (
                <div className="max-h-96 overflow-y-auto bg-slate-50 rounded-xl p-3">
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    {staticData.cities.map((c: any, i: number) => (
                      <div key={i} className="px-2 py-1 rounded hover:bg-white cursor-pointer flex justify-between" onClick={() => setCityFilter(String(c.CityCode || c.Code))}>
                        <span>{c.CityName || c.Name}</span>
                        <span className="font-mono text-slate-400">{c.CityCode || c.Code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Hotels */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Hotel size={16} /> Hotels</h4>
                <input value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} placeholder="City Code" className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono w-24" />
                <button onClick={fetchHotels} disabled={staticLoading || !cityFilter} className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 cursor-pointer">
                  {staticLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Load Hotels
                </button>
                <span className="text-xs text-slate-400">{staticData.hotels.length > 0 && `${staticData.hotels.length} hotels for city ${cityFilter}`}</span>
              </div>
              {staticData.hotels.length > 0 && (
                <div className="max-h-64 overflow-y-auto bg-slate-50 rounded-xl p-3">
                  <table className="w-full text-xs">
                    <thead><tr className="text-slate-400"><th className="text-left py-1">Code</th><th className="text-left py-1">Name</th><th className="text-left py-1">Rating</th><th className="text-left py-1">Address</th></tr></thead>
                    <tbody>
                      {staticData.hotels.map((h: any, i: number) => (
                        <tr key={i} className="border-t border-slate-200 hover:bg-white"><td className="py-1.5 font-mono">{h.HotelCode}</td><td className="py-1.5">{h.HotelName}</td><td className="py-1.5">{h.HotelRating}</td><td className="py-1.5 truncate max-w-xs">{h.Address}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BOOKING FLOW TAB */}
      {tab === "booking" && (
        <div className="space-y-6">
          {/* Hotel Booking Flow */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-1">Hotel Booking Flow</h3>
            <p className="text-xs text-slate-400 mb-4">Search/PreBook → <span className="font-mono">https://affiliate.tektravels.com/HotelAPI</span> · Book/Voucher/Cancel → <span className="font-mono">https://HotelBE.tektravels.com/hotelservice.svc/rest</span> · Auth: RasaT</p>
            <div className="flex items-center gap-2 mb-4 text-xs">
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold">Search</span>
              <ArrowRight size={12} className="text-slate-300" />
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold">PreBook</span>
              <ArrowRight size={12} className="text-slate-300" />
              <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg font-bold">Book</span>
              <ArrowRight size={12} className="text-slate-300" />
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold">GetBookingDetail</span>
              <ArrowRight size={12} className="text-slate-300" />
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold">GenerateVoucher</span>
              <ArrowRight size={12} className="text-slate-300" />
              <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-lg font-bold">Cancel</span>
            </div>
            <div className="space-y-2">
              {HOTEL_ENDPOINTS.search.map((ep, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${ep.method === "GET" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{ep.method}</span>
                  <div className="flex-1">
                    <p className="font-mono text-sm text-slate-700">{ep.url} {(ep as any).tag === "Search" ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 ml-1">Search</span> : <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-50 text-green-600 ml-1">Booking</span>}</p>
                    <p className="text-xs text-slate-500 mt-1">{ep.desc}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div><p className="text-[10px] font-bold uppercase text-slate-400">Request Body</p><pre className="text-xs text-slate-600 bg-white p-2 rounded mt-1 overflow-x-auto max-h-32">{ep.params}</pre></div>
                      <div><p className="text-[10px] font-bold uppercase text-slate-400">Response</p><pre className="text-xs text-slate-600 bg-white p-2 rounded mt-1 overflow-x-auto max-h-32">{ep.response}</pre></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flight Booking Flow */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-1">Flight Booking Flow</h3>
            <p className="text-xs text-slate-400 mb-4">Auth URL: <span className="font-mono">http://Sharedapi.tektravels.com/SharedData.svc/rest/Authenticate</span> · Search URL: <span className="font-mono">http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest</span></p>
            <div className="flex items-center gap-2 mb-4 text-xs">
              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg font-bold">Authenticate</span>
              <ArrowRight size={12} className="text-slate-300" />
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold">Search</span>
              <ArrowRight size={12} className="text-slate-300" />
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold">FareRule</span>
              <ArrowRight size={12} className="text-slate-300" />
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold">FareQuote</span>
              <ArrowRight size={12} className="text-slate-300" />
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold">SSR</span>
              <ArrowRight size={12} className="text-slate-300" />
              <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg font-bold">Book</span>
              <ArrowRight size={12} className="text-slate-300" />
              <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg font-bold">Ticket</span>
            </div>
            <div className="space-y-2">
              {FLIGHT_ENDPOINTS.map((ep, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">{ep.method}</span>
                  <div className="flex-1">
                    <p className="font-mono text-sm text-slate-700">{ep.url}</p>
                    <p className="text-xs text-slate-500 mt-1">{ep.desc}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div><p className="text-[10px] font-bold uppercase text-slate-400">Request Body</p><pre className="text-xs text-slate-600 bg-white p-2 rounded mt-1 overflow-x-auto max-h-32">{ep.params}</pre></div>
                      <div><p className="text-[10px] font-bold uppercase text-slate-400">Response</p><pre className="text-xs text-slate-600 bg-white p-2 rounded mt-1 overflow-x-auto max-h-32">{ep.response}</pre></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Auth Reference */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4">Authentication Reference</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="text-sm font-bold text-slate-700 mb-2">Static Data Auth</h4>
                <p className="text-xs text-slate-500 mb-2">For CountryList, CityList, TBOHotelCodeList, HotelDetails</p>
                <div className="space-y-1 text-xs font-mono">
                  <p><span className="text-slate-400">Header:</span> Authorization: Basic base64(username:password)</p>
                  <p><span className="text-slate-400">Username:</span> TBOStaticAPITest</p>
                  <p><span className="text-slate-400">Password:</span> Tbo@11530818</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="text-sm font-bold text-slate-700 mb-2">Search/Book Auth</h4>
                <p className="text-xs text-slate-500 mb-2">For Search, PreBook, Book, Cancel (shared with flights)</p>
                <div className="space-y-1 text-xs font-mono">
                  <p><span className="text-slate-400">Header:</span> Authorization: Basic base64(username:password)</p>
                  <p><span className="text-slate-400">Username:</span> RasaT</p>
                  <p><span className="text-slate-400">Password:</span> RasaT@123</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT LOG TAB */}
      {tab === "audit" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {auditLoading ? (
            <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-saffron" /></div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400">No audit log entries yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Provider</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Action</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Field</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">By</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">IP</th>
                </tr></thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3"><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{log.provider}</span></td>
                      <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded ${log.action === "DELETE" ? "bg-red-100 text-red-700" : log.action === "UPSERT" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{log.action}</span></td>
                      <td className="px-4 py-3 text-slate-600">{log.field || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{log.performedBy || "-"}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{log.ipAddress || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => { if (!saving) setShowModal(false) }} />
          <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div><h3 className="font-bold text-slate-900">{modalMode === "create" ? "Create" : "Edit"} Configuration</h3><p className="text-xs text-slate-400 font-mono">{form.provider}</p></div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Label</label><input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Base URL</label><input value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} placeholder="https://affiliate.tektravels.com/HotelAPI" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
                <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Booking URL</label><input value={form.bookingUrl} onChange={(e) => setForm({ ...form, bookingUrl: e.target.value })} placeholder="https://HotelBE.tektravels.com/hotelservice.svc/rest" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
              </div>
              <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Static Data URL</label><input value={form.staticUrl} onChange={(e) => setForm({ ...form, staticUrl: e.target.value })} placeholder="http://api.tbotechnology.in/TBOHolidays_HotelAPI" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
              <div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Client ID</label><input value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} placeholder="ApiIntegrationNew" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold text-slate-700 mb-3">Credentials {modalMode === "edit" ? "(leave blank to keep existing)" : ""}</h4>
                <div className="grid grid-cols-2 gap-3">
                  {form.provider !== "tbo_hotel_static" && (<><div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Username (RasaT)</label><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="RasaT" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div><div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Password</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter password" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div></>)}
                  {(form.provider === "tbo_hotel_static" || form.provider === "tbo_hotel") && (<><div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Static Username</label><input value={form.staticUsername} onChange={(e) => setForm({ ...form, staticUsername: e.target.value })} placeholder="TBOStaticAPITest" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div><div><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Static Password</label><input type="password" value={form.staticPassword} onChange={(e) => setForm({ ...form, staticPassword: e.target.value })} placeholder="Enter static password" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div></>)}
                </div>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.forceMock} onChange={(e) => setForm({ ...form, forceMock: e.target.checked })} className="rounded" /><span className="text-sm text-slate-700">Force Mock Mode</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" /><span className="text-sm text-slate-700">Active</span></label>
              </div>
            </div>
            <div className="flex gap-2 mt-6 pt-4 border-t border-slate-200">
              <button onClick={saveConfig} disabled={saving} className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 cursor-pointer">{saving ? "Saving..." : modalMode === "create" ? "Create Configuration" : "Save Changes"}</button>
              <button onClick={() => setShowModal(false)} disabled={saving} className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 disabled:opacity-50 cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center">
            <Trash2 size={32} className="mx-auto text-red-400 mb-3" />
            <h3 className="font-bold text-slate-900 mb-2">Delete Configuration?</h3>
            <p className="text-sm text-slate-500 mb-6">This will permanently remove the <span className="font-mono font-bold">{deleteConfirm}</span> configuration. The application will fall back to environment variables.</p>
            <div className="flex gap-2">
              <button onClick={() => deleteConfig(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 cursor-pointer">Delete</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
