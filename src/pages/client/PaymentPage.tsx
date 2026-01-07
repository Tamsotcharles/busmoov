import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard, Building2, Copy, Check, Lock, Shield, Loader2, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrice, formatDate } from '@/lib/utils'
import type { DossierWithRelations, Contrat } from '@/types/database'

type PaymentMethod = 'card' | 'transfer' | null

interface Paiement {
  id: string
  amount: number
  payment_date: string
  type: string
}

export function PaymentPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const refParam = searchParams.get('ref')
  const emailParam = searchParams.get('email')
  const typeParam = searchParams.get('type') // 'solde' ou null (acompte)

  const [loading, setLoading] = useState(true)
  const [dossier, setDossier] = useState<DossierWithRelations | null>(null)
  const [contrat, setContrat] = useState<Contrat | null>(null)
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCreatingPaymentLink, setIsCreatingPaymentLink] = useState(false)
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  // Bank transfer details (would come from settings in production)
  const bankDetails = {
    iban: 'FR76 3000 4000 0500 0012 3456 789',
    bic: 'BNPAFRPP',
    bank: 'BNP Paribas',
    beneficiary: 'BUSMOOV SAS',
  }

  useEffect(() => {
    if (refParam && emailParam) {
      loadData()
    } else {
      setError('Paramètres manquants')
      setLoading(false)
    }
  }, [refParam, emailParam])

  const loadData = async () => {
    try {
      // Load dossier
      const { data: dossierData, error: dossierError } = await supabase
        .from('dossiers')
        .select('*, transporteur:transporteurs(*)')
        .eq('reference', refParam || '')
        .eq('client_email', (emailParam || '').toLowerCase())
        .single()

      if (dossierError || !dossierData) {
        setError('Dossier introuvable')
        setLoading(false)
        return
      }

      setDossier(dossierData as unknown as DossierWithRelations)

      // Load contrat
      const { data: contratData, error: contratError } = await supabase
        .from('contrats')
        .select('*')
        .eq('dossier_id', dossierData.id)
        .single()

      // PGRST116 = no rows found, which is OK for contrat (might not exist yet)
      if (contratError && contratError.code !== 'PGRST116') {
        console.error('Error loading contrat:', contratError)
      }
      if (contratData) {
        setContrat(contratData as Contrat)
      }

      // Load paiements
      const { data: paiementsData, error: paiementsError } = await supabase
        .from('paiements')
        .select('id, amount, payment_date, type')
        .eq('dossier_id', dossierData.id)
        .order('payment_date', { ascending: false })

      if (paiementsError) {
        console.error('Error loading paiements:', paiementsError)
      }
      if (paiementsData) {
        setPaiements(paiementsData)
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleCardPayment = async () => {
    if (!dossier) return

    setIsCreatingPaymentLink(true)
    setPaymentError(null)

    try {
      // Appeler l'Edge Function pour creer le lien de paiement Mollie
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-link`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            dossier_id: dossier.id,
            amount: montantAPayer,
            type: isPayingSolde ? 'solde' : 'acompte',
            client_email: dossier.client_email,
            client_name: dossier.client_name || dossier.client_email,
            reference: dossier.reference,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur lors de la creation du lien de paiement')
      }

      // Rediriger vers le lien de paiement PayTweak
      if (result.payment_url) {
        setPaymentLinkUrl(result.payment_url)
        // Ouvrir dans un nouvel onglet ou rediriger
        window.location.href = result.payment_url
      } else {
        throw new Error('Lien de paiement non recu')
      }

    } catch (err: any) {
      console.error('Error creating payment link:', err)
      setPaymentError(err.message || 'Une erreur est survenue')
    } finally {
      setIsCreatingPaymentLink(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-magenta border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !dossier) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-6">❌</div>
          <h2 className="font-display text-2xl font-bold text-purple-dark mb-2">
            Erreur
          </h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link to="/" className="btn btn-primary">
            Retour a l'accueil
          </Link>
        </div>
      </div>
    )
  }

  // Calculs des montants
  const prixTTC = dossier.price_ttc || 0
  const acompteAmount = contrat?.acompte_amount || Math.round(prixTTC * 0.3)
  const soldeAmount = contrat?.solde_amount || Math.round(prixTTC * 0.7)
  const totalPaye = paiements.reduce((sum, p) => sum + (p.amount || 0), 0)
  const resteAPayer = Math.max(0, prixTTC - totalPaye)
  const acomptePaye = totalPaye >= acompteAmount
  const soldePaye = resteAPayer <= 0

  // Déterminer le montant à payer
  const montantAPayer = typeParam === 'solde' ? resteAPayer : (acomptePaye ? resteAPayer : acompteAmount)
  const isPayingSolde = typeParam === 'solde' || acomptePaye

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo-icon.svg" alt="Busmoov" className="w-10 h-10" />
            <span className="font-display text-xl font-bold gradient-text">Busmoov</span>
          </Link>
          <Link
            to={`/mes-devis?ref=${refParam}&email=${encodeURIComponent(emailParam || '')}`}
            className="btn btn-secondary btn-sm"
          >
            <ArrowLeft size={16} />
            Retour
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-purple-dark mb-2">
            {soldePaye ? 'Paiement complet' : isPayingSolde ? 'Paiement du solde' : 'Paiement de l\'acompte'}
          </h1>
          <p className="text-gray-500">Dossier {dossier.reference}</p>
        </div>

        {/* Si tout est payé, afficher un message de succès */}
        {soldePaye ? (
          <div className="card p-8 text-center mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="font-display text-2xl font-bold text-green-700 mb-2">
              Paiement complet
            </h2>
            <p className="text-green-600 mb-4">
              Votre réservation est entièrement réglée. Merci !
            </p>
            <p className="text-2xl font-bold text-green-700">{formatPrice(totalPaye)}</p>
          </div>
        ) : (
          <>
            {/* Security Badge */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Lock size={16} className="text-green-600" />
                Paiement securise
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield size={16} className="text-green-600" />
                Protection des donnees
              </div>
            </div>
          </>
        )}

        {/* Summary Card */}
        <div className="card p-6 mb-8">
          <h2 className="font-display text-lg font-semibold text-purple-dark mb-4">
            Recapitulatif
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-500 mb-1">Trajet</div>
              <div className="font-medium">{dossier.departure} → {dossier.arrival}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Date</div>
              <div className="font-medium">{formatDate(dossier.departure_date)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Passagers</div>
              <div className="font-medium">{dossier.passengers} personnes</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Transporteur</div>
              <div className="font-medium">{(dossier as any).transporteur?.number || 'Fournisseur sélectionné'}</div>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-6 pt-6 space-y-3">
            {/* Total TTC */}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total TTC</span>
              <span className="font-semibold">{formatPrice(prixTTC)}</span>
            </div>

            {/* Paiements déjà effectués */}
            {paiements.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4 space-y-2">
                <div className="text-sm font-medium text-green-700 mb-2">Paiements reçus</div>
                {paiements.map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-sm">
                    <span className="text-green-600">
                      {p.type === 'virement' ? 'Virement' : p.type === 'cb' ? 'Carte bancaire' : p.type === 'especes' ? 'Espèces' : p.type === 'cheque' ? 'Chèque' : p.type}
                      {' - '}
                      {new Date(p.payment_date).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="font-semibold text-green-700">+{formatPrice(p.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-green-200">
                  <span className="font-medium text-green-700">Total payé</span>
                  <span className="font-bold text-green-700">{formatPrice(totalPaye)}</span>
                </div>
              </div>
            )}

            {/* Reste à payer */}
            {!soldePaye && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-medium text-purple-dark">
                  {isPayingSolde ? 'Solde restant' : 'Acompte à régler'}
                </span>
                <span className="font-bold text-xl text-magenta">{formatPrice(montantAPayer)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Method Selection - seulement si reste à payer */}
        {!soldePaye && (
          <>
            <h2 className="font-display text-xl font-semibold text-purple-dark mb-6">
              Choisissez votre mode de paiement
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Card Payment */}
              <div
                onClick={() => setPaymentMethod('card')}
                className={`card p-6 cursor-pointer transition-all hover:shadow-lg ${
                  paymentMethod === 'card'
                    ? 'border-2 border-magenta bg-magenta/5'
                    : 'hover:border-magenta'
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    paymentMethod === 'card' ? 'gradient-bg text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-dark">Carte bancaire</h3>
                    <p className="text-sm text-gray-500">Paiement immediat et securise</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png" alt="Mastercard" className="h-6" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png" alt="Visa" className="h-6" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/200px-American_Express_logo_%282018%29.svg.png" alt="Amex" className="h-6" />
                </div>
              </div>

              {/* Bank Transfer */}
              <div
                onClick={() => setPaymentMethod('transfer')}
                className={`card p-6 cursor-pointer transition-all hover:shadow-lg ${
                  paymentMethod === 'transfer'
                    ? 'border-2 border-magenta bg-magenta/5'
                    : 'hover:border-magenta'
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    paymentMethod === 'transfer' ? 'gradient-bg text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-dark">Virement bancaire</h3>
                    <p className="text-sm text-gray-500">Delai de traitement : 2-3 jours</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Recommande pour les montants superieurs a 5 000 EUR
                </p>
              </div>
            </div>

            {/* Payment Details */}
            {paymentMethod === 'card' && (
              <div className="card p-6 mb-8">
                <h3 className="font-semibold text-purple-dark mb-4">Paiement par carte</h3>
                <div className="bg-gray-50 rounded-xl p-6 text-center mb-6">
                  <p className="text-gray-600 mb-4">
                    Montant a payer : <span className="font-bold text-2xl text-purple-dark">{formatPrice(montantAPayer)}</span>
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Vous serez redirige vers notre plateforme de paiement securisee
                  </p>

                  {paymentError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
                      <p className="text-red-700 text-sm">{paymentError}</p>
                    </div>
                  )}

                  {paymentLinkUrl ? (
                    <div className="space-y-4">
                      <p className="text-green-600 font-medium">Lien de paiement cree !</p>
                      <a
                        href={paymentLinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-lg"
                      >
                        <ExternalLink size={20} />
                        Acceder au paiement
                      </a>
                    </div>
                  ) : (
                    <button
                      onClick={handleCardPayment}
                      disabled={isCreatingPaymentLink}
                      className="btn btn-primary btn-lg disabled:opacity-50"
                    >
                      {isCreatingPaymentLink ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Creation du lien...
                        </>
                      ) : (
                        <>
                          <CreditCard size={20} />
                          Payer {formatPrice(montantAPayer)}
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                  <span>Paiement securise par Mollie</span>
                  <Lock size={12} />
                </div>
              </div>
            )}

            {paymentMethod === 'transfer' && (
              <div className="card p-6 mb-8">
                <h3 className="font-semibold text-purple-dark mb-4">Coordonnees bancaires</h3>
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-500">Beneficiaire</div>
                        <div className="font-medium">{bankDetails.beneficiary}</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(bankDetails.beneficiary, 'beneficiary')}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {copied === 'beneficiary' ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-gray-400" />}
                      </button>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-500">IBAN</div>
                        <div className="font-mono font-medium">{bankDetails.iban}</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(bankDetails.iban.replace(/\s/g, ''), 'iban')}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {copied === 'iban' ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-gray-400" />}
                      </button>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-500">BIC</div>
                        <div className="font-mono font-medium">{bankDetails.bic}</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(bankDetails.bic, 'bic')}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {copied === 'bic' ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-gray-400" />}
                      </button>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-500">Banque</div>
                        <div className="font-medium">{bankDetails.bank}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-amber-800 mb-2">Important</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Montant a virer : <strong>{formatPrice(montantAPayer)}</strong></li>
                    <li>• Reference a indiquer : <strong>{dossier.reference}</strong></li>
                    <li>• Delai de traitement : 2-3 jours ouvrés</li>
                  </ul>
                </div>

                <button
                  onClick={() => {
                    copyToClipboard(
                      `Beneficiaire: ${bankDetails.beneficiary}\nIBAN: ${bankDetails.iban}\nBIC: ${bankDetails.bic}\nMontant: ${formatPrice(montantAPayer)}\nReference: ${dossier.reference}`,
                      'all'
                    )
                  }}
                  className="btn btn-secondary w-full"
                >
                  <Copy size={16} />
                  {copied === 'all' ? 'Copie !' : 'Copier toutes les informations'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Help Section */}
        <div className="text-center text-gray-500 text-sm">
          <p>Une question sur le paiement ?</p>
          <a href="tel:+33176311283" className="text-magenta font-semibold hover:underline">
            01 76 31 12 83
          </a>
        </div>
      </div>
    </div>
  )
}
