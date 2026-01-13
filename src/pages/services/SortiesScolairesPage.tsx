import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Link } from 'react-router-dom'
import { GraduationCap, Bus, Shield, Clock, CheckCircle, Star, Phone, ArrowRight, MapPin, Users, FileCheck, Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocalizedPath } from '@/components/i18n'
import { useCurrentCountry } from '@/hooks/useCountrySettings'

export function SortiesScolairesPage() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const { data: country } = useCurrentCountry()

  const safety = [
    {
      icon: Shield,
      title: t('services.schoolTrips.safety1Title'),
      description: t('services.schoolTrips.safety1Desc'),
    },
    {
      icon: FileCheck,
      title: t('services.schoolTrips.safety2Title'),
      description: t('services.schoolTrips.safety2Desc'),
    },
    {
      icon: Users,
      title: t('services.schoolTrips.safety3Title'),
      description: t('services.schoolTrips.safety3Desc'),
    },
    {
      icon: Heart,
      title: t('services.schoolTrips.safety4Title'),
      description: t('services.schoolTrips.safety4Desc'),
    },
  ]

  const tripTypes = [
    {
      title: t('services.schoolTrips.trip1Title'),
      description: t('services.schoolTrips.trip1Desc'),
      examples: t('services.schoolTrips.trip1Examples').split(', '),
    },
    {
      title: t('services.schoolTrips.trip2Title'),
      description: t('services.schoolTrips.trip2Desc'),
      examples: t('services.schoolTrips.trip2Examples').split(', '),
    },
    {
      title: t('services.schoolTrips.trip3Title'),
      description: t('services.schoolTrips.trip3Desc'),
      examples: t('services.schoolTrips.trip3Examples').split(', '),
    },
    {
      title: t('services.schoolTrips.trip4Title'),
      description: t('services.schoolTrips.trip4Desc'),
      examples: t('services.schoolTrips.trip4Examples').split(', '),
    },
    {
      title: t('services.schoolTrips.trip5Title'),
      description: t('services.schoolTrips.trip5Desc'),
      examples: t('services.schoolTrips.trip5Examples').split(', '),
    },
    {
      title: t('services.schoolTrips.trip6Title'),
      description: t('services.schoolTrips.trip6Desc'),
      examples: t('services.schoolTrips.trip6Examples').split(', '),
    },
  ]

  const vehicles = [
    {
      title: t('services.schoolTrips.vehicle1Title'),
      capacity: t('services.schoolTrips.vehicle1Capacity'),
      ideal: t('services.schoolTrips.vehicle1Ideal'),
      features: t('services.schoolTrips.vehicle1Features').split(', '),
    },
    {
      title: t('services.schoolTrips.vehicle2Title'),
      capacity: t('services.schoolTrips.vehicle2Capacity'),
      ideal: t('services.schoolTrips.vehicle2Ideal'),
      features: t('services.schoolTrips.vehicle2Features').split(', '),
    },
    {
      title: t('services.schoolTrips.vehicle3Title'),
      capacity: t('services.schoolTrips.vehicle3Capacity'),
      ideal: t('services.schoolTrips.vehicle3Ideal'),
      features: t('services.schoolTrips.vehicle3Features').split(', '),
      highlight: true,
    },
  ]

  const destinations = [
    {
      category: t('services.schoolTrips.destParks'),
      destinations: t('services.schoolTrips.destParksList').split(', '),
    },
    {
      category: t('services.schoolTrips.destCulture'),
      destinations: t('services.schoolTrips.destCultureList').split(', '),
    },
    {
      category: t('services.schoolTrips.destNature'),
      destinations: t('services.schoolTrips.destNatureList').split(', '),
    },
    {
      category: t('services.schoolTrips.destHistory'),
      destinations: t('services.schoolTrips.destHistoryList').split(', '),
    },
  ]

  const steps = [
    {
      step: 1,
      title: t('services.schoolTrips.step1Title'),
      description: t('services.schoolTrips.step1Desc'),
    },
    {
      step: 2,
      title: t('services.schoolTrips.step2Title'),
      description: t('services.schoolTrips.step2Desc'),
    },
    {
      step: 3,
      title: t('services.schoolTrips.step3Title'),
      description: t('services.schoolTrips.step3Desc'),
    },
    {
      step: 4,
      title: t('services.schoolTrips.step4Title'),
      description: t('services.schoolTrips.step4Desc'),
    },
  ]

  const docs = [
    {
      title: t('services.schoolTrips.doc1Title'),
      description: t('services.schoolTrips.doc1Desc'),
    },
    {
      title: t('services.schoolTrips.doc2Title'),
      description: t('services.schoolTrips.doc2Desc'),
    },
    {
      title: t('services.schoolTrips.doc3Title'),
      description: t('services.schoolTrips.doc3Desc'),
    },
    {
      title: t('services.schoolTrips.doc4Title'),
      description: t('services.schoolTrips.doc4Desc'),
    },
  ]

  const included = [
    t('services.schoolTrips.included1'),
    t('services.schoolTrips.included2'),
    t('services.schoolTrips.included3'),
    t('services.schoolTrips.included4'),
    t('services.schoolTrips.included5'),
    t('services.schoolTrips.included6'),
    t('services.schoolTrips.included7'),
    t('services.schoolTrips.included8'),
  ]

  const testimonials = [
    {
      text: t('services.schoolTrips.testimonial1Text'),
      author: t('services.schoolTrips.testimonial1Author'),
      role: t('services.schoolTrips.testimonial1Role'),
    },
    {
      text: t('services.schoolTrips.testimonial2Text'),
      author: t('services.schoolTrips.testimonial2Author'),
      role: t('services.schoolTrips.testimonial2Role'),
    },
    {
      text: t('services.schoolTrips.testimonial3Text'),
      author: t('services.schoolTrips.testimonial3Author'),
      role: t('services.schoolTrips.testimonial3Role'),
    },
  ]

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
              {t('services.schoolTrips.badge')}
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-purple-dark leading-tight mb-6">
              {t('services.schoolTrips.title')}{' '}
              <span className="gradient-text">{t('services.schoolTrips.titleHighlight')}</span>{' '}
              {t('services.schoolTrips.titleSuffix')}
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {t('services.schoolTrips.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to={localizedPath('/#quote')}
                className="btn btn-primary text-lg px-8 py-4 inline-flex items-center justify-center gap-2"
              >
                {t('services.schoolTrips.ctaButton')}
                <ArrowRight size={20} />
              </Link>
              <a
                href={`tel:${country?.phone || '+33176311283'}`}
                className="btn btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center gap-2"
              >
                <Phone size={20} />
                {country?.phoneDisplay || '01 76 31 12 83'}
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 mt-10 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                {t('services.schoolTrips.trustBadge1')}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                {t('services.schoolTrips.trustBadge2')}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                {t('services.schoolTrips.trustBadge3')}
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
              {t('services.schoolTrips.safetyTitle')}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('services.schoolTrips.safetySubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {safety.map((item, index) => (
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
              {t('services.schoolTrips.tripsTitle')}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('services.schoolTrips.tripsSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tripTypes.map((type, index) => (
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
              {t('services.schoolTrips.vehiclesTitle')}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('services.schoolTrips.vehiclesSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {vehicles.map((vehicle, index) => (
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
              {t('services.schoolTrips.destinationsTitle')}
            </h2>
            <p className="text-white/70 text-lg">
              {t('services.schoolTrips.destinationsSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {destinations.map((cat, index) => (
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
              {t('services.schoolTrips.howItWorksTitle')}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('services.schoolTrips.howItWorksSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((item) => (
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
                {t('services.schoolTrips.docsTitle')}
              </h2>
              <p className="text-gray-600 mb-8">
                {t('services.schoolTrips.docsSubtitle')}
              </p>
              <div className="space-y-4">
                {docs.map((doc, index) => (
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
                {t('services.schoolTrips.includedTitle')}
              </h3>
              <ul className="space-y-4">
                {included.map((item, index) => (
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
              {t('services.schoolTrips.testimonialsTitle')}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
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
              {t('services.schoolTrips.ctaTitle')}
            </h2>
            <p className="text-white/90 text-lg mb-8 relative z-10 max-w-xl mx-auto">
              {t('services.schoolTrips.ctaSubtitle')}
            </p>
            <Link
              to={localizedPath('/#quote')}
              className="btn bg-white text-purple font-bold px-8 py-4 text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 relative z-10 inline-flex items-center gap-2"
            >
              {t('services.schoolTrips.ctaButton')}
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
