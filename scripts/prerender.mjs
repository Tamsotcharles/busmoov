import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
// Node >= 23.6 exécute le TypeScript nativement (type stripping) :
// on importe les données directement depuis src/.
import { seoConfig, seoPaths, locationBusMeta } from '../src/lib/seo-data.ts'
import { villes } from '../src/lib/villes.ts'
import { articles } from '../src/lib/blog.ts'

/**
 * Prérendu statique des pages publiques, SANS navigateur headless :
 * tout le contenu vit dans des fichiers de données (seo-data, villes,
 * blog), on génère donc le HTML directement.
 *
 * - Pages multilingues : head complet (title, description, canonical,
 *   hreflang, Open Graph) — le corps reste rendu par React.
 * - Pages FR (villes, blog, location-bus) : head complet + contenu
 *   réel dans #root. React remplace ce contenu au chargement ; les
 *   crawlers, eux, lisent tout sans exécuter de JavaScript.
 *
 * Vercel sert ces fichiers avant la règle de rewrite SPA
 * (filesystem d'abord), avec "cleanUrls": true pour que
 * /fr/location-autocar/paris serve paris.html sans slash final.
 */

const BASE_URL = 'https://www.busmoov.com'
const LANGUAGES = ['fr', 'es', 'de', 'en']
const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')

const template = readFileSync(join(DIST, 'index.html'), 'utf8')
if (!template.includes('<div id="root"></div>')) {
  throw new Error('dist/index.html ne contient pas <div id="root"></div> — gabarit inattendu, prérendu interrompu')
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const urlFor = (lang, path) => (path === '/' ? `${BASE_URL}/${lang}` : `${BASE_URL}/${lang}${path}`)
const hreflangCode = (lang) => (lang === 'en' ? 'en-GB' : lang)

let count = 0

function renderPage({ lang, path, title, description, alternates = null, jsonLd = [], body = '' }) {
  const canonical = urlFor(lang, path)
  let head = `<link rel="canonical" href="${canonical}"/>\n`
  if (alternates) {
    for (const l of LANGUAGES) {
      head += `<link rel="alternate" hreflang="${hreflangCode(l)}" href="${urlFor(l, path)}"/>\n`
    }
    head += `<link rel="alternate" hreflang="x-default" href="${urlFor('fr', path)}"/>\n`
  }
  head += `<meta property="og:title" content="${esc(title)}"/>\n`
  head += `<meta property="og:description" content="${esc(description)}"/>\n`
  head += `<meta property="og:url" content="${canonical}"/>\n`
  for (const block of jsonLd) {
    head += `<script type="application/ld+json">${JSON.stringify(block)}</script>\n`
  }

  let html = template
    .replace(/<html lang="[^"]*"/, `<html lang="${lang}"`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace('</head>', `${head}</head>`)
  if (body) {
    html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`)
  }

  const outPath = path === '/' ? join(DIST, `${lang}.html`) : join(DIST, lang, `${path.slice(1)}.html`)
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, html)
  count++
}

// Balisage minimal avec classes Tailwind (la feuille de style est déjà
// dans le head du gabarit) : lisible pendant le court instant avant que
// React remplace le contenu.
const wrap = (inner) => `<main class="max-w-3xl mx-auto px-4 pt-24 pb-16">${inner}</main>`
const h1 = (t) => `<h1 class="text-3xl font-bold mb-4">${esc(t)}</h1>`
const h2 = (t) => `<h2 class="text-2xl font-bold mt-8 mb-3">${esc(t)}</h2>`
const p = (t) => `<p class="text-gray-700 mb-3">${esc(t)}</p>`
const ul = (items) => `<ul class="list-disc pl-6 mb-3">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
const aVille = (v) => `<a class="text-magenta underline" href="/fr/location-autocar/${v.slug}">${esc(v.nom)}</a>`

// ---- Pages multilingues : head uniquement -------------------------------
for (const [page, path] of Object.entries(seoPaths)) {
  for (const lang of LANGUAGES) {
    const meta = seoConfig[page][lang]
    renderPage({ lang, path, title: meta.title, description: meta.description, alternates: true })
  }
}

// ---- Page pilier location-bus (FR) --------------------------------------
renderPage({
  lang: 'fr',
  path: '/location-bus',
  title: locationBusMeta.title,
  description: locationBusMeta.description,
  body: wrap(h1(locationBusMeta.h1) + p(locationBusMeta.sousTitre)),
})

// ---- Pages villes (FR, contenu complet) ---------------------------------
for (const ville of villes) {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: `Location d'autocar avec chauffeur à ${ville.nom}`,
      description: ville.metaDescription,
      url: urlFor('fr', `/location-autocar/${ville.slug}`),
      areaServed: { '@type': 'City', name: ville.nom },
      provider: { '@type': 'Organization', name: 'Busmoov', url: BASE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: ville.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ]
  const autres = villes.filter((v) => v.slug !== ville.slug).map(aVille).join(' · ')
  const body = wrap(
    h1(ville.h1) +
    p(ville.sousTitre) +
    ville.intro.map(p).join('') +
    h2(`Destinations populaires au départ de ${ville.nom}`) +
    ville.destinations.map((d) => `<h3 class="font-semibold mt-3">${esc(d.nom)}</h3>` + p(d.desc)).join('') +
    h2(`Exemples de trajets à ${ville.nom}`) +
    ul(ville.trajets) +
    h2('Questions fréquentes') +
    ville.faq.map((f) => `<h3 class="font-semibold mt-3">${esc(f.q)}</h3>` + p(f.a)).join('') +
    p('Busmoov également disponible à :') + `<p class="mb-3">${autres}</p>`
  )
  renderPage({
    lang: 'fr',
    path: `/location-autocar/${ville.slug}`,
    title: ville.metaTitle,
    description: ville.metaDescription,
    jsonLd,
    body,
  })
}

// ---- Blog (FR, contenu complet) -----------------------------------------
renderPage({
  lang: 'fr',
  path: '/blog',
  title: 'Blog Busmoov — Conseils location d\'autocar et transport de groupe',
  description: 'Prix, réglementation, organisation : les guides pratiques Busmoov pour réussir vos déplacements de groupe en autocar avec chauffeur.',
  body: wrap(
    h1('Le blog Busmoov') +
    articles.map((a) => `<h2 class="text-xl font-semibold mt-6 mb-1"><a class="text-magenta underline" href="/fr/blog/${a.slug}">${esc(a.titre)}</a></h2>` + p(a.extrait)).join('')
  ),
})

for (const article of articles) {
  const jsonLd = [{
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.titre,
    description: article.metaDescription,
    datePublished: article.datePublication,
    inLanguage: 'fr',
    url: urlFor('fr', `/blog/${article.slug}`),
    author: { '@type': 'Organization', name: 'Busmoov', url: BASE_URL },
    publisher: { '@type': 'Organization', name: 'Busmoov', url: BASE_URL },
  }]
  const body = wrap(
    h1(article.titre) +
    article.blocks.map((b) => {
      switch (b.type) {
        case 'h2': return h2(b.text)
        case 'p': return p(b.text)
        case 'callout': return p(b.text)
        case 'ul': return ul(b.items)
        default: return ''
      }
    }).join('')
  )
  renderPage({
    lang: 'fr',
    path: `/blog/${article.slug}`,
    title: article.metaTitle,
    description: article.metaDescription,
    jsonLd,
    body,
  })
}

console.log(`prérendu : ${count} pages HTML statiques générées dans dist/`)
