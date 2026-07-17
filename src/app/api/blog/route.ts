import { NextRequest, NextResponse } from "next/server";
import * as blog from "@/lib/db/blog";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const data = await blog.findAllPublished(page, limit);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Blog list error:", error);
    return NextResponse.json({ error: "Failed to fetch blog posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, content, excerpt, author, authorBio, authorImage, tags, featuredImage, seoTitle, seoDescription, status } = body;

    if (!title || !slug || !content) {
      return NextResponse.json({ error: "Title, slug, and content are required" }, { status: 400 });
    }

    const post = await blog.create({
      title,
      slug,
      content,
      excerpt: excerpt || content.substring(0, 200),
      author: author || "GoRASA Team",
      authorBio: authorBio || null,
      authorImage: authorImage || null,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      tags: tags || "[]",
      featuredImage: featuredImage || null,
      seoTitle: seoTitle || title,
      seoDescription: seoDescription || excerpt || content.substring(0, 160),
      status: status || "DRAFT",
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Blog create error:", error);
    return NextResponse.json({ error: "Failed to create blog post" }, { status: 500 });
  }
}
