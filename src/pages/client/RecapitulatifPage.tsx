import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, CreditCard, Building, Phone, Shield, Info, MapPin, Calendar, Users, Clock, FileText, ExternalLink } from 'lucide-react'
import DOMPurify from 'dompurify'
import { supabase } from '@/lib/supabase'
import { useCompanySettings } from '@/hooks/useSupabase'
import { formatDate, formatPrice } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { useTranslation } from 'react-i18next'
import { useLocalizedPath } from '@/components/i18n'
import { useCurrentCountry } from '@/hooks/useCountrySettings'

interface DossierData {
  id: string
  reference: string
  client_name: string
  client_email: string
  client_phone: string | null
  departure: string
  arrival: string
  departure_date: string
  return_date: string | null
  passengers: number
  price_ttc: number | null
  contract_signed_at: string | null
  billing_address: string | null
  billing_zip: string | null
  billing_city: string | null
}

interface CGV {
  id: string
  version: string
  title: string
  content: string
}

export function RecapitulatifPage() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const { data: country } = useCurrentCountry()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const ref = searchParams.get('ref')
  const email = searchParams.get('email')
  const { data: companySettings } = useCompanySettings()

  const [dossier, setDossier] = useState<DossierData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [paymentMethod, setPaymentMethod] = useState<'cb' | 'virement'>('cb')
  const [acceptPrevoyance, setAcceptPrevoyance] = useState(false)
  const [acceptCGV, setAcceptCGV] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [processing, setProcessing] = useState(false)

  // CGV state
  const [cgv, setCgv] = useState<CGV | null>(null)
  const [showCGVModal, setShowCGVModal] = useState(false)

  useEffect(() => {
    if (ref && email) {
      loadDossier()
    }
    loadCGV()
  }, [ref, email])

  const loadCGV = async () => {
    try {
      const { data, error } = await supabase
        .from('cgv')
        .select('id, version, title, content')
        .eq('is_active', true)
        .single()

      if (data && !error) {
        setCgv(data)
      }
    } catch (err) {
      console.error('Erreur chargement CGV:', err)
    }
  }

  const loadDossier = async () => {
    if (!ref || !email) {
      setError(t('recapitulatif.missingParams'))
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('dossiers')
        .select('*')
        .eq('reference', ref)
        .eq('client_email', email)
        .single()

      if (error) throw error
      setDossier(data)
    } catch (err) {
      setError(t('recapitulatif.notFound'))
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!dossier) return
    if (!acceptCGV) {
      alert(t('recapitulatif.alertAcceptCGV'))
      return
    }

    setProcessing(true)

    try {
      // Enregistrer l'acceptation des CGV
      if (cgv) {
        await supabase.from('cgv_acceptations').insert({
          dossier_id: dossier.id,
          cgv_id: cgv.id,
          cgv_version: cgv.version,
          client_email: dossier.client_email,
          client_name: dossier.client_name,
          user_agent: navigator.userAgent,
        })
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Paiement géré via Mollie dans PaymentPage.tsx
      alert(t('recapitulatif.paymentSuccess'))

      // Redirect to dashboard
      navigate(`${localizedPath('/mes-devis')}?ref=${ref}&email=${encodeURIComponent(email || '')}`)
    } catch (err) {
      console.error('Erreur lors du paiement:', err)
      alert(t('recapitulatif.paymentError'))
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-magenta border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{t('recapitulatif.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !dossier) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-6">🔍</div>
          <h2 className="font-display text-2xl font-bold text-purple-dark mb-2">
            {t('recapitulatif.notFound')}
          </h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link to={localizedPath('/')} className="btn btn-primary">
            {t('recapitulatif.backToHome')}
          </Link>
        </div>
      </div>
    )
  }

  const acompte = Math.round((dossier.price_ttc || 0) * 0.3)
  const prevoyancePrice = 49

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to={localizedPath('/')} className="flex items-center gap-3">
            <img src="/logo-icon.svg" alt="Busmoov" className="w-10 h-10" />
            <span className="font-display text-xl font-bold gradient-text">Busmoov</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-emerald-600">
              <Shield size={16} />
              <span>{t('recapitulatif.securePayment')}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Back button */}
        <Link
          to={`${localizedPath('/mes-devis')}?ref=${ref}&email=${encodeURIComponent(email || '')}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-purple mb-6"
        >
          <ArrowLeft size={18} />
          {t('recapitulatif.backToQuotes')}
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Récapitulatif */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <h2 className="font-display text-lg font-bold text-purple-dark mb-6">
                {t('recapitulatif.summaryTitle')}
              </h2>

              {/* Vehicle type */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 bg-purple/10 rounded-xl flex items-center justify-center">
                  🚌
                </div>
                <div>
                  <p className="font-semibold text-purple-dark">{t('recapitulatif.autocarTourisme')}</p>
                  <p className="text-sm text-gray-500">{formatPrice(dossier.price_ttc || 0)} {t('recapitulatif.ttc')}</p>
                </div>
              </div>

              {/* Trip details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">{t('recapitulatif.route')}</p>
                    <p className="font-medium">{dossier.departure} → {dossier.arrival}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">{t('recapitulatif.date')}</p>
                    <p className="font-medium">{formatDate(dossier.departure_date)}</p>
                    {dossier.return_date && (
                      <p className="text-sm text-gray-500">{t('recapitulatif.returnLabel')}: {formatDate(dossier.return_date)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">{t('recapitulatif.passengers')}</p>
                    <p className="font-medium">{dossier.passengers} {t('recapitulatif.passengersUnit')}</p>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">{t('recapitulatif.totalPriceTTC')}</span>
                  <span className="font-bold text-purple-dark">{formatPrice(dossier.price_ttc || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-magenta">
                  <span className="font-medium">{t('recapitulatif.deposit30')}</span>
                  <span className="text-xl font-bold">{formatPrice(acompte)}</span>
                </div>
                {acceptPrevoyance && (
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 text-sm">
                    <span>{t('recapitulatif.prevoyanceContract')}</span>
                    <span className="font-medium">+{formatPrice(prevoyancePrice)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contrat Prévoyance */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-teal-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield size={24} className="text-teal-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-display text-lg font-bold text-teal-700">
                      {t('recapitulatif.prevoyanceTitle')}
                    </h3>
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
                      {t('recapitulatif.recommended')}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">
                    {t('recapitulatif.prevoyanceDescription')}
                  </p>
                  <div className="text-sm text-gray-500 mb-4">
                    <p>{t('recapitulatif.prevoyancePrice')} <strong className="text-teal-600">{formatPrice(prevoyancePrice)} {t('recapitulatif.ttc')}</strong> {t('recapitulatif.prevoyanceInsteadOf')}</p>
                    <p className="text-xs mt-1">{t('recapitulatif.prevoyanceNote')}</p>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptPrevoyance}
                      onChange={(e) => setAcceptPrevoyance(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {t('recapitulatif.prevoyanceCheckbox')}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-display text-lg font-bold text-purple-dark mb-4">
                {t('recapitulatif.payToday')}
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                {t('recapitulatif.advisorContact')}
              </p>

              {/* Payment method tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cb')}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                    paymentMethod === 'cb'
                      ? 'border-purple bg-purple/5 text-purple'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <CreditCard size={20} />
                  <span className="font-medium">{t('recapitulatif.creditCard')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('virement')}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                    paymentMethod === 'virement'
                      ? 'border-purple bg-purple/5 text-purple'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Building size={20} />
                  <span className="font-medium">{t('recapitulatif.bankTransfer')}</span>
                </button>
              </div>

              {paymentMethod === 'cb' ? (
                <div className="space-y-4">
                  <div>
                    <label className="label">{t('recapitulatif.cardNumber')}</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                      placeholder="1234 1234 1234 1234"
                      className="input"
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">{t('recapitulatif.expiryDate')}</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '')
                          if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4)
                          setCardExpiry(val)
                        }}
                        placeholder="MM / AA"
                        className="input"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="label">{t('recapitulatif.securityCode')}</label>
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        placeholder="CVC"
                        className="input"
                        maxLength={3}
                      />
                    </div>
                  </div>

                  {/* Acceptation CGV */}
                  <div className="bg-gray-50 rounded-xl p-4 mt-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptCGV}
                        onChange={(e) => setAcceptCGV(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-purple focus:ring-purple mt-0.5"
                      />
                      <span className="text-sm text-gray-600">
                        {t('recapitulatif.acceptCGVPrefix')}{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            setShowCGVModal(true)
                          }}
                          className="text-purple font-medium hover:underline inline-flex items-center gap-1"
                        >
                          {t('recapitulatif.cgvLink')}
                          <ExternalLink size={12} />
                        </button>
                        {cgv && <span className="text-gray-400 text-xs ml-1">(v{cgv.version})</span>}
                      </span>
                    </label>
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={processing || !cardNumber || !cardExpiry || !cardCvc || !acceptCGV}
                    className="btn btn-primary w-full btn-lg mt-6"
                  >
                    {processing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t('recapitulatif.processing')}
                      </>
                    ) : (
                      <>
                        <Check size={20} />
                        {t('recapitulatif.pay')} {formatPrice(acompte + (acceptPrevoyance ? prevoyancePrice : 0))}
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h4 className="font-semibold text-blue-800 mb-3">{t('recapitulatif.bankDetails')}</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-500">{t('recapitulatif.iban')}</span> <span className="font-mono font-medium">{country?.bankIban || 'FR76 XXXX XXXX XXXX XXXX XXXX XXX'}</span></p>
                      <p><span className="text-gray-500">{t('recapitulatif.bic')}</span> <span className="font-mono font-medium">{country?.bankBic || 'BNPAFRPPXXX'}</span></p>
                      <p><span className="text-gray-500">{t('recapitulatif.referenceLabel')}</span> <span className="font-medium text-purple">{dossier.reference}</span></p>
                      <p><span className="text-gray-500">{t('recapitulatif.amountLabel')}</span> <span className="font-bold text-magenta">{formatPrice(acompte + (acceptPrevoyance ? prevoyancePrice : 0))}</span></p>
                    </div>
                    <p className="text-xs text-blue-600 mt-4">
                      {t('recapitulatif.transferConfirmation')}
                    </p>
                  </div>

                  {/* Acceptation CGV pour virement */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptCGV}
                        onChange={(e) => setAcceptCGV(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-purple focus:ring-purple mt-0.5"
                      />
                      <span className="text-sm text-gray-600">
                        {t('recapitulatif.acceptCGVPrefix')}{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            setShowCGVModal(true)
                          }}
                          className="text-purple font-medium hover:underline inline-flex items-center gap-1"
                        >
                          {t('recapitulatif.cgvLink')}
                          <ExternalLink size={12} />
                        </button>
                        {cgv && <span className="text-gray-400 text-xs ml-1">(v{cgv.version})</span>}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Security badges */}
              <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Shield size={16} className="text-emerald-500" />
                  {t('recapitulatif.securePaymentBadge')}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Check size={16} className="text-emerald-500" />
                  {t('recapitulatif.ssl256')}
                </div>
              </div>
            </div>

            {/* Contact box */}
            <div className="bg-gradient-to-br from-purple/5 to-magenta/5 rounded-2xl p-6 border border-purple/10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-purple-dark mb-1">{t('recapitulatif.needHelp')}</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {t('recapitulatif.advisorAvailable')}
                  </p>
                  <p className="text-lg font-bold text-magenta">{country?.phoneDisplay || companySettings?.phone || '01 76 31 12 83'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal CGV */}
      <Modal
        isOpen={showCGVModal}
        onClose={() => setShowCGVModal(false)}
        title={cgv?.title || t('recapitulatif.cgvLink')}
        size="xl"
      >
        <div className="max-h-[70vh] overflow-y-auto">
          {cgv ? (
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="prose prose-sm max-w-none">
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(renderMarkdown(cgv.content), {
                      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'strong', 'em', 'li', 'ul', 'ol', 'hr', 'br', 'a'],
                      ALLOWED_ATTR: ['class', 'href'],
                      ALLOW_DATA_ATTR: false
                    })
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-6 pt-4 border-t">
                {t('recapitulatif.version')} {cgv.version}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              {t('recapitulatif.loadingCGV')}
            </p>
          )}
        </div>
        <div className="flex justify-between items-center pt-4 border-t mt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptCGV}
              onChange={(e) => setAcceptCGV(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-purple focus:ring-purple"
            />
            <span className="text-sm font-medium text-gray-700">
              {t('recapitulatif.acceptCGV')}
            </span>
          </label>
          <button
            onClick={() => setShowCGVModal(false)}
            className="btn btn-primary"
          >
            {acceptCGV ? t('recapitulatif.continue') : t('recapitulatif.close')}
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
