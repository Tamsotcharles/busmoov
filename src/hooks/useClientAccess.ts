import { useEffect } from 'react'
import { setClientAccess, clearClientAccess } from '@/lib/supabase'

/**
 * Déclare l'identité d'une page client (référence + email) ou fournisseur
 * (jeton) pour toutes les requêtes Supabase de la page. Appliqué de façon
 * synchrone au rendu pour précéder les chargements en useEffect, retiré au
 * démontage pour ne pas fuiter vers une autre page.
 */
export function useClientAccess(access: { reference?: string | null; email?: string | null; token?: string | null }) {
  setClientAccess(access)
  useEffect(() => {
    setClientAccess(access)
    return () => clearClientAccess()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access.reference, access.email, access.token])
}
