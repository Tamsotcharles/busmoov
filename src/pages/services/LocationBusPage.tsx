import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MultiStepQuoteForm } from '@/components/forms/MultiStepQuoteForm'
import { SeoFr } from '@/components/seo/Seo'
import { TextWithLinks } from '@/components/ui/TextWithLinks'
import { TableauSeo } from '@/components/ui/TableauSeo'
import { useLocalizedPath } from '@/components/i18n'
import { villes } from '@/lib/villes'
import { locationBusMeta } from '@/lib/seo-data'
import {
  locationBusIntro,
  locationBusAtouts,
  locationBusTypes,
  locationBusTypesNote,
  locationBusPrix,
  locationBusOccasions,
  locationBusEtapes,
  locationBusFaq,
  locationBusVillesH2,
} from '@/lib/location-bus'
import { getSiteBaseUrl } from '@/lib/utils'
import { Bus, Users, Shield, Clock, CheckCircle, ArrowRight } from 'lucide-react'

/**
 * Page pilier « Location de bus » (français uniquement) — cible la
 * requête grand public « location de bus avec chauffeur », complémentaire
 * de la page autocar sans la cannibaliser (angle : tous les types de bus).
 * Tout le contenu vient de src/lib/location-bus.ts, partagé avec le
 * prérendu statique (scripts/prerender.mjs).
 */
export function LocationBusPage() {
  const localizedPath = useLocalizedPath()

  const path = '/location-bus'
  const metaTitle = locationBusMeta.title
  const metaDescription = locationBusMeta.description

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Location de bus avec chauffeur',
      description: metaDescription,
      url: `${getSiteBaseUrl()}/fr${path}`,
      provider: { '@type': 'Organization', name: 'Busmoov', url: getSiteBaseUrl() },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: locationBusFaq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ]

  const icons = [Clock, Shield, Users, Bus]

  return (
    <div className="min-h-screen">
      <Header />
      <SeoFr title={metaTitle} description={metaDescription} path={path} jsonLd={jsonLd} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-dark to-magenta text-white pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{locationBusMeta.h1}</h1>
          <p className="text-lg opacity-90 max-w-3xl mx-auto mb-8">{locationBusMeta.sousTitre}</p>
          <a href="#devis" className="btn bg-white text-purple-dark hover:bg-gray-100 font-semibold inline-flex items-center gap-2">
            Demander un devis gratuit <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Atouts */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {locationBusAtouts.map((a, i) => {
            const Icon = icons[i] ?? Bus
            return (
              <div key={a.titre} className="card text-center">
                <Icon className="w-8 h-8 text-magenta mx-auto mb-3" />
                <h3 className="font-semibold mb-1">{a.titre}</h3>
                <p className="text-sm text-gray-600">{a.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Formulaire */}
      <section id="devis" className="py-12 scroll-mt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-2">Votre devis de bus en 2 minutes</h2>
          <p className="text-gray-600 text-center mb-8">
            Gratuit et sans engagement — plusieurs propositions de transporteurs sous 24h.
          </p>
          <MultiStepQuoteForm />
        </div>
      </section>

      {/* Intro */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {locationBusIntro.map((p, i) => (
            <TextWithLinks key={i} text={p} className="text-gray-700 leading-relaxed" />
          ))}
        </div>
      </section>

      {/* Types de bus */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">Quel bus pour votre groupe ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {locationBusTypes.map((ty) => (
              <div key={ty.titre} className="card flex flex-col">
                <h3 className="font-semibold mb-2">{ty.titre}</h3>
                <p className="text-sm text-gray-600 mb-4 flex-1">{ty.desc}</p>
                <Link to={localizedPath(ty.lien)} className="text-magenta text-sm font-medium inline-flex items-center gap-1 hover:underline">
                  En savoir plus <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
          <TextWithLinks text={locationBusTypesNote} className="text-gray-600 text-sm text-center mt-6 max-w-2xl mx-auto" />
        </div>
      </section>

      {/* Prix */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-6">{locationBusPrix.h2}</h2>
          {locationBusPrix.paragraphes.map((p, i) => (
            <TextWithLinks key={i} text={p} className="text-gray-700 leading-relaxed mb-4" />
          ))}
          <TableauSeo {...locationBusPrix.tableau} />
          {locationBusPrix.apres.map((p, i) => (
            <TextWithLinks key={i} text={p} className="text-gray-700 leading-relaxed mb-4" />
          ))}
        </div>
      </section>

      {/* Occasions */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">Pour quelles occasions louer un bus ?</h2>
          <ul className="space-y-3">
            {locationBusOccasions.map((o) => (
              <li key={o} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-magenta flex-none mt-0.5" />
                <TextWithLinks text={o} className="text-gray-700" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Étapes */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">{locationBusEtapes.h2}</h2>
          <ul className="space-y-3">
            {locationBusEtapes.liste.map((e) => (
              <li key={e} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-magenta flex-none mt-0.5" />
                <TextWithLinks text={e} className="text-gray-700" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">Questions fréquentes</h2>
          <div className="space-y-6">
            {locationBusFaq.map((f) => (
              <div key={f.q} className="card">
                <h3 className="font-semibold mb-2">{f.q}</h3>
                <TextWithLinks text={f.a} className="text-sm text-gray-600 leading-relaxed" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Villes + CTA */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">{locationBusVillesH2}</h2>
          <p className="text-sm text-gray-500 mb-6">
            {villes.map((v, i) => (
              <span key={v.slug}>
                <Link to={localizedPath(`/location-autocar/${v.slug}`)} className="text-magenta hover:underline">{v.nom}</Link>
                {i < villes.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </p>
          <a href="#devis" className="btn btn-primary inline-flex items-center gap-2">
            Demander un devis gratuit <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
