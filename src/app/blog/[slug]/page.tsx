import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import { Calendar, User, ArrowLeft } from "lucide-react";

export const revalidate = 300;

const SITE_URL = "https://cckr.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findFirst({
    where: { slug, status: "PUBLISHED", isActive: true },
  });

  if (!post) {
    return { title: "Blog Post Not Found" };
  }

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || post.content.substring(0, 160),
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || "",
      url: `${SITE_URL}/blog/${slug}`,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author],
      images: post.featuredImage ? [{ url: post.featuredImage, width: 1200, height: 627 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || "",
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await prisma.blogPost.findFirst({
    where: { slug, status: "PUBLISHED", isActive: true },
  });

  if (!post) {
    notFound();
  }

  let tags: string[] = [];
  try { tags = JSON.parse(post.tags); } catch { /* ignore */ }

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
    { name: post.title, href: `/blog/${slug}` },
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seoDescription || post.excerpt || "",
    image: post.featuredImage || undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "GoRASA",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${slug}` },
  };

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.excerpt || "",
    image: post.featuredImage || undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.author,
      description: post.authorBio || undefined,
    },
    publisher: {
      "@type": "Organization",
      name: "GoRASA",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.svg` },
    },
    keywords: tags.join(", "),
  };

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }} />

      <main className="min-h-screen bg-brand-ivory">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-brand-antique-gold hover:text-brand-dark-gold mb-6">
            <ArrowLeft size={14} /> Back to Blog
          </Link>

          {post.featuredImage && (
            <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden mb-8">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 896px"
                className="object-cover"
              />
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-brand-antique-gold/10 text-brand-antique-gold text-xs font-bold uppercase tracking-wider rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-serif font-bold text-brand-charcoal mb-4">{post.title}</h1>

          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              {post.authorImage ? (
                <Image src={post.authorImage} alt={post.author} width={40} height={40} className="rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-emerald flex items-center justify-center text-white text-sm font-bold">
                  {post.author.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-semibold text-brand-charcoal text-sm">{post.author}</p>
                {post.authorBio && <p className="text-xs text-brand-charcoal/50">{post.authorBio}</p>}
              </div>
            </div>
            {post.publishedAt && (
              <span className="flex items-center gap-1 text-sm text-brand-charcoal/50">
                <Calendar size={14} />
                {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            )}
          </div>

          {post.excerpt && (
            <p className="text-lg text-brand-charcoal/70 mb-6 font-medium italic border-l-4 border-brand-antique-gold pl-4">
              {post.excerpt}
            </p>
          )}

          <div
            className="prose prose-brand max-w-none text-brand-charcoal/80 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.authorBio && (
            <div className="mt-12 p-6 bg-white rounded-xl border border-slate-100">
              <div className="flex items-start gap-4">
                {post.authorImage ? (
                  <Image src={post.authorImage} alt={post.author} width={64} height={64} className="rounded-full" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-brand-emerald flex items-center justify-center text-white text-xl font-bold shrink-0">
                    {post.author.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-brand-charcoal mb-1">Written by {post.author}</p>
                  <p className="text-sm text-brand-charcoal/60">{post.authorBio}</p>
                </div>
              </div>
            </div>
          )}
        </article>
      </main>
    </>
  );
}
