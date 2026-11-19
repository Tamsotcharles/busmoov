import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle, Search, RefreshCw, ExternalLink, Building2, Inbox } from 'lucide-react'
import { formatDateTime, cn } from '@/lib/utils'
import { useChatNotifications, useNotificationPermission } from '@/hooks/useNotifications'
import { recipientLabel, useAllConversations, type ChatConversation } from '@/hooks/useChatAdmin'
import { ChatConversationView, ChatRecipientAvatar, ChatRecipientHint, ChatStatusBadge } from './ChatConversationView'

type Filter = 'a_traiter' | 'toutes'

interface Props {
  /** Dossier à ouvrir en arrivant (pop-up « nouveau message », lien depuis un dossier). */
  focusDossierId?: string | null
  /** Ouvre la fiche dossier dans l'admin (même onglet). À défaut, ouverture dans un nouvel onglet. */
  onOpenDossier?: (dossierId: string) => void
}

export function MessagesPage({ focusDossierId, onOpenDossier }: Props) {
  const { data: conversations = [], isLoading, refetch, isFetching } = useAllConversations()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('a_traiter')
  const [searchQuery, setSearchQuery] = useState('')
  const previousPendingRef = useRef<number | null>(null)

  useNotificationPermission()
  const { notifyNewMessage } = useChatNotifications()

  const pendingConvs = useMemo(() => conversations.filter((c) => c.status === 'a_traiter'), [conversations])
  const pendingMessages = pendingConvs.reduce((sum, c) => sum + c.pendingCount, 0)

  // Son + notification navigateur quand le nombre de messages à traiter augmente
  useEffect(() => {
    if (isLoading) return
    const prev = previousPendingRef.current
    if (prev !== null && pendingMessages > prev) {
      const conv = pendingConvs[0]
      const last = conv?.messages.filter((m) => m.sender === 'client' && !m.read_by_admin).slice(-1)[0]
      if (conv && last) notifyNewMessage(conv.clientName || 'Client', last.content, conv.dossierId)
    }
    previousPendingRef.current = pendingMessages
  }, [pendingMessages, isLoading, pendingConvs, notifyNewMessage])

  // Ouverture ciblée (depuis le pop-up ou un dossier) : appliquée une fois par dossier demandé
  const [appliedFocus, setAppliedFocus] = useState<string | null>(null)
  if (focusDossierId && appliedFocus !== focusDossierId && conversations.length > 0) {
    setAppliedFocus(focusDossierId)
    const target =
      conversations.find((c) => c.dossierId === focusDossierId && c.status === 'a_traiter') ||
      conversations.find((c) => c.dossierId === focusDossierId)
    if (target) {
      setSelectedKey(target.key)
      if (target.status !== 'a_traiter') setFilter('toutes')
    }
  }

  const selected = conversations.find((c) => c.key === selectedKey) || null

  const openDossier = (dossierId: string) => {
    if (onOpenDossier) onOpenDossier(dossierId)
    else window.open(`/admin?dossierId=${dossierId}`, '_blank', 'noopener')
  }

  const filtered = useMemo(() => {
    let list = filter === 'a_traiter' ? pendingConvs : conversations
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (c) =>
          c.dossierRef.toLowerCase().includes(q) ||
          (c.clientName || '').toLowerCase().includes(q) ||
          (c.clientEmail || '').toLowerCase().includes(q) ||
          (c.transporteurName || '').toLowerCase().includes(q),
      )
    }
    return list
  }, [conversations, pendingConvs, filter, searchQuery])

  // Regrouper visuellement par dossier (ordre conservé)
  const groups = useMemo(() => {
    const out: { dossierId: string; dossierRef: string; clientName: string; convs: ChatConversation[] }[] = []
    for (const c of filtered) {
      let g = out.find((x) => x.dossierId === c.dossierId)
      if (!g) {
        g = { dossierId: c.dossierId, dossierRef: c.dossierRef, clientName: c.clientName, convs: [] }
        out.push(g)
      }
      g.convs.push(c)
    }
    return out
  }, [filtered])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-magenta border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement des messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-purple-dark flex items-center gap-2">
            <MessageCircle className="text-magenta" />
            Chat clients
            {pendingConvs.length > 0 && (
              <span className="bg-amber-500 text-white text-sm px-2 py-0.5 rounded-full">
                {pendingConvs.length} à traiter
              </span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Le client écrit soit à <strong>Busmoov</strong> (chat général), soit à un <strong>Fournisseur n°X</strong> :
            c'est l'équipe qui répond sous ce nom. Une conversation reste « à traiter » tant qu'on n'a pas répondu ou cliqué « Marquer comme traité ».
          </p>
        </div>
        <button onClick={() => refetch()} className="btn btn-secondary btn-sm flex items-center gap-2" disabled={isFetching}>
          <RefreshCw size={16} className={cn(isFetching && 'animate-spin')} />
          Actualiser
        </button>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Liste des conversations */}
        <div className="w-[26rem] flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-3 border-b border-gray-200 space-y-2">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFilter('a_traiter')}
                className={cn('flex-1 text-sm py-1.5 rounded-md font-medium', filter === 'a_traiter' ? 'bg-white shadow text-purple-dark' : 'text-gray-500')}
              >
                À traiter ({pendingConvs.length})
              </button>
              <button
                onClick={() => setFilter('toutes')}
                className={cn('flex-1 text-sm py-1.5 rounded-md font-medium', filter === 'toutes' ? 'bg-white shadow text-purple-dark' : 'text-gray-500')}
              >
                Toutes ({conversations.length})
              </button>
            </div>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Dossier, client, transporteur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-magenta"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {groups.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Inbox size={40} className="mx-auto mb-2 opacity-30" />
                <p>{filter === 'a_traiter' ? 'Rien à traiter 🎉' : 'Aucune conversation'}</p>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.dossierId} className="border-b border-gray-100">
                  <button
                    type="button"
                    onClick={() => openDossier(group.dossierId)}
                    className="w-full px-4 py-2 bg-gray-50 hover:bg-purple-50 flex items-center justify-between gap-2 text-left group"
                    title="Ouvrir la fiche dossier"
                  >
                    <span className="font-semibold text-sm text-purple-dark group-hover:text-magenta underline decoration-dotted underline-offset-2 flex items-center gap-1">
                      {group.dossierRef}
                      <ExternalLink size={12} />
                    </span>
                    <span className="text-xs text-gray-500 truncate">{group.clientName}</span>
                  </button>

                  {group.convs.map((conv) => (
                    <button
                      key={conv.key}
                      onClick={() => setSelectedKey(conv.key)}
                      className={cn(
                        'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3',
                        selectedKey === conv.key && 'bg-magenta/5 border-l-4 border-magenta',
                      )}
                    >
                      <ChatRecipientAvatar conv={conv} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm text-purple-dark truncate">{recipientLabel(conv)}</span>
                          <ChatStatusBadge status={conv.status} />
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-0.5">
                          <span className="text-gray-400">{conv.lastMessage?.sender === 'admin' ? 'Vous : ' : 'Client : '}</span>
                          {conv.lastMessage?.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center justify-between gap-2">
                          <ChatRecipientHint conv={conv} className="truncate" />
                          <span className="flex-shrink-0">{formatDateTime(conv.lastMessage?.created_at)}</span>
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Zone de chat */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
          {selected ? (
            <>
              <div className="gradient-bg text-white p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold">
                  {selected.recipient === 'busmoov' ? <Building2 size={22} /> : `#${selected.supplierNum ?? '?'}`}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold flex items-center gap-2">
                    {recipientLabel(selected)}
                    <ChatStatusBadge status={selected.status} className="bg-white/90" />
                  </h3>
                  <p className="text-sm text-white/80 truncate">
                    <button type="button" onClick={() => openDossier(selected.dossierId)} className="underline hover:text-white inline-flex items-center gap-1" title="Ouvrir la fiche dossier">
                      {selected.dossierRef}
                      <ExternalLink size={12} />
                    </button>
                    {' · '}{selected.clientName}{selected.clientEmail ? ` · ${selected.clientEmail}` : ''}
                  </p>
                  <p className="text-xs text-white/70 mt-0.5">
                    <ChatRecipientHint conv={selected} />
                  </p>
                </div>
              </div>
              <ChatConversationView key={selected.key} conversation={selected} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageCircle size={64} className="mx-auto mb-4 opacity-30" />
                <h3 className="font-semibold text-lg text-gray-600 mb-2">Sélectionnez une conversation</h3>
                <p className="text-sm">
                  {pendingConvs.length > 0
                    ? `${pendingConvs.length} conversation${pendingConvs.length > 1 ? 's' : ''} en attente de réponse`
                    : 'Toutes les conversations sont traitées'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
