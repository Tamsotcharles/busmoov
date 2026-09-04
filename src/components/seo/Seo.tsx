import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  seoConfig,
  ogLocales,
  getCanonicalUrl,
  getHreflangAlternates,
  type SeoPageKey,
} from '@/lib/seo'
import { getSiteBaseUrl } from '@/lib/utils'
import { defaultLanguage, supportedLanguages, type SupportedLanguage } from '@/lib/i18n'

interface SeoProps {
  page: SeoPageKey
  /** Surcharge ponctuelle du titre (sinon celui de seoConfig). */
  title?: string
  /** Surcharge ponctuelle de la description. */
  description?: string
  /** Donnée structurée prête à l'emploi : Organization (accueil) ou Service. */
  jsonLdPreset?: 'organization' | 'service'
  /** Données structurées JSON-LD sur mesure (objet unique ou tableau). */
  jsonLd?: object | object[]
}

/**
 * Balises SEO d'une page publique. React 19 hisse nativement <title>,
 * <meta> et <link> dans le <head> — aucune librairie nécessaire.
 * Le JSON-LD reste dans le body, ce que Google accepte.
 */
export function Seo({ page, title, description, jsonLdPreset, jsonLd }: SeoProps) {
  const { i18n } = useTranslation()
  const rawLang = i18n.language?.split('-')[0]
  const lang: SupportedLanguage = supportedLanguages.includes(rawLang as SupportedLanguage)
    ? (rawLang as SupportedLanguage)
    : defaultLanguage

  const meta = seoConfig[page][lang]
  const pageTitle = title ?? meta.title
  const pageDescription = description ?? meta.description
  const canonical = getCanonicalUrl(page, lang)
  const alternates = getHreflangAlternates(page)
  const ogImage = `${getSiteBaseUrl()}/logo.svg`

  // L'attribut lang de <html> est hors de l'arbre React : synchro manuelle.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const jsonLdBlocks: object[] = []
  if (jsonLdPreset === 'organization') jsonLdBlocks.push(organizationJsonLd(lang))
  if (jsonLdPreset === 'service') jsonLdBlocks.push(serviceJsonLd(page, lang))
  if (jsonLd) jsonLdBlocks.push(...(Array.isArray(jsonLd) ? jsonLd : [jsonLd]))

  return (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <link rel="canonical" href={canonical} />
      {alternates.map(({ hreflang, href }) => (
        <link key={hreflang} rel="alternate" hrefLang={hreflang} href={href} />
      ))}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Busmoov" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content={ogLocales[lang]} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      {jsonLdBlocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  )
}

interface SeoFrProps {
  /** Titre complet de la page (avec | Busmoov). */
  title: string
  description: string
  /** Chemin sans préfixe de langue, ex. /location-autocar/paris */
  path: string
  jsonLd?: object | object[]
}

/**
 * Balises SEO d'une page existant uniquement en français (pages villes).
 * Canonical sur /fr, pas d'alternates hreflang puisqu'il n'y a pas de
 * version traduite.
 */
export function SeoFr({ title, description, path, jsonLd }: SeoFrProps) {
  const canonical = `${getSiteBaseUrl()}/fr${path}`
  const ogImage = `${getSiteBaseUrl()}/logo.svg`

  useEffect(() => {
    document.documentElement.lang = 'fr'
  }, [])

  const jsonLdBlocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Busmoov" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="fr_FR" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {jsonLdBlocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  )
}

/** JSON-LD Organization — à poser sur la page d'accueil. */
export function organizationJsonLd(lang: SupportedLanguage): object {
  const base = getSiteBaseUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Busmoov',
    url: `${base}/${lang}`,
    logo: `${base}/logo.svg`,
    description: seoConfig.home[lang].description,
  }
}

/** JSON-LD Service — à poser sur les pages services. */
export function serviceJsonLd(page: SeoPageKey, lang: SupportedLanguage): object {
  const meta = seoConfig[page][lang]
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: meta.title.split('|')[0].trim(),
    description: meta.description,
    url: getCanonicalUrl(page, lang),
    provider: {
      '@type': 'Organization',
      name: 'Busmoov',
      url: getSiteBaseUrl(),
    },
  }
}
