"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/hooks/useAuth";
import HolidayPlanner from "@/components/HolidayPlanner";
import { BreadcrumbJsonLd } from "@/components/Breadcrumb";

const DESTINATIONS = [
  { name: "Bali", country: "Indonesia", description: "Tropical paradise with stunning temples, rice terraces, and pristine beaches." },
  { name: "Maldives", country: "Maldives", description: "Luxury overwater villas and crystal-clear waters in the Indian Ocean." },
  { name: "Dubai", country: "UAE", description: "World-class shopping, desert safaris, and iconic skyscrapers." },
  { name: "Thailand", country: "Thailand", description: "Vibrant street life, ornate temples, and tropical beaches." },
  { name: "Goa", country: "India", description: "Sun-kissed beaches, Portuguese heritage, and vibrant nightlife." },
  { name: "Kashmir", country: "India", description: "Paradise on Earth with snow-capped mountains and serene lakes." },
];

function TouristDestinationJsonLd() {
  const schemas = DESTINATIONS.map((dest) => ({
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: dest.name,
    description: dest.description,
    address: {
      "@type": "PostalAddress",
      addressCountry: dest.country,
    },
    touristType: "Leisure",
  }));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
    />
  );
}

export default function PlannerPage() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <TouristDestinationJsonLd />
      <BreadcrumbJsonLd items={[
        { name: "Home", href: "/" },
        { name: "Holidays", href: "/holidays" },
      ]} />
      <Navbar onLoginClick={() => setShowLogin(true)} />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />

      <main className="min-h-screen pt-16">
        <HolidayPlanner
          userName={user?.name}
          userEmail={user?.email}
        />
      </main>

      <Footer />
    </>
  );
}
