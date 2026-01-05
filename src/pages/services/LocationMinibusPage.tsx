import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Link } from 'react-router-dom'
import { Bus, Users, Shield, Clock, MapPin, CheckCircle, Star, Phone, ArrowRight, Briefcase, Heart, Camera, Building2 } from 'lucide-react'

export function LocationMinibusPage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/5 w-96 h-96 bg-magenta/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/5 w-96 h-96 bg-purple/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-magenta/10 to-purple/10 border border-magenta/20 rounded-full text-magenta text-sm font-medium mb-6">
              <Bus size={16} />
              Location de minibus avec chauffeur
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-purple-dark leading-tight mb-6">
              Location de minibus{' '}
              <span className="gradient-text">8 à 25 places</span>{' '}
              avec chauffeur
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              La solution idéale pour vos petits groupes ! Nos minibus avec chauffeur professionnel sont parfaits pour
              vos déplacements d'affaires, transferts VIP, excursions en famille ou événements privés.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/#quote"
                className="btn btn-primary text-lg px-8 py-4 inline-flex items-center justify-center gap-2"
              >
                Demander un devis gratuit
                <ArrowRight size={20} />
              </Link>
              <a
                href="tel:+33176311283"
                className="btn btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center gap-2"
              >
                <Phone size={20} />
                01 76 31 12 83
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 mt-10 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                Devis gratuit en 24h
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                Minibus 8 à 25 places
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                Chauffeur professionnel inclus
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Avantages du minibus */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-4">
              Les avantages du minibus avec chauffeur
            </h2>
            <p className="text-gray-600 text-lg">
              Une solution de transport flexible, confortable et économique pour vos petits groupes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Users,
                title: 'Capacité adaptée',
                description: 'De 8 à 25 passagers selon vos besoins, idéal pour les petits groupes sans payer un grand car.',
              },
              {
                icon: MapPin,
                title: 'Accès facilité',
                description: 'Véhicule compact permettant l\'accès aux centres-villes, ruelles étroites et parkings limités.',
              },
              {
                icon: Star,
                title: 'Confort premium',
                description: 'Climatisation, sièges confortables et espace bagages généreux pour un voyage agréable.',
              },
              {
                icon: Clock,
                title: 'Flexibilité totale',
                description: 'Horaires personnalisés, itinéraires sur-mesure et arrêts selon vos besoins.',
              },
            ].map((advantage, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-6 hover:bg-white hover:shadow-xl border border-transparent hover:border-gray-200 transition-all duration-300"
              >
                <div className="w-14 h-14 mb-4 bg-gradient-to-br from-magenta/10 to-purple/10 rounded-xl flex items-center justify-center">
                  <advantage.icon size={28} className="text-magenta" />
                </div>
                <h3 className="font-display text-lg font-semibold text-purple-dark mb-2">
                  {advantage.title}
                </h3>
                <p className="text-gray-600 text-sm">{advantage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Types de minibus */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-4">
              Nos différentes capacités de minibus
            </h2>
            <p className="text-gray-600 text-lg">
              Choisissez le minibus adapté à la taille de votre groupe
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Minibus 8-9 places',
                description: 'Le plus compact de notre flotte, parfait pour les transferts VIP et petits groupes.',
                usages: ['Transferts aéroport', 'Réunions d\'affaires', 'Sorties en famille', 'Navettes hôtel'],
                features: ['Climatisation', 'Bagages inclus', 'Confort premium'],
              },
              {
                title: 'Minibus 12-16 places',
                description: 'L\'équilibre parfait entre capacité et maniabilité pour vos groupes moyens.',
                usages: ['Excursions touristiques', 'Séminaires', 'Mariages', 'Événements sportifs'],
                features: ['Climatisation', 'Large soute', 'Wi-Fi sur demande'],
              },
              {
                title: 'Minibus 20-25 places',
                description: 'Notre plus grand minibus, idéal pour les groupes qui veulent rester ensemble.',
                usages: ['Voyages scolaires', 'Associations', 'Clubs sportifs', 'Sorties d\'entreprise'],
                features: ['Climatisation', 'Grande soute', 'Sièges inclinables'],
              },
            ].map((vehicle, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="w-16 h-16 mb-6 bg-gradient-to-br from-magenta/10 to-purple/10 rounded-xl flex items-center justify-center">
                  <Bus size={32} className="text-magenta" />
                </div>
                <h3 className="font-display text-xl font-semibold text-purple-dark mb-3">
                  {vehicle.title}
                </h3>
                <p className="text-gray-600 mb-4">{vehicle.description}</p>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-purple-dark mb-2">Utilisations courantes :</h4>
                  <ul className="space-y-1">
                    {vehicle.usages.map((usage, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle size={14} className="text-green-500" />
                        {usage}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {vehicle.features.map((feature, i) => (
                      <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cas d'utilisation */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-4">
              Pour quelles occasions louer un minibus ?
            </h2>
            <p className="text-gray-600 text-lg">
              Le minibus avec chauffeur s'adapte à tous vos besoins de transport
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Briefcase,
                title: 'Déplacements professionnels',
                items: ['Séminaires d\'entreprise', 'Transferts clients VIP', 'Visites de sites', 'Team building'],
              },
              {
                icon: Heart,
                title: 'Événements privés',
                items: ['Mariages et EVJF/EVG', 'Anniversaires', 'Fêtes de famille', 'Baptêmes'],
              },
              {
                icon: Camera,
                title: 'Tourisme et loisirs',
                items: ['Visites guidées', 'Circuits oenotouristiques', 'Excursions à la journée', 'Parcs d\'attractions'],
              },
              {
                icon: Building2,
                title: 'Transferts',
                items: ['Aéroports', 'Gares TGV', 'Hôtels', 'Ports de croisière'],
              },
            ].map((category, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <div className="w-12 h-12 mb-4 bg-gradient-to-br from-magenta/10 to-purple/10 rounded-lg flex items-center justify-center">
                  <category.icon size={24} className="text-magenta" />
                </div>
                <h3 className="font-display text-lg font-semibold text-purple-dark mb-4">
                  {category.title}
                </h3>
                <ul className="space-y-2">
                  {category.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                      <CheckCircle size={14} className="text-magenta" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tarifs indicatifs */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-4">
              Tarifs indicatifs location minibus
            </h2>
            <p className="text-gray-600 text-lg">
              Des prix compétitifs adaptés à votre projet. Demandez un devis personnalisé pour un tarif exact.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                type: 'Demi-journée',
                duration: '4 heures',
                price: 'À partir de 250€',
                includes: ['Chauffeur professionnel', '100 km inclus', 'Climatisation'],
              },
              {
                type: 'Journée complète',
                duration: '8 heures',
                price: 'À partir de 400€',
                includes: ['Chauffeur professionnel', '200 km inclus', 'Climatisation', 'Arrêts illimités'],
                highlight: true,
              },
              {
                type: 'Transfert simple',
                duration: 'Aller simple',
                price: 'À partir de 150€',
                includes: ['Chauffeur professionnel', 'Trajet direct', 'Accueil personnalisé'],
              },
            ].map((offer, index) => (
              <div
                key={index}
                className={`rounded-2xl p-8 ${
                  offer.highlight
                    ? 'bg-gradient-to-br from-magenta to-purple text-white shadow-xl scale-105'
                    : 'bg-white shadow-sm'
                }`}
              >
                <h3 className={`font-display text-xl font-semibold mb-2 ${offer.highlight ? 'text-white' : 'text-purple-dark'}`}>
                  {offer.type}
                </h3>
                <p className={`text-sm mb-4 ${offer.highlight ? 'text-white/80' : 'text-gray-500'}`}>
                  {offer.duration}
                </p>
                <div className={`font-display text-3xl font-bold mb-6 ${offer.highlight ? 'text-white' : 'text-magenta'}`}>
                  {offer.price}
                </div>
                <ul className="space-y-3">
                  {offer.includes.map((item, i) => (
                    <li key={i} className={`flex items-center gap-2 text-sm ${offer.highlight ? 'text-white/90' : 'text-gray-600'}`}>
                      <CheckCircle size={16} className={offer.highlight ? 'text-white' : 'text-green-500'} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">
            * Tarifs indicatifs pouvant varier selon la saison, la distance et la disponibilité.
            Demandez un devis pour un prix exact.
          </p>
        </div>
      </section>

      {/* Pourquoi Busmoov */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-6">
                Pourquoi louer votre minibus avec Busmoov ?
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: Clock,
                    title: 'Réponse rapide garantie',
                    description: 'Recevez jusqu\'à 3 devis personnalisés en moins de 24 heures.',
                  },
                  {
                    icon: Shield,
                    title: 'Partenaires certifiés',
                    description: 'Tous nos autocaristes sont vérifiés, assurés et conformes aux normes.',
                  },
                  {
                    icon: Star,
                    title: 'Service sur-mesure',
                    description: 'Itinéraires personnalisés, horaires flexibles et accompagnement dédié.',
                  },
                  {
                    icon: Users,
                    title: 'Chauffeurs expérimentés',
                    description: 'Des professionnels courtois, ponctuels et connaissant parfaitement leur région.',
                  },
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-magenta/10 to-purple/10 rounded-lg flex items-center justify-center">
                      <item.icon size={24} className="text-magenta" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-dark mb-1">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="font-display text-2xl font-bold text-purple-dark mb-6">
                Services inclus
              </h3>
              <ul className="space-y-4">
                {[
                  'Chauffeur professionnel',
                  'Véhicule climatisé récent',
                  'Assurance tous risques',
                  'Accueil personnalisé',
                  'Bagages inclus',
                  'Annulation flexible',
                  'Service client 7j/7',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="text-green-500 shrink-0" size={20} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="gradient-bg rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4 relative z-10">
              Besoin d'un minibus avec chauffeur ?
            </h2>
            <p className="text-white/90 text-lg mb-8 relative z-10 max-w-xl mx-auto">
              Décrivez votre projet et recevez jusqu'à 3 devis gratuits de nos partenaires en moins de 24h
            </p>
            <Link
              to="/#quote"
              className="btn bg-white text-purple font-bold px-8 py-4 text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 relative z-10 inline-flex items-center gap-2"
            >
              Demander un devis gratuit
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
