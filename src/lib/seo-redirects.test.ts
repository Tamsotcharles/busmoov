import { describe, it, expect } from 'vitest'
import { seoLocalizedPaths } from './seo-data'
import { landings } from './landings'
import vercelConfig from '../../vercel.json'

// vercel.json est du JSON statique : il ne peut pas importer seo-data.
// Ce test garantit qu'ils restent synchronisés. Si un slug localisé change,
// l'ancien chemin doit être redirigé en 301, sinon Google garde l'ancienne
// URL indexée et écarte la nouvelle comme doublon (constaté en septembre
// 2026 sur /de/services/sorties-scolaires).

type Redirect = { source: string; destination: string; statusCode?: number; has?: unknown[] }

const vercel = vercelConfig as { redirects: Redirect[] }

describe('redirections des chemins français sous préfixe es/de/en', () => {
  for (const [page, paths] of Object.entries(seoLocalizedPaths)) {
    for (const lang of ['es', 'de', 'en'] as const) {
      if (paths[lang] === paths.fr) continue
      it(`/${lang}${paths.fr} → /${lang}${paths[lang]} (${page})`, () => {
        const r = vercel.redirects.find((x) => x.source === `/${lang}${paths.fr}` && !x.has)
        expect(r?.destination).toBe(`/${lang}${paths[lang]}`)
        expect(r?.statusCode).toBe(301)
      })
    }
  }
})

describe('pages françaises sans préfixe de langue', () => {
  // /mentions-legales était indexée par Google en doublon de /fr/mentions-legales
  const frOnly = [
    ...Object.entries(seoLocalizedPaths)
      .filter(([page, paths]) => page !== 'home' && !paths.fr.startsWith('/services/'))
      .map(([, paths]) => paths.fr),
    ...landings.map((l) => l.slug),
  ]
  for (const path of frOnly) {
    it(`${path} → /fr${path}`, () => {
      const r = vercel.redirects.find((x) => x.source === path && !x.has)
      expect(r?.destination).toBe(`/fr${path}`)
      expect(r?.statusCode).toBe(301)
    })
  }
})

describe('racine du site', () => {
  it('redirige / vers /fr côté serveur quand aucune langue ne correspond', () => {
    const r = vercel.redirects.find((x) => x.source === '/' && !x.has)
    expect(r?.destination).toBe('/fr')
    expect(r?.statusCode).toBe(301)
  })
})
