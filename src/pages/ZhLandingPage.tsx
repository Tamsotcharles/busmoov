import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MultiStepQuoteForm } from '@/components/forms/MultiStepQuoteForm'
import { SeoStandalone } from '@/components/seo/Seo'
import { getSiteBaseUrl } from '@/lib/utils'
import { zhMeta, zhIntro, zhServices, zhVehicules, zhFaq, zhTexte } from '@/lib/zh-landing'
import { Bus, Clock, Shield, CheckCircle, ArrowRight } from 'lucide-react'

/**
 * Landing chinoise /zh — organisateurs d'événementiel sinophones en
 * France. Page autonome : le reste du parcours (formulaire, emails)
 * se fait en anglais ou en français, comme indiqué sur la page.
 */
export function ZhLandingPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: '法国大巴与中巴租赁（含司机）',
      description: zhMeta.description,
      inLanguage: 'zh-Hans',
      url: `${getSiteBaseUrl()}${zhMeta.path}`,
      areaServed: { '@type': 'Country', name: 'France' },
      provider: { '@type': 'Organization', name: 'Busmoov', url: getSiteBaseUrl() },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: zhFaq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ]

  const atouts = [
    { icon: Clock, titre: '24小时报价', desc: '多家车行报价一次比较，免费且无义务。' },
    { icon: Shield, titre: '持牌正规车行', desc: '所有合作车行均持有法国客运执照并投保。' },
    { icon: Bus, titre: '8至90座全车型', desc: '商务中巴到双层大巴，均含职业司机。' },
  ]

  return (
    <div className="min-h-screen">
      <Header />
      <SeoStandalone
        langCode="zh"
        ogLocale="zh_CN"
        title={zhMeta.title}
        description={zhMeta.description}
        fullPath={zhMeta.path}
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-dark to-magenta text-white pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{zhMeta.h1}</h1>
          <p className="text-lg opacity-90 max-w-3xl mx-auto mb-8">{zhMeta.sousTitre}</p>
          <a href="#devis" className="btn bg-white text-purple-dark hover:bg-gray-100 font-semibold inline-flex items-center gap-2">
            {zhTexte.ctaTitre} <ArrowRight className="w-4 h-4" />
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

      {/* Intro */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {zhIntro.map((p, i) => (
            <p key={i} className="text-gray-700 leading-relaxed">{p}</p>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">{zhTexte.servicesTitre}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {zhServices.map((s) => (
              <div key={s.titre} className="card">
                <h3 className="font-semibold mb-2">{s.titre}</h3>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Véhicules */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">{zhTexte.vehiculesTitre}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {zhVehicules.map((v) => (
              <div key={v.titre} className="card">
                <h3 className="font-semibold mb-2">{v.titre}</h3>
                <p className="text-sm text-gray-600">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment réserver */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">{zhTexte.commentTitre}</h2>
          <ul className="space-y-3">
            {zhTexte.commentEtapes.map((etape) => (
              <li key={etape} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-magenta flex-none mt-0.5" />
                <span className="text-gray-700">{etape}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">{zhTexte.faqTitre}</h2>
          <div className="space-y-6">
            {zhFaq.map((f) => (
              <div key={f.q} className="card">
                <h3 className="font-semibold mb-2">{f.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulaire */}
      <section id="devis" className="py-12 bg-gray-50 scroll-mt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-2">{zhTexte.ctaTitre}</h2>
          <p className="text-gray-600 text-center mb-2">{zhTexte.ctaTexte}</p>
          <p className="text-sm text-gray-500 text-center mb-8">{zhTexte.noteLangue}</p>
          <MultiStepQuoteForm />
        </div>
      </section>

      <Footer />
    </div>
  )
}
