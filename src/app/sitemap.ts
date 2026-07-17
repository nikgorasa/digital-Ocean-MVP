import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE_URL = 'https://cckr.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/hotels`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/flights`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/holidays`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/support`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ];

  const DESTINATION_SLUGS = [
    'goa', 'dubai', 'bali', 'maldives', 'thailand', 'kashmir', 'singapore', 'manali',
  ];
  const destinationRoutes: MetadataRoute.Sitemap = DESTINATION_SLUGS.map((slug) => ({
    url: `${BASE_URL}/destinations/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const HOTEL_CITY_SLUGS = [
    'dubai', 'bangkok', 'singapore', 'bali', 'maldives', 'goa', 'kashmir', 'manali',
  ];
  const hotelCityRoutes: MetadataRoute.Sitemap = HOTEL_CITY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/hotels/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const FLIGHT_ROUTE_SLUGS = [
    'mumbai-dubai', 'delhi-bangkok', 'delhi-dubai', 'mumbai-singapore', 'delhi-singapore',
    'mumbai-bangkok', 'mumbai-bali', 'delhi-bali', 'mumbai-maldives', 'delhi-maldives',
  ];
  const flightRouteRoutes: MetadataRoute.Sitemap = FLIGHT_ROUTE_SLUGS.map((slug) => ({
    url: `${BASE_URL}/flights/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const visaRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/visa`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  try {
    const [packages, blogPosts, faqCategories] = await Promise.all([
      prisma.package.findMany({
        where: { isActive: true },
        select: { id: true, updatedAt: true },
      }),
      prisma.blogPost.findMany({
        where: { status: 'PUBLISHED', isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.faqCategory.findMany({
        where: { isactive: true },
        select: { label: true },
      }),
    ]);

    const packageRoutes: MetadataRoute.Sitemap = packages.flatMap((pkg) => [
      {
        url: `${BASE_URL}/holidays/${pkg.id}`,
        lastModified: pkg.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
      {
        url: `${BASE_URL}/packages/${pkg.id}`,
        lastModified: pkg.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
    ]);

    const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

    const faqRoutes: MetadataRoute.Sitemap = faqCategories.map((cat) => {
      const slug = cat.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      return {
        url: `${BASE_URL}/faq/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      };
    });

    return [...staticRoutes, ...destinationRoutes, ...hotelCityRoutes, ...flightRouteRoutes, ...visaRoutes, ...packageRoutes, ...blogRoutes, ...faqRoutes];
  } catch {
    return staticRoutes;
  }
}
