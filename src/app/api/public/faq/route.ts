import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

export async function GET() {
  try {
    const [faqs, categories] = await Promise.all([
      prisma.faq.findMany({
        where: { isActive: true },
        orderBy: { keyword: "asc" },
        select: { id: true, keyword: true, question: true, answer: true },
      }),
      prisma.faqCategory.findMany({
        where: { isactive: true },
        orderBy: { sortorder: "asc" },
        select: { id: true, label: true, keywords: true },
      }),
    ]);

    const grouped = categories.map((cat) => {
      const catKeywords = (() => {
        try { return JSON.parse(cat.keywords) as string[]; } catch { return []; }
      })();
      const catFaqs = faqs.filter(
        (f) => f.keyword && catKeywords.some((kw) => f.keyword.toLowerCase().includes(kw.toLowerCase()))
      );
      return {
        id: cat.id,
        label: cat.label,
        slug: cat.label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        faqs: catFaqs.map((f) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
          keyword: f.keyword,
        })),
      };
    });

    const uncategorized = faqs.filter(
      (f) => !categories.some((cat) => {
        try {
          const kw = JSON.parse(cat.keywords) as string[];
          return kw.some((k) => f.keyword?.toLowerCase().includes(k.toLowerCase()));
        } catch { return false; }
      })
    );

    if (uncategorized.length > 0) {
      grouped.push({
        id: "general",
        label: "General",
        slug: "general",
        faqs: uncategorized.map((f) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
          keyword: f.keyword,
        })),
      });
    }

    return NextResponse.json({
      meta: {
        totalFaqs: faqs.length,
        totalCategories: grouped.length,
        generatedAt: new Date().toISOString(),
        source: "GoRASA Travel Platform",
      },
      categories: grouped,
    });
  } catch (error) {
    console.error("Public FAQ error:", error);
    return NextResponse.json({ error: "Failed to fetch FAQs" }, { status: 500 });
  }
}
