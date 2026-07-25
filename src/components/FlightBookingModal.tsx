"use client";

import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { formatCurrency } from "@/lib";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { parseFareType, parseFareInclusions, getFareTypeColor, formatFareType, type FareType } from "@/lib/fare-utils";
import {
  X, Loader2, CheckCircle, AlertCircle, Plane,
  MapPin, Calendar, Phone, Mail, User, CreditCard, Clock, Luggage,
  Tag, Building2, ChevronDown, ChevronUp, Globe, Utensils, Armchair,
  Trash2, XCircle,
} from "lucide-react";
import CancellationDialog from "./CancellationDialog";
import CheckoutButton from "./CheckoutButton";
import FormInput from "./ui/FormInput";
import FormPhone from "./ui/FormPhone";
import FormPan from "./ui/FormPan";
import FormGst from "./ui/FormGst";
import FormPassport from "./ui/FormPassport";
import FormSection from "./ui/FormSection";
import StepProgress from "./ui/StepProgress";
import { getRouteVisaWarnings } from "@/lib/visa-requirements";

interface Flight {
  id: string;
  airline: string;
  airlineCode?: string;
  flightNumber: string;
  operatingCarrier?: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  tier: string;
  baggage?: string;
  cabinBaggage?: string;
  isRefundable?: boolean;
  isLCC?: boolean;
  penalty?: string;
  baseFare?: number;
  tax?: number;
  yqTax?: number;
  fareType?: FareType;
  fareInclusions?: string[];
  airlineRemark?: string;
  fareClass?: string;
  isExclusiveFare?: boolean;
  isFreeMealAvailable?: boolean;
  validatingAirline?: string;
  gstAllowed?: boolean;
  resultIndex?: string;
  isDomestic?: boolean;
  isPassportRequiredAtBook?: boolean;
  baseRate?: number;
  markupAmount?: number;
}

interface SSRBaggage {
  Code: string;
  Weight: string;
  Price: number;
  AirlineCode: string;
  FlightNumber: string;
}

interface SSRMeal {
  Code: string;
  Description: string;
  AirlineDescription: string;
  Price: number;
}

interface SSRSeat {
  Code: string;
  RowNo: string;
  SeatNo: string;
  SeatType: string;
  Price: number;
}

interface FlightBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  flights: Flight[];
  user: { id: string; email: string; name: string; companyId?: string } | null;
  date: string;
  passengerCount: number;
  adults: number;
  children: number;
  infants: number;
  traceId?: string;
  childAges?: number[];
}

type BookingStep = "form" | "addons" | "saving" | "checkout" | "done" | "error";

export default function FlightBookingModal({
  isOpen, onClose, flights, user, date, passengerCount, adults, children, infants, traceId, childAges,
}: FlightBookingModalProps) {
  const flight = flights[0];
  const totalFlightPrice = flights.reduce((s, f) => s + f.price, 0);
  const totalBaseFare = flights.reduce((s, f) => s + (f.baseFare || 0), 0);
  const totalTax = flights.reduce((s, f) => s + (f.tax || 0), 0);
  const totalYqTax = flights.reduce((s, f) => s + (f.yqTax || 0), 0);
  const [step, setStep] = useState<BookingStep>("form");
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const dirtyRef = useRef(false);
  const [firstName, setFirstName] = useState(user?.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(user?.name?.split(" ").slice(1).join(" ") || "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [pan, setPan] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [nationality, setNationality] = useState("Indian");
  const [showGstFields, setShowGstFields] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [gstCompanyName, setGstCompanyName] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoClamped, setPromoClamped] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(0);
  const [couponCodeUsed, setCouponCodeUsed] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    pnr?: string;
    status?: string;
  } | null>(null);
  const [isTimeChanged, setIsTimeChanged] = useState(false);
  const [isCorporateBooking, setIsCorporateBooking] = useState(false);
  const [corporateLoading, setCorporateLoading] = useState(false);
  const [corporateResult, setCorporateResult] = useState<{
    invoiceNumber?: string;
    walletBalance?: number;
    creditLimit?: number;
    availableBalance?: number;
    corporateDiscount?: number;
  } | null>(null);
  const [showCancellation, setShowCancellation] = useState(false);

  // International detection
  const isInternational = flight.isDomestic === false || flight.isPassportRequiredAtBook === true;
  const passportRequired = isInternational || flight.isPassportRequiredAtBook === true;

  // Visa warnings for Indian passport holders
  const visaWarnings = getRouteVisaWarnings(
    flight.origin,
    flight.destination,
    flight.stops,
  );

  // Multi-passenger data for international flights
  interface PassengerData {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    nationality: string;
    passportNo: string;
    passportExpiry: string;
  }

  const otherAdultCount = Math.max(0, adults - 1);
  const childCount = children;
  const infantCount = infants;
  const otherPaxCount = otherAdultCount + childCount + infantCount;

  const [otherPassengers, setOtherPassengers] = useState<PassengerData[]>([]);

  if (otherPaxCount > 0 && otherPassengers.length !== otherPaxCount) {
    const newPassengers: PassengerData[] = [];
    for (let i = 0; i < otherPaxCount; i++) {
      newPassengers.push(otherPassengers[i] || {
        firstName: "", lastName: "", dateOfBirth: "", gender: "",
        nationality: "Indian", passportNo: "", passportExpiry: "",
      });
    }
    setOtherPassengers(newPassengers);
  }

  // Price change confirmation state
  const [priceChangeDialog, setPriceChangeDialog] = useState<{
    oldFare: number;
    newFare: number;
    fare: Record<string, unknown>;
    resolve: (accept: boolean) => void;
  } | null>(null);

  // SSR Add-ons state (per-passenger)
  const [ssrLoading, setSsrLoading] = useState(false);
  const [ssrBaggage, setSsrBaggage] = useState<SSRBaggage[]>([]);
  const [ssrMeals, setSsrMeals] = useState<SSRMeal[]>([]);
  const [ssrSeats, setSsrSeats] = useState<SSRSeat[]>([]);
  const [ssrSelections, setSsrSelections] = useState<Record<number, { baggage: string; meals: string[]; seat: string }>>({});
  const [activeSsrPax, setActiveSsrPax] = useState(0);

  // Build passenger labels for SSR tabs
  const paxLabels: string[] = [];
  for (let i = 0; i < adults; i++) paxLabels.push(`Adult ${i + 1}`);
  for (let i = 0; i < children; i++) paxLabels.push(`Child ${i + 1}`);
  for (let i = 0; i < infants; i++) paxLabels.push(`Infant ${i + 1}`);

  const currentSsrSelection = ssrSelections[activeSsrPax] || { baggage: "", meals: [], seat: "" };
  const updateSsrSelection = (field: "baggage" | "meals" | "seat", value: string | string[]) => {
    setSsrSelections(prev => ({
      ...prev,
      [activeSsrPax]: {
        ...(prev[activeSsrPax] || { baggage: "", meals: [], seat: "" }),
        [field]: value,
      },
    }));
  };

  const currentTraceIdRef = useRef(traceId);
  const [addressCity, setAddressCity] = useState("");

  const addonsTotal = Object.values(ssrSelections).reduce((sum, sel) => {
    const bFee = ssrBaggage.find(b => b.Code === sel.baggage)?.Price || 0;
    const mFee = ssrMeals.filter(m => sel.meals.includes(m.Code)).reduce((s, m) => s + m.Price, 0);
    const sFee = ssrSeats.find(s => s.Code === sel.seat)?.Price || 0;
    return sum + bFee + mFee + sFee;
  }, 0);

  const finalPrice = totalFlightPrice - discountApplied;
  const totalPayable = finalPrice + addonsTotal;

  const otherPassengersValid = otherPaxCount === 0 || otherPassengers.every(
    (p, i) => {
      if (!p.firstName.trim() || !p.lastName.trim()) return false;
      if (i < otherAdultCount) {
        return p.dateOfBirth && p.gender;
      }
      return true;
    },
  );

  const passportValid = !passportRequired || (passportNo.trim() && passportExpiry);

  const panRequired = !isInternational;
  const panValid = !panRequired || pan.trim().length === 10;
  const isValid = firstName.trim() && lastName.trim() && phone.trim().length >= 7 && email.trim()
    && otherPassengersValid && passportValid && panValid;

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
    setDiscountApplied(0);
    setCouponCodeUsed("");
    setPromoCode("");
    setPromoError("");
    setPromoClamped(false);
    setSsrSelections({});
    setActiveSsrPax(0);
    setSsrBaggage([]);
    setSsrMeals([]);
    setSsrSeats([]);
    setFormErrors({});
    setOtherPassengers([]);
    setAddressCity("");
    dirtyRef.current = false;
  };

  const markDirty = () => { dirtyRef.current = true; };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "firstName": return !value.trim() ? "First name is required" : "";
      case "lastName": return !value.trim() ? "Last name is required" : "";
      case "phone": return value.trim().length < 7 ? "Phone must be at least 7 digits" : "";
      case "email": return !value.trim() ? "Email is required" : "";
      case "pan": return !value.trim() ? "PAN is required for domestic flights" : (value && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value) ? "Invalid PAN format (ABCDE1234F)" : "");
      default: return "";
    }
  };

  const handleFieldBlur = (name: string, value: string) => {
    const error = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: error }));
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
          bookingAmount: totalFlightPrice,
          category: "FLIGHT",
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

  const fetchSSR = async () => {
    if (!flight.isLCC) {
      setStep("saving");
      handleBook();
      return;
    }
    setStep("addons");
    setSsrLoading(true);
    try {
      let traceId = currentTraceIdRef.current;
      let res = await fetch("/api/tbo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ssr", params: { traceId, resultIndex: flight.id } }),
      });
      let data = await res.json();

      if (data.error && data.error.includes("expired")) {
        console.log("[SSR] TraceId expired, re-searching...");
        const searchRes = await fetch("/api/tbo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "search",
            params: {
              origin: flight.origin,
              destination: flight.destination,
              adults,
              children,
              infants,
              date,
              tripType: "OneWay",
            },
          }),
        });
        const searchData = await searchRes.json();
        if (searchData.traceId) {
          traceId = searchData.traceId;
          currentTraceIdRef.current = traceId;
          res = await fetch("/api/tbo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "ssr", params: { traceId, resultIndex: flight.id } }),
          });
          data = await res.json();
        }
      }

      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Failed to load add-ons. Please try again.");
        setStep("error");
        return;
      }
      if (data.traceId) currentTraceIdRef.current = data.traceId;
      setSsrBaggage(data.baggage || []);
      setSsrMeals(data.meals || []);
      setSsrSeats(data.seats || []);
      if ((data.baggage || []).length === 0 && (data.meals || []).length === 0 && (data.seats || []).length === 0) {
        setStep("saving");
        handleBook();
        return;
      }
    } catch (e) {
      console.error("SSR fetch failed:", e);
      setErrorMessage("Could not load add-ons. Proceeding without selection.");
      setStep("error");
    } finally {
      setSsrLoading(false);
    }
  };

  const buildSSRBaggage = () => {
    const selections: any[] = [];
    Object.entries(ssrSelections).forEach(([paxIdx, sel]) => {
      if (sel.baggage) {
        const b = ssrBaggage.find((x: any) => x.Code === sel.baggage);
        if (b) selections.push({ ...b, PaxId: parseInt(paxIdx) + 1 });
      }
    });
    return selections.length > 0 ? selections : undefined;
  };

  const buildSSRMeals = () => {
    const selections: any[] = [];
    Object.entries(ssrSelections).forEach(([paxIdx, sel]) => {
      if (sel.meals.length > 0) {
        sel.meals.forEach((code: string) => {
          const m = ssrMeals.find((x: any) => x.Code === code);
          if (m) selections.push({ ...m, PaxId: parseInt(paxIdx) + 1 });
        });
      }
    });
    return selections.length > 0 ? selections : undefined;
  };

  const buildSSRSeats = () => {
    const selections: any[] = [];
    Object.entries(ssrSelections).forEach(([paxIdx, sel]) => {
      if (sel.seat) {
        const s = ssrSeats.find((x: any) => x.Code === sel.seat);
        if (s) selections.push({ ...s, PaxId: parseInt(paxIdx) + 1 });
      }
    });
    return selections.length > 0 ? selections : undefined;
  };

  const toggleMeal = (code: string) => {
    updateSsrSelection("meals",
      currentSsrSelection.meals.includes(code)
        ? currentSsrSelection.meals.filter(c => c !== code)
        : [...currentSsrSelection.meals, code]
    );
  };

  const handleBook = async () => {
    if (!isValid || !user) return;
    setStep("saving");

    try {
      // Build per-passenger add-ons
      const perPaxAddOns: Record<string, unknown>[] = [];
      Object.entries(ssrSelections).forEach(([paxIdx, sel]) => {
        const paxAddOns: Record<string, unknown> = { paxId: parseInt(paxIdx) + 1 };
        if (sel.baggage) {
          const b = ssrBaggage.find(x => x.Code === sel.baggage);
          if (b) paxAddOns.baggage = { code: b.Code, weight: b.Weight, price: b.Price };
        }
        if (sel.meals.length > 0) {
          paxAddOns.meals = sel.meals.map(code => {
            const m = ssrMeals.find(x => x.Code === code);
            return { code, description: m?.Description, price: m?.Price || 0 };
          });
        }
        if (sel.seat) {
          const s = ssrSeats.find(x => x.Code === sel.seat);
          if (s) paxAddOns.seat = { code: s.Code, seatNo: `${s.RowNo}${s.SeatNo}`, type: s.SeatType, price: s.Price };
        }
        if (Object.keys(paxAddOns).length > 1) perPaxAddOns.push(paxAddOns);
      });
      const addOns: Record<string, unknown> = perPaxAddOns.length > 0 ? { perPassenger: perPaxAddOns } : {};

      const nationalityCode = nationality === "Indian" ? "IN" : nationality.slice(0, 2).toUpperCase();
      const defaultCity = addressCity.trim() || "Mumbai";

      // Helper: compute DOB from age relative to departure date
      const computeDOBFromAge = (age: number): string => {
        const dep = date ? new Date(date) : new Date();
        dep.setFullYear(dep.getFullYear() - age);
        return dep.toISOString().slice(0, 10);
      };

      const buildPassenger = (paxId: number, paxType: number, isLead: boolean) => {
        const paxFirstName = isLead ? firstName.trim() : (otherPassengers[paxId - 2]?.firstName || `Guest ${paxId}`);
        const paxLastName = isLead ? lastName.trim() : (otherPassengers[paxId - 2]?.lastName || "Traveler");
        let paxDob = isLead ? (dateOfBirth || computeDOBFromAge(25)) : (otherPassengers[paxId - 2]?.dateOfBirth || "");
        // Issue 7: Fix default DOBs for children and infants
        if (!paxDob) {
          if (paxType === 2) {
            // Child: use childAges if available
            const childIdx = paxId - adults - 1;
            const childAge = childAges?.[childIdx] ?? 5;
            paxDob = computeDOBFromAge(childAge);
          } else if (paxType === 3) {
            // Infant: default to 1 year before departure
            paxDob = computeDOBFromAge(1);
          } else {
            paxDob = computeDOBFromAge(25);
          }
        }
        const paxGender = isLead ? gender : (otherPassengers[paxId - 2]?.gender || "M");
        const paxNationality = isLead ? nationality : (otherPassengers[paxId - 2]?.nationality || "Indian");
        const paxNatCode = paxNationality === "Indian" ? "IN" : paxNationality.slice(0, 2).toUpperCase();
        const paxPassportNo = isLead ? passportNo : (otherPassengers[paxId - 2]?.passportNo || "");
        const paxPassportExpiry = isLead ? passportExpiry : (otherPassengers[paxId - 2]?.passportExpiry || "");

        return {
          PaxId: paxId,
          Title: (isLead ? gender : otherPassengers[paxId - 2]?.gender) === "F" ? "Ms" : "Mr",
          FirstName: paxFirstName,
          LastName: paxLastName,
          PaxType: paxType,
          DateOfBirth: paxDob,
          Gender: paxGender === "F" ? 2 : 1,
          AddressLine1: defaultCity,
          City: defaultCity,
          CountryCode: nationalityCode,
          CountryName: nationality,
          ContactNo: isLead ? (phone || "") : "",
          Email: isLead ? (email || user.email) : "",
          IsLeadPax: isLead,
          Nationality: paxNatCode,
          PassportNo: paxPassportNo,
          PassportExpiry: paxPassportExpiry,
          PassportIssueCountryCode: paxPassportNo ? nationalityCode : undefined,
          Fare: {
            BaseFare: flight.baseFare || 0,
            Tax: flight.tax || 0,
            TransactionFee: 0,
            YQTax: flight.yqTax || 0,
            AdditionalTxnFeeOfrd: 0,
            AdditionalTxnFeePub: 0,
            AirTransFee: 0,
          },
        };
      };

      const passengers: ReturnType<typeof buildPassenger>[] = [];
      let paxId = 1;
      for (let i = 0; i < adults; i++) passengers.push(buildPassenger(paxId++, 1, i === 0));
      for (let i = 0; i < children; i++) passengers.push(buildPassenger(paxId++, 2, false));
      for (let i = 0; i < infants; i++) passengers.push(buildPassenger(paxId++, 3, false));

      let tboBookingId: string | null = null;
      let tboPnr: string | null = null;
      let currentTraceId = currentTraceIdRef.current;

      if (currentTraceId) {
        // Step 1: FareQuote — validate real-time price
        try {
          let fqRes = await fetchWithRetry("/api/tbo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "fare-quote",
              params: { traceId: currentTraceId, resultIndex: flight.id },
            }),
          });
          let fqData = await fqRes.json();

          if (fqData.error && fqData.error.includes("expired")) {
            console.log("[FareQuote] TraceId expired, re-searching...");
            const searchRes = await fetch("/api/tbo", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "search",
                params: {
                  origin: flight.origin,
                  destination: flight.destination,
                  adults,
                  children,
                  infants,
                  date,
                  tripType: "OneWay",
                },
              }),
            });
            const searchData = await searchRes.json();
            if (searchData.traceId) {
              currentTraceId = searchData.traceId;
              currentTraceIdRef.current = currentTraceId;
              fqRes = await fetchWithRetry("/api/tbo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "fare-quote",
                  params: { traceId: currentTraceId, resultIndex: flight.id },
                }),
              });
              fqData = await fqRes.json();
            }
          }

          if (fqData.traceId) {
            currentTraceId = fqData.traceId;
            currentTraceIdRef.current = currentTraceId;
          }
          if (fqData.isPriceChanged) {
            const userAccepted = await new Promise<boolean>(resolve => {
              setPriceChangeDialog({
                oldFare: totalFlightPrice,
                newFare: fqData.fare?.PublishedFare || flight.price,
                fare: fqData.fare,
                resolve,
              });
            });
            if (!userAccepted) {
              setStep("form");
              return;
            }
          }
        } catch (e) {
          console.warn("FareQuote failed:", e);
          setErrorMessage("Price verification failed. Please try again.");
          setStep("error");
          return;
        }

        // Step 2: Book via TBO — creates a reservation (skip for LCC flights)
        if (!flight.isLCC) {
          try {
            const bookRes = await fetchWithRetry("/api/tbo", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "book",
                params: { traceId: currentTraceId, resultIndex: flight.id, passengers },
              }),
            });
            const bookData = await bookRes.json();
            if (bookData.traceId) currentTraceId = bookData.traceId;
            if (bookData.bookingId) {
              tboBookingId = String(bookData.bookingId);
              tboPnr = bookData.pnr || null;
              if (bookData.isTimeChanged) {
                setIsTimeChanged(true);
              }
            } else {
              const errMsg = bookData.error || "";
              if (errMsg.toLowerCase().includes("lcc") || errMsg.toLowerCase().includes("ticket directly")) {
                console.log("TBO says this is LCC, skipping to Ticket step");
              } else {
                setErrorMessage("Flight booking failed at the airline. Please try again.");
                setStep("error");
                return;
              }
            }
          } catch (e) {
            console.error("TBO book failed:", e);
            setErrorMessage("Flight booking failed. Please try again.");
            setStep("error");
            return;
          }
        }

        // Step 3: Ticket — finalize the booking (for LCC, this replaces Book)
        {
          try {
            const ticketRes = await fetchWithRetry("/api/tbo", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "ticket",
                params: {
                  traceId: currentTraceId,
                  resultIndex: flight.id,
                  passengers,
                  bookingId: tboBookingId,
                  pnr: tboPnr,
                  isLCC: flight.isLCC,
                  segments: [],
                  fare: { BaseFare: flight.baseFare, Tax: flight.tax, YQTax: flight.yqTax || 0 },
                  fareBreakdown: [],
                  ssrBaggage: flight.isLCC ? buildSSRBaggage() : undefined,
                  ssrMeals: flight.isLCC ? buildSSRMeals() : undefined,
                  ssrSeats: flight.isLCC ? buildSSRSeats() : undefined,
                },
              }),
            });
            const ticketData = await ticketRes.json();
            if (ticketData.results?.[0]?.bookingId) {
              tboBookingId = String(ticketData.results[0].bookingId);
              tboPnr = ticketData.results[0].pnr || tboPnr;
            }
          } catch (e) {
            console.error("TBO ticket failed:", e);
            setErrorMessage("Ticket issuance failed. Your booking is reserved but not confirmed. Please contact support.");
            setStep("error");
            return;
          }
        }
      }

      const pnrCode = tboPnr || `TBO${tboBookingId?.slice(-8) || "PENDING"}`;

      const totalBaseRate = flights.reduce((s, f) => s + (f.baseRate || 0), 0);
      const totalMarkupAmount = flights.reduce((s, f) => s + (f.markupAmount || 0), 0);

      const saveRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "FLIGHT",
          itemName: flights.length === 1
            ? `${flight.airline} • ${flight.origin} → ${flight.destination}`
            : flights.map(f => `${f.airline} ${f.origin}→${f.destination}`).join(" + "),
          providerOrAirline: flight.airline,
          price: totalFlightPrice + addonsTotal,
          originalPrice: totalFlightPrice,
          discountApplied: discountApplied,
          promoCost: discountApplied,
          couponCodeUsed: couponCodeUsed || undefined,
          pnr: pnrCode,
          seatOrRoom: flight.tier,
          paxCount: passengerCount,
          travelDates: date || "TBD",
          leadGuestPan: isInternational ? undefined : (pan || undefined),
          supplierBookingRef: tboBookingId ? String(tboBookingId) : undefined,
          baseRate: totalBaseRate || undefined,
          markupAmount: totalMarkupAmount || undefined,
          metadata: {
            traceId: currentTraceId || undefined,
            resultIndex: flight.id,
            isLCC: flight.isLCC,
            isRefundable: flight.isRefundable,
            baseFare: totalBaseFare,
            tax: totalTax,
            addOns: Object.keys(addOns).length > 0 ? addOns : undefined,
            totalPayable,
          },
        }),
      });

      if (!saveRes.ok) {
        throw new Error("Failed to save booking");
      }

      const saveData = await saveRes.json();
      setBookingId(saveData.id);
      setConfirmation({ pnr: pnrCode, status: tboBookingId ? "Confirmed" : "Pending Payment" });

      if (saveToProfile && user) {
        try {
          await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              passengers: [{
                id: Date.now().toString(),
                name: `${firstName.trim()} ${lastName.trim()}`.trim(),
                relation: "Self",
                gender: gender || "Male",
                passport: passportNo || "",
                pan: pan.trim().toUpperCase(),
              }]
            }),
          });
        } catch (e) {
          console.warn("Profile save failed:", e);
        }
      }

      setStep("checkout");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStep("error");
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
        });
        setConfirmation({
          pnr: confirmation?.pnr,
          status: "Confirmed",
        });
        setStep("done");
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStep("error");
    } finally {
      setCorporateLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatTime = (iso: string) => {
    const parts = iso.split("T");
    return parts.length >= 2 ? parts[1].slice(0, 5) : iso;
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center sm:justify-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={handleClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="flight-booking-title"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 id="flight-booking-title" className="text-lg font-bold text-slate-900">
            {step === "addons" ? "Flight Add-ons" : "Complete Booking"}
          </h2>
          <button onClick={handleClose} aria-label="Close" className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer rounded-xl hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Step Indicator */}
        {step !== "done" && step !== "error" && (
          <StepProgress
            steps={[
              { label: "Details", status: step === "form" ? "active" : step === "addons" || step === "saving" || step === "checkout" ? "complete" : "pending" },
              ...(flight.isLCC ? [{ label: "Add-ons", status: step === "addons" ? "active" as const : step === "saving" || step === "checkout" ? "complete" as const : "pending" as const }] : []),
              { label: "Pay", status: step === "saving" || step === "checkout" ? "active" as const : "pending" as const },
            ]}
          />
        )}

        {/* FORM STEP */}
        {step === "form" && (
          <div className="p-6 space-y-5">
            {/* Booking Summary */}
            <div className="bg-blue-50 rounded-xl p-4 space-y-3">
              {flights.map((f, idx) => (
                <div key={f.id}>
                  <div className="flex items-start gap-3">
                    <Plane size={16} className="text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{f.airline}</p>
                      <p className="text-xs text-slate-500">{f.flightNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 ml-7">
                    <span className="flex items-center gap-1"><MapPin size={10} />{f.origin}</span>
                    <ArrowIcon />
                    <span className="flex items-center gap-1"><MapPin size={10} />{f.destination}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 ml-7">
                    <span className="flex items-center gap-1"><Clock size={12} />{formatTime(f.departureTime)} – {formatTime(f.arrivalTime)}</span>
                    <span className="flex items-center gap-1"><Luggage size={12} />{f.stops === 0 ? "Non-stop" : `${f.stops} stop`}</span>
                  </div>
                  {idx < flights.length - 1 && <div className="border-t border-blue-200/50 my-2" />}
                </div>
              ))}
              {date && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar size={12} />{date}
                </div>
              )}
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-slate-600"><Luggage size={12} />{flight.baggage || "15 KG"} checked</span>
                <span className="flex items-center gap-1 text-slate-600"><Luggage size={12} />{flight.cabinBaggage || "7 KG"} cabin</span>
                {flight.isLCC && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">LCC</span>}
              </div>
            </div>

            {/* Visa Requirement Warning */}
            {visaWarnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs font-bold text-amber-800 mb-1">Visa Requirements</p>
                {visaWarnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-700">{w}</p>
                ))}
              </div>
            )}

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

            {/* Passenger Details */}
            <FormSection icon={User} title="Passenger Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormInput
                  id="flight-firstName"
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
                  id="flight-lastName"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormInput
                  id="flight-dob"
                  label="Date of Birth"
                  required
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => { setDateOfBirth(e.target.value); markDirty(); }}
                  autoComplete="bday"
                />
                <div>
                  <label htmlFor="flight-gender" className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="flight-gender"
                    value={gender}
                    onChange={(e) => { setGender(e.target.value); markDirty(); }}
                    className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none transition-all"
                  >
                    <option value="">Select</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormPan
                  id="flight-pan"
                  label={isInternational ? "PAN Card Number" : "PAN Card Number *"}
                  value={pan}
                  onChange={(e) => { setPan(e.target.value); markDirty(); }}
                  hidden={false}
                  onBlur={(e) => handleFieldBlur("pan", e.target.value)}
                  error={formErrors.pan}
                />
                <FormInput
                  id="flight-nationality"
                  label="Nationality"
                  value={nationality}
                  onChange={(e) => { setNationality(e.target.value); markDirty(); }}
                  autoComplete="country-name"
                />
              </div>
              <FormInput
                id="flight-city"
                label="City (for airline records)"
                value={addressCity}
                onChange={(e) => { setAddressCity(e.target.value); markDirty(); }}
                placeholder="Mumbai"
                autoComplete="address-level2"
              />
              <FormPassport
                id="flight-passport"
                passportNo={passportNo}
                passportExpiry={passportExpiry}
                onPassportNoChange={(v) => { setPassportNo(v); markDirty(); }}
                onPassportExpiryChange={(v) => { setPassportExpiry(v); markDirty(); }}
                required={passportRequired}
                label={passportRequired ? "(Required for international)" : undefined}
                travelDate={date}
              />
            </FormSection>

            {/* Additional Passengers */}
            {otherPaxCount > 0 && (
              <FormSection icon={User} title={`Additional Passengers (${otherPaxCount})`}>
                {otherPassengers.map((pax, idx) => {
                  const paxLabel = idx < otherAdultCount
                    ? `Adult ${idx + 2}`
                    : idx < otherAdultCount + childCount
                      ? `Child ${idx - otherAdultCount + 1}`
                      : `Infant ${idx - otherAdultCount - childCount + 1}`;
                  return (
                    <div key={idx} className="mb-4 pb-4 border-b border-slate-100 last:border-0 last:mb-0 last:pb-0">
                      <p className="text-xs font-bold text-slate-600 mb-2">{paxLabel}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormInput
                          id={`pax-${idx}-firstName`}
                          label="First Name"
                          required
                          value={pax.firstName}
                          onChange={(e) => {
                            const updated = [...otherPassengers];
                            updated[idx] = { ...updated[idx], firstName: e.target.value };
                            setOtherPassengers(updated);
                            markDirty();
                          }}
                          placeholder="First Name"
                        />
                        <FormInput
                          id={`pax-${idx}-lastName`}
                          label="Last Name"
                          required
                          value={pax.lastName}
                          onChange={(e) => {
                            const updated = [...otherPassengers];
                            updated[idx] = { ...updated[idx], lastName: e.target.value };
                            setOtherPassengers(updated);
                            markDirty();
                          }}
                          placeholder="Last Name"
                        />
                      </div>
                      {idx < otherAdultCount && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          <FormInput
                            id={`pax-${idx}-dob`}
                            label="Date of Birth"
                            required
                            type="date"
                            value={pax.dateOfBirth}
                            onChange={(e) => {
                              const updated = [...otherPassengers];
                              updated[idx] = { ...updated[idx], dateOfBirth: e.target.value };
                              setOtherPassengers(updated);
                              markDirty();
                            }}
                          />
                          <div>
                            <label htmlFor={`pax-${idx}-gender`} className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                              Gender <span className="text-red-500">*</span>
                            </label>
                            <select
                              id={`pax-${idx}-gender`}
                              value={pax.gender}
                              onChange={(e) => {
                                const updated = [...otherPassengers];
                                updated[idx] = { ...updated[idx], gender: e.target.value };
                                setOtherPassengers(updated);
                                markDirty();
                              }}
                              className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none transition-all"
                            >
                              <option value="">Select</option>
                              <option value="M">Male</option>
                              <option value="F">Female</option>
                            </select>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        <FormInput
                          id={`pax-${idx}-nationality`}
                          label="Nationality"
                          value={pax.nationality}
                          onChange={(e) => {
                            const updated = [...otherPassengers];
                            updated[idx] = { ...updated[idx], nationality: e.target.value };
                            setOtherPassengers(updated);
                            markDirty();
                          }}
                        />
                        <div />
                      </div>
                      {isInternational && (
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                              Passport No <span className="text-red-500">*</span>
                            </label>
                            <input
                              value={pax.passportNo}
                              onChange={(e) => {
                                const updated = [...otherPassengers];
                                updated[idx] = { ...updated[idx], passportNo: e.target.value.toUpperCase() };
                                setOtherPassengers(updated);
                                markDirty();
                              }}
                              placeholder="Passport No"
                              maxLength={15}
                              className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm uppercase focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none transition-all min-h-[44px]"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                              Passport Expiry <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={pax.passportExpiry}
                              onChange={(e) => {
                                const updated = [...otherPassengers];
                                updated[idx] = { ...updated[idx], passportExpiry: e.target.value };
                                setOtherPassengers(updated);
                                markDirty();
                              }}
                              className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none transition-all min-h-[44px]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </FormSection>
            )}

            {/* Contact Info */}
            <FormSection icon={Phone} title="Contact Info">
              <FormPhone
                id="flight-phone"
                label="Phone Number"
                required
                value={phone}
                onChange={(e) => { setPhone(e.target.value); markDirty(); }}
                onBlur={(e) => handleFieldBlur("phone", e.target.value)}
                error={formErrors.phone}
                placeholder="9876543210"
              />
              <FormInput
                id="flight-email"
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

            {/* B2B GST Toggle */}
            <FormGst
              id="flight-gst"
              gstNumber={gstNumber}
              gstCompanyName={gstCompanyName}
              onGstNumberChange={(v) => { setGstNumber(v); markDirty(); }}
              onGstCompanyNameChange={(v) => { setGstCompanyName(v); markDirty(); }}
              hidden={isInternational}
            />
            {isInternational && (
              <p className="text-[10px] text-slate-400">GST applicable for domestic bookings only</p>
            )}

            {/* Save to Profile */}
            {user && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToProfile}
                  onChange={(e) => setSaveToProfile(e.target.checked)}
                  className="w-5 h-5 text-brand-saffron rounded border-slate-300 cursor-pointer"
                />
                <span className="text-sm text-slate-600">Save traveller to my profile for future bookings</span>
              </label>
            )}

            <button
              onClick={fetchSSR}
              disabled={!isValid}
              className="w-full py-3.5 bg-brand-saffron text-white rounded-xl font-bold hover:bg-brand-burnt transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {flight.isLCC ? (
                <><Luggage size={18} /> Continue to Add-ons</>
              ) : (
                <><CreditCard size={18} /> Confirm Booking – {formatCurrency(totalPayable)}</>
              )}
            </button>
          </div>
        )}

        {/* ADD-ONS STEP */}
        {step === "addons" && (
          <div className="p-6 space-y-5">
            {/* Per-passenger tabs for SSR add-ons */}
            {passengerCount > 1 && !ssrLoading && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Select add-ons for</p>
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {paxLabels.map((label, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSsrPax(idx)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-all min-h-[44px] ${
                        activeSsrPax === idx
                          ? "bg-brand-saffron text-white"
                          : ssrSelections[idx] && (ssrSelections[idx].baggage || ssrSelections[idx].meals.length > 0 || ssrSelections[idx].seat)
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {label}
                      {ssrSelections[idx] && (ssrSelections[idx].baggage || ssrSelections[idx].meals.length > 0 || ssrSelections[idx].seat) && (
                        <span className="ml-1">\u2713</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {ssrLoading ? (
              <div className="py-12 text-center">
                <Loader2 size={32} className="mx-auto text-blue-600 mb-3 animate-spin" />
                <p className="text-sm text-slate-500">Loading add-ons...</p>
              </div>
            ) : (
              <>
                {/* Baggage */}
                {ssrBaggage.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Luggage size={16} className="text-blue-500" />
                      <h3 className="font-bold text-slate-900 text-sm">Extra Baggage for {paxLabels[activeSsrPax]}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">Included: {flight.baggage || "15 KG"} per passenger</p>
                    <div className="space-y-2">
                      <label
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all min-h-[44px] ${
                          !currentSsrSelection.baggage ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`baggage-${activeSsrPax}`}
                            checked={!currentSsrSelection.baggage}
                            onChange={() => updateSsrSelection("baggage", "")}
                            className="text-blue-600"
                          />
                          <div>
                            <p className="text-sm font-medium text-slate-900">No extra baggage</p>
                            <p className="text-xs text-slate-500">Use included allowance</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-green-600">Included</span>
                      </label>
                      {ssrBaggage.map((b) => (
                        <label
                          key={b.Code}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all min-h-[44px] ${
                            currentSsrSelection.baggage === b.Code ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`baggage-${activeSsrPax}`}
                              checked={currentSsrSelection.baggage === b.Code}
                              onChange={() => updateSsrSelection("baggage", b.Code === currentSsrSelection.baggage ? "" : b.Code)}
                              className="text-blue-600"
                            />
                            <div>
                              <p className="text-sm font-medium text-slate-900">{b.Weight}</p>
                              <p className="text-xs text-slate-500">{b.AirlineCode} {b.FlightNumber}</p>
                            </div>
                          </div>
                          <span className={`text-sm font-bold ${b.Price === 0 ? "text-green-600" : "text-slate-900"}`}>
                            {b.Price === 0 ? "Free" : `+${formatCurrency(b.Price)}`}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meals */}
                {ssrMeals.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Utensils size={16} className="text-orange-500" />
                      <h3 className="font-bold text-slate-900 text-sm">Meals for {paxLabels[activeSsrPax]}</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ssrMeals.map((m) => (
                        <label
                          key={m.Code}
                          className={`flex flex-col items-center p-3 rounded-xl border cursor-pointer transition-all min-h-[44px] ${
                            currentSsrSelection.meals.includes(m.Code) ? "border-orange-500 bg-orange-50" : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={currentSsrSelection.meals.includes(m.Code)}
                            onChange={() => toggleMeal(m.Code)}
                            className="text-orange-600 mb-1"
                          />
                          <p className="text-xs font-medium text-slate-900 text-center">{m.Description}</p>
                          <p className="text-xs font-bold text-slate-700">+{formatCurrency(m.Price)}</p>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seats */}
                {ssrSeats.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Armchair size={16} className="text-purple-500" />
                      <h3 className="font-bold text-slate-900 text-sm">Seat Selection for {paxLabels[activeSsrPax]}</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ssrSeats.map((s) => (
                        <label
                          key={s.Code}
                          className={`flex flex-col items-center p-2 rounded-xl border cursor-pointer transition-all min-h-[44px] ${
                            currentSsrSelection.seat === s.Code ? "border-purple-500 bg-purple-50" : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`seat-${activeSsrPax}`}
                            checked={currentSsrSelection.seat === s.Code}
                            onChange={() => updateSsrSelection("seat", s.Code === currentSsrSelection.seat ? "" : s.Code)}
                            className="text-purple-600 mb-1"
                          />
                          <p className="text-xs font-bold text-slate-900">{s.RowNo}{s.SeatNo}</p>
                          <p className="text-[10px] text-slate-500">{s.SeatType}</p>
                          <p className="text-[10px] font-bold text-slate-700">+{formatCurrency(s.Price)}</p>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Summary */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Price Summary</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Flight Fare</span>
                    <span className="text-slate-900">{formatCurrency(totalFlightPrice)}</span>
                  </div>
                  {discountApplied > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Promo ({couponCodeUsed})</span>
                      <span className="text-green-600">-{formatCurrency(discountApplied)}</span>
                    </div>
                  )}
                  {addonsTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Add-ons ({Object.values(ssrSelections).filter(s => s.baggage || s.meals.length > 0 || s.seat).length} pax)</span>
                      <span className="text-slate-900">+{formatCurrency(addonsTotal)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-2 flex justify-between">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="font-black font-mono text-lg text-blue-700">{formatCurrency(totalPayable)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep("form")}
                    className="px-4 py-3 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleBook}
                    className="flex-1 py-3 bg-brand-saffron text-white rounded-xl font-bold hover:bg-brand-burnt cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <CreditCard size={18} />
                    Proceed to Pay – {formatCurrency(totalPayable)}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* SAVING STEP */}
        {step === "saving" && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-brand-antique-gold/10 flex items-center justify-center">
              <Loader2 size={28} className="animate-spin text-brand-antique-gold" />
            </div>
            <h3 className="font-bold text-brand-charcoal mb-1">Creating Booking...</h3>
            <p className="text-sm text-slate-600">Saving your flight reservation</p>
          </div>
        )}

        {/* CHECKOUT STEP */}
        {step === "checkout" && bookingId && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <CreditCard size={32} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Booking Created!</h3>
            <p className="text-sm text-slate-500 mb-6">Complete payment to confirm your booking.</p>

            <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-left mb-6">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">PNR</span>
                <span className="text-sm font-bold font-mono text-slate-900">{confirmation?.pnr}</span>
              </div>
              {flights.map((f, i) => (
                <div key={f.id} className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">{i === 0 ? "Flight" : "Leg"}</span>
                  <span className="text-sm font-bold text-slate-900 text-right">{f.airline} {f.flightNumber}<br /><span className="text-xs font-normal text-slate-500">{f.origin} → {f.destination}</span></span>
                </div>
              ))}

              <div className="border-t border-slate-200 pt-3 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Price Breakup</p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Base Fare ({passengerCount} pax)</span>
                  <span className="text-slate-900">{formatCurrency(totalBaseFare)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Taxes & Surcharges</span>
                  <span className="text-slate-900">{formatCurrency(totalTax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="text-slate-900">{formatCurrency(totalFlightPrice)}</span>
                </div>
                {discountApplied > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Promo ({couponCodeUsed})</span>
                    <span className="text-green-600">-{formatCurrency(discountApplied)}</span>
                  </div>
                )}
                {addonsTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Add-ons ({Object.values(ssrSelections).filter(s => s.baggage || s.meals.length > 0 || s.seat).length} pax)</span>
                    <span className="text-slate-900">+{formatCurrency(addonsTotal)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                  <span className="font-bold text-slate-900">Total Amount</span>
                  <span className="font-black font-mono text-lg text-blue-700">{formatCurrency(totalPayable)}</span>
                </div>
              </div>
            </div>

            {user?.companyId ? (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 size={16} className="text-blue-600" />
                    <span className="text-sm font-bold text-blue-900">Corporate Booking</span>
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
              <CheckoutButton bookingId={bookingId} amount={totalPayable} />
            )}

            <button onClick={handleClose} className="w-full mt-3 py-2.5 text-sm text-slate-500 hover:text-slate-700 cursor-pointer">
              Pay Later
            </button>
          </div>
        )}

        {/* DONE STEP */}
        {step === "done" && confirmation && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Booking Confirmed!</h3>
            <p className="text-sm text-slate-500 mb-6">
              {isCorporateBooking
                ? "Your corporate flight booking has been confirmed and charged to your company account."
                : "Your flight has been booked successfully."}
            </p>
            {isTimeChanged && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-left">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-amber-600" />
                  <span className="text-xs font-bold text-amber-800">
                    Flight time has changed since your search. Please check your email for updated schedule.
                  </span>
                </div>
              </div>
            )}
            {isCorporateBooking && corporateResult && (
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-left mb-6">
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
                      <span className="font-bold text-slate-900">{formatCurrency(corporateResult.availableBalance || corporateResult.walletBalance)}</span>
                    </div>
                )}
              </div>
            )}
            <button onClick={handleClose} className="w-full py-3 bg-brand-saffron text-white rounded-xl font-bold hover:bg-brand-burnt cursor-pointer active:scale-[0.98]">Done</button>
            <button
              onClick={() => setShowCancellation(true)}
              className="w-full mt-3 py-2.5 text-sm text-red-600 hover:text-red-700 font-medium cursor-pointer"
            >
              Cancel Booking
            </button>
          </div>
        )}

        {/* PRICE CHANGE CONFIRMATION */}
        {priceChangeDialog && (
          <div className="p-6 text-left">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle size={32} className="text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1 text-center">Price Changed</h3>
            <p className="text-sm text-slate-500 mb-6 text-center">
              The fare has changed since your search. Please review below.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Original Fare</span>
                <span className="text-sm font-bold text-slate-400 line-through">{formatCurrency(priceChangeDialog.oldFare)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">New Fare</span>
                <span className="text-lg font-bold text-amber-600">{formatCurrency(priceChangeDialog.newFare)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { priceChangeDialog.resolve(false); setPriceChangeDialog(null); }}
                className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 cursor-pointer"
              >
                Cancel Booking
              </button>
              <button
                onClick={() => { priceChangeDialog.resolve(true); setPriceChangeDialog(null); }}
                className="flex-1 py-3 bg-brand-saffron text-white rounded-xl font-bold hover:bg-brand-burnt cursor-pointer active:scale-[0.98]"
              >
                Accept New Price
              </button>
            </div>
          </div>
        )}

        {/* ERROR STEP */}
        {step === "error" && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Booking Failed</h3>
            <p className="text-sm text-red-500 mb-6">{errorMessage}</p>
            <div className="flex gap-2">
              <button onClick={handleClose} className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 cursor-pointer">Cancel</button>
              <button onClick={() => { setStep("form"); setErrorMessage(""); }} className="flex-1 py-3 bg-brand-saffron text-white rounded-xl font-bold hover:bg-brand-burnt cursor-pointer active:scale-[0.98]">Try Again</button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Cancellation Dialog */}
      <CancellationDialog
        isOpen={showCancellation}
        onClose={() => setShowCancellation(false)}
        onConfirm={async (reason) => {
          if (!bookingId) return;
          const res = await fetch("/api/cancellations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId, reason }),
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Cancellation failed");
          }
          const data = await res.json();
          setConfirmation(prev => prev ? { ...prev, status: "Cancelled" } : null);
        }}
        bookingId={bookingId || ""}
        bookingType="FLIGHT"
        bookingPrice={totalFlightPrice + addonsTotal}
        itemName={`${flight.airline} ${flight.origin} \u2192 ${flight.destination}`}
      />
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="32" height="8" viewBox="0 0 32 8" fill="none" className="text-slate-300">
      <path d="M31.3536 4.35355C31.5488 4.15829 31.5488 3.84171 31.3536 3.64645L28.1716 0.464466C27.9763 0.269204 27.6597 0.269204 27.4645 0.464466C27.2692 0.659728 27.2692 0.976311 27.4645 1.17157L30.2929 4L27.4645 6.82843C27.2692 7.02369 27.2692 7.34027 27.4645 7.53553C27.6597 7.7308 27.9763 7.7308 28.1716 7.53553L31.3536 4.35355ZM0 4.5H31V3.5H0V4.5Z" fill="currentColor" />
    </svg>
  );
}
