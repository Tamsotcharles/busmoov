import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
// Node >= 23.6 exécute le TypeScript nativement (type stripping) :
// on importe les données directement depuis src/.
import { seoConfig, seoLocalizedPaths, locationBusMeta, translatePath } from '../src/lib/seo-data.ts'
import { chateauxLoire } from '../src/lib/chateaux-loire.ts'
import { villes, villesMaillees, aLaVille, deLaVille } from '../src/lib/villes.ts'
import { articles, articlesSimilaires } from '../src/lib/blog.ts'
import { landings } from '../src/lib/landings.ts'
import { maillageServices } from '../src/lib/maillage.ts'
import { sortiesScolairesFr } from '../src/lib/sorties-scolaires.ts'

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

const locales = Object.fromEntries(
  LANGUAGES.map((l) => [l, JSON.parse(readFileSync(join(DIST, '..', 'src', 'locales', l, 'common.json'), 'utf8'))])
)

// Header et footer statiques : mêmes liens que Header.tsx / Footer.tsx, pour
// que les robots qui n'exécutent pas le JavaScript voient le maillage global.
// React les remplace au chargement (createRoot, pas d'hydratation).
const lienLang = (lang, path) => {
  const localized = translatePath(path, lang)
  return localized === '/' ? `/${lang}` : `/${lang}${localized}`
}
const lienFooter = (href, label) =>
  `<li><a href="${href}" class="hover:text-magenta transition-colors">${esc(label)}</a></li>`

function staticHeader(lang, alternatePaths) {
  const langues = LANGUAGES.map((l) => {
    const href = alternatePaths ? (alternatePaths[l] === '/' ? `/${l}` : `/${l}${alternatePaths[l]}`) : `/${l}`
    return `<a href="${href}" hreflang="${hreflangCode(l)}" class="text-sm text-gray-600 hover:text-magenta">${esc(locales[lang].language[l])}</a>`
  }).join(' ')
  return `<header class="fixed top-0 inset-x-0 z-50 bg-white/95 border-b border-gray-100"><div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4"><a href="/${lang}" class="font-display text-xl font-bold gradient-text">Busmoov</a><nav class="flex items-center gap-3">${langues}</nav></div></header>`
}

function staticFooter(lang) {
  const loc = locales[lang]
  const f = loc.footer
  const villesFr = lang === 'fr'
    ? `<div class="border-t border-gray-800 pt-6 mb-6 text-sm text-gray-400">Location d'autocar par ville : ${villesMaillees
        .map((v) => `<a href="${lienLang('fr', `/location-autocar/${v.slug}`)}" class="hover:text-magenta">${esc(v.nom)}</a>`)
        .join(' · ')} · <a href="${lienLang('fr', '/location-bus')}" class="hover:text-magenta">Location de bus</a> · <a href="${lienLang('fr', '/blog')}" class="hover:text-magenta">Blog &amp; conseils</a></div>`
    : ''
  return `<footer class="bg-gray-900 text-white pt-16 pb-8"><div class="max-w-7xl mx-auto px-4">` +
    `<div class="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">` +
    `<div><p class="font-display text-xl font-bold mb-4">Busmoov</p><p class="text-gray-400 text-sm">${esc(f.description)}</p></div>` +
    `<div><p class="font-semibold mb-4">${esc(f.services)}</p><ul class="space-y-3 text-sm text-gray-400">` +
    lienFooter(lienLang(lang, '/services/location-autocar'), f.busRental) +
    lienFooter(lienLang(lang, '/services/location-minibus'), f.minibusRental) +
    lienFooter(lienLang(lang, '/services/transfert-aeroport'), f.airportTransfer) +
    lienFooter(lienLang(lang, '/services/sorties-scolaires'), f.schoolTrips) +
    `</ul></div>` +
    `<div><p class="font-semibold mb-4">${esc(f.company)}</p><ul class="space-y-3 text-sm text-gray-400">` +
    lienFooter(lienLang(lang, '/a-propos'), f.about) +
    lienFooter(lienLang(lang, '/devenir-partenaire'), f.becomePartner) +
    lienFooter(lienLang(lang, '/contact'), loc.nav.contact) +
    lienFooter(lienLang(lang, '/cgv'), f.termsLink) +
    `</ul></div></div>` +
    villesFr +
    `<div class="border-t border-gray-800 pt-8 flex flex-wrap gap-4 text-sm text-gray-500">` +
    `<a href="${lienLang(lang, '/mentions-legales')}" class="hover:text-magenta">${esc(f.legalLink)}</a>` +
    `<a href="${lienLang(lang, '/confidentialite')}" class="hover:text-magenta">${esc(f.privacyLink)}</a>` +
    `</div></div></footer>`
}

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
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${staticHeader(lang, alternatePaths)}${body}${staticFooter(lang)}</div>`
  )

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
// Une URL http(s) est un lien externe (source d'un chiffre).
const mdLink = (label, href) =>
  /^https?:\/\//.test(href)
    ? `<a class="text-magenta underline" href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a>`
    : `<a class="text-magenta underline" href="/fr${href}">${esc(label)}</a>`
const mdInline = (t) =>
  t.split(/(\[[^\]]+\]\([^)]+\))/g)
    .map((part) => {
      const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      return m ? mdLink(m[1], m[2]) : esc(part)
    })
    .join('')
const ulMd = (items) => `<ul class="list-disc pl-6 mb-3">${items.map((i) => `<li>${mdInline(i)}</li>`).join('')}</ul>`
const pMd = (t) => `<p class="text-gray-700 mb-3">${mdInline(t)}</p>`
const h1 = (t) => `<h1 class="text-3xl font-bold mb-4">${esc(t)}</h1>`
const h2 = (t) => `<h2 class="text-2xl font-bold mt-8 mb-3">${esc(t)}</h2>`
const p = (t) => `<p class="text-gray-700 mb-3">${esc(t)}</p>`
const ul = (items) => `<ul class="list-disc pl-6 mb-3">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
const aVille = (v) => `<a class="text-magenta underline" href="/fr/location-autocar/${v.slug}">${esc(v.nom)}</a>`
// Tableau SEO (même structure que src/components/ui/TableauSeo.tsx).
const tableau = ({ caption, headers, rows }) =>
  `<div class="overflow-x-auto my-6"><table class="w-full text-sm border-collapse">` +
  (caption ? `<caption class="text-left text-sm font-semibold text-gray-700 mb-2">${esc(caption)}</caption>` : '') +
  `<thead><tr>${headers.map((h) => `<th class="bg-purple-50 text-left font-semibold text-gray-800 px-3 py-2 border border-gray-200">${esc(h)}</th>`).join('')}</tr></thead>` +
  `<tbody>${rows.map((r, i) => `<tr${i % 2 === 1 ? ' class="bg-gray-50"' : ''}>${r.map((c, j) => `<td class="px-3 py-2 border border-gray-200 text-gray-700${j === 0 ? ' font-medium whitespace-nowrap' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
const tableauMd = ({ caption, headers, rows }) =>
  (caption ? `**${caption}**\n\n` : '') +
  `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n` +
  rows.map((r) => `| ${r.join(' | ')} |`).join('\n')

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

// Accès aux traductions (locales chargées plus haut), pour donner un corps
// réel aux pages multilingues (les crawlers IA n'exécutent pas de JavaScript).
const t = (lang, key) => key.split('.').reduce((o, seg) => (o && typeof o === 'object' ? o[seg] : undefined), locales[lang]) ?? ''

// Bloc de maillage interne FR des pages services (même structure que
// src/components/seo/MaillageFr.tsx ; vide dans les autres langues).
const maillageFr = (lang, page) => {
  if (lang !== 'fr') return ''
  const bloc = maillageServices[page]
  return h2(bloc.h2) + bloc.paragraphes.map(pMd).join('') + h2(bloc.villesH2) + `<p class="mb-3">${villesMaillees.map(aVille).join(' · ')}</p>`
}

// Blocs SEO français de la page sorties scolaires (même contenu que
// SectionsScolairesFr côté React).
const sectionScolaire = (sec) =>
  h2(sec.h2) + pMd(sec.intro) +
  (sec.paragraphes || []).map(pMd).join('') +
  (sec.liste ? `<ul class="list-disc pl-6 mb-3">${sec.liste.map((i) => `<li>${mdInline(i)}</li>`).join('')}</ul>` : '') +
  (sec.tableau ? tableau(sec.tableau) : '') +
  (sec.apres ? pMd(sec.apres) : '')
const scolaireFr = (lang, partie) => {
  if (lang !== 'fr') return ''
  const c = sortiesScolairesFr
  if (partie === 'prix') return sectionScolaire(c.prix)
  if (partie === 'regles') return sectionScolaire(c.reglementation) + sectionScolaire(c.encadrement)
  return h2('Vos questions sur la location de car scolaire') + c.faq.map((f) => `<h3 class="font-semibold mt-3">${esc(f.q)}</h3>` + p(f.a)).join('')
}

// Destinations de la page sorties scolaires qui ont leur propre page
// (même table que SortiesScolairesPage).
const DESTINATIONS_AVEC_PAGE = {
  'Châteaux de la Loire': '/autocar-chateaux-de-la-loire',
  'Loire Castles': '/autocar-chateaux-de-la-loire',
}

// Liens markdown d'une page multilingue : chemin interne français traduit
// dans la langue de la page (comme useLocalizedPath côté React).
const mdInlineLang = (lang, t) =>
  t.split(/(\[[^\]]+\]\([^)]+\))/g)
    .map((part) => {
      const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (!m) return esc(part)
      const href = translatePath(m[2], lang)
      return `<a class="text-magenta underline" href="/${lang}${href === '/' ? '' : href}">${esc(m[1])}</a>`
    })
    .join('')
const pLang = (lang, t) => `<p class="text-gray-700 mb-3">${mdInlineLang(lang, t)}</p>`

/** Corps statique de la page châteaux de la Loire (même contenu que ChateauxLoirePage). */
function chateauxLoireBody(lang) {
  const c = chateauxLoire[lang]
  return wrap(
    h1(c.h1) +
    p(c.intro) +
    h2(c.prix.h2) + pLang(lang, c.prix.intro) + tableau(c.prix.tableau) + p(c.prix.note) +
    c.sections.map((s) =>
      h2(s.h2) +
      s.paragraphes.map((t, j) => pLang(lang, t) + (j === 0 && s.liste ? `<ul class="list-disc pl-6 mb-3">${s.liste.map((i) => `<li>${mdInlineLang(lang, i)}</li>`).join('')}</ul>` : '')).join('')
    ).join('') +
    h2(c.faq.h2) + c.faq.questions.map((f) => `<h3 class="font-semibold mt-3">${esc(f.q)}</h3>` + p(f.a)).join('') +
    h2(c.devis.h2) + pLang(lang, c.devis.texte)
  )
}

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
    case 'location-autocar': {
      const k = (s) => t(lang, `services.busRental.${s}`)
      const h3p = (titre, texte) => `<h3 class="font-semibold mt-3">${esc(titre)}</h3>` + p(texte)
      return wrap(
        h1(`${k('title')} ${k('titleHighlight')} ${k('titleLocation')}`) +
        p(k('description')) +
        h2(k('fleetTitle')) + p(k('fleetSubtitle')) +
        ['minibus', 'standard', 'grandTourisme', 'doubleEtage'].map((v) => h3p(`${k(v)} (${k(`${v}Capacity`)})`, k(`${v}Desc`))).join('') +
        h2(k('equipmentTitle')) + p(k('equipmentSubtitle')) +
        ul(['wifi', 'airCon', 'plugs', 'screens'].map((e) => `${k(e)} : ${k(`${e}Desc`)}`)) +
        h2(k('occasionsTitle')) + p(k('occasionsSubtitle')) +
        ['privateEvents', 'businessEvents', 'leisure', 'school', 'associations', 'transfers'].map((o) => h3p(k(o), k(`${o}List`))).join('') +
        h2(k('whyChooseTitle')) +
        ['quoteIn24h', 'verifiedCarriers', 'proDrivers', 'bestPrice'].map((w) => h3p(k(w), k(`${w}Desc`))).join('') +
        h2(k('includedTitle')) +
        ul([1, 2, 3, 4, 5, 6, 7].map((n) => k(`included${n}`))) +
        h2(k('coverageTitle')) + p(k('coverageSubtitle')) +
        maillageFr(lang, 'location-autocar')
      )
    }
    case 'location-minibus': {
      const k = (s) => t(lang, `services.minibusRental.${s}`)
      const h3p = (titre, texte) => `<h3 class="font-semibold mt-3">${esc(titre)}</h3>` + p(texte)
      return wrap(
        h1(`${k('title')} ${k('titleHighlight')} ${k('titleSuffix')}`) +
        p(k('description')) +
        h2(k('advantagesTitle')) + p(k('advantagesSubtitle')) +
        [1, 2, 3, 4].map((n) => h3p(k(`advantage${n}Title`), k(`advantage${n}Desc`))).join('') +
        h2(k('capacityTitle')) + p(k('capacitySubtitle')) +
        ['mini8', 'mini12', 'mini20'].map((m) => h3p(k(`${m}Title`), k(`${m}Desc`)) + ul([1, 2, 3, 4].map((n) => k(`${m}Usage${n}`)))).join('') +
        h2(k('occasionsTitle')) + p(k('occasionsSubtitle')) +
        ['occasionPro', 'occasionPrivate', 'occasionTourism', 'occasionTransfer'].map((o) => `<h3 class="font-semibold mt-3">${esc(k(o))}</h3>` + ul([1, 2, 3, 4].map((n) => k(`${o}Item${n}`)))).join('') +
        h2(k('whyTitle')) +
        [1, 2, 3, 4].map((n) => h3p(k(`why${n}Title`), k(`why${n}Desc`))).join('') +
        h2(k('includedTitle')) +
        ul([1, 2, 3, 4, 5, 6, 7].map((n) => k(`included${n}`))) +
        maillageFr(lang, 'location-minibus')
      )
    }
    case 'transfert-aeroport': {
      const k = (s) => t(lang, `services.airportTransfer.${s}`)
      const h3p = (titre, texte) => `<h3 class="font-semibold mt-3">${esc(titre)}</h3>` + p(texte)
      return wrap(
        h1(`${k('title')} ${k('titleHighlight')} ${k('titleSuffix')}`) +
        p(k('description')) +
        h2(k('howItWorksTitle')) + p(k('howItWorksSubtitle')) +
        [1, 2, 3, 4].map((n) => h3p(k(`step${n}Title`), k(`step${n}Desc`))).join('') +
        h2(k('typesTitle')) + p(k('typesSubtitle')) +
        ['typeGroup', 'typePro', 'typeEvent'].map((ty) => h3p(k(ty), k(`${ty}Desc`)) + ul([1, 2, 3, 4].map((n) => k(`${ty}Feature${n}`)))).join('') +
        h2(k('fleetTitle')) + p(k('fleetSubtitle')) +
        [1, 2, 3, 4].map((n) => h3p(`${k(`vehicle${n}`)} : ${k(`vehicle${n}Price`)}`, k(`vehicle${n}Ideal`))).join('') +
        p(k('pricingNote')) +
        h2(k('optionsTitle')) +
        ul([1, 2, 3, 4, 5].map((n) => `${k(`option${n}`)} : ${k(`option${n}Desc`)}`)) +
        h2(k('advantagesTitle')) + p(k('advantagesSubtitle')) +
        [1, 2, 3, 4].map((n) => h3p(k(`advantage${n}Title`), k(`advantage${n}Desc`))).join('') +
        h2(k('includedTitle')) + p(k('includedSubtitle')) +
        ul([1, 2, 3, 4, 5, 6, 7].map((n) => k(`included${n}`))) +
        maillageFr(lang, 'transfert-aeroport')
      )
    }
    case 'sorties-scolaires': {
      const k = (s) => t(lang, `services.schoolTrips.${s}`)
      const h3p = (titre, texte) => `<h3 class="font-semibold mt-3">${esc(titre)}</h3>` + p(texte)
      return wrap(
        h1(`${k('title')} ${k('titleHighlight')} ${k('titleSuffix')}`) +
        p(k('description')) +
        h2(k('tripsTitle')) + p(k('tripsSubtitle')) +
        [1, 2, 3, 4, 5, 6].map((n) => h3p(k(`trip${n}Title`), `${k(`trip${n}Desc`)} ${k(`trip${n}Examples`)}`)).join('') +
        h2(k('vehiclesTitle')) + p(k('vehiclesSubtitle')) +
        [1, 2, 3].map((n) => h3p(`${k(`vehicle${n}Title`)} (${k(`vehicle${n}Capacity`)})`, `${k(`vehicle${n}Ideal`)} ${k(`vehicle${n}Features`)}`)).join('') +
        scolaireFr(lang, 'prix') +
        h2(k('destinationsTitle')) +
        ['Parks', 'Culture', 'Nature', 'History'].map((cat) =>
          `<h3 class="font-semibold mt-3">${esc(k(`dest${cat}`))}</h3>` +
          `<ul class="list-disc pl-6 mb-3">${k(`dest${cat}List`).split(', ').map((d) =>
            `<li>${DESTINATIONS_AVEC_PAGE[d] ? mdInlineLang(lang, `[${d}](${DESTINATIONS_AVEC_PAGE[d]})`) : esc(d)}</li>`).join('')}</ul>`
        ).join('') +
        h2(k('safetyTitle')) + p(k('safetySubtitle')) +
        [1, 2, 3, 4].map((n) => h3p(k(`safety${n}Title`), k(`safety${n}Desc`))).join('') +
        scolaireFr(lang, 'regles') +
        h2(k('docsTitle')) + p(k('docsSubtitle')) +
        [1, 2, 3, 4].map((n) => h3p(k(`doc${n}Title`), k(`doc${n}Desc`))).join('') +
        h2(k('howItWorksTitle')) + p(k('howItWorksSubtitle')) +
        [1, 2, 3, 4].map((n) => h3p(k(`step${n}Title`), k(`step${n}Desc`))).join('') +
        h2(k('includedTitle')) +
        ul([1, 2, 3, 4, 5, 6, 7, 8].map((n) => k(`included${n}`))) +
        scolaireFr(lang, 'faq') +
        maillageFr(lang, 'sorties-scolaires')
      )
    }
    case 'chateaux-loire':
      return chateauxLoireBody(lang)
    case 'contact':
      return wrap(
        h1(t(lang, 'contact.title')) +
        p(t(lang, 'contact.subtitle')) +
        p(t(lang, 'contact.teamAvailable')) +
        ul([
          `${t(lang, 'contact.phone')} : +33 1 76 31 12 83`,
          `${t(lang, 'contact.email')} : infos@busmoov.com`,
          `${t(lang, 'contact.hours')} : ${t(lang, 'contact.hoursValue')}`,
        ])
      )
    case 'a-propos': {
      const k = (s) => t(lang, `about.${s}`)
      const h3p = (titre, texte) => `<h3 class="font-semibold mt-3">${esc(titre)}</h3>` + p(texte)
      return wrap(
        h1(k('title')) +
        p(k('heroText')) +
        h2(k('storyTitle')) +
        [1, 2, 3].map((n) => p(k(`storyP${n}`))).join('') +
        h2(k('valuesTitle')) + p(k('valuesSubtitle')) +
        ['Expertise', 'Quality', 'Reliability', 'Service'].map((v) => h3p(k(`value${v}`), k(`value${v}Desc`))).join('') +
        h2(k('commitmentTitle')) +
        ul([1, 2, 3, 4, 5, 6].map((n) => k(`commitment${n}`)))
      )
    }
    default:
      return ''
  }
}

for (const [page, paths] of Object.entries(seoLocalizedPaths)) {
  for (const lang of LANGUAGES) {
    const meta = seoConfig[page][lang]
    const jsonLd = page === 'home' ? [organizationJsonLd(lang)] : []
    if (page === 'chateaux-loire') {
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: chateauxLoire[lang].faq.questions.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      })
    }
    if (page === 'sorties-scolaires' && lang === 'fr') {
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: sortiesScolairesFr.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      })
    }
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

// ---- Page pilier location-bus (FR, contenu complet) ----------------------
{
  const lb = await import('../src/lib/location-bus.ts')
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Location de bus avec chauffeur',
      description: locationBusMeta.description,
      url: urlFor('fr', '/location-bus'),
      provider: { '@type': 'Organization', name: 'Busmoov', url: BASE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: lb.locationBusFaq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ]
  const body = wrap(
    h1(locationBusMeta.h1) +
    p(locationBusMeta.sousTitre) +
    lb.locationBusAtouts.map((a) => `<h3 class="font-semibold mt-3">${esc(a.titre)}</h3>` + p(a.desc)).join('') +
    lb.locationBusIntro.map(pMd).join('') +
    h2('Quel bus pour votre groupe ?') +
    lb.locationBusTypes.map((ty) => `<h3 class="font-semibold mt-3">${esc(ty.titre)}</h3>` + pMd(`${ty.desc} [En savoir plus](${ty.lien})`)).join('') +
    pMd(lb.locationBusTypesNote) +
    h2(lb.locationBusPrix.h2) +
    lb.locationBusPrix.paragraphes.map(pMd).join('') +
    tableau(lb.locationBusPrix.tableau) +
    lb.locationBusPrix.apres.map(pMd).join('') +
    h2('Pour quelles occasions louer un bus ?') +
    ulMd(lb.locationBusOccasions) +
    h2(lb.locationBusEtapes.h2) +
    ulMd(lb.locationBusEtapes.liste) +
    h2('Questions fréquentes') +
    lb.locationBusFaq.map((f) => `<h3 class="font-semibold mt-3">${esc(f.q)}</h3>` + pMd(f.a)).join('') +
    h2(lb.locationBusVillesH2) +
    `<p class="mb-3">${villesMaillees.map(aVille).join(' · ')}</p>`
  )
  renderPage({
    lang: 'fr',
    path: '/location-bus',
    title: locationBusMeta.title,
    description: locationBusMeta.description,
    jsonLd,
    body,
  })
}

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
      (s.liste ? ulMd(s.liste) : '') +
      (s.tableau ? tableau(s.tableau) : '')
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
const h3 = (t) => `<h3 class="font-semibold mt-3">${esc(t)}</h3>`

/** Format historique des pages villes. */
function villeClassiqueBody(ville) {
  const autres = villesMaillees.filter((v) => v.slug !== ville.slug).map(aVille).join(' · ')
  return (
    h1(ville.h1) +
    p(ville.sousTitre) +
    ville.intro.map(p).join('') +
    h2(ville.sectionLocale.h2) +
    ville.sectionLocale.paragraphes.map(p).join('') +
    (ville.sections || []).map((sec) => h2(sec.h2) + sec.paragraphes.map(pMd).join('')).join('') +
    h2(ville.h2Destinations) +
    ville.destinations.map((d) => h3(d.nom) + p(d.desc)).join('') +
    h2(ville.h2Trajets) +
    ul(ville.trajets) +
    ville.liensUtiles.map(pMd).join('') +
    (ville.prix ? h2(ville.prix.h2) + p(ville.prix.intro) + tableau(ville.prix.tableau) + pMd(ville.prix.apres) : '') +
    h2(`Vos questions sur l'autocar ${aLaVille(ville)}`) +
    ville.faq.map((f) => h3(f.q) + p(f.a)).join('') +
    p('Busmoov également disponible à :') + `<p class="mb-3">${autres}</p>`
  )
}

/** Format enrichi : même ordre de blocs que SectionsEnrichies (React). */
function villeEnrichieBody(ville) {
  const th = (t) => `<th class="p-2 text-left">${esc(t)}</th>`
  const td = (t) => `<td class="p-2">${esc(t)}</td>`
  const tableauLignes = (headers, lignes) =>
    '<table class="w-full text-sm mb-3"><thead><tr>' + headers.map(th).join('') + '</tr></thead><tbody>' +
    lignes.map((cells) => '<tr>' + cells.map(td).join('') + '</tr>').join('') + '</tbody></table>'
  // H2 + paragraphes, liste à puces insérée après le premier paragraphe
  const bloc = (b) =>
    h2(b.h2) + b.paragraphes.map((t, j) => pMd(t) + (j === 0 && b.liste ? `<ul class="list-disc pl-6 mb-3">${b.liste.map((i) => `<li>${mdInline(i)}</li>`).join('')}</ul>` : '')).join('')
  const { prix, grandesVilles: gv, commentLouer: cl, visiter } = ville
  const proches = ville.proximite.map((slug) => villes.find((v) => v.slug === slug)).filter(Boolean)
  return (
    h1(ville.h1) +
    p(ville.sousTitre) +
    ville.intro.map(p).join('') +
    h2(prix.h2) +
    pMd(prix.intro) +
    (prix.tableau ? tableau(prix.tableau) : '') +
    (prix.lignes
      ? tableauLignes(
          [`Trajet au départ ${deLaVille(ville)}`, 'Durée', 'Formule', 'Minibus 8 à 20 pl.', "Autocar jusqu'à 59 pl.", 'Par personne (car plein)'],
          prix.lignes.map((l) => [l.trajet, l.duree, l.formule, l.minibus, l.autocar, l.parPersonne]),
        )
      : '') +
    p(prix.note) +
    (prix.variation ? p(prix.variation) : '') +
    (gv
      ? h2(gv.h2) + p(gv.intro) +
        tableauLignes(
          ['Trajet', 'Distance', 'Durée en autocar', 'Formule', 'Minibus 8 à 20 pl.', "Autocar jusqu'à 59 pl.", 'Par personne (car plein)'],
          gv.lignes.map((l) => [l.destination, l.distance, l.duree, l.formule, l.minibus, l.autocar, l.parPersonne]),
        ) + p(gv.note)
      : '') +
    (cl
      ? h2(cl.h2) + `<ol class="list-decimal pl-6 mb-3">${cl.etapes.map((e) => `<li>${esc(e)}</li>`).join('')}</ol>` +
        p(cl.conseil) + (cl.chauffeur ? pMd(cl.chauffeur) : '')
      : '') +
    [ville.vehicules, ville.minibus, ...(ville.sections || [])].filter(Boolean).map(bloc).join('') +
    (visiter
      ? h2(visiter.h2) + pMd(visiter.intro) +
        visiter.lieux.map((l) => h3(l.nom) + pMd(`${l.trajet === 'en ville' ? 'En ville' : `À ${l.trajet} ${deLaVille(ville)}`}. ${l.desc}`)).join('')
      : '') +
    h2(`Vos questions sur la location de bus ${aLaVille(ville)}`) +
    ville.faq.map((f) => h3(f.q) + p(f.a)).join('') +
    p(`Prêt à réserver votre bus ${aLaVille(ville)} ? Décrivez votre trajet en 2 minutes, recevez plusieurs devis gratuits sous 24h.`) +
    (proches.length ? `<p class="mb-3">Location d'autocar près ${esc(deLaVille(ville))} : ${proches.map(aVille).join(' · ')}</p>` : '') +
    h2(ville.budgets.h2) +
    pMd(ville.budgets.intro) +
    (ville.budgets.exemples ? ul(ville.budgets.exemples) : '') +
    (ville.budgets.note ? p(ville.budgets.note) : '')
  )
}

for (const ville of villes) {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: `Location d'autocar avec chauffeur ${aLaVille(ville)}`,
      description: ville.metaDescription,
      url: urlFor('fr', `/location-autocar/${ville.slug}`),
      areaServed: { '@type': 'City', name: ville.nom },
      provider: { '@type': 'Organization', name: 'Busmoov', url: BASE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${BASE_URL}/fr` },
        { '@type': 'ListItem', position: 2, name: "Location d'autocar", item: `${BASE_URL}/fr/services/location-autocar` },
        { '@type': 'ListItem', position: 3, name: ville.nom, item: urlFor('fr', `/location-autocar/${ville.slug}`) },
      ],
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
  const body = wrap(ville.format === 'enrichi' ? villeEnrichieBody(ville) : villeClassiqueBody(ville))
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
        case 'h3': return `<h3 class="font-semibold mt-3">${esc(b.text)}</h3>`
        case 'p': return pMd(b.text)
        case 'callout': return pMd(b.text)
        case 'ul': return ulMd(b.items)
        case 'table': return tableau(b)
        default: return ''
      }
    }).join('') +
    h2('À lire aussi') +
    `<ul class="list-disc pl-6 mb-3">${articlesSimilaires(article).map((a) => `<li><a class="text-magenta underline" href="/fr/blog/${a.slug}">${esc(a.titre)}</a></li>`).join('')}</ul>`
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
- Prix indicatif : journée en autocar standard à partir de 700 € TTC (TVA transport 10 % en France) ; chauffeur, carburant et péages inclus
- Toujours avec chauffeur professionnel (permis D obligatoire au-delà de 9 places)
- Acompte 30 % à la réservation (50 % à moins de 30 jours du départ, 100 % à moins de 15 jours)
- Contact : infos@busmoov.com · +33 1 76 31 12 83

## Services
- [Location d'autocar](${BASE_URL}/fr/services/location-autocar) : autocars 20 à 90 places avec chauffeur
- [Location de bus](${BASE_URL}/fr/location-bus) : guide des types de bus et devis
- [Location de minibus](${BASE_URL}/fr/services/location-minibus) : 8 à 20 places
- [Transfert aéroport](${BASE_URL}/fr/services/transfert-aeroport) : groupes, tous aéroports
- [Sorties scolaires](${BASE_URL}/fr/services/sorties-scolaires) : véhicules aux normes transport d'enfants
- [Châteaux de la Loire en autocar](${BASE_URL}/fr/autocar-chateaux-de-la-loire) : prix de départ, itinéraires, stationnement à Chambord
${landings.map((l) => `- [${l.h1}](${BASE_URL}/fr${l.slug})`).join('\n')}

## Villes desservies
${villesMaillees.map((v) => `- [Location d'autocar à ${v.nom}](${BASE_URL}/fr/location-autocar/${v.slug})`).join('\n')}

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
    case 'h3': return `#### ${b.text}`
    case 'p': return b.text
    case 'callout': return `> ${b.text}`
    case 'ul': return b.items.map((i) => `- ${i}`).join('\n')
    case 'table': return tableauMd(b)
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
    ...(v.format === 'enrichi'
      ? [
          `### ${v.prix.h2}`,
          v.prix.intro,
          ...(v.prix.tableau ? [tableauMd(v.prix.tableau)] : []),
          ...(v.prix.lignes
            ? [`| Trajet | Durée | Formule | Minibus 8 à 20 pl. | Autocar jusqu'à 59 pl. | Par personne |\n|---|---|---|---|---|---|\n` +
                v.prix.lignes.map((l) => `| ${l.trajet} | ${l.duree} | ${l.formule} | ${l.minibus} | ${l.autocar} | ${l.parPersonne} |`).join('\n')]
            : []),
          v.prix.note,
          ...(v.prix.variation ? [v.prix.variation] : []),
          ...(v.grandesVilles
            ? [
                `### ${v.grandesVilles.h2}`,
                v.grandesVilles.intro,
                `| Trajet | Distance | Durée en autocar | Formule | Minibus 8 à 20 pl. | Autocar jusqu'à 59 pl. | Par personne |\n|---|---|---|---|---|---|---|\n` +
                  v.grandesVilles.lignes.map((l) => `| ${l.destination} | ${l.distance} | ${l.duree} | ${l.formule} | ${l.minibus} | ${l.autocar} | ${l.parPersonne} |`).join('\n'),
                v.grandesVilles.note,
              ]
            : []),
          ...(v.commentLouer
            ? [
                `### ${v.commentLouer.h2}`,
                v.commentLouer.etapes.map((e, i) => `${i + 1}. ${e}`).join('\n'),
                v.commentLouer.conseil,
                ...(v.commentLouer.chauffeur ? [v.commentLouer.chauffeur] : []),
              ]
            : []),
          ...[v.vehicules, v.minibus, ...(v.sections || [])].filter(Boolean).flatMap((b) => [`### ${b.h2}`, b.paragraphes[0], ...(b.liste ? [b.liste.map((i) => `- ${i}`).join('\n')] : []), ...b.paragraphes.slice(1)]),
          ...(v.visiter
            ? [`### ${v.visiter.h2}`, v.visiter.intro, v.visiter.lieux.map((l) => `- ${l.nom} (${l.trajet}) : ${l.desc}`).join('\n')]
            : []),
          `### ${v.budgets.h2}`,
          v.budgets.intro,
          ...(v.budgets.exemples ? [v.budgets.exemples.map((e) => `- ${e}`).join('\n')] : []),
          ...(v.budgets.note ? [v.budgets.note] : []),
        ]
      : [
          `### ${v.sectionLocale.h2}`,
          ...v.sectionLocale.paragraphes,
          `### ${v.h2Destinations}`,
          v.destinations.map((d) => `- ${d.nom} : ${d.desc}`).join('\n'),
          `### ${v.h2Trajets}`,
          v.trajets.map((t) => `- ${t}`).join('\n'),
          ...v.liensUtiles,
        ]),
    `### Questions fréquentes`,
    v.faq.map((f) => `**${f.q}**\n\n${f.a}`).join('\n\n'),
  ].join('\n\n')),
].join('\n\n')
writeFileSync(join(DIST, 'llms-full.txt'), llmsFull)

console.log(`prérendu : ${count} pages HTML statiques + llms.txt + llms-full.txt générés dans dist/`)
