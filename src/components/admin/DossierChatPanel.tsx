import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { recipientLabel, useDossierConversations } from '@/hooks/useChatAdmin'
import { ChatConversationView, ChatRecipientAvatar, ChatRecipientHint, ChatStatusBadge } from './ChatConversationView'

interface Props {
  dossier: { id: string; reference: string; client_name: string; client_email: string }
}

/** Bloc « Échanges chat » de la fiche dossier : conversations du client (Busmoov / fournisseurs simulés) avec réponse en place. */
export function DossierChatPanel({ dossier }: Props) {
  const { data: conversations = [], isLoading } = useDossierConversations(dossier.id, dossier)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  if (isLoading || conversations.length === 0) return null

  const selected = conversations.find((c) => c.key === selectedKey) || conversations[0]
  const pending = conversations.filter((c) => c.status === 'a_traiter').length

  return (
    <div className="card p-6">
      <h2 className="font-display text-lg font-semibold text-purple-dark mb-1 flex items-center gap-2">
        <MessageCircle size={20} className="text-magenta" />
        Échanges chat
        {pending > 0 && (
          <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{pending} à traiter</span>
        )}
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Messages envoyés par le client depuis son espace. Chaque réponse est tracée dans l'historique ci-dessous.
      </p>

      {conversations.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {conversations.map((conv) => (
            <button
              key={conv.key}
              onClick={() => setSelectedKey(conv.key)}
              className={cn(
                'flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border text-sm',
                selected.key === conv.key ? 'border-magenta bg-magenta/5 text-purple-dark' : 'border-gray-200 text-gray-600 hover:bg-gray-50',
              )}
            >
              <ChatRecipientAvatar conv={conv} size="sm" />
              {recipientLabel(conv)}
              <ChatStatusBadge status={conv.status} />
            </button>
          ))}
        </div>
      )}

      <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-3 text-sm">
          <ChatRecipientAvatar conv={selected} size="sm" />
          <div className="min-w-0 flex-1">
            <span className="font-medium text-purple-dark">{recipientLabel(selected)}</span>
            <span className="text-xs text-gray-500 ml-2"><ChatRecipientHint conv={selected} /></span>
          </div>
          <ChatStatusBadge status={selected.status} />
        </div>
        <ChatConversationView key={selected.key} conversation={selected} messagesClassName="max-h-80" compact />
      </div>
    </div>
  )
}
