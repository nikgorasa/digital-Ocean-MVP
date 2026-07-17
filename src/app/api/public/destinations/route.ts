import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 600;

const DESTINATION_DATA: Record<string, { description: string; highlights: string[]; bestTime: string }> = {
  goa: { description: "Beaches, nightlife, and Portuguese heritage in India's smallest state.", highlights: ["Baga Beach", "Old Goa Churches", "Dudhsagar Falls"], bestTime: "October to March" },
  dubai: { description: "Luxury shopping, desert adventures, and iconic skyscrapers.", highlights: ["Burj Khalifa", "Desert Safari", "Palm Jumeirah"], bestTime: "November to March" },
  bali: { description: "Temples, rice terraces, and tropical paradise in Indonesia.", highlights: ["Tanah Lot", "Ubud Rice Terraces", "Nusa Penida"], bestTime: "April to October" },
  maldives: { description: "Overwater villas, crystal waters, and world-class diving.", highlights: ["Overwater Villas", "Coral Reefs", "Male City"], bestTime: "November to April" },
  thailand: { description: "Temples, street food, and tropical islands.", highlights: ["Grand Palace", "Phi Phi Islands", "Phuket"], bestTime: "November to February" },
  kashmir: { description: "Snow-capped mountains, Dal Lake, and Mughal gardens.", highlights: ["Dal Lake", "Gulmarg Gondola", "Pahalgam"], bestTime: "March to October" },
  singapore: { description: "Gardens, hawker food, and modern marvels.", highlights: ["Marina Bay Sands", "Gardens by the Bay", "Sentosa"], bestTime: "Year-round" },
  manali: { description: "Mountains, adventure, and Solang Valley in Himachal Pradesh.", highlights: ["Solang Valley", "Rohtang Pass", "Hadimba Temple"], bestTime: "October to June" },
};

export async function GET() {
  try {
    const cities = await prisma.city.findMany({
      where: { isactive: true },
      orderBy: { searchcount: "desc" },
      select: { id: true, name: true, country: true, type: true, iata_code: true, searchcount: true },
    });

    const destinations = cities.map((city) => {
      const slug = city.name.toLowerCase().replace(/\s+/g, "-");
      const extra = DESTINATION_DATA[slug];
      return {
        id: city.id,
        name: city.name,
        slug,
        country: city.country,
        type: city.type,
        iataCode: city.iata_code,
        searchCount: city.searchcount,
        description: extra?.description || `Explore ${city.name} with GoRASA travel packages.`,
        highlights: extra?.highlights || [],
        bestTime: extra?.bestTime || null,
        url: `https://cckr.vercel.app/destinations/${slug}`,
      };
    });

    return NextResponse.json({
      meta: {
        total: destinations.length,
        generatedAt: new Date().toISOString(),
        source: "GoRASA Travel Platform",
      },
      destinations,
    });
  } catch (error) {
    console.error("Public destinations error:", error);
    return NextResponse.json({ error: "Failed to fetch destinations" }, { status: 500 });
  }
}
