import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase-admin'

export type DatabaseProvider = 'supabase' | 'prisma'

export const provider: DatabaseProvider =
  (process.env.DATABASE_PROVIDER as DatabaseProvider) || 'supabase'

export function isPrisma(): boolean {
  return provider === 'prisma'
}

export function isSupabase(): boolean {
  return provider === 'supabase'
}

export { prisma, supabaseAdmin }
