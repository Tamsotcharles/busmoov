import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MultiStepQuoteForm } from '@/components/forms/MultiStepQuoteForm'
import { Bus, Clock, Wallet, Shield, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Review {
  id: string
  rating: number
  comment: string
  client_name: string
  dossier?: {
    departure: string
    arrival: string
  }
}

// Témoignages par défaut (fallback)
const defaultTestimonials = [
  {
    text: "Service impeccable ! J'ai reçu 3 devis très rapidement et le chauffeur était ponctuel et professionnel. Je recommande vivement.",
    author: 'Marie L.',
    role: 'Mariage - Île-de-France',
    rating: 5,
  },
  {
    text: 'Nous utilisons Busmoov pour tous les déplacements de notre club de foot. Toujours des prix compétitifs et un service au top !',
    author: 'Thomas D.',
    role: 'Club sportif - Lyon',
    rating: 5,
  },
  {
    text: "Organisation de notre séminaire d'entreprise facilitée grâce à Busmoov. 50 personnes transportées sans aucun souci. Merci !",
    author: 'Sophie C.',
    role: 'Séminaire - Paris',
    rating: 5,
  },
]

export function HomePage() {
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    // Charger les avis approuvés/featured
    const loadReviews = async () => {
      try {
        const { data } = await supabase
          .from('reviews')
          .select(`
            id,
            rating,
            comment,
            client_name,
            dossier:dossiers(departure, arrival)
          `)
          .in('status', ['approved', 'featured'])
          .eq('is_public', true)
          .not('comment', 'is', null)
          .order('status', { ascending: false }) // 'featured' first
          .limit(6)

        if (data && data.length > 0) {
          setReviews(data as unknown as Review[])
        }
      } catch {
        // Table not yet created, use default testimonials
      }
    }

    loadReviews()
  }, [])

  // Utiliser les vrais avis s'il y en a, sinon les témoignages par défaut
  const testimonials = reviews.length >= 3
    ? reviews.slice(0, 3).map((review) => ({
        text: review.comment || '',
        author: review.client_name || 'Client Busmoov',
        role: review.dossier ? `${review.dossier.departure} → ${review.dossier.arrival}` : 'France',
        rating: review.rating || 5,
      }))
    : defaultTestimonials

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center pt-24 pb-16 px-4 relative overflow-hidden" id="quote">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/5 w-96 h-96 bg-magenta/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/5 w-96 h-96 bg-purple/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left Content */}
          <div className="animate-fadeIn">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-purple-dark leading-tight mb-6">
              Location d'autocar{' '}
              <span className="gradient-text">avec chauffeur</span>{' '}
              en France
            </h1>

            <p className="text-xl text-gray-500 mb-8 max-w-lg">
              Comparez jusqu'à 3 devis personnalisés de nos autocaristes partenaires.
              Réservation simple, rapide et au meilleur prix garanti.
            </p>

            {/* Stats */}
            <div className="flex gap-12 mt-10">
              <div>
                <div className="font-display text-4xl font-bold text-purple">500+</div>
                <div className="text-gray-500 text-sm">Autocaristes partenaires</div>
              </div>
              <div>
                <div className="font-display text-4xl font-bold text-purple">50K+</div>
                <div className="text-gray-500 text-sm">Voyageurs satisfaits</div>
              </div>
              <div>
                <div className="font-display text-4xl font-bold text-purple">4.8/5</div>
                <div className="text-gray-500 text-sm">Note moyenne</div>
              </div>
            </div>
          </div>

          {/* Quote Form */}
          <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-purple/10 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <MultiStepQuoteForm />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-white" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-4">
              Pourquoi choisir Busmoov ?
            </h2>
            <p className="text-gray-500 text-lg">
              La solution la plus simple et fiable pour vos déplacements en groupe
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Bus,
                title: '+500 Autocaristes',
                description: 'Un réseau de partenaires certifiés partout en France pour répondre à toutes vos demandes.',
              },
              {
                icon: Clock,
                title: 'Réponse en 24h',
                description: 'Recevez jusqu\'à 3 devis personnalisés en moins de 24 heures, garantis.',
              },
              {
                icon: Wallet,
                title: 'Meilleurs prix',
                description: 'Comparez et choisissez l\'offre qui correspond le mieux à votre budget.',
              },
              {
                icon: Shield,
                title: '100% Sécurisé',
                description: 'Tous nos partenaires sont vérifiés, assurés et conformes aux réglementations.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-8 text-center hover:bg-white hover:shadow-xl hover:border-gray-200 border border-transparent transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-magenta/10 to-purple/10 rounded-xl flex items-center justify-center">
                  <feature.icon size={32} className="text-magenta" />
                </div>
                <h3 className="font-display text-lg font-semibold text-purple-dark mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-gray-50" id="how-it-works">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-gray-500 text-lg">
              Obtenez vos devis en 3 étapes simples
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-1 bg-gradient-to-r from-magenta to-purple opacity-20 rounded-full" />

            {[
              {
                step: 1,
                title: 'Décrivez votre projet',
                description: 'Remplissez le formulaire avec les détails de votre voyage : dates, itinéraire, nombre de passagers.',
              },
              {
                step: 2,
                title: 'Recevez 3 devis',
                description: 'Nos autocaristes partenaires vous envoient leurs meilleures offres sous 24h.',
              },
              {
                step: 3,
                title: 'Réservez et voyagez',
                description: 'Choisissez l\'offre qui vous convient et partez l\'esprit tranquille !',
              },
            ].map((item) => (
              <div key={item.step} className="text-center relative">
                <div className="w-20 h-20 mx-auto mb-6 gradient-bg rounded-full flex items-center justify-center text-white font-display text-2xl font-bold shadow-lg shadow-magenta/30 relative z-10">
                  {item.step}
                </div>
                <h3 className="font-display text-xl font-semibold text-purple-dark mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-500 max-w-xs mx-auto">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-purple-dark relative overflow-hidden" id="testimonials">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-magenta/20 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-light/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-white/70 text-lg">
              Des milliers de clients satisfaits partout en France
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8"
              >
                <div className="flex gap-1 text-yellow-400 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={20} fill="currentColor" />
                  ))}
                  {[...Array(5 - testimonial.rating)].map((_, i) => (
                    <Star key={i + testimonial.rating} size={20} className="text-white/30" />
                  ))}
                </div>
                <p className="text-white/90 mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{testimonial.author}</div>
                    <div className="text-white/60 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="gradient-bg rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4 relative z-10">
              Prêt à partir ?
            </h2>
            <p className="text-white/90 text-lg mb-8 relative z-10">
              Obtenez vos devis gratuits en moins de 2 minutes
            </p>
            <a
              href="#quote"
              className="btn bg-white text-purple font-bold px-8 py-4 text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 relative z-10"
            >
              Demander un devis gratuit
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
