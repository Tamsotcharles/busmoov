import { useState, useEffect } from 'react'
import { Globe, Building2, Phone, Mail, CreditCard, FileText, Save, Edit2, Eye, ChevronDown, ChevronRight } from 'lucide-react'
import { useCountries, useUpdateCountry, useAllCountryContent, useUpdateCountryContent, type Country, type CountryContent } from '@/hooks/useSupabase'
import { Modal } from '@/components/ui/Modal'
import DOMPurify from 'dompurify'

const CONTENT_TYPES = [
  { key: 'cgv', label: 'Conditions Générales de Vente', labelEs: 'CGV', labelDe: 'AGB', labelEn: 'Terms & Conditions' },
  { key: 'mentions_legales', label: 'Mentions légales', labelEs: 'Aviso legal', labelDe: 'Impressum', labelEn: 'Legal Notice' },
  { key: 'confidentialite', label: 'Politique de confidentialité', labelEs: 'Privacidad', labelDe: 'Datenschutz', labelEn: 'Privacy Policy' },
]

const FLAG_EMOJI: Record<string, string> = {
  FR: '🇫🇷',
  ES: '🇪🇸',
  DE: '🇩🇪',
  GB: '🇬🇧',
}

export function CountrySettingsPage() {
  const { data: countries, isLoading } = useCountries()
  const [selectedCountry, setSelectedCountry] = useState<string>('FR')
  const [expandedSection, setExpandedSection] = useState<string | null>('general')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">Chargement...</div>
      </div>
    )
  }

  const country = countries?.find(c => c.code === selectedCountry)

  return (
    <div className="space-y-6">
      {/* Header avec sélection du pays */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-purple-600" />
            Configuration par pays
          </h1>
          <p className="text-gray-500 mt-1">
            Gérez les paramètres spécifiques à chaque pays (coordonnées, TVA, factures, contenus)
          </p>
        </div>
      </div>

      {/* Onglets pays */}
      <div className="flex gap-2 border-b border-gray-200">
        {countries?.map((c) => (
          <button
            key={c.code}
            onClick={() => setSelectedCountry(c.code)}
            className={`px-4 py-3 font-medium text-sm transition-colors flex items-center gap-2 border-b-2 -mb-px ${
              selectedCountry === c.code
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="text-lg">{FLAG_EMOJI[c.code] || '🏳️'}</span>
            {c.name}
          </button>
        ))}
      </div>

      {/* Contenu du pays sélectionné */}
      {country && (
        <div className="space-y-4">
          {/* Section: Informations générales */}
          <CollapsibleSection
            title="Informations générales"
            icon={<Building2 className="w-5 h-5" />}
            isExpanded={expandedSection === 'general'}
            onToggle={() => setExpandedSection(expandedSection === 'general' ? null : 'general')}
          >
            <GeneralInfoSection country={country} />
          </CollapsibleSection>

          {/* Section: Contact */}
          <CollapsibleSection
            title="Coordonnées de contact"
            icon={<Phone className="w-5 h-5" />}
            isExpanded={expandedSection === 'contact'}
            onToggle={() => setExpandedSection(expandedSection === 'contact' ? null : 'contact')}
          >
            <ContactSection country={country} />
          </CollapsibleSection>

          {/* Section: Facturation */}
          <CollapsibleSection
            title="Facturation et TVA"
            icon={<FileText className="w-5 h-5" />}
            isExpanded={expandedSection === 'billing'}
            onToggle={() => setExpandedSection(expandedSection === 'billing' ? null : 'billing')}
          >
            <BillingSection country={country} />
          </CollapsibleSection>

          {/* Section: Coordonnées bancaires */}
          <CollapsibleSection
            title="Coordonnées bancaires (RIB)"
            icon={<CreditCard className="w-5 h-5" />}
            isExpanded={expandedSection === 'bank'}
            onToggle={() => setExpandedSection(expandedSection === 'bank' ? null : 'bank')}
          >
            <BankSection country={country} />
          </CollapsibleSection>

          {/* Section: Contenus */}
          <CollapsibleSection
            title="Contenus des pages (CGV, Mentions légales...)"
            icon={<FileText className="w-5 h-5" />}
            isExpanded={expandedSection === 'content'}
            onToggle={() => setExpandedSection(expandedSection === 'content' ? null : 'content')}
          >
            <ContentSection countryCode={country.code} />
          </CollapsibleSection>
        </div>
      )}
    </div>
  )
}

// Composant section pliable
function CollapsibleSection({
  title,
  icon,
  isExpanded,
  onToggle,
  children
}: {
  title: string
  icon: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-purple-600">{icon}</div>
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  )
}

// Section: Informations générales
function GeneralInfoSection({ country }: { country: Country }) {
  const updateCountry = useUpdateCountry()
  const [form, setForm] = useState({
    company_name: country.company_name || '',
    address: country.address || '',
    city: country.city || '',
    siret: country.siret || '',
    tva_intra: country.tva_intra || '',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setForm({
      company_name: country.company_name || '',
      address: country.address || '',
      city: country.city || '',
      siret: country.siret || '',
      tva_intra: country.tva_intra || '',
    })
  }, [country])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateCountry.mutateAsync({ code: country.code, updates: form })
      alert('✅ Informations sauvegardées')
    } catch (err) {
      console.error(err)
      alert('❌ Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="pt-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Raison sociale
          </label>
          <input
            type="text"
            value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Busmoov SAS"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {country.code === 'FR' ? 'SIRET' : country.code === 'ES' ? 'CIF' : country.code === 'GB' ? 'Company No.' : 'HRB'}
          </label>
          <input
            type="text"
            value={form.siret}
            onChange={(e) => setForm({ ...form, siret: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adresse
          </label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ville
          </label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          N° TVA Intracommunautaire
        </label>
        <input
          type="text"
          value={form.tva_intra}
          onChange={(e) => setForm({ ...form, tva_intra: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder={country.code === 'FR' ? 'FR12 345678901' : country.code === 'ES' ? 'ESB12345678' : country.code === 'GB' ? 'GB123456789' : 'DE123456789'}
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}

// Section: Contact
function ContactSection({ country }: { country: Country }) {
  const updateCountry = useUpdateCountry()
  const [form, setForm] = useState({
    phone: country.phone || '',
    phone_display: country.phone_display || '',
    email: country.email || '',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setForm({
      phone: country.phone || '',
      phone_display: country.phone_display || '',
      email: country.email || '',
    })
  }, [country])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateCountry.mutateAsync({ code: country.code, updates: form })
      alert('✅ Coordonnées sauvegardées')
    } catch (err) {
      console.error(err)
      alert('❌ Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="pt-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone (format international)
          </label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="+33176311283"
          />
          <p className="text-xs text-gray-500 mt-1">Pour les liens tel:</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone (affichage)
          </label>
          <input
            type="text"
            value={form.phone_display}
            onChange={(e) => setForm({ ...form, phone_display: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="01 76 31 12 83"
          />
          <p className="text-xs text-gray-500 mt-1">Affiché sur le site</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email de contact
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="infos@busmoov.com"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}

// Section: Facturation et TVA
function BillingSection({ country }: { country: Country }) {
  const updateCountry = useUpdateCountry()
  const [form, setForm] = useState({
    vat_rate: country.vat_rate?.toString() || '10',
    vat_label: country.vat_label || 'TVA',
    invoice_prefix: country.invoice_prefix || '',
    invoice_next_number: country.invoice_next_number || 1,
    proforma_prefix: country.proforma_prefix || '',
    proforma_next_number: country.proforma_next_number || 1,
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setForm({
      vat_rate: country.vat_rate?.toString() || '10',
      vat_label: country.vat_label || 'TVA',
      invoice_prefix: country.invoice_prefix || '',
      invoice_next_number: country.invoice_next_number || 1,
      proforma_prefix: country.proforma_prefix || '',
      proforma_next_number: country.proforma_next_number || 1,
    })
  }, [country])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateCountry.mutateAsync({
        code: country.code,
        updates: {
          vat_rate: parseFloat(form.vat_rate),
          vat_label: form.vat_label,
          invoice_prefix: form.invoice_prefix,
          invoice_next_number: form.invoice_next_number,
          proforma_prefix: form.proforma_prefix,
          proforma_next_number: form.proforma_next_number,
        }
      })
      alert('✅ Paramètres de facturation sauvegardés')
    } catch (err) {
      console.error(err)
      alert('❌ Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="pt-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Taux de TVA (%)
          </label>
          <input
            type="number"
            step="0.01"
            value={form.vat_rate}
            onChange={(e) => setForm({ ...form, vat_rate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Transport: FR=10%, ES=10%, DE=7%, GB=0%
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Libellé TVA
          </label>
          <input
            type="text"
            value={form.vat_label}
            onChange={(e) => setForm({ ...form, vat_label: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="TVA / IVA / MwSt"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Numérotation des factures</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Préfixe facture
            </label>
            <input
              type="text"
              value={form.invoice_prefix}
              onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="FR-"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ex: {form.invoice_prefix}2025-00001
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prochain numéro
            </label>
            <input
              type="number"
              value={form.invoice_next_number}
              onChange={(e) => setForm({ ...form, invoice_next_number: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Numérotation des proformas</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Préfixe proforma
            </label>
            <input
              type="text"
              value={form.proforma_prefix}
              onChange={(e) => setForm({ ...form, proforma_prefix: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="PRO-FR-"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prochain numéro
            </label>
            <input
              type="number"
              value={form.proforma_next_number}
              onChange={(e) => setForm({ ...form, proforma_next_number: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}

// Section: Coordonnées bancaires
function BankSection({ country }: { country: Country }) {
  const updateCountry = useUpdateCountry()
  const [form, setForm] = useState({
    bank_name: country.bank_name || '',
    bank_iban: country.bank_iban || '',
    bank_bic: country.bank_bic || '',
    bank_beneficiary: country.bank_beneficiary || '',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setForm({
      bank_name: country.bank_name || '',
      bank_iban: country.bank_iban || '',
      bank_bic: country.bank_bic || '',
      bank_beneficiary: country.bank_beneficiary || '',
    })
  }, [country])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateCountry.mutateAsync({ code: country.code, updates: form })
      alert('✅ Coordonnées bancaires sauvegardées')
    } catch (err) {
      console.error(err)
      alert('❌ Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="pt-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom de la banque
          </label>
          <input
            type="text"
            value={form.bank_name}
            onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="BNP Paribas"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bénéficiaire
          </label>
          <input
            type="text"
            value={form.bank_beneficiary}
            onChange={(e) => setForm({ ...form, bank_beneficiary: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="BUSMOOV SAS"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          IBAN
        </label>
        <input
          type="text"
          value={form.bank_iban}
          onChange={(e) => setForm({ ...form, bank_iban: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
          placeholder="FR76 1234 5678 9012 3456 7890 123"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          BIC / SWIFT
        </label>
        <input
          type="text"
          value={form.bank_bic}
          onChange={(e) => setForm({ ...form, bank_bic: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
          placeholder="BNPAFRPP"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}

// Section: Contenus des pages
function ContentSection({ countryCode }: { countryCode: string }) {
  const { data: contents, isLoading } = useAllCountryContent(countryCode)
  const updateContent = useUpdateCountryContent()
  const [selectedContent, setSelectedContent] = useState<CountryContent | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', content: '' })
  const [isSaving, setIsSaving] = useState(false)

  const handleEdit = (content: CountryContent) => {
    setSelectedContent(content)
    setEditForm({
      title: content.title || '',
      content: content.content || '',
    })
    setIsEditing(true)
  }

  const handlePreview = (content: CountryContent) => {
    setSelectedContent(content)
    setShowPreview(true)
  }

  const handleSave = async () => {
    if (!selectedContent) return
    setIsSaving(true)
    try {
      await updateContent.mutateAsync({
        countryCode,
        contentType: selectedContent.content_type,
        title: editForm.title,
        content: editForm.content,
      })
      setIsEditing(false)
      alert('✅ Contenu sauvegardé')
    } catch (err) {
      console.error(err)
      alert('❌ Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="pt-4 text-gray-500">Chargement...</div>
  }

  return (
    <div className="pt-4">
      <div className="space-y-2">
        {CONTENT_TYPES.map((type) => {
          const content = contents?.find(c => c.content_type === type.key)
          const label = countryCode === 'ES' ? type.labelEs : countryCode === 'DE' ? type.labelDe : countryCode === 'GB' ? type.labelEn : type.label

          return (
            <div
              key={type.key}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <span className="font-medium text-gray-900">{label}</span>
                {content?.updated_at && (
                  <span className="text-xs text-gray-500 ml-2">
                    (modifié le {new Date(content.updated_at).toLocaleDateString('fr-FR')})
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => content && handlePreview(content)}
                  className="p-2 text-gray-500 hover:text-purple-600 hover:bg-white rounded-lg transition-colors"
                  title="Prévisualiser"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => content ? handleEdit(content) : handleEdit({
                    id: '',
                    country_code: countryCode,
                    content_type: type.key,
                    title: label,
                    content: '',
                    version: 1,
                    is_active: true,
                    created_at: '',
                    updated_at: '',
                  })}
                  className="p-2 text-gray-500 hover:text-purple-600 hover:bg-white rounded-lg transition-colors"
                  title="Modifier"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal d'édition */}
      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title={`Modifier: ${selectedContent?.title || ''}`}
        size="xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre
            </label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contenu (HTML)
            </label>
            <textarea
              value={editForm.content}
              onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
              rows={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="btn btn-secondary"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de prévisualisation */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={selectedContent?.title || 'Prévisualisation'}
        size="xl"
      >
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(selectedContent?.content || '<p>Aucun contenu</p>')
          }}
        />
      </Modal>
    </div>
  )
}
