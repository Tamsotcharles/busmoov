import { Link } from 'react-router-dom'
import { ArrowLeft, Award, Users, MapPin, Clock, Shield, Heart, Bus, Star, CheckCircle } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useTranslation } from 'react-i18next'
import { useLocalizedPath } from '@/components/i18n'

export function AProposPage() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const values = [
    {
      icon: Shield,
      title: t('about.valueReliability'),
      description: t('about.valueReliabilityDesc'),
    },
    {
      icon: Heart,
      title: t('about.valueService'),
      description: t('about.valueServiceDesc'),
    },
    {
      icon: Star,
      title: t('about.valueQuality'),
      description: t('about.valueQualityDesc'),
    },
    {
      icon: Award,
      title: t('about.valueExpertise'),
      description: t('about.valueExpertiseDesc'),
    },
  ]

  const stats = [
    { value: '5+', label: t('about.statYears') },
    { value: '150+', label: t('about.statPartners') },
    { value: '50 000+', label: t('about.statPassengers') },
    { value: '98%', label: t('about.statSatisfaction') },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showAdminLink={false} />

      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="bg-gradient-to-br from-purple-dark to-purple text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              to={localizedPath('/')}
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft size={18} />
              {t('contact.backHome')}
            </Link>

            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {t('about.title')}
              </h1>
              <p className="text-xl text-white/90 leading-relaxed">
                {t('about.heroText')}
              </p>
            </div>
          </div>
        </section>

        {/* Notre histoire */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  {t('about.storyTitle')}
                </h2>
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <p>{t('about.storyP1')}</p>
                  <p>{t('about.storyP2')}</p>
                  <p>{t('about.storyP3')}</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple/5 to-magenta/5 rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center p-6 bg-white rounded-2xl shadow-sm">
                      <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Nos valeurs */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              {t('about.valuesTitle')}
            </h2>
            <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
              {t('about.valuesSubtitle')}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple to-magenta rounded-xl flex items-center justify-center mb-4">
                    <value.icon size={28} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Notre engagement */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-purple to-magenta rounded-3xl p-8 md:p-12 text-white">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-6">
                    {t('about.commitmentTitle')}
                  </h2>
                  <ul className="space-y-4">
                    {[
                      t('about.commitment1'),
                      t('about.commitment2'),
                      t('about.commitment3'),
                      t('about.commitment4'),
                      t('about.commitment5'),
                      t('about.commitment6'),
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <CheckCircle size={20} className="text-white/80 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-center">
                  <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center">
                    <Bus size={80} className="mx-auto mb-4 text-white/80" />
                    <p className="text-2xl font-bold mb-2">Centrale Autocar</p>
                    <p className="text-white/70">{t('about.groupSubtitle')}</p>
                    <a
                      href="https://www.centrale-autocar.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-4 text-sm underline hover:no-underline"
                    >
                      {t('about.visitSite')}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('about.ctaTitle')}
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              {t('about.ctaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={localizedPath('/#quote')} className="btn btn-primary btn-lg">
                {t('hero.cta')}
              </Link>
              <Link to={localizedPath('/contact')} className="btn btn-secondary btn-lg">
                {t('nav.contact')}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
