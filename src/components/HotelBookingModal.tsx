"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { formatCurrency } from "@/lib";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { formatMealPlan } from "@/lib/format-meal-plan";
import {
  X, Loader2, CheckCircle, AlertCircle, Building2,
  Bed, MapPin, Calendar, Phone, Mail, User, CreditCard,
  Tag, ChevronDown, ChevronUp, Globe, Home, Clock
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
  rooms?: TBODisplayRoom[];
  sessionId: string;
  traceId?: string;
  user: { id: string; email: string; name: string; companyId?: string } | null;
  location: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  roomConfigs?: { adults: number; children: number; childAges: number[] }[];
}

type BookingStep = "form" | "blocking" | "book-confirming" | "saving" | "checkout" | "done" | "error";

export default function HotelBookingModal({
  isOpen, onClose, hotel, room, rooms, sessionId, traceId, user, location,
  checkIn, checkOut, guestCount, roomConfigs,
}: HotelBookingModalProps) {
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
  const [promoClamped, setPromoClamped] = useState(false);
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
    creditLimit?: number;
    availableBalance?: number;
    corporateDiscount?: number;
    corporateRuleName?: string;
  } | null>(null);
  const [voucherStatus, setVoucherStatus] = useState<string | null>(null);
  const [bookingDetail, setBookingDetail] = useState<Record<string, unknown> | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [validationInfo, setValidationInfo] = useState<{ PanMandatory?: boolean; PanPassport?: boolean; PassportMandatory?: boolean } | null>(null);
  const [lastCancellationDeadline, setLastCancellationDeadline] = useState<string | null>(null);

  // Multi-room state: track which rooms are selected and passengers for each room
  const allRooms = rooms || [room];
  const isMultiRoom = allRooms.length > 1;
  const [selectedRoomIndices, setSelectedRoomIndices] = useState<number[]>([0]);
  const [roomPassengers, setRoomPassengers] = useState<Record<number, {
    firstName: string;
    lastName: string;
    age: number;
    email: string;
    phone: string;
    pan: string;
    passportNo: string;
    passportExpiry: string;
  }[]>>({});

  // Initialize room passengers when roomConfigs change (adults + children)
  useEffect(() => {
    if (roomConfigs && roomConfigs.length > 0) {
      const initial: Record<number, typeof roomPassengers[0]> = {};
      roomConfigs.forEach((config, idx) => {
        const passengers: typeof roomPassengers[0] = [];
        // Add adults
        for (let i = 0; i < config.adults; i++) {
          passengers.push({
            firstName: i === 0 && user ? (user.name?.split(" ")[0] || "") : "",
            lastName: i === 0 && user ? (user.name?.split(" ").slice(1).join(" ") || "") : "",
            age: 25,
            email: i === 0 && user ? user.email : "",
            phone: "",
            pan: "",
            passportNo: "",
            passportExpiry: "",
          });
        }
        // Add children with their ages
        for (let i = 0; i < config.children; i++) {
          passengers.push({
            firstName: "",
            lastName: "",
            age: config.childAges?.[i] || 5,
            email: "",
            phone: "",
            pan: "",
            passportNo: "",
            passportExpiry: "",
          });
        }
        initial[idx] = passengers;
      });
      setRoomPassengers(initial);
      setSelectedRoomIndices(Array.from({ length: roomConfigs.length }, (_, i) => i));
    }
  }, [roomConfigs, user]);

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
  const roomCount = roomConfigs?.length || 1;
  // Total per room per night = base + tax. Use room.totalFare / nights as ground truth.
  const perRoomPerNight = Math.round(room.totalFare / nights);
  const perRoomTotal = perRoomPerNight * nights;
  const rawTotal = perRoomTotal * roomCount;
  const serviceFee = Math.max(0, hotel.price - rawTotal);
  const totalPayable = hotel.price - discountApplied; // Total for all rooms
  const passportValid = !passportRequired || (passportNo.trim() && passportExpiry);
  const panValid = !panRequired || pan.trim().length > 0;
  const isValid = firstName.trim() && lastName.trim() && phone.trim().length >= 7 && email.trim() && passportValid && panValid;

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
    setPromoClamped(false);
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
        setPromoClamped(data.clamped || false);
      } else {
        setPromoError(data.error || "Invalid promo code");
        setDiscountApplied(0);
        setCouponCodeUsed("");
        setPromoClamped(false);
      }
    } catch {
      setPromoError("Failed to validate promo code");
    } finally {
      setPromoLoading(false);
    }
  };

      const handleBook = async () => {
    if (!isValid || !user) return;
    if (!room.bookingCode) {
      setErrorMessage("This room is no longer available. Please search again.");
      setStep("error");
      return;
    }
    setStep("blocking");

    try {
      const clientRef = `GR-${Date.now()}`;
      let pnrCode = clientRef;
      let confirmationNo = "";
      let bookData: Record<string, any> | null = null;

      const blockRes = await fetchWithRetry("/api/tbo-hotels", {
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

        if (!blockRes.ok || !blockData.success) {
          setErrorMessage(blockData.error || "Price could not be verified. Please try again.");
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
          hotelRoomsDetails: isMultiRoom && roomPassengers[selectedRoomIndices[0]] ? selectedRoomIndices.map((roomIdx, i) => {
            const passengers = roomPassengers[roomIdx] || [];
            return {
              passengers: passengers.map((p, paxIdx) => {
                const roomConfig = roomConfigs?.[roomIdx];
                const isChildPax = roomConfig ? paxIdx >= roomConfig.adults : false;
                return {
                title: isChildPax ? "Mstr" : "Mr",
                firstName: p.firstName.trim() || (isChildPax ? `Child${paxIdx - (roomConfig?.adults || 0) + 1}` : `Guest${paxIdx + 1}`),
                lastName: p.lastName.trim() || `Room${i + 1}`,
                paxType: isChildPax ? 2 : 1,
                leadPassenger: paxIdx === 0,
                age: p.age,
                email: p.email.trim() || email.trim(),
                phone: p.phone.trim() || phone.trim(),
                pan: p.pan.trim() ? p.pan.trim().toUpperCase() : (showPan && pan.trim() ? pan.trim().toUpperCase() : undefined),
                passportNo: p.passportNo || (showPassport && passportNo ? passportNo : undefined),
                passportExpiry: p.passportExpiry || (showPassport && passportExpiry ? passportExpiry : undefined),
                addressLine1: addressLine1 || undefined,
                city: addressCity || location,
                countryCode: guestNationality,
                nationality: guestNationality,
              };
            })
            };
          }) : [{
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

        const bookRes = await fetchWithRetry("/api/tbo-hotels", {
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
          // Fetch booking detail only (voucher is optional, generated manually if needed)
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

      const saveRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "HOTEL",
          itemName: hotel.name,
          providerOrAirline: "GoRASA",
          price: hotel.price,
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
          markupAmount: Math.max(0, hotel.price - room.totalFare),
          metadata: {
            tboBookingId: bookData?.bookingId,
            confirmationNo: bookData?.confirmationNo,
            hotelCode: hotel.hotelCode,
            roomName: room.name,
            bookingCode: room.bookingCode,
            totalPayable,
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
        setVoucherStatus("Voucher not available");
      }
    } catch {
      setVoucherStatus("Voucher not available");
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
          creditLimit: data.creditLimit,
          availableBalance: data.availableBalance,
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
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center sm:justify-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={handleClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hotel-booking-title"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 id="hotel-booking-title" className="text-lg font-bold text-slate-900">Complete Booking</h2>
          <button onClick={handleClose} aria-label="Close" className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer rounded-xl hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {step === "form" && (
          <div className="p-6 space-y-5">
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
                  <span className="text-slate-600">Room ({nights} night{nights > 1 ? "s" : ""}{roomCount > 1 ? `, ${roomCount} rooms` : ""})</span>
                  <span className="text-slate-900">{formatCurrency(rawTotal)}</span>
                </div>
                {serviceFee > 0 && (
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Service Fee</span>
                    <span>{formatCurrency(serviceFee)}</span>
                  </div>
                )}
                {discountApplied > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Discount ({couponCodeUsed})</span>
                    <span className="text-green-600">-{formatCurrency(discountApplied)}</span>
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
                    placeholder="Enter promo code"
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
              {promoClamped && (
                <p className="text-xs text-amber-600 mt-1">
                  Discount capped at {formatCurrency(discountApplied)} (maximum discount for this booking)
                </p>
              )}
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

            {/* Multi-room passenger details */}
            {roomConfigs && roomConfigs.length > 1 && selectedRoomIndices.map((roomIdx, i) => {
              const roomPass = roomPassengers[roomIdx] || [];
              const config = roomConfigs?.[roomIdx];
              if (!config) return null;
              return (
                <FormSection key={roomIdx} icon={User} title={`Room ${i + 1} - ${config.adults} Adult${config.adults > 1 ? "s" : ""}${config.children > 0 ? `, ${config.children} Child${config.children > 1 ? "ren" : ""}` : ""}`}>
                  {roomPass.map((pax, paxIdx) => {
                    const isChild = config && paxIdx >= config.adults;
                    const paxLabel = isChild
                      ? `Child ${paxIdx - config.adults + 1}`
                      : paxIdx === 0 ? "Lead Guest (Adult 1)" : `Adult ${paxIdx + 1}`;
                    return (
                    <div key={paxIdx} className="mb-4 pb-4 border-b border-slate-100 last:border-0 last:mb-0 last:pb-0">
                      <p className="text-xs font-bold text-slate-600 mb-2">
                        {paxLabel}
                        {isChild && <span className="ml-2 text-[10px] font-normal text-slate-400">Age {pax.age}</span>}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormInput
                          id={`room${roomIdx}-pax${paxIdx}-firstName`}
                          label="First Name"
                          required
                          value={pax.firstName}
                          onChange={(e) => {
                            const updated = { ...roomPassengers };
                            updated[roomIdx] = [...(updated[roomIdx] || [])];
                            updated[roomIdx][paxIdx] = { ...updated[roomIdx][paxIdx], firstName: e.target.value };
                            setRoomPassengers(updated);
                            markDirty();
                          }}
                          placeholder="First Name"
                        />
                        <FormInput
                          id={`room${roomIdx}-pax${paxIdx}-lastName`}
                          label="Last Name"
                          required
                          value={pax.lastName}
                          onChange={(e) => {
                            const updated = { ...roomPassengers };
                            updated[roomIdx] = [...(updated[roomIdx] || [])];
                            updated[roomIdx][paxIdx] = { ...updated[roomIdx][paxIdx], lastName: e.target.value };
                            setRoomPassengers(updated);
                            markDirty();
                          }}
                          placeholder="Last Name"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Age</label>
                          <input
                            type="number"
                            min={1}
                            max={120}
                            value={pax.age}
                            onChange={(e) => {
                              const updated = { ...roomPassengers };
                              updated[roomIdx] = [...(updated[roomIdx] || [])];
                              updated[roomIdx][paxIdx] = { ...updated[roomIdx][paxIdx], age: Math.max(1, Math.min(120, parseInt(e.target.value) || 25)) };
                              setRoomPassengers(updated);
                              markDirty();
                            }}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                          />
                        </div>
                        <div />
                      </div>
                    </div>
                  );})}
                </FormSection>
              );
            })}

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
            <p className="text-sm text-slate-600">
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
                {roomCount > 1 && (
                  <p className="text-[10px] text-slate-500 mb-1">Per room × {roomCount} rooms × {nights} night{nights > 1 ? "s" : ""}</p>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Room ({nights} night{nights > 1 ? "s" : ""}{roomCount > 1 ? `, ${roomCount} rooms` : ""})</span>
                  <span className="text-slate-900">{formatCurrency(rawTotal)}</span>
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
                {serviceFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Service Fee</span>
                    <span className="text-slate-900">{formatCurrency(serviceFee)}</span>
                  </div>
                )}
                {discountApplied > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Promo ({couponCodeUsed})</span>
                    <span className="text-green-600">-{formatCurrency(discountApplied)}</span>
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
                    {lastCancellationDeadline && !isNaN(new Date(lastCancellationDeadline).getTime())
                      ? <>Free cancellation until {new Date(lastCancellationDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</>
                      : <>Free cancellation available</>
                    }
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
                  <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Remaining Balance</span>
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(corporateResult.availableBalance || corporateResult.walletBalance)}</span>
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
