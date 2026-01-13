import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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

export function HomePage() {
  const { t } = useTranslation()
  const [reviews, setReviews] = useState<Review[]>([])

  // Témoignages par défaut (fallback) - traduits
  const defaultTestimonials = [
    {
      text: t('testimonials.default1', "Service impeccable ! J'ai reçu 3 devis très rapidement et le chauffeur était ponctuel et professionnel. Je recommande vivement."),
      author: 'Marie L.',
      role: t('testimonials.wedding', 'Mariage'),
      rating: 5,
    },
    {
      text: t('testimonials.default2', 'Nous utilisons Busmoov pour tous les déplacements de notre club de foot. Toujours des prix compétitifs et un service au top !'),
      author: 'Thomas D.',
      role: t('testimonials.sportClub', 'Club sportif'),
      rating: 5,
    },
    {
      text: t('testimonials.default3', "Organisation de notre séminaire d'entreprise facilitée grâce à Busmoov. 50 personnes transportées sans aucun souci. Merci !"),
      author: 'Sophie C.',
      role: t('testimonials.seminar', 'Séminaire'),
      rating: 5,
    },
  ]

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
        role: review.dossier ? `${review.dossier.departure} → ${review.dossier.arrival}` : t('country.fr', 'France'),
        rating: review.rating || 5,
      }))
    : defaultTestimonials

  // Features avec traductions
  const features = [
    {
      icon: Bus,
      title: t('features.partners.title'),
      description: t('features.partners.description'),
    },
    {
      icon: Clock,
      title: t('features.response.title'),
      description: t('features.response.description'),
    },
    {
      icon: Wallet,
      title: t('features.price.title'),
      description: t('features.price.description'),
    },
    {
      icon: Shield,
      title: t('features.secure.title'),
      description: t('features.secure.description'),
    },
  ]

  // Steps avec traductions
  const steps = [
    {
      step: 1,
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description'),
    },
    {
      step: 2,
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description'),
    },
    {
      step: 3,
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.description'),
    },
  ]

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
              {t('hero.title1')}{' '}
              <span className="gradient-text">{t('hero.title2')}</span>{' '}
              {t('hero.title3')}
            </h1>

            <p className="text-xl text-gray-500 mb-8 max-w-lg">
              {t('hero.subtitle')}
            </p>

            {/* Stats */}
            <div className="flex gap-12 mt-10">
              <div>
                <div className="font-display text-4xl font-bold text-purple">500+</div>
                <div className="text-gray-500 text-sm">{t('stats.partners')}</div>
              </div>
              <div>
                <div className="font-display text-4xl font-bold text-purple">50K+</div>
                <div className="text-gray-500 text-sm">{t('stats.travelers')}</div>
              </div>
              <div>
                <div className="font-display text-4xl font-bold text-purple">4.8/5</div>
                <div className="text-gray-500 text-sm">{t('stats.rating')}</div>
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
              {t('features.title')}
            </h2>
            <p className="text-gray-500 text-lg">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
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
              {t('howItWorks.title')}
            </h2>
            <p className="text-gray-500 text-lg">
              {t('howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-1 bg-gradient-to-r from-magenta to-purple opacity-20 rounded-full" />

            {steps.map((item) => (
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
              {t('testimonials.title')}
            </h2>
            <p className="text-white/70 text-lg">
              {t('testimonials.subtitle')}
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
              {t('cta.title')}
            </h2>
            <p className="text-white/90 text-lg mb-8 relative z-10">
              {t('cta.subtitle')}
            </p>
            <a
              href="#quote"
              className="btn bg-white text-purple font-bold px-8 py-4 text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 relative z-10"
            >
              {t('cta.button')}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
