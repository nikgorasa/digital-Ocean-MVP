import { prisma } from "@/lib/prisma";
import HomePageClient from "@/components/HomePageClient";

export const revalidate = 300;

interface PackageItem {
  id: string;
  title: string;
  duration: string;
  price: number;
  originalPrice?: number;
  rating: number;
  imageUrl: string;
  provider: string;
  inclusions: string[];
  category: string;
}

interface CategoryMeta {
  title: string;
  subtitle: string;
  icon: string;
  badgeColor: string;
  badgeText: string;
}

function groupByCategory(packages: Record<string, unknown>[]): Record<string, PackageItem[]> {
  const grouped: Record<string, PackageItem[]> = {};
  for (const p of packages) {
    let images: string[] = [];
    try {
      images = typeof p.images === "string" ? JSON.parse(p.images as string) : (p.images as string[]) || [];
    } catch {
      images = [];
    }
    let inclusions: string[] = [];
    try {
      inclusions = typeof p.inclusions === "string" ? JSON.parse(p.inclusions as string) : (p.inclusions as string[]) || [];
    } catch {
      inclusions = [];
    }
    const item: PackageItem = {
      id: p.id as string,
      title: p.title as string,
      duration: p.duration as string,
      price: p.price as number,
      originalPrice: p.originalPrice as number | undefined,
      rating: p.rating as number,
      imageUrl: (images[0] as string) || "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80",
      provider: (p.provider as string) || "GoRASA Direct",
      inclusions,
      category: (p.category as string) || "STANDARD",
    };
    const cat = item.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }
  return grouped;
}

function mapCategories(rows: Record<string, unknown>[]): {
  map: Record<string, CategoryMeta>;
  order: string[];
} {
  const map: Record<string, CategoryMeta> = {};
  const order: string[] = [];
  for (const row of rows) {
    const id = row.id as string;
    map[id] = {
      title: row.title as string,
      subtitle: row.subtitle as string,
      icon: row.icon as string,
      badgeColor: (row.badgeColor as string) || (row.badgecolor as string) || "",
      badgeText: (row.badgeText as string) || (row.badgetext as string) || "",
    };
    order.push(id);
  }
  return { map, order };
}

export default async function HomePage() {
  try {
    const [
      packages,
      testimonials,
      categories,
      valueProps,
      companyUsers,
    ] = await Promise.all([
      prisma.package.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, title: true, duration: true, price: true,
          originalPrice: true, rating: true, provider: true,
          inclusions: true, images: true, category: true,
        },
      }),
      prisma.testimonial.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, role: true, text: true, rating: true },
      }),
      prisma.packageCategory.findMany({
        where: { isactive: true },
        orderBy: { sortorder: "asc" },
      }),
      prisma.valueProposition.findMany({
        where: { isactive: true },
        orderBy: { sortorder: "asc" },
        select: { id: true, icon: true, title: true, description: true },
      }),
      prisma.user.findMany({
        where: { NOT: { companyId: null } },
        select: { companyId: true },
      }),
    ]);

    const carouselPackages = groupByCategory(packages as unknown as Record<string, unknown>[]);
    const testimonialsList = testimonials.map((t) => ({
      id: t.id,
      name: t.name,
      role: t.role,
      text: t.text,
      rating: t.rating,
    }));
    const { map: categoriesMap, order: categoryOrder } = mapCategories(categories as unknown as Record<string, unknown>[]);
    const valuePropsList = valueProps.map((v) => ({
      icon: v.icon,
      title: v.title,
      description: v.description,
    }));

    const uniqueCompanies = new Set(
      companyUsers.map((u) => u.companyId).filter(Boolean)
    );
    const stats = {
      companies: `${uniqueCompanies.size || 500}+`,
      bookings: `${packages.length * 2000}+`,
      rating: "4.9",
    };

    return (
      <HomePageClient
        carouselPackages={carouselPackages}
        testimonials={testimonialsList}
        categories={categoriesMap}
        categoryOrder={categoryOrder}
        valueProps={valuePropsList}
        stats={stats}
      />
    );
  } catch (error) {
    console.error("Homepage data fetch failed:", error);
    return (
      <HomePageClient
        carouselPackages={{}}
        testimonials={[]}
        categories={{}}
        categoryOrder={[]}
        valueProps={[]}
        stats={{ companies: "500+", bookings: "50K+", rating: "4.9" }}
        error="Unable to load data. Please try again."
      />
    );
  }
}
