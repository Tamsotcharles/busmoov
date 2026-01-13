import { Link } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useCurrentCountry, useCurrentCountryContent } from '@/hooks/useCountrySettings'
import { useLocalizedPath } from '@/components/i18n'
import DOMPurify from 'dompurify'

export function ConfidentialitePage() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const { data: country, isLoading: loadingCountry } = useCurrentCountry()
  const { data: customContent, isLoading: loadingContent } = useCurrentCountryContent('confidentialite')

  // Fonction de rendu markdown simple
  const renderMarkdown = (text: string): string => {
    return text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-800">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-4 text-gray-900">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4 text-gray-900">$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^\- (.*$)/gim, '<li class="ml-6 list-disc text-gray-600">$1</li>')
      .replace(/^---$/gim, '<hr class="my-8 border-gray-200"/>')
      .replace(/\n\n/g, '</p><p class="mb-4 text-gray-600 leading-relaxed">')
      .replace(/\n/g, '<br/>')
  }

  if (loadingCountry || loadingContent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showAdminLink={false} />
        <div className="pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-magenta border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">{t('common.loading', 'Chargement...')}</p>
          </div>
        </div>
      </div>
    )
  }

  // Si un contenu personnalisé existe, l'afficher
  if (customContent?.content) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showAdminLink={false} />

        <main className="pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              to={localizedPath('/')}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-magenta mb-8 transition-colors"
            >
              <ArrowLeft size={18} />
              {t('common.backToHome', 'Retour à l\'accueil')}
            </Link>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple to-magenta px-8 py-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <Shield size={28} />
                  <h1 className="text-2xl font-bold">{customContent.title || t('privacy.title', 'Politique de Confidentialité')}</h1>
                </div>
                {customContent.updatedAt && (
                  <p className="text-white/80 text-sm">
                    {t('privacy.lastUpdate', 'Dernière mise à jour')} : {new Date(customContent.updatedAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="px-8 py-8">
                <div
                  className="prose prose-gray max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      `<p class="mb-4 text-gray-600 leading-relaxed">${renderMarkdown(customContent.content)}</p>`,
                      {
                        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'strong', 'em', 'li', 'ul', 'ol', 'hr', 'br', 'a'],
                        ALLOWED_ATTR: ['class', 'href'],
                        ALLOW_DATA_ATTR: false
                      }
                    )
                  }}
                />
              </div>

              <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 text-center">
                  {t('privacy.seeAlso', 'Voir aussi nos')}{' '}
                  <Link to="/mentions-legales" className="text-magenta hover:underline">
                    {t('privacy.legalNotice', 'Mentions légales')}
                  </Link>
                  {' '}{t('common.and', 'et')}{' '}
                  <Link to="/cgv" className="text-magenta hover:underline">
                    {t('privacy.terms', 'Conditions Générales de Vente')}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  // Contenu par défaut avec les informations du pays
  return (
    <div className="min-h-screen bg-gray-50">
      <Header showAdminLink={false} />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to={localizedPath('/')}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-magenta mb-8 transition-colors"
          >
            <ArrowLeft size={18} />
            {t('common.backToHome', 'Retour à l\'accueil')}
          </Link>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple to-magenta px-8 py-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Shield size={28} />
                <h1 className="text-2xl font-bold">{t('privacy.title', 'Politique de Confidentialité')}</h1>
              </div>
              <p className="text-white/80 text-sm">
                {t('privacy.lastUpdate', 'Dernière mise à jour')} : {t('privacy.date', 'Janvier 2025')}
              </p>
            </div>

            {/* Content */}
            <div className="px-8 py-8 space-y-8">
              {/* Introduction */}
              <section>
                <p className="text-gray-600 leading-relaxed">
                  {country?.companyName || 'BUSMOOV SAS'} {t('privacy.intro', '(ci-après "nous", "notre" ou "Busmoov") s\'engage à protéger la vie privée des utilisateurs de son site web. Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD).')}
                </p>
              </section>

              {/* Responsable du traitement */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('privacy.controller.title', '1. Responsable du traitement')}</h2>
                <div className="bg-gray-50 rounded-lg p-6 space-y-2">
                  <p className="text-gray-700"><strong>{country?.companyName || 'BUSMOOV SAS'}</strong></p>
                  <p className="text-gray-700">{country?.address || '41 Rue Barrault'}, {country?.city || '75013 Paris'}</p>
                  <p className="text-gray-700">{t('privacy.controller.registration', 'SIRET')} : {country?.siret || '853 867 703 00029'}</p>
                  <p className="text-gray-700">{t('privacy.controller.email', 'Email')} : <a href={`mailto:${country?.email || 'infos@busmoov.com'}`} className="text-magenta hover:underline">{country?.email || 'infos@busmoov.com'}</a></p>
                </div>
              </section>

              {/* Données collectées */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('privacy.dataCollected.title', '2. Données personnelles collectées')}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {t('privacy.dataCollected.intro', 'Nous collectons les données personnelles suivantes :')}
                </p>

                <h3 className="font-semibold text-gray-800 mb-2">{t('privacy.dataCollected.quote.title', 'Lors d\'une demande de devis :')}</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4 mb-4">
                  <li>{t('privacy.dataCollected.quote.name', 'Nom et prénom')}</li>
                  <li>{t('privacy.dataCollected.quote.email', 'Adresse email')}</li>
                  <li>{t('privacy.dataCollected.quote.phone', 'Numéro de téléphone')}</li>
                  <li>{t('privacy.dataCollected.quote.address', 'Adresse postale (pour la facturation)')}</li>
                  <li>{t('privacy.dataCollected.quote.trip', 'Informations sur le voyage (dates, lieux, nombre de passagers)')}</li>
                </ul>

                <h3 className="font-semibold text-gray-800 mb-2">{t('privacy.dataCollected.booking.title', 'Lors d\'une réservation :')}</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4 mb-4">
                  <li>{t('privacy.dataCollected.booking.passengers', 'Données d\'identification des passagers')}</li>
                  <li>{t('privacy.dataCollected.booking.payment', 'Informations de paiement (traitées de manière sécurisée par notre prestataire)')}</li>
                  <li>{t('privacy.dataCollected.booking.extra', 'Informations complémentaires sur le voyage (contacts sur place, besoins spécifiques)')}</li>
                </ul>

                <h3 className="font-semibold text-gray-800 mb-2">{t('privacy.dataCollected.navigation.title', 'Données de navigation :')}</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li>{t('privacy.dataCollected.navigation.ip', 'Adresse IP')}</li>
                  <li>{t('privacy.dataCollected.navigation.browser', 'Type de navigateur et système d\'exploitation')}</li>
                  <li>{t('privacy.dataCollected.navigation.pages', 'Pages visitées et temps passé sur le site')}</li>
                </ul>
              </section>

              {/* Finalités */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('privacy.purposes.title', '3. Finalités du traitement')}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {t('privacy.purposes.intro', 'Vos données personnelles sont collectées pour les finalités suivantes :')}
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li><strong>{t('privacy.purposes.quotes', 'Gestion des demandes de devis')}</strong> : {t('privacy.purposes.quotesDesc', 'traitement de vos demandes et élaboration de propositions commerciales')}</li>
                  <li><strong>{t('privacy.purposes.bookings', 'Gestion des réservations')}</strong> : {t('privacy.purposes.bookingsDesc', 'exécution du contrat de transport, coordination avec les transporteurs')}</li>
                  <li><strong>{t('privacy.purposes.billing', 'Facturation et paiement')}</strong> : {t('privacy.purposes.billingDesc', 'émission de factures, gestion des paiements')}</li>
                  <li><strong>{t('privacy.purposes.support', 'Service client')}</strong> : {t('privacy.purposes.supportDesc', 'réponse à vos questions, suivi de votre dossier')}</li>
                  <li><strong>{t('privacy.purposes.communication', 'Communication')}</strong> : {t('privacy.purposes.communicationDesc', 'envoi d\'informations relatives à votre réservation')}</li>
                  <li><strong>{t('privacy.purposes.improvement', 'Amélioration de nos services')}</strong> : {t('privacy.purposes.improvementDesc', 'analyse statistique anonymisée')}</li>
                  <li><strong>{t('privacy.purposes.legal', 'Obligations légales')}</strong> : {t('privacy.purposes.legalDesc', 'respect de nos obligations comptables et fiscales')}</li>
                </ul>
              </section>

              {/* Durée de conservation */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('privacy.retention.title', '4. Durée de conservation')}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {t('privacy.retention.intro', 'Vos données personnelles sont conservées pendant les durées suivantes :')}
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li><strong>{t('privacy.retention.booking', 'Données de réservation')}</strong> : {t('privacy.retention.bookingDuration', '10 ans après la fin du contrat (obligations comptables)')}</li>
                  <li><strong>{t('privacy.retention.quotes', 'Demandes de devis non converties')}</strong> : {t('privacy.retention.quotesDuration', '3 ans après le dernier contact')}</li>
                  <li><strong>{t('privacy.retention.navigation', 'Données de navigation')}</strong> : {t('privacy.retention.navigationDuration', '13 mois maximum')}</li>
                </ul>
              </section>

              {/* Vos droits */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('privacy.rights.title', '5. Vos droits')}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {t('privacy.rights.intro', 'Conformément au RGPD, vous disposez des droits suivants :')}
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li><strong>{t('privacy.rights.access', 'Droit d\'accès')}</strong> : {t('privacy.rights.accessDesc', 'obtenir la confirmation que vos données sont traitées et en recevoir une copie')}</li>
                  <li><strong>{t('privacy.rights.rectification', 'Droit de rectification')}</strong> : {t('privacy.rights.rectificationDesc', 'faire corriger vos données inexactes ou incomplètes')}</li>
                  <li><strong>{t('privacy.rights.erasure', 'Droit à l\'effacement')}</strong> : {t('privacy.rights.erasureDesc', 'demander la suppression de vos données dans certains cas')}</li>
                  <li><strong>{t('privacy.rights.restriction', 'Droit à la limitation')}</strong> : {t('privacy.rights.restrictionDesc', 'demander la suspension du traitement dans certains cas')}</li>
                  <li><strong>{t('privacy.rights.portability', 'Droit à la portabilité')}</strong> : {t('privacy.rights.portabilityDesc', 'recevoir vos données dans un format structuré')}</li>
                  <li><strong>{t('privacy.rights.objection', 'Droit d\'opposition')}</strong> : {t('privacy.rights.objectionDesc', 'vous opposer au traitement pour des raisons tenant à votre situation particulière')}</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-4">
                  {t('privacy.rights.exercise', 'Pour exercer ces droits, contactez-nous à')}{' '}
                  <a href={`mailto:${country?.email || 'infos@busmoov.com'}`} className="text-magenta hover:underline">{country?.email || 'infos@busmoov.com'}</a>.
                </p>
              </section>

              {/* Sécurité */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('privacy.security.title', '6. Sécurité des données')}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {t('privacy.security.intro', 'Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles :')}
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>{t('privacy.security.https', 'Chiffrement des données en transit (HTTPS/TLS)')}</li>
                  <li>{t('privacy.security.encryption', 'Chiffrement des données au repos')}</li>
                  <li>{t('privacy.security.access', 'Accès restreint aux données sur la base du besoin d\'en connaître')}</li>
                  <li>{t('privacy.security.auth', 'Authentification sécurisée')}</li>
                  <li>{t('privacy.security.backup', 'Sauvegardes régulières')}</li>
                </ul>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('privacy.contact.title', '7. Contact')}</h2>
                <p className="text-gray-600 leading-relaxed">
                  {t('privacy.contact.intro', 'Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, contactez-nous :')}
                </p>
                <ul className="mt-4 space-y-2 text-gray-600">
                  <li><strong>{t('privacy.contact.byEmail', 'Par email')} :</strong> <a href={`mailto:${country?.email || 'infos@busmoov.com'}`} className="text-magenta hover:underline">{country?.email || 'infos@busmoov.com'}</a></li>
                  <li><strong>{t('privacy.contact.byPhone', 'Par téléphone')} :</strong> {country?.phoneDisplay || '01 76 31 12 83'}</li>
                  <li><strong>{t('privacy.contact.byMail', 'Par courrier')} :</strong> {country?.companyName || 'BUSMOOV SAS'} - {t('privacy.contact.dataProtection', 'Protection des données')}, {country?.address || '41 Rue Barrault'}, {country?.city || '75013 Paris'}</li>
                </ul>
              </section>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 text-center">
                {t('privacy.seeAlso', 'Voir aussi nos')}{' '}
                <Link to="/mentions-legales" className="text-magenta hover:underline">
                  {t('privacy.legalNotice', 'Mentions légales')}
                </Link>
                {' '}{t('common.and', 'et')}{' '}
                <Link to="/cgv" className="text-magenta hover:underline">
                  {t('privacy.terms', 'Conditions Générales de Vente')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
