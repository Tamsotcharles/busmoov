import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Phone, Menu, X, User, Globe } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguageSwitcher, useLocalizedPath } from '@/components/i18n'
import { type SupportedLanguage } from '@/lib/i18n'
import { useCurrentCountry } from '@/hooks/useCountrySettings'

interface HeaderProps {
  showAdminLink?: boolean
}

const languages: { code: SupportedLanguage; flag: string; name: string }[] = [
  { code: 'fr', flag: '🇫🇷', name: 'FR' },
  { code: 'es', flag: '🇪🇸', name: 'ES' },
  { code: 'de', flag: '🇩🇪', name: 'DE' },
  { code: 'en', flag: '🇬🇧', name: 'EN' },
]

export function Header({ showAdminLink = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const langMenuDesktopRef = useRef<HTMLDivElement>(null)
  const langMenuMobileRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { switchLanguage, currentLanguage } = useLanguageSwitcher()
  const localizedPath = useLocalizedPath()
  const { data: country } = useCurrentCountry()

  // Vérifier si on est sur la page d'accueil (avec préfixe de langue)
  const isHomePage = location.pathname === '/' || location.pathname.match(/^\/(fr|es|de|en)\/?$/)

  // Fermer le menu mobile lors d'un changement de route
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Fermer le menu langue quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const isOutsideDesktop = langMenuDesktopRef.current && !langMenuDesktopRef.current.contains(target)
      const isOutsideMobile = langMenuMobileRef.current && !langMenuMobileRef.current.contains(target)

      // Fermer seulement si le clic est en dehors des deux menus
      if (isOutsideDesktop && isOutsideMobile) {
        setLangMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const closeMenu = () => {
    setMobileMenuOpen(false)
  }

  // Gérer la navigation vers une section de la page d'accueil
  const handleHashNavigation = (hash: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    closeMenu()

    if (isHomePage) {
      // Sur la page d'accueil, scroll direct vers la section
      const element = document.querySelector(hash)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      // Sur une autre page, naviguer vers la page d'accueil avec le hash
      navigate(localizedPath('/') + hash)
    }
  }

  const currentLang = languages.find(l => l.code === currentLanguage) || languages[0]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link to={localizedPath('/')} className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
          <img src="/logo-icon.svg" alt="Busmoov" className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12" />
          <span className="font-display text-xl lg:text-2xl font-bold gradient-text">
            Busmoov
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3 lg:gap-5">
          <a href="#how-it-works" onClick={handleHashNavigation('#how-it-works')} className="text-sm lg:text-base text-gray-600 hover:text-magenta font-medium transition-colors whitespace-nowrap">
            {t('nav.howItWorks', 'Comment ça marche')}
          </a>
          <a href="#features" onClick={handleHashNavigation('#features')} className="text-sm lg:text-base text-gray-600 hover:text-magenta font-medium transition-colors whitespace-nowrap">
            {t('nav.services', 'Nos services')}
          </a>
          <a href="#testimonials" onClick={handleHashNavigation('#testimonials')} className="text-sm lg:text-base text-gray-600 hover:text-magenta font-medium transition-colors whitespace-nowrap">
            {t('nav.reviews', 'Avis clients')}
          </a>
          <a href={`tel:${country?.phone || '+33176311283'}`} className="flex items-center gap-1.5 lg:gap-2 text-sm lg:text-base text-purple font-semibold whitespace-nowrap">
            <Phone size={16} className="lg:w-[18px] lg:h-[18px]" />
            {country?.phoneDisplay || '01 76 31 12 83'}
          </a>
          <Link to={localizedPath('/espace-client')} className="flex items-center gap-1.5 lg:gap-2 text-sm lg:text-base text-gray-600 hover:text-magenta font-medium transition-colors whitespace-nowrap">
            <User size={16} className="lg:w-[18px] lg:h-[18px]" />
            {t('nav.myAccount', 'Espace client')}
          </Link>

          {/* Language Selector */}
          <div className="relative" ref={langMenuDesktopRef}>
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 text-gray-600 hover:text-magenta font-medium transition-colors px-2 py-1 rounded-lg hover:bg-gray-50"
            >
              <Globe size={18} />
              <span>{currentLang.flag}</span>
              <span className="text-sm">{currentLang.name}</span>
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      switchLanguage(lang.code)
                      setLangMenuOpen(false)
                    }}
                    className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                      currentLanguage === lang.code ? 'text-magenta font-semibold' : 'text-gray-700'
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span>{t(`language.${lang.code}`, lang.name)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {showAdminLink && (
            <Link to="/admin" className="btn btn-secondary btn-sm text-sm">
              Admin
            </Link>
          )}
          <a href="#quote" onClick={handleHashNavigation('#quote')} className="btn btn-primary btn-sm lg:btn-md text-sm lg:text-base whitespace-nowrap">
            {t('hero.cta', 'Obtenir un devis')}
          </a>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          {/* Language Selector Mobile */}
          <div className="relative" ref={langMenuMobileRef}>
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1 text-gray-600 p-2"
            >
              <span>{currentLang.flag}</span>
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      switchLanguage(lang.code)
                      setLangMenuOpen(false)
                    }}
                    className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                      currentLanguage === lang.code ? 'text-magenta font-semibold' : 'text-gray-700'
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span>{t(`language.${lang.code}`, lang.name)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 space-y-4">
          <a href="#how-it-works" onClick={handleHashNavigation('#how-it-works')} className="block text-gray-600 hover:text-magenta font-medium">
            {t('nav.howItWorks', 'Comment ça marche')}
          </a>
          <a href="#features" onClick={handleHashNavigation('#features')} className="block text-gray-600 hover:text-magenta font-medium">
            {t('nav.services', 'Nos services')}
          </a>
          <a href="#testimonials" onClick={handleHashNavigation('#testimonials')} className="block text-gray-600 hover:text-magenta font-medium">
            {t('nav.reviews', 'Avis clients')}
          </a>
          <a href={`tel:${country?.phone || '+33176311283'}`} className="flex items-center gap-2 text-purple font-semibold">
            <Phone size={18} />
            {country?.phoneDisplay || '01 76 31 12 83'}
          </a>
          <Link to={localizedPath('/espace-client')} onClick={closeMenu} className="flex items-center gap-2 text-gray-600 hover:text-magenta font-medium">
            <User size={18} />
            {t('nav.myAccount', 'Espace client')}
          </Link>
          {showAdminLink && (
            <Link to="/admin" onClick={closeMenu} className="block btn btn-secondary w-full">
              Admin
            </Link>
          )}
          <a href="#quote" onClick={handleHashNavigation('#quote')} className="block btn btn-primary w-full text-center">
            {t('hero.cta', 'Obtenir un devis')}
          </a>
        </div>
      )}
    </header>
  )
}
