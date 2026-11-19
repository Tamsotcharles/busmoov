import { useEffect, useRef, useState } from 'react'
import { Send, Check, CheckCheck, Truck, Building2 } from 'lucide-react'
import { cn, formatDateTime, formatPrice } from '@/lib/utils'
import {
  recipientLabel,
  statusLabel,
  useAdminReply,
  useMarkConversationHandled,
  type ChatConversation,
} from '@/hooks/useChatAdmin'

export function ChatStatusBadge({ status, className }: { status: ChatConversation['status']; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap',
        status === 'a_traiter' && 'bg-amber-100 text-amber-800',
        status === 'repondu' && 'bg-green-100 text-green-700',
        status === 'traite' && 'bg-gray-100 text-gray-600',
        className,
      )}
    >
      {statusLabel(status)}
    </span>
  )
}

/** Pastille destinataire : Busmoov (bleu) ou fournisseur simulé (magenta). */
export function ChatRecipientAvatar({ conv, size = 'md' }: { conv: ChatConversation; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  if (conv.recipient === 'busmoov') {
    return (
      <div className={cn(dim, 'rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0')} title="Le client écrit à Busmoov directement">
        <Building2 size={size === 'sm' ? 14 : 18} />
      </div>
    )
  }
  return (
    <div className={cn(dim, 'rounded-full gradient-bg text-white font-bold flex items-center justify-center flex-shrink-0')} title="Le client croit écrire au transporteur">
      #{conv.supplierNum ?? '?'}
    </div>
  )
}

export function ChatRecipientHint({ conv, className }: { conv: ChatConversation; className?: string }) {
  if (conv.recipient === 'busmoov') {
    return <span className={className}>Le client s'adresse à Busmoov directement</span>
  }
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      Le client croit parler au transporteur
      {conv.transporteurName && (
        <>
          <span>·</span>
          <Truck size={12} />
          {conv.transporteurName}
        </>
      )}
      {conv.devisPriceTtc != null && <span>· devis {formatPrice(conv.devisPriceTtc)}</span>}
    </span>
  )
}

interface Props {
  conversation: ChatConversation
  /** Hauteur de la zone de messages (classe Tailwind). */
  messagesClassName?: string
  compact?: boolean
}

/** Fil de messages + zone de réponse + bouton « Traité ». Partagé entre la page Messages et la fiche dossier. */
export function ChatConversationView({ conversation, messagesClassName, compact = false }: Props) {
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const reply = useAdminReply()
  const markHandled = useMarkConversationHandled()

  // Faire défiler le fil jusqu'au dernier message, sans déplacer la page
  // (scrollIntoView ferait sauter la fiche dossier jusqu'au bloc chat à l'ouverture).
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [conversation.messages.length, conversation.key])

  const send = async () => {
    if (!draft.trim() || reply.isPending) return
    try {
      await reply.mutateAsync({ conversation, content: draft })
      setDraft('')
    } catch (err) {
      console.error('Erreur envoi message chat:', err)
      alert("Erreur lors de l'envoi du message")
    }
  }

  const asWho = conversation.recipient === 'busmoov' ? "l'équipe Busmoov" : recipientLabel(conversation)

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div ref={listRef} className={cn('flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50', messagesClassName)}>
        {conversation.messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-6">Aucun message</p>
        ) : (
          conversation.messages.map((msg) => {
            const isAdmin = msg.sender === 'admin'
            const pending = msg.sender === 'client' && !msg.read_by_admin
            return (
              <div
                key={msg.id}
                className={cn(
                  'max-w-[80%] p-3 rounded-xl text-sm',
                  isAdmin
                    ? 'ml-auto gradient-bg text-white rounded-br-sm'
                    : 'bg-white border rounded-bl-sm shadow-sm',
                  !isAdmin && (pending ? 'border-amber-300' : 'border-gray-200'),
                )}
              >
                <p className={cn('text-[11px] font-semibold mb-1', isAdmin ? 'text-white/80' : 'text-purple-dark')}>
                  {isAdmin ? `Busmoov (en tant que ${recipientLabel(conversation)})` : `Client · ${conversation.clientName}`}
                </p>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <div className={cn('flex items-center gap-2 mt-1 text-[11px]', isAdmin ? 'text-white/70 justify-end' : 'text-gray-400')}>
                  <span>{formatDateTime(msg.created_at)}</span>
                  {isAdmin && (msg.read_by_client ? <CheckCheck size={12} /> : <Check size={12} />)}
                  {pending && <span className="text-amber-600 font-semibold">non traité</span>}
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className={cn('border-t border-gray-200 bg-white', compact ? 'p-3' : 'p-4')}>
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder={`Répondre en tant que ${asWho}…`}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-magenta resize-none"
            rows={compact ? 1 : 2}
          />
          <button
            onClick={send}
            disabled={!draft.trim() || reply.isPending}
            className="w-11 h-11 gradient-bg text-white rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-50"
            title="Envoyer (Entrée)"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 gap-2">
          <p className="text-xs text-gray-400">
            {conversation.recipient === 'busmoov'
              ? "Le client verra la réponse signée Busmoov"
              : `Le client verra la réponse comme venant du ${recipientLabel(conversation)}`}
          </p>
          {conversation.status === 'a_traiter' && (
            <button
              onClick={() => markHandled.mutate(conversation)}
              disabled={markHandled.isPending}
              className="text-xs font-medium text-gray-600 hover:text-purple-dark border border-gray-300 rounded-lg px-2 py-1 flex items-center gap-1 disabled:opacity-50"
              title="Clore sans répondre (ex. le client a juste remercié)"
            >
              <Check size={12} />
              Marquer comme traité
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
