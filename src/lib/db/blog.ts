import { prisma } from './index'

export async function findAllPublished(page = 1, limit = 10) {
  const skip = (page - 1) * limit
  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where: { status: 'PUBLISHED', isActive: true },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        author: true,
        authorImage: true,
        publishedAt: true,
        tags: true,
        featuredImage: true,
        seoTitle: true,
        seoDescription: true,
      },
    }),
    prisma.blogPost.count({ where: { status: 'PUBLISHED', isActive: true } }),
  ])
  return { posts, total, page, totalPages: Math.ceil(total / limit) }
}

export async function findBySlug(slug: string) {
  return prisma.blogPost.findFirst({
    where: { slug, status: 'PUBLISHED', isActive: true },
  })
}

export async function findAllAdmin() {
  return prisma.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      author: true,
      publishedAt: true,
      tags: true,
      featuredImage: true,
      seoTitle: true,
      seoDescription: true,
      status: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function create(data: Record<string, unknown>) {
  return prisma.blogPost.create({ data: data as never })
}

export async function update(id: string, data: Record<string, unknown>) {
  return prisma.blogPost.update({ where: { id }, data: data as never })
}

export async function findBySlugAdmin(slug: string) {
  return prisma.blogPost.findUnique({ where: { slug } })
}

export async function countPublished() {
  return prisma.blogPost.count({ where: { status: 'PUBLISHED', isActive: true } })
}

export async function findRecent(limit = 5) {
  return prisma.blogPost.findMany({
    where: { status: 'PUBLISHED', isActive: true },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    select: { id: true, title: true, slug: true, publishedAt: true, featuredImage: true },
  })
}
