import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Link } from 'react-router-dom'
import { Bus, Users, Shield, Clock, MapPin, CheckCircle, Star, Phone, ArrowRight, Wifi, Wind, Plug, Tv } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocalizedPath } from '@/components/i18n'
import { useCurrentCountry } from '@/hooks/useCountrySettings'

export function LocationAutocarPage() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const { data: country } = useCurrentCountry()

  const vehicles = [
    {
      title: t('services.busRental.minibus'),
      capacity: t('services.busRental.minibusCapacity'),
      description: t('services.busRental.minibusDesc'),
      features: [t('services.common.features.airCon'), t('services.common.features.comfort'), t('services.common.features.flexibility')],
    },
    {
      title: t('services.busRental.standard'),
      capacity: t('services.busRental.standardCapacity'),
      description: t('services.busRental.standardDesc'),
      features: [t('services.common.features.luggage'), t('services.common.features.airCon'), t('services.common.features.reclinable')],
    },
    {
      title: t('services.busRental.grandTourisme'),
      capacity: t('services.busRental.grandTourismeCapacity'),
      description: t('services.busRental.grandTourismeDesc'),
      features: [t('services.common.features.wifi'), t('services.common.features.usb'), t('services.common.features.screens'), t('services.common.features.toilet')],
    },
    {
      title: t('services.busRental.doubleEtage'),
      capacity: t('services.busRental.doubleEtageCapacity'),
      description: t('services.busRental.doubleEtageDesc'),
      features: [t('services.common.features.capacity'), t('services.common.features.panoramic'), t('services.common.features.gtComfort')],
    },
  ]

  const equipment = [
    { icon: Wifi, label: t('services.busRental.wifi'), desc: t('services.busRental.wifiDesc') },
    { icon: Wind, label: t('services.busRental.airCon'), desc: t('services.busRental.airConDesc') },
    { icon: Plug, label: t('services.busRental.plugs'), desc: t('services.busRental.plugsDesc') },
    { icon: Tv, label: t('services.busRental.screens'), desc: t('services.busRental.screensDesc') },
  ]

  const occasions = [
    { title: t('services.busRental.privateEvents'), items: t('services.busRental.privateEventsList').split(', ') },
    { title: t('services.busRental.businessEvents'), items: t('services.busRental.businessEventsList').split(', ') },
    { title: t('services.busRental.leisure'), items: t('services.busRental.leisureList').split(', ') },
    { title: t('services.busRental.school'), items: t('services.busRental.schoolList').split(', ') },
    { title: t('services.busRental.associations'), items: t('services.busRental.associationsList').split(', ') },
    { title: t('services.busRental.transfers'), items: t('services.busRental.transfersList').split(', ') },
  ]

  const advantages = [
    { icon: Clock, title: t('services.busRental.quoteIn24h'), description: t('services.busRental.quoteIn24hDesc') },
    { icon: Shield, title: t('services.busRental.verifiedCarriers'), description: t('services.busRental.verifiedCarriersDesc') },
    { icon: Users, title: t('services.busRental.proDrivers'), description: t('services.busRental.proDriversDesc') },
    { icon: Star, title: t('services.busRental.bestPrice'), description: t('services.busRental.bestPriceDesc') },
  ]

  const included = [
    t('services.busRental.included1'),
    t('services.busRental.included2'),
    t('services.busRental.included3'),
    t('services.busRental.included4'),
    t('services.busRental.included5'),
    t('services.busRental.included6'),
    t('services.busRental.included7'),
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
              {t('services.busRental.badge')}
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-purple-dark leading-tight mb-6">
              {t('services.busRental.title')}{' '}
              <span className="gradient-text">{t('services.busRental.titleHighlight')}</span>{' '}
              {t('services.busRental.titleLocation')}
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {t('services.busRental.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to={localizedPath('/#quote')}
                className="btn btn-primary text-lg px-8 py-4 inline-flex items-center justify-center gap-2"
              >
                {t('services.busRental.cta')}
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
                {t('services.busRental.trustBadge1')}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                {t('services.busRental.trustBadge2')}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                {t('services.busRental.trustBadge3')}
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
              {t('services.busRental.fleetTitle')}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('services.busRental.fleetSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {vehicles.map((vehicle, index) => (
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
              {t('services.busRental.equipmentTitle')}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('services.busRental.equipmentSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {equipment.map((item, index) => (
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
              {t('services.busRental.occasionsTitle')}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('services.busRental.occasionsSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {occasions.map((category, index) => (
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
              {t('services.busRental.coverageTitle')}
            </h2>
            <p className="text-white/70 text-lg">
              {t('services.busRental.coverageSubtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-purple-dark mb-6">
                {t('services.busRental.whyChooseTitle')}
              </h2>
              <div className="space-y-6">
                {advantages.map((advantage, index) => (
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
                {t('services.busRental.includedTitle')}
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
              {t('services.busRental.ctaTitle')}
            </h2>
            <p className="text-white/90 text-lg mb-8 relative z-10 max-w-xl mx-auto">
              {t('services.busRental.ctaSubtitle')}
            </p>
            <Link
              to={localizedPath('/#quote')}
              className="btn bg-white text-purple font-bold px-8 py-4 text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 relative z-10 inline-flex items-center gap-2"
            >
              {t('services.busRental.ctaButton')}
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
