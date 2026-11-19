// Hooks admin pour le chat client (page Messages + bloc « Échanges chat » du dossier).
//
// Vocabulaire :
// - une conversation = un dossier + un destinataire. Le destinataire est soit
//   Busmoov directement (devis_id null, chat général), soit un « Fournisseur n°X »
//   simulé (devis_id renseigné : le client croit écrire au transporteur, c'est
//   l'équipe qui répond sous ce nom).
// - « à traiter » = au moins un message client non lu par l'admin
//   (read_by_admin = false). Une conversation passe en « traité » quand on y
//   répond ou quand on clique « Marquer comme traité » ; ouvrir la conversation
//   ne suffit pas, pour que la liste montre ce qui reste réellement à faire.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Message } from '@/types/database'

export type ChatRecipient = 'busmoov' | 'fournisseur'

export interface ChatConversation {
  key: string
  dossierId: string
  dossierRef: string
  clientName: string
  clientEmail: string
  devisId: string | null
  recipient: ChatRecipient
  /** Numéro du fournisseur tel que le client le voit (ordre de création des devis). */
  supplierNum: number | null
  transporteurName: string | null
  devisPriceTtc: number | null
  messages: Message[]
  lastMessage: Message | null
  /** Messages client non lus par l'admin. */
  pendingCount: number
  /** 'a_traiter' : message client sans réponse ; 'repondu' : dernier message = admin ; 'traite' : marqué traité sans réponse. */
  status: 'a_traiter' | 'repondu' | 'traite'
}

export interface ChatDevisInfo {
  id: string
  dossier_id: string | null
  created_at: string | null
  price_ttc: number | null
  transporteurName: string | null
}

interface DossierInfo {
  id: string
  reference: string
  client_name: string
  client_email: string
}

export function recipientLabel(conv: Pick<ChatConversation, 'recipient' | 'supplierNum'>): string {
  if (conv.recipient === 'busmoov') return 'Busmoov (chat général)'
  return conv.supplierNum ? `Fournisseur n°${conv.supplierNum}` : 'Fournisseur'
}

export function statusLabel(status: ChatConversation['status']): string {
  if (status === 'a_traiter') return 'À traiter'
  if (status === 'repondu') return 'Répondu'
  return 'Traité'
}

/** Regroupe des messages en conversations (dossier + destinataire). */
export function buildConversations(
  messages: Message[],
  dossiers: Record<string, DossierInfo>,
  devisList: ChatDevisInfo[],
): ChatConversation[] {
  // Numérotation des fournisseurs : ordre de création des devis du dossier,
  // identique à l'ordre d'affichage côté client (get-client-data).
  const devisByDossier = new Map<string, ChatDevisInfo[]>()
  for (const d of devisList) {
    if (!d.dossier_id) continue
    const list = devisByDossier.get(d.dossier_id) || []
    list.push(d)
    devisByDossier.set(d.dossier_id, list)
  }
  for (const list of devisByDossier.values()) {
    list.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))
  }
  const devisById = new Map(devisList.map((d) => [d.id, d]))

  const map = new Map<string, ChatConversation>()
  for (const msg of messages) {
    if (!msg.dossier_id) continue
    const dossier = dossiers[msg.dossier_id]
    if (!dossier) continue
    const key = `${msg.dossier_id}:${msg.devis_id || 'busmoov'}`
    let conv = map.get(key)
    if (!conv) {
      const devis = msg.devis_id ? devisById.get(msg.devis_id) : undefined
      const order = devisByDossier.get(msg.dossier_id) || []
      const index = msg.devis_id ? order.findIndex((d) => d.id === msg.devis_id) : -1
      conv = {
        key,
        dossierId: msg.dossier_id,
        dossierRef: dossier.reference,
        clientName: dossier.client_name,
        clientEmail: dossier.client_email,
        devisId: msg.devis_id || null,
        recipient: msg.devis_id ? 'fournisseur' : 'busmoov',
        supplierNum: index >= 0 ? index + 1 : null,
        transporteurName: devis?.transporteurName || null,
        devisPriceTtc: devis?.price_ttc ?? null,
        messages: [],
        lastMessage: null,
        pendingCount: 0,
        status: 'traite',
      }
      map.set(key, conv)
    }
    conv.messages.push(msg)
  }

  const convs = Array.from(map.values())
  for (const conv of convs) {
    conv.messages.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))
    conv.lastMessage = conv.messages[conv.messages.length - 1] || null
    conv.pendingCount = conv.messages.filter((m) => m.sender === 'client' && !m.read_by_admin).length
    if (conv.pendingCount > 0) conv.status = 'a_traiter'
    else if (conv.lastMessage?.sender === 'admin') conv.status = 'repondu'
    else conv.status = 'traite'
  }
  convs.sort((a, b) => {
    if ((a.status === 'a_traiter') !== (b.status === 'a_traiter')) return a.status === 'a_traiter' ? -1 : 1
    return (b.lastMessage?.created_at || '').localeCompare(a.lastMessage?.created_at || '')
  })
  return convs
}

const DEVIS_SELECT = 'id, dossier_id, created_at, price_ttc, transporteur:transporteurs(name)'

interface DevisRow {
  id: string
  dossier_id: string | null
  created_at: string | null
  price_ttc: number | null
  transporteur: { name: string | null } | { name: string | null }[] | null
}

function mapDevis(rows: DevisRow[] | null): ChatDevisInfo[] {
  return (rows || []).map((d) => ({
    id: d.id,
    dossier_id: d.dossier_id,
    created_at: d.created_at,
    price_ttc: d.price_ttc,
    transporteurName: (Array.isArray(d.transporteur) ? d.transporteur[0]?.name : d.transporteur?.name) || null,
  }))
}

/** Toutes les conversations (page Messages). */
export function useAllConversations() {
  return useQuery({
    queryKey: ['chat-conversations'],
    queryFn: async (): Promise<ChatConversation[]> => {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      const msgs = (messages || []) as Message[]
      const dossierIds = Array.from(new Set(msgs.map((m) => m.dossier_id).filter(Boolean))) as string[]
      if (dossierIds.length === 0) return []

      const [{ data: dossiers, error: dErr }, { data: devis, error: vErr }] = await Promise.all([
        supabase.from('dossiers').select('id, reference, client_name, client_email').in('id', dossierIds),
        supabase.from('devis').select(DEVIS_SELECT).in('dossier_id', dossierIds),
      ])
      if (dErr) throw dErr
      if (vErr) throw vErr
      const dossierMap: Record<string, DossierInfo> = {}
      for (const d of (dossiers || []) as DossierInfo[]) dossierMap[d.id] = d
      return buildConversations(msgs, dossierMap, mapDevis(devis as unknown as DevisRow[]))
    },
    refetchInterval: 10000,
  })
}

/** Conversations d'un seul dossier (fiche dossier). */
export function useDossierConversations(dossierId: string, dossier: { reference: string; client_name: string; client_email: string } | null) {
  return useQuery({
    queryKey: ['chat-conversations', dossierId],
    queryFn: async (): Promise<ChatConversation[]> => {
      const [{ data: messages, error }, { data: devis, error: vErr }] = await Promise.all([
        supabase.from('messages').select('*').eq('dossier_id', dossierId).order('created_at', { ascending: true }),
        supabase.from('devis').select(DEVIS_SELECT).eq('dossier_id', dossierId),
      ])
      if (error) throw error
      if (vErr) throw vErr
      if (!dossier) return []
      return buildConversations(
        (messages || []) as Message[],
        { [dossierId]: { id: dossierId, ...dossier } },
        mapDevis(devis as unknown as DevisRow[]),
      )
    },
    enabled: !!dossierId && !!dossier,
    refetchInterval: 10000,
  })
}

function invalidateChat(queryClient: ReturnType<typeof useQueryClient>, dossierId: string) {
  queryClient.invalidateQueries({ queryKey: ['chat-conversations'] })
  queryClient.invalidateQueries({ queryKey: ['messages', dossierId] })
  queryClient.invalidateQueries({ queryKey: ['messages-unread-count'] })
  queryClient.invalidateQueries({ queryKey: ['timeline', dossierId] })
}

async function markClientMessagesRead(conv: ChatConversation) {
  const ids = conv.messages.filter((m) => m.sender === 'client' && !m.read_by_admin).map((m) => m.id)
  if (ids.length === 0) return
  const { error } = await supabase.from('messages').update({ read_by_admin: true }).in('id', ids)
  if (error) throw error
}

/** Réponse de l'équipe (au nom de Busmoov ou du fournisseur simulé). Marque la conversation traitée et trace l'échange dans l'historique du dossier. */
export function useAdminReply() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ conversation, content }: { conversation: ChatConversation; content: string }) => {
      const text = content.trim()
      if (!text) throw new Error('Message vide')
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: text,
          sender: 'admin',
          dossier_id: conversation.dossierId,
          devis_id: conversation.devisId,
          read_by_admin: true,
          read_by_client: false,
        })
        .select()
        .single()
      if (error) throw error

      await markClientMessagesRead(conversation)

      const asWho = conversation.recipient === 'busmoov'
        ? 'Busmoov'
        : `Fournisseur n°${conversation.supplierNum ?? '?'}`
      const excerpt = text.length > 160 ? `${text.substring(0, 160)}…` : text
      await supabase.from('timeline').insert({
        dossier_id: conversation.dossierId,
        type: 'message',
        content: `💬 Chat · réponse au client en tant que ${asWho} : « ${excerpt} »`,
      })
      return data as Message
    },
    onSuccess: (_data, vars) => invalidateChat(queryClient, vars.conversation.dossierId),
  })
}

/** « Marquer comme traité » sans répondre (ex. le client a juste dit merci). */
export function useMarkConversationHandled() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (conversation: ChatConversation) => {
      await markClientMessagesRead(conversation)
      await supabase.from('timeline').insert({
        dossier_id: conversation.dossierId,
        type: 'message',
        content: `💬 Chat · conversation « ${recipientLabel(conversation)} » marquée comme traitée`,
      })
    },
    onSuccess: (_data, conv) => invalidateChat(queryClient, conv.dossierId),
  })
}

export interface LatestUnreadMessage {
  id: string
  content: string
  created_at: string | null
  dossier_id: string
  devis_id: string | null
  reference: string
  client_name: string
  pendingTotal: number
}

/** Dernier message client non traité (pour le pop-up global de l'admin). */
export function useLatestUnreadClientMessage() {
  return useQuery({
    queryKey: ['messages-latest-unread'],
    queryFn: async (): Promise<LatestUnreadMessage | null> => {
      const { data, error, count } = await supabase
        .from('messages')
        .select('id, content, created_at, dossier_id, devis_id, dossier:dossiers!messages_dossier_id_fkey(reference, client_name)', { count: 'exact' })
        .eq('sender', 'client')
        .eq('read_by_admin', false)
        .order('created_at', { ascending: false })
        .limit(1)
      if (error) throw error
      const row = data?.[0] as
        | { id: string; content: string; created_at: string | null; dossier_id: string | null; devis_id: string | null; dossier: { reference: string; client_name: string } | { reference: string; client_name: string }[] | null }
        | undefined
      if (!row || !row.dossier_id) return null
      const dossier = Array.isArray(row.dossier) ? row.dossier[0] : row.dossier
      return {
        id: row.id,
        content: row.content,
        created_at: row.created_at,
        dossier_id: row.dossier_id,
        devis_id: row.devis_id,
        reference: dossier?.reference || '',
        client_name: dossier?.client_name || 'Client',
        pendingTotal: count || 0,
      }
    },
    refetchInterval: 15000,
  })
}
