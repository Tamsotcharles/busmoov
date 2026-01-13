import { Link } from 'react-router-dom'
import { ArrowLeft, Scale } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useCurrentCountry, useCurrentCountryContent } from '@/hooks/useCountrySettings'
import { useLocalizedPath } from '@/components/i18n'
import DOMPurify from 'dompurify'

export function MentionsLegalesPage() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const { data: country, isLoading: loadingCountry } = useCurrentCountry()
  const { data: customContent, isLoading: loadingContent } = useCurrentCountryContent('mentions_legales')

  // Fonction de rendu markdown simple
  const renderMarkdown = (text: string): string => {
    return text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-800">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-4 text-gray-900">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4 text-gray-900">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold">$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Lists
      .replace(/^\- (.*$)/gim, '<li class="ml-6 list-disc text-gray-600">$1</li>')
      // Horizontal rule
      .replace(/^---$/gim, '<hr class="my-8 border-gray-200"/>')
      // Paragraphs (double newline)
      .replace(/\n\n/g, '</p><p class="mb-4 text-gray-600 leading-relaxed">')
      // Line breaks
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
                  <Scale size={28} />
                  <h1 className="text-2xl font-bold">{customContent.title || t('legal.title', 'Mentions Légales')}</h1>
                </div>
                {customContent.updatedAt && (
                  <p className="text-white/80 text-sm">
                    {t('legal.lastUpdate', 'Dernière mise à jour')} : {new Date(customContent.updatedAt).toLocaleDateString()}
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
                  {t('legal.seeAlso', 'Voir aussi notre')}{' '}
                  <Link to="/confidentialite" className="text-magenta hover:underline">
                    {t('legal.privacyPolicy', 'Politique de confidentialité')}
                  </Link>
                  {' '}{t('common.and', 'et')}{' '}
                  <Link to="/cgv" className="text-magenta hover:underline">
                    {t('legal.terms', 'Conditions Générales de Vente')}
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
                <Scale size={28} />
                <h1 className="text-2xl font-bold">{t('legal.title', 'Mentions Légales')}</h1>
              </div>
              <p className="text-white/80 text-sm">
                {t('legal.lastUpdate', 'Dernière mise à jour')} : {t('legal.date', 'Janvier 2025')}
              </p>
            </div>

            {/* Content */}
            <div className="px-8 py-8 space-y-8">
              {/* Editeur du site */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('legal.publisher.title', '1. Éditeur du site')}</h2>
                <div className="bg-gray-50 rounded-lg p-6 space-y-2">
                  <p className="text-gray-700"><strong>{t('legal.publisher.companyName', 'Raison sociale')} :</strong> {country?.companyName || 'BUSMOOV SAS'}</p>
                  <p className="text-gray-700"><strong>{t('legal.publisher.brand', 'Marque du groupe')} :</strong> Centrale Autocar</p>
                  <p className="text-gray-700"><strong>{t('legal.publisher.legalForm', 'Forme juridique')} :</strong> {t(`legal.publisher.legalFormValue.${country?.code || 'FR'}`, 'Société par Actions Simplifiée (SAS)')}</p>
                  <p className="text-gray-700"><strong>{t('legal.publisher.capital', 'Capital social')} :</strong> {t(`legal.publisher.capitalValue.${country?.code || 'FR'}`, '2 500 €')}</p>
                  <p className="text-gray-700"><strong>{t('legal.publisher.address', 'Siège social')} :</strong> {country?.address || '41 Rue Barrault'}, {country?.city || '75013 Paris'}</p>
                  <p className="text-gray-700"><strong>{t('legal.publisher.registrationNumber', 'SIRET')} :</strong> {country?.siret || '853 867 703 00029'}</p>
                  <p className="text-gray-700"><strong>{t('legal.publisher.vatNumber', 'N° TVA Intracommunautaire')} :</strong> {country?.tvaIntra || 'FR58853867703'}</p>
                  <p className="text-gray-700"><strong>{t('legal.publisher.phone', 'Téléphone')} :</strong> {country?.phoneDisplay || '01 76 31 12 83'}</p>
                  <p className="text-gray-700"><strong>{t('legal.publisher.email', 'Email')} :</strong> <a href={`mailto:${country?.email || 'infos@busmoov.com'}`} className="text-magenta hover:underline">{country?.email || 'infos@busmoov.com'}</a></p>
                </div>
              </section>

              {/* Directeur de publication */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('legal.publicationDirector.title', '2. Directeur de la publication')}</h2>
                <p className="text-gray-600 leading-relaxed">
                  {t('legal.publicationDirector.content', 'Le directeur de la publication est le représentant légal de la société.')} {country?.companyName || 'BUSMOOV SAS'}.
                </p>
              </section>

              {/* Hébergement */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('legal.hosting.title', '3. Hébergement')}</h2>
                <div className="bg-gray-50 rounded-lg p-6 space-y-2">
                  <p className="text-gray-700"><strong>{t('legal.hosting.provider', 'Hébergeur')} :</strong> Vercel Inc.</p>
                  <p className="text-gray-700"><strong>{t('legal.hosting.address', 'Adresse')} :</strong> 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</p>
                  <p className="text-gray-700"><strong>{t('legal.hosting.website', 'Site web')} :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-magenta hover:underline">vercel.com</a></p>
                </div>
              </section>

              {/* Propriété intellectuelle */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('legal.ip.title', '4. Propriété intellectuelle')}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {t('legal.ip.content1', 'L\'ensemble du contenu de ce site (textes, images, vidéos, logos, graphismes, icônes, etc.) est la propriété exclusive de')} {country?.companyName || 'BUSMOOV SAS'} {t('legal.ip.content1b', 'ou de ses partenaires, et est protégé par les lois relatives à la propriété intellectuelle.')}
                </p>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {t('legal.ip.content2', 'Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable.')}
                </p>
              </section>

              {/* Responsabilité */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('legal.liability.title', '5. Responsabilité')}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {country?.companyName || 'BUSMOOV SAS'} {t('legal.liability.content1', 's\'efforce d\'assurer l\'exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, nous ne pouvons garantir l\'exactitude, la précision ou l\'exhaustivité des informations mises à disposition sur ce site.')}
                </p>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {country?.companyName || 'BUSMOOV SAS'} {t('legal.liability.disclaims', 'décline toute responsabilité :')}
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>{t('legal.liability.item1', 'Pour toute interruption du site')}</li>
                  <li>{t('legal.liability.item2', 'Pour toute survenance de bogues')}</li>
                  <li>{t('legal.liability.item3', 'Pour toute inexactitude ou omission portant sur des informations disponibles sur le site')}</li>
                  <li>{t('legal.liability.item4', 'Pour tout dommage résultant d\'une intrusion frauduleuse d\'un tiers')}</li>
                  <li>{t('legal.liability.item5', 'Pour tout dommage causé à un utilisateur ou à un tiers du fait de l\'utilisation du site')}</li>
                </ul>
              </section>

              {/* Liens hypertextes */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('legal.links.title', '6. Liens hypertextes')}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {t('legal.links.content1', 'Le site peut contenir des liens hypertextes vers d\'autres sites.')} {country?.companyName || 'BUSMOOV SAS'} {t('legal.links.content1b', 'n\'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu ou aux produits et services qu\'ils proposent.')}
                </p>
                <p className="text-gray-600 leading-relaxed">
                  {t('legal.links.content2', 'La création de liens hypertextes vers notre site est soumise à accord préalable.')}
                </p>
              </section>

              {/* Droit applicable */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('legal.law.title', '7. Droit applicable et juridiction')}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {t(`legal.law.content.${country?.code || 'FR'}`, 'Les présentes mentions légales sont régies par le droit français. En cas de litige, et à défaut de résolution amiable, les tribunaux français seront seuls compétents.')}
                </p>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('legal.contact.title', '8. Contact')}</h2>
                <p className="text-gray-600 leading-relaxed">
                  {t('legal.contact.content', 'Pour toute question relative aux présentes mentions légales ou pour exercer vos droits, vous pouvez nous contacter :')}
                </p>
                <ul className="mt-4 space-y-2 text-gray-600">
                  <li><strong>{t('legal.contact.byEmail', 'Par email')} :</strong> <a href={`mailto:${country?.email || 'infos@busmoov.com'}`} className="text-magenta hover:underline">{country?.email || 'infos@busmoov.com'}</a></li>
                  <li><strong>{t('legal.contact.byPhone', 'Par téléphone')} :</strong> {country?.phoneDisplay || '01 76 31 12 83'}</li>
                  <li><strong>{t('legal.contact.byMail', 'Par courrier')} :</strong> {country?.companyName || 'BUSMOOV SAS'}, {country?.address || '41 Rue Barrault'}, {country?.city || '75013 Paris'}</li>
                </ul>
              </section>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 text-center">
                {t('legal.seeAlso', 'Voir aussi notre')}{' '}
                <Link to="/confidentialite" className="text-magenta hover:underline">
                  {t('legal.privacyPolicy', 'Politique de confidentialité')}
                </Link>
                {' '}{t('common.and', 'et')}{' '}
                <Link to="/cgv" className="text-magenta hover:underline">
                  {t('legal.terms', 'Conditions Générales de Vente')}
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
