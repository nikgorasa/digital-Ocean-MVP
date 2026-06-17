import { NextResponse } from "next/server";
import * as packages from "@/lib/db/packages";

export async function GET() {
  try {
    const allPackages = await packages.findAll();

    const mapped = (allPackages || []).map((p: Record<string, unknown>) => {
      let images: string[] = [];
      try { images = typeof p.images === "string" ? JSON.parse(p.images as string) : (p.images as string[]) || []; } catch { images = []; }
      let inclusions: string[] = [];
      try { inclusions = typeof p.inclusions === "string" ? JSON.parse(p.inclusions as string) : (p.inclusions as string[]) || []; } catch { inclusions = []; }
      return {
        id: p.id,
        title: p.title,
        duration: p.duration,
        price: p.price,
        originalPrice: p.originalPrice,
        rating: p.rating,
        imageUrl: images[0] || "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80",
        provider: p.provider,
        inclusions,
        category: p.category || "STANDARD",
      };
    });

    const grouped: Record<string, typeof mapped> = {};
    for (const pkg of mapped) {
      const cat = String(pkg.category);
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(pkg);
    }

    return NextResponse.json({ packages: mapped, grouped });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
  }
}
