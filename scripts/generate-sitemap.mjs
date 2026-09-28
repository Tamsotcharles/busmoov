import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { seoConfig, seoLocalizedPaths, locationBusMeta, SEO_BASE_URL } from '../src/lib/seo-data.ts'
import { villes } from '../src/lib/villes.ts'
import { articles } from '../src/lib/blog.ts'
import { landings } from '../src/lib/landings.ts'

/**
 * Génère public/sitemap.xml : pages multilingues (slugs localisés par
 * langue, avec alternates hreflang) + pages françaises (villes, blog,
 * location-bus, landings) + landing /zh. Branché sur `npm run build` (via
 * node --experimental-strip-types pour importer les fichiers de données
 * TypeScript).
 *
 * <lastmod> = date de dernière modification RÉELLE du contenu de chaque
 * page, pas la date du build. On calcule une empreinte (hash) du contenu
 * de chaque URL et on la compare à scripts/sitemap-lastmod.json :
 * - empreinte inchangée : on garde la date enregistrée ;
 * - empreinte modifiée ou URL nouvelle : date du jour (date de publication
 *   pour un nouvel article de blog), et le manifeste est mis à jour.
 * Le manifeste doit être commité avec le contenu modifié (Vercel ne
 * conserve pas les fichiers écrits pendant le build). `--check` échoue
 * s'il n'est pas à jour : c'est ce que vérifie la CI.
 *
 * Pas de <changefreq> ni de <priority> : Google les ignore.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const MANIFEST_PATH = join(ROOT, 'scripts', 'sitemap-lastmod.json')
const CHECK = process.argv.includes('--check')

const BASE_URL = SEO_BASE_URL
const LANGUAGES = ['fr', 'es', 'de', 'en']
const X_DEFAULT_LANG = 'fr'

// Page multilingue → composant React qui porte son contenu
const PAGE_SOURCES = {
  'home': 'src/pages/HomePage.tsx',
  'location-autocar': 'src/pages/services/LocationAutocarPage.tsx',
  'location-minibus': 'src/pages/services/LocationMinibusPage.tsx',
  'transfert-aeroport': 'src/pages/services/TransfertAeroportPage.tsx',
  'sorties-scolaires': 'src/pages/services/SortiesScolairesPage.tsx',
  'a-propos': 'src/pages/AProposPage.tsx',
  'contact': 'src/pages/ContactPage.tsx',
  'devenir-partenaire': 'src/pages/DevenirPartenairePage.tsx',
  'cgv': 'src/pages/CGVPage.tsx',
  'mentions-legales': 'src/pages/MentionsLegalesPage.tsx',
  'confidentialite': 'src/pages/ConfidentialitePage.tsx',
}

const read = (path) => readFileSync(join(ROOT, path), 'utf8')
const hash = (...parts) => createHash('sha1').update(parts.map((p) => (typeof p === 'string' ? p : JSON.stringify(p))).join('\n')).digest('hex').slice(0, 12)
const urlFor = (lang, path) => (path === '/' ? `${BASE_URL}/${lang}` : `${BASE_URL}/${lang}${path}`)
const hreflangCode = (lang) => (lang === 'en' ? 'en-GB' : lang)

// ---- Liste des URLs avec l'empreinte de leur contenu -----------------------
// { loc, hash, alternates?, publishedOn? }
const pages = []

for (const [page, source] of Object.entries(PAGE_SOURCES)) {
  const paths = seoLocalizedPaths[page]
  const component = read(source)
  const alternates = [
    ...LANGUAGES.map((l) => ({ hreflang: hreflangCode(l), href: urlFor(l, paths[l]) })),
    { hreflang: 'x-default', href: urlFor(X_DEFAULT_LANG, paths[X_DEFAULT_LANG]) },
  ]
  for (const lang of LANGUAGES) {
    pages.push({
      loc: urlFor(lang, paths[lang]),
      hash: hash(component, read(`src/locales/${lang}/common.json`), seoConfig[page][lang]),
      alternates,
    })
  }
}

// Pages françaises uniquement : pas d'alternates hreflang
pages.push({
  loc: urlFor('fr', '/location-bus'),
  hash: hash(read('src/pages/services/LocationBusPage.tsx'), locationBusMeta),
})
for (const landing of landings) {
  pages.push({ loc: urlFor('fr', landing.slug), hash: hash(landing) })
}
for (const ville of villes) {
  pages.push({ loc: urlFor('fr', `/location-autocar/${ville.slug}`), hash: hash(ville) })
}
pages.push({
  loc: urlFor('fr', '/blog'),
  hash: hash(articles.map((a) => [a.slug, a.titre, a.extrait])),
})
for (const article of articles) {
  pages.push({
    loc: urlFor('fr', `/blog/${article.slug}`),
    hash: hash(article),
    publishedOn: article.datePublication,
  })
}

// Landing chinoise autonome (chemin racine, sans préfixe de langue)
pages.push({ loc: `${BASE_URL}/zh`, hash: hash(read('src/lib/zh-landing.ts')) })

// ---- Dates de dernière modification ---------------------------------------
const previous = existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) : {}
const today = new Date().toISOString().slice(0, 10)
const manifest = {}
const changed = []

for (const p of pages) {
  const known = previous[p.loc]
  if (known && known.hash === p.hash) {
    manifest[p.loc] = known
  } else {
    manifest[p.loc] = { hash: p.hash, lastmod: known ? today : (p.publishedOn ?? today) }
    changed.push(p.loc)
  }
}
const removed = Object.keys(previous).filter((loc) => !(loc in manifest))

if (CHECK) {
  if (changed.length || removed.length) {
    console.error('scripts/sitemap-lastmod.json n\'est pas à jour. Lancer `npm run seo:sitemap` puis committer le manifeste.')
    for (const loc of changed) console.error(`  modifiée : ${loc}`)
    for (const loc of removed) console.error(`  supprimée : ${loc}`)
    process.exit(1)
  }
  console.log(`sitemap-lastmod.json à jour (${pages.length} URLs)`)
  process.exit(0)
}

// ---- Écriture -------------------------------------------------------------
const entries = pages.map((p) => {
  const alternates = (p.alternates ?? [])
    .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>\n`)
    .join('')
  return `  <url>
    <loc>${p.loc}</loc>
${alternates}    <lastmod>${manifest[p.loc].lastmod}</lastmod>
  </url>`
})

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`

writeFileSync(join(ROOT, 'public', 'sitemap.xml'), xml)
writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n')
console.log(`sitemap.xml généré : ${pages.length} URLs`)
if (changed.length || removed.length) {
  console.warn(`sitemap-lastmod.json mis à jour (${changed.length} modifiée(s), ${removed.length} supprimée(s)) : à committer avec le contenu.`)
}
