import { useEffect } from 'react'
import { Phone, CheckCircle, MapPin, Bus } from 'lucide-react'
import { MultiStepQuoteForm } from '@/components/forms/MultiStepQuoteForm'
import { TableauSeo } from '@/components/ui/TableauSeo'
import { lyonSite as s } from '@/lib/sites/lyon'
import { MAIN_SITE_URL } from '@/lib/microsite'
import { lyonGuides } from '@/lib/sites/lyon-guides'
import { Link } from 'react-router-dom'

/**
 * Page unique du microsite busmoovlyon.fr. Pas de Header/Footer du site
 * principal : le microsite doit vivre seul (quelques liens légaux vers le
 * site national en pied de page, rien d'autre).
 */
export function LyonSitePage() {
  useEffect(() => {
    document.documentElement.lang = 'fr'
    document.title = s.titre
    const meta = document.querySelector('meta[name="description"]') || Object.assign(document.createElement('meta'), { name: 'description' })
    meta.setAttribute('content', s.description)
    if (!meta.parentNode) document.head.appendChild(meta)
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical) }
    canonical.href = s.url
  }, [])
  return (
    <div className="min-h-screen bg-white text-gray-800">

      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo-icon.svg" alt="Busmoov Lyon" className="w-9 h-9" />
            <span className="font-display font-bold text-purple-dark text-lg">Busmoov <span className="text-magenta">Lyon</span></span>
          </a>
          <a href={`tel:${s.telephoneHref}`} className="flex items-center gap-2 font-semibold text-purple-dark">
            <Phone size={18} className="text-magenta" /> {s.telephone}
          </a>
        </div>
      </header>

      <section className="bg-gradient-to-br from-purple-dark to-magenta text-white">
        <div className="max-w-6xl mx-auto px-4 py-14 grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">{s.h1}</h1>
            <p className="text-lg opacity-90 mb-6">{s.sousTitre}</p>
            <ul className="space-y-2 text-sm">
              {['Transporteurs lyonnais vérifiés', 'Prix ferme : chauffeur, carburant et péages inclus', 'Jusqu\'à 3 devis comparés sous 24h, gratuits et sans engagement'].map((t) => (
                <li key={t} className="flex items-center gap-2"><CheckCircle size={16} /> {t}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 text-gray-800" id="devis">
            <MultiStepQuoteForm />
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-14">
        <section className="space-y-4">
          {s.intro.map((t) => <p key={t} className="text-gray-700 leading-relaxed">{t}</p>)}
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-purple-dark mb-6">{s.prestations.h2}</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {s.prestations.items.map((it) => (
              <div key={it.titre} className="card">
                <div className="flex items-center gap-2 mb-2"><Bus size={18} className="text-magenta" /><h3 className="font-semibold">{it.titre}</h3></div>
                <p className="text-sm text-gray-600">{it.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-purple-dark mb-4">{s.prix.h2}</h2>
          <p className="text-gray-700 mb-4">{s.prix.intro}</p>
          <TableauSeo {...s.prix.tableau} />
          <p className="text-gray-700 mt-4">{s.prix.apres}</p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-purple-dark mb-3">{s.zones.h2}</h2>
          <p className="text-gray-700 mb-3">{s.zones.intro}</p>
          <ul className="flex flex-wrap gap-2">
            {s.zones.villes.map((v) => <li key={v} className="px-3 py-1 rounded-full bg-purple-50 text-purple-dark text-sm flex items-center gap-1"><MapPin size={12} /> {v}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-purple-dark mb-4">{s.etapes.h2}</h2>
          <ol className="space-y-3">
            {s.etapes.liste.map((t, i) => (
              <li key={t} className="flex gap-3"><span className="w-7 h-7 rounded-full bg-magenta text-white flex items-center justify-center font-bold flex-none">{i + 1}</span><span className="text-gray-700">{t}</span></li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-purple-dark mb-4">Questions fréquentes</h2>
          <div className="space-y-4">
            {s.faq.map((f) => (
              <div key={f.q} className="card">
                <h3 className="font-semibold mb-1">{f.q}</h3>
                <p className="text-sm text-gray-600">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-purple-dark mb-4">Nos guides pour organiser votre transport à Lyon</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {lyonGuides.map((g) => (
              <Link key={g.slug} to={`/guides/${g.slug}`} className="card hover:border-magenta transition-colors">
                <h3 className="font-semibold text-purple-dark mb-1">{g.titre}</h3>
                <p className="text-sm text-gray-600">{g.extrait}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="text-center bg-purple-50 rounded-2xl p-8">
          <h2 className="font-display text-2xl font-bold text-purple-dark mb-2">Votre devis autocar à Lyon en 2 minutes</h2>
          <p className="text-gray-700 mb-4">Jusqu'à 3 propositions de transporteurs lyonnais sous 24h, gratuites et sans engagement.</p>
          <a href="#devis" className="btn btn-primary">Demander mes devis</a>
        </section>
      </main>

      <footer className="border-t py-8 text-sm text-gray-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap gap-4 justify-between">
          <span>© {new Date().getFullYear()} Busmoov Lyon · BUSMOOV SAS, 41 Rue Barrault, 75013 Paris · {s.telephone}</span>
          <span className="flex gap-4">
            <a href={`${MAIN_SITE_URL}/fr/cgv`} className="hover:underline">CGV</a>
            <a href={`${MAIN_SITE_URL}/fr/mentions-legales`} className="hover:underline">Mentions légales</a>
            <a href={`${MAIN_SITE_URL}/fr/politique-confidentialite`} className="hover:underline">Confidentialité</a>
          </span>
        </div>
      </footer>
    </div>
  )
}
