import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Phone, ArrowLeft } from 'lucide-react'
import { TableauSeo } from '@/components/ui/TableauSeo'
import { TextWithLinks } from '@/components/ui/TextWithLinks'
import { lyonSite as s } from '@/lib/sites/lyon'
import { getLyonGuide, lyonGuides } from '@/lib/sites/lyon-guides'
import { formatDate } from '@/lib/utils'
import type { BlogBlock } from '@/lib/blog'

function Bloc({ b }: { b: BlogBlock }) {
  switch (b.type) {
    case 'h2': return <h2 className="font-display text-2xl font-bold text-purple-dark mt-10 mb-3">{b.text}</h2>
    case 'h3': return <h3 className="font-semibold text-lg mt-6 mb-2">{b.text}</h3>
    case 'p': return <TextWithLinks text={b.text} className="text-gray-700 leading-relaxed mb-4" />
    case 'ul': return <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">{b.items.map((i) => <li key={i}><TextWithLinks text={i} /></li>)}</ul>
    case 'callout': return <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 my-6"><TextWithLinks text={b.text} className="text-purple-dark" /></div>
    case 'table': return <TableauSeo caption={b.caption} headers={b.headers} rows={b.rows} />
    default: return null
  }
}

export function LyonGuidePage() {
  const { slug = '' } = useParams()
  const guide = getLyonGuide(slug)
  useEffect(() => {
    if (!guide) return
    document.documentElement.lang = 'fr'
    document.title = guide.metaTitle
    document.querySelector('meta[name="description"]')?.setAttribute('content', guide.metaDescription)
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical) }
    canonical.href = `${s.url}guides/${guide.slug}`
    window.scrollTo(0, 0)
  }, [guide])

  if (!guide) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Guide introuvable</h1>
        <Link to="/" className="btn btn-primary">Retour à l'accueil</Link>
      </div>
    )
  }
  const autres = lyonGuides.filter((g) => g.slug !== guide.slug).slice(0, 3)
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-icon.svg" alt="Busmoov Lyon" className="w-9 h-9" />
            <span className="font-display font-bold text-purple-dark text-lg">Busmoov <span className="text-magenta">Lyon</span></span>
          </Link>
          <a href={`tel:${s.telephoneHref}`} className="flex items-center gap-2 font-semibold text-purple-dark"><Phone size={18} className="text-magenta" /> {s.telephone}</a>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/" className="text-sm text-gray-500 hover:text-magenta flex items-center gap-1 mb-6"><ArrowLeft size={14} /> Busmoov Lyon</Link>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-3">{guide.titre}</h1>
        <p className="text-sm text-gray-500 mb-8">Publié le {formatDate(guide.datePublication)} par l'équipe Busmoov Lyon · Mis à jour le {formatDate(guide.dateMiseAJour ?? guide.datePublication)}</p>
        <article>{guide.blocks.map((b, i) => <Bloc key={i} b={b} />)}</article>
        <section className="mt-12 bg-gradient-to-br from-purple-dark to-magenta text-white rounded-2xl p-8 text-center">
          <h2 className="font-display text-2xl font-bold mb-2">Votre devis autocar à Lyon en 2 minutes</h2>
          <p className="opacity-90 mb-4">Jusqu'à 3 propositions de transporteurs lyonnais sous 24h, gratuites et sans engagement.</p>
          <Link to="/#devis" className="btn bg-white text-purple-dark hover:bg-gray-100">Demander mes devis</Link>
        </section>
        {autres.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-xl font-bold text-purple-dark mb-4">À lire aussi</h2>
            <ul className="space-y-2">
              {autres.map((g) => <li key={g.slug}><Link to={`/guides/${g.slug}`} className="text-magenta hover:underline">{g.titre}</Link></li>)}
            </ul>
          </section>
        )}
      </main>
      <footer className="border-t py-8 text-sm text-gray-500">
        <div className="max-w-3xl mx-auto px-4">© {new Date().getFullYear()} Busmoov Lyon · BUSMOOV SAS, 41 Rue Barrault, 75013 Paris · {s.telephone}</div>
      </footer>
    </div>
  )
}
