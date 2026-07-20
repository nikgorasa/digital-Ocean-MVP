import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import { Shield, Award, Users, Globe, Phone, Mail, MapPin, CheckCircle } from "lucide-react";

export const revalidate = 86400;

const SITE_URL = "https://cckr.vercel.app";

export const metadata: Metadata = {
  title: "About GoRASA — Premium Travel Experts Since 2020",
  description: "GoRASA is India's premium travel booking platform offering curated holiday packages, luxury hotels, and flights to 100+ destinations worldwide. Founded by travel experts with 15+ years of experience.",
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: "About GoRASA | Premium Travel Experts",
    description: "India's premium travel booking platform for luxury flights, hotels, and curated holiday packages.",
    url: `${SITE_URL}/about`,
    type: "website",
  },
};

const TEAM_MEMBERS = [
  { name: "Rasa Travel", role: "Founder & CEO", bio: "15+ years in luxury travel. Former VP at a leading OTA. Passionate about creating unforgettable travel experiences." },
  { name: "Travel Operations", role: "Head of Operations", bio: "10+ years managing travel operations across Southeast Asia and Middle East. Expert in supplier relationships." },
  { name: "Customer Success", role: "Head of Customer Success", bio: "Dedicated to ensuring every GoRASA traveler has a seamless experience from booking to return." },
];

const TRUST_SIGNALS = [
  { icon: Shield, title: "Secure Payments", description: "256-bit SSL encryption. PCI-DSS compliant payment processing via Razorpay and PhonePe." },
  { icon: Award, title: "Verified Partners", description: "Direct contracts with TBO, airline GDS, and 500+ hotel chains worldwide." },
  { icon: Users, title: "50,000+ Travelers", description: "Trusted by thousands of Indian travelers for international and domestic holidays." },
  { icon: Globe, title: "100+ Destinations", description: "Curated packages to Dubai, Bali, Maldives, Thailand, Europe, and beyond." },
];

const CERTIFICATIONS = [
  "Registered Travel Agency",
  "IATA Accredited Partner",
  "TBO Authorized Agent",
  "Razorpay Certified Merchant",
  "GST Compliant (India)",
];

export default function AboutPage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About GoRASA",
    description: "GoRASA is India's premium travel booking platform.",
    mainEntity: {
      "@type": "Organization",
      name: "GoRASA",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.svg`,
      description: "Premium travel booking platform for luxury flights, hotels, and curated holiday packages.",
      foundingDate: "2020",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+91-95285-00383",
        contactType: "customer service",
        availableLanguage: ["English", "Hindi"],
      },
      address: {
        "@type": "PostalAddress",
        addressCountry: "IN",
      },
      sameAs: [
        "https://www.instagram.com/gorasatravel",
        "https://www.facebook.com/gorasatravel",
        "https://twitter.com/gorasatravel",
        "https://www.linkedin.com/company/gorasa",
      ],
    },
  };

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: "Home", href: "/" },
        { name: "About", href: "/about" },
      ]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }} />

      <main className="min-h-screen bg-brand-ivory">
        {/* Hero */}
        <section className="py-16 bg-brand-emerald">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">About GoRASA</h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Premium travel experiences curated for the discerning Indian traveler. From luxury hotels to handcrafted holiday packages.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-serif font-bold text-brand-charcoal mb-6">Our Story</h2>
          <div className="prose prose-brand max-w-none text-brand-charcoal/80 leading-relaxed space-y-4">
            <p>
              GoRASA was founded with a simple vision: make premium travel accessible to Indian travelers without compromising on quality or service. What started as a small team of travel enthusiasts has grown into a trusted platform serving thousands of travelers annually.
            </p>
            <p>
              We partner directly with airlines, hotel chains, and local operators to bring you curated holiday packages to over 100 destinations worldwide. Every package is handpicked by our travel experts who have personally visited and vetted each destination.
            </p>
            <p>
              Our technology platform combines the best of AI-powered recommendations with human expertise. Whether you are planning a honeymoon in the Maldives, a family vacation in Dubai, or an adventure trip to Bali, GoRASA ensures every detail is taken care of.
            </p>
          </div>
        </section>

        {/* Trust Signals */}
        <section className="bg-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-serif font-bold text-brand-charcoal mb-8 text-center">Why Trust GoRASA</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {TRUST_SIGNALS.map((signal) => (
                <div key={signal.title} className="flex gap-4 p-4 rounded-xl border border-slate-100">
                  <div className="w-12 h-12 rounded-xl bg-brand-antique-gold/10 flex items-center justify-center shrink-0">
                    <signal.icon size={24} className="text-brand-antique-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-charcoal mb-1">{signal.title}</h3>
                    <p className="text-sm text-brand-charcoal/60">{signal.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-serif font-bold text-brand-charcoal mb-8 text-center">Our Team</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.name} className="bg-white rounded-xl p-6 border border-slate-100 text-center">
                <div className="w-16 h-16 rounded-full bg-brand-emerald flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl font-bold">{member.name.charAt(0)}</span>
                </div>
                <h3 className="font-semibold text-brand-charcoal">{member.name}</h3>
                <p className="text-sm text-brand-antique-gold font-medium mb-2">{member.role}</p>
                <p className="text-xs text-brand-charcoal/60">{member.bio}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Certifications */}
        <section className="bg-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-serif font-bold text-brand-charcoal mb-8 text-center">Certifications & Compliance</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {CERTIFICATIONS.map((cert) => (
                <div key={cert} className="flex items-center gap-2 px-4 py-2 bg-brand-ivory rounded-full border border-slate-100">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-sm font-medium text-brand-charcoal">{cert}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-serif font-bold text-brand-charcoal mb-8 text-center">Contact Us</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-100 text-center">
              <Phone size={24} className="mx-auto text-brand-antique-gold mb-3" />
              <h3 className="font-semibold text-brand-charcoal mb-1">Phone</h3>
              <a href="tel:+919528500383" className="text-sm text-brand-antique-gold hover:underline">+91 95285 00383</a>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-100 text-center">
              <Mail size={24} className="mx-auto text-brand-antique-gold mb-3" />
              <h3 className="font-semibold text-brand-charcoal mb-1">Email</h3>
              <a href="mailto:rasatravelindia@gmail.com" className="text-sm text-brand-antique-gold hover:underline">rasatravelindia@gmail.com</a>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-100 text-center">
              <MapPin size={24} className="mx-auto text-brand-antique-gold mb-3" />
              <h3 className="font-semibold text-brand-charcoal mb-1">Location</h3>
              <p className="text-sm text-brand-charcoal/60">India</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="bg-brand-deep-teal rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 font-display">Ready to Plan Your Next Trip?</h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Let our travel experts craft the perfect holiday for you. Custom itineraries, best prices, and 24/7 support.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/holidays" className="px-6 py-3 bg-brand-antique-gold text-white rounded-lg font-semibold hover:bg-brand-dark-gold transition-colors">
                Browse Packages
              </Link>
              <Link href="/support" className="px-6 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors">
                Talk to an Expert
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
