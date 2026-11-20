import { useEffect, useState } from 'react'
import { Euro, XCircle, CheckCircle, X } from 'lucide-react'
import { useLatestUnreadSupplierNotification, type SupplierNotification } from '@/hooks/useSupplierNotifications'
import { useNotificationSound } from '@/hooks/useNotifications'

interface Props {
  /** Ouvre la fiche du dossier concerné. */
  onOpen: (dossierId: string) => void
}

const AUTO_HIDE_MS = 15000

/** Pop-up global de l'admin : tarif reçu, refus ou BPA validé d'un transporteur, quelle que soit la page. */
export function NewSupplierTarifToast({ onOpen }: Props) {
  const { data: latest } = useLatestUnreadSupplierNotification()
  const [toast, setToast] = useState<SupplierNotification | null>(null)
  // undefined = pas encore chargé ; null = rien de non lu au premier chargement
  const [seenId, setSeenId] = useState<string | null | undefined>(undefined)
  const playSound = useNotificationSound()

  // Ajustement d'état pendant le rendu (même pattern que NewMessageToast)
  if (latest !== undefined) {
    if (seenId === undefined) {
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

  const isRefus = toast.type === 'refus_fournisseur'
  const isBpa = toast.type === 'bpa_valide'

  return (
    <div
      className={`fixed top-6 right-6 z-[60] w-96 max-w-[calc(100vw-3rem)] bg-white rounded-xl shadow-2xl border animate-fadeIn ${
        isRefus ? 'border-red-300' : isBpa ? 'border-blue-300' : 'border-emerald-300'
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            isRefus ? 'bg-red-100 text-red-700' : isBpa ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {isRefus ? <XCircle size={20} /> : isBpa ? <CheckCircle size={20} /> : <Euro size={20} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-purple-dark">
            {toast.title}
            {toast.pendingTotal > 1 && (
              <span className="ml-2 text-xs font-medium text-gray-500">({toast.pendingTotal} réponses non lues)</span>
            )}
          </p>
          {toast.dossier_reference && <p className="text-xs text-gray-500">{toast.dossier_reference}</p>}
          {toast.description && <p className="text-sm text-gray-700 mt-1 line-clamp-3">{toast.description}</p>}
          <button
            onClick={() => {
              setToast(null)
              onOpen(toast.dossier_id)
            }}
            className="mt-2 text-sm font-medium text-magenta hover:underline"
          >
            {isRefus || isBpa ? 'Ouvrir le dossier →' : 'Ouvrir et valider la commande →'}
          </button>
        </div>
        <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600" title="Fermer">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
