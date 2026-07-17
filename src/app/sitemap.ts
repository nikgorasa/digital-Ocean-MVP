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

  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true },
      select: { id: true, updatedAt: true },
    });

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

    return [...staticRoutes, ...destinationRoutes, ...packageRoutes];
  } catch {
    return staticRoutes;
  }
}
