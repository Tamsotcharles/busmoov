import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MultiStepQuoteForm } from '@/components/forms/MultiStepQuoteForm'
import { SeoFr } from '@/components/seo/Seo'
import { TextWithLinks } from '@/components/ui/TextWithLinks'
import { getSiteBaseUrl } from '@/lib/utils'
import type { Landing } from '@/lib/landings'
import { Clock, Shield, Bus, CheckCircle, ArrowRight } from 'lucide-react'

/**
 * Gabarit des landing pages SEO françaises pilotées par les données de
 * src/lib/landings.ts (navette CDG/Orly, navette entreprise, bus 50
 * places…). Ajouter une page = une entrée dans landings.ts.
 */
export function LandingSeoPage({ landing }: { landing: Landing }) {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: landing.serviceType,
      description: landing.metaDescription,
      url: `${getSiteBaseUrl()}/fr${landing.slug}`,
      provider: { '@type': 'Organization', name: 'Busmoov', url: getSiteBaseUrl() },
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

  const atouts = [
    { icon: Clock, titre: 'Devis gratuit en 24h', desc: 'Plusieurs propositions de transporteurs comparées pour vous.' },
    { icon: Shield, titre: 'Transporteurs vérifiés', desc: 'Licences et assurances contrôlées, partout en France.' },
    { icon: Bus, titre: 'Chauffeur professionnel inclus', desc: 'Carburant et péages compris dans le prix, de 8 à 90 places.' },
  ]

  return (
    <div className="min-h-screen">
      <Header />
      <SeoFr title={landing.metaTitle} description={landing.metaDescription} path={landing.slug} jsonLd={jsonLd} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-dark to-magenta text-white pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{landing.h1}</h1>
          <p className="text-lg opacity-90 max-w-3xl mx-auto mb-8">{landing.sousTitre}</p>
          <a href="#devis" className="btn bg-white text-purple-dark hover:bg-gray-100 font-semibold inline-flex items-center gap-2">
            Demander un devis gratuit <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Atouts */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {atouts.map((a) => (
            <div key={a.titre} className="card text-center">
              <a.icon className="w-8 h-8 text-magenta mx-auto mb-3" />
              <h3 className="font-semibold mb-1">{a.titre}</h3>
              <p className="text-sm text-gray-600">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Formulaire */}
      <section id="devis" className="py-12 scroll-mt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-2">Votre devis en 2 minutes</h2>
          <p className="text-gray-600 text-center mb-8">
            Gratuit et sans engagement — plusieurs propositions de transporteurs sous 24h.
          </p>
          <MultiStepQuoteForm />
        </div>
      </section>

      {/* Intro */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {landing.intro.map((p, i) => (
            <TextWithLinks key={i} text={p} className="text-gray-700 leading-relaxed" />
          ))}
        </div>
      </section>

      {/* Sections */}
      {landing.sections.map((section, i) => (
        <section key={section.h2} className={`py-12 ${i % 2 === 1 ? 'bg-gray-50' : ''}`}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center mb-6">{section.h2}</h2>
            {section.paragraphes?.map((p, j) => (
              <TextWithLinks key={j} text={p} className="text-gray-700 leading-relaxed mb-4" />
            ))}
            {section.liste && (
              <ul className="space-y-3">
                {section.liste.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-magenta flex-none mt-0.5" />
                    <TextWithLinks text={item} className="text-gray-700" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}

      {/* FAQ */}
      <section className={`py-12 ${landing.sections.length % 2 === 1 ? 'bg-gray-50' : ''}`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">Questions fréquentes</h2>
          <div className="space-y-6">
            {landing.faq.map((f) => (
              <div key={f.q} className="card">
                <h3 className="font-semibold mb-2">{f.q}</h3>
                <TextWithLinks text={f.a} className="text-sm text-gray-600 leading-relaxed" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Prêt à réserver ?</h2>
          <p className="text-gray-600 mb-6">Décrivez votre trajet en 2 minutes, recevez plusieurs devis gratuits sous 24h.</p>
          <a href="#devis" className="btn btn-primary inline-flex items-center gap-2">
            Demander un devis gratuit <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
