import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Link } from 'react-router-dom'
import { Bus, Users, Shield, Clock, MapPin, CheckCircle, Star, Phone, ArrowRight, Wifi, Wind, Plug, Tv } from 'lucide-react'

export function LocationAutocarPage() {
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
              Location d'autocar avec chauffeur
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-purple-dark leading-tight mb-6">
              Location d'autocar{' '}
              <span className="gradient-text">avec chauffeur</span>{' '}
              partout en France
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Besoin d'un autocar pour votre groupe ? Busmoov vous met en relation avec plus de 500 autocaristes
              partenaires certifiés. Recevez jusqu'à 3 devis personnalisés en moins de 24h et voyagez en toute sérénité.
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
                500+ autocaristes certifiés
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                Service 100% transparent
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Types de véhicules */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-4">
              Notre flotte d'autocars disponibles
            </h2>
            <p className="text-gray-600 text-lg">
              Du minibus au car Grand Tourisme, trouvez le véhicule adapté à votre groupe de 8 à 94 passagers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Minibus',
                capacity: '8-22 places',
                description: 'Idéal pour les petits groupes, excursions en famille ou transferts VIP.',
                features: ['Climatisation', 'Confort optimal', 'Flexibilité'],
              },
              {
                title: 'Autocar Standard',
                capacity: '30-50 places',
                description: 'Parfait pour les sorties scolaires, voyages associatifs et déplacements professionnels.',
                features: ['Soute à bagages', 'Climatisation', 'Sièges inclinables'],
              },
              {
                title: 'Car Grand Tourisme',
                capacity: '50-75 places',
                description: 'Confort premium pour les longs trajets, circuits touristiques et voyages de groupe.',
                features: ['Wi-Fi', 'Prises USB', 'Écrans vidéo', 'Toilettes'],
              },
              {
                title: 'Car à Impériale',
                capacity: 'Jusqu\'à 94 places',
                description: 'Solution économique pour les très grands groupes et événements d\'envergure.',
                features: ['Grande capacité', 'Vue panoramique', 'Confort GT'],
              },
            ].map((vehicle, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-6 hover:bg-white hover:shadow-xl border border-transparent hover:border-gray-200 transition-all duration-300"
              >
                <div className="w-14 h-14 mb-4 bg-gradient-to-br from-magenta/10 to-purple/10 rounded-xl flex items-center justify-center">
                  <Bus size={28} className="text-magenta" />
                </div>
                <h3 className="font-display text-xl font-semibold text-purple-dark mb-2">
                  {vehicle.title}
                </h3>
                <div className="text-magenta font-semibold mb-3">{vehicle.capacity}</div>
                <p className="text-gray-600 text-sm mb-4">{vehicle.description}</p>
                <ul className="space-y-2">
                  {vehicle.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-500">
                      <CheckCircle size={14} className="text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Équipements */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-4">
              Équipements et confort à bord
            </h2>
            <p className="text-gray-600 text-lg">
              Nos autocars Grand Tourisme sont équipés pour vous offrir un voyage agréable
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Wifi, label: 'Wi-Fi gratuit', desc: 'Restez connecté pendant le trajet' },
              { icon: Wind, label: 'Climatisation', desc: 'Température régulée toute l\'année' },
              { icon: Plug, label: 'Prises électriques', desc: 'Rechargez vos appareils' },
              { icon: Tv, label: 'Écrans vidéo', desc: 'Divertissement à bord' },
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-magenta/10 to-purple/10 rounded-lg flex items-center justify-center">
                  <item.icon size={24} className="text-magenta" />
                </div>
                <h3 className="font-semibold text-purple-dark mb-1">{item.label}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Occasions de location */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-4">
              Pour toutes vos occasions
            </h2>
            <p className="text-gray-600 text-lg">
              Location d'autocar adaptée à tous types d'événements et de déplacements
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Événements privés',
                items: ['Mariages', 'Anniversaires', 'Fêtes de famille', 'Réunions entre amis'],
              },
              {
                title: 'Événements professionnels',
                items: ['Séminaires d\'entreprise', 'Team building', 'Congrès', 'Salons et conventions'],
              },
              {
                title: 'Voyages et loisirs',
                items: ['Circuits touristiques', 'Parcs d\'attractions', 'Événements sportifs', 'Concerts et festivals'],
              },
              {
                title: 'Transport scolaire',
                items: ['Sorties pédagogiques', 'Voyages scolaires', 'Classes vertes', 'Compétitions sportives'],
              },
              {
                title: 'Associations et clubs',
                items: ['Voyages associatifs', 'Pèlerinages', 'Randonnées', 'Matchs sportifs'],
              },
              {
                title: 'Transferts',
                items: ['Aéroports', 'Gares', 'Hôtels', 'Navettes événementielles'],
              },
            ].map((category, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-display text-lg font-semibold text-purple-dark mb-4">
                  {category.title}
                </h3>
                <ul className="space-y-2">
                  {category.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-600">
                      <CheckCircle size={16} className="text-magenta" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Zones couvertes */}
      <section className="py-20 px-4 bg-purple-dark text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Location d'autocar dans toute la France
            </h2>
            <p className="text-white/70 text-lg">
              Notre réseau de plus de 500 autocaristes couvre l'ensemble du territoire national et l'Europe
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { region: 'Île-de-France', cities: ['Paris', 'Versailles', 'Saint-Denis', 'Créteil'] },
              { region: 'Auvergne-Rhône-Alpes', cities: ['Lyon', 'Grenoble', 'Annecy', 'Clermont-Ferrand'] },
              { region: 'PACA', cities: ['Marseille', 'Nice', 'Toulon', 'Cannes'] },
              { region: 'Nouvelle-Aquitaine', cities: ['Bordeaux', 'La Rochelle', 'Biarritz', 'Pau'] },
              { region: 'Occitanie', cities: ['Toulouse', 'Montpellier', 'Nîmes', 'Perpignan'] },
              { region: 'Grand Est', cities: ['Strasbourg', 'Reims', 'Nancy', 'Metz'] },
              { region: 'Hauts-de-France', cities: ['Lille', 'Amiens', 'Dunkerque', 'Calais'] },
              { region: 'Bretagne', cities: ['Rennes', 'Brest', 'Saint-Malo', 'Vannes'] },
            ].map((zone, index) => (
              <div key={index} className="bg-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-magenta mb-3">{zone.region}</h3>
                <ul className="space-y-1 text-sm text-white/80">
                  {zone.cities.map((city, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <MapPin size={12} />
                      {city}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-6">
                Pourquoi choisir Busmoov pour votre location d'autocar ?
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: Clock,
                    title: 'Devis en moins de 24h',
                    description: 'Recevez jusqu\'à 3 propositions de nos autocaristes partenaires rapidement.',
                  },
                  {
                    icon: Shield,
                    title: 'Transporteurs vérifiés',
                    description: 'Tous nos partenaires sont certifiés, assurés et respectent les normes de sécurité.',
                  },
                  {
                    icon: Users,
                    title: 'Chauffeurs professionnels',
                    description: 'Des conducteurs expérimentés, ponctuels et au service de votre confort.',
                  },
                  {
                    icon: Star,
                    title: 'Meilleur rapport qualité-prix',
                    description: 'Comparez les offres et choisissez celle qui correspond à votre budget.',
                  },
                ].map((advantage, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-magenta/10 to-purple/10 rounded-lg flex items-center justify-center">
                      <advantage.icon size={24} className="text-magenta" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-dark mb-1">{advantage.title}</h3>
                      <p className="text-gray-600">{advantage.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="font-display text-2xl font-bold text-purple-dark mb-6">
                Ce qui est inclus dans votre location
              </h3>
              <ul className="space-y-4">
                {[
                  'Chauffeur professionnel expérimenté',
                  'Véhicule climatisé et entretenu',
                  'Assurance tous risques',
                  'Carburant et péages inclus sur devis',
                  'Coordination et suivi de votre réservation',
                  'Service client disponible 7j/7',
                  'Modification gratuite jusqu\'à 48h avant',
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
              Demandez votre devis gratuit
            </h2>
            <p className="text-white/90 text-lg mb-8 relative z-10 max-w-xl mx-auto">
              Recevez jusqu'à 3 propositions personnalisées de nos autocaristes partenaires en moins de 24h
            </p>
            <Link
              to="/#quote"
              className="btn bg-white text-purple font-bold px-8 py-4 text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 relative z-10 inline-flex items-center gap-2"
            >
              Obtenir mes devis
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
