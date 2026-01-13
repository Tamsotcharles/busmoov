import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Link } from 'react-router-dom'
import { Bus, Users, Shield, Clock, MapPin, CheckCircle, Star, Phone, ArrowRight, Briefcase, Heart, Camera, Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocalizedPath } from '@/components/i18n'
import { useCurrentCountry } from '@/hooks/useCountrySettings'

export function LocationMinibusPage() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const { data: country } = useCurrentCountry()

  const advantages = [
    {
      icon: Users,
      title: t('services.minibusRental.advantage1Title'),
      description: t('services.minibusRental.advantage1Desc'),
    },
    {
      icon: MapPin,
      title: t('services.minibusRental.advantage2Title'),
      description: t('services.minibusRental.advantage2Desc'),
    },
    {
      icon: Star,
      title: t('services.minibusRental.advantage3Title'),
      description: t('services.minibusRental.advantage3Desc'),
    },
    {
      icon: Clock,
      title: t('services.minibusRental.advantage4Title'),
      description: t('services.minibusRental.advantage4Desc'),
    },
  ]

  const vehicles = [
    {
      title: t('services.minibusRental.mini8Title'),
      description: t('services.minibusRental.mini8Desc'),
      usages: [
        t('services.minibusRental.mini8Usage1'),
        t('services.minibusRental.mini8Usage2'),
        t('services.minibusRental.mini8Usage3'),
        t('services.minibusRental.mini8Usage4'),
      ],
      features: [
        t('services.minibusRental.featureClim'),
        t('services.minibusRental.featureBagages'),
        t('services.minibusRental.featureConfort'),
      ],
    },
    {
      title: t('services.minibusRental.mini12Title'),
      description: t('services.minibusRental.mini12Desc'),
      usages: [
        t('services.minibusRental.mini12Usage1'),
        t('services.minibusRental.mini12Usage2'),
        t('services.minibusRental.mini12Usage3'),
        t('services.minibusRental.mini12Usage4'),
      ],
      features: [
        t('services.minibusRental.featureClim'),
        t('services.minibusRental.featureSoute'),
        t('services.minibusRental.featureWifi'),
      ],
    },
    {
      title: t('services.minibusRental.mini20Title'),
      description: t('services.minibusRental.mini20Desc'),
      usages: [
        t('services.minibusRental.mini20Usage1'),
        t('services.minibusRental.mini20Usage2'),
        t('services.minibusRental.mini20Usage3'),
        t('services.minibusRental.mini20Usage4'),
      ],
      features: [
        t('services.minibusRental.featureClim'),
        t('services.minibusRental.featureGrandeSoute'),
        t('services.minibusRental.featureSieges'),
      ],
    },
  ]

  const occasions = [
    {
      icon: Briefcase,
      title: t('services.minibusRental.occasionPro'),
      items: [
        t('services.minibusRental.occasionProItem1'),
        t('services.minibusRental.occasionProItem2'),
        t('services.minibusRental.occasionProItem3'),
        t('services.minibusRental.occasionProItem4'),
      ],
    },
    {
      icon: Heart,
      title: t('services.minibusRental.occasionPrivate'),
      items: [
        t('services.minibusRental.occasionPrivateItem1'),
        t('services.minibusRental.occasionPrivateItem2'),
        t('services.minibusRental.occasionPrivateItem3'),
        t('services.minibusRental.occasionPrivateItem4'),
      ],
    },
    {
      icon: Camera,
      title: t('services.minibusRental.occasionTourism'),
      items: [
        t('services.minibusRental.occasionTourismItem1'),
        t('services.minibusRental.occasionTourismItem2'),
        t('services.minibusRental.occasionTourismItem3'),
        t('services.minibusRental.occasionTourismItem4'),
      ],
    },
    {
      icon: Building2,
      title: t('services.minibusRental.occasionTransfer'),
      items: [
        t('services.minibusRental.occasionTransferItem1'),
        t('services.minibusRental.occasionTransferItem2'),
        t('services.minibusRental.occasionTransferItem3'),
        t('services.minibusRental.occasionTransferItem4'),
      ],
    },
  ]

  const pricing = [
    {
      type: t('services.minibusRental.pricingHalfDay'),
      duration: t('services.minibusRental.pricingHalfDayDuration'),
      price: t('services.minibusRental.pricingHalfDayPrice'),
      includes: [
        t('services.minibusRental.pricingHalfDayInclude1'),
        t('services.minibusRental.pricingHalfDayInclude2'),
        t('services.minibusRental.pricingHalfDayInclude3'),
      ],
    },
    {
      type: t('services.minibusRental.pricingFullDay'),
      duration: t('services.minibusRental.pricingFullDayDuration'),
      price: t('services.minibusRental.pricingFullDayPrice'),
      includes: [
        t('services.minibusRental.pricingFullDayInclude1'),
        t('services.minibusRental.pricingFullDayInclude2'),
        t('services.minibusRental.pricingFullDayInclude3'),
        t('services.minibusRental.pricingFullDayInclude4'),
      ],
      highlight: true,
    },
    {
      type: t('services.minibusRental.pricingTransfer'),
      duration: t('services.minibusRental.pricingTransferDuration'),
      price: t('services.minibusRental.pricingTransferPrice'),
      includes: [
        t('services.minibusRental.pricingTransferInclude1'),
        t('services.minibusRental.pricingTransferInclude2'),
        t('services.minibusRental.pricingTransferInclude3'),
      ],
    },
  ]

  const whyBusmoov = [
    {
      icon: Clock,
      title: t('services.minibusRental.why1Title'),
      description: t('services.minibusRental.why1Desc'),
    },
    {
      icon: Shield,
      title: t('services.minibusRental.why2Title'),
      description: t('services.minibusRental.why2Desc'),
    },
    {
      icon: Star,
      title: t('services.minibusRental.why3Title'),
      description: t('services.minibusRental.why3Desc'),
    },
    {
      icon: Users,
      title: t('services.minibusRental.why4Title'),
      description: t('services.minibusRental.why4Desc'),
    },
  ]

  const included = [
    t('services.minibusRental.included1'),
    t('services.minibusRental.included2'),
    t('services.minibusRental.included3'),
    t('services.minibusRental.included4'),
    t('services.minibusRental.included5'),
    t('services.minibusRental.included6'),
    t('services.minibusRental.included7'),
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
              <Bus size={16} />
              {t('services.minibusRental.badge')}
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-purple-dark leading-tight mb-6">
              {t('services.minibusRental.title')}{' '}
              <span className="gradient-text">{t('services.minibusRental.titleHighlight')}</span>{' '}
              {t('services.minibusRental.titleSuffix')}
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {t('services.minibusRental.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to={localizedPath('/#quote')}
                className="btn btn-primary text-lg px-8 py-4 inline-flex items-center justify-center gap-2"
              >
                {t('services.minibusRental.ctaButton')}
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
                {t('services.minibusRental.trustBadge1')}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                {t('services.minibusRental.trustBadge2')}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                {t('services.minibusRental.trustBadge3')}
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
              {t('services.minibusRental.advantagesTitle')}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('services.minibusRental.advantagesSubtitle')}
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

      {/* Types de minibus */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-4">
              {t('services.minibusRental.capacityTitle')}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('services.minibusRental.capacitySubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {vehicles.map((vehicle, index) => (
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
                  <h4 className="text-sm font-semibold text-purple-dark mb-2">{t('services.minibusRental.commonUsages')}</h4>
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
              {t('services.minibusRental.occasionsTitle')}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('services.minibusRental.occasionsSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {occasions.map((category, index) => (
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
              {t('services.minibusRental.pricingTitle')}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('services.minibusRental.pricingSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {pricing.map((offer, index) => (
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
            {t('services.minibusRental.pricingNote')}
          </p>
        </div>
      </section>

      {/* Pourquoi Busmoov */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-6">
                {t('services.minibusRental.whyTitle')}
              </h2>
              <div className="space-y-6">
                {whyBusmoov.map((item, index) => (
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
                {t('services.minibusRental.includedTitle')}
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

      {/* CTA */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="gradient-bg rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4 relative z-10">
              {t('services.minibusRental.ctaTitle')}
            </h2>
            <p className="text-white/90 text-lg mb-8 relative z-10 max-w-xl mx-auto">
              {t('services.minibusRental.ctaSubtitle')}
            </p>
            <Link
              to={localizedPath('/#quote')}
              className="btn bg-white text-purple font-bold px-8 py-4 text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 relative z-10 inline-flex items-center gap-2"
            >
              {t('services.minibusRental.ctaButton')}
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
