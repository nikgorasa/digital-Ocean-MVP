import { prisma } from "@/lib/prisma";
import FaqPageClient from "@/components/FaqPageClient";

export const revalidate = 300;

export default async function FaqPage() {
  let dbFaqs: { id: string; question: string; answer: string; category: string }[] = [];

  try {
    const faqs = await prisma.faq.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, question: true, answer: true, keyword: true },
    });
    dbFaqs = faqs.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      category: f.keyword || "General",
    }));
  } catch {
    dbFaqs = [];
  }

  return <FaqPageClient dbFaqs={dbFaqs} />;
}
