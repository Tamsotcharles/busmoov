import { useParams, Link } from 'react-router-dom'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MultiStepQuoteForm } from '@/components/forms/MultiStepQuoteForm'
import { SeoFr } from '@/components/seo/Seo'
import { useLocalizedPath } from '@/components/i18n'
import { getVille, villes, type Ville, type VilleClassique, type VilleEnrichie } from '@/lib/villes'
import { getSiteBaseUrl } from '@/lib/utils'
import { Bus, Clock, Shield, MapPin, CheckCircle, ArrowRight, Info } from 'lucide-react'
import { TextWithLinks } from '@/components/ui/TextWithLinks'

/**
 * Page ville SEO « Location d'autocar à <Ville> » — contenu français
 * uniquement (cible les recherches locales françaises).
 */
export function VilleAutocarPage() {
  const { ville: slug } = useParams<{ ville: string }>()
  const ville = slug ? getVille(slug) : undefined

  if (!ville) {
    return <NotFoundPage />
  }

  const path = `/location-autocar/${ville.slug}`
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: `Location d'autocar avec chauffeur à ${ville.nom}`,
      description: ville.metaDescription,
      url: `${getSiteBaseUrl()}/fr${path}`,
      areaServed: { '@type': 'City', name: ville.nom },
      provider: { '@type': 'Organization', name: 'Busmoov', url: getSiteBaseUrl() },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${getSiteBaseUrl()}/fr` },
        { '@type': 'ListItem', position: 2, name: "Location d'autocar", item: `${getSiteBaseUrl()}/fr/services/location-autocar` },
        { '@type': 'ListItem', position: 3, name: ville.nom, item: `${getSiteBaseUrl()}/fr${path}` },
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

  const atouts = [
    { icon: Clock, title: 'Devis gratuit en 24h', desc: 'Plusieurs propositions de transporteurs comparées pour vous.' },
    { icon: Shield, title: 'Transporteurs vérifiés', desc: `Des professionnels implantés dans la région de ${ville.nom}, licences et assurances contrôlées.` },
    { icon: Bus, title: 'Du minibus au double étage', desc: 'De 8 à 90 places, avec chauffeur professionnel inclus.' },
  ]

  return (
    <div className="min-h-screen">
      <Header />
      <SeoFr title={ville.metaTitle} description={ville.metaDescription} path={path} jsonLd={jsonLd} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-dark to-magenta text-white pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{ville.h1}</h1>
          <p className="text-lg opacity-90 max-w-3xl mx-auto mb-8">{ville.sousTitre}</p>
          <a href="#devis" className="btn bg-white text-purple-dark hover:bg-gray-100 font-semibold inline-flex items-center gap-2">
            Demander un devis gratuit <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {ville.format === 'enrichi' && <IntroSection ville={ville} />}

      {/* Atouts */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {atouts.map((a) => (
            <div key={a.title} className="card text-center">
              <a.icon className="w-8 h-8 text-magenta mx-auto mb-3" />
              <h3 className="font-semibold mb-1">{a.title}</h3>
              <p className="text-sm text-gray-600">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Formulaire de devis intégré */}
      <section id="devis" className="py-12 scroll-mt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-2">
            Votre devis autocar à {ville.nom} en 2 minutes
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Gratuit et sans engagement — plusieurs propositions de transporteurs sous 24h.
          </p>
          <MultiStepQuoteForm />
        </div>
      </section>

      {ville.format === 'enrichi'
        ? <SectionsEnrichies ville={ville} />
        : <SectionsClassiques ville={ville} />}

      <Footer />
    </div>
  )
}

/** Intro de la page (sous le hero en format enrichi, après le formulaire sinon). */
function IntroSection({ ville }: { ville: Ville }) {
  return (
    <section className="py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {ville.intro.map((p, i) => (
          <p key={i} className="text-gray-700 leading-relaxed">{p}</p>
        ))}
      </div>
    </section>
  )
}

/** Format historique des pages villes. */
function SectionsClassiques({ ville }: { ville: VilleClassique }) {
  const localizedPath = useLocalizedPath()
  return (
    <>
        <IntroSection ville={ville} />

        {/* Ancrage local : logistique propre à la ville */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center mb-6">{ville.sectionLocale.h2}</h2>
            <div className="space-y-4">
              {ville.sectionLocale.paragraphes.map((p, i) => (
                <p key={i} className="text-gray-700 leading-relaxed">{p}</p>
              ))}
            </div>
          </div>
        </section>

        {/* Destinations */}
        <section className="py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center mb-8">{ville.h2Destinations}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {ville.destinations.map((d) => (
                <div key={d.nom} className="card">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-magenta flex-none" />
                    <h3 className="font-semibold">{d.nom}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{d.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trajets types */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center mb-8">{ville.h2Trajets}</h2>
            <ul className="space-y-3">
              {ville.trajets.map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-magenta flex-none mt-0.5" />
                  <span className="text-gray-700">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Maillage interne contextuel */}
        <section className="py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            {ville.liensUtiles.map((texte, i) => (
              <TextWithLinks key={i} text={texte} className="text-gray-700 leading-relaxed" />
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center mb-8">Vos questions sur l'autocar à {ville.nom}</h2>
            <div className="space-y-6">
              {ville.faq.map((f) => (
                <div key={f.q} className="card">
                  <h3 className="font-semibold mb-2">{f.q}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Autres villes + CTA */}
        <section className="py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Prêt à réserver votre autocar à {ville.nom} ?</h2>
            <p className="text-gray-600 mb-6">
              Décrivez votre trajet en 2 minutes, recevez plusieurs devis gratuits sous 24h.
            </p>
            <a href="#devis" className="btn btn-primary inline-flex items-center gap-2">
              Demander un devis gratuit <ArrowRight className="w-4 h-4" />
            </a>
            <p className="text-sm text-gray-500 mt-8">
              Busmoov également disponible à{' '}
              {villes.filter((v) => v.slug !== ville.slug).map((v, i, arr) => (
                <span key={v.slug}>
                  <Link to={localizedPath(`/location-autocar/${v.slug}`)} className="text-magenta hover:underline">{v.nom}</Link>
                  {i < arr.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          </div>
        </section>
    </>
  )
}

/**
 * Format enrichi (template page ville d'octobre 2026) : prix, réservation,
 * véhicules, minibus, ancrage local, sorties, FAQ, budgets types, CTA et
 * villes proches.
 */
function SectionsEnrichies({ ville }: { ville: VilleEnrichie }) {
  const localizedPath = useLocalizedPath()
  const proches = ville.proximite
    .map((slug) => villes.find((v) => v.slug === slug))
    .filter((v): v is Ville => v !== undefined)

  return (
    <>
      {/* Prix */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-4">{ville.prix.h2}</h2>
          <TextWithLinks text={ville.prix.intro} className="text-gray-700 leading-relaxed max-w-3xl mx-auto mb-6" />
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-3 font-semibold">Trajet au départ de {ville.nom}</th>
                  <th className="p-3 font-semibold">Durée</th>
                  <th className="p-3 font-semibold">Formule</th>
                  <th className="p-3 font-semibold">Minibus 8 à 20 pl.</th>
                  <th className="p-3 font-semibold">Autocar jusqu'à 59 pl.</th>
                  <th className="p-3 font-semibold">Par personne (car plein)</th>
                </tr>
              </thead>
              <tbody>
                {ville.prix.lignes.map((l) => (
                  <tr key={l.trajet} className="border-t border-gray-100">
                    <td className="p-3 font-medium">{l.trajet}</td>
                    <td className="p-3 whitespace-nowrap">{l.duree}</td>
                    <td className="p-3">{l.formule}</td>
                    <td className="p-3 whitespace-nowrap">{l.minibus}</td>
                    <td className="p-3 whitespace-nowrap">{l.autocar}</td>
                    <td className="p-3 whitespace-nowrap">{l.parPersonne}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-3">{ville.prix.note}</p>
          <p className="text-gray-700 leading-relaxed max-w-3xl mx-auto mt-6">{ville.prix.variation}</p>
          <div className="text-center mt-6">
            <a href="#devis" className="btn btn-primary inline-flex items-center gap-2">
              Obtenir mon prix exact <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Comment louer */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-6">{ville.commentLouer.h2}</h2>
          <ol className="space-y-3 mb-6">
            {ville.commentLouer.etapes.map((etape, i) => (
              <li key={etape} className="flex items-start gap-3">
                <span className="flex-none w-7 h-7 rounded-full bg-magenta text-white text-sm font-semibold flex items-center justify-center">{i + 1}</span>
                <span className="text-gray-700 pt-0.5">{etape}</span>
              </li>
            ))}
          </ol>
          <div className="bg-purple-50 border-l-4 border-magenta rounded-r-lg p-4 flex gap-3">
            <Info className="w-5 h-5 text-magenta flex-none mt-0.5" />
            <p className="text-gray-700 text-sm leading-relaxed">{ville.commentLouer.conseil}</p>
          </div>
        </div>
      </section>

      {/* Véhicules, minibus, ancrage local */}
      {[ville.vehicules, ville.minibus, ville.sectionLocale].map((bloc, i) =>
        bloc ? (
          <section key={bloc.h2} className={`py-12 ${i % 2 === 1 ? 'bg-gray-50' : ''}`}>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-center mb-6">{bloc.h2}</h2>
              <div className="space-y-4">
                {bloc.paragraphes.map((p, j) => (
                  <TextWithLinks key={j} text={p} className="text-gray-700 leading-relaxed" />
                ))}
              </div>
            </div>
          </section>
        ) : null
      )}

      {/* Sorties de groupe */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-4">{ville.visiter.h2}</h2>
          <TextWithLinks text={ville.visiter.intro} className="text-gray-700 leading-relaxed max-w-3xl mx-auto mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ville.visiter.lieux.map((l) => (
              <div key={l.nom} className="card">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-magenta flex-none" />
                  <h3 className="font-semibold">{l.nom}</h3>
                </div>
                <p className="text-xs text-gray-500 mb-2">{l.trajet === 'en ville' ? 'En ville' : `À ${l.trajet} de ${ville.nom}`}</p>
                <TextWithLinks text={l.desc} className="text-sm text-gray-600" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">Vos questions sur la location de bus à {ville.nom}</h2>
          <div className="space-y-6">
            {ville.faq.map((f) => (
              <div key={f.q} className="card">
                <h3 className="font-semibold mb-2">{f.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Budgets types + CTA */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-4">{ville.budgets.h2}</h2>
          <p className="text-gray-700 leading-relaxed mb-4">{ville.budgets.intro}</p>
          <ul className="space-y-3 mb-3">
            {ville.budgets.exemples.map((e) => (
              <li key={e} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-magenta flex-none mt-0.5" />
                <span className="text-gray-700">{e}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mb-8">{ville.budgets.note}</p>
          <div className="text-center">
            <a href="#devis" className="btn btn-primary inline-flex items-center gap-2">
              Demander un devis gratuit <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Villes proches */}
      {proches.length > 0 && (
        <section className="py-8">
          <p className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-gray-500 text-center">
            <span className="font-semibold text-gray-700">Location d'autocar près de {ville.nom} : </span>
            {proches.map((v, i) => (
              <span key={v.slug}>
                <Link to={localizedPath(`/location-autocar/${v.slug}`)} className="text-magenta hover:underline">{v.nom}</Link>
                {i < proches.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </p>
        </section>
      )}
    </>
  )
}
