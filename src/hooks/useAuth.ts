import { useState, useEffect, useCallback } from 'react'
import { supabase, getAdminProfile, type AdminProfile } from '@/lib/supabase'
import { isFullAdminRole } from '@/lib/roles'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  isAdmin: boolean
  /** Vrai une fois la vérification admin_users terminée (évite l'attente infinie). */
  adminChecked: boolean
  profile: AdminProfile | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isAdmin: false,
    adminChecked: false,
    profile: null,
    loading: true,
  })

  const refreshAdminStatus = useCallback(async (session: Session | null) => {
    if (!session) {
      setState(prev => ({ ...prev, isAdmin: false, adminChecked: true, profile: null }))
      return
    }
    const profile = await getAdminProfile()
    setState(prev => ({ ...prev, isAdmin: !!profile, adminChecked: true, profile }))
  }, [])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({
        ...prev,
        user: session?.user ?? null,
        session,
        loading: false,
      }))
      refreshAdminStatus(session)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setState(prev => ({
          ...prev,
          user: session?.user ?? null,
          session,
        }))
        refreshAdminStatus(session)
      }
    )

    return () => subscription.unsubscribe()
  }, [refreshAdminStatus])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return {
    ...state,
    role: state.profile?.role ?? null,
    /** admin ou super_admin : accès à tout, gestion des utilisateurs. */
    isFullAdmin: isFullAdminRole(state.profile?.role),
    signIn,
    signUp,
    signOut,
  }
}
