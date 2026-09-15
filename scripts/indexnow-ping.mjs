import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/**
 * IndexNow : notifie Bing (et les moteurs partenaires — DuckDuckGo,
 * Yandex, Seznam ; l'index Bing alimente aussi ChatGPT et Copilot)
 * de toutes les URLs du sitemap. Google n'utilise pas IndexNow.
 *
 * Ne s'exécute que sur Vercel (déploiement réel) ou avec --force,
 * pour ne pas pinger depuis les builds locaux.
 */

const KEY = 'e1e7d41df2b2d513ef0190f3f44e0823'
const HOST = 'www.busmoov.com'

if (!process.env.VERCEL && !process.argv.includes('--force')) {
  console.log('IndexNow : build local, ping ignoré (utiliser --force pour pinger)')
  process.exit(0)
}

const sitemapPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sitemap.xml')
const urls = [...readFileSync(sitemapPath, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

try {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: urls,
    }),
  })
  console.log(`IndexNow : ${urls.length} URLs soumises — HTTP ${res.status}`)
} catch (e) {
  // Le ping ne doit jamais faire échouer un build
  console.warn('IndexNow : ping échoué (non bloquant) —', e instanceof Error ? e.message : e)
}
