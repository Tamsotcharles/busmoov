import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
// Node >= 23.6 exécute le TypeScript nativement (type stripping) :
// on importe les données directement depuis src/.
import { seoConfig, seoLocalizedPaths, locationBusMeta } from '../src/lib/seo-data.ts'
import { villes } from '../src/lib/villes.ts'
import { articles } from '../src/lib/blog.ts'
import { landings } from '../src/lib/landings.ts'

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

function renderPage({ lang, path, title, description, alternatePaths = null, jsonLd = [], body = '' }) {
  const canonical = urlFor(lang, path)
  let head = `<link rel="canonical" href="${canonical}"/>\n`
  if (alternatePaths) {
    for (const l of LANGUAGES) {
      head += `<link rel="alternate" hreflang="${hreflangCode(l)}" href="${urlFor(l, alternatePaths[l])}"/>\n`
    }
    head += `<link rel="alternate" hreflang="x-default" href="${urlFor('fr', alternatePaths.fr)}"/>\n`
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
// Paragraphe pouvant contenir des liens markdown [ancre](/chemin) — chemins
// internes FR, préfixés /fr dans le HTML statique.
const mdInline = (t) =>
  t.split(/(\[[^\]]+\]\([^)]+\))/g)
    .map((part) => {
      const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      return m ? `<a class="text-magenta underline" href="/fr${m[2]}">${esc(m[1])}</a>` : esc(part)
    })
    .join('')
const ulMd = (items) => `<ul class="list-disc pl-6 mb-3">${items.map((i) => `<li>${mdInline(i)}</li>`).join('')}</ul>`
const pMd = (t) =>
  `<p class="text-gray-700 mb-3">${t
    .split(/(\[[^\]]+\]\([^)]+\))/g)
    .map((part) => {
      const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      return m ? `<a class="text-magenta underline" href="/fr${m[2]}">${esc(m[1])}</a>` : esc(part)
    })
    .join('')}</p>`
const h1 = (t) => `<h1 class="text-3xl font-bold mb-4">${esc(t)}</h1>`
const h2 = (t) => `<h2 class="text-2xl font-bold mt-8 mb-3">${esc(t)}</h2>`
const p = (t) => `<p class="text-gray-700 mb-3">${esc(t)}</p>`
const ul = (items) => `<ul class="list-disc pl-6 mb-3">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
const aVille = (v) => `<a class="text-magenta underline" href="/fr/location-autocar/${v.slug}">${esc(v.nom)}</a>`

// ---- Pages multilingues : head uniquement -------------------------------
// (+ entité Organization sur les pages d'accueil, pour les crawlers IA
// qui ne lisent que le HTML statique)
const organizationJsonLd = (lang) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Busmoov',
  url: `${BASE_URL}/${lang}`,
  logo: `${BASE_URL}/logo.svg`,
  description: seoConfig.home[lang].description,
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+33 1 76 31 12 83',
    email: 'infos@busmoov.com',
    contactType: 'customer service',
    availableLanguage: ['fr', 'es', 'de', 'en'],
  },
})

// Traductions par langue, pour donner un corps réel aux pages
// multilingues (les crawlers IA n'exécutent pas de JavaScript).
const locales = Object.fromEntries(
  LANGUAGES.map((l) => [l, JSON.parse(readFileSync(join(DIST, '..', 'src', 'locales', l, 'common.json'), 'utf8'))])
)
const t = (lang, key) => key.split('.').reduce((o, seg) => (o && typeof o === 'object' ? o[seg] : undefined), locales[lang]) ?? ''

/** Corps statique des pages multilingues, construit depuis les traductions. */
function multilingualBody(page, lang) {
  switch (page) {
    case 'home': {
      const steps = [1, 2, 3].map((n) =>
        `<h3 class="font-semibold mt-3">${esc(t(lang, `howItWorks.step${n}.title`))}</h3>` +
        p(t(lang, `howItWorks.step${n}.description`))
      ).join('')
      return wrap(
        h1(`${t(lang, 'hero.title1')} ${t(lang, 'hero.title2')} ${t(lang, 'hero.title3')}`) +
        p(t(lang, 'hero.subtitle')) +
        h2(t(lang, 'howItWorks.title')) +
        p(t(lang, 'howItWorks.subtitle')) +
        steps
      )
    }
    case 'location-autocar':
      return wrap(
        h1(`${t(lang, 'services.busRental.title')} ${t(lang, 'services.busRental.titleHighlight')} ${t(lang, 'services.busRental.titleLocation')}`) +
        p(t(lang, 'services.busRental.description'))
      )
    case 'location-minibus':
      return wrap(
        h1(`${t(lang, 'services.minibusRental.title')} ${t(lang, 'services.minibusRental.titleHighlight')}`) +
        p(t(lang, 'services.minibusRental.description'))
      )
    case 'transfert-aeroport':
      return wrap(
        h1(`${t(lang, 'services.airportTransfer.title')} ${t(lang, 'services.airportTransfer.titleHighlight')} ${t(lang, 'services.airportTransfer.titleSuffix')}`) +
        p(t(lang, 'services.airportTransfer.description'))
      )
    case 'sorties-scolaires':
      return wrap(
        h1(`${t(lang, 'services.schoolTrips.title')} ${t(lang, 'services.schoolTrips.titleHighlight')} ${t(lang, 'services.schoolTrips.titleSuffix')}`) +
        p(t(lang, 'services.schoolTrips.description'))
      )
    default:
      return ''
  }
}

for (const [page, paths] of Object.entries(seoLocalizedPaths)) {
  for (const lang of LANGUAGES) {
    const meta = seoConfig[page][lang]
    const jsonLd = page === 'home' ? [organizationJsonLd(lang)] : []
    renderPage({
      lang,
      path: paths[lang],
      title: meta.title,
      description: meta.description,
      alternatePaths: paths,
      jsonLd,
      body: multilingualBody(page, lang),
    })
  }
}

// ---- Landing chinoise /zh (page autonome, chemin racine) ----------------
{
  const zh = await import('../src/lib/zh-landing.ts')
  const canonical = `${BASE_URL}/zh`
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: '法国大巴与中巴租赁（含司机）',
      description: zh.zhMeta.description,
      inLanguage: 'zh-Hans',
      url: canonical,
      areaServed: { '@type': 'Country', name: 'France' },
      provider: { '@type': 'Organization', name: 'Busmoov', url: BASE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: zh.zhFaq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ]
  let head = `<link rel="canonical" href="${canonical}"/>\n`
  head += `<meta property="og:title" content="${esc(zh.zhMeta.title)}"/>\n`
  head += `<meta property="og:description" content="${esc(zh.zhMeta.description)}"/>\n`
  head += `<meta property="og:url" content="${canonical}"/>\n`
  head += `<meta property="og:locale" content="zh_CN"/>\n`
  for (const block of jsonLd) head += `<script type="application/ld+json">${JSON.stringify(block)}</script>\n`
  const body = wrap(
    h1(zh.zhMeta.h1) +
    p(zh.zhMeta.sousTitre) +
    zh.zhIntro.map(p).join('') +
    h2(zh.zhTexte.servicesTitre) +
    zh.zhServices.map((x) => `<h3 class="font-semibold mt-3">${esc(x.titre)}</h3>` + p(x.desc)).join('') +
    h2(zh.zhTexte.vehiculesTitre) +
    zh.zhVehicules.map((x) => `<h3 class="font-semibold mt-3">${esc(x.titre)}</h3>` + p(x.desc)).join('') +
    h2(zh.zhTexte.commentTitre) +
    ul(zh.zhTexte.commentEtapes) +
    h2(zh.zhTexte.faqTitre) +
    zh.zhFaq.map((f) => `<h3 class="font-semibold mt-3">${esc(f.q)}</h3>` + p(f.a)).join('')
  )
  const html = template
    .replace(/<html lang="[^"]*"/, `<html lang="zh"`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(zh.zhMeta.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(zh.zhMeta.description)}$2`)
    .replace('</head>', `${head}</head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
  writeFileSync(join(DIST, 'zh.html'), html)
  count++
}

// ---- Page pilier location-bus (FR) --------------------------------------
renderPage({
  lang: 'fr',
  path: '/location-bus',
  title: locationBusMeta.title,
  description: locationBusMeta.description,
  body: wrap(h1(locationBusMeta.h1) + p(locationBusMeta.sousTitre)),
})

// ---- Landing pages SEO (FR, pilotées par landings.ts) -------------------
for (const landing of landings) {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: landing.serviceType,
      description: landing.metaDescription,
      url: urlFor('fr', landing.slug),
      provider: { '@type': 'Organization', name: 'Busmoov', url: BASE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: landing.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ]
  const body = wrap(
    h1(landing.h1) +
    p(landing.sousTitre) +
    landing.intro.map(pMd).join('') +
    landing.sections.map((s) =>
      h2(s.h2) +
      (s.paragraphes ?? []).map(pMd).join('') +
      (s.liste ? ulMd(s.liste) : '')
    ).join('') +
    h2('Questions fréquentes') +
    landing.faq.map((f) => `<h3 class="font-semibold mt-3">${esc(f.q)}</h3>` + pMd(f.a)).join('')
  )
  renderPage({
    lang: 'fr',
    path: landing.slug,
    title: landing.metaTitle,
    description: landing.metaDescription,
    jsonLd,
    body,
  })
}

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
    h2(ville.sectionLocale.h2) +
    ville.sectionLocale.paragraphes.map(p).join('') +
    h2(ville.h2Destinations) +
    ville.destinations.map((d) => `<h3 class="font-semibold mt-3">${esc(d.nom)}</h3>` + p(d.desc)).join('') +
    h2(ville.h2Trajets) +
    ul(ville.trajets) +
    ville.liensUtiles.map(pMd).join('') +
    h2(`Vos questions sur l'autocar à ${ville.nom}`) +
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
        case 'p': return pMd(b.text)
        case 'callout': return pMd(b.text)
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

// ---- llms.txt : carte du site pour les assistants IA --------------------
// Standard émergent (llmstxt.org) : un markdown concis à la racine qui
// présente le site et ses pages clés aux crawlers de LLM.
const llmsTxt = `# Busmoov

> Busmoov est une plateforme française de réservation d'autocars, bus et minibus avec chauffeur pour les groupes (8 à 90 places). Elle compare plusieurs devis de transporteurs vérifiés et répond sous 24h, en France ainsi qu'en Espagne, en Allemagne et au Royaume-Uni.

Faits clés :
- Plus de 300 000 passagers par an transportés via son réseau ; 180 autocaristes partenaires vérifiés
- Devis gratuit sous 24h, plusieurs transporteurs comparés, sans engagement
- Véhicules : minibus (8-20 places), autocar standard (21-59), grande capacité et double étage (60-90)
- Prix indicatif : journée en autocar standard à partir de 690 € TTC (TVA transport 10 % en France) ; chauffeur, carburant et péages inclus
- Toujours avec chauffeur professionnel (permis D obligatoire au-delà de 9 places)
- Acompte 30 % à la réservation (50 % à moins de 30 jours du départ, 100 % à moins de 15 jours)
- Contact : infos@busmoov.com · +33 1 76 31 12 83

## Services
- [Location d'autocar](${BASE_URL}/fr/services/location-autocar) : autocars 20 à 90 places avec chauffeur
- [Location de bus](${BASE_URL}/fr/location-bus) : guide des types de bus et devis
- [Location de minibus](${BASE_URL}/fr/services/location-minibus) : 8 à 20 places
- [Transfert aéroport](${BASE_URL}/fr/services/transfert-aeroport) : groupes, tous aéroports
- [Sorties scolaires](${BASE_URL}/fr/services/sorties-scolaires) : véhicules aux normes transport d'enfants
${landings.map((l) => `- [${l.h1}](${BASE_URL}/fr${l.slug})`).join('\n')}

## Villes desservies
${villes.map((v) => `- [Location d'autocar à ${v.nom}](${BASE_URL}/fr/location-autocar/${v.slug})`).join('\n')}

## Guides
${articles.map((a) => `- [${a.titre}](${BASE_URL}/fr/blog/${a.slug}) : ${a.extrait}`).join('\n')}

## Autres langues
- [Español](${BASE_URL}/es) · [Deutsch](${BASE_URL}/de) · [English](${BASE_URL}/en) · [中文 — 法国大巴租赁](${BASE_URL}/zh)

## Détail complet
- [llms-full.txt](${BASE_URL}/llms-full.txt) : contenu intégral des guides et pages villes en markdown
`
writeFileSync(join(DIST, 'llms.txt'), llmsTxt)

// llms-full.txt : contenu intégral en markdown pour ingestion directe.
const blockToMd = (b) => {
  switch (b.type) {
    case 'h2': return `### ${b.text}`
    case 'p': return b.text
    case 'callout': return `> ${b.text}`
    case 'ul': return b.items.map((i) => `- ${i}`).join('\n')
    default: return ''
  }
}
const llmsFull = [
  llmsTxt,
  '---\n\n# Guides Busmoov (contenu intégral)',
  ...articles.map((a) => `## ${a.titre}\n\nSource : ${BASE_URL}/fr/blog/${a.slug}\n\n${a.blocks.map(blockToMd).join('\n\n')}`),
  '---\n\n# Pages villes (contenu intégral)',
  ...villes.map((v) => [
    `## ${v.h1}`,
    `Source : ${BASE_URL}/fr/location-autocar/${v.slug}`,
    v.sousTitre,
    ...v.intro,
    `### ${v.sectionLocale.h2}`,
    ...v.sectionLocale.paragraphes,
    `### ${v.h2Destinations}`,
    v.destinations.map((d) => `- ${d.nom} : ${d.desc}`).join('\n'),
    `### ${v.h2Trajets}`,
    v.trajets.map((t) => `- ${t}`).join('\n'),
    ...v.liensUtiles,
    `### Questions fréquentes`,
    v.faq.map((f) => `**${f.q}**\n\n${f.a}`).join('\n\n'),
  ].join('\n\n')),
].join('\n\n')
writeFileSync(join(DIST, 'llms-full.txt'), llmsFull)

console.log(`prérendu : ${count} pages HTML statiques + llms.txt + llms-full.txt générés dans dist/`)
