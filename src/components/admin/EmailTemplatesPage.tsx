import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Mail, Edit2, Eye, Save, X, Code, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'

interface EmailTemplate {
  id: string
  key: string
  name: string
  description: string | null
  subject: string
  body: string
  content: string | null
  html_content: string | null
  variables: Array<{ name: string; description: string }> | null
  is_active: boolean | null
  type: string | null
  created_at: string | null
  updated_at: string | null
}

export function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [testError, setTestError] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    html_content: '',
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      // Cast to EmailTemplate array since we added new columns
      setTemplates((data as unknown as EmailTemplate[]) || [])
    } catch (err) {
      console.error('Erreur chargement templates:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      description: template.description || '',
      subject: template.subject,
      html_content: template.html_content || template.body || '',
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!selectedTemplate) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({
          name: formData.name,
          description: formData.description,
          subject: formData.subject,
          html_content: formData.html_content,
          body: formData.html_content, // Garder body sync pour compatibilité
        })
        .eq('id', selectedTemplate.id)

      if (error) throw error

      await loadTemplates()
      setIsEditing(false)
      setSelectedTemplate(null)
    } catch (err) {
      console.error('Erreur sauvegarde template:', err)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setSelectedTemplate(null)
  }

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setShowPreview(true)
  }

  const handleTest = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setTestEmail('')
    setTestStatus('idle')
    setTestError('')
    setShowTestModal(true)
  }

  const sendTestEmail = async () => {
    if (!selectedTemplate || !testEmail) return

    setTestStatus('sending')
    setTestError('')

    try {
      // Préparer des données de test
      const testData: Record<string, string | number> = {}
      if (selectedTemplate.variables) {
        selectedTemplate.variables.forEach(v => {
          switch (v.name) {
            case 'client_name':
              testData[v.name] = 'Jean Test'
              break
            case 'reference':
              testData[v.name] = 'BUS-2025-TEST'
              break
            case 'departure':
              testData[v.name] = 'Paris'
              break
            case 'arrival':
              testData[v.name] = 'Lyon'
              break
            case 'departure_date':
              testData[v.name] = '15 janvier 2025'
              break
            case 'passengers':
              testData[v.name] = 45
              break
            case 'nb_devis':
              testData[v.name] = 3
              break
            case 'prix_ttc':
              testData[v.name] = 1250
              break
            case 'prix_barre':
              testData[v.name] = 1500
              break
            case 'validite_heures':
              testData[v.name] = 24
              break
            case 'montant_acompte':
            case 'montant_solde':
              testData[v.name] = 375
              break
            case 'date_limite':
              testData[v.name] = '8 janvier 2025'
              break
            case 'chauffeur_name':
              testData[v.name] = 'Michel Dupont'
              break
            case 'chauffeur_phone':
              testData[v.name] = '06 12 34 56 78'
              break
            case 'transporteur':
              testData[v.name] = 'Autocars Express'
              break
            default:
              testData[v.name] = `[${v.name}]`
          }
        })
        // Ajouter les liens (avec préfixe de langue français par défaut pour les tests)
        testData['lien_espace_client'] = 'https://busmoov.com/fr/mes-devis?ref=TEST'
        testData['lien_paiement'] = 'https://busmoov.com/fr/paiement?ref=TEST'
        testData['lien_infos_voyage'] = 'https://busmoov.com/fr/infos-voyage?ref=TEST'
      }

      const response = await supabase.functions.invoke('send-email', {
        body: {
          type: selectedTemplate.key,
          to: testEmail,
          data: testData,
        }
      })

      if (response.error) {
        throw new Error(response.error.message)
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erreur inconnue')
      }

      setTestStatus('success')
    } catch (err: any) {
      console.error('Erreur envoi test:', err)
      setTestStatus('error')
      setTestError(err.message || 'Erreur lors de l\'envoi')
    }
  }

  // Remplacer les variables dans le HTML pour la preview
  const getPreviewHtml = (template: EmailTemplate): string => {
    let html = template.html_content || template.body || ''

    // Remplacer les variables par des valeurs de démonstration
    const demoValues: Record<string, string> = {
      client_name: 'Jean Dupont',
      reference: 'BUS-2025-001',
      departure: 'Paris',
      arrival: 'Lyon',
      departure_date: '15 janvier 2025',
      passengers: '45',
      nb_devis: '3',
      prix_ttc: '1 250',
      prix_barre: '1 500',
      validite_heures: '24',
      montant_acompte: '375',
      montant_solde: '875',
      date_limite: '8 janvier 2025',
      chauffeur_name: 'Michel Dupont',
      chauffeur_phone: '06 12 34 56 78',
      chauffeur_immat: 'AB-123-CD',
      transporteur: 'Autocars Express',
      lien_espace_client: '#',
      lien_paiement: '#',
      lien_infos_voyage: '#',
    }

    Object.entries(demoValues).forEach(([key, value]) => {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value)
    })

    return html
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-magenta"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Mail className="text-magenta" size={28} />
            Templates d'emails
          </h1>
          <p className="text-gray-500 mt-1">
            Personnalisez les emails envoyés automatiquement aux clients
          </p>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Code className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Variables disponibles</p>
            <p>
              Utilisez la syntaxe <code className="bg-blue-100 px-1 rounded">{'{{variable}}'}</code> pour insérer des données dynamiques.
              Chaque template affiche ses variables disponibles lors de l'édition.
            </p>
          </div>
        </div>
      </div>

      {/* Liste des templates */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{templates.length} templates configurés</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {templates.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Aucun template d'email configuré
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    template.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Mail size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{template.name}</span>
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-mono">
                        {template.key}
                      </span>
                      {template.is_active && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                          Actif
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {template.description || template.subject}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePreview(template)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Apercu"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Modifier"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleTest(template)}
                    className="p-2 text-gray-400 hover:text-purple hover:bg-purple/10 rounded-lg"
                    title="Envoyer un test"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal d'édition */}
      <Modal
        isOpen={isEditing}
        onClose={handleCancel}
        title={`Modifier : ${selectedTemplate?.name}`}
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nom du template</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Devis prets"
              />
            </div>
            <div>
              <label className="label">Description</label>
              <input
                type="text"
                className="input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Envoye quand les devis sont prets"
              />
            </div>
          </div>

          <div>
            <label className="label">Sujet de l'email</label>
            <input
              type="text"
              className="input"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Vos {{nb_devis}} offres sont pretes - {{reference}}"
            />
          </div>

          {/* Variables disponibles */}
          {selectedTemplate?.variables && selectedTemplate.variables.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Variables disponibles :</p>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.variables.map((v, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      // Copier dans le presse-papier
                      navigator.clipboard.writeText(`{{${v.name}}}`)
                    }}
                    className="text-xs bg-white border border-gray-200 px-2 py-1 rounded hover:bg-purple/10 hover:border-purple transition-colors"
                    title={v.description}
                  >
                    <code>{`{{${v.name}}}`}</code>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="label">Contenu HTML</label>
            <textarea
              className="input font-mono text-sm"
              rows={16}
              value={formData.html_content}
              onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
              placeholder="<!DOCTYPE html>..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Code HTML complet de l'email avec styles inline
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={handleCancel}
              className="btn btn-secondary"
              disabled={isSaving}
            >
              <X size={18} />
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary flex items-center gap-2"
              disabled={isSaving}
            >
              <Save size={18} />
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de prévisualisation */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={`Apercu : ${selectedTemplate?.name}`}
        size="xl"
      >
        <div className="space-y-4">
          {/* Sujet */}
          <div className="bg-gray-100 rounded-lg p-3">
            <p className="text-sm text-gray-500 mb-1">Sujet :</p>
            <p className="font-medium text-gray-900">{selectedTemplate?.subject}</p>
          </div>

          {/* Preview HTML */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 text-sm text-gray-500">
              Apercu du contenu
            </div>
            <div className="p-4 bg-white">
              <iframe
                srcDoc={selectedTemplate ? getPreviewHtml(selectedTemplate) : ''}
                className="w-full h-[500px] border-0"
                title="Email preview"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t mt-4">
          <button
            onClick={() => setShowPreview(false)}
            className="btn btn-primary"
          >
            Fermer
          </button>
        </div>
      </Modal>

      {/* Modal d'envoi de test */}
      <Modal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        title={`Tester : ${selectedTemplate?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Envoyez un email de test pour verifier le rendu. Des donnees fictives seront utilisees pour les variables.
          </p>

          <div>
            <label className="label">Email de destination</label>
            <input
              type="email"
              className="input"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="votre@email.com"
            />
          </div>

          {testStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="text-green-500" size={20} />
              <span className="text-green-800">Email de test envoye avec succes !</span>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-red-500" size={20} />
                <span className="text-red-800">Erreur lors de l'envoi</span>
              </div>
              {testError && (
                <p className="text-sm text-red-600 mt-2">{testError}</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setShowTestModal(false)}
              className="btn btn-secondary"
            >
              Fermer
            </button>
            <button
              onClick={sendTestEmail}
              disabled={!testEmail || testStatus === 'sending'}
              className="btn btn-primary flex items-center gap-2"
            >
              <Send size={18} />
              {testStatus === 'sending' ? 'Envoi...' : 'Envoyer le test'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
