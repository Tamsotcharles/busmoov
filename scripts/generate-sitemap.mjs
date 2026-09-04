import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/**
 * Génère public/sitemap.xml : pages publiques × langues, avec les
 * alternates hreflang. À relancer quand une page publique est ajoutée
 * (branché sur `npm run build`).
 */

const BASE_URL = 'https://www.busmoov.com'
const LANGUAGES = ['fr', 'es', 'de', 'en']
const X_DEFAULT_LANG = 'fr'

// [chemin sans préfixe de langue, priorité, fréquence]
const PAGES = [
  ['/', '1.0', 'weekly'],
  ['/services/location-autocar', '0.9', 'monthly'],
  ['/services/location-minibus', '0.9', 'monthly'],
  ['/services/transfert-aeroport', '0.9', 'monthly'],
  ['/services/sorties-scolaires', '0.9', 'monthly'],
  ['/a-propos', '0.6', 'monthly'],
  ['/contact', '0.6', 'monthly'],
  ['/devenir-partenaire', '0.7', 'monthly'],
  ['/cgv', '0.3', 'yearly'],
  ['/mentions-legales', '0.3', 'yearly'],
  ['/confidentialite', '0.3', 'yearly'],
]

// Pages françaises uniquement (pages villes) : pas d'alternates hreflang
const PAGES_FR_ONLY = [
  ['/location-autocar/paris', '0.8', 'monthly'],
  ['/location-autocar/lyon', '0.8', 'monthly'],
  ['/location-autocar/marseille', '0.8', 'monthly'],
  ['/location-autocar/toulouse', '0.8', 'monthly'],
  ['/location-autocar/bordeaux', '0.8', 'monthly'],
  ['/blog', '0.7', 'weekly'],
  ['/blog/prix-location-autocar', '0.7', 'monthly'],
  ['/blog/organiser-sortie-scolaire-autocar', '0.7', 'monthly'],
]

const urlFor = (lang, path) => (path === '/' ? `${BASE_URL}/${lang}` : `${BASE_URL}/${lang}${path}`)
const hreflangCode = (lang) => (lang === 'en' ? 'en-GB' : lang)

const lastmod = new Date().toISOString().slice(0, 10)
const entries = []

for (const [path, priority, changefreq] of PAGES) {
  for (const lang of LANGUAGES) {
    const alternates = [
      ...LANGUAGES.map(
        (l) => `    <xhtml:link rel="alternate" hreflang="${hreflangCode(l)}" href="${urlFor(l, path)}"/>`
      ),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor(X_DEFAULT_LANG, path)}"/>`,
    ].join('\n')

    entries.push(`  <url>
    <loc>${urlFor(lang, path)}</loc>
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

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`

const outPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sitemap.xml')
writeFileSync(outPath, xml)
console.log(`sitemap.xml généré : ${entries.length} URLs (${PAGES.length} pages × ${LANGUAGES.length} langues + ${PAGES_FR_ONLY.length} pages FR)`)
