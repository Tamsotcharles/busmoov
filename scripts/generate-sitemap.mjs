import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { seoLocalizedPaths, SEO_BASE_URL } from '../src/lib/seo-data.ts'
import { villes } from '../src/lib/villes.ts'
import { articles } from '../src/lib/blog.ts'

/**
 * Génère public/sitemap.xml : pages multilingues (slugs localisés par
 * langue, avec alternates hreflang) + pages françaises (villes, blog,
 * location-bus). Branché sur `npm run build` (via node --experimental-
 * strip-types pour importer les fichiers de données TypeScript).
 */

const BASE_URL = SEO_BASE_URL
const LANGUAGES = ['fr', 'es', 'de', 'en']
const X_DEFAULT_LANG = 'fr'

// [clé seo-data, priorité, fréquence]
const PAGES = [
  ['home', '1.0', 'weekly'],
  ['location-autocar', '0.9', 'monthly'],
  ['location-minibus', '0.9', 'monthly'],
  ['transfert-aeroport', '0.9', 'monthly'],
  ['sorties-scolaires', '0.9', 'monthly'],
  ['a-propos', '0.6', 'monthly'],
  ['contact', '0.6', 'monthly'],
  ['devenir-partenaire', '0.7', 'monthly'],
  ['cgv', '0.3', 'yearly'],
  ['mentions-legales', '0.3', 'yearly'],
  ['confidentialite', '0.3', 'yearly'],
]

// Pages françaises uniquement : pas d'alternates hreflang
const PAGES_FR_ONLY = [
  ['/location-bus', '0.9', 'monthly'],
  ...villes.map((v) => [`/location-autocar/${v.slug}`, '0.8', 'monthly']),
  ['/blog', '0.7', 'weekly'],
  ...articles.map((a) => [`/blog/${a.slug}`, '0.7', 'monthly']),
]

const urlFor = (lang, path) => (path === '/' ? `${BASE_URL}/${lang}` : `${BASE_URL}/${lang}${path}`)
const hreflangCode = (lang) => (lang === 'en' ? 'en-GB' : lang)

const lastmod = new Date().toISOString().slice(0, 10)
const entries = []

for (const [page, priority, changefreq] of PAGES) {
  const paths = seoLocalizedPaths[page]
  for (const lang of LANGUAGES) {
    const alternates = [
      ...LANGUAGES.map(
        (l) => `    <xhtml:link rel="alternate" hreflang="${hreflangCode(l)}" href="${urlFor(l, paths[l])}"/>`
      ),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor(X_DEFAULT_LANG, paths[X_DEFAULT_LANG])}"/>`,
    ].join('\n')

    entries.push(`  <url>
    <loc>${urlFor(lang, paths[lang])}</loc>
${alternates}
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`)
  }
}

for (const [path, priority, changefreq] of PAGES_FR_ONLY) {
  entries.push(`  <url>
    <loc>${urlFor('fr', path)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`)
}

// Landing chinoise autonome (chemin racine, sans préfixe de langue)
entries.push(`  <url>
    <loc>${BASE_URL}/zh</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`)

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`

const outPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sitemap.xml')
writeFileSync(outPath, xml)
console.log(`sitemap.xml généré : ${entries.length} URLs (${PAGES.length} pages × ${LANGUAGES.length} langues + ${PAGES_FR_ONLY.length} pages FR)`)
