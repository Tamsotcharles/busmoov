import { supportedLanguages, type SupportedLanguage } from '@/lib/i18n'
import { getSiteBaseUrl } from '@/lib/utils'
import { seoConfig, seoPaths, ogLocales, type SeoPageKey } from '@/lib/seo-data'

/**
 * Fonctions SEO. Les données (titres, descriptions, chemins) vivent dans
 * seo-data.ts — fichier pur sans imports, partagé avec le script de
 * prérendu scripts/prerender.mjs.
 */

export { seoConfig, seoPaths, ogLocales }
export type { SeoPageKey }

/** URL canonique d'une page dans une langue donnée. */
export function getCanonicalUrl(page: SeoPageKey, lang: SupportedLanguage): string {
  const base = getSiteBaseUrl()
  const path = seoPaths[page]
  return path === '/' ? `${base}/${lang}` : `${base}/${lang}${path}`
}

/** Alternates hreflang (toutes langues + x-default vers le français). */
export function getHreflangAlternates(page: SeoPageKey): Array<{ hreflang: string; href: string }> {
  const alternates = supportedLanguages.map((lang) => ({
    hreflang: lang === 'en' ? 'en-GB' : lang,
    href: getCanonicalUrl(page, lang),
  }))
  alternates.push({ hreflang: 'x-default', href: getCanonicalUrl(page, 'fr') })
  return alternates
}
