import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        duration: true,
        price: true,
        originalPrice: true,
        rating: true,
        provider: true,
        overview: true,
        inclusions: true,
        exclusions: true,
        images: true,
        category: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const enriched = packages.map((pkg) => {
      let imagesArr: string[] = [];
      let inclusionsArr: string[] = [];
      let exclusionsArr: string[] = [];
      let overviewStr = "";

      try { imagesArr = JSON.parse(pkg.images); } catch { /* ignore */ }
      try { inclusionsArr = JSON.parse(pkg.inclusions); } catch { /* ignore */ }
      try { exclusionsArr = JSON.parse(pkg.exclusions); } catch { /* ignore */ }
      try {
        const ov = JSON.parse(pkg.overview);
        overviewStr = typeof ov === "string" ? ov : ov.html || ov.text || JSON.stringify(ov);
      } catch { overviewStr = pkg.overview; }

      return {
        id: pkg.id,
        title: pkg.title,
        duration: pkg.duration,
        price: pkg.price,
        originalPrice: pkg.originalPrice,
        rating: pkg.rating,
        provider: pkg.provider,
        overview: overviewStr,
        inclusions: inclusionsArr,
        exclusions: exclusionsArr,
        images: imagesArr,
        category: pkg.category,
        url: `https://cckr.vercel.app/packages/${pkg.id}`,
        createdAt: pkg.createdAt,
        updatedAt: pkg.updatedAt,
      };
    });

    return NextResponse.json({
      meta: {
        total: enriched.length,
        generatedAt: new Date().toISOString(),
        source: "GoRASA Travel Platform",
      },
      packages: enriched,
    });
  } catch (error) {
    console.error("Public packages error:", error);
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
  }
}
