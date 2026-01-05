import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rsxfmokwmwujercgpnfu.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzeGZtb2t3bXd1amVyY2dwbmZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NjU5NTIsImV4cCI6MjA4MjA0MTk1Mn0.OTUBLLy1l92HURVsnk_j6EEb_8UQuH3lSSE3xUGHM1g'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Helper pour obtenir la session actuelle
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Helper pour vérifier si l'utilisateur est admin
export const checkIsAdmin = async (): Promise<boolean> => {
  const session = await getCurrentSession()
  if (!session) return false

  const { data } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .single()

  return !!data
}
