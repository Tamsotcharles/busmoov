import { useEffect, useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { useLatestUnreadClientMessage, type LatestUnreadMessage } from '@/hooks/useChatAdmin'
import { useNotificationSound } from '@/hooks/useNotifications'

interface Props {
  /** Ouvre la page Messages sur le dossier concerné. */
  onOpen: (dossierId: string) => void
}

const AUTO_HIDE_MS = 12000

/** Pop-up global de l'admin : s'affiche dès qu'un nouveau message client non traité arrive, quelle que soit la page. */
export function NewMessageToast({ onOpen }: Props) {
  const { data: latest } = useLatestUnreadClientMessage()
  const [toast, setToast] = useState<LatestUnreadMessage | null>(null)
  // undefined = pas encore chargé ; null = aucun message non traité au premier chargement
  const [seenId, setSeenId] = useState<string | null | undefined>(undefined)
  const playSound = useNotificationSound()

  // Ajustement d'état pendant le rendu (pattern React « adjusting state on prop change »)
  if (latest !== undefined) {
    if (seenId === undefined) {
      // Premier chargement : on mémorise sans alerter (les anciens non traités sont déjà dans le badge du menu)
      setSeenId(latest?.id ?? null)
    } else if (latest && latest.id !== seenId) {
      setSeenId(latest.id)
      setToast(latest)
    }
  }

  useEffect(() => {
    if (toast) playSound()
  }, [toast, playSound])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), AUTO_HIDE_MS)
    return () => clearTimeout(t)
  }, [toast])

  if (!toast) return null

  const excerpt = toast.content.length > 120 ? `${toast.content.substring(0, 120)}…` : toast.content

  return (
    <div className="fixed top-6 right-6 z-[60] w-96 max-w-[calc(100vw-3rem)] bg-white rounded-xl shadow-2xl border border-amber-300 animate-fadeIn">
      <div className="flex items-start gap-3 p-4">
        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
          <MessageCircle size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-purple-dark">
            Nouveau message de {toast.client_name}
            {toast.pendingTotal > 1 && (
              <span className="ml-2 text-xs font-medium text-amber-700">({toast.pendingTotal} à traiter)</span>
            )}
          </p>
          <p className="text-xs text-gray-500">
            {toast.reference} · {toast.devis_id ? 'au fournisseur (simulé)' : 'à Busmoov'}
          </p>
          <p className="text-sm text-gray-700 mt-1 line-clamp-3">« {excerpt} »</p>
          <button
            onClick={() => {
              setToast(null)
              onOpen(toast.dossier_id)
            }}
            className="mt-2 text-sm font-medium text-magenta hover:underline"
          >
            Ouvrir et répondre →
          </button>
        </div>
        <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600" title="Fermer">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
