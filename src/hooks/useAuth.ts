import { useState, useEffect, useCallback } from 'react'
import { supabase, checkIsAdmin } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  isAdmin: boolean
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isAdmin: false,
    loading: true,
  })

  const refreshAdminStatus = useCallback(async (session: Session | null) => {
    if (!session) {
      setState(prev => ({ ...prev, isAdmin: false }))
      return
    }
    const isAdmin = await checkIsAdmin()
    setState(prev => ({ ...prev, isAdmin }))
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
    signIn,
    signUp,
    signOut,
  }
}
