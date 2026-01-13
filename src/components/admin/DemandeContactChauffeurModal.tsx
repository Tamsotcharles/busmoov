import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Truck, Calendar, MapPin, Users, Send, Loader2, Copy, CheckCircle, AlertCircle, Mail, FileText, Paperclip } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'
import { useCreateDemandeChauffeur, generateChauffeurToken } from '@/hooks/useSupabase'
import { supabase } from '@/lib/supabase'
import type { DossierWithRelations, Transporteur, VoyageInfo } from '@/types/database'

interface DemandeContactChauffeurModalProps {
  isOpen: boolean
  onClose: () => void
  dossier: DossierWithRelations
  transporteur: Transporteur | null
  voyageInfo: VoyageInfo | null
}

type DemandeType = 'aller' | 'retour' | 'aller_retour'
type ModalStep = 'config' | 'email'

// Template email pour demande chauffeur
const EMAIL_TEMPLATE = {
  subject: "Demande d'informations chauffeur - {reference}",
  body: `Bonjour,

Nous vous contactons concernant le dossier {reference}.

Voyage prévu : {departure} → {arrival}
Date de départ : {departure_date}
Passagers : {passengers}

Merci de nous communiquer les informations du/des chauffeur(s) affecté(s) à cette mission :
- Nom et prénom du chauffeur
- Numéro de téléphone
- Immatriculation du véhicule

👉 Remplir les informations : {lien_chauffeur}

Cordialement,
L'équipe Busmoov`,
}

export function DemandeContactChauffeurModal({
  isOpen,
  onClose,
  dossier,
  transporteur,
  voyageInfo,
}: DemandeContactChauffeurModalProps) {
  const [demandeType, setDemandeType] = useState<DemandeType>('aller_retour')
  const [sending, setSending] = useState(false)
  const [step, setStep] = useState<ModalStep>('config')
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [copied, setCopied] = useState(false)

  const createDemandeChauffeur = useCreateDemandeChauffeur()

  const hasRetour = !!dossier.return_date || !!voyageInfo?.retour_date

  // Créer la demande et passer à l'étape email
  const handleCreateDemande = async () => {
    if (!transporteur) {
      alert('Aucun transporteur assigné à ce dossier.')
      return
    }

    setSending(true)

    try {
      const token = generateChauffeurToken()
      const baseUrl = window.location.origin

      await createDemandeChauffeur.mutateAsync({
        dossier_id: dossier.id,
        transporteur_id: transporteur.id,
        type: demandeType,
        mode: 'individuel',
        token,
        status: 'pending',
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours
      })

      const link = `${baseUrl}/fournisseur/chauffeur?token=${token}`
      setGeneratedLink(link)

      // Préparer le template email avec les variables remplacées
      const subject = EMAIL_TEMPLATE.subject
        .replace('{reference}', dossier.reference)

      const body = EMAIL_TEMPLATE.body
        .replace('{reference}', dossier.reference)
        .replace('{departure}', dossier.departure)
        .replace('{arrival}', dossier.arrival)
        .replace('{departure_date}', formatDate(dossier.departure_date))
        .replace('{passengers}', String(dossier.passengers))
        .replace('{lien_chauffeur}', link)

      setEmailSubject(subject)
      setEmailBody(body)
      setStep('email')
    } catch (error) {
      console.error('Error creating demande:', error)
      alert('Une erreur est survenue lors de la création de la demande.')
    } finally {
      setSending(false)
    }
  }

  // Envoyer l'email via la fonction send-email
  const handleSendEmail = async () => {
    if (!transporteur?.email) {
      alert('Le transporteur n\'a pas d\'email configuré.')
      return
    }

    setSending(true)
    try {
      // Convertir le body texte en HTML
      const htmlBody = emailBody.replace(/\n/g, '<br>')

      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'custom',
          to: transporteur.email,
          subject: emailSubject,
          html_content: htmlBody,
          data: {
            dossier_id: dossier.id,
            language: 'fr', // Les emails aux transporteurs sont toujours en français
          },
        },
      })

      if (emailError) {
        throw emailError
      }

      // Mettre à jour la demande avec la date d'envoi
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('demandes_chauffeur')
        .update({
          email_sent_at: new Date().toISOString(),
        })
        .eq('dossier_id', dossier.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)

      // Ajouter une entrée dans la timeline
      await supabase.from('timeline').insert({
        dossier_id: dossier.id,
        type: 'email_sent',
        content: `Demande de contact chauffeur envoyée à ${transporteur.name} (${transporteur.email})`,
      })

      alert(`Email envoyé avec succès à ${transporteur.email}`)
      handleClose()
    } catch (error) {
      console.error('Erreur envoi email:', error)
      alert('Erreur lors de l\'envoi de l\'email: ' + (error instanceof Error ? error.message : 'Erreur inconnue'))
    } finally {
      setSending(false)
    }
  }

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setStep('config')
    setGeneratedLink(null)
    setEmailSubject('')
    setEmailBody('')
    setCopied(false)
    onClose()
  }

  // Étape 2: Modal d'édition email
  if (step === 'email' && generatedLink) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Envoyer la demande au transporteur"
        size="lg"
      >
        <div className="space-y-4">
          {/* Destinataire */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500 mb-1">Destinataire :</p>
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-gray-400" />
              <span className="font-medium">{transporteur?.name}</span>
              <span className="text-gray-500">({transporteur?.email || 'Email non renseigné'})</span>
            </div>
          </div>

          {/* Pièces jointes */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <p className="text-sm font-medium text-indigo-800 mb-2 flex items-center gap-2">
              <Paperclip size={16} />
              Pièces jointes
            </p>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-white border border-indigo-200 rounded text-sm text-indigo-700 flex items-center gap-2">
                <FileText size={14} />
                Infos voyage validées (PDF)
              </span>
            </div>
            <p className="text-xs text-indigo-600 mt-2">
              Le PDF des informations voyage validées sera joint automatiquement à l'email.
            </p>
          </div>

          {/* Lien généré */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-sm font-medium text-emerald-800 mb-2">Lien de saisie chauffeur :</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={generatedLink}
                readOnly
                className="flex-1 bg-white border border-emerald-200 rounded px-3 py-1.5 text-sm text-gray-700"
              />
              <button
                onClick={copyLink}
                className={`p-2 rounded-lg transition ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-white border border-emerald-200 hover:bg-emerald-100'
                }`}
                title="Copier le lien"
              >
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Sujet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple focus:border-transparent"
              placeholder="Sujet de l'email"
            />
          </div>

          {/* Corps du message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple focus:border-transparent min-h-[250px] font-mono text-sm"
              placeholder="Corps du message"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <button
            onClick={() => setStep('config')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            Retour
          </button>
          <button
            onClick={handleSendEmail}
            disabled={sending || !transporteur?.email}
            className="px-6 py-2 bg-gradient-to-r from-purple-dark to-magenta text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Envoyer l'email
              </>
            )}
          </button>
        </div>
      </Modal>
    )
  }

  // Étape 1: Configuration de la demande
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Demande contact chauffeur" size="lg">
      {/* Recap dossier */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 text-purple-dark font-semibold mb-3">
          <Truck className="w-5 h-5" />
          <span>Dossier {dossier.reference}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Client</p>
            <p className="font-medium">{dossier.client_name}</p>
          </div>
          <div>
            <p className="text-gray-500">Transporteur</p>
            <p className="font-medium">{transporteur?.name || 'Non assigné'}</p>
          </div>
        </div>
      </div>

      {/* Trajets */}
      <div className="space-y-4 mb-6">
        {/* Aller */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-dark font-semibold mb-2">
            <Calendar className="w-4 h-4" />
            <span>ALLER</span>
            <span className="text-sm font-normal text-gray-500 ml-auto">
              {voyageInfo?.aller_date
                ? formatDateTime(voyageInfo.aller_date)
                : formatDate(dossier.departure_date)}
            </span>
          </div>
          <div className="text-sm space-y-1">
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{voyageInfo?.aller_adresse_depart || dossier.departure}</span>
              <span className="text-gray-400">→</span>
              <span>{voyageInfo?.aller_adresse_arrivee || dossier.arrival}</span>
            </p>
            <p className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span>{voyageInfo?.aller_passagers || dossier.passengers} passagers</span>
            </p>
          </div>
        </div>

        {/* Retour */}
        {hasRetour && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 text-magenta font-semibold mb-2">
              <Calendar className="w-4 h-4" />
              <span>RETOUR</span>
              <span className="text-sm font-normal text-gray-500 ml-auto">
                {voyageInfo?.retour_date
                  ? formatDateTime(voyageInfo.retour_date)
                  : dossier.return_date
                  ? formatDate(dossier.return_date)
                  : '-'}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{voyageInfo?.retour_adresse_depart || dossier.arrival}</span>
                <span className="text-gray-400">→</span>
                <span>{voyageInfo?.retour_adresse_arrivee || dossier.departure}</span>
              </p>
              <p className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span>{voyageInfo?.retour_passagers || dossier.passengers} passagers</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Type de demande */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type de demande
        </label>
        <div className="flex gap-3">
          <label className={`flex-1 border rounded-lg p-3 cursor-pointer transition ${
            demandeType === 'aller' ? 'border-purple-dark bg-purple-50' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="radio"
              name="demandeType"
              value="aller"
              checked={demandeType === 'aller'}
              onChange={() => setDemandeType('aller')}
              className="sr-only"
            />
            <span className="font-medium">Aller uniquement</span>
          </label>

          {hasRetour && (
            <>
              <label className={`flex-1 border rounded-lg p-3 cursor-pointer transition ${
                demandeType === 'retour' ? 'border-magenta bg-magenta/10' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="demandeType"
                  value="retour"
                  checked={demandeType === 'retour'}
                  onChange={() => setDemandeType('retour')}
                  className="sr-only"
                />
                <span className="font-medium">Retour uniquement</span>
              </label>

              <label className={`flex-1 border rounded-lg p-3 cursor-pointer transition ${
                demandeType === 'aller_retour' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="demandeType"
                  value="aller_retour"
                  checked={demandeType === 'aller_retour'}
                  onChange={() => setDemandeType('aller_retour')}
                  className="sr-only"
                />
                <span className="font-medium">Aller-Retour</span>
              </label>
            </>
          )}
        </div>
      </div>

      {/* Warning si pas de transporteur */}
      {!transporteur && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Aucun transporteur assigné</p>
            <p className="text-sm text-amber-700">
              Veuillez d'abord assigner un transporteur à ce dossier avant de demander les informations du chauffeur.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          Annuler
        </button>
        <button
          onClick={handleCreateDemande}
          disabled={sending || !transporteur}
          className="px-6 py-2 bg-gradient-to-r from-purple-dark to-magenta text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Création...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              Continuer vers l'email
            </>
          )}
        </button>
      </div>
    </Modal>
  )
}
