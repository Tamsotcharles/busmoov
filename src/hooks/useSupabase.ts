// useSupabase hooks - updated
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { generateClientAccessUrl } from '@/lib/utils'

// Taux de TVA par pays pour le transport de passagers
const COUNTRY_TVA_RATES: Record<string, number> = {
  FR: 10,
  ES: 10,
  DE: 7,
  GB: 0,
  EN: 0, // Alias pour GB
}

// Helper pour obtenir le taux de TVA selon le pays
function getTvaRateByCountry(countryCode?: string | null): number {
  if (!countryCode) return 10 // Défaut France
  return COUNTRY_TVA_RATES[countryCode] ?? 10
}

// Helper pour formater les dates pour les emails
function formatDateForEmail(dateString: string | null | undefined): string {
  if (!dateString) return 'Non définie'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}
import type {
  Demande,
  DossierWithRelations,
  Transporteur,
  Message,
  InsertTables,
  UpdateTables,
  DevisWithTransporteur,
  DevisWithRelations,
  Json
} from '@/types/database'

// ============ HELPER: VÉRIFICATION AUTO-DEVIS ============

/**
 * Vérifie si un dossier nécessite une révision manuelle et ne doit pas être en auto-devis
 * Retourne null si OK pour auto-devis, sinon la raison d'exclusion
 */
function checkRequiresManualReview(dossier: {
  departure?: string | null
  arrival?: string | null
  special_requests?: string | null
  notes?: string | null
  trip_mode?: string | null
}): string | null {
  const departure = (dossier.departure || '').toLowerCase()
  const arrival = (dossier.arrival || '').toLowerCase()
  const specialRequests = (dossier.special_requests || '').toLowerCase()
  const notes = (dossier.notes || '').toLowerCase()
  const tripMode = dossier.trip_mode

  // 1. Même ville de départ et d'arrivée (rotations/navettes intra-ville)
  if (departure && arrival) {
    const depCity = departure.split(',')[0].split('(')[0].trim()
    const arrCity = arrival.split(',')[0].split('(')[0].trim()
    if (depCity === arrCity) {
      return 'Même ville départ/arrivée - Rotations ou navettes intra-ville'
    }
  }

  // 2. Mots-clés indiquant des rotations ou MAD complexe
  const keywords = [
    'rotation', 'navette', 'shuttle', 'mise à disposition', 'mise a disposition',
    'mad', 'transfert multiple', 'plusieurs trajets', 'aller-retour multiple',
    'circuit', 'tournée', 'plusieurs arrêts', 'etapes', 'étapes'
  ]

  const textToCheck = `${specialRequests} ${notes}`
  for (const keyword of keywords) {
    if (textToCheck.includes(keyword)) {
      return `Mots-clés détectés: "${keyword}" - Prestation complexe`
    }
  }

  // 3. Mode circuit (mise à disposition avec itinéraire personnalisé)
  if (tripMode === 'circuit') {
    return 'Mode circuit - Mise à disposition avec itinéraire personnalisé'
  }

  return null
}

// ============ DEMANDES ============

export function useCreateDemande() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (demande: InsertTables<'demandes'>) => {
      // 1. Créer la demande
      const { data: demandeData, error: demandeError } = await supabase
        .from('demandes')
        .insert(demande)
        .select()
        .single()
      if (demandeError) throw demandeError

      // 2. Créer automatiquement un dossier lié à cette demande
      const dossierReference = demandeData.reference.replace('DEM-', 'DOS-')
      const countryCode = (demandeData as any).country_code || 'FR'
      const { data: dossierData, error: dossierError } = await supabase
        .from('dossiers')
        .insert({
          reference: dossierReference,
          demande_id: demandeData.id,
          client_name: demandeData.client_name || 'Client',
          client_email: demandeData.client_email,
          client_phone: demandeData.client_phone,
          client_company: (demandeData as any).client_company || null,
          departure: demandeData.departure_city || '',
          arrival: demandeData.arrival_city || '',
          departure_date: demandeData.departure_date,
          return_date: demandeData.return_date,
          departure_time: demandeData.departure_time || null,
          return_time: demandeData.return_time || null,
          passengers: parseInt(demandeData.passengers) || 1,
          trip_mode: demandeData.trip_type === 'one-way' ? 'one-way' : demandeData.trip_type === 'circuit' ? 'circuit' : 'round-trip',
          voyage_type: demandeData.voyage_type,
          special_requests: demandeData.special_requests,
          status: 'new',
          country_code: countryCode,
          tva_rate: getTvaRateByCountry(countryCode),
        })
        .select()
        .single()

      if (dossierError) {
        console.error('Erreur création dossier automatique:', dossierError)
        // On ne bloque pas si le dossier échoue, la demande est créée
      } else if (dossierData) {
        // 3. Vérifier si le dossier nécessite une révision manuelle
        const manualReviewReason = checkRequiresManualReview({
          departure: dossierData.departure,
          arrival: dossierData.arrival,
          special_requests: dossierData.special_requests,
          notes: (dossierData as any).notes,
          trip_mode: dossierData.trip_mode,
        })

        if (manualReviewReason) {
          // Flagger le dossier pour révision manuelle, ne pas activer l'auto-devis
          console.log(`Dossier ${dossierData.reference} exclu de l'auto-devis: ${manualReviewReason}`)
          await supabase
            .from('dossiers')
            .update({
              requires_manual_review: true,
              manual_review_reason: manualReviewReason,
            })
            .eq('id', dossierData.id)
        } else {
          // Activer automatiquement l'auto-devis sur le nouveau dossier
          try {
            // Récupérer le workflow par défaut
            const { data: defaultWorkflow } = await supabase
              .from('workflow_devis_auto')
              .select('id, steps')
              .eq('is_default', true)
              .eq('is_active', true)
              .single()

            if (defaultWorkflow) {
              const steps = defaultWorkflow.steps as { delay_hours: number }[]
              const firstStepDelay = steps?.[0]?.delay_hours || 0
              const nextDevisAt = new Date(Date.now() + firstStepDelay * 60 * 60 * 1000).toISOString()

              await supabase
                .from('dossiers_auto_devis')
                .insert({
                  dossier_id: dossierData.id,
                  workflow_id: defaultWorkflow.id,
                  is_active: true,
                  current_step: 0,
                  next_devis_at: nextDevisAt,
                  devis_generes: [],
                  started_at: new Date().toISOString(),
                })

              console.log(`Auto-devis activé automatiquement pour le dossier ${dossierData.reference}`)
            }
          } catch (autoDevisError) {
            console.error('Erreur activation auto-devis:', autoDevisError)
            // Ne pas bloquer si l'auto-devis échoue
          }
        }

        // 4. Envoyer l'email de confirmation avec les identifiants (en arrière-plan, sans bloquer)
        // Déterminer la langue à partir du country_code
        const language = ((demandeData as any).country_code || 'FR').toLowerCase()

        // Envoyer l'email de manière asynchrone sans attendre le résultat
        // Cela évite tout blocage en cas d'erreur 401 ou autre
        supabase.functions.invoke('send-email', {
          body: {
            type: 'confirmation_demande',
            to: demandeData.client_email,
            data: {
              client_name: demandeData.client_name,
              // IMPORTANT: Utiliser la référence dossier (DOS-) au lieu de la demande (DEM-)
              // Le client doit pouvoir accéder à son espace avec cette référence
              reference: dossierData.reference,
              dossier_reference: dossierData.reference,
              demande_reference: demandeData.reference, // Garder la ref demande en cas de besoin admin
              departure: demandeData.departure_city,
              arrival: demandeData.arrival_city,
              departure_date: formatDateForEmail(demandeData.departure_date),
              passengers: String(demandeData.passengers),
              client_email: demandeData.client_email,
              // Utiliser la référence dossier pour les liens
              lien_espace_client: generateClientAccessUrl(dossierData.reference, demandeData.client_email, (demandeData as any).country_code),
              language: language,
            }
          }
        }).then(() => {
          console.log(`Email de confirmation envoyé à ${demandeData.client_email} (langue: ${language})`)
        }).catch((emailError) => {
          console.error('Erreur envoi email confirmation:', emailError)
          // Ne pas bloquer si l'email échoue
        })
      }

      return demandeData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers_auto_devis_all'] })
    },
  })
}

export function useDemande(reference: string, email: string) {
  return useQuery({
    queryKey: ['demande', reference, email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demandes')
        .select('*')
        .eq('reference', reference)
        .eq('client_email', email)
        .single()
      if (error) throw error
      return data as Demande
    },
    enabled: !!reference && !!email,
  })
}

export function useDemandes() {
  return useQuery({
    queryKey: ['demandes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demandes')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Demande[]
    },
  })
}

// ============ DOSSIERS ============

export function useDossiers(filters?: {
  status?: string
  transporteur_id?: string
  search?: string
}) {
  return useQuery({
    queryKey: ['dossiers', filters],
    queryFn: async () => {
      let query = supabase
        .from('dossiers')
        .select(`
          *,
          transporteur:transporteurs(*),
          contrats(*),
          paiements:paiements(*),
          devis(*)
        `)
        .order('departure_date', { ascending: true })

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.transporteur_id) {
        query = query.eq('transporteur_id', filters.transporteur_id)
      }
      if (filters?.search) {
        query = query.or(`client_name.ilike.%${filters.search}%,client_email.ilike.%${filters.search}%,reference.ilike.%${filters.search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data as unknown as DossierWithRelations[]
    },
  })
}

export function useDossier(id: string) {
  return useQuery({
    queryKey: ['dossier', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select(`
          *,
          transporteur:transporteurs(*),
          voyage_info:voyage_infos(*),
          devis(*),
          contrats(*),
          messages(*)
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data as unknown as DossierWithRelations
    },
    enabled: !!id,
  })
}

export function useDossierByRefAndEmail(reference: string, email: string) {
  return useQuery({
    queryKey: ['dossier', reference, email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select(`
          *,
          transporteur:transporteurs(*),
          voyage_info:voyage_infos(*),
          devis(*),
          contrats(*)
        `)
        .eq('reference', reference)
        .eq('client_email', email)
        .single()
      if (error) throw error
      return data as unknown as DossierWithRelations
    },
    enabled: !!reference && !!email,
  })
}

export function useCreateDossier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dossier: InsertTables<'dossiers'>) => {
      const { data, error } = await supabase
        .from('dossiers')
        .insert(dossier)
        .select()
        .single()
      if (error) throw error

      // Vérifier si l'auto-devis doit être activé automatiquement
      try {
        // D'abord vérifier si le dossier nécessite une révision manuelle
        const manualReviewReason = checkRequiresManualReview({
          departure: data.departure,
          arrival: data.arrival,
          special_requests: data.special_requests,
          notes: (data as any).notes,
          trip_mode: data.trip_mode,
        })

        if (manualReviewReason) {
          // Flagger le dossier pour révision manuelle, ne pas activer l'auto-devis
          console.log(`Dossier ${data.reference} exclu de l'auto-devis: ${manualReviewReason}`)
          await supabase
            .from('dossiers')
            .update({
              requires_manual_review: true,
              manual_review_reason: manualReviewReason,
            })
            .eq('id', data.id)
        } else {
          const { data: configData } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'auto_devis_config')
            .single()

          const config = configData?.value as { enabled?: boolean; auto_activate_new_dossiers?: boolean; default_workflow_id?: string } | null

          if (config?.enabled && config?.auto_activate_new_dossiers) {
            // Récupérer le workflow par défaut
            let workflowId = config.default_workflow_id
            if (!workflowId) {
              const { data: defaultWf } = await supabase
                .from('workflow_devis_auto')
                .select('id')
                .eq('is_default', true)
                .eq('is_active', true)
                .single()
              workflowId = defaultWf?.id
            }

            if (workflowId) {
              // Récupérer les étapes du workflow
              const { data: workflow } = await supabase
                .from('workflow_devis_auto')
                .select('steps')
                .eq('id', workflowId)
                .single()

              const steps = (workflow?.steps as unknown as { delay_hours: number }[]) || []
              const firstStep = steps[0]
              const nextDevisAt = firstStep
                ? new Date(Date.now() + firstStep.delay_hours * 60 * 60 * 1000).toISOString()
                : null

              // Activer l'auto-devis pour ce nouveau dossier
              await supabase
                .from('dossiers_auto_devis')
                .insert({
                  dossier_id: data.id,
                  workflow_id: workflowId,
                  is_active: true,
                  current_step: 0,
                  next_devis_at: nextDevisAt,
                  devis_generes: [],
                  started_at: new Date().toISOString(),
                })

              console.log(`Auto-devis activé automatiquement pour le dossier ${data.reference}`)
            }
          }
        }
      } catch (autoDevisError) {
        // Ne pas bloquer la création du dossier si l'auto-devis échoue
        console.error('Erreur activation auto-devis automatique:', autoDevisError)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers_auto_devis_all'] })
    },
  })
}

export function useUpdateDossier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTables<'dossiers'> & { id: string }) => {
      const { data, error } = await supabase
        .from('dossiers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['dossier', data.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

// ============ DEVIS ============

export function useDevisByDemande(demandeId: string) {
  return useQuery({
    queryKey: ['devis', 'demande', demandeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('devis')
        .select(`
          *,
          transporteur:transporteurs(*)
        `)
        .eq('demande_id', demandeId)
        .order('price_ttc', { ascending: true })
      if (error) throw error
      return data as unknown as DevisWithTransporteur[]
    },
    enabled: !!demandeId,
  })
}

export function useDevisByDossier(dossierId: string) {
  return useQuery({
    queryKey: ['devis', 'dossier', dossierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('devis')
        .select(`
          *,
          transporteur:transporteurs(*)
        `)
        .eq('dossier_id', dossierId)
        .order('price_ttc', { ascending: true })
      if (error) throw error
      return data as unknown as DevisWithTransporteur[]
    },
    enabled: !!dossierId,
  })
}

export function useAllDevis() {
  return useQuery({
    queryKey: ['devis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('devis')
        .select(`
          *,
          transporteur:transporteurs(*),
          demande:demandes(*),
          dossier:dossiers(*)
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as DevisWithRelations[]
    },
  })
}

export function useCreateDevis() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (devis: InsertTables<'devis'>) => {
      const { data, error } = await supabase
        .from('devis')
        .insert(devis)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devis'] })
    },
  })
}

export function useUpdateDevis() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTables<'devis'> & { id: string }) => {
      const { data, error } = await supabase
        .from('devis')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devis'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useDeleteDevis() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('devis')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devis'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

// ============ TRANSPORTEURS ============

export function useTransporteurs() {
  return useQuery({
    queryKey: ['transporteurs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transporteurs')
        .select('*')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return data as Transporteur[]
    },
  })
}

export function useCreateTransporteur() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (transporteur: InsertTables<'transporteurs'>) => {
      const { data, error } = await supabase
        .from('transporteurs')
        .insert(transporteur)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transporteurs'] })
    },
  })
}

export function useUpdateTransporteur() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<UpdateTables<'transporteurs'>>) => {
      const { data, error } = await supabase
        .from('transporteurs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transporteurs'] })
    },
  })
}

export function useDeleteTransporteur() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transporteurs')
        .update({ is_active: false, active: false })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transporteurs'] })
    },
  })
}

// ============ MESSAGES ============

export function useMessages(dossierId: string, devisId?: string) {
  return useQuery({
    queryKey: ['messages', dossierId, devisId],
    queryFn: async () => {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('dossier_id', dossierId)
        .order('created_at', { ascending: true })

      // Filter by devis_id if provided (for supplier-specific chat)
      if (devisId) {
        query = query.eq('devis_id', devisId)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Message[]
    },
    enabled: !!dossierId,
    refetchInterval: 5000, // Poll every 5 seconds for real-time feel
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (message: InsertTables<'messages'>) => {
      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single()
      if (error) throw error

      // Ajouter une entrée dans la timeline pour le message
      if (data.dossier_id) {
        const senderLabel = data.sender === 'client' ? 'Client' : data.sender === 'admin' ? 'Admin' : 'Fournisseur'
        const devisInfo = data.devis_id ? ` (Fournisseur)` : ''
        await supabase.from('timeline').insert({
          dossier_id: data.dossier_id,
          type: 'message',
          content: `💬 ${senderLabel}${devisInfo}: "${data.content.substring(0, 100)}${data.content.length > 100 ? '...' : ''}"`,
        })
      }

      return data
    },
    onSuccess: (data) => {
      // Invalidate both general and supplier-specific message queries
      queryClient.invalidateQueries({ queryKey: ['messages', data.dossier_id] })
      if (data.devis_id) {
        queryClient.invalidateQueries({ queryKey: ['messages', data.dossier_id, data.devis_id] })
      }
      // Invalider la timeline aussi
      queryClient.invalidateQueries({ queryKey: ['timeline', data.dossier_id] })
    },
  })
}

// ============ CONTRATS ============

export function useContrats() {
  return useQuery({
    queryKey: ['contrats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contrats')
        .select(`
          *,
          dossier:dossiers(*,transporteur:transporteurs(*)),
          devis:devis(*, transporteur:transporteurs(*))
        `)
        .or('status.is.null,status.neq.cancelled') // Exclure les contrats annulés
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

// Contrat par dossier (pour la vue détaillée du dossier)
export function useContratByDossier(dossierId: string) {
  return useQuery({
    queryKey: ['contrat', 'dossier', dossierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contrats')
        .select(`
          *,
          devis:devis(*, transporteur:transporteurs(*))
        `)
        .eq('dossier_id', dossierId)
        .or('status.is.null,status.neq.cancelled')
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!dossierId,
  })
}

// Factures par dossier
export function useFacturesByDossier(dossierId: string) {
  return useQuery({
    queryKey: ['factures', 'dossier', dossierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('factures')
        .select('*')
        .eq('dossier_id', dossierId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!dossierId,
  })
}

// Contrats annulés (historique)
export function useContratsAnnules() {
  return useQuery({
    queryKey: ['contrats', 'cancelled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contrats')
        .select(`
          *,
          dossier:dossiers(*,transporteur:transporteurs(*)),
          devis:devis(*, transporteur:transporteurs(*))
        `)
        .eq('status', 'cancelled')
        .order('cancelled_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useDeleteContrat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (contratId: string) => {
      // D'abord supprimer les paiements liés
      const { error: paymentError } = await supabase
        .from('paiements')
        .delete()
        .eq('contrat_id', contratId)

      if (paymentError) throw paymentError

      // Puis supprimer le contrat
      const { error } = await supabase
        .from('contrats')
        .delete()
        .eq('id', contratId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrats'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['paiements'] })
    },
  })
}

// ============ PAIEMENTS ============

export function usePaiementsByContrat(contratId: string | undefined) {
  return useQuery({
    queryKey: ['paiements', contratId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('paiements')
        .select('*')
        .eq('contrat_id', contratId!)
        .order('payment_date', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!contratId,
  })
}

export function useCreatePaiement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (paiement: {
      contrat_id: string
      dossier_id?: string
      type: 'virement' | 'cb' | 'especes' | 'cheque' | 'remboursement'
      amount: number
      payment_date: string
      reference?: string
      notes?: string
      facture_id?: string
    }) => {
      const { data, error } = await supabase
        .from('paiements')
        .insert(paiement)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['paiements', data.contrat_id] })
      queryClient.invalidateQueries({ queryKey: ['contrats'] })
      queryClient.invalidateQueries({ queryKey: ['factures'] })
    },
  })
}

export function useDeletePaiement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, contrat_id }: { id: string; contrat_id: string }) => {
      const { error } = await supabase
        .from('paiements')
        .delete()
        .eq('id', id)
      if (error) throw error
      return { id, contrat_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['paiements', data.contrat_id] })
      queryClient.invalidateQueries({ queryKey: ['contrats'] })
    },
  })
}

export function useCreateContrat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (contrat: InsertTables<'contrats'>) => {
      const { data, error } = await supabase
        .from('contrats')
        .insert(contrat)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrats'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
    },
  })
}

export function useSignContrat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('contrats')
        .update({
          signed_at: new Date().toISOString(),
          signed_by_client: true,
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrats'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
    },
  })
}

// ============ FACTURES ============

export function useFactures() {
  return useQuery({
    queryKey: ['factures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('factures')
        .select(`
          *,
          dossier:dossiers(
            *,
            contrat:contrats(*),
            devis:devis(*)
          )
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCreateFacture() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (facture: InsertTables<'factures'>) => {
      const { data, error } = await supabase
        .from('factures')
        .insert(facture)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures'] })
    },
  })
}

// ============ PAIEMENTS FOURNISSEURS ============

export function usePaiementsFournisseurs(dossierId?: string) {
  return useQuery({
    queryKey: ['paiements_fournisseurs', dossierId],
    queryFn: async () => {
      let query = supabase
        .from('paiements_fournisseurs')
        .select(`
          *,
          dossier:dossiers(id, reference, client_name),
          transporteur:transporteurs(id, name, number)
        `)
        .order('payment_date', { ascending: false })

      if (dossierId) {
        query = query.eq('dossier_id', dossierId)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: dossierId ? !!dossierId : true,
  })
}

export function useCreatePaiementFournisseur() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (paiement: {
      dossier_id: string
      transporteur_id: string
      amount: number
      payment_date: string
      type: string
      reference?: string
      notes?: string
    }) => {
      const { data, error } = await supabase
        .from('paiements_fournisseurs')
        .insert(paiement)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['paiements_fournisseurs'] })
      queryClient.invalidateQueries({ queryKey: ['paiements_fournisseurs', variables.dossier_id] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
    },
  })
}

export function useDeletePaiementFournisseur() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('paiements_fournisseurs')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements_fournisseurs'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
    },
  })
}

// Stats pour les paiements fournisseurs
export function useStatsPaiementsFournisseurs() {
  return useQuery({
    queryKey: ['stats_paiements_fournisseurs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('paiements_fournisseurs')
        .select(`
          *,
          transporteur:transporteurs(id, name, number)
        `)
      if (error) throw error
      return data
    },
  })
}

// ============ RAPPELS ============

export function useRappels(options?: { dossierId?: string; includeCompleted?: boolean }) {
  return useQuery({
    queryKey: ['rappels', options?.dossierId, options?.includeCompleted],
    queryFn: async () => {
      let query = supabase
        .from('rappels')
        .select(`
          *,
          dossier:dossiers(id, reference, client_name, departure, arrival, departure_date)
        `)
        .order('reminder_date', { ascending: true })

      if (options?.dossierId) {
        query = query.eq('dossier_id', options.dossierId)
      }

      if (!options?.includeCompleted) {
        query = query.eq('is_done', false)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useCreateRappel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (rappel: {
      dossier_id?: string
      title: string
      description?: string
      reminder_date: string
      reminder_time?: string
      priority?: string
    }) => {
      const { data, error } = await supabase
        .from('rappels')
        .insert(rappel)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rappels'] })
    },
  })
}

export function useUpdateRappel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string
      title?: string
      description?: string
      reminder_date?: string
      reminder_time?: string
      priority?: string
      is_done?: boolean
    }) => {
      const { data, error } = await supabase
        .from('rappels')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rappels'] })
    },
  })
}

export function useDeleteRappel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rappels')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rappels'] })
    },
  })
}

// ============ DEMANDES FOURNISSEURS ============

export function useDemandesFournisseurs(dossierId?: string) {
  return useQuery({
    queryKey: ['demandes_fournisseurs', dossierId],
    queryFn: async () => {
      let query = supabase
        .from('demandes_fournisseurs')
        .select(`
          *,
          transporteur:transporteurs(*),
          dossier:dossiers(*),
          devis:devis(*)
        `)
        .order('created_at', { ascending: false })

      if (dossierId) {
        query = query.eq('dossier_id', dossierId)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useAllDemandesFournisseurs() {
  return useQuery({
    queryKey: ['demandes_fournisseurs_all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demandes_fournisseurs')
        .select(`
          *,
          transporteur:transporteurs(*),
          dossier:dossiers(*, devis:devis(*)),
          devis:devis(*)
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCreateDemandeFournisseur() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (demande: InsertTables<'demandes_fournisseurs'>) => {
      const { data, error } = await supabase
        .from('demandes_fournisseurs')
        .insert(demande)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes_fournisseurs'] })
      queryClient.invalidateQueries({ queryKey: ['demandes_fournisseurs_all'] })
    },
  })
}

export function useUpdateDemandeFournisseur() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<UpdateTables<'demandes_fournisseurs'>>) => {
      const { data, error } = await supabase
        .from('demandes_fournisseurs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes_fournisseurs'] })
      queryClient.invalidateQueries({ queryKey: ['demandes_fournisseurs_all'] })
    },
  })
}

export function useDeleteDemandeFournisseur() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('demandes_fournisseurs')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes_fournisseurs'] })
      queryClient.invalidateQueries({ queryKey: ['demandes_fournisseurs_all'] })
    },
  })
}

// ============ VOYAGE INFOS ============

export function useVoyageInfo(dossierId: string) {
  return useQuery({
    queryKey: ['voyage_info', dossierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voyage_infos')
        .select('*')
        .eq('dossier_id', dossierId)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!dossierId,
  })
}

// Hook pour récupérer uniquement les infos transporteur nécessaires pour le chat client
// Ne récupère que le nom et numéro d'astreinte - PAS de données sensibles (prix, etc.)
export function useTransporteurForChat(dossierId: string) {
  return useQuery({
    queryKey: ['transporteur_chat', dossierId],
    queryFn: async () => {
      // D'abord récupérer le transporteur_id du dossier
      const { data: dossier, error: dossierError } = await supabase
        .from('dossiers')
        .select('transporteur_id')
        .eq('id', dossierId)
        .single()
      if (dossierError) throw dossierError
      if (!dossier?.transporteur_id) return null

      // Ensuite récupérer uniquement nom et astreinte du transporteur
      const { data: transporteur, error: transporteurError } = await supabase
        .from('transporteurs')
        .select('name, astreinte_tel')
        .eq('id', dossier.transporteur_id)
        .single()
      if (transporteurError) throw transporteurError

      return transporteur ? { nom: transporteur.name, astreinte_tel: transporteur.astreinte_tel } : null
    },
    enabled: !!dossierId,
  })
}

export function useCreateOrUpdateVoyageInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (voyageInfo: InsertTables<'voyage_infos'>) => {
      if (!voyageInfo.dossier_id) throw new Error('dossier_id is required')

      // Vérifier si c'est une création ou une mise à jour
      const { data: existing } = await supabase
        .from('voyage_infos')
        .select('id')
        .eq('dossier_id', voyageInfo.dossier_id)
        .single()

      const { data, error } = await supabase
        .from('voyage_infos')
        .upsert(voyageInfo, { onConflict: 'dossier_id' })
        .select()
        .single()
      if (error) throw error

      // Ajouter une entrée dans la timeline
      if (data.dossier_id) {
        const action = existing ? 'modifiées' : 'ajoutées'
        await supabase.from('timeline').insert({
          dossier_id: data.dossier_id,
          type: 'voyage_info',
          content: `📝 Informations voyage ${action}`,
        })
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dossier', data.dossier_id] })
      queryClient.invalidateQueries({ queryKey: ['voyage_info', data.dossier_id] })
      queryClient.invalidateQueries({ queryKey: ['timeline', data.dossier_id] })
    },
  })
}

// ============ TIMELINE ============

export function useTimeline(dossierId: string) {
  return useQuery({
    queryKey: ['timeline', dossierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timeline')
        .select('*')
        .eq('dossier_id', dossierId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!dossierId,
  })
}

export function useAddTimelineEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (entry: InsertTables<'timeline'>) => {
      const { data, error } = await supabase
        .from('timeline')
        .insert(entry)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['timeline', data.dossier_id] })
    },
  })
}

// ============ STATS ============

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data: dossiers, error: dossiersError } = await supabase
        .from('dossiers')
        .select('status, price_ttc, price_achat')

      if (dossiersError) throw dossiersError

      // Statuts qui comptent pour le CA (devis confirmé par admin et au-delà)
      const validRevenueStatuses = ['pending-payment', 'pending-reservation', 'bpa-received', 'pending-info', 'pending-info-received', 'pending-info-confirm', 'pending-driver', 'confirmed', 'completed']
      const dossiersWithRevenue = dossiers.filter(d => validRevenueStatuses.includes(d.status || ''))

      const stats = {
        total: dossiers.length,
        new: dossiers.filter(d => d.status === 'new').length,
        quotesSent: dossiers.filter(d => d.status === 'quotes_sent').length,
        pendingClient: dossiers.filter(d => d.status === 'pending-client').length,
        pendingPayment: dossiers.filter(d => d.status === 'pending-payment').length,
        pendingReservation: dossiers.filter(d => d.status === 'pending-reservation').length,
        bpaReceived: dossiers.filter(d => d.status === 'bpa-received').length,
        pendingInfo: dossiers.filter(d => d.status === 'pending-info').length,
        pendingInfoReceived: dossiers.filter(d => d.status === 'pending-info-received').length,
        pendingInfoConfirm: dossiers.filter(d => d.status === 'pending-info-confirm').length,
        pendingDriver: dossiers.filter(d => d.status === 'pending-driver').length,
        confirmed: dossiers.filter(d => d.status === 'confirmed').length,
        completed: dossiers.filter(d => d.status === 'completed').length,
        // Ne compter que les dossiers avec devis confirmé (pas en attente)
        totalRevenue: dossiersWithRevenue.reduce((sum, d) => sum + (d.price_ttc || 0), 0),
        totalMargin: dossiersWithRevenue.reduce((sum, d) => sum + ((d.price_ttc || 0) - (d.price_achat || 0)), 0),
      }

      return stats
    },
  })
}

// ============ TARIFS DE RÉFÉRENCE ============

export function useTarifsAllerSimple() {
  return useQuery({
    queryKey: ['tarifs_aller_simple'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarifs_aller_simple')
        .select('*')
        .order('km_min', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useTarifsAR1J() {
  return useQuery({
    queryKey: ['tarifs_ar_1j'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarifs_ar_1j')
        .select('*')
        .order('km_min', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useTarifsARMad() {
  return useQuery({
    queryKey: ['tarifs_ar_mad'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarifs_ar_mad')
        .select('*')
        .order('km_min', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useTarifsARSansMad() {
  return useQuery({
    queryKey: ['tarifs_ar_sans_mad'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarifs_ar_sans_mad')
        .select('*')
        .order('km_min', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useCoefficientsVehicules() {
  return useQuery({
    queryKey: ['coefficients_vehicules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coefficients_vehicules')
        .select('*')
        .order('coefficient', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

// ============ WORKFLOW DEVIS AUTO ============

export interface WorkflowStep {
  delay_hours: number
  marge_percent: number
  label: string
}

export interface WorkflowDevisAuto {
  id: string
  name: string
  is_active: boolean
  is_default: boolean
  steps: WorkflowStep[]
  created_at: string
  updated_at: string
}

export function useWorkflowsDevisAuto() {
  return useQuery({
    queryKey: ['workflows_devis_auto'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_devis_auto')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as WorkflowDevisAuto[]
    },
  })
}

export function useDefaultWorkflow() {
  return useQuery({
    queryKey: ['workflow_devis_auto_default'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_devis_auto')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return data as WorkflowDevisAuto | null
    },
  })
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (workflow: { name: string; steps: WorkflowStep[]; is_default?: boolean }) => {
      const { data, error } = await supabase
        .from('workflow_devis_auto')
        .insert({
          name: workflow.name,
          steps: workflow.steps as unknown as Json,
          is_default: workflow.is_default || false,
          is_active: true,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows_devis_auto'] })
    },
  })
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; steps?: WorkflowStep[]; is_active?: boolean; is_default?: boolean }) => {
      const updateData = {
        ...updates,
        steps: updates.steps ? updates.steps as unknown as Json : undefined,
        updated_at: new Date().toISOString()
      }
      const { data, error } = await supabase
        .from('workflow_devis_auto')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows_devis_auto'] })
      queryClient.invalidateQueries({ queryKey: ['workflow_devis_auto_default'] })
    },
  })
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workflow_devis_auto')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows_devis_auto'] })
    },
  })
}

// ============ DOSSIERS AUTO DEVIS ============

export interface DossierAutoDevis {
  id: string
  dossier_id: string
  workflow_id: string | null
  is_active: boolean
  current_step: number
  prix_reference: number | null
  type_trajet: string | null
  next_devis_at: string | null
  devis_generes: { devis_id: string; step: number; marge: number; created_at: string }[]
  started_at: string
  paused_at: string | null
  created_at: string
  updated_at: string
}

export function useDossierAutoDevis(dossierId: string) {
  return useQuery({
    queryKey: ['dossier_auto_devis', dossierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers_auto_devis')
        .select(`
          *,
          workflow:workflow_devis_auto(*)
        `)
        .eq('dossier_id', dossierId)
        .maybeSingle()
      if (error) throw error
      return data as (DossierAutoDevis & { workflow: WorkflowDevisAuto | null }) | null
    },
    enabled: !!dossierId,
  })
}

export function useAllDossiersAutoDevis() {
  return useQuery({
    queryKey: ['dossiers_auto_devis_all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers_auto_devis')
        .select(`
          *,
          workflow:workflow_devis_auto(*),
          dossier:dossiers(*)
        `)
        .order('next_devis_at', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useActivateAutoDevis() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      dossierId,
      workflowId,
      prixReference,
      typeTrajet
    }: {
      dossierId: string
      workflowId?: string
      prixReference?: number
      typeTrajet?: string
    }) => {
      // Récupérer le workflow par défaut si non spécifié
      let wfId = workflowId
      if (!wfId) {
        const { data: defaultWf } = await supabase
          .from('workflow_devis_auto')
          .select('id')
          .eq('is_default', true)
          .eq('is_active', true)
          .single()
        wfId = defaultWf?.id
      }

      // Récupérer les étapes du workflow
      const { data: workflow } = await supabase
        .from('workflow_devis_auto')
        .select('steps')
        .eq('id', wfId!)
        .single()

      const steps = (workflow?.steps as unknown as WorkflowStep[]) || []
      const firstStep = steps[0]
      const nextDevisAt = firstStep
        ? new Date(Date.now() + firstStep.delay_hours * 60 * 60 * 1000).toISOString()
        : null

      const { data, error } = await supabase
        .from('dossiers_auto_devis')
        .upsert({
          dossier_id: dossierId,
          workflow_id: wfId,
          prix_reference: prixReference,
          type_trajet: typeTrajet,
          is_active: true,
          current_step: 0,
          next_devis_at: nextDevisAt,
          devis_generes: [],
          started_at: new Date().toISOString(),
          paused_at: null,
        }, { onConflict: 'dossier_id' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dossier_auto_devis', data.dossier_id] })
      queryClient.invalidateQueries({ queryKey: ['dossiers_auto_devis_all'] })
    },
  })
}

export function useDeactivateAutoDevis() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dossierId: string) => {
      const { data, error } = await supabase
        .from('dossiers_auto_devis')
        .update({
          is_active: false,
          paused_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('dossier_id', dossierId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dossier_auto_devis', data.dossier_id] })
      queryClient.invalidateQueries({ queryKey: ['dossiers_auto_devis_all'] })
    },
  })
}

// ============ CALCUL PRIX DEPUIS GRILLE ============

export type TypeTrajet = 'aller_simple' | 'ar_1j' | 'ar_mad' | 'ar_sans_mad'

export interface CalculPrixParams {
  typeTrajet: TypeTrajet
  distanceKm: number
  vehiculeCode?: string // standard, minibus, 60-63, 70, 83-90
  nbJours?: number // Pour AR MAD et AR sans MAD
  amplitude?: '8h' | '10h' | '12h' | '9h_coupure' // Pour AR 1J
}

export interface CalculPrixResult {
  prixPublic: number // Prix avec 30% marge (grille)
  prixAchat: number // Prix d'achat théorique (prixPublic / 1.30)
  coefficient: number
  prixPublicAvecCoef: number
  prixAchatAvecCoef: number
}

export function useCalculPrix() {
  const { data: tarifsAllerSimple } = useTarifsAllerSimple()
  const { data: tarifsAR1J } = useTarifsAR1J()
  const { data: tarifsARMad } = useTarifsARMad()
  const { data: tarifsARSansMad } = useTarifsARSansMad()
  const { data: coefficients } = useCoefficientsVehicules()

  const calculerPrix = (params: CalculPrixParams): CalculPrixResult | null => {
    const { typeTrajet, distanceKm, vehiculeCode = 'standard', nbJours = 2, amplitude = '12h' } = params

    // Trouver le coefficient véhicule
    const coef = coefficients?.find(c => c.code === vehiculeCode)?.coefficient || 1

    let prixPublic: number | null = null

    if (typeTrajet === 'aller_simple' && tarifsAllerSimple) {
      const tarif = tarifsAllerSimple.find(t => distanceKm > t.km_min && distanceKm <= t.km_max)
      prixPublic = tarif?.prix_public || null
    } else if (typeTrajet === 'ar_1j' && tarifsAR1J) {
      const tarif = tarifsAR1J.find(t => distanceKm > t.km_min && distanceKm <= t.km_max)
      if (tarif) {
        if (amplitude === '8h') prixPublic = tarif.prix_8h
        else if (amplitude === '10h') prixPublic = tarif.prix_10h
        else if (amplitude === '12h') prixPublic = tarif.prix_12h
        else prixPublic = tarif.prix_9h_coupure
      }
    } else if (typeTrajet === 'ar_mad' && tarifsARMad) {
      const tarif = tarifsARMad.find(t => distanceKm > t.km_min && distanceKm <= t.km_max)
      if (tarif) {
        const jours = Math.min(nbJours, 6)
        const joursSupp = Math.max(0, nbJours - 6)
        const prixBase = (tarif as any)[`prix_${jours}j`] as number | null
        if (prixBase) {
          prixPublic = prixBase + joursSupp * (tarif.supplement_jour || 800)
        }
      }
    } else if (typeTrajet === 'ar_sans_mad' && tarifsARSansMad) {
      const tarif = tarifsARSansMad.find(t => distanceKm > t.km_min && distanceKm <= t.km_max)
      if (tarif) {
        const jours = Math.min(nbJours, 6)
        const joursSupp = Math.max(0, nbJours - 6)
        const prixBase = (tarif as any)[`prix_${jours}j`] as number | null
        if (prixBase) {
          prixPublic = prixBase + joursSupp * (tarif.supplement_jour || 600)
        }
      }
    }

    if (!prixPublic) return null

    // La grille a 30% de marge, donc prix achat = prix / 1.30
    const prixAchat = Math.round(prixPublic / 1.30)

    return {
      prixPublic,
      prixAchat,
      coefficient: coef,
      prixPublicAvecCoef: Math.round(prixPublic * coef),
      prixAchatAvecCoef: Math.round(prixAchat * coef),
    }
  }

  return { calculerPrix, isReady: !!tarifsAllerSimple && !!coefficients }
}

// ============ DEMANDES CHAUFFEUR ============

export function useDemandesChauffeur(dossierId?: string) {
  return useQuery({
    queryKey: ['demandes_chauffeur', dossierId],
    queryFn: async () => {
      let query = supabase
        .from('demandes_chauffeur')
        .select(`
          *,
          dossier:dossiers(*),
          transporteur:transporteurs(*)
        `)
        .order('created_at', { ascending: false })

      if (dossierId) {
        query = query.eq('dossier_id', dossierId)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: dossierId ? !!dossierId : true,
  })
}

export function useDemandeChauffeurByToken(token: string) {
  return useQuery({
    queryKey: ['demande_chauffeur_token', token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demandes_chauffeur')
        .select(`
          *,
          dossier:dossiers(
            *,
            transporteur:transporteurs(*),
            voyage_info:voyage_infos(*)
          ),
          transporteur:transporteurs(*)
        `)
        .eq('token', token)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!token,
  })
}

export function useCreateDemandeChauffeur() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (demande: InsertTables<'demandes_chauffeur'>) => {
      const { data, error } = await supabase
        .from('demandes_chauffeur')
        .insert(demande)
        .select()
        .single()
      if (error) throw error

      // Mettre à jour voyage_infos avec la date d'envoi
      if (demande.dossier_id) {
        await supabase
          .from('voyage_infos')
          .update({
            demande_chauffeur_envoyee_at: new Date().toISOString(),
            feuille_route_type: demande.type,
          })
          .eq('dossier_id', demande.dossier_id)

        // Ajouter entrée timeline
        await supabase.from('timeline').insert({
          dossier_id: demande.dossier_id,
          type: 'chauffeur_request',
          content: `📞 Demande de contact chauffeur envoyée (${demande.type === 'aller_retour' ? 'Aller-Retour' : demande.type === 'aller' ? 'Aller' : 'Retour'})`,
        })
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['demandes_chauffeur'] })
      queryClient.invalidateQueries({ queryKey: ['demandes_chauffeur', data.dossier_id] })
      queryClient.invalidateQueries({ queryKey: ['voyage_info', data.dossier_id] })
      queryClient.invalidateQueries({ queryKey: ['timeline', data.dossier_id] })
    },
  })
}

export function useUpdateDemandeChauffeur() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<InsertTables<'demandes_chauffeur'>>) => {
      const { data, error } = await supabase
        .from('demandes_chauffeur')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['demandes_chauffeur'] })
      queryClient.invalidateQueries({ queryKey: ['demandes_chauffeur', data.dossier_id] })
      queryClient.invalidateQueries({ queryKey: ['demande_chauffeur_token', data.token] })
    },
  })
}

// Hook pour mettre à jour les infos chauffeur (utilisé par la page fournisseur)
export function useUpdateChauffeurInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      dossierId,
      demandeChauffeurId,
      chauffeurAller,
      chauffeurRetour,
    }: {
      dossierId: string
      demandeChauffeurId: string
      chauffeurAller?: {
        nom: string
        tel: string
        immatriculation: string
      }
      chauffeurRetour?: {
        nom: string
        tel: string
        immatriculation: string
      }
    }) => {
      const now = new Date().toISOString()

      // Mettre à jour voyage_infos avec les infos chauffeur
      const voyageInfoUpdate: Record<string, unknown> = {
        chauffeur_info_recue_at: now,
        feuille_route_generee_at: now,
      }

      if (chauffeurAller) {
        voyageInfoUpdate.chauffeur_aller_nom = chauffeurAller.nom
        voyageInfoUpdate.chauffeur_aller_tel = chauffeurAller.tel
        voyageInfoUpdate.chauffeur_aller_immatriculation = chauffeurAller.immatriculation
      }

      if (chauffeurRetour) {
        voyageInfoUpdate.chauffeur_retour_nom = chauffeurRetour.nom
        voyageInfoUpdate.chauffeur_retour_tel = chauffeurRetour.tel
        voyageInfoUpdate.chauffeur_retour_immatriculation = chauffeurRetour.immatriculation
      }

      const { error: voyageError } = await supabase
        .from('voyage_infos')
        .update(voyageInfoUpdate)
        .eq('dossier_id', dossierId)

      if (voyageError) throw voyageError

      // Mettre à jour la demande chauffeur
      const { error: demandeError } = await supabase
        .from('demandes_chauffeur')
        .update({
          status: 'received',
          received_at: now,
        })
        .eq('id', demandeChauffeurId)

      if (demandeError) throw demandeError

      // Mettre à jour le status du dossier vers completed ou pending-driver
      const { error: dossierError } = await supabase
        .from('dossiers')
        .update({
          status: 'pending-driver',
        })
        .eq('id', dossierId)

      if (dossierError) throw dossierError

      // Ajouter entrée timeline
      await supabase.from('timeline').insert({
        dossier_id: dossierId,
        type: 'chauffeur_info_received',
        content: `✅ Informations chauffeur reçues${chauffeurAller ? ` - Aller: ${chauffeurAller.nom}` : ''}${chauffeurRetour ? ` - Retour: ${chauffeurRetour.nom}` : ''}`,
      })

      return { dossierId, demandeChauffeurId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['demandes_chauffeur'] })
      queryClient.invalidateQueries({ queryKey: ['demandes_chauffeur', data.dossierId] })
      queryClient.invalidateQueries({ queryKey: ['voyage_info', data.dossierId] })
      queryClient.invalidateQueries({ queryKey: ['dossier', data.dossierId] })
      queryClient.invalidateQueries({ queryKey: ['timeline', data.dossierId] })
    },
  })
}

// Hook pour marquer la feuille de route comme envoyée
export function useMarkFeuilleRouteEnvoyee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dossierId: string) => {
      const now = new Date().toISOString()

      const { error } = await supabase
        .from('voyage_infos')
        .update({
          feuille_route_envoyee_at: now,
        })
        .eq('dossier_id', dossierId)

      if (error) throw error

      // Ajouter entrée timeline
      await supabase.from('timeline').insert({
        dossier_id: dossierId,
        type: 'feuille_route_sent',
        content: `📄 Feuille de route envoyée au client`,
      })

      return { dossierId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['voyage_info', data.dossierId] })
      queryClient.invalidateQueries({ queryKey: ['timeline', data.dossierId] })
    },
  })
}

// Fonction utilitaire pour générer un token unique (cryptographiquement sûr)
export function generateChauffeurToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// ============ APP SETTINGS ============

export interface CronChauffeurConfig {
  enabled: boolean
  heure: string
  jours_avance: number
}

export interface CronChauffeurLastRun {
  date: string | null
  dossiers_count: number
  success: boolean
  error?: string
}

// Hook pour récupérer un paramètre
export function useAppSetting<T = unknown>(key: string) {
  return useQuery({
    queryKey: ['app_settings', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', key)
        .single()
      if (error) throw error
      return data?.value as T
    },
  })
}

// Hook pour mettre à jour un paramètre
export function useUpdateAppSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Json }) => {
      const { data, error } = await supabase
        .from('app_settings')
        .update({ value })
        .eq('key', key)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['app_settings', variables.key] })
    },
  })
}

// Hook pour récupérer la clé API Geoapify (depuis DB ou fallback env)
export function useGeoapifyKey() {
  return useQuery({
    queryKey: ['app_setting', 'geoapify_api_key'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'geoapify_api_key')
        .single()

      if (data && !error && data.value) {
        const value = data.value as { key?: string }
        if (value.key) {
          return value.key
        }
      }
      // Fallback to env variable
      return import.meta.env.VITE_GEOAPIFY_API_KEY || ''
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
}

// Hook pour récupérer les paramètres de l'entreprise (company_settings)
export function useCompanySettings() {
  return useQuery({
    queryKey: ['company_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single()

      if (error) {
        console.error('Error fetching company settings:', error)
        return null
      }
      return data
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  })
}

// Hook pour exécuter manuellement le CRON des demandes chauffeur
export function useRunCronChauffeur() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      // Récupérer les dossiers qui partent demain (ou sam/dim/lun si vendredi)
      const today = new Date()
      const dayOfWeek = today.getDay()

      const departureDates: string[] = []

      if (dayOfWeek === 5) {
        // Vendredi: Sam, Dim, Lun
        for (let i = 1; i <= 3; i++) {
          const date = new Date(today)
          date.setDate(date.getDate() + i)
          departureDates.push(date.toISOString().split('T')[0])
        }
      } else if (dayOfWeek === 6 || dayOfWeek === 0) {
        // Weekend: skip
        return { success: true, message: 'Pas de demandes le weekend', count: 0 }
      } else {
        // Lun-Jeu: J+1
        const date = new Date(today)
        date.setDate(date.getDate() + 1)
        departureDates.push(date.toISOString().split('T')[0])
      }

      // Récupérer les dossiers éligibles
      const { data: dossiers, error: dossiersError } = await supabase
        .from('dossiers')
        .select(`
          id,
          reference,
          departure_date,
          return_date,
          transporteur_id,
          transporteur:transporteurs (id, name, email)
        `)
        .in('departure_date', departureDates)
        .not('transporteur_id', 'is', null)
        .in('status', ['pending-reservation', 'bpa-received', 'pending-info', 'pending-driver'])

      if (dossiersError) throw dossiersError

      if (!dossiers || dossiers.length === 0) {
        // Mettre à jour le dernier run
        await supabase
          .from('app_settings')
          .update({
            value: {
              date: new Date().toISOString(),
              dossiers_count: 0,
              success: true,
            },
          })
          .eq('key', 'cron_chauffeur_last_run')

        return { success: true, message: 'Aucun dossier éligible', count: 0 }
      }

      // Vérifier lesquels n'ont pas déjà d'infos chauffeur ou de demande pending
      const dossierIds = dossiers.map(d => d.id)

      // Récupérer voyage_infos pour vérifier:
      // - chauffeur_info_recue_at (déjà reçu)
      // - validated_at (infos voyages envoyées)
      const { data: voyageInfos } = await supabase
        .from('voyage_infos')
        .select('dossier_id, chauffeur_info_recue_at, validated_at')
        .in('dossier_id', dossierIds)

      const dossiersWithChauffeurInfo = new Set(
        (voyageInfos || [])
          .filter(vi => vi.chauffeur_info_recue_at)
          .map(vi => vi.dossier_id)
      )

      // Seuls les dossiers avec infos voyages validées sont éligibles
      const dossiersWithValidatedInfos = new Set(
        (voyageInfos || [])
          .filter(vi => vi.validated_at)
          .map(vi => vi.dossier_id)
      )

      // Vérifier si BPA reçu (via bpa_received_at OU status = 'bpa_received')
      const { data: demandesFournisseurs } = await supabase
        .from('demandes_fournisseurs')
        .select('dossier_id, bpa_received_at, status')
        .in('dossier_id', dossierIds)

      const dossiersWithBpaReceived = new Set(
        (demandesFournisseurs || [])
          .filter(df => df.bpa_received_at || df.status === 'bpa_received')
          .map(df => df.dossier_id)
      )

      const { data: existingDemandes } = await supabase
        .from('demandes_chauffeur')
        .select('dossier_id')
        .in('dossier_id', dossierIds)
        .eq('status', 'pending')

      const dossiersWithPendingDemandes = new Set(
        (existingDemandes || []).map(d => d.dossier_id)
      )

      // Conditions:
      // 1. Pas d'infos chauffeur déjà reçues
      // 2. Pas de demande pending
      // 3. BPA validé par le transporteur
      // 4. Infos voyages envoyées au client
      const dossiersToRequest = dossiers.filter(
        d =>
          !dossiersWithChauffeurInfo.has(d.id) &&
          !dossiersWithPendingDemandes.has(d.id) &&
          dossiersWithBpaReceived.has(d.id) &&
          dossiersWithValidatedInfos.has(d.id)
      )

      if (dossiersToRequest.length === 0) {
        await supabase
          .from('app_settings')
          .update({
            value: {
              date: new Date().toISOString(),
              dossiers_count: 0,
              success: true,
            },
          })
          .eq('key', 'cron_chauffeur_last_run')

        return { success: true, message: 'Tous les dossiers ont déjà des demandes', count: 0 }
      }

      // Créer les demandes
      const results: string[] = []
      for (const dossier of dossiersToRequest) {
        const token = generateChauffeurToken()
        const hasRetour = !!dossier.return_date
        const type = hasRetour ? 'aller_retour' : 'aller'

        const { error: demandeError } = await supabase
          .from('demandes_chauffeur')
          .insert({
            dossier_id: dossier.id,
            transporteur_id: dossier.transporteur_id,
            type,
            mode: 'individuel',
            token,
            status: 'pending',
            sent_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          })

        if (!demandeError) {
          results.push(dossier.reference)

          // Ajouter entrée timeline
          await supabase.from('timeline').insert({
            dossier_id: dossier.id,
            type: 'email_sent',
            content: `📋 Demande de contact chauffeur envoyée automatiquement`,
          })
        }
      }

      // Mettre à jour le dernier run
      await supabase
        .from('app_settings')
        .update({
          value: {
            date: new Date().toISOString(),
            dossiers_count: results.length,
            success: true,
          },
        })
        .eq('key', 'cron_chauffeur_last_run')

      return {
        success: true,
        message: `${results.length} demande(s) créée(s)`,
        count: results.length,
        dossiers: results,
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app_settings', 'cron_chauffeur_last_run'] })
      queryClient.invalidateQueries({ queryKey: ['demandes_chauffeur'] })
    },
  })
}

// ============ VEHICULES ET CHAUFFEURS ============

// Hook pour récupérer les véhicules d'un trajet
export function useVehiculesTrajet(dossierId: string, trajetType?: 'aller' | 'retour') {
  return useQuery({
    queryKey: ['vehicules_trajet', dossierId, trajetType],
    queryFn: async () => {
      let query = supabase
        .from('vehicules_trajet')
        .select(`
          *,
          chauffeurs:chauffeurs_vehicule(*)
        `)
        .eq('dossier_id', dossierId)
        .order('ordre', { ascending: true })

      if (trajetType) {
        query = query.eq('trajet_type', trajetType)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!dossierId,
  })
}

// Hook pour créer un véhicule
export function useCreateVehiculeTrajet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vehicule: {
      dossier_id: string
      trajet_type: 'aller' | 'retour'
      immatriculation?: string
      type_vehicule?: string
      capacite?: number
      ordre?: number
    }) => {
      const { data, error } = await supabase
        .from('vehicules_trajet')
        .insert(vehicule)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vehicules_trajet', data.dossier_id] })
    },
  })
}

// Hook pour mettre à jour un véhicule
export function useUpdateVehiculeTrajet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string
      immatriculation?: string
      type_vehicule?: string
      capacite?: number
      ordre?: number
    }) => {
      const { data, error } = await supabase
        .from('vehicules_trajet')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vehicules_trajet', data.dossier_id] })
    },
  })
}

// Hook pour supprimer un véhicule
export function useDeleteVehiculeTrajet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dossierId }: { id: string; dossierId: string }) => {
      const { error } = await supabase
        .from('vehicules_trajet')
        .delete()
        .eq('id', id)
      if (error) throw error
      return { id, dossierId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vehicules_trajet', data.dossierId] })
    },
  })
}

// Hook pour créer un chauffeur
export function useCreateChauffeurVehicule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (chauffeur: {
      vehicule_trajet_id: string
      nom: string
      tel?: string
      role?: string
      ordre?: number
    }) => {
      const { data, error } = await supabase
        .from('chauffeurs_vehicule')
        .insert(chauffeur)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicules_trajet'] })
    },
  })
}

// Hook pour mettre à jour un chauffeur
export function useUpdateChauffeurVehicule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string
      nom?: string
      tel?: string
      role?: string
      ordre?: number
    }) => {
      const { data, error } = await supabase
        .from('chauffeurs_vehicule')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicules_trajet'] })
    },
  })
}

// Hook pour supprimer un chauffeur
export function useDeleteChauffeurVehicule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('chauffeurs_vehicule')
        .delete()
        .eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicules_trajet'] })
    },
  })
}

// Hook pour sauvegarder tous les véhicules et chauffeurs d'un coup (utilisé par la page fournisseur)
export function useSaveVehiculesEtChauffeurs() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      dossierId,
      demandeChauffeurId,
      astreinteTel,
      vehiculesAller,
      vehiculesRetour,
    }: {
      dossierId: string
      demandeChauffeurId: string
      astreinteTel?: string
      vehiculesAller?: Array<{
        immatriculation?: string
        type_vehicule?: string
        capacite?: number
        chauffeurs: Array<{ nom: string; tel?: string; role?: string }>
      }>
      vehiculesRetour?: Array<{
        immatriculation?: string
        type_vehicule?: string
        capacite?: number
        chauffeurs: Array<{ nom: string; tel?: string; role?: string }>
      }>
    }) => {
      const now = new Date().toISOString()

      // Supprimer les anciens véhicules du dossier
      await supabase
        .from('vehicules_trajet')
        .delete()
        .eq('dossier_id', dossierId)

      // Créer les véhicules aller
      if (vehiculesAller && vehiculesAller.length > 0) {
        for (let i = 0; i < vehiculesAller.length; i++) {
          const v = vehiculesAller[i]
          const { data: vehicule, error: vError } = await supabase
            .from('vehicules_trajet')
            .insert({
              dossier_id: dossierId,
              trajet_type: 'aller',
              immatriculation: v.immatriculation || null,
              type_vehicule: v.type_vehicule || null,
              capacite: v.capacite || null,
              ordre: i + 1,
            })
            .select()
            .single()

          if (vError) throw vError

          // Créer les chauffeurs de ce véhicule
          for (let j = 0; j < v.chauffeurs.length; j++) {
            const c = v.chauffeurs[j]
            await supabase.from('chauffeurs_vehicule').insert({
              vehicule_trajet_id: vehicule.id,
              nom: c.nom,
              tel: c.tel || null,
              role: c.role || 'principal',
              ordre: j + 1,
            })
          }
        }
      }

      // Créer les véhicules retour
      if (vehiculesRetour && vehiculesRetour.length > 0) {
        for (let i = 0; i < vehiculesRetour.length; i++) {
          const v = vehiculesRetour[i]
          const { data: vehicule, error: vError } = await supabase
            .from('vehicules_trajet')
            .insert({
              dossier_id: dossierId,
              trajet_type: 'retour',
              immatriculation: v.immatriculation || null,
              type_vehicule: v.type_vehicule || null,
              capacite: v.capacite || null,
              ordre: i + 1,
            })
            .select()
            .single()

          if (vError) throw vError

          // Créer les chauffeurs de ce véhicule
          for (let j = 0; j < v.chauffeurs.length; j++) {
            const c = v.chauffeurs[j]
            await supabase.from('chauffeurs_vehicule').insert({
              vehicule_trajet_id: vehicule.id,
              nom: c.nom,
              tel: c.tel || null,
              role: c.role || 'principal',
              ordre: j + 1,
            })
          }
        }
      }

      // Trouver le chauffeur principal aller et retour
      const chauffeurAllerPrincipal = vehiculesAller?.[0]?.chauffeurs?.find(c => c.role === 'principal') || vehiculesAller?.[0]?.chauffeurs?.[0]
      const chauffeurRetourPrincipal = vehiculesRetour?.[0]?.chauffeurs?.find(c => c.role === 'principal') || vehiculesRetour?.[0]?.chauffeurs?.[0]

      // Mettre à jour voyage_infos avec les infos chauffeur
      const { error: voyageError } = await supabase
        .from('voyage_infos')
        .update({
          chauffeur_info_recue_at: now,
          feuille_route_generee_at: now,
          astreinte_tel: astreinteTel || null,
          // Copier les infos du chauffeur principal aller
          chauffeur_aller_nom: chauffeurAllerPrincipal?.nom || null,
          chauffeur_aller_tel: chauffeurAllerPrincipal?.tel || null,
          chauffeur_aller_immatriculation: vehiculesAller?.[0]?.immatriculation || null,
          // Copier les infos du chauffeur principal retour
          chauffeur_retour_nom: chauffeurRetourPrincipal?.nom || null,
          chauffeur_retour_tel: chauffeurRetourPrincipal?.tel || null,
          chauffeur_retour_immatriculation: vehiculesRetour?.[0]?.immatriculation || null,
        })
        .eq('dossier_id', dossierId)

      if (voyageError) throw voyageError

      // Mettre à jour le statut du dossier en "confirmed"
      await supabase
        .from('dossiers')
        .update({
          status: 'confirmed',
          updated_at: now,
        })
        .eq('id', dossierId)

      // Mettre à jour le statut de la demande
      await supabase
        .from('demandes_chauffeur')
        .update({
          status: 'received',
          received_at: now,
        })
        .eq('id', demandeChauffeurId)

      // Ajouter timeline
      await supabase.from('timeline').insert({
        dossier_id: dossierId,
        type: 'chauffeur_received',
        content: `✅ Informations chauffeur reçues du transporteur`,
      })

      return { dossierId, demandeChauffeurId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vehicules_trajet', data.dossierId] })
      queryClient.invalidateQueries({ queryKey: ['voyage_info', data.dossierId] })
      queryClient.invalidateQueries({ queryKey: ['demandes_chauffeur'] })
    },
  })
}

// ============ A/B TESTING - EXPERIMENTS ============

export interface ExperimentInsert {
  name: string
  description?: string
  target_page: string
  status?: string
  variant_control?: Record<string, unknown>
  variant_a?: Record<string, unknown>
  variant_b?: Record<string, unknown> | null
  traffic_control?: number
  traffic_variant_a?: number
  traffic_variant_b?: number
  primary_metric?: string
}

export interface ExperimentUpdate {
  id: string
  name?: string
  description?: string
  target_page?: string
  status?: string
  variant_control?: Record<string, unknown>
  variant_a?: Record<string, unknown>
  variant_b?: Record<string, unknown> | null
  traffic_control?: number
  traffic_variant_a?: number
  traffic_variant_b?: number
  primary_metric?: string
  started_at?: string | null
  ended_at?: string | null
}

// Hook pour récupérer toutes les expériences
// Note: Les tables experiments ne sont pas encore dans les types générés Supabase
export function useExperiments(statusFilter?: string) {
  return useQuery({
    queryKey: ['experiments', statusFilter],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from('experiments')
        .select('*')
        .order('created_at', { ascending: false })

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

// Hook pour récupérer une expérience par ID
export function useExperimentById(id: string | null) {
  return useQuery({
    queryKey: ['experiment', id],
    queryFn: async () => {
      if (!id) return null
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('experiments')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

// Hook pour créer une expérience
export function useCreateExperiment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (experiment: ExperimentInsert) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('experiments')
        .insert({
          name: experiment.name,
          description: experiment.description || null,
          target_page: experiment.target_page,
          status: experiment.status || 'draft',
          variant_control: experiment.variant_control || { name: 'Contrôle', config: {} },
          variant_a: experiment.variant_a || { name: 'Variante A', config: {} },
          variant_b: experiment.variant_b || null,
          traffic_control: experiment.traffic_control ?? 50,
          traffic_variant_a: experiment.traffic_variant_a ?? 50,
          traffic_variant_b: experiment.traffic_variant_b ?? 0,
          primary_metric: experiment.primary_metric || 'conversion',
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] })
    },
  })
}

// Hook pour mettre à jour une expérience
export function useUpdateExperiment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: ExperimentUpdate) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('experiments')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data: { id: string }) => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] })
      queryClient.invalidateQueries({ queryKey: ['experiment', data.id] })
    },
  })
}

// Hook pour supprimer une expérience
export function useDeleteExperiment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('experiments')
        .delete()
        .eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] })
    },
  })
}

// Hook pour activer une expérience
export function useActivateExperiment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('experiments')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data: { id: string }) => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] })
      queryClient.invalidateQueries({ queryKey: ['experiment', data.id] })
    },
  })
}

// Hook pour pauser une expérience
export function usePauseExperiment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('experiments')
        .update({
          status: 'paused',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data: { id: string }) => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] })
      queryClient.invalidateQueries({ queryKey: ['experiment', data.id] })
    },
  })
}

// Hook pour terminer une expérience
export function useCompleteExperiment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('experiments')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data: { id: string }) => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] })
      queryClient.invalidateQueries({ queryKey: ['experiment', data.id] })
    },
  })
}

// Hook pour récupérer les statistiques d'une expérience
export function useExperimentStats(experimentId: string | null) {
  return useQuery({
    queryKey: ['experiment_stats', experimentId],
    queryFn: async () => {
      if (!experimentId) return null

      // Récupérer les stats depuis la vue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: stats, error: statsError } = await (supabase as any)
        .from('experiment_stats')
        .select('*')
        .eq('experiment_id', experimentId)

      if (statsError) throw statsError

      // Récupérer les événements détaillés pour plus de métriques
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: events, error: eventsError } = await (supabase as any)
        .from('experiment_events')
        .select('event_type, event_value, created_at, assignment_id')
        .eq('experiment_id', experimentId)

      if (eventsError) throw eventsError

      return {
        byVariant: stats || [],
        events: events || [],
        totalEvents: events?.length || 0,
      }
    },
    enabled: !!experimentId,
    refetchInterval: 30000, // Refresh toutes les 30s
  })
}

// Hook pour récupérer les assignations d'une expérience
export function useExperimentAssignments(experimentId: string | null) {
  return useQuery({
    queryKey: ['experiment_assignments', experimentId],
    queryFn: async () => {
      if (!experimentId) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('experiment_assignments')
        .select('*')
        .eq('experiment_id', experimentId)
        .order('assigned_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return data || []
    },
    enabled: !!experimentId,
  })
}

// ============ NOTIFICATIONS CRM ============

export interface CreateNotificationCRM {
  dossier_id?: string
  dossier_reference?: string
  type: 'infos_voyage' | 'contact_chauffeur' | 'tarif_fournisseur' | 'refus_fournisseur'
  title: string
  description?: string
  source_type?: 'client' | 'transporteur' | 'system'
  source_name?: string
  source_id?: string
  metadata?: Record<string, any>
}

// Hook pour créer une notification CRM
export function useCreateNotificationCRM() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (notification: CreateNotificationCRM) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('notifications_crm')
        .insert(notification)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-crm'] })
    },
  })
}

// Hook pour récupérer les notifications CRM
export function useNotificationsCRM(filter?: { type?: string; unreadOnly?: boolean }) {
  return useQuery({
    queryKey: ['notifications-crm', filter],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from('notifications_crm')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (filter?.type) {
        query = query.eq('type', filter.type)
      }
      if (filter?.unreadOnly) {
        query = query.eq('is_read', false)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    refetchInterval: 30000,
  })
}

// Hook pour compter les notifications non lues
export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: ['notifications-crm-unread-count'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count, error } = await (supabase as any)
        .from('notifications_crm')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)

      if (error) throw error
      return count || 0
    },
    refetchInterval: 30000,
  })
}

// Hook pour marquer une notification comme lue
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (notificationId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('notifications_crm')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-crm'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-crm-unread-count'] })
    },
  })
}

// Fonction utilitaire pour créer une notification (utilisable hors React)
export async function createNotificationCRM(notification: CreateNotificationCRM) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('notifications_crm')
    .insert(notification)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============ COUNTRIES / PAYS ============

export interface Country {
  code: string
  name: string
  language: string
  currency: string
  currency_symbol: string
  vat_rate: number
  vat_label: string
  date_format: string
  timezone: string
  is_active: boolean
  phone: string | null
  phone_display: string | null
  email: string | null
  address: string | null
  city: string | null
  company_name: string | null
  siret: string | null
  tva_intra: string | null
  invoice_prefix: string | null
  invoice_next_number: number
  proforma_prefix: string | null
  proforma_next_number: number
  bank_name: string | null
  bank_iban: string | null
  bank_bic: string | null
  bank_beneficiary: string | null
  created_at: string
  updated_at: string
}

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('countries')
        .select('*')
        .order('code')

      if (error) throw error
      return data as Country[]
    },
  })
}

export function useCountry(code: string) {
  return useQuery({
    queryKey: ['country', code],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('countries')
        .select('*')
        .eq('code', code)
        .single()

      if (error) throw error
      return data as Country
    },
    enabled: !!code,
  })
}

export function useUpdateCountry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ code, updates }: { code: string; updates: Partial<Country> }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('countries')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('code', code)
        .select()
        .single()

      if (error) throw error
      return data as Country
    },
    onSuccess: (_, { code }) => {
      queryClient.invalidateQueries({ queryKey: ['countries'] })
      queryClient.invalidateQueries({ queryKey: ['country', code] })
    },
  })
}

// ============ COUNTRY CONTENT (CGV, mentions légales, etc.) ============

export interface CountryContent {
  id: string
  country_code: string
  content_type: string // 'cgv', 'mentions_legales', 'confidentialite', 'a_propos', 'devenir_partenaire'
  title: string | null
  content: string | null
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export function useCountryContent(countryCode: string, contentType: string) {
  return useQuery({
    queryKey: ['country-content', countryCode, contentType],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('country_content')
        .select('*')
        .eq('country_code', countryCode)
        .eq('content_type', contentType)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
      return data as CountryContent | null
    },
    enabled: !!countryCode && !!contentType,
  })
}

export function useAllCountryContent(countryCode: string) {
  return useQuery({
    queryKey: ['country-content-all', countryCode],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('country_content')
        .select('*')
        .eq('country_code', countryCode)
        .order('content_type')

      if (error) throw error
      return data as CountryContent[]
    },
    enabled: !!countryCode,
  })
}

export function useUpdateCountryContent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      countryCode,
      contentType,
      title,
      content
    }: {
      countryCode: string
      contentType: string
      title: string
      content: string
    }) => {
      // Upsert - insert or update
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('country_content')
        .upsert({
          country_code: countryCode,
          content_type: contentType,
          title,
          content,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'country_code,content_type'
        })
        .select()
        .single()

      if (error) throw error
      return data as CountryContent
    },
    onSuccess: (_, { countryCode, contentType }) => {
      queryClient.invalidateQueries({ queryKey: ['country-content', countryCode, contentType] })
      queryClient.invalidateQueries({ queryKey: ['country-content-all', countryCode] })
    },
  })
}
