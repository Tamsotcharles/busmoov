import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MultiStepQuoteForm } from '@/components/forms/MultiStepQuoteForm'
import { Seo } from '@/components/seo/Seo'
import { TextWithLinks } from '@/components/ui/TextWithLinks'
import { TableauSeo } from '@/components/ui/TableauSeo'
import { ImageContenu } from '@/components/ui/ImageContenu'
import type { DestinationContenu } from '@/lib/chateaux-loire'
import type { SeoPageKey } from '@/lib/seo-data'
import { ArrowRight, CheckCircle } from 'lucide-react'

/**
 * Page de destination multilingue (châteaux de la Loire, villes traduites) :
 * hero, tableau de prix, sections avec liste, FAQ et devis. Le contenu est
 * propre à chaque langue ; la clé SEO relie les versions par hreflang.
 */
export function PageDestination({ page, contenu: c }: { page: SeoPageKey; contenu: DestinationContenu }) {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faq.questions.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }

  return (
    <div className="min-h-screen">
      <Header />
      <Seo page={page} jsonLdPreset="service" jsonLd={faqJsonLd} />

      {/* Hero + réponse à l'intention */}
      <section className="bg-gradient-to-br from-purple-dark to-magenta text-white pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{c.h1}</h1>
          <p className="text-lg opacity-90 max-w-3xl mx-auto mb-8">{c.intro}</p>
          <a href="#devis" className="btn bg-white text-purple-dark hover:bg-gray-100 font-semibold inline-flex items-center gap-2">
            {c.ui.cta} <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {c.image && (
        <section className="pt-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <ImageContenu image={c.image} />
          </div>
        </section>
      )}

      {/* Prix */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-4">{c.prix.h2}</h2>
          <TextWithLinks text={c.prix.intro} className="text-gray-700 leading-relaxed max-w-3xl mx-auto mb-6" />
          <TableauSeo {...c.prix.tableau} />
          <p className="text-xs text-gray-500 mt-3">{c.prix.note}</p>
        </div>
      </section>

      {/* Sections */}
      {c.sections.map((s, i) => (
        <section key={s.h2} className={`py-12 ${i % 2 === 0 ? 'bg-gray-50' : ''}`}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center mb-6">{s.h2}</h2>
            <div className="space-y-4">
              {s.paragraphes.map((p, j) => (
                <div key={j} className="space-y-4">
                  <TextWithLinks text={p} className="text-gray-700 leading-relaxed" />
                  {j === 0 && s.liste && (
                    <ul className="space-y-2">
                      {s.liste.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-magenta flex-none mt-0.5" />
                          <TextWithLinks as="span" text={item} className="text-gray-700" />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* FAQ */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">{c.faq.h2}</h2>
          <div className="space-y-6">
            {c.faq.questions.map((f) => (
              <div key={f.q} className="card">
                <h3 className="font-semibold mb-2">{f.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Devis */}
      <section id="devis" className="py-12 bg-gray-50 scroll-mt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-2">{c.devis.h2}</h2>
          <TextWithLinks text={c.devis.texte} className="text-gray-600 text-center mb-8 max-w-3xl mx-auto" />
          <MultiStepQuoteForm />
        </div>
      </section>

      <Footer />
    </div>
  )
}
