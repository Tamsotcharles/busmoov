import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Mail, RefreshCw, CheckCircle, Clock, AlertCircle, Send, Eye, XCircle, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface EmailLog {
  id: string
  resend_id: string
  dossier_id: string | null
  recipient: string
  sender: string
  subject: string
  template_key: string | null
  status: string
  sent_at: string | null
  delivered_at: string | null
  opened_at: string | null
  clicked_at: string | null
  bounced_at: string | null
  complained_at: string | null
  created_at: string
  html_content: string | null
  dossiers?: {
    reference: string
  } | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  sent: { label: 'Envoyé', color: 'bg-blue-100 text-blue-800', icon: Send },
  delivered: { label: 'Délivré', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  opened: { label: 'Ouvert', color: 'bg-purple-100 text-purple-800', icon: Eye },
  clicked: { label: 'Cliqué', color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle },
  bounced: { label: 'Rebondi', color: 'bg-red-100 text-red-800', icon: XCircle },
  complained: { label: 'Spam', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  delivery_delayed: { label: 'Retardé', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
}

const TEMPLATE_LABELS: { [key: string]: string } = {
  quote_sent: 'Devis envoyé',
  offre_flash: 'Offre flash',
  payment_reminder: 'Rappel acompte',
  rappel_solde: 'Rappel solde',
  confirmation_reservation: 'Confirmation résa',
  confirmation_paiement: 'Confirmation paiement',
  info_request: 'Demande infos',
  driver_info: 'Infos chauffeur',
  review_request: 'Demande avis',
  demande_chauffeur: 'Demande chauffeur',
  demande_fournisseur: 'Confirmation fournisseur',
  demande_prix_fournisseur: 'Demande prix',
  demande_tarif_fournisseur: 'Demande tarif',
  custom: 'Email manuel',
}

export function EmailHistoryPage() {
  const [emails, setEmails] = useState<EmailLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [previewEmail, setPreviewEmail] = useState<EmailLog | null>(null)

  const loadEmails = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Cast nécessaire car les types ne sont pas encore générés pour email_logs
      const { data, error: dbError } = await (supabase
        .from('email_logs' as any)
        .select(`
          *,
          dossiers (reference)
        `)
        .order('created_at', { ascending: false })
        .limit(100) as any)

      if (dbError) throw dbError

      setEmails((data as EmailLog[]) || [])
    } catch (err) {
      console.error('Erreur chargement emails:', err)
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEmails()
  }, [])

  const filteredEmails = emails.filter(email => {
    if (filter === 'all') return true
    return email.status === filter
  })

  const stats = {
    total: emails.length,
    sent: emails.filter(e => e.status === 'sent').length,
    delivered: emails.filter(e => e.status === 'delivered').length,
    opened: emails.filter(e => e.status === 'opened').length,
    bounced: emails.filter(e => e.status === 'bounced' || e.status === 'complained').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-magenta/10 rounded-lg">
            <Mail className="h-6 w-6 text-magenta" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Historique des emails</h1>
            <p className="text-gray-500">Emails envoyés via le CRM</p>
          </div>
        </div>
        <button
          onClick={loadEmails}
          disabled={isLoading}
          className="btn btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Mail className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Send className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.sent}</p>
              <p className="text-sm text-gray-500">Envoyés</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
              <p className="text-sm text-gray-500">Délivrés</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Eye className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.opened}</p>
              <p className="text-sm text-gray-500">Ouverts</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.bounced}</p>
              <p className="text-sm text-gray-500">Erreurs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'sent', 'delivered', 'opened', 'bounced'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-magenta text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'Tous' : STATUS_CONFIG[status]?.label || status}
          </button>
        ))}
      </div>

      {/* Info webhook */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Configuration webhook Resend</p>
            <p>Pour recevoir les mises à jour de statut (délivré, ouvert, etc.), configure le webhook dans le dashboard Resend :</p>
            <code className="block mt-2 p-2 bg-white rounded border border-blue-200 text-xs">
              https://rsxfmokwmwujercgpnfu.supabase.co/functions/v1/resend-webhook
            </code>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Chargement des emails...</p>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="p-8 text-center">
            <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun email trouvé</p>
            <p className="text-sm text-gray-400 mt-1">Les emails apparaîtront ici après leur envoi</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destinataire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sujet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dossier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmails.map((email) => {
                const statusConfig = STATUS_CONFIG[email.status] || { label: email.status, color: 'bg-gray-100 text-gray-800', icon: Clock }
                const StatusIcon = statusConfig.icon

                return (
                  <tr key={email.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(email.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {email.recipient}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 line-clamp-1">
                        {email.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {email.template_key ? TEMPLATE_LABELS[email.template_key] || email.template_key : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {email.dossiers?.reference ? (
                        <span className="text-sm font-medium text-magenta">
                          {email.dossiers.reference}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {email.html_content ? (
                        <button
                          onClick={() => setPreviewEmail(email)}
                          className="p-1.5 text-gray-400 hover:text-magenta hover:bg-magenta/10 rounded-lg transition-colors"
                          title="Voir le contenu de l'email"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de prévisualisation */}
      {previewEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Prévisualisation de l'email</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Envoyé le {formatDate(previewEmail.created_at)} à {previewEmail.recipient}
                </p>
              </div>
              <button
                onClick={() => setPreviewEmail(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Infos email */}
            <div className="p-4 bg-gray-50 border-b grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">De :</span>{' '}
                <span className="font-medium text-gray-900">{previewEmail.sender}</span>
              </div>
              <div>
                <span className="text-gray-500">À :</span>{' '}
                <span className="font-medium text-gray-900">{previewEmail.recipient}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Sujet :</span>{' '}
                <span className="font-medium text-gray-900">{previewEmail.subject}</span>
              </div>
              {previewEmail.dossiers?.reference && (
                <div>
                  <span className="text-gray-500">Dossier :</span>{' '}
                  <span className="font-medium text-magenta">{previewEmail.dossiers.reference}</span>
                </div>
              )}
              {previewEmail.template_key && (
                <div>
                  <span className="text-gray-500">Template :</span>{' '}
                  <span className="font-medium text-gray-900">
                    {TEMPLATE_LABELS[previewEmail.template_key] || previewEmail.template_key}
                  </span>
                </div>
              )}
            </div>

            {/* Contenu HTML */}
            <div className="flex-1 overflow-auto p-4">
              <div className="bg-white border border-gray-200 rounded-lg shadow-inner">
                <iframe
                  srcDoc={previewEmail.html_content || ''}
                  className="w-full h-[500px] border-0"
                  title="Prévisualisation de l'email"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setPreviewEmail(null)}
                className="btn btn-secondary"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
