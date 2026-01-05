import { useState, useEffect, useCallback } from 'react'
import { X, Send, Mail, User, FileText, Loader2, CheckCircle, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmailPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  to: string
  subject: string
  body: string
  onSend?: () => void | Promise<void>
}

export function EmailPreviewModal({
  isOpen,
  onClose,
  to: initialTo,
  subject: initialSubject,
  body: initialBody,
  onSend,
}: EmailPreviewModalProps) {
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // États éditables
  const [to, setTo] = useState(initialTo)
  const [subject, setSubject] = useState(initialSubject)
  const [body, setBody] = useState(initialBody)

  // Réinitialiser les valeurs quand les props changent
  useEffect(() => {
    setTo(initialTo)
    setSubject(initialSubject)
    setBody(initialBody)
    setIsEditing(false)
    setIsSent(false)
  }, [initialTo, initialSubject, initialBody])

  if (!isOpen) return null

  const handleSend = async () => {
    setIsSending(true)

    // Simuler un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Appeler le callback si fourni
    if (onSend) {
      await onSend()
    }

    setIsSending(false)
    setIsSent(true)

    // Fermer automatiquement après 2 secondes
    setTimeout(() => {
      setIsSent(false)
      onClose()
    }, 2000)
  }

  const handleClose = () => {
    if (!isSending) {
      setIsSent(false)
      setIsEditing(false)
      onClose()
    }
  }

  const toggleEdit = () => {
    setIsEditing(!isEditing)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-magenta-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-magenta to-purple flex items-center justify-center">
              <Mail size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-purple-dark">
                {isEditing ? 'Modifier l\'email' : 'Prévisualisation email'}
              </h3>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Modifiez le contenu si nécessaire' : 'Vérifiez le contenu avant l\'envoi'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isSent && (
              <button
                onClick={toggleEdit}
                disabled={isSending}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full transition-colors disabled:opacity-50",
                  isEditing
                    ? "bg-magenta text-white"
                    : "bg-white/80 hover:bg-white text-gray-600"
                )}
                title={isEditing ? "Terminer l'édition" : "Modifier l'email"}
              >
                <Pencil size={16} />
              </button>
            )}
            <button
              onClick={handleClose}
              disabled={isSending}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-colors disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isSent ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4 animate-bounce">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-green-700 mb-2">Email envoyé !</h4>
              <p className="text-gray-500">Le message a été envoyé avec succès à {to}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Destinataire */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <User size={18} className="text-gray-400 mt-2" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Destinataire</p>
                  {isEditing ? (
                    <input
                      type="email"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 focus:border-magenta"
                      placeholder="email@exemple.com"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">{to}</p>
                  )}
                </div>
              </div>

              {/* Objet */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText size={18} className="text-gray-400 mt-2" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Objet</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 focus:border-magenta"
                      placeholder="Objet de l'email"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">{subject}</p>
                  )}
                </div>
              </div>

              {/* Corps du message */}
              <div className="border border-gray-200 rounded-lg">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Message</p>
                </div>
                <div className="p-4 bg-white rounded-b-lg">
                  {isEditing ? (
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 focus:border-magenta min-h-[250px] font-sans text-sm text-gray-700 leading-relaxed resize-y"
                      placeholder="Contenu de l'email..."
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                      {body}
                    </pre>
                  )}
                </div>
              </div>

              {/* Signature Busmoov simulée */}
              <div className="p-3 bg-gradient-to-r from-purple-50 to-magenta-50 rounded-lg border border-purple-100">
                <p className="text-xs text-gray-500 mb-2">Signature automatique</p>
                <div className="flex items-center gap-2">
                  <img src="/logo-icon.svg" alt="Busmoov" className="w-6 h-6" />
                  <span className="font-semibold text-purple-dark">Busmoov</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">infos@busmoov.com | www.busmoov.com</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isSent && (
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <p className="text-xs text-gray-500">
              L'email sera envoyé depuis infos@busmoov.com
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                disabled={isSending}
                className="btn btn-secondary"
              >
                Annuler
              </button>
              {isEditing ? (
                <button
                  onClick={toggleEdit}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <CheckCircle size={18} />
                  Valider les modifications
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={isSending || !to}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {isSending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Envoyer
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Hook pour faciliter l'utilisation de la modal
interface EmailData {
  to: string
  subject: string
  body: string
}

export function useEmailPreview() {
  const [emailData, setEmailData] = useState<EmailData | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [onSendCallback, setOnSendCallback] = useState<(() => void | Promise<void>) | undefined>()

  const openEmailPreview = useCallback((data: EmailData, onSend?: () => void | Promise<void>) => {
    setEmailData(data)
    setOnSendCallback(() => onSend)
    setIsOpen(true)
  }, [])

  const closeEmailPreview = useCallback(() => {
    setIsOpen(false)
    setEmailData(null)
    setOnSendCallback(undefined)
  }, [])

  return {
    isOpen,
    emailData,
    onSendCallback,
    openEmailPreview,
    closeEmailPreview,
  }
}
