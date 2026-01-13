import { Link } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, MapPin, Clock, MessageCircle, Send, CheckCircle } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useLocalizedPath } from '@/components/i18n'
import { useCurrentCountry } from '@/hooks/useCountrySettings'

export function ContactPage() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const { data: country } = useCurrentCountry()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
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
        <h2>Nouveau message de contact - Busmoov</h2>
        <p><strong>Nom :</strong> ${formData.name}</p>
        <p><strong>Email :</strong> <a href="mailto:${formData.email}">${formData.email}</a></p>
        <p><strong>Téléphone :</strong> ${formData.phone || 'Non renseigné'}</p>
        <p><strong>Sujet :</strong> ${formData.subject}</p>
        <hr/>
        <h3>Message :</h3>
        <p>${formData.message.replace(/\n/g, '<br/>')}</p>
      `

      const { error: sendError } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'custom',
          to: country?.email || 'infos@busmoov.com',
          subject: `[Contact ${country?.companyName || 'Busmoov'}] ${formData.subject} - ${formData.name}`,
          html_content: htmlContent,
        },
      })

      if (sendError) throw sendError

      setSent(true)
    } catch (err) {
      console.error('Error sending contact form:', err)
      setError(t('contact.sendError'))
    } finally {
      setSending(false)
    }
  }

  const fullAddress = `${country?.address || '41 Rue Barrault'}, ${country?.city || '75013 Paris'}`
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`

  const contactInfo = [
    {
      icon: Phone,
      label: t('contact.phone'),
      value: country?.phoneDisplay || '01 76 31 12 83',
      href: `tel:${country?.phone || '+33176311283'}`,
      color: 'bg-emerald-500',
    },
    {
      icon: Mail,
      label: t('contact.email'),
      value: country?.email || 'infos@busmoov.com',
      href: `mailto:${country?.email || 'infos@busmoov.com'}`,
      color: 'bg-purple',
    },
    {
      icon: MapPin,
      label: t('contact.address'),
      value: fullAddress,
      href: mapsUrl,
      color: 'bg-magenta',
    },
    {
      icon: Clock,
      label: t('contact.hours'),
      value: t('contact.hoursValue'),
      href: null,
      color: 'bg-orange-500',
    },
  ]

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

            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {t('contact.title')}
              </h1>
              <p className="text-xl text-white/90">
                {t('contact.subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-12 -mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((info, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className={`w-12 h-12 ${info.color} rounded-xl flex items-center justify-center mb-4`}>
                    <info.icon size={24} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{info.label}</h3>
                  {info.href ? (
                    <a
                      href={info.href}
                      target={info.href.startsWith('http') ? '_blank' : undefined}
                      rel={info.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="text-gray-600 hover:text-purple transition-colors"
                    >
                      {info.value}
                    </a>
                  ) : (
                    <p className="text-gray-600">{info.value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Company Info */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {country?.companyName || 'Busmoov'} - Groupe Centrale Autocar
                </h2>

                <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">{t('contact.legalInfo')}</h3>
                  <div className="space-y-3 text-gray-600">
                    <p><span className="text-gray-400">{t('contact.companyName')} :</span> <strong>{country?.companyName || 'BUSMOOV SAS'}</strong></p>
                    <p><span className="text-gray-400">{t('contact.groupBrand')} :</span> <strong>Centrale Autocar</strong></p>
                    <p><span className="text-gray-400">{t('contact.headquarters')} :</span> {fullAddress}</p>
                    <p><span className="text-gray-400">{t('contact.siret')} :</span> {country?.siret || '853 867 703 00029'}</p>
                    <p><span className="text-gray-400">{t('contact.vatNumber')} :</span> {country?.tvaIntra || 'FR58853867703'}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple/5 to-magenta/5 rounded-2xl p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple rounded-xl flex items-center justify-center flex-shrink-0">
                      <MessageCircle size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{t('contact.needQuickAnswer')}</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {t('contact.callUsAt')} <strong>{country?.phoneDisplay || '01 76 31 12 83'}</strong>.
                        {t('contact.teamAvailable')}
                      </p>
                      <a
                        href={`tel:${country?.phone || '+33176311283'}`}
                        className="btn btn-primary btn-sm"
                      >
                        <Phone size={16} />
                        {t('contact.callNow')}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                {sent ? (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle size={40} className="text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      {t('contact.messageSent')}
                    </h2>
                    <p className="text-gray-600 mb-6">
                      {t('contact.thankYou')}
                    </p>
                    <button
                      onClick={() => {
                        setSent(false)
                        setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
                      }}
                      className="btn btn-secondary"
                    >
                      {t('contact.sendAnother')}
                    </button>
                  </div>
                ) : (
                  <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {t('contact.sendMessage')}
                </h2>
                <p className="text-gray-600 mb-6">
                  {t('contact.willReply')}
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="label">{t('contact.fullName')} *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="input"
                        placeholder={t('quoteForm.namePlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="label">{t('contact.email')} *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="input"
                        placeholder={t('quoteForm.emailPlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="label">{t('contact.phoneOptional')}</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="input"
                        placeholder={t('quoteForm.phonePlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="label">{t('contact.subject')} *</label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="input"
                      >
                        <option value="">{t('contact.selectSubject')}</option>
                        <option value="Demande de devis">{t('contact.subjectQuote')}</option>
                        <option value="Question sur une réservation">{t('contact.subjectReservation')}</option>
                        <option value="Réclamation">{t('contact.subjectComplaint')}</option>
                        <option value="Partenariat">{t('contact.subjectPartnership')}</option>
                        <option value="Autre">{t('contact.subjectOther')}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="label">{t('contact.message')} *</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="input"
                      placeholder={t('contact.messagePlaceholder')}
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
                        {t('contact.sending')}
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        {t('contact.send')}
                      </>
                    )}
                  </button>
                </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Map placeholder */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gray-200 rounded-2xl h-80 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-medium">{fullAddress}</p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple hover:underline text-sm mt-2 inline-block"
                >
                  {t('contact.viewOnMaps')}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
