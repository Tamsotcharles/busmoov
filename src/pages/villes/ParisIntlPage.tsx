import { useTranslation } from 'react-i18next'
import { PageDestination } from '@/components/seo/PageDestination'
import { parisIntl } from '@/lib/paris-intl'

/**
 * Location d'autocar à Paris en anglais, allemand et espagnol
 * (src/lib/paris-intl.ts). La version française est la page ville
 * /fr/location-autocar/paris.
 */
export function ParisIntlPage() {
  const { i18n } = useTranslation()
  const lang = (['es', 'de', 'en'].includes(i18n.language) ? i18n.language : 'en') as 'en' | 'de' | 'es'
  return <PageDestination page="ville-paris" contenu={parisIntl[lang]} />
}
