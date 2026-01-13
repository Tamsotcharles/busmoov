import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLocalizedPath } from '@/components/i18n'
import { useCurrentCountry } from '@/hooks/useCountrySettings'

export function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()
  const { data: country } = useCurrentCountry()
  const localizedPath = useLocalizedPath()

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo-icon.svg" alt="Busmoov" className="w-10 h-10" />
              <span className="font-display text-xl font-bold gradient-text">
                Busmoov
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              {t('footer.description')}
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.services')}</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to={localizedPath('/services/location-autocar')} className="hover:text-magenta transition-colors">{t('footer.busRental')}</Link></li>
              <li><Link to={localizedPath('/services/location-minibus')} className="hover:text-magenta transition-colors">{t('footer.minibusRental')}</Link></li>
              <li><Link to={localizedPath('/services/transfert-aeroport')} className="hover:text-magenta transition-colors">{t('footer.airportTransfer')}</Link></li>
              <li><Link to={localizedPath('/services/sorties-scolaires')} className="hover:text-magenta transition-colors">{t('footer.schoolTrips')}</Link></li>
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.company')}</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to={localizedPath('/a-propos')} className="hover:text-magenta transition-colors">{t('footer.about')}</Link></li>
              <li><Link to={localizedPath('/devenir-partenaire')} className="hover:text-magenta transition-colors">{t('footer.becomePartner')}</Link></li>
              <li><Link to={localizedPath('/contact')} className="hover:text-magenta transition-colors">{t('nav.contact')}</Link></li>
              <li><Link to={localizedPath('/cgv')} className="hover:text-magenta transition-colors">{t('footer.termsLink')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.contact')}</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href={`tel:${country?.phone || '+33176311283'}`} className="hover:text-magenta transition-colors">{country?.phoneDisplay || '01 76 31 12 83'}</a></li>
              <li><a href={`mailto:${country?.email || 'infos@busmoov.com'}`} className="hover:text-magenta transition-colors">{country?.email || 'infos@busmoov.com'}</a></li>
              <li>{t('footer.hours')}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>{t('footer.copyright', { year: currentYear })} <a href="https://www.centrale-autocar.com" className="text-magenta hover:underline">Centrale Autocar</a>. {t('footer.allRightsReserved')}</p>
          <div className="flex gap-4">
            <Link to={localizedPath('/mentions-legales')} className="hover:text-magenta transition-colors">{t('footer.legalLink')}</Link>
            <span>·</span>
            <Link to={localizedPath('/cgv')} className="hover:text-magenta transition-colors">{t('footer.termsLink')}</Link>
            <span>·</span>
            <Link to={localizedPath('/confidentialite')} className="hover:text-magenta transition-colors">{t('footer.privacyLink')}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
