import { useTranslation } from 'react-i18next'
import { PageDestination } from '@/components/seo/PageDestination'
import { chateauxLoire } from '@/lib/chateaux-loire'
import type { SeoLanguage } from '@/lib/seo-data'

/**
 * Page « location d'autocar pour les châteaux de la Loire », une URL et un
 * contenu propres à chaque langue (src/lib/chateaux-loire.ts), reliées par
 * hreflang via la clé SEO « chateaux-loire ».
 */
export function ChateauxLoirePage() {
  const { i18n } = useTranslation()
  const lang = (['fr', 'es', 'de', 'en'].includes(i18n.language) ? i18n.language : 'fr') as SeoLanguage
  return <PageDestination page="chateaux-loire" contenu={chateauxLoire[lang]} />
}
