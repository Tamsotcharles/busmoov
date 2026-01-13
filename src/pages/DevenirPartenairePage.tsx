import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Send, Building2, Users, TrendingUp, Shield, CheckCircle, Truck } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'
import { useLocalizedPath } from '@/components/i18n'

interface FormData {
  company: string
  contact: string
  email: string
  phone: string
  city: string
  fleetSize: string
  message: string
}

export function DevenirPartenairePage() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const [formData, setFormData] = useState<FormData>({
    company: '',
    contact: '',
    email: '',
    phone: '',
    city: '',
    fleetSize: '',
    message: '',
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)

    try {
      const htmlContent = `
        <h2>Nouvelle demande de partenariat - Busmoov</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Entreprise</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${formData.company}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Contact</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${formData.contact}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;"><a href="mailto:${formData.email}">${formData.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Téléphone</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${formData.phone}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Ville / Département</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${formData.city}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Taille de flotte</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${formData.fleetSize} véhicules</td>
          </tr>
        </table>
        ${formData.message ? `<h3>Message :</h3><p>${formData.message.replace(/\n/g, '<br/>')}</p>` : ''}
      `

      const { error: sendError } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'custom',
          to: 'infos@busmoov.com',
          subject: `[Partenariat Busmoov] ${formData.company} - ${formData.city}`,
          html_content: htmlContent,
        },
      })

      if (sendError) throw sendError

      setSent(true)
    } catch (err) {
      console.error('Error sending partnership form:', err)
      setError(t('partner.errorSending'))
    } finally {
      setSending(false)
    }
  }

  const benefits = [
    {
      icon: TrendingUp,
      title: t('partner.benefit1Title'),
      description: t('partner.benefit1Desc'),
    },
    {
      icon: Users,
      title: t('partner.benefit2Title'),
      description: t('partner.benefit2Desc'),
    },
    {
      icon: Shield,
      title: t('partner.benefit3Title'),
      description: t('partner.benefit3Desc'),
    },
    {
      icon: Building2,
      title: t('partner.benefit4Title'),
      description: t('partner.benefit4Desc'),
    },
  ]

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showAdminLink={false} />
        <main className="pt-24 pb-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {t('partner.successTitle')}
              </h1>
              <p className="text-gray-600 mb-8">
                {t('partner.successMessage')}
              </p>
              <Link to={localizedPath('/')} className="btn btn-primary">
                {t('contact.backHome')}
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showAdminLink={false} />

      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="bg-gradient-to-br from-purple to-magenta text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              to={localizedPath('/')}
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft size={18} />
              {t('contact.backHome')}
            </Link>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  {t('partner.title')}
                </h1>
                <p className="text-xl text-white/90 mb-8">
                  {t('partner.heroText')}
                </p>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{t('partner.statCarriers')}</div>
                    <div className="text-white/70 text-sm">{t('partner.statCarriersLabel')}</div>
                  </div>
                  <div className="w-px h-12 bg-white/30" />
                  <div className="text-center">
                    <div className="text-3xl font-bold">{t('partner.statTrips')}</div>
                    <div className="text-white/70 text-sm">{t('partner.statTripsLabel')}</div>
                  </div>
                  <div className="w-px h-12 bg-white/30" />
                  <div className="text-center">
                    <div className="text-3xl font-bold">{t('partner.statSupport')}</div>
                    <div className="text-white/70 text-sm">{t('partner.statSupportLabel')}</div>
                  </div>
                </div>
              </div>
              <div className="hidden lg:flex justify-center">
                <Truck size={200} className="text-white/20" />
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              {t('partner.whyJoinTitle')}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <benefit.icon size={32} className="text-purple" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                {t('partner.formTitle')}
              </h2>
              <p className="text-gray-600 text-center mb-8">
                {t('partner.formSubtitle')}
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">{t('partner.companyName')}</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      required
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">{t('partner.contactName')}</label>
                    <input
                      type="text"
                      name="contact"
                      value={formData.contact}
                      onChange={handleChange}
                      required
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">{t('partner.email')}</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">{t('partner.phone')}</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">{t('partner.city')}</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">{t('partner.fleetSize')}</label>
                    <select
                      name="fleetSize"
                      value={formData.fleetSize}
                      onChange={handleChange}
                      required
                      className="input"
                    >
                      <option value="">{t('partner.fleetSelect')}</option>
                      <option value="1-5">{t('partner.fleet1to5')}</option>
                      <option value="6-15">{t('partner.fleet6to15')}</option>
                      <option value="16-30">{t('partner.fleet16to30')}</option>
                      <option value="31+">{t('partner.fleet30plus')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">{t('partner.message')}</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="input"
                    placeholder={t('partner.messagePlaceholder')}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="btn btn-primary w-full btn-lg"
                >
                  {sending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('partner.sending')}
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      {t('partner.submitButton')}
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  {t('partner.privacyNotice')}{' '}
                  <Link to="/confidentialite" className="text-purple hover:underline">
                    {t('partner.privacyLink')}
                  </Link>.
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
