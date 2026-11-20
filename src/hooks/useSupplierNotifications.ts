import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface SupplierNotification {
  id: string
  type: 'tarif_recu' | 'refus_fournisseur' | 'bpa_valide'
  title: string
  description: string | null
  dossier_id: string
  dossier_reference: string | null
  source_name: string | null
  created_at: string | null
  /** Nombre total de réponses fournisseurs non lues. */
  pendingTotal: number
}

/**
 * Dernière réponse fournisseur non lue (tarif reçu, refus ou BPA validé), pour le pop-up global de l'admin.
 * Les notifications sont écrites côté serveur par la fonction proposition-tarif.
 */
export function useLatestUnreadSupplierNotification() {
  return useQuery({
    queryKey: ['notifications-supplier-latest-unread'],
    queryFn: async (): Promise<SupplierNotification | null> => {
      // notifications_crm n'est pas dans les types générés (même contournement que NotificationsPanel)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error, count } = await (supabase as any)
        .from('notifications_crm')
        .select('id, type, title, description, dossier_id, dossier_reference, source_name, created_at', { count: 'exact' })
        .in('type', ['tarif_recu', 'refus_fournisseur', 'bpa_valide'])
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(1)
      if (error) throw error
      const row = data?.[0] as Omit<SupplierNotification, 'pendingTotal'> | undefined
      if (!row || !row.dossier_id) return null
      return { ...row, pendingTotal: count || 0 }
    },
    refetchInterval: 15000,
  })
}
