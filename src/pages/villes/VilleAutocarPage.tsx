import { useParams, Navigate, Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MultiStepQuoteForm } from '@/components/forms/MultiStepQuoteForm'
import { SeoFr } from '@/components/seo/Seo'
import { useLocalizedPath } from '@/components/i18n'
import { getVille, villes } from '@/lib/villes'
import { getSiteBaseUrl } from '@/lib/utils'
import { Bus, Clock, Shield, MapPin, CheckCircle, ArrowRight } from 'lucide-react'

/**
 * Page ville SEO « Location d'autocar à <Ville> » — contenu français
 * uniquement (cible les recherches locales françaises).
 */
export function VilleAutocarPage() {
  const { ville: slug } = useParams<{ ville: string }>()
  const localizedPath = useLocalizedPath()
  const ville = slug ? getVille(slug) : undefined

  if (!ville) {
    return <Navigate to="/" replace />
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

      {/* Intro */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {ville.intro.map((p, i) => (
            <p key={i} className="text-gray-700 leading-relaxed">{p}</p>
          ))}
        </div>
      </section>

      {/* Destinations */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            Destinations populaires au départ de {ville.nom}
          </h2>
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
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">Exemples de trajets à {ville.nom}</h2>
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

      {/* FAQ */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">Questions fréquentes</h2>
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

      <Footer />
    </div>
  )
}
