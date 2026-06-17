import { isPrisma, prisma, supabaseAdmin } from './index'

// ═══════════════════════════════════════════════════════
// Content Service — FAQ, Navigation, SiteConfig, etc.
// ═══════════════════════════════════════════════════════

export async function findFAQs() {
  if (isPrisma()) {
    return prisma.faq.findMany({ orderBy: { keyword: 'asc' } })
  }
  const { data } = await supabaseAdmin.from('Faq').select('*').order('keyword')
  return data || []
}

export async function findFAQCategories() {
  if (isPrisma()) {
    return prisma.faqCategory.findMany({ orderBy: { sortorder: 'asc' } })
  }
  const { data } = await supabaseAdmin
    .from('FaqCategory')
    .select('*')
    .order('sortorder')
  return data || []
}

export async function findNavigation() {
  if (isPrisma()) {
    return prisma.navigationItem.findMany({ orderBy: { sortorder: 'asc' } })
  }
  const { data } = await supabaseAdmin
    .from('NavigationItem')
    .select('*')
    .order('sortorder')
  return data || []
}

export async function findSiteConfig() {
  if (isPrisma()) {
    const configs = await prisma.siteConfig.findMany()
    return configs.reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {} as Record<string, string>)
  }
  const { data } = await supabaseAdmin.from('SiteConfig').select('*')
  return (data || []).reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {} as Record<string, string>)
}

export async function findTestimonials() {
  if (isPrisma()) {
    return prisma.testimonial.findMany({ orderBy: { createdAt: 'desc' } })
  }
  const { data } = await supabaseAdmin
    .from('Testimonial')
    .select('*')
    .order('createdAt', { ascending: false })
  return data || []
}

export async function findValuePropositions() {
  if (isPrisma()) {
    return prisma.valueProposition.findMany({ orderBy: { sortorder: 'asc' } })
  }
  const { data } = await supabaseAdmin
    .from('ValueProposition')
    .select('*')
    .order('sortorder')
  return data || []
}

export async function findFooterLinks() {
  if (isPrisma()) {
    return prisma.footerLink.findMany({ orderBy: { sortorder: 'asc' } })
  }
  const { data } = await supabaseAdmin
    .from('FooterLink')
    .select('*')
    .order('sortorder')
  return data || []
}

export async function findTopUpAmounts() {
  if (isPrisma()) {
    return prisma.quickTopUpAmount.findMany({ orderBy: { sortorder: 'asc' } })
  }
  const { data } = await supabaseAdmin
    .from('QuickTopUpAmount')
    .select('*')
    .order('sortorder')
  return data || []
}

export async function findPreferenceOptions() {
  if (isPrisma()) {
    return prisma.preferenceOption.findMany({ orderBy: { sortorder: 'asc' } })
  }
  const { data } = await supabaseAdmin
    .from('PreferenceOption')
    .select('*')
    .order('sortorder')
  return data || []
}
