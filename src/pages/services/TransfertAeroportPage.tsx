import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Link } from 'react-router-dom'
import { Plane, Bus, Clock, Shield, CheckCircle, Star, Phone, ArrowRight, MapPin, Users, Wifi, Briefcase } from 'lucide-react'

export function TransfertAeroportPage() {
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
              <Plane size={16} />
              Transfert aéroport et gare
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-purple-dark leading-tight mb-6">
              Transfert aéroport{' '}
              <span className="gradient-text">en bus et minibus</span>{' '}
              avec chauffeur
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Service de navette privée 24h/24 vers tous les aéroports et gares de France.
              Ponctualité garantie, suivi des vols en temps réel et accueil personnalisé pour vos groupes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/#quote"
                className="btn btn-primary text-lg px-8 py-4 inline-flex items-center justify-center gap-2"
              >
                Réserver mon transfert
                <ArrowRight size={20} />
              </Link>
              <a
                href="tel:+33187211476"
                className="btn btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center gap-2"
              >
                <Phone size={20} />
                01 87 21 14 76
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 mt-10 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                Disponible 24h/24
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                Suivi des vols en temps réel
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                Ponctualité garantie
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-4">
              Pourquoi choisir notre service de transfert ?
            </h2>
            <p className="text-gray-600 text-lg">
              Un service premium pour vos déplacements vers les aéroports et gares
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Clock,
                title: 'Disponibilité 24h/24',
                description: 'Service de transfert disponible à toute heure, 7 jours sur 7, pour s\'adapter à vos horaires de vol.',
              },
              {
                icon: Plane,
                title: 'Suivi des vols',
                description: 'Nous suivons votre vol en temps réel et ajustons l\'heure de prise en charge en cas de retard.',
              },
              {
                icon: Shield,
                title: 'Ponctualité garantie',
                description: 'Arrivée systématique en avance pour vous assurer de ne jamais manquer votre vol.',
              },
              {
                icon: Users,
                title: 'Groupes jusqu\'à 94 personnes',
                description: 'Du minibus à l\'autocar, des solutions pour tous les groupes.',
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

      {/* Aéroports desservis */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-4">
              Aéroports et gares desservis
            </h2>
            <p className="text-gray-600 text-lg">
              Transferts depuis et vers tous les grands aéroports et gares de France
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                region: 'Paris - Île-de-France',
                airports: [
                  { name: 'Paris CDG (Roissy)', code: 'CDG' },
                  { name: 'Paris Orly', code: 'ORY' },
                  { name: 'Paris Beauvais', code: 'BVA' },
                  { name: 'Gare du Nord', code: 'TGV' },
                  { name: 'Gare de Lyon', code: 'TGV' },
                ],
              },
              {
                region: 'Sud-Est',
                airports: [
                  { name: 'Lyon Saint-Exupéry', code: 'LYS' },
                  { name: 'Marseille Provence', code: 'MRS' },
                  { name: 'Nice Côte d\'Azur', code: 'NCE' },
                  { name: 'Montpellier', code: 'MPL' },
                  { name: 'Gare Lyon Part-Dieu', code: 'TGV' },
                ],
              },
              {
                region: 'Sud-Ouest',
                airports: [
                  { name: 'Toulouse Blagnac', code: 'TLS' },
                  { name: 'Bordeaux Mérignac', code: 'BOD' },
                  { name: 'Biarritz', code: 'BIQ' },
                  { name: 'Gare Bordeaux St-Jean', code: 'TGV' },
                ],
              },
              {
                region: 'Nord',
                airports: [
                  { name: 'Lille Lesquin', code: 'LIL' },
                  { name: 'Gare Lille Europe', code: 'TGV' },
                  { name: 'Gare Lille Flandres', code: 'TGV' },
                ],
              },
              {
                region: 'Est',
                airports: [
                  { name: 'Strasbourg', code: 'SXB' },
                  { name: 'EuroAirport Bâle-Mulhouse', code: 'BSL' },
                  { name: 'Gare Strasbourg', code: 'TGV' },
                ],
              },
              {
                region: 'Ouest',
                airports: [
                  { name: 'Nantes Atlantique', code: 'NTE' },
                  { name: 'Rennes', code: 'RNS' },
                  { name: 'Brest', code: 'BES' },
                  { name: 'Gare Nantes', code: 'TGV' },
                ],
              },
            ].map((zone, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-display text-lg font-semibold text-purple-dark mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-magenta" />
                  {zone.region}
                </h3>
                <ul className="space-y-2">
                  {zone.airports.map((airport, i) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{airport.name}</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded font-mono">
                        {airport.code}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Types de transferts */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-4">
              Nos types de transferts
            </h2>
            <p className="text-gray-600 text-lg">
              Des solutions adaptées à tous vos besoins de transport
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Briefcase,
                title: 'Transfert professionnel',
                description: 'Pour vos collaborateurs, clients ou partenaires. Accueil VIP avec panneau nominatif, assistance bagages.',
                features: ['Accueil personnalisé', 'Pancarte nominative', 'Assistance bagages', 'Wi-Fi à bord'],
              },
              {
                icon: Users,
                title: 'Transfert groupe',
                description: 'Idéal pour les groupes touristiques, séminaires ou événements. Coordination logistique complète.',
                features: ['Groupes 8-94 personnes', 'Coordination sur-mesure', 'Plusieurs points de prise en charge', 'Soute à bagages'],
              },
              {
                icon: Plane,
                title: 'Navette événementielle',
                description: 'Service de navettes pour congrès, salons, mariages. Rotations selon vos besoins.',
                features: ['Rotations planifiées', 'Horaires flexibles', 'Signalétique personnalisée', 'Coordination temps réel'],
              },
            ].map((service, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8">
                <div className="w-16 h-16 mb-6 bg-gradient-to-br from-magenta/10 to-purple/10 rounded-xl flex items-center justify-center">
                  <service.icon size={32} className="text-magenta" />
                </div>
                <h3 className="font-display text-xl font-semibold text-purple-dark mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-6">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
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

      {/* Comment ça marche */}
      <section className="py-20 px-4 bg-purple-dark text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Comment réserver votre transfert ?
            </h2>
            <p className="text-white/70 text-lg">
              Un processus simple en 4 étapes
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: 1,
                title: 'Demandez un devis',
                description: 'Renseignez vos informations : aéroport, date, heure de vol, nombre de passagers.',
              },
              {
                step: 2,
                title: 'Recevez nos offres',
                description: 'Comparez jusqu\'à 3 propositions de nos partenaires sous 24h.',
              },
              {
                step: 3,
                title: 'Confirmez et payez',
                description: 'Choisissez l\'offre qui vous convient et réglez en ligne en toute sécurité.',
              },
              {
                step: 4,
                title: 'Voyagez sereinement',
                description: 'Votre chauffeur vous attend à l\'heure convenue avec pancarte nominative.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-magenta to-purple rounded-full flex items-center justify-center text-white font-display text-2xl font-bold shadow-lg">
                  {item.step}
                </div>
                <h3 className="font-display text-lg font-semibold mb-3">
                  {item.title}
                </h3>
                <p className="text-white/70 text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Véhicules disponibles */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-4">
              Notre flotte pour vos transferts
            </h2>
            <p className="text-gray-600 text-lg">
              Des véhicules adaptés à la taille de votre groupe
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { type: 'Minibus 8 places', ideal: 'Petits groupes, VIP', price: 'À partir de 120€' },
              { type: 'Minibus 16 places', ideal: 'Équipes, familles', price: 'À partir de 180€' },
              { type: 'Autocar 30 places', ideal: 'Groupes moyens', price: 'À partir de 280€' },
              { type: 'Autocar 50+ places', ideal: 'Grands groupes', price: 'À partir de 380€' },
            ].map((vehicle, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-magenta/10 to-purple/10 rounded-lg flex items-center justify-center">
                  <Bus size={24} className="text-magenta" />
                </div>
                <h3 className="font-semibold text-purple-dark mb-1">{vehicle.type}</h3>
                <p className="text-gray-500 text-sm mb-3">{vehicle.ideal}</p>
                <div className="text-magenta font-semibold">{vehicle.price}</div>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            * Tarifs indicatifs pour un transfert simple. Prix exact sur devis selon distance et options.
          </p>
        </div>
      </section>

      {/* Services inclus */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-6">
                Ce qui est inclus dans votre transfert
              </h2>
              <p className="text-gray-600 mb-8">
                Un service complet pour un voyage sans stress vers l'aéroport ou la gare.
              </p>
              <ul className="space-y-4">
                {[
                  'Chauffeur professionnel expérimenté',
                  'Accueil avec pancarte nominative',
                  'Suivi de votre vol en temps réel',
                  'Assistance bagages',
                  'Véhicule climatisé et confortable',
                  'Temps d\'attente inclus (30 min aéroport)',
                  'Service client disponible 24h/24',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="text-green-500 shrink-0" size={20} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="font-display text-xl font-bold text-purple-dark mb-6">
                Options supplémentaires
              </h3>
              <div className="space-y-4">
                {[
                  { option: 'Wi-Fi à bord', desc: 'Restez connecté pendant le trajet' },
                  { option: 'Bouteilles d\'eau', desc: 'Rafraîchissements offerts' },
                  { option: 'Sièges enfants', desc: 'Rehausseurs et sièges bébé' },
                  { option: 'Accueil VIP', desc: 'Service d\'accueil personnalisé en zone arrivée' },
                  { option: 'Multi-stops', desc: 'Plusieurs points de prise en charge' },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Wifi size={18} className="text-magenta mt-1" />
                    <div>
                      <div className="font-semibold text-purple-dark">{item.option}</div>
                      <div className="text-gray-500 text-sm">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="gradient-bg rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4 relative z-10">
              Réservez votre transfert aéroport
            </h2>
            <p className="text-white/90 text-lg mb-8 relative z-10 max-w-xl mx-auto">
              Service disponible 24h/24, 7j/7 vers tous les aéroports et gares de France
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <Link
                to="/#quote"
                className="btn bg-white text-purple font-bold px-8 py-4 text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 inline-flex items-center justify-center gap-2"
              >
                Demander un devis
                <ArrowRight size={20} />
              </Link>
              <a
                href="tel:+33187211476"
                className="btn bg-white/20 text-white font-bold px-8 py-4 text-lg hover:bg-white/30 inline-flex items-center justify-center gap-2"
              >
                <Phone size={20} />
                Appeler maintenant
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
