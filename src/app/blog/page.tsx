import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import { Calendar, User, Tag, ArrowRight } from "lucide-react";

export const revalidate = 300;

const SITE_URL = "https://cckr.vercel.app";

export const metadata: Metadata = {
  title: "Travel Blog — Tips, Guides & Destination Stories",
  description: "Expert travel guides, destination tips, and curated holiday stories from GoRASA. Plan your next trip with insider knowledge on flights, hotels, and packages.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: "Travel Blog | GoRASA",
    description: "Expert travel guides, destination tips, and curated holiday stories.",
    url: `${SITE_URL}/blog`,
    type: "website",
  },
};

export default async function BlogListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = 12;
  const skip = (page - 1) * limit;

  let posts: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    author: string;
    authorImage: string | null;
    publishedAt: Date | null;
    tags: string;
    featuredImage: string | null;
    seoDescription: string | null;
  }> = [];
  let total = 0;

  try {
    [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: { status: "PUBLISHED", isActive: true },
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.blogPost.count({ where: { status: "PUBLISHED", isActive: true } }),
    ]);
  } catch {
    posts = [];
  }

  const totalPages = Math.ceil(total / limit);

  const parseTags = (tagsStr: string): string[] => {
    try { return JSON.parse(tagsStr); } catch { return []; }
  };

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: "Home", href: "/" },
        { name: "Blog", href: "/blog" },
      ]} />
      <main className="min-h-screen bg-brand-ivory">
        <section className="py-12 bg-brand-emerald">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">Travel Blog</h1>
            <p className="text-white/70">Expert guides, tips, and stories for your next adventure</p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {posts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => {
                  const tags = parseTags(post.tags);
                  return (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow group"
                    >
                      <div className="relative h-48 overflow-hidden bg-brand-ivory">
                        {post.featuredImage ? (
                          <Image
                            src={post.featuredImage}
                            alt={post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-600/50 text-4xl font-serif">G</div>
                        )}
                      </div>
                      <div className="p-4">
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="px-2 py-0.5 bg-brand-ivory text-[10px] font-bold uppercase tracking-wider text-brand-antique-gold rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <h2 className="font-semibold text-brand-charcoal mb-1 group-hover:text-brand-antique-gold transition-colors line-clamp-2">
                          {post.title}
                        </h2>
                        {post.excerpt && (
                          <p className="text-sm text-brand-charcoal/60 line-clamp-2 mb-3">{post.excerpt}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-brand-charcoal/50">
                          <span className="flex items-center gap-1">
                            <User size={12} /> {post.author}
                          </span>
                          {post.publishedAt && (
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {page > 1 && (
                    <Link href={`/blog?page=${page - 1}`} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:bg-brand-ivory transition-colors">
                      Previous
                    </Link>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={`/blog?page=${p}`}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${p === page ? "bg-brand-antique-gold text-white" : "bg-white border border-slate-200 hover:bg-brand-ivory"}`}
                    >
                      {p}
                    </Link>
                  ))}
                  {page < totalPages && (
                    <Link href={`/blog?page=${page + 1}`} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:bg-brand-ivory transition-colors">
                      Next
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-brand-charcoal/50 text-lg mb-2">No blog posts yet.</p>
              <p className="text-brand-charcoal/40 text-sm">Check back soon for travel guides and stories.</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
