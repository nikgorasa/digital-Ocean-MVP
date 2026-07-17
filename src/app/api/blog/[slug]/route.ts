import { NextRequest, NextResponse } from "next/server";
import * as blog from "@/lib/db/blog";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const post = await blog.findBySlug(slug);

    if (!post) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Blog detail error:", error);
    return NextResponse.json({ error: "Failed to fetch blog post" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const existing = await blog.findBySlugAdmin(slug);
    if (!existing) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt;
    if (body.author !== undefined) updateData.author = body.author;
    if (body.authorBio !== undefined) updateData.authorBio = body.authorBio;
    if (body.authorImage !== undefined) updateData.authorImage = body.authorImage;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.featuredImage !== undefined) updateData.featuredImage = body.featuredImage;
    if (body.seoTitle !== undefined) updateData.seoTitle = body.seoTitle;
    if (body.seoDescription !== undefined) updateData.seoDescription = body.seoDescription;
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === "PUBLISHED" && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
    if (body.slug !== undefined) updateData.slug = body.slug;

    const post = await blog.update(existing.id, updateData);
    return NextResponse.json(post);
  } catch (error) {
    console.error("Blog update error:", error);
    return NextResponse.json({ error: "Failed to update blog post" }, { status: 500 });
  }
}
