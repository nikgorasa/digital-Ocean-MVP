import type { Metadata } from "next";
import { Inter, Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import SplashScreen from "@/components/SplashScreen";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/JsonLd";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  preload: false,
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  preload: false,
});

const SITE_URL = "https://cckr.vercel.app";

const PAGE_META: Record<string, { title: string; description: string }> = {
  "/hotels": {
    title: "Hotels in Dubai, Bangkok, Singapore | GoRASA",
    description: "Search and book luxury hotels worldwide at the best prices. Find 5-star hotels in Dubai, Bangkok, Singapore, Goa, and more with free cancellation options.",
  },
  "/flights": {
    title: "Cheap Flights to Dubai, Thailand | GoRASA",
    description: "Book cheap flights to Dubai, Thailand, Singapore, and 100+ destinations. Compare airfares, find the best deals on return and one-way flights.",
  },
  "/holidays": {
    title: "Holiday Packages from India | GoRASA",
    description: "Curated holiday packages from India to Bali, Maldives, Thailand, Europe, and more. All-inclusive packages with flights, hotels, and transfers.",
  },
  "/support": {
    title: "Help & Support | GoRASA",
    description: "Get help with your GoRASA bookings. Chat with our AI concierge, create support tickets, or reach us via WhatsApp for instant assistance.",
  },
  "/login": {
    title: "Sign In | GoRASA",
    description: "Sign in to your GoRASA account to manage bookings, access exclusive deals, and plan your next trip.",
  },
  "/faq": {
    title: "Travel FAQ | GoRASA",
    description: "Frequently asked questions about booking flights, hotels, and holiday packages on GoRASA. Find answers about payments, cancellations, and more.",
  },
  "/blog": {
    title: "Travel Blog — Tips, Guides & Destination Stories | GoRASA",
    description: "Expert travel guides, destination tips, and curated holiday stories from GoRASA. Plan your next trip with insider knowledge.",
  },
  "/about": {
    title: "About GoRASA — Premium Travel Experts | GoRASA",
    description: "GoRASA is India's premium travel booking platform offering curated holiday packages, luxury hotels, and flights to 100+ destinations worldwide.",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      default: "GoRASA — Premium Travel & Luxury Hotel Bookings",
      template: "%s | GoRASA",
    },
    description:
      "Premium travel booking platform. Fine airfare, luxury hotels, and curated holiday packages across India and the world.",
    keywords: [
      "travel",
      "flights",
      "hotels",
      "holiday packages",
      "luxury travel",
      "India",
      "Dubai hotels",
      "Bangkok flights",
      "Bali packages",
    ],
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: SITE_URL,
    },
    openGraph: {
      title: "GoRASA — Experience The Finest",
      description:
        "Premium travel booking platform for luxury flights, hotels, and curated holiday packages.",
      type: "website",
      locale: "en_IN",
      siteName: "GoRASA",
      url: SITE_URL,
      images: [{ url: "/og-image.png", width: 1200, height: 627, alt: "GoRASA — Premium Travel" }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@gorasatravel",
      title: "GoRASA — Premium Travel & Luxury Hotel Bookings",
      description: "Premium travel booking platform for luxury flights, hotels, and curated holiday packages.",
      images: ["/og-image.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
    <meta name="theme-color" content="#123C34" />
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes" />
    <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preload" href="/images/hero.jpg" as="image" type="image/jpeg" />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} ${outfit.variable} font-sans bg-brand-ivory text-brand-charcoal antialiased`}
      >
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <AuthProvider>
          <SplashScreen>{children}</SplashScreen>
        </AuthProvider>
      </body>
    </html>
  );
}
