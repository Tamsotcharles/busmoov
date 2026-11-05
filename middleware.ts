import { next, rewrite } from '@vercel/edge'
import { MICROSITES } from './src/lib/microsite'

/**
 * Edge Middleware Vercel : sert le microsite par domaine AVANT le système de
 * fichiers. Les rewrites de vercel.json passent après les fichiers statiques,
 * donc « / » (index.html), robots.txt et sitemap.xml du site principal
 * gagnaient sur www.busmoovlyon.fr. Ici, l'hôte décide.
 */
export const config = {
  matcher: ['/', '/robots.txt', '/sitemap.xml', '/guides/:slug*'],
}

export default function middleware(request: Request) {
  const host = (request.headers.get('host') || '').toLowerCase()
  const site = MICROSITES[host]
  if (!site) return next()
  const { pathname } = new URL(request.url)
  if (pathname === '/robots.txt') return rewrite(new URL(`/sites/${site}-robots.txt`, request.url))
  if (pathname === '/sitemap.xml') return rewrite(new URL(`/sites/${site}-sitemap.xml`, request.url))
  if (pathname.startsWith('/guides/')) return rewrite(new URL(`/sites/${site}${pathname}`, request.url))
  return rewrite(new URL(`/sites/${site}`, request.url))
}
