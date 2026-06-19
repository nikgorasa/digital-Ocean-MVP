import { prisma } from './index'

export async function findFAQs() {
  return prisma.faq.findMany({ orderBy: { keyword: 'asc' } })
}

export async function findFAQCategories() {
  return prisma.faqCategory.findMany({ orderBy: { sortorder: 'asc' } })
}

export async function findNavigation() {
  return prisma.navigationItem.findMany({ orderBy: { sortorder: 'asc' } })
}

export async function findSiteConfig() {
  const configs = await prisma.siteConfig.findMany()
  return configs.reduce((acc: Record<string, string>, c: { key: string; value: string }) => ({ ...acc, [c.key]: c.value }), {} as Record<string, string>)
}

export async function findTestimonials() {
  return prisma.testimonial.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function findValuePropositions() {
  return prisma.valueProposition.findMany({ orderBy: { sortorder: 'asc' } })
}

export async function findFooterLinks() {
  return prisma.footerLink.findMany({ orderBy: { sortorder: 'asc' } })
}

export async function findTopUpAmounts() {
  return prisma.quickTopUpAmount.findMany({ orderBy: { sortorder: 'asc' } })
}

export async function findPreferenceOptions() {
  return prisma.preferenceOption.findMany({ orderBy: { sortorder: 'asc' } })
}
