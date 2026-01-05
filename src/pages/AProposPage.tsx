import { Link } from 'react-router-dom'
import { ArrowLeft, Award, Users, MapPin, Clock, Shield, Heart, Bus, Star, CheckCircle } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export function AProposPage() {
  const values = [
    {
      icon: Shield,
      title: 'Fiabilité',
      description: 'Des transporteurs rigoureusement sélectionnés et contrôlés pour garantir votre sécurité.',
    },
    {
      icon: Heart,
      title: 'Service client',
      description: 'Une équipe dédiée disponible 6j/7 pour vous accompagner avant, pendant et après votre voyage.',
    },
    {
      icon: Star,
      title: 'Qualité',
      description: 'Des véhicules récents, confortables et parfaitement entretenus pour un voyage agréable.',
    },
    {
      icon: Award,
      title: 'Expertise',
      description: 'Plus de 10 ans d\'expérience dans le transport de voyageurs en autocar.',
    },
  ]

  const stats = [
    { value: '10+', label: 'Années d\'expérience' },
    { value: '150+', label: 'Transporteurs partenaires' },
    { value: '50 000+', label: 'Passagers transportés' },
    { value: '98%', label: 'Clients satisfaits' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showAdminLink={false} />

      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="bg-gradient-to-br from-purple-dark to-purple text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft size={18} />
              Retour à l'accueil
            </Link>

            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                À propos de Busmoov
              </h1>
              <p className="text-xl text-white/90 leading-relaxed">
                Busmoov est une marque du groupe Centrale Autocar, leader français de la mise en relation
                entre clients et transporteurs. Notre mission : rendre le transport en autocar simple,
                accessible et fiable pour tous.
              </p>
            </div>
          </div>
        </section>

        {/* Notre histoire */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Notre histoire
                </h2>
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <p>
                    Fondée il y a plus de 10 ans, <strong>Centrale Autocar</strong> est née d'un constat simple :
                    réserver un autocar avec chauffeur était un véritable parcours du combattant.
                    Entre les multiples appels, les devis incomparables et l'incertitude sur la qualité
                    des prestataires, les clients se retrouvaient souvent perdus.
                  </p>
                  <p>
                    Notre fondateur, passionné par le transport et l'innovation, a décidé de créer
                    une plateforme centralisant les meilleurs transporteurs de France. L'objectif ?
                    Permettre à chacun d'obtenir rapidement plusieurs devis comparables et de réserver
                    en toute confiance.
                  </p>
                  <p>
                    Aujourd'hui, <strong>Busmoov</strong> perpétue cette vision en proposant une expérience
                    digitale moderne et intuitive. Que vous organisiez une sortie scolaire, un voyage
                    d'entreprise ou un événement familial, nous sommes là pour vous accompagner.
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple/5 to-magenta/5 rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center p-6 bg-white rounded-2xl shadow-sm">
                      <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Nos valeurs */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              Nos valeurs
            </h2>
            <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
              Ce qui nous guide au quotidien pour vous offrir le meilleur service possible.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple to-magenta rounded-xl flex items-center justify-center mb-4">
                    <value.icon size={28} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Notre engagement */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-purple to-magenta rounded-3xl p-8 md:p-12 text-white">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-6">
                    Notre engagement qualité
                  </h2>
                  <ul className="space-y-4">
                    {[
                      'Transporteurs certifiés et assurés',
                      'Véhicules contrôlés et récents',
                      'Chauffeurs professionnels expérimentés',
                      'Devis transparents sans frais cachés',
                      'Accompagnement personnalisé',
                      'Satisfaction garantie ou remboursé',
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <CheckCircle size={20} className="text-white/80 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-center">
                  <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center">
                    <Bus size={80} className="mx-auto mb-4 text-white/80" />
                    <p className="text-2xl font-bold mb-2">Centrale Autocar</p>
                    <p className="text-white/70">Groupe fondateur de Busmoov</p>
                    <a
                      href="https://www.centrale-autocar.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-4 text-sm underline hover:no-underline"
                    >
                      Visiter le site
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Prêt à voyager avec nous ?
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Obtenez un devis gratuit en quelques minutes et découvrez la qualité Busmoov.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/#quote" className="btn btn-primary btn-lg">
                Demander un devis gratuit
              </Link>
              <Link to="/contact" className="btn btn-secondary btn-lg">
                Nous contacter
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
