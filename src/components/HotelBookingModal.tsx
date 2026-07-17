"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { formatCurrency } from "@/lib";
import { useDemoMode } from "@/hooks/useDemoMode";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { formatMealPlan } from "@/lib/format-meal-plan";
import {
  X, Loader2, CheckCircle, AlertCircle, Building2,
  Bed, MapPin, Calendar, Phone, Mail, User, CreditCard,
  Tag, ChevronDown, ChevronUp, Globe, Home, Zap, FlaskConical, Clock
} from "lucide-react";
import type { TBODisplayHotel, TBODisplayRoom } from "@/lib/tbo-hotel-types";
import CheckoutButton from "./CheckoutButton";
import FormInput from "./ui/FormInput";
import FormPhone from "./ui/FormPhone";
import FormPan from "./ui/FormPan";
import FormGst from "./ui/FormGst";
import FormPassport from "./ui/FormPassport";
import FormSection from "./ui/FormSection";
import StepProgress from "./ui/StepProgress";

interface HotelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotel: TBODisplayHotel;
  room: TBODisplayRoom;
  sessionId: string;
  traceId?: string;
  user: { id: string; email: string; name: string; companyId?: string } | null;
  location: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
}

type BookingStep = "form" | "blocking" | "book-confirming" | "saving" | "checkout" | "done" | "error";

export default function HotelBookingModal({
  isOpen, onClose, hotel, room, sessionId, traceId, user, location,
  checkIn, checkOut, guestCount,
}: HotelBookingModalProps) {
  const { demoMode } = useDemoMode();
  const [step, setStep] = useState<BookingStep>("form");
  const [firstName, setFirstName] = useState(user?.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(user?.name?.split(" ").slice(1).join(" ") || "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [pan, setPan] = useState("");
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [addressLine1, setAddressLine1] = useState("");
  const [addressCity, setAddressCity] = useState(location);
  const [passportNo, setPassportNo] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [guestAge, setGuestAge] = useState(25);
  const [guestNationality, setGuestNationality] = useState("IN");
  const [showGstFields, setShowGstFields] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [gstCompanyName, setGstCompanyName] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [discountApplied, setDiscountApplied] = useState(0);
  const [couponCodeUsed, setCouponCodeUsed] = useState("");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [tboBookingId, setTboBookingId] = useState<number | null>(null);
  const [confirmation, setConfirmation] = useState<{
    bookingId?: string;
    pnr?: string;
    confirmationNo?: string;
    status?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCorporateBooking, setIsCorporateBooking] = useState(false);
  const [prebookTaxBreakup, setPrebookTaxBreakup] = useState<{ chargeType: string; taxableAmount: number; taxPercentage: number; amount: number }[] | null>(null);
  const [corporateLoading, setCorporateLoading] = useState(false);
  const [corporateResult, setCorporateResult] = useState<{
    invoiceNumber?: string;
    walletBalance?: number;
    corporateDiscount?: number;
    corporateRuleName?: string;
  } | null>(null);
  const [voucherStatus, setVoucherStatus] = useState<string | null>(null);
  const [bookingDetail, setBookingDetail] = useState<Record<string, unknown> | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [validationInfo, setValidationInfo] = useState<{ PanMandatory?: boolean; PanPassport?: boolean; PassportMandatory?: boolean } | null>(null);
  const [lastCancellationDeadline, setLastCancellationDeadline] = useState<string | null>(null);

  useEffect(() => {
    if (user?.companyId) {
      fetch(`/api/companies/${user.companyId}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.name) setCompanyName(data.name); })
        .catch(() => {});
    }
  }, [user?.companyId]);

  const isInternational = hotel.countryCode ? hotel.countryCode !== "IN" : hotel.hotelCode >= 10000000;
  const showPassport = validationInfo?.PassportMandatory === true || (isInternational && !validationInfo);
  const showPan = validationInfo?.PanMandatory === true || validationInfo?.PanPassport === true || (!isInternational && !validationInfo);
  const passportRequired = validationInfo?.PassportMandatory === true || (isInternational && !validationInfo);
  const panRequired = validationInfo?.PanMandatory === true || (!isInternational && !validationInfo);
  const nights = Math.max(1, Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000
  ));
  const baseAndTax = room.totalFare + room.totalTax;
  const finalPrice = baseAndTax - discountApplied;
  const demoDiscount = demoMode ? 500 : 0;
  const totalPayable = finalPrice - demoDiscount;
  const perNightTotal = (room.roomFare || room.totalFare / nights) + room.roomTax;
  const passportValid = !passportRequired || (passportNo.trim() && passportExpiry);
  const panValid = !panRequired || pan.trim().length > 0;
  const isValid = firstName.trim() && lastName.trim() && phone.trim().length >= 7 && email.trim() && passportValid && panValid;

  const prefilled = firstName && lastName && phone && email && pan;
  const dirtyRef = useRef(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const markDirty = () => { dirtyRef.current = true; };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "firstName": return !value.trim() ? "First name is required" : "";
      case "lastName": return !value.trim() ? "Last name is required" : "";
      case "phone": return value.trim().length < 7 ? "Phone must be at least 7 digits" : "";
      case "email": return !value.trim() ? "Email is required" : "";
      case "pan": return value && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value) ? "Invalid PAN format" : "";
      default: return "";
    }
  };

  const handleFieldBlur = (name: string, value: string) => {
    const error = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: error }));
  };

  useEscapeKey(() => {
    if (step === "form" && dirtyRef.current) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        handleClose();
      }
    } else {
      handleClose();
    }
  }, isOpen);

  const resetForm = () => {
    setStep("form");
    setErrorMessage("");
    setConfirmation(null);
    setBookingId(null);
    setTboBookingId(null);
    setDiscountApplied(0);
    setCouponCodeUsed("");
    setPromoCode("");
    setPromoError("");
    setFormErrors({});
    setVoucherStatus(null);
    setBookingDetail(null);
    setActionLoading(null);
    setValidationInfo(null);
    dirtyRef.current = false;
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handlePrefill = () => {
    setFirstName("Priya");
    setLastName("Singh");
    setPhone("9876543210");
    setEmail("priya@example.com");
    setPan("BDAPP1234K");
    setAddressLine1("456 Corporate Tower, BKC");
    setAddressCity("Mumbai");
    setPassportNo("B9876543");
    setPassportExpiry("2032-06-30");
    setGstNumber("27AADCB2230M1ZT");
    setGstCompanyName("GoRASA Corporate Travels");
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || !user) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await fetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode.trim(),
          bookingAmount: room.totalFare,
          category: "HOTEL",
          userId: user.id,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setDiscountApplied(data.discount || 0);
        setCouponCodeUsed(promoCode.trim());
        setPromoError("");
      } else {
        setPromoError(data.error || "Invalid promo code");
        setDiscountApplied(0);
        setCouponCodeUsed("");
      }
    } catch {
      setPromoError("Failed to validate promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleBook = async () => {
    if (!isValid || !user) return;
    setStep("blocking");

    try {
      const clientRef = `GR-${Date.now()}`;
      let pnrCode = clientRef;
      let confirmationNo = "";
      let bookData: Record<string, any> | null = null;

      if (!demoMode) {
        const blockRes = await fetch("/api/tbo-hotels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "block",
            sessionId,
            resultIndex: hotel.resultIndex,
            hotelCode: hotel.hotelCode,
            hotelName: hotel.name,
            room,
          }),
        });

        const blockData = await blockRes.json();

        if (!blockData.success) {
          setErrorMessage("Price could not be verified. Please try again.");
          setStep("error");
          return;
        }

        if (blockData.taxBreakup?.length > 0) {
          setPrebookTaxBreakup(blockData.taxBreakup);
        }

        if (blockData.validationInfo) {
          setValidationInfo(blockData.validationInfo);
        }

        if (blockData.lastCancellationDeadline) {
          setLastCancellationDeadline(blockData.lastCancellationDeadline);
        }

        if (blockData.isPriceChanged) {
          const proceed = window.confirm(
            "The room price has changed. The new total is shown in the booking summary. Do you want to proceed?"
          );
          if (!proceed) {
            setStep("form");
            return;
          }
        }

        setStep("book-confirming");

        const bookReqPayload = {
          action: "book",
          bookingCode: blockData.bookingCode,
          guestNationality: guestNationality,
          netAmount: blockData.netAmount || room.totalFare,
          traceId: traceId || undefined,
          hotelRoomsDetails: [{
            passengers: [{
              title: "Mr",
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              paxType: 1,
              leadPassenger: true,
              age: guestAge,
              email: email.trim(),
              phone: phone.trim(),
              pan: showPan && pan.trim() ? pan.trim().toUpperCase() : undefined,
              passportNo: showPassport && passportNo ? passportNo || undefined : undefined,
              passportExpiry: showPassport && passportExpiry ? passportExpiry || undefined : undefined,
              addressLine1: addressLine1 || undefined,
              city: addressCity || location,
              countryCode: guestNationality,
              nationality: guestNationality,
            }]
          }]
        };

        const bookRes = await fetch("/api/tbo-hotels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookReqPayload),
        });

        bookData = await bookRes.json();

        if (!bookData?.success) {
          setErrorMessage("Booking confirmation failed. Please try again.");
          setStep("error");
          return;
        }

        pnrCode = bookData.confirmationNo || clientRef;
        confirmationNo = bookData.confirmationNo || "";
        setTboBookingId(bookData.bookingId || null);

        if (bookData.bookingId) {
          try {
            const voucherRes = await fetch("/api/tbo-hotels", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "generate-voucher", bookingId: bookData.bookingId }),
            });
            const voucherData = await voucherRes.json();
            if (voucherData.voucherStatus) {
              setVoucherStatus("Voucher Generated");
            }
          } catch (e) {
            console.warn("GenerateVoucher failed:", e);
          }

          try {
            const detailRes = await fetch("/api/tbo-hotels", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "booking-detail",
                bookingId: bookData.bookingId,
                traceId: traceId || undefined,
              }),
            });
            const detailData = await detailRes.json();
            if (!detailData.error) {
              setBookingDetail(detailData);
            }
          } catch (e) {
            console.warn("BookingDetail failed:", e);
          }
        }
      }

      const saveRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "HOTEL",
          itemName: hotel.name,
          providerOrAirline: "GoRASA",
          price: totalPayable,
          originalPrice: room.totalFare,
          discountApplied: discountApplied,
          promoCost: discountApplied,
          couponCodeUsed: couponCodeUsed || undefined,
          pnr: pnrCode,
          seatOrRoom: room.name,
          paxCount: guestCount,
          travelDates: `${checkIn} to ${checkOut}`,
          leadGuestPan: showPan && pan.trim() ? pan.trim().toUpperCase() : undefined,
          supplierBookingRef: bookData?.bookingId ? String(bookData.bookingId) : undefined,
          metadata: {
            tboBookingId: bookData?.bookingId,
            confirmationNo: bookData?.confirmationNo,
            hotelCode: hotel.hotelCode,
            roomName: room.name,
            bookingCode: room.bookingCode,
          },
        }),
      });

      if (!saveRes.ok) {
        throw new Error("Failed to save booking");
      }

      const saveData = await saveRes.json();

      setBookingId(saveData.id);
      setConfirmation({
        bookingId: saveData.id || clientRef,
        pnr: pnrCode,
        confirmationNo: confirmationNo || pnrCode,
        status: "Pending Payment",
      });

      if (saveToProfile && user) {
        try {
          const profileRes = await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              passengers: [{
                id: Date.now().toString(),
                name: `${firstName.trim()} ${lastName.trim()}`.trim(),
                relation: "Self",
                gender: "Male",
                passport: passportNo || "",
                pan: pan.trim().toUpperCase(),
              }]
            }),
          });
          if (!profileRes.ok) console.warn("Failed to save PAN to profile");
        } catch (e) {
          console.warn("Profile save failed:", e);
        }
      }

      setStep("checkout");
    } catch (err) {
      setErrorMessage("Something went wrong. Please try again.");
      setStep("error");
    }
  };

  const handleGenerateVoucher = async () => {
    if (!tboBookingId) return;
    setActionLoading("voucher");
    try {
      const res = await fetch("/api/tbo-hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-voucher", bookingId: tboBookingId }),
      });
      const data = await res.json();
      if (data.voucherStatus) {
        setVoucherStatus("Voucher Generated");
      } else {
        setVoucherStatus("Voucher Failed");
      }
    } catch {
      setVoucherStatus("Voucher Failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewBookingDetail = async () => {
    if (!tboBookingId) return;
    setActionLoading("detail");
    try {
      const res = await fetch("/api/tbo-hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "booking-detail",
          bookingId: tboBookingId,
          traceId: traceId || undefined,
        }),
      });
      const data = await res.json();
      if (!data.error) {
        setBookingDetail(data);
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelBooking = async () => {
    if (!bookingId) return;
    const confirmed = window.confirm("Are you sure you want to cancel this booking? This action cannot be undone.");
    if (!confirmed) return;
    setActionLoading("cancel");
    try {
      const res = await fetch("/api/cancellations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, reason: "Customer requested cancellation" }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfirmation(prev => prev ? { ...prev, status: "Cancelled" } : null);
      } else {
        setErrorMessage(data.error || "Cancellation failed");
      }
    } catch {
      setErrorMessage("Cancellation request failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCorporateConfirm = async () => {
    if (!bookingId) return;
    setCorporateLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Corporate booking failed");
        setStep("error");
        return;
      }
      if (data.success) {
        setIsCorporateBooking(true);
        setCorporateResult({
          invoiceNumber: data.invoiceNumber,
          walletBalance: data.walletBalance,
          corporateDiscount: data.corporateDiscount,
          corporateRuleName: data.corporateRuleName,
        });
        setConfirmation({
          bookingId: data.bookingId,
          pnr: confirmation?.pnr,
          confirmationNo: confirmation?.confirmationNo,
          status: "Confirmed",
        });
        setStep("done");
      }
    } catch (err) {
      setErrorMessage("Something went wrong. Please try again.");
      setStep("error");
    } finally {
      setCorporateLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={handleClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hotel-booking-title"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 id="hotel-booking-title" className="text-lg font-bold text-slate-900">Complete Booking</h2>
          <button onClick={handleClose} aria-label="Close" className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer rounded-xl hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {step === "form" && (
          <div className="p-6 space-y-5">
            {/* Demo Mode Banner */}
            {demoMode && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlaskConical size={18} className="text-purple-600" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-purple-800">Demo Mode</p>
                    <p className="text-xs text-purple-600">Use code DEMO500 for ₹500 off • Corporate rates auto-applied</p>
                  </div>
                </div>
                <button
                  onClick={handlePrefill}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 cursor-pointer"
                >
                  <Zap size={12} />
                  Fill Demo Data
                </button>
              </div>
            )}

            {/* Prefill button (always visible) */}
            {demoMode && !prefilled && (
              <button
                onClick={handlePrefill}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 cursor-pointer"
              >
                <Zap size={14} />
                Quick Fill Demo Data
              </button>
            )}

            {/* Booking Summary */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-3">
                <Building2 size={16} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 text-sm">{hotel.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} />
                    {location}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Bed size={12} />{room.name}</span>
                <span className="flex items-center gap-1"><Calendar size={12} />{checkIn || "TBD"} – {checkOut || "TBD"}</span>
              </div>
              {room.mealType && room.mealType !== "Room_Only" && (() => {
                const meal = formatMealPlan(room.mealType);
                return (
                  <p className="text-xs text-emerald-600 font-medium">
                    ✓ {meal.label}{meal.description ? ` — ${meal.description}` : ""} included
                  </p>
                );
              })()}
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Room Fare</span>
                  <span className="text-slate-900">{formatCurrency(room.roomFare || room.totalFare)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Taxes & Fees</span>
                  <span className="text-slate-900">{formatCurrency(room.roomTax)}</span>
                </div>
                {discountApplied > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Discount ({couponCodeUsed})</span>
                    <span className="text-green-600">-{formatCurrency(discountApplied)}</span>
                  </div>
                )}
                {demoMode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-600">Demo Discount</span>
                    <span className="text-purple-600">-{formatCurrency(500)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="font-bold text-slate-900">Total for {nights} night{nights > 1 ? "s" : ""}</span>
                  <div className="text-right">
                    <span className="font-black font-mono text-lg text-emerald-700">{formatCurrency(totalPayable)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Promo Code */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Promo Code</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder={demoMode ? "DEMO500" : "Enter promo code"}
                    disabled={!!couponCodeUsed}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm disabled:opacity-50"
                  />
                </div>
                <button
                  onClick={handleApplyPromo}
                  disabled={!!couponCodeUsed || promoLoading || !promoCode.trim()}
                  className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {promoLoading ? "..." : couponCodeUsed ? "Applied" : "Apply"}
                </button>
              </div>
              {promoError && <p className="text-xs text-red-500 mt-1">{promoError}</p>}
              {couponCodeUsed && discountApplied > 0 && (
                <p className="text-xs text-green-600 mt-1">✓ {couponCodeUsed} applied — {formatCurrency(discountApplied)} off</p>
              )}
            </div>

            {/* Guest Details */}
            <FormSection icon={User} title="Guest Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormInput
                  id="hotel-firstName"
                  label="First Name"
                  required
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); markDirty(); }}
                  onBlur={(e) => handleFieldBlur("firstName", e.target.value)}
                  error={formErrors.firstName}
                  placeholder="First Name"
                  autoComplete="given-name"
                />
                <FormInput
                  id="hotel-lastName"
                  label="Last Name"
                  required
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); markDirty(); }}
                  onBlur={(e) => handleFieldBlur("lastName", e.target.value)}
                  error={formErrors.lastName}
                  placeholder="Last Name"
                  autoComplete="family-name"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Age</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={guestAge}
                    onChange={(e) => { setGuestAge(Math.max(1, Math.min(120, parseInt(e.target.value) || 25))); markDirty(); }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Nationality</label>
                  <select
                    value={guestNationality}
                    onChange={(e) => { setGuestNationality(e.target.value); markDirty(); }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="IN">India (IN)</option>
                    <option value="US">United States (US)</option>
                    <option value="GB">United Kingdom (GB)</option>
                    <option value="AE">UAE (AE)</option>
                    <option value="SG">Singapore (SG)</option>
                    <option value="AU">Australia (AU)</option>
                    <option value="DE">Germany (DE)</option>
                    <option value="FR">France (FR)</option>
                    <option value="JP">Japan (JP)</option>
                    <option value="CA">Canada (CA)</option>
                  </select>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Lead guest name for booking</p>
            </FormSection>

            {/* Identity - PAN */}
            {showPan && (
              <FormSection icon={CreditCard} title={panRequired ? "Identity (Required)" : "Identity (Optional)"}>
                <FormPan
                  id="hotel-pan"
                  label="PAN Card Number"
                  value={pan}
                  onChange={(e) => { setPan(e.target.value); markDirty(); }}
                  placeholder="ABCDE1234F"
                />
              </FormSection>
            )}

            {/* Passport (International Hotels) */}
            {showPassport && (
              <FormPassport
                id="hotel-passport"
                passportNo={passportNo}
                passportExpiry={passportExpiry}
                onPassportNoChange={(v) => { setPassportNo(v); markDirty(); }}
                onPassportExpiryChange={(v) => { setPassportExpiry(v); markDirty(); }}
                required={passportRequired}
                travelDate={checkIn}
                returnDate={checkOut}
              />
            )}

            {/* Address */}
            <FormSection icon={Home} title="Address">
              <FormInput
                id="hotel-address"
                label="Address Line 1"
                value={addressLine1}
                onChange={(e) => { setAddressLine1(e.target.value); markDirty(); }}
                placeholder="Address Line 1"
                autoComplete="street-address"
              />
              <FormInput
                id="hotel-city"
                label="City"
                value={addressCity}
                onChange={(e) => { setAddressCity(e.target.value); markDirty(); }}
                placeholder="City"
                autoComplete="address-level2"
              />
            </FormSection>

            {/* Contact Info */}
            <FormSection icon={Phone} title="Contact Info">
              <FormPhone
                id="hotel-phone"
                label="Phone Number"
                required
                value={phone}
                onChange={(e) => { setPhone(e.target.value); markDirty(); }}
                onBlur={(e) => handleFieldBlur("phone", e.target.value)}
                error={formErrors.phone}
                placeholder="9876543210"
              />
              <FormInput
                id="hotel-email"
                label="Email"
                required
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); markDirty(); }}
                onBlur={(e) => handleFieldBlur("email", e.target.value)}
                error={formErrors.email}
                placeholder="your@email.com"
                icon={Mail}
                autoComplete="email"
              />
            </FormSection>

            {user && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToProfile}
                  onChange={(e) => setSaveToProfile(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                />
                <span className="text-sm text-slate-600">
                  {isInternational ? "Save traveller to my profile for future bookings" : "Save PAN to my profile for future bookings"}
                </span>
              </label>
            )}

            {/* B2B GST Toggle */}
            <FormGst
              id="hotel-gst"
              gstNumber={gstNumber}
              gstCompanyName={gstCompanyName}
              onGstNumberChange={(v) => { setGstNumber(v); markDirty(); }}
              onGstCompanyNameChange={(v) => { setGstCompanyName(v); markDirty(); }}
              hidden={isInternational}
            />
            {isInternational && (
              <p className="text-[10px] text-slate-400">GST applicable for domestic bookings only</p>
            )}

            {/* Action */}
            <button
              onClick={handleBook}
              disabled={!isValid}
              className="w-full py-3.5 bg-brand-saffron text-white rounded-xl font-bold hover:bg-brand-burnt transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <CreditCard size={18} />
              Confirm Booking – {formatCurrency(totalPayable)}
            </button>
          </div>
        )}

        {(step === "blocking" || step === "book-confirming" || step === "saving") && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-brand-antique-gold/10 flex items-center justify-center">
              <Loader2 size={28} className="animate-spin text-brand-antique-gold" />
            </div>
            <StepProgress
              steps={[
                { label: "Verifying", status: step === "blocking" ? "active" : "complete" },
                { label: "Confirming", status: step === "blocking" ? "pending" : step === "book-confirming" ? "active" : "complete" },
                { label: "Saving", status: step === "saving" ? "active" : "pending" },
              ]}
              className="justify-center mb-4"
            />
            <h3 className="font-bold text-brand-charcoal mb-1">
              {step === "blocking" && "Verifying Price..."}
              {step === "book-confirming" && "Confirming Booking..."}
              {step === "saving" && "Saving to My Trips..."}
            </h3>
            <p className="text-sm text-brand-sand">
              {step === "blocking" && "Checking latest room rates & availability"}
              {step === "book-confirming" && "Finalizing your reservation with the hotel"}
              {step === "saving" && "Your booking is confirmed! One moment..."}
            </p>
          </div>
        )}

        {step === "checkout" && bookingId && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <CreditCard size={32} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Booking Created!</h3>
            <p className="text-sm text-slate-500 mb-6">Complete payment to confirm your hotel reservation.</p>

            <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-left mb-6">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Confirmation No.</span>
                <span className="text-sm font-bold font-mono text-slate-900">{confirmation?.confirmationNo || confirmation?.pnr}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Hotel</span>
                <span className="text-sm font-bold text-slate-900">{hotel.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Room</span>
                <span className="text-sm font-bold text-slate-900">{room.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Dates</span>
                <span className="text-sm font-bold text-slate-900">{checkIn} – {checkOut}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Guests</span>
                <span className="text-sm font-bold text-slate-900">{guestCount}</span>
              </div>
              {room.mealType && room.mealType !== "Room_Only" && (() => {
                const meal = formatMealPlan(room.mealType);
                return (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Meal Plan</span>
                    <span className="text-sm font-bold text-emerald-600">{meal.label}</span>
                  </div>
                );
              })()}

              <div className="border-t border-slate-200 pt-3 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Price Breakup</p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Room Fare ({nights} night{nights > 1 ? "s" : ""})</span>
                  <span className="text-slate-900">{formatCurrency(room.roomFare * nights || room.totalFare)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Taxes & Fees</span>
                  <span className="text-slate-900">{formatCurrency(room.totalTax)}</span>
                </div>
                {prebookTaxBreakup && prebookTaxBreakup.length > 0 && (
                  <div className="pl-3 space-y-0.5">
                    {prebookTaxBreakup.map((t, i) => (
                      <div key={i} className="flex justify-between text-xs text-slate-500">
                        <span>{t.chargeType}{t.taxPercentage > 0 ? ` @ ${t.taxPercentage}%` : ''}</span>
                        <span>{formatCurrency(t.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {prebookTaxBreakup && (() => {
                  const cityTax = prebookTaxBreakup.find(t =>
                    /city\s*tax|tourist\s*tax|tourism\s*fee|municipal/i.test(t.chargeType)
                  );
                  return cityTax ? (
                    <div className="flex justify-between text-sm bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                      <span className="text-amber-800 font-medium">{cityTax.chargeType}</span>
                      <span className="font-bold text-amber-800">{formatCurrency(cityTax.amount)}</span>
                    </div>
                  ) : null;
                })()}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="text-slate-900">{formatCurrency(room.totalFare + room.totalTax)}</span>
                </div>
                {discountApplied > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Promo ({couponCodeUsed})</span>
                    <span className="text-green-600">-{formatCurrency(discountApplied)}</span>
                  </div>
                )}
                {demoMode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-600">Demo Discount</span>
                    <span className="text-purple-600">-{formatCurrency(500)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                  <span className="font-bold text-slate-900">Total Amount</span>
                  <span className="font-black font-mono text-lg text-emerald-700">{formatCurrency(totalPayable)}</span>
                </div>
              </div>
            </div>

            {lastCancellationDeadline && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-left">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-green-600" />
                  <span className="text-xs font-bold text-green-800">
                    Free cancellation until {new Date(lastCancellationDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            )}

            {user?.companyId ? (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 size={16} className="text-blue-600" />
                    <span className="text-sm font-bold text-blue-900">
                      {companyName ? `${companyName} — Corporate Booking` : "Corporate Booking"}
                    </span>
                  </div>
                  <p className="text-xs text-blue-700">
                    This booking will be charged to your company account. Payment will be settled within 45 days.
                  </p>
                </div>
                <button
                  onClick={handleCorporateConfirm}
                  disabled={corporateLoading}
                  className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {corporateLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Confirm Booking — {formatCurrency(totalPayable)}
                    </>
                  )}
                </button>
              </>
            ) : (
              <CheckoutButton
                bookingId={bookingId}
                amount={totalPayable}
              />
            )}

            <button
              onClick={handleClose}
              className="w-full mt-3 py-2.5 text-sm text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              Pay Later
            </button>
          </div>
        )}

        {step === "done" && confirmation && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Booking Confirmed!</h3>
            <p className="text-sm text-slate-500 mb-6">
              {isCorporateBooking
                ? "Your corporate booking has been confirmed and charged to your company account."
                : "Your hotel booking has been confirmed."}
            </p>

            <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-left mb-6">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Booking ID</span>
                <span className="text-sm font-bold font-mono text-slate-900">{confirmation.bookingId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Confirmation No.</span>
                <span className="text-sm font-bold font-mono text-slate-900">{confirmation.confirmationNo || confirmation.pnr}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Status</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{confirmation.status}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xs text-slate-500">Hotel</span>
                <span className="text-sm font-bold text-slate-900">{hotel.name}</span>
              </div>
              {isCorporateBooking && corporateResult && (
                <>
                  {corporateResult.corporateDiscount && corporateResult.corporateDiscount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Corporate Discount</span>
                      <span className="text-sm font-bold text-green-600">-{formatCurrency(corporateResult.corporateDiscount)}</span>
                    </div>
                  )}
                  {corporateResult.invoiceNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Invoice</span>
                      <span className="text-sm font-bold font-mono text-blue-600">{corporateResult.invoiceNumber}</span>
                    </div>
                  )}
                  {corporateResult.walletBalance !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Remaining Credit</span>
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(corporateResult.walletBalance)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <p className="text-xs text-slate-400 mb-4">A confirmation has been saved to My Trips.</p>

            {/* Voucher / Booking Detail / Cancel Actions */}
            {tboBookingId && (
              <div className="bg-slate-50 rounded-xl p-4 mb-4 text-left space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Booking Actions</p>

                {voucherStatus && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={14} className={voucherStatus === "Voucher Generated" ? "text-emerald-600" : "text-red-500"} />
                    <span className={voucherStatus === "Voucher Generated" ? "text-emerald-700" : "text-red-600"}>{voucherStatus}</span>
                  </div>
                )}

                {bookingDetail && (
                  <div className="text-xs text-slate-600 space-y-1">
                    <p><span className="font-semibold">Status:</span> {(bookingDetail as Record<string, unknown>).status as string || "N/A"}</p>
                    <p><span className="font-semibold">Hotel:</span> {(bookingDetail as Record<string, unknown>).hotelName as string || "N/A"}</p>
                    <p><span className="font-semibold">Check-in:</span> {(bookingDetail as Record<string, unknown>).checkIn as string || "N/A"}</p>
                    <p><span className="font-semibold">Check-out:</span> {(bookingDetail as Record<string, unknown>).checkOut as string || "N/A"}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {!voucherStatus && (
                    <button
                      onClick={handleGenerateVoucher}
                      disabled={actionLoading === "voucher"}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoading === "voucher" ? "Generating..." : "Generate Voucher"}
                    </button>
                  )}
                  {!bookingDetail && (
                    <button
                      onClick={handleViewBookingDetail}
                      disabled={actionLoading === "detail"}
                      className="flex-1 py-2 bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoading === "detail" ? "Loading..." : "View Details"}
                    </button>
                  )}
                </div>

                {confirmation?.status !== "Cancelled" && (
                  <button
                    onClick={handleCancelBooking}
                    disabled={actionLoading === "cancel"}
                    className="w-full py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading === "cancel" ? "Cancelling..." : "Cancel Booking"}
                  </button>
                )}
              </div>
            )}

            <button
              onClick={handleClose}
              className="w-full py-3 bg-brand-saffron text-white rounded-xl font-bold hover:bg-brand-burnt cursor-pointer active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Booking Failed</h3>
            <p className="text-sm text-red-500 mb-6">{errorMessage}</p>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => { setStep("form"); setErrorMessage(""); }}
                className="flex-1 py-3 bg-brand-saffron text-white rounded-xl font-bold hover:bg-brand-burnt cursor-pointer active:scale-[0.98]"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
