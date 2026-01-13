import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Link } from 'react-router-dom'
import { Plane, Bus, Clock, Shield, CheckCircle, Star, Phone, ArrowRight, MapPin, Users, Wifi, Briefcase } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocalizedPath } from '@/components/i18n'
import { useCurrentCountry } from '@/hooks/useCountrySettings'

export function TransfertAeroportPage() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const { data: country } = useCurrentCountry()

  const advantages = [
    {
      icon: Clock,
      title: t('services.airportTransfer.advantage1Title'),
      description: t('services.airportTransfer.advantage1Desc'),
    },
    {
      icon: Plane,
      title: t('services.airportTransfer.advantage2Title'),
      description: t('services.airportTransfer.advantage2Desc'),
    },
    {
      icon: Shield,
      title: t('services.airportTransfer.advantage3Title'),
      description: t('services.airportTransfer.advantage3Desc'),
    },
    {
      icon: Users,
      title: t('services.airportTransfer.advantage4Title'),
      description: t('services.airportTransfer.advantage4Desc'),
    },
  ]

  const transferTypes = [
    {
      icon: Briefcase,
      title: t('services.airportTransfer.typePro'),
      description: t('services.airportTransfer.typeProDesc'),
      features: [
        t('services.airportTransfer.typeProFeature1'),
        t('services.airportTransfer.typeProFeature2'),
        t('services.airportTransfer.typeProFeature3'),
        t('services.airportTransfer.typeProFeature4'),
      ],
    },
    {
      icon: Users,
      title: t('services.airportTransfer.typeGroup'),
      description: t('services.airportTransfer.typeGroupDesc'),
      features: [
        t('services.airportTransfer.typeGroupFeature1'),
        t('services.airportTransfer.typeGroupFeature2'),
        t('services.airportTransfer.typeGroupFeature3'),
        t('services.airportTransfer.typeGroupFeature4'),
      ],
    },
    {
      icon: Plane,
      title: t('services.airportTransfer.typeEvent'),
      description: t('services.airportTransfer.typeEventDesc'),
      features: [
        t('services.airportTransfer.typeEventFeature1'),
        t('services.airportTransfer.typeEventFeature2'),
        t('services.airportTransfer.typeEventFeature3'),
        t('services.airportTransfer.typeEventFeature4'),
      ],
    },
  ]

  const steps = [
    {
      step: 1,
      title: t('services.airportTransfer.step1Title'),
      description: t('services.airportTransfer.step1Desc'),
    },
    {
      step: 2,
      title: t('services.airportTransfer.step2Title'),
      description: t('services.airportTransfer.step2Desc'),
    },
    {
      step: 3,
      title: t('services.airportTransfer.step3Title'),
      description: t('services.airportTransfer.step3Desc'),
    },
    {
      step: 4,
      title: t('services.airportTransfer.step4Title'),
      description: t('services.airportTransfer.step4Desc'),
    },
  ]

  const vehicles = [
    {
      type: t('services.airportTransfer.vehicle1'),
      ideal: t('services.airportTransfer.vehicle1Ideal'),
      price: t('services.airportTransfer.vehicle1Price'),
    },
    {
      type: t('services.airportTransfer.vehicle2'),
      ideal: t('services.airportTransfer.vehicle2Ideal'),
      price: t('services.airportTransfer.vehicle2Price'),
    },
    {
      type: t('services.airportTransfer.vehicle3'),
      ideal: t('services.airportTransfer.vehicle3Ideal'),
      price: t('services.airportTransfer.vehicle3Price'),
    },
    {
      type: t('services.airportTransfer.vehicle4'),
      ideal: t('services.airportTransfer.vehicle4Ideal'),
      price: t('services.airportTransfer.vehicle4Price'),
    },
  ]

  const included = [
    t('services.airportTransfer.included1'),
    t('services.airportTransfer.included2'),
    t('services.airportTransfer.included3'),
    t('services.airportTransfer.included4'),
    t('services.airportTransfer.included5'),
    t('services.airportTransfer.included6'),
    t('services.airportTransfer.included7'),
  ]

  const options = [
    { option: t('services.airportTransfer.option1'), desc: t('services.airportTransfer.option1Desc') },
    { option: t('services.airportTransfer.option2'), desc: t('services.airportTransfer.option2Desc') },
    { option: t('services.airportTransfer.option3'), desc: t('services.airportTransfer.option3Desc') },
    { option: t('services.airportTransfer.option4'), desc: t('services.airportTransfer.option4Desc') },
    { option: t('services.airportTransfer.option5'), desc: t('services.airportTransfer.option5Desc') },
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
              <Plane size={16} />
              {t('services.airportTransfer.badge')}
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-purple-dark leading-tight mb-6">
              {t('services.airportTransfer.title')}{' '}
              <span className="gradient-text">{t('services.airportTransfer.titleHighlight')}</span>{' '}
              {t('services.airportTransfer.titleSuffix')}
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {t('services.airportTransfer.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to={localizedPath('/#quote')}
                className="btn btn-primary text-lg px-8 py-4 inline-flex items-center justify-center gap-2"
              >
                {t('services.airportTransfer.ctaButton')}
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
                {t('services.airportTransfer.trustBadge1')}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                {t('services.airportTransfer.trustBadge2')}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                {t('services.airportTransfer.trustBadge3')}
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
              {t('services.airportTransfer.advantagesTitle')}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('services.airportTransfer.advantagesSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {advantages.map((advantage, index) => (
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

      {/* Types de transferts */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-4">
              {t('services.airportTransfer.typesTitle')}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('services.airportTransfer.typesSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {transferTypes.map((service, index) => (
              <div key={index} className="bg-white rounded-2xl p-8">
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
              {t('services.airportTransfer.howItWorksTitle')}
            </h2>
            <p className="text-white/70 text-lg">
              {t('services.airportTransfer.howItWorksSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((item) => (
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
              {t('services.airportTransfer.fleetTitle')}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('services.airportTransfer.fleetSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {vehicles.map((vehicle, index) => (
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
            {t('services.airportTransfer.pricingNote')}
          </p>
        </div>
      </section>

      {/* Services inclus */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-6">
                {t('services.airportTransfer.includedTitle')}
              </h2>
              <p className="text-gray-600 mb-8">
                {t('services.airportTransfer.includedSubtitle')}
              </p>
              <ul className="space-y-4">
                {included.map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="text-green-500 shrink-0" size={20} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="font-display text-xl font-bold text-purple-dark mb-6">
                {t('services.airportTransfer.optionsTitle')}
              </h3>
              <div className="space-y-4">
                {options.map((item, index) => (
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
              {t('services.airportTransfer.ctaTitle')}
            </h2>
            <p className="text-white/90 text-lg mb-8 relative z-10 max-w-xl mx-auto">
              {t('services.airportTransfer.ctaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <Link
                to={localizedPath('/#quote')}
                className="btn bg-white text-purple font-bold px-8 py-4 text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 inline-flex items-center justify-center gap-2"
              >
                {t('services.airportTransfer.ctaButton')}
                <ArrowRight size={20} />
              </Link>
              <a
                href={`tel:${country?.phone || '+33176311283'}`}
                className="btn bg-white/20 text-white font-bold px-8 py-4 text-lg hover:bg-white/30 inline-flex items-center justify-center gap-2"
              >
                <Phone size={20} />
                {t('services.airportTransfer.ctaCall')}
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
