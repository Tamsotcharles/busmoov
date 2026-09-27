import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useLocalizedPath } from '@/components/i18n'
import type { SupportedLanguage } from '@/lib/i18n'

// Textes en dur plutôt que dans locales/*/common.json : le sitemap calcule
// le lastmod des pages multilingues à partir de ces fichiers, une clé
// ajoutée ici ferait passer tout le site pour « modifié ».
const texts: Record<SupportedLanguage, { title: string; message: string; home: string }> = {
  fr: { title: 'Page introuvable', message: 'Cette page n\'existe pas ou a été déplacée.', home: 'Retour à l\'accueil' },
  es: { title: 'Página no encontrada', message: 'Esta página no existe o ha sido movida.', home: 'Volver al inicio' },
  de: { title: 'Seite nicht gefunden', message: 'Diese Seite existiert nicht oder wurde verschoben.', home: 'Zur Startseite' },
  en: { title: 'Page not found', message: 'This page does not exist or has been moved.', home: 'Back to home' },
}

/**
 * Page 404. Le serveur répond 200 (SPA), d'où le noindex : sans lui, les
 * URLs inventées étaient redirigées en JavaScript vers l'accueil et
 * Google les traitait comme des soft 404 ou des doublons de la home.
 */
export function NotFoundPage() {
  const { i18n } = useTranslation()
  const localizedPath = useLocalizedPath()
  const t = texts[i18n.language as SupportedLanguage] ?? texts.fr

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <title>{`${t.title} | Busmoov`}</title>
      <meta name="robots" content="noindex, follow" />
      <Header showAdminLink={false} />

      <main className="flex-1 flex items-center justify-center px-4 pt-32 pb-20">
        <div className="text-center max-w-md">
          <p className="text-6xl font-bold text-magenta mb-4">404</p>
          <h1 className="text-2xl font-bold mb-3">{t.title}</h1>
          <p className="text-gray-600 mb-8">{t.message}</p>
          <Link to={localizedPath('/')} className="btn btn-primary">
            {t.home}
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
