import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Link } from 'react-router-dom'
import { GraduationCap, Bus, Shield, Clock, CheckCircle, Star, Phone, ArrowRight, MapPin, Users, FileCheck, Heart } from 'lucide-react'

export function SortiesScolairesPage() {
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
              <GraduationCap size={16} />
              Transport scolaire et périscolaire
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-purple-dark leading-tight mb-6">
              Location d'autocar pour{' '}
              <span className="gradient-text">sorties scolaires</span>{' '}
              et voyages pédagogiques
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Organisez sereinement vos sorties scolaires, classes de découverte et voyages pédagogiques.
              Nos autocaristes partenaires sont spécialisés dans le transport d'enfants et respectent
              toutes les normes de sécurité.
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
                Transporteurs agréés Éducation Nationale
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                Chauffeurs formés au transport d'enfants
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                Véhicules aux normes de sécurité
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sécurité et conformité */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-4">
              Sécurité et conformité garanties
            </h2>
            <p className="text-gray-600 text-lg">
              Le transport de vos élèves en toute sécurité est notre priorité absolue
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: 'Véhicules conformes',
                description: 'Autocars récents, régulièrement contrôlés et conformes aux normes de transport scolaire.',
              },
              {
                icon: FileCheck,
                title: 'Agréments officiels',
                description: 'Tous nos partenaires possèdent les agréments nécessaires pour le transport d\'enfants.',
              },
              {
                icon: Users,
                title: 'Chauffeurs formés',
                description: 'Conducteurs expérimentés et formés spécifiquement au transport de groupes scolaires.',
              },
              {
                icon: Heart,
                title: 'Assurance complète',
                description: 'Couverture tous risques adaptée au transport scolaire et périscolaire.',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-6 hover:bg-white hover:shadow-xl border border-transparent hover:border-gray-200 transition-all duration-300"
              >
                <div className="w-14 h-14 mb-4 bg-gradient-to-br from-magenta/10 to-purple/10 rounded-xl flex items-center justify-center">
                  <item.icon size={28} className="text-magenta" />
                </div>
                <h3 className="font-display text-lg font-semibold text-purple-dark mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Types de sorties */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-4">
              Tous types de sorties scolaires
            </h2>
            <p className="text-gray-600 text-lg">
              De la sortie à la journée au voyage de plusieurs jours, nous avons la solution adaptée
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Sorties pédagogiques',
                description: 'Visites de musées, sites historiques, expositions et lieux culturels.',
                examples: ['Musées', 'Châteaux', 'Sites archéologiques', 'Expositions'],
              },
              {
                title: 'Classes de découverte',
                description: 'Classes vertes, classes de mer, classes de neige et séjours nature.',
                examples: ['Classes vertes', 'Classes de mer', 'Classes de neige', 'Fermes pédagogiques'],
              },
              {
                title: 'Voyages scolaires',
                description: 'Voyages de fin d\'année, échanges linguistiques et séjours à l\'étranger.',
                examples: ['Voyages en France', 'Séjours en Europe', 'Échanges scolaires', 'Voyages linguistiques'],
              },
              {
                title: 'Sorties sportives',
                description: 'Compétitions UNSS, rencontres inter-établissements et stages sportifs.',
                examples: ['Compétitions UNSS', 'Matchs', 'Stages sportifs', 'Activités plein air'],
              },
              {
                title: 'Parcs et loisirs',
                description: 'Parcs d\'attractions, parcs animaliers et centres de loisirs.',
                examples: ['Disneyland Paris', 'Parc Astérix', 'Puy du Fou', 'Zoos et aquariums'],
              },
              {
                title: 'Activités culturelles',
                description: 'Théâtre, cinéma, concerts pédagogiques et spectacles.',
                examples: ['Théâtre', 'Cinéma', 'Concerts', 'Spectacles'],
              },
            ].map((type, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-display text-lg font-semibold text-purple-dark mb-3">
                  {type.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">{type.description}</p>
                <div className="flex flex-wrap gap-2">
                  {type.examples.map((example, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {example}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Véhicules adaptés */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-4">
              Des véhicules adaptés à chaque groupe
            </h2>
            <p className="text-gray-600 text-lg">
              Du minibus pour une classe au car grand tourisme pour plusieurs classes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Minibus scolaire',
                capacity: '20-25 places',
                ideal: 'Idéal pour une classe de maternelle ou primaire',
                features: ['Ceintures de sécurité', 'Climatisation', 'Places accompagnateurs'],
              },
              {
                title: 'Autocar standard',
                capacity: '40-55 places',
                ideal: 'Parfait pour une à deux classes',
                features: ['Soute à bagages', 'Climatisation', 'Sièges inclinables', 'Micro'],
              },
              {
                title: 'Car Grand Tourisme',
                capacity: '55-75 places',
                ideal: 'Pour les voyages longue distance',
                features: ['Grand confort', 'Toilettes', 'Wi-Fi', 'Écrans vidéo', 'Grande soute'],
                highlight: true,
              },
            ].map((vehicle, index) => (
              <div
                key={index}
                className={`rounded-2xl p-8 ${
                  vehicle.highlight
                    ? 'bg-gradient-to-br from-magenta to-purple text-white shadow-xl'
                    : 'bg-gray-50'
                }`}
              >
                <div className={`w-16 h-16 mb-6 rounded-xl flex items-center justify-center ${
                  vehicle.highlight ? 'bg-white/20' : 'bg-gradient-to-br from-magenta/10 to-purple/10'
                }`}>
                  <Bus size={32} className={vehicle.highlight ? 'text-white' : 'text-magenta'} />
                </div>
                <h3 className={`font-display text-xl font-semibold mb-2 ${
                  vehicle.highlight ? 'text-white' : 'text-purple-dark'
                }`}>
                  {vehicle.title}
                </h3>
                <div className={`font-semibold mb-3 ${vehicle.highlight ? 'text-white/90' : 'text-magenta'}`}>
                  {vehicle.capacity}
                </div>
                <p className={`text-sm mb-4 ${vehicle.highlight ? 'text-white/80' : 'text-gray-600'}`}>
                  {vehicle.ideal}
                </p>
                <ul className="space-y-2">
                  {vehicle.features.map((feature, i) => (
                    <li key={i} className={`flex items-center gap-2 text-sm ${
                      vehicle.highlight ? 'text-white/90' : 'text-gray-600'
                    }`}>
                      <CheckCircle size={14} className={vehicle.highlight ? 'text-white' : 'text-green-500'} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations populaires */}
      <section className="py-20 px-4 bg-purple-dark text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Destinations populaires pour les sorties scolaires
            </h2>
            <p className="text-white/70 text-lg">
              Nos autocaristes connaissent parfaitement ces destinations et leurs accès
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                category: 'Parcs d\'attractions',
                destinations: ['Disneyland Paris', 'Parc Astérix', 'Puy du Fou', 'Futuroscope', 'Nigloland'],
              },
              {
                category: 'Musées & Culture',
                destinations: ['Louvre', 'Cité des Sciences', 'Muséum d\'Histoire Naturelle', 'Château de Versailles'],
              },
              {
                category: 'Nature & Animaux',
                destinations: ['Zoo de Beauval', 'Nausicaá', 'Parc de Thoiry', 'Aquarium La Rochelle'],
              },
              {
                category: 'Sites historiques',
                destinations: ['Plages du Débarquement', 'Châteaux de la Loire', 'Mont Saint-Michel', 'Carcassonne'],
              },
            ].map((cat, index) => (
              <div key={index} className="bg-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-magenta mb-4">{cat.category}</h3>
                <ul className="space-y-2 text-sm text-white/80">
                  {cat.destinations.map((dest, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <MapPin size={12} />
                      {dest}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Processus de réservation */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-4">
              Comment organiser votre sortie scolaire ?
            </h2>
            <p className="text-gray-600 text-lg">
              Un processus simple pour les établissements scolaires
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: 1,
                title: 'Décrivez votre projet',
                description: 'Indiquez le nombre d\'élèves, la destination, les dates et les horaires souhaités.',
              },
              {
                step: 2,
                title: 'Recevez des devis',
                description: 'Comparez jusqu\'à 3 propositions détaillées de nos autocaristes partenaires.',
              },
              {
                step: 3,
                title: 'Validez et réservez',
                description: 'Choisissez l\'offre adaptée à votre budget et confirmez la réservation.',
              },
              {
                step: 4,
                title: 'Partez sereinement',
                description: 'Recevez les coordonnées du chauffeur et profitez de votre sortie en toute sécurité.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-magenta to-purple rounded-full flex items-center justify-center text-white font-display text-2xl font-bold shadow-lg">
                  {item.step}
                </div>
                <h3 className="font-display text-lg font-semibold text-purple-dark mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Documents et formalités */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-6">
                Documents et formalités simplifiés
              </h2>
              <p className="text-gray-600 mb-8">
                Nous vous facilitons les démarches administratives liées au transport scolaire.
              </p>
              <div className="space-y-4">
                {[
                  {
                    title: 'Devis détaillé',
                    description: 'Document complet avec toutes les informations requises par l\'Éducation Nationale.',
                  },
                  {
                    title: 'Attestation transporteur',
                    description: 'Copie des agréments et assurances du transporteur.',
                  },
                  {
                    title: 'Fiche technique véhicule',
                    description: 'Caractéristiques et équipements de sécurité du car.',
                  },
                  {
                    title: 'Facture pour remboursement',
                    description: 'Document conforme pour le traitement par la comptabilité de l\'établissement.',
                  },
                ].map((doc, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-white rounded-lg">
                    <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-magenta/10 to-purple/10 rounded-lg flex items-center justify-center">
                      <FileCheck size={20} className="text-magenta" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-dark">{doc.title}</h3>
                      <p className="text-gray-600 text-sm">{doc.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="font-display text-xl font-bold text-purple-dark mb-6">
                Ce qui est inclus
              </h3>
              <ul className="space-y-4">
                {[
                  'Chauffeur formé au transport scolaire',
                  'Véhicule aux normes de sécurité',
                  'Ceintures de sécurité obligatoires',
                  'Assurance transport de groupe',
                  'Assistance en cas d\'imprévu',
                  'Devis valable pour validation hiérarchique',
                  'Paiement différé possible (collectivités)',
                  'Annulation flexible selon conditions',
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

      {/* Témoignages */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-4">
              Les établissements nous font confiance
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                text: "Organisation impeccable pour notre voyage de fin d'année à Disneyland. Le chauffeur était ponctuel et très professionnel avec les enfants.",
                author: 'Mme Dupont',
                role: 'Directrice école primaire - Paris',
              },
              {
                text: "Nous utilisons Busmoov pour toutes nos sorties UNSS. Toujours des prix compétitifs et des chauffeurs qui connaissent les contraintes des compétitions sportives.",
                author: 'M. Martin',
                role: 'Professeur EPS - Collège Lyon',
              },
              {
                text: "La classe de mer s'est parfaitement déroulée. Le transporteur avait l'habitude des longs trajets avec des enfants. Je recommande vivement.",
                author: 'Mme Bernard',
                role: 'Enseignante CE2 - Bordeaux',
              },
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8">
                <div className="flex gap-1 text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} fill="currentColor" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">
                  "{testimonial.text}"
                </p>
                <div>
                  <div className="font-semibold text-purple-dark">{testimonial.author}</div>
                  <div className="text-gray-500 text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="gradient-bg rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4 relative z-10">
              Organisez votre prochaine sortie scolaire
            </h2>
            <p className="text-white/90 text-lg mb-8 relative z-10 max-w-xl mx-auto">
              Demandez un devis gratuit et recevez jusqu'à 3 propositions de transporteurs agréés
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
