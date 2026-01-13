import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { HomePage } from '@/pages/HomePage'
import { CGVPage } from '@/pages/CGVPage'
import { MentionsLegalesPage } from '@/pages/MentionsLegalesPage'
import { ConfidentialitePage } from '@/pages/ConfidentialitePage'
import { AProposPage } from '@/pages/AProposPage'
import { ContactPage } from '@/pages/ContactPage'
import { DevenirPartenairePage } from '@/pages/DevenirPartenairePage'
import { LocationAutocarPage, LocationMinibusPage, TransfertAeroportPage, SortiesScolairesPage } from '@/pages/services'
import { MesDevisPage } from '@/pages/client/MesDevisPage'
import { InfosVoyagePage } from '@/pages/client/InfosVoyagePage'
import { EspaceClientPage } from '@/pages/client/EspaceClientPage'
import { ClientDashboardPage } from '@/pages/client/ClientDashboardPage'
import { PaymentPage } from '@/pages/client/PaymentPage'
import { RecapitulatifPage } from '@/pages/client/RecapitulatifPage'
import { ReviewPage } from '@/pages/client/ReviewPage'
import { ValidationBpaPage } from '@/pages/fournisseur/ValidationBpaPage'
import { ChauffeurInfoPage } from '@/pages/fournisseur/ChauffeurInfoPage'
import { PropositionTarifPage } from '@/pages/fournisseur/PropositionTarifPage'
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { useAuth } from '@/hooks/useAuth'
import { ABTestProvider } from '@/components/ab-testing'
import { LanguageRouter } from '@/components/i18n'
import { supportedLanguages, defaultLanguage, type SupportedLanguage } from '@/lib/i18n'

// Scroll to top on route change, but handle hash links
function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    // Si un hash est présent, scroll vers l'élément correspondant
    if (hash) {
      // Petit délai pour laisser la page se charger
      setTimeout(() => {
        const element = document.querySelector(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } else {
      // Sinon, scroll en haut de la page
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])

  return null
}

// Composant pour rediriger vers la langue par défaut
function RedirectToLanguage() {
  const location = useLocation()
  const { i18n } = useTranslation()

  // Détecter la langue préférée du navigateur ou utiliser la langue actuelle
  const browserLang = navigator.language.split('-')[0]
  const targetLang = supportedLanguages.includes(browserLang as SupportedLanguage)
    ? browserLang
    : (i18n.language || defaultLanguage)

  // Reconstruire l'URL avec le préfixe de langue
  const newPath = `/${targetLang}${location.pathname}${location.search}${location.hash}`

  return <Navigate to={newPath} replace />
}

// Protected route wrapper for admin pages
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth()

  // Afficher le chargement pendant la vérification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Chargement...</div>
      </div>
    )
  }

  // Si pas d'utilisateur, rediriger vers login
  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  // Si utilisateur connecté mais pas encore admin vérifié, attendre un peu
  // (le statut admin est vérifié async après la connexion)
  if (!isAdmin) {
    // On attend 2 secondes max pour le statut admin
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Vérification des droits...</div>
      </div>
    )
  }

  return <>{children}</>
}

// Routes publiques (avec préfixe de langue)
function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/cgv" element={<CGVPage />} />
      <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
      <Route path="/confidentialite" element={<ConfidentialitePage />} />
      <Route path="/a-propos" element={<AProposPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/devenir-partenaire" element={<DevenirPartenairePage />} />

      {/* Services pages - SEO optimized */}
      <Route path="/services/location-autocar" element={<LocationAutocarPage />} />
      <Route path="/services/location-minibus" element={<LocationMinibusPage />} />
      <Route path="/services/transfert-aeroport" element={<TransfertAeroportPage />} />
      <Route path="/services/sorties-scolaires" element={<SortiesScolairesPage />} />

      {/* Client routes */}
      <Route path="/mes-devis" element={<MesDevisPage />} />
      <Route path="/infos-voyage" element={<InfosVoyagePage />} />
      <Route path="/paiement" element={<PaymentPage />} />
      <Route path="/recapitulatif" element={<RecapitulatifPage />} />
      <Route path="/espace-client" element={<EspaceClientPage />} />
      <Route path="/espace-client/dashboard" element={<ClientDashboardPage />} />
      <Route path="/avis" element={<ReviewPage />} />

      {/* Fournisseur routes */}
      <Route path="/validation-bpa" element={<ValidationBpaPage />} />
      <Route path="/fournisseur/validation" element={<ValidationBpaPage />} />
      <Route path="/fournisseur/chauffeur" element={<ChauffeurInfoPage />} />
      <Route path="/fournisseur/proposition-tarif" element={<PropositionTarifPage />} />

      {/* Fallback dans la langue */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ABTestProvider>
        <Routes>
          {/* Routes avec préfixe de langue: /fr/*, /es/*, /de/* */}
          <Route path="/:lang/*" element={<LanguageWrapper />} />

          {/* Admin routes (sans préfixe de langue - back-office en français) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* Racine sans langue - rediriger vers langue par défaut */}
          <Route path="/" element={<RedirectToLanguage />} />

          {/* Routes sans préfixe de langue - rediriger avec préfixe */}
          <Route path="/*" element={<RedirectToLanguage />} />
        </Routes>
      </ABTestProvider>
    </BrowserRouter>
  )
}

// Wrapper pour les routes avec langue
function LanguageWrapper() {
  const { lang } = useLocation().pathname.match(/^\/(?<lang>fr|es|de|en)/)?.groups || {}
  const { i18n } = useTranslation()

  useEffect(() => {
    if (lang && supportedLanguages.includes(lang as SupportedLanguage)) {
      if (i18n.language !== lang) {
        i18n.changeLanguage(lang)
      }
    }
  }, [lang, i18n])

  // Vérifier que la langue est valide
  const location = useLocation()
  const pathLang = location.pathname.split('/')[1]

  if (!supportedLanguages.includes(pathLang as SupportedLanguage)) {
    // Langue invalide, rediriger vers la langue par défaut
    const restOfPath = location.pathname.replace(/^\/[^/]+/, '')
    return <Navigate to={`/${defaultLanguage}${restOfPath}${location.search}${location.hash}`} replace />
  }

  return <PublicRoutes />
}
