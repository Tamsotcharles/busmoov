import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, Calendar } from 'lucide-react'
import DOMPurify from 'dompurify'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useCurrentCountry, useCurrentCountryCode } from '@/hooks/useCountrySettings'
import { useLocalizedPath } from '@/components/i18n'

interface CGV {
  id: string
  version: string
  title: string
  content: string
  published_at: string | null
}

export function CGVPage() {
  const { t, i18n } = useTranslation()
  const localizedPath = useLocalizedPath()
  const { data: country } = useCurrentCountry()
  const countryCode = useCurrentCountryCode()
  const [cgv, setCgv] = useState<CGV | null>(null)
  const [loading, setLoading] = useState(true)

  const language = i18n.language || 'fr'

  useEffect(() => {
    loadCGV()
  }, [countryCode, language])

  const loadCGV = async () => {
    try {
      // D'abord essayer de charger les CGV pour la langue/pays actuel
      let { data, error } = await supabase
        .from('cgv')
        .select('id, version, title, content, published_at')
        .eq('country_code', countryCode)
        .eq('language', language)
        .eq('is_active', true)
        .single()

      // Si pas trouvé, essayer avec la langue par défaut (fr) pour ce pays
      if (error || !data) {
        const fallback = await supabase
          .from('cgv')
          .select('id, version, title, content, published_at')
          .eq('country_code', countryCode)
          .eq('is_active', true)
          .single()

        if (fallback.data && !fallback.error) {
          data = fallback.data
          error = null
        }
      }

      // Si toujours pas trouvé, prendre les CGV françaises par défaut
      if (error || !data) {
        const defaultCgv = await supabase
          .from('cgv')
          .select('id, version, title, content, published_at')
          .eq('country_code', 'FR')
          .eq('is_active', true)
          .single()

        if (defaultCgv.data && !defaultCgv.error) {
          data = defaultCgv.data
        }
      }

      if (data) {
        setCgv(data)
      }
    } catch (err) {
      console.error('Erreur chargement CGV:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fonction de rendu markdown simple
  const renderMarkdown = (text: string): string => {
    return text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-800">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-4 text-gray-900">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4 text-gray-900">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold">$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Lists
      .replace(/^\- (.*$)/gim, '<li class="ml-6 list-disc text-gray-600">$1</li>')
      // Horizontal rule
      .replace(/^---$/gim, '<hr class="my-8 border-gray-200"/>')
      // Paragraphs (double newline)
      .replace(/\n\n/g, '</p><p class="mb-4 text-gray-600 leading-relaxed">')
      // Line breaks
      .replace(/\n/g, '<br/>')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showAdminLink={false} />
        <div className="pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-magenta border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">{t('common.loading', 'Chargement...')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showAdminLink={false} />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            to={localizedPath('/')}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-magenta mb-8 transition-colors"
          >
            <ArrowLeft size={18} />
            {t('contact.backHome')}
          </Link>

          {cgv ? (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple to-magenta px-8 py-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <FileText size={28} />
                  <h1 className="text-2xl font-bold">{cgv.title}</h1>
                </div>
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    Version {cgv.version}
                  </span>
                  {cgv.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      Mis à jour le {new Date(cgv.published_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="px-8 py-8">
                <div
                  className="prose prose-gray max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      `<p class="mb-4 text-gray-600 leading-relaxed">${renderMarkdown(cgv.content)}</p>`,
                      {
                        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'strong', 'em', 'li', 'ul', 'ol', 'hr', 'br', 'a'],
                        ALLOWED_ATTR: ['class', 'href'],
                        ALLOW_DATA_ATTR: false
                      }
                    )
                  }}
                />
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 text-center">
                  {t('cgv.contact', 'Pour toute question concernant ces conditions, contactez-nous à')}{' '}
                  <a href={`mailto:${country?.email || 'infos@busmoov.com'}`} className="text-magenta hover:underline">
                    {country?.email || 'infos@busmoov.com'}
                  </a>
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                {t('cgv.notAvailable', 'CGV non disponibles')}
              </h2>
              <p className="text-gray-500">
                {t('cgv.notPublished', 'Les conditions générales de vente ne sont pas encore publiées.')}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
