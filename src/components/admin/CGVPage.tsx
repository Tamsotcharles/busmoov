import { useState, useEffect } from 'react'
import DOMPurify from 'dompurify'
import { supabase } from '@/lib/supabase'
import { FileText, Plus, Edit2, Eye, Check, Trash2, Clock, Save, X, History } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'

interface CGV {
  id: string
  version: string
  title: string
  content: string
  is_active: boolean | null
  published_at: string | null
  created_at: string | null
  updated_at: string | null
}

interface CGVAcceptation {
  id: string
  dossier_id: string | null
  cgv_version: string | null
  accepted_at: string | null
  client_email: string | null
  client_name: string | null
  dossiers?: {
    reference: string
  } | null
}

export function CGVPage() {
  const [cgvList, setCgvList] = useState<CGV[]>([])
  const [acceptations, setAcceptations] = useState<CGVAcceptation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCGV, setSelectedCGV] = useState<CGV | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    version: '',
    title: 'Conditions Générales de Vente',
    content: '',
  })

  useEffect(() => {
    loadCGV()
    loadAcceptations()
  }, [])

  const loadCGV = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('cgv')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCgvList(data || [])
    } catch (err) {
      console.error('Erreur chargement CGV:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAcceptations = async () => {
    try {
      const { data, error } = await supabase
        .from('cgv_acceptations')
        .select(`
          *,
          dossiers(reference)
        `)
        .order('accepted_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setAcceptations(data || [])
    } catch (err) {
      console.error('Erreur chargement acceptations:', err)
    }
  }

  const handleCreate = () => {
    // Générer une nouvelle version
    const lastVersion = cgvList[0]?.version || '0.0'
    const versionParts = lastVersion.split('.')
    const newMinor = parseInt(versionParts[1] || '0') + 1
    const newVersion = `${versionParts[0]}.${newMinor}`

    setFormData({
      version: newVersion,
      title: 'Conditions Générales de Vente',
      content: cgvList[0]?.content || getDefaultContent(),
    })
    setIsCreating(true)
    setIsEditing(false)
    setSelectedCGV(null)
  }

  const handleEdit = (cgv: CGV) => {
    setSelectedCGV(cgv)
    setFormData({
      version: cgv.version,
      title: cgv.title,
      content: cgv.content,
    })
    setIsEditing(true)
    setIsCreating(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (isCreating) {
        const { error } = await supabase.from('cgv').insert({
          version: formData.version,
          title: formData.title,
          content: formData.content,
          is_active: false,
        })
        if (error) throw error
      } else if (selectedCGV) {
        const { error } = await supabase
          .from('cgv')
          .update({
            title: formData.title,
            content: formData.content,
          })
          .eq('id', selectedCGV.id)
        if (error) throw error
      }

      await loadCGV()
      setIsEditing(false)
      setIsCreating(false)
      setSelectedCGV(null)
    } catch (err) {
      console.error('Erreur sauvegarde CGV:', err)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleActivate = async (cgv: CGV) => {
    if (!confirm(`Activer la version ${cgv.version} des CGV ?\n\nCette version sera celle présentée aux clients lors de la validation de leur réservation.`)) {
      return
    }

    try {
      // Désactiver toutes les autres versions
      await supabase
        .from('cgv')
        .update({ is_active: false })
        .neq('id', cgv.id)

      // Activer cette version
      const { error } = await supabase
        .from('cgv')
        .update({ is_active: true, published_at: new Date().toISOString() })
        .eq('id', cgv.id)

      if (error) throw error
      await loadCGV()
    } catch (err) {
      console.error('Erreur activation CGV:', err)
      alert('Erreur lors de l\'activation')
    }
  }

  const handleDelete = async (cgv: CGV) => {
    if (cgv.is_active) {
      alert('Impossible de supprimer la version active des CGV')
      return
    }

    // Vérifier s'il y a des acceptations
    const { count } = await supabase
      .from('cgv_acceptations')
      .select('*', { count: 'exact', head: true })
      .eq('cgv_id', cgv.id)

    if (count && count > 0) {
      alert(`Cette version a été acceptée par ${count} client(s). Suppression impossible.`)
      return
    }

    if (!confirm(`Supprimer la version ${cgv.version} des CGV ?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('cgv')
        .delete()
        .eq('id', cgv.id)

      if (error) throw error
      await loadCGV()
    } catch (err) {
      console.error('Erreur suppression CGV:', err)
      alert('Erreur lors de la suppression')
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setIsCreating(false)
    setSelectedCGV(null)
  }

  const getDefaultContent = () => {
    return `# Conditions Générales de Vente - Busmoov

## Article 1 - Objet
Les présentes conditions générales de vente régissent les relations contractuelles entre Busmoov et ses clients pour toute prestation de transport en autocar.

## Article 2 - Réservation
La réservation devient définitive après :
- La signature du contrat de réservation
- Le paiement de l'acompte de 30% du montant total

## Article 3 - Tarifs
Les prix indiqués sont en euros TTC et comprennent :
- La mise à disposition du véhicule
- Les services du ou des chauffeurs
- Le carburant
- Les péages autoroutiers sur le trajet principal

## Article 4 - Paiement
- Acompte de 30% à la réservation
- Solde à régler 15 jours avant le départ

## Article 5 - Annulation
En cas d'annulation par le client :
- Plus de 30 jours avant le départ : remboursement intégral moins 10% de frais de dossier
- Entre 30 et 15 jours : 50% du montant total retenu
- Moins de 15 jours : aucun remboursement

## Article 6 - Responsabilités
Busmoov s'engage à fournir un véhicule conforme aux normes de sécurité en vigueur et un chauffeur qualifié.

## Article 7 - Assurance
Tous nos véhicules sont assurés en responsabilité civile. Une assurance complémentaire peut être souscrite sur demande.

## Article 8 - Réclamations
Toute réclamation doit être adressée par écrit dans un délai de 8 jours suivant la prestation.

## Article 9 - Litiges
En cas de litige, les tribunaux de Paris seront seuls compétents.`
  }

  const activeCGV = cgvList.find(c => c.is_active)

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
            <FileText className="text-magenta" size={28} />
            Conditions Générales de Vente
          </h1>
          <p className="text-gray-500 mt-1">
            Gérez les CGV du site et suivez les acceptations des clients
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowHistory(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <History size={18} />
            Historique acceptations
          </button>
          <button
            onClick={handleCreate}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Nouvelle version
          </button>
        </div>
      </div>

      {/* Version active */}
      {activeCGV && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                  VERSION ACTIVE
                </span>
                <span className="text-green-800 font-semibold">v{activeCGV.version}</span>
              </div>
              <h3 className="text-lg font-semibold text-green-900">{activeCGV.title}</h3>
              <p className="text-sm text-green-700 mt-1">
                Publiée le {formatDate(activeCGV.published_at || activeCGV.created_at)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedCGV(activeCGV)
                  setShowPreview(true)
                }}
                className="btn btn-secondary btn-sm flex items-center gap-1"
              >
                <Eye size={16} />
                Aperçu
              </button>
              <button
                onClick={() => handleEdit(activeCGV)}
                className="btn btn-secondary btn-sm flex items-center gap-1"
              >
                <Edit2 size={16} />
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des versions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Toutes les versions</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {cgvList.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Aucune version des CGV. Créez-en une première.
            </div>
          ) : (
            cgvList.map((cgv) => (
              <div
                key={cgv.id}
                className={`p-4 flex items-center justify-between hover:bg-gray-50 ${
                  cgv.is_active ? 'bg-green-50/50' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    cgv.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">Version {cgv.version}</span>
                      {cgv.is_active && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {cgv.title} • Créée le {formatDate(cgv.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedCGV(cgv)
                      setShowPreview(true)
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Aperçu"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(cgv)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Modifier"
                  >
                    <Edit2 size={18} />
                  </button>
                  {!cgv.is_active && (
                    <>
                      <button
                        onClick={() => handleActivate(cgv)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                        title="Activer cette version"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(cgv)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal d'édition/création */}
      <Modal
        isOpen={isEditing || isCreating}
        onClose={handleCancel}
        title={isCreating ? 'Nouvelle version des CGV' : `Modifier CGV v${selectedCGV?.version}`}
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Version</label>
              <input
                type="text"
                className="input"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                disabled={!isCreating}
                placeholder="Ex: 2.0"
              />
            </div>
            <div>
              <label className="label">Titre</label>
              <input
                type="text"
                className="input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Conditions Générales de Vente"
              />
            </div>
          </div>

          <div>
            <label className="label">Contenu (Markdown supporté)</label>
            <textarea
              className="input font-mono text-sm"
              rows={20}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Rédigez vos CGV ici..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Utilisez # pour les titres, ## pour les sous-titres, - pour les listes
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
        title={`Aperçu - CGV v${selectedCGV?.version}`}
        size="xl"
      >
        <div className="bg-gray-50 rounded-lg p-6 max-h-[70vh] overflow-y-auto">
          <div className="prose prose-sm max-w-none">
            <div
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(renderMarkdown(selectedCGV?.content || ''), {
                  ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'strong', 'em', 'li', 'ul', 'ol', 'hr', 'br', 'a'],
                  ALLOWED_ATTR: ['class', 'href'],
                  ALLOW_DATA_ATTR: false
                })
              }}
            />
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

      {/* Modal historique des acceptations */}
      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title="Historique des acceptations CGV"
        size="lg"
      >
        <div className="max-h-[60vh] overflow-y-auto">
          {acceptations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Aucune acceptation enregistrée
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Dossier</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Client</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Version CGV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {acceptations.map((acc) => (
                  <tr key={acc.id} className="hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        {formatDate(acc.accepted_at)}
                      </div>
                    </td>
                    <td className="p-3 text-sm font-medium text-gray-900">
                      {acc.dossiers?.reference || '-'}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      <div>{acc.client_name || '-'}</div>
                      <div className="text-xs text-gray-400">{acc.client_email}</div>
                    </td>
                    <td className="p-3">
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        v{acc.cgv_version}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex justify-end pt-4 border-t mt-4">
          <button
            onClick={() => setShowHistory(false)}
            className="btn btn-primary"
          >
            Fermer
          </button>
        </div>
      </Modal>
    </div>
  )
}

// Simple markdown renderer
function renderMarkdown(text: string): string {
  return text
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3 text-gray-900">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4 text-gray-900">$1</h1>')
    // Bold
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // Lists
    .replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>')
    // Horizontal rule
    .replace(/^---$/gim, '<hr class="my-6 border-gray-200"/>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="mb-3">')
    // Line breaks
    .replace(/\n/g, '<br/>')
    // Wrap in paragraph
    .replace(/^(.*)$/, '<p class="mb-3">$1</p>')
}
