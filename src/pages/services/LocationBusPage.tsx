import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MultiStepQuoteForm } from '@/components/forms/MultiStepQuoteForm'
import { SeoFr } from '@/components/seo/Seo'
import { useLocalizedPath } from '@/components/i18n'
import { villes } from '@/lib/villes'
import { locationBusMeta } from '@/lib/seo-data'
import { getSiteBaseUrl } from '@/lib/utils'
import { Bus, Users, Shield, Clock, CheckCircle, ArrowRight } from 'lucide-react'

/**
 * Page pilier « Location de bus » (français uniquement) — cible la
 * requête grand public « location de bus avec chauffeur », complémentaire
 * de la page autocar sans la cannibaliser (angle : tous les types de bus).
 */
export function LocationBusPage() {
  const localizedPath = useLocalizedPath()

  const path = '/location-bus'
  const metaTitle = locationBusMeta.title
  const metaDescription = locationBusMeta.description

  const faq = [
    {
      q: 'Combien coûte la location d\'un bus avec chauffeur ?',
      a: 'Une journée en bus standard (jusqu\'à 59 places) démarre à 690 € TTC pour un aller-retour local. Le prix dépend de la distance, de l\'amplitude horaire et de la taille du véhicule : un minibus coûte environ 10 % de moins, un bus grande capacité 15 à 70 % de plus. Demandez un devis gratuit : vous recevez plusieurs propositions sous 24h.',
    },
    {
      q: 'Quelle différence entre un bus et un autocar ?',
      a: 'Dans le langage courant, aucun : on dit « bus » pour tout. Techniquement, le bus est un véhicule urbain (passagers debout autorisés) et l\'autocar un véhicule de tourisme routier avec sièges, ceintures et soutes à bagages. Pour un voyage de groupe, c\'est toujours un autocar qui est loué — c\'est ce que nous proposons, quel que soit le mot que vous employez.',
    },
    {
      q: 'Peut-on louer un bus sans chauffeur ?',
      a: 'Non : la conduite d\'un véhicule de plus de 9 places exige le permis D et une carte de qualification professionnelle. Tous nos bus sont donc loués avec un chauffeur professionnel — son coût, le carburant et les péages sont inclus dans le devis.',
    },
    {
      q: 'Quel bus pour combien de passagers ?',
      a: 'Minibus de 8 à 20 places pour les petits groupes ; bus standard de 21 à 59 places, le format le plus économique par personne ; bus grand tourisme ou double étage de 60 à 90 places pour les grands événements. Indiquez votre effectif exact (accompagnateurs compris) et nous dimensionnons le véhicule.',
    },
  ]

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
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ]

  const types = [
    { titre: 'Minibus (8-20 places)', desc: 'Transferts VIP, petits comités, navettes mariage : le format souple qui passe partout, avec chauffeur.', lien: '/services/location-minibus' },
    { titre: 'Bus standard (21-59 places)', desc: 'Le format le plus demandé et le plus économique par personne : sorties, excursions, voyages scolaires.', lien: '/services/location-autocar' },
    { titre: 'Bus grand tourisme (60-90 places)', desc: 'Grande capacité et double étage pour les grands événements — sièges inclinables, écrans, soutes XXL.', lien: '/services/location-autocar' },
  ]

  const occasions = [
    'Mariages et événements familiaux (navettes invités)',
    'Séminaires, salons et déplacements d\'entreprise',
    'Sorties scolaires et voyages de classe',
    'Transferts aéroport et gare pour groupes',
    'Excursions d\'associations et de clubs seniors',
    'Déplacements sportifs et supporters',
  ]

  const atouts = [
    { icon: Clock, titre: 'Devis gratuit en 24h', desc: 'Plusieurs propositions comparées, sans engagement.' },
    { icon: Shield, titre: 'Transporteurs vérifiés', desc: 'Licences, assurances et véhicules contrôlés dans toute la France.' },
    { icon: Users, titre: 'Chauffeur professionnel inclus', desc: 'Carburant, péages et chauffeur compris dans le prix.' },
    { icon: Bus, titre: 'Du minibus au double étage', desc: 'Le bon véhicule pour chaque taille de groupe, de 8 à 90 places.' },
  ]

  return (
    <div className="min-h-screen">
      <Header />
      <SeoFr title={metaTitle} description={metaDescription} path={path} jsonLd={jsonLd} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-dark to-magenta text-white pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Location de bus avec chauffeur</h1>
          <p className="text-lg opacity-90 max-w-3xl mx-auto mb-8">
            Minibus, bus 59 places ou grand tourisme jusqu'à 90 places : comparez plusieurs devis
            gratuits de transporteurs vérifiés, partout en France.
          </p>
          <a href="#devis" className="btn bg-white text-purple-dark hover:bg-gray-100 font-semibold inline-flex items-center gap-2">
            Demander un devis gratuit <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Atouts */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <h2 className="text-2xl font-bold text-center mb-2">Votre devis de bus en 2 minutes</h2>
          <p className="text-gray-600 text-center mb-8">
            Gratuit et sans engagement — plusieurs propositions de transporteurs sous 24h.
          </p>
          <MultiStepQuoteForm />
        </div>
      </section>

      {/* Types de bus */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">Quel bus pour votre groupe ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {types.map((ty) => (
              <div key={ty.titre} className="card flex flex-col">
                <h3 className="font-semibold mb-2">{ty.titre}</h3>
                <p className="text-sm text-gray-600 mb-4 flex-1">{ty.desc}</p>
                <Link to={localizedPath(ty.lien)} className="text-magenta text-sm font-medium inline-flex items-center gap-1 hover:underline">
                  En savoir plus <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
          <p className="text-gray-600 text-sm text-center mt-6 max-w-2xl mx-auto">
            Bus, car, autocar : quel que soit le mot, il s'agit du même service — un véhicule de
            tourisme avec chauffeur professionnel, dimensionné pour votre groupe.
          </p>
        </div>
      </section>

      {/* Occasions */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">Pour quelles occasions louer un bus ?</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {occasions.map((o) => (
              <li key={o} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-magenta flex-none mt-0.5" />
                <span className="text-gray-700">{o}</span>
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
            {faq.map((f) => (
              <div key={f.q} className="card">
                <h3 className="font-semibold mb-2">{f.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Villes + CTA */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Louez votre bus au départ de votre ville</h2>
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
