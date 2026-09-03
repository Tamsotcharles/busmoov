import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { HomePage } from '@/pages/HomePage'
import { useAuth } from '@/hooks/useAuth'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ABTestProvider } from '@/components/ab-testing'
import { supportedLanguages, defaultLanguage, type SupportedLanguage } from '@/lib/i18n'

// Chargement paresseux de toutes les routes sauf HomePage.
//
// Tout etait auparavant dans un seul bundle de 2,6 Mo : chaque visiteur
// public telechargeait le back-office complet (AdminDashboard fait a lui
// seul ~20 000 lignes) ainsi que la generation PDF (jsPDF + html2canvas).
// C'etait un cout de chargement inutile et cela exposait la logique
// metier admin a n'importe qui sachant lire un bundle.
//
// HomePage reste en import direct : c'est la page d'atterrissage, la
// rendre paresseuse ajouterait un aller-retour reseau sur le LCP.
const CGVPage = lazy(() => import('@/pages/CGVPage').then((m) => ({ default: m.CGVPage })))
const MentionsLegalesPage = lazy(() => import('@/pages/MentionsLegalesPage').then((m) => ({ default: m.MentionsLegalesPage })))
const ConfidentialitePage = lazy(() => import('@/pages/ConfidentialitePage').then((m) => ({ default: m.ConfidentialitePage })))
const AProposPage = lazy(() => import('@/pages/AProposPage').then((m) => ({ default: m.AProposPage })))
const ContactPage = lazy(() => import('@/pages/ContactPage').then((m) => ({ default: m.ContactPage })))
const DevenirPartenairePage = lazy(() => import('@/pages/DevenirPartenairePage').then((m) => ({ default: m.DevenirPartenairePage })))

const LocationAutocarPage = lazy(() => import('@/pages/services').then((m) => ({ default: m.LocationAutocarPage })))
const LocationMinibusPage = lazy(() => import('@/pages/services').then((m) => ({ default: m.LocationMinibusPage })))
const TransfertAeroportPage = lazy(() => import('@/pages/services').then((m) => ({ default: m.TransfertAeroportPage })))
const SortiesScolairesPage = lazy(() => import('@/pages/services').then((m) => ({ default: m.SortiesScolairesPage })))

const MesDevisPage = lazy(() => import('@/pages/client/MesDevisPage').then((m) => ({ default: m.MesDevisPage })))
const InfosVoyagePage = lazy(() => import('@/pages/client/InfosVoyagePage').then((m) => ({ default: m.InfosVoyagePage })))
const EspaceClientPage = lazy(() => import('@/pages/client/EspaceClientPage').then((m) => ({ default: m.EspaceClientPage })))
const ClientDashboardPage = lazy(() => import('@/pages/client/ClientDashboardPage').then((m) => ({ default: m.ClientDashboardPage })))
const PaymentPage = lazy(() => import('@/pages/client/PaymentPage').then((m) => ({ default: m.PaymentPage })))
const RecapitulatifPage = lazy(() => import('@/pages/client/RecapitulatifPage').then((m) => ({ default: m.RecapitulatifPage })))
const ReviewPage = lazy(() => import('@/pages/client/ReviewPage').then((m) => ({ default: m.ReviewPage })))

const ValidationBpaPage = lazy(() => import('@/pages/fournisseur/ValidationBpaPage').then((m) => ({ default: m.ValidationBpaPage })))
const ChauffeurInfoPage = lazy(() => import('@/pages/fournisseur/ChauffeurInfoPage').then((m) => ({ default: m.ChauffeurInfoPage })))
const PropositionTarifPage = lazy(() => import('@/pages/fournisseur/PropositionTarifPage').then((m) => ({ default: m.PropositionTarifPage })))

const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })))
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })))

// Ecran d'attente pendant le telechargement d'un chunk de route.
function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-gray-500">Chargement...</div>
    </div>
  )
}

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
    <ErrorBoundary scope="public-route">
    <Suspense fallback={<RouteFallback />}>
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
    </Suspense>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ABTestProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Routes avec préfixe de langue: /fr/*, /es/*, /de/* */}
            <Route path="/:lang/*" element={<LanguageWrapper />} />

            {/* Admin routes (sans préfixe de langue - back-office en français) */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  {/* Filet dedie : une erreur du back-office ne doit pas
                      renvoyer un ecran blanc a l'equipe en pleine saisie. */}
                  <ErrorBoundary scope="admin">
                    <AdminDashboard />
                  </ErrorBoundary>
                </AdminRoute>
              }
            />

            {/* Racine sans langue - rediriger vers langue par défaut */}
            <Route path="/" element={<RedirectToLanguage />} />

            {/* Routes sans préfixe de langue - rediriger avec préfixe */}
            <Route path="/*" element={<RedirectToLanguage />} />
          </Routes>
        </Suspense>
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
