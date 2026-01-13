import { useEffect } from 'react'
import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supportedLanguages, defaultLanguage, type SupportedLanguage } from '@/lib/i18n'

/**
 * LanguageRouter - Gère le préfixe de langue dans l'URL
 *
 * Routes: /fr/..., /es/..., /de/...
 * Redirection automatique vers la langue par défaut si pas de préfixe
 */
export function LanguageRouter() {
  const { lang } = useParams<{ lang: string }>()
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Si la langue dans l'URL est valide, l'appliquer
    if (lang && supportedLanguages.includes(lang as SupportedLanguage)) {
      if (i18n.language !== lang) {
        i18n.changeLanguage(lang)
      }
    }
  }, [lang, i18n])

  return <Outlet />
}

/**
 * Hook pour obtenir l'URL avec le préfixe de langue
 */
export function useLocalizedPath() {
  const { i18n } = useTranslation()
  const lang = i18n.language as SupportedLanguage

  return (path: string) => {
    // Nettoyer le path
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `/${lang}${cleanPath}`
  }
}

/**
 * Hook pour changer de langue (redirige vers la même page dans la nouvelle langue)
 */
export function useLanguageSwitcher() {
  const navigate = useNavigate()
  const location = useLocation()
  const { i18n } = useTranslation()

  const switchLanguage = (newLang: SupportedLanguage) => {
    const currentPath = location.pathname

    // Remplacer le préfixe de langue dans l'URL
    let newPath: string

    // Vérifier si l'URL commence par un préfixe de langue
    const langPrefixMatch = currentPath.match(new RegExp(`^/(${supportedLanguages.join('|')})(/|$)`))

    if (langPrefixMatch) {
      // Remplacer l'ancien préfixe par le nouveau
      newPath = currentPath.replace(new RegExp(`^/(${supportedLanguages.join('|')})`), `/${newLang}`)
    } else if (currentPath === '/') {
      // Page racine sans préfixe
      newPath = `/${newLang}`
    } else {
      // Ajouter le préfixe à un chemin sans langue
      newPath = `/${newLang}${currentPath}`
    }

    // S'assurer que le chemin n'est pas vide
    if (newPath === `/${newLang}/`) {
      newPath = `/${newLang}`
    }

    // Changer la langue dans i18n
    i18n.changeLanguage(newLang)

    // Naviguer vers la nouvelle URL
    navigate(newPath + location.search + location.hash, { replace: true })
  }

  return { switchLanguage, currentLanguage: i18n.language as SupportedLanguage }
}

/**
 * Composant de redirection vers la langue par défaut
 */
export function RedirectToDefaultLanguage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { i18n } = useTranslation()

  useEffect(() => {
    // Détecter la langue préférée du navigateur
    const browserLang = navigator.language.split('-')[0]
    const targetLang = supportedLanguages.includes(browserLang as SupportedLanguage)
      ? browserLang
      : defaultLanguage

    // Rediriger vers la langue détectée
    const newPath = `/${targetLang}${location.pathname}${location.search}${location.hash}`
    navigate(newPath, { replace: true })
  }, [navigate, location])

  return null
}

/**
 * Sélecteur de langue
 */
export function LanguageSelector({ className = '' }: { className?: string }) {
  const { switchLanguage, currentLanguage } = useLanguageSwitcher()
  const { t } = useTranslation()

  const languages: { code: SupportedLanguage; flag: string; name: string }[] = [
    { code: 'fr', flag: '🇫🇷', name: 'Français' },
    { code: 'es', flag: '🇪🇸', name: 'Español' },
    { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
    { code: 'en', flag: '🇬🇧', name: 'English' },
  ]

  return (
    <div className={`relative inline-block ${className}`}>
      <select
        value={currentLanguage}
        onChange={(e) => switchLanguage(e.target.value as SupportedLanguage)}
        className="appearance-none bg-transparent border border-gray-300 rounded-lg px-3 py-1.5 pr-8 text-sm cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}
