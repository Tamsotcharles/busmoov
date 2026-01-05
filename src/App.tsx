import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { CGVPage } from '@/pages/CGVPage'
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
import { ValidationBpaPage } from '@/pages/fournisseur/ValidationBpaPage'
import { ChauffeurInfoPage } from '@/pages/fournisseur/ChauffeurInfoPage'
import { PropositionTarifPage } from '@/pages/fournisseur/PropositionTarifPage'
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { useAuth } from '@/hooks/useAuth'
import { ABTestProvider } from '@/components/ab-testing'

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

export default function App() {
  return (
    <BrowserRouter>
      <ABTestProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/cgv" element={<CGVPage />} />
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

          {/* Fournisseur routes */}
          <Route path="/validation-bpa" element={<ValidationBpaPage />} />
          <Route path="/fournisseur/validation" element={<ValidationBpaPage />} />
          <Route path="/fournisseur/chauffeur" element={<ChauffeurInfoPage />} />
          <Route path="/fournisseur/proposition-tarif" element={<PropositionTarifPage />} />

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ABTestProvider>
    </BrowserRouter>
  )
}
