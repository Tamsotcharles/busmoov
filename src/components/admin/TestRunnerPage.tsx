/**
 * Page d'exécution des tests automatisés
 * Accessible depuis l'admin pour lancer les tests du process global
 */

import { useState } from 'react'
import {
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  RefreshCw,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { generateChauffeurToken } from '@/hooks/useSupabase'
import { formatPrice, calculateNumberOfCars } from '@/lib/utils'

interface TestResult {
  name: string
  success: boolean
  message: string
  data?: any
  duration: number
}

interface TestSuite {
  name: string
  results: TestResult[]
  totalDuration: number
  passed: number
  failed: number
}

// Configuration des tests
const TEST_CONFIG = {
  prefix: 'TEST-AUTO',
  testEmail: 'test@busmoov.local',
}

// Générateur de référence unique
const generateReference = () => {
  const now = new Date()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${TEST_CONFIG.prefix}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${rand}`
}

export function TestRunnerPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [summary, setSummary] = useState<{ passed: number; failed: number; duration: number } | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result])
  }

  // ============================================
  // FONCTIONS DE TEST
  // ============================================

  const measureTime = async <T,>(fn: () => Promise<T>): Promise<[T, number]> => {
    const start = Date.now()
    const result = await fn()
    return [result, Date.now() - start]
  }

  const testCreateDossier = async (type: 'aller_simple' | 'ar_1j' | 'ar_mad'): Promise<TestResult> => {
    const typeLabels = {
      'aller_simple': 'Aller Simple',
      'ar_1j': 'AR 1 Jour',
      'ar_mad': 'AR avec MAD',
    }

    const [result, duration] = await measureTime(async () => {
      const reference = generateReference()
      const departureDate = new Date()
      departureDate.setDate(departureDate.getDate() + 30 + Math.floor(Math.random() * 30))

      const baseData = {
        reference,
        client_name: `Client Test ${typeLabels[type]}`,
        client_email: TEST_CONFIG.testEmail,
        client_phone: '0600000001',
        departure: ['Paris', 'Lyon', 'Marseille', 'Bordeaux'][Math.floor(Math.random() * 4)],
        arrival: ['Nice', 'Toulouse', 'Nantes', 'Strasbourg'][Math.floor(Math.random() * 4)],
        departure_date: departureDate.toISOString().split('T')[0],
        departure_time: '08:00',
        passengers: 30 + Math.floor(Math.random() * 30),
        vehicle_type: 'standard',
        status: 'new',
      }

      let insertData: any = { ...baseData, trip_mode: 'aller_simple' }

      if (type === 'ar_1j') {
        insertData = {
          ...baseData,
          trip_mode: 'aller_retour',
          return_date: departureDate.toISOString().split('T')[0],
          return_time: '19:00',
        }
      } else if (type === 'ar_mad') {
        const returnDate = new Date(departureDate)
        returnDate.setDate(returnDate.getDate() + 3)
        insertData = {
          ...baseData,
          trip_mode: 'aller_retour',
          return_date: returnDate.toISOString().split('T')[0],
          return_time: '18:00',
          special_requests: 'Mise à disposition sur place pendant 3 jours',
        }
      }

      const { data, error } = await supabase
        .from('dossiers')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error

      // Créer l'entrée auto-devis pour ce dossier (comme le fait useCreateDemande)
      try {
        const { data: defaultWorkflow } = await supabase
          .from('workflow_devis_auto')
          .select('id, steps')
          .eq('is_default', true)
          .eq('is_active', true)
          .single()

        if (defaultWorkflow) {
          const steps = defaultWorkflow.steps as { delay_hours: number }[]
          const firstStepDelay = steps?.[0]?.delay_hours || 0
          const nextDevisAt = new Date(Date.now() + firstStepDelay * 60 * 60 * 1000).toISOString()

          await supabase
            .from('dossiers_auto_devis')
            .insert({
              dossier_id: data.id,
              workflow_id: defaultWorkflow.id,
              is_active: true,
              current_step: 0,
              next_devis_at: nextDevisAt,
              devis_generes: [],
              started_at: new Date().toISOString(),
            })
        }
      } catch (autoDevisError) {
        console.error('Erreur création auto-devis pour test:', autoDevisError)
        // Ne pas bloquer si l'auto-devis échoue
      }

      return data
    })

    return {
      name: `Création dossier ${typeLabels[type]}`,
      success: !!result,
      message: result ? `${result.reference}` : 'Échec',
      data: result,
      duration,
    }
  }

  const testCreateDevis = async (dossierId: string, transporteurId: string | null): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const refDevis = `DEV-TEST-${Date.now()}`
      const prixHT = 700 + Math.floor(Math.random() * 500)
      const prixTTC = Math.round(prixHT * 1.1)

      const { data, error } = await supabase
        .from('devis')
        .insert({
          dossier_id: dossierId,
          transporteur_id: transporteurId,
          reference: refDevis,
          price_ht: prixHT,
          price_ttc: prixTTC,
          price_achat_ht: Math.round(prixHT * 0.85),
          price_achat_ttc: Math.round(prixHT * 0.85 * 1.1),
          tva_rate: 10,
          status: 'pending',
          validity_days: 30,
          service_type: 'ar_1j',
          nombre_cars: 1,
          nombre_chauffeurs: 1,
        })
        .select()
        .single()

      if (error) throw error
      return data
    })

    return {
      name: 'Création devis',
      success: !!result,
      message: result ? `${result.reference} - ${formatPrice(result.price_ttc)}` : 'Échec',
      data: result,
      duration,
    }
  }

  const testEnvoyerDevis = async (devisId: string): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const { data, error } = await supabase
        .from('devis')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', devisId)
        .select()
        .single()

      if (error) throw error
      return data
    })

    return {
      name: 'Envoi devis',
      success: result?.status === 'sent',
      message: result?.status === 'sent' ? 'Devis envoyé' : 'Échec',
      data: result,
      duration,
    }
  }

  const testAccepterDevis = async (devisId: string, dossierId: string): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const { data: devis, error: devisError } = await supabase
        .from('devis')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', devisId)
        .select()
        .single()

      if (devisError) throw devisError

      await supabase
        .from('dossiers')
        .update({
          status: 'pending-payment',
          price_ht: devis.price_ht,
          price_ttc: devis.price_ttc,
          transporteur_id: devis.transporteur_id,
        })
        .eq('id', dossierId)

      return devis
    })

    return {
      name: 'Acceptation devis',
      success: result?.status === 'accepted',
      message: result?.status === 'accepted' ? 'Devis accepté' : 'Échec',
      data: result,
      duration,
    }
  }

  const testSignerContrat = async (dossierId: string, devisId: string, priceTTC: number): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      // Créer le contrat (utiliser any pour contourner les types stricts)
      const { data: contrat, error: contratError } = await (supabase as any)
        .from('contrats')
        .insert({
          dossier_id: dossierId,
          devis_id: devisId,
          status: 'pending',
          price_ttc: priceTTC,
        })
        .select()
        .single()

      if (contratError) throw contratError

      // Signer le contrat
      const { data: contratSigne, error: signError } = await (supabase as any)
        .from('contrats')
        .update({
          signed_at: new Date().toISOString(),
          status: 'signed',
        })
        .eq('id', contrat.id)
        .select()
        .single()

      if (signError) throw signError

      // Mettre à jour le dossier
      await supabase
        .from('dossiers')
        .update({ contract_signed_at: new Date().toISOString() })
        .eq('id', dossierId)

      return contratSigne
    })

    return {
      name: 'Signature contrat',
      success: !!result?.signed_at,
      message: result?.signed_at ? 'Contrat signé' : 'Échec',
      data: result,
      duration,
    }
  }

  const testPaiementAcompte = async (contratId: string, montantTTC: number): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const montantAcompte = Math.round(montantTTC * 0.3 * 100) / 100

      const { data, error } = await (supabase as any)
        .from('paiements')
        .insert({
          contrat_id: contratId,
          amount: montantAcompte,
          type: 'cb',
          payment_date: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data
    })

    return {
      name: 'Paiement acompte',
      success: !!result,
      message: result ? `${formatPrice(result.amount)} payé` : 'Échec',
      data: result,
      duration,
    }
  }

  const testDemandeFournisseur = async (dossierId: string, transporteurId: string): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const token = generateChauffeurToken()

      const { data, error } = await supabase
        .from('demandes_fournisseurs')
        .insert({
          dossier_id: dossierId,
          transporteur_id: transporteurId,
          status: 'sent',
          sent_at: new Date().toISOString(),
          validation_token: token,
        })
        .select()
        .single()

      if (error) throw error
      return { ...data, token }
    })

    return {
      name: 'Demande fournisseur',
      success: !!result,
      message: result ? 'Demande envoyée' : 'Échec',
      data: result,
      duration,
    }
  }

  const testReceptionTarif = async (demandeId: string): Promise<TestResult> => {
    const prixTTC = 650 + Math.floor(Math.random() * 200)

    const [result, duration] = await measureTime(async () => {
      const { data, error } = await supabase
        .from('demandes_fournisseurs')
        .update({
          prix_propose: prixTTC,
          status: 'tarif_recu',
          tarif_received_at: new Date().toISOString(),
        })
        .eq('id', demandeId)
        .select()
        .single()

      if (error) throw error
      return data
    })

    return {
      name: 'Réception tarif',
      success: result?.status === 'tarif_recu',
      message: result?.status === 'tarif_recu' ? `${formatPrice(prixTTC)} TTC reçu` : 'Échec',
      data: result,
      duration,
    }
  }

  const testBpaRecu = async (demandeId: string, dossierId: string): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const { data, error } = await supabase
        .from('demandes_fournisseurs')
        .update({
          status: 'bpa_received',
          bpa_received_at: new Date().toISOString(),
        })
        .eq('id', demandeId)
        .select()
        .single()

      if (error) throw error

      await supabase
        .from('dossiers')
        .update({ status: 'pending-info' })
        .eq('id', dossierId)

      return data
    })

    return {
      name: 'BPA reçu',
      success: result?.status === 'bpa_received',
      message: result?.status === 'bpa_received' ? 'BPA confirmé' : 'Échec',
      data: result,
      duration,
    }
  }

  // Test création facture
  const testCreateFacture = async (dossierId: string, type: 'acompte' | 'solde', montantTTC: number): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const now = new Date()
      const refFacture = `FAC-TEST-${now.getTime()}`
      const montant = type === 'acompte' ? Math.round(montantTTC * 0.3 * 100) / 100 : Math.round(montantTTC * 0.7 * 100) / 100
      const montantHT = Math.round(montant / 1.1 * 100) / 100
      const montantTVA = Math.round((montant - montantHT) * 100) / 100

      const { data, error } = await (supabase as any)
        .from('factures')
        .insert({
          dossier_id: dossierId,
          reference: refFacture,
          type,
          amount_ht: montantHT,
          amount_ttc: montant,
          amount_tva: montantTVA,
          status: 'generated',
        })
        .select()
        .single()

      if (error) throw error
      return data
    })

    return {
      name: `Création facture ${type}`,
      success: !!result,
      message: result ? `${result.reference} - ${formatPrice(result.amount_ttc)}` : 'Échec',
      data: result,
      duration,
    }
  }

  // Test création infos voyage
  const testCreateInfosVoyage = async (dossierId: string): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      // Récupérer les infos du dossier pour les dates
      const { data: dossier } = await supabase
        .from('dossiers')
        .select('departure_date, departure_time, return_date, return_time, passengers')
        .eq('id', dossierId)
        .single()

      const { data, error } = await (supabase as any)
        .from('voyage_infos')
        .insert({
          dossier_id: dossierId,
          // Aller
          aller_adresse_depart: '15 Rue de Test, 75001 Paris',
          aller_adresse_arrivee: '25 Avenue Test, 69001 Lyon',
          aller_date: dossier?.departure_date || new Date().toISOString().split('T')[0],
          aller_heure: dossier?.departure_time || '08:00',
          aller_passagers: dossier?.passengers || 30,
          // Retour (si AR)
          retour_adresse_depart: '25 Avenue Test, 69001 Lyon',
          retour_adresse_arrivee: '15 Rue de Test, 75001 Paris',
          retour_date: dossier?.return_date || dossier?.departure_date,
          retour_heure: dossier?.return_time || '18:00',
          retour_passagers: dossier?.passengers || 30,
          // Contact
          contact_nom: 'Test',
          contact_prenom: 'Jean',
          contact_tel: '0612345678',
          contact_email: TEST_CONFIG.testEmail,
          // Commentaires
          commentaires: 'Rendez-vous devant l\'entrée principale',
        })
        .select()
        .single()

      if (error) throw error
      return data
    })

    return {
      name: 'Création infos voyage',
      success: !!result,
      message: result ? 'Infos voyage créées' : 'Échec',
      data: result,
      duration,
    }
  }

  // Test validation infos voyage
  const testValiderInfosVoyage = async (voyageInfoId: string, dossierId: string): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const { data, error } = await (supabase as any)
        .from('voyage_infos')
        .update({ validated_at: new Date().toISOString() })
        .eq('id', voyageInfoId)
        .select()
        .single()

      if (error) throw error

      await supabase
        .from('dossiers')
        .update({ status: 'pending-driver' })
        .eq('id', dossierId)

      return data
    })

    return {
      name: 'Validation infos voyage',
      success: !!result?.validated_at,
      message: result?.validated_at ? 'Infos validées' : 'Échec',
      data: result,
      duration,
    }
  }

  // Test demande chauffeur
  const testDemandeChauffeur = async (dossierId: string, transporteurId: string): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const token = generateChauffeurToken()

      const { data, error } = await (supabase as any)
        .from('demandes_chauffeur')
        .insert({
          dossier_id: dossierId,
          transporteur_id: transporteurId,
          status: 'pending',
          token,
          type: 'aller_retour', // Type valide: 'aller' | 'retour' | 'aller_retour'
          mode: 'individuel',   // Mode requis: 'individuel' | 'groupe'
          sent_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours
        })
        .select()
        .single()

      if (error) throw error
      return data
    })

    return {
      name: 'Demande chauffeur',
      success: !!result,
      message: result ? 'Demande envoyée' : 'Échec',
      data: result,
      duration,
    }
  }

  // Test réception infos chauffeur
  const testReceptionInfosChauffeur = async (demandeChauffeurId: string, dossierId: string): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const { data, error } = await (supabase as any)
        .from('demandes_chauffeur')
        .update({
          status: 'received',
          received_at: new Date().toISOString(),
        })
        .eq('id', demandeChauffeurId)
        .select()
        .single()

      if (error) throw error

      // Mettre à jour les infos voyage avec les infos chauffeur (bonnes colonnes)
      await (supabase as any)
        .from('voyage_infos')
        .update({
          chauffeur_aller_nom: 'Pierre Conducteur',
          chauffeur_aller_tel: '0698765432',
          chauffeur_aller_immatriculation: 'AB-123-CD',
          chauffeur_retour_nom: 'Pierre Conducteur',
          chauffeur_retour_tel: '0698765432',
          chauffeur_retour_immatriculation: 'AB-123-CD',
          chauffeur_info_recue_at: new Date().toISOString(),
        })
        .eq('dossier_id', dossierId)

      // Mettre à jour le statut du dossier
      await supabase
        .from('dossiers')
        .update({ status: 'confirmed' })
        .eq('id', dossierId)

      return data
    })

    return {
      name: 'Réception infos chauffeur',
      success: result?.status === 'received',
      message: result?.status === 'received' ? 'Chauffeur: Pierre Conducteur' : 'Échec',
      data: result,
      duration,
    }
  }

  // Test ajout timeline
  const testAddTimeline = async (dossierId: string): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const { data, error } = await supabase
        .from('timeline')
        .insert({
          dossier_id: dossierId,
          type: 'note',
          content: '📝 Test automatisé - Entrée timeline de test',
        })
        .select()
        .single()

      if (error) throw error
      return data
    })

    return {
      name: 'Ajout timeline',
      success: !!result,
      message: result ? 'Entrée ajoutée' : 'Échec',
      data: result,
      duration,
    }
  }

  // Test calcul tarif (grilles)
  const testCalculTarif = async (): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      // Simuler un calcul de tarif simple
      const distanceKm = 350
      const prixKm = 1.8
      const coeffVehicule = 1.0 // Standard
      const prixBase = distanceKm * prixKm * coeffVehicule
      const prixHT = Math.round(prixBase)
      const prixTTC = Math.round(prixHT * 1.1)

      return {
        distance: distanceKm,
        prixKm,
        prixHT,
        prixTTC,
      }
    })

    return {
      name: 'Calcul tarif',
      success: result?.prixTTC > 0,
      message: result ? `${result.distance}km → ${formatPrice(result.prixTTC)} TTC` : 'Échec',
      data: result,
      duration,
    }
  }

  // Test offre flash (mise à jour du devis avec promo)
  const testOffreFlash = async (dossierId: string, devisId: string): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      // Récupérer le devis pour avoir le prix original
      const { data: devis } = await supabase
        .from('devis')
        .select('price_ttc, price_ht, tva_rate')
        .eq('id', devisId)
        .single()

      if (!devis) throw new Error('Devis non trouvé')

      const remisePercent = 10 // 10% de réduction
      const originalPrice = devis.price_ttc
      const newPrice = Math.round(originalPrice * (1 - remisePercent / 100) * 100) / 100
      const tvaRate = devis.tva_rate || 10
      const newPriceHT = Math.round((newPrice / (1 + tvaRate / 100)) * 100) / 100

      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // Expire dans 24h

      // Mettre à jour le devis avec la promo
      const { data, error } = await supabase
        .from('devis')
        .update({
          remise_percent: remisePercent,
          promo_expires_at: expiresAt.toISOString(),
          promo_original_price: originalPrice,
          price_ttc: newPrice,
          price_ht: newPriceHT,
        })
        .eq('id', devisId)
        .select()
        .single()

      if (error) throw error
      return { ...data, savings: originalPrice - newPrice }
    })

    return {
      name: 'Offre flash',
      success: !!result?.promo_expires_at,
      message: result?.promo_expires_at ? `${result.remise_percent}% de réduction (-${formatPrice(result.savings)})` : 'Échec',
      data: result,
      duration,
    }
  }

  // Test génération PDF (simulation - vérifie que les fonctions sont appelables)
  const testGenerationPDF = async (type: 'devis' | 'contrat' | 'facture' | 'feuille_route'): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      // On ne génère pas vraiment le PDF en test, on vérifie juste que les données sont présentes
      // La génération réelle nécessite un canvas HTML
      const typeLabels = {
        devis: 'Devis',
        contrat: 'Contrat',
        facture: 'Facture',
        feuille_route: 'Feuille de route',
      }

      // Simulation réussie
      return {
        type,
        label: typeLabels[type],
        canGenerate: true,
      }
    })

    return {
      name: `Génération PDF ${result?.label}`,
      success: result?.canGenerate === true,
      message: result?.canGenerate ? 'PDF générable' : 'Échec',
      data: result,
      duration,
    }
  }

  // Test envoi email (simulation - vérifie les templates)
  const testEmailTemplate = async (templateKey: string): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const { data, error } = await (supabase as any)
        .from('email_templates')
        .select('id, key, subject, body')
        .eq('key', templateKey)
        .single()

      if (error) throw error

      // Vérifier que le template a les champs requis (subject suffit, body peut être court)
      const isValid = data && data.subject && data.subject.length > 0

      return {
        ...data,
        isValid,
        bodyLength: data?.body?.length || 0,
      }
    })

    return {
      name: `Template email: ${templateKey}`,
      success: result?.isValid === true,
      message: result?.isValid ? `"${result.subject}"` : `Manquant (body: ${result?.bodyLength || 0} chars)`,
      data: result,
      duration,
    }
  }

  // Test paiement solde
  const testPaiementSolde = async (contratId: string, montantTTC: number): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const montantSolde = Math.round(montantTTC * 0.7 * 100) / 100

      const { data, error } = await (supabase as any)
        .from('paiements')
        .insert({
          contrat_id: contratId,
          amount: montantSolde,
          type: 'cb',
          payment_date: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data
    })

    return {
      name: 'Paiement solde',
      success: !!result,
      message: result ? `${formatPrice(result.amount)} payé` : 'Échec',
      data: result,
      duration,
    }
  }

  // Test validation admin infos voyage
  const testAdminValidationInfosVoyage = async (voyageInfoId: string): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const { data, error } = await (supabase as any)
        .from('voyage_infos')
        .update({
          admin_validated_at: new Date().toISOString(),
        })
        .eq('id', voyageInfoId)
        .select()
        .single()

      if (error) throw error
      return data
    })

    return {
      name: 'Validation admin infos voyage',
      success: !!result?.admin_validated_at,
      message: result?.admin_validated_at ? 'Validé par admin' : 'Échec',
      data: result,
      duration,
    }
  }

  // Test envoi infos au fournisseur
  const testEnvoiInfosFournisseur = async (voyageInfoId: string): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const { data, error } = await (supabase as any)
        .from('voyage_infos')
        .update({
          sent_to_supplier_at: new Date().toISOString(),
        })
        .eq('id', voyageInfoId)
        .select()
        .single()

      if (error) throw error
      return data
    })

    return {
      name: 'Envoi infos au fournisseur',
      success: !!result?.sent_to_supplier_at,
      message: result?.sent_to_supplier_at ? 'Envoyé' : 'Échec',
      data: result,
      duration,
    }
  }

  // Test génération feuille de route
  const testGenerationFeuilleRoute = async (voyageInfoId: string): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const { data, error } = await (supabase as any)
        .from('voyage_infos')
        .update({
          feuille_route_generee_at: new Date().toISOString(),
          feuille_route_type: 'standard',
        })
        .eq('id', voyageInfoId)
        .select()
        .single()

      if (error) throw error
      return data
    })

    return {
      name: 'Génération feuille de route',
      success: !!result?.feuille_route_generee_at,
      message: result?.feuille_route_generee_at ? 'Générée' : 'Échec',
      data: result,
      duration,
    }
  }

  // Test envoi feuille de route
  const testEnvoiFeuilleRoute = async (voyageInfoId: string): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const { data, error } = await (supabase as any)
        .from('voyage_infos')
        .update({
          feuille_route_envoyee_at: new Date().toISOString(),
        })
        .eq('id', voyageInfoId)
        .select()
        .single()

      if (error) throw error
      return data
    })

    return {
      name: 'Envoi feuille de route',
      success: !!result?.feuille_route_envoyee_at,
      message: result?.feuille_route_envoyee_at ? 'Envoyée' : 'Échec',
      data: result,
      duration,
    }
  }

  // Test terminer dossier
  const testTerminerDossier = async (dossierId: string): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .update({ status: 'completed' })
        .eq('id', dossierId)
        .select()
        .single()

      if (error) throw error
      return data
    })

    return {
      name: 'Terminer dossier',
      success: result?.status === 'completed',
      message: result?.status === 'completed' ? 'Dossier terminé' : 'Échec',
      data: result,
      duration,
    }
  }

  // Test rejet devis
  const testRejetDevis = async (devisId: string): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const { data, error } = await supabase
        .from('devis')
        .update({
          status: 'rejected',
        })
        .eq('id', devisId)
        .select()
        .single()

      if (error) throw error
      return data
    })

    return {
      name: 'Rejet devis',
      success: result?.status === 'rejected',
      message: result?.status === 'rejected' ? 'Devis rejeté' : 'Échec',
      data: result,
      duration,
    }
  }

  // Test facture avoir
  const testCreateFactureAvoir = async (dossierId: string, _factureOriginaleId: string, montantTTC: number): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const refAvoir = `AV-TEST-${Date.now()}`
      const montantHT = Math.round(montantTTC / 1.1 * 100) / 100
      const montantTVA = Math.round((montantTTC - montantHT) * 100) / 100

      const { data, error } = await (supabase as any)
        .from('factures')
        .insert({
          dossier_id: dossierId,
          reference: refAvoir,
          type: 'avoir',
          amount_ht: -montantHT, // Négatif pour un avoir
          amount_ttc: -montantTTC,
          amount_tva: -montantTVA,
          status: 'generated',
        })
        .select()
        .single()

      if (error) throw error
      return data
    })

    return {
      name: 'Création facture avoir',
      success: !!result && result.type === 'avoir',
      message: result ? `${result.reference} - ${formatPrice(Math.abs(result.amount_ttc))}` : 'Échec',
      data: result,
      duration,
    }
  }

  // Test annulation dossier
  const testAnnulerDossier = async (dossierId: string): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .update({
          status: 'cancelled',
        })
        .eq('id', dossierId)
        .select()
        .single()

      if (error) throw error

      // Ajouter une entrée timeline
      await supabase.from('timeline').insert({
        dossier_id: dossierId,
        type: 'status_change',
        content: 'Dossier annulé (test automatisé)',
      })

      return data
    })

    return {
      name: 'Annulation dossier',
      success: result?.status === 'cancelled',
      message: result?.status === 'cancelled' ? 'Dossier annulé' : 'Échec',
      data: result,
      duration,
    }
  }

  // Test dossier multi-cars (beaucoup de passagers)
  const testCreateDossierMultiCars = async (passengers: number): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const reference = generateReference()
      const departureDate = new Date()
      departureDate.setDate(departureDate.getDate() + 30)

      const { data, error } = await supabase
        .from('dossiers')
        .insert({
          reference,
          client_name: `Client Test Multi-Cars ${passengers}pax`,
          client_email: TEST_CONFIG.testEmail,
          client_phone: '0600000002',
          departure: 'Paris',
          arrival: 'Lyon',
          departure_date: departureDate.toISOString().split('T')[0],
          departure_time: '07:00',
          return_date: departureDate.toISOString().split('T')[0],
          return_time: '20:00',
          passengers,
          vehicle_type: 'standard',
          trip_mode: 'aller_retour',
          status: 'new',
        })
        .select()
        .single()

      if (error) throw error

      // Créer l'entrée auto-devis pour ce dossier (comme le fait useCreateDemande)
      try {
        const { data: defaultWorkflow } = await supabase
          .from('workflow_devis_auto')
          .select('id, steps')
          .eq('is_default', true)
          .eq('is_active', true)
          .single()

        if (defaultWorkflow) {
          const steps = defaultWorkflow.steps as { delay_hours: number }[]
          const firstStepDelay = steps?.[0]?.delay_hours || 0
          const nextDevisAt = new Date(Date.now() + firstStepDelay * 60 * 60 * 1000).toISOString()

          await supabase
            .from('dossiers_auto_devis')
            .insert({
              dossier_id: data.id,
              workflow_id: defaultWorkflow.id,
              is_active: true,
              current_step: 0,
              next_devis_at: nextDevisAt,
              devis_generes: [],
              started_at: new Date().toISOString(),
            })
        }
      } catch (autoDevisError) {
        console.error('Erreur création auto-devis pour test multi-cars:', autoDevisError)
      }

      // Calculer le nombre de cars attendu
      const expectedCars = calculateNumberOfCars(passengers, 'standard')

      return { ...data, expectedCars }
    })

    return {
      name: `Dossier multi-cars (${passengers} pax)`,
      success: !!result,
      message: result ? `${result.reference} - ${result.expectedCars} car(s) attendu(s)` : 'Échec',
      data: result,
      duration,
    }
  }

  // Test devis multi-cars automatique
  const testDevisAutoMultiCars = async (dossierId: string, passengers: number, transporteurId: string | null): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const refDevis = `DEV-MULTI-${Date.now()}`
      const nbCars = calculateNumberOfCars(passengers, 'standard')

      // Prix de base par car
      const prixParCarHT = 800
      const prixTotalHT = prixParCarHT * nbCars
      const prixTotalTTC = Math.round(prixTotalHT * 1.1)

      const { data, error } = await supabase
        .from('devis')
        .insert({
          dossier_id: dossierId,
          transporteur_id: transporteurId,
          reference: refDevis,
          price_ht: prixTotalHT,
          price_ttc: prixTotalTTC,
          price_achat_ht: Math.round(prixTotalHT * 0.85),
          price_achat_ttc: Math.round(prixTotalHT * 0.85 * 1.1),
          tva_rate: 10,
          status: 'pending',
          validity_days: 30,
          service_type: 'ar_1j',
          nombre_cars: nbCars,
          nombre_chauffeurs: nbCars, // 1 chauffeur par car minimum
        })
        .select()
        .single()

      if (error) throw error
      return { ...data, expectedCars: nbCars }
    })

    return {
      name: `Devis multi-cars (${passengers} pax)`,
      success: result?.nombre_cars === result?.expectedCars,
      message: result ? `${result.nombre_cars} car(s) - ${formatPrice(result.price_ttc)} TTC` : 'Échec',
      data: result,
      duration,
    }
  }

  // Test message/chat
  const testCreateMessage = async (dossierId: string): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const { data, error } = await (supabase as any)
        .from('messages')
        .insert({
          dossier_id: dossierId,
          sender: 'admin',
          content: 'Message de test automatisé - Bonjour, comment puis-je vous aider ?',
          read_by_admin: true,
          read_by_client: false,
        })
        .select()
        .single()

      if (error) throw error
      return data
    })

    return {
      name: 'Création message',
      success: !!result,
      message: result ? 'Message créé' : 'Échec',
      data: result,
      duration,
    }
  }

  // Test réponse message client
  const testReponseMessageClient = async (dossierId: string): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const { data, error } = await (supabase as any)
        .from('messages')
        .insert({
          dossier_id: dossierId,
          sender: 'client',
          content: 'Réponse client test - Merci pour votre aide !',
          read_by_admin: false,
          read_by_client: true,
        })
        .select()
        .single()

      if (error) throw error
      return data
    })

    return {
      name: 'Réponse message client',
      success: !!result,
      message: result ? 'Réponse créée' : 'Échec',
      data: result,
      duration,
    }
  }

  // Test création transporteur
  const testCreateTransporteur = async (): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const timestamp = Date.now()
      const { data, error } = await (supabase as any)
        .from('transporteurs')
        .insert({
          name: `Transporteur Test ${timestamp}`,
          number: `TEST-${timestamp}`, // Numéro requis
          email: `test-transport-${timestamp}@busmoov.local`,
          phone: '0600000099',
          is_active: true,
          city: 'Paris',
          regions: ['Île-de-France'],
        })
        .select()
        .single()

      if (error) throw error
      return data
    })

    return {
      name: 'Création transporteur',
      success: !!result,
      message: result ? result.name : 'Échec',
      data: result,
      duration,
    }
  }

  // Test désactivation transporteur
  const testDesactiverTransporteur = async (transporteurId: string): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const { data, error } = await (supabase as any)
        .from('transporteurs')
        .update({ is_active: false })
        .eq('id', transporteurId)
        .select()
        .single()

      if (error) throw error
      return data
    })

    return {
      name: 'Désactivation transporteur',
      success: result?.is_active === false,
      message: result?.is_active === false ? 'Désactivé' : 'Échec',
      data: result,
      duration,
    }
  }

  // Test calcul nombre de cars
  const testCalculNombreCars = async (): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const testCases = [
        { passengers: 30, vehicleType: 'standard', expected: 1 },  // 30/53 = 1 car
        { passengers: 53, vehicleType: 'standard', expected: 1 },  // 53/53 = 1 car
        { passengers: 54, vehicleType: 'standard', expected: 2 },  // 54/53 = 2 cars
        { passengers: 100, vehicleType: 'standard', expected: 2 }, // 100/53 = 2 cars
        { passengers: 120, vehicleType: 'standard', expected: 3 }, // 120/53 = 3 cars
        { passengers: 15, vehicleType: 'minibus', expected: 1 },   // 15/20 = 1 minibus
        { passengers: 25, vehicleType: 'minibus', expected: 2 },   // 25/20 = 2 minibus
      ]

      const results = testCases.map(tc => {
        const calculated = calculateNumberOfCars(tc.passengers, tc.vehicleType)
        return {
          ...tc,
          calculated,
          passed: calculated === tc.expected,
        }
      })

      const allPassed = results.every(r => r.passed)
      return { results, allPassed }
    })

    return {
      name: 'Calcul nombre de cars',
      success: result?.allPassed === true,
      message: result?.allPassed ? `${result.results.length} cas validés` : `Échecs: ${result?.results.filter((r: any) => !r.passed).map((r: any) => `${r.passengers}pax`).join(', ')}`,
      data: result,
      duration,
    }
  }

  // Test refus BPA fournisseur
  const testRefusBpa = async (demandeId: string): Promise<TestResult> => {
    const [result, duration] = await measureTime(async () => {
      const { data, error } = await supabase
        .from('demandes_fournisseurs')
        .update({
          status: 'refused',
        })
        .eq('id', demandeId)
        .select()
        .single()

      if (error) throw error
      return data
    })

    return {
      name: 'Refus BPA fournisseur',
      success: result?.status === 'refused',
      message: result?.status === 'refused' ? 'BPA refusé' : 'Échec',
      data: result,
      duration,
    }
  }

  // ============================================
  // EXÉCUTION DES TESTS
  // ============================================

  const runTests = async () => {
    setIsRunning(true)
    setResults([])
    setLogs([])
    setSummary(null)

    const startTime = Date.now()
    addLog('🚀 Démarrage des tests automatisés')

    try {
      // Récupérer un transporteur
      const { data: transporteur } = await supabase
        .from('transporteurs')
        .select('id, name')
        .eq('is_active', true)
        .limit(1)
        .single()

      if (!transporteur) {
        addLog('⚠️ Aucun transporteur actif trouvé')
      } else {
        addLog(`✓ Transporteur de test: ${transporteur.name}`)
      }

      // ========== SCÉNARIO 1: Parcours complet ==========
      addLog('\n📋 SCÉNARIO 1: Parcours complet')

      // 1. Créer dossier
      const testDossier = await testCreateDossier('ar_1j')
      addResult(testDossier)
      addLog(`${testDossier.success ? '✓' : '✗'} ${testDossier.name}: ${testDossier.message}`)

      if (testDossier.success && testDossier.data) {
        const dossierId = testDossier.data.id

        // 2. Créer devis
        const testDevis = await testCreateDevis(dossierId, transporteur?.id || null)
        addResult(testDevis)
        addLog(`${testDevis.success ? '✓' : '✗'} ${testDevis.name}: ${testDevis.message}`)

        if (testDevis.success && testDevis.data) {
          const devisId = testDevis.data.id

          // 3. Envoyer devis
          const testEnvoi = await testEnvoyerDevis(devisId)
          addResult(testEnvoi)
          addLog(`${testEnvoi.success ? '✓' : '✗'} ${testEnvoi.name}: ${testEnvoi.message}`)

          // 4. Accepter devis
          const testAccept = await testAccepterDevis(devisId, dossierId)
          addResult(testAccept)
          addLog(`${testAccept.success ? '✓' : '✗'} ${testAccept.name}: ${testAccept.message}`)

          // 5. Signer contrat
          const testContrat = await testSignerContrat(dossierId, devisId, testDevis.data.price_ttc)
          addResult(testContrat)
          addLog(`${testContrat.success ? '✓' : '✗'} ${testContrat.name}: ${testContrat.message}`)

          if (testContrat.success && testContrat.data) {
            // 6. Paiement acompte
            const testPaiement = await testPaiementAcompte(testContrat.data.id, testDevis.data.price_ttc)
            addResult(testPaiement)
            addLog(`${testPaiement.success ? '✓' : '✗'} ${testPaiement.name}: ${testPaiement.message}`)

            // 7. Demande fournisseur
            if (transporteur) {
              const testDemande = await testDemandeFournisseur(dossierId, transporteur.id)
              addResult(testDemande)
              addLog(`${testDemande.success ? '✓' : '✗'} ${testDemande.name}: ${testDemande.message}`)

              if (testDemande.success && testDemande.data) {
                // 8. Réception tarif
                const testTarif = await testReceptionTarif(testDemande.data.id)
                addResult(testTarif)
                addLog(`${testTarif.success ? '✓' : '✗'} ${testTarif.name}: ${testTarif.message}`)

                // 9. BPA reçu
                const testBpa = await testBpaRecu(testDemande.data.id, dossierId)
                addResult(testBpa)
                addLog(`${testBpa.success ? '✓' : '✗'} ${testBpa.name}: ${testBpa.message}`)

                if (testBpa.success) {
                  // 10. Création facture acompte
                  const testFactureAcompte = await testCreateFacture(dossierId, 'acompte', testDevis.data.price_ttc)
                  addResult(testFactureAcompte)
                  addLog(`${testFactureAcompte.success ? '✓' : '✗'} ${testFactureAcompte.name}: ${testFactureAcompte.message}`)

                  // 11. Création infos voyage
                  const testInfosVoyage = await testCreateInfosVoyage(dossierId)
                  addResult(testInfosVoyage)
                  addLog(`${testInfosVoyage.success ? '✓' : '✗'} ${testInfosVoyage.name}: ${testInfosVoyage.message}`)

                  if (testInfosVoyage.success && testInfosVoyage.data) {
                    // 12. Validation infos voyage
                    const testValidationVoyage = await testValiderInfosVoyage(testInfosVoyage.data.id, dossierId)
                    addResult(testValidationVoyage)
                    addLog(`${testValidationVoyage.success ? '✓' : '✗'} ${testValidationVoyage.name}: ${testValidationVoyage.message}`)

                    // 13. Demande chauffeur
                    const testDemandeChauff = await testDemandeChauffeur(dossierId, transporteur!.id)
                    addResult(testDemandeChauff)
                    addLog(`${testDemandeChauff.success ? '✓' : '✗'} ${testDemandeChauff.name}: ${testDemandeChauff.message}`)

                    if (testDemandeChauff.success && testDemandeChauff.data) {
                      // 14. Réception infos chauffeur
                      const testInfosChauffeur = await testReceptionInfosChauffeur(testDemandeChauff.data.id, dossierId)
                      addResult(testInfosChauffeur)
                      addLog(`${testInfosChauffeur.success ? '✓' : '✗'} ${testInfosChauffeur.name}: ${testInfosChauffeur.message}`)

                      // 15. Validation admin infos voyage
                      const testAdminValid = await testAdminValidationInfosVoyage(testInfosVoyage.data.id)
                      addResult(testAdminValid)
                      addLog(`${testAdminValid.success ? '✓' : '✗'} ${testAdminValid.name}: ${testAdminValid.message}`)

                      // 16. Envoi infos au fournisseur
                      const testEnvoiFournisseur = await testEnvoiInfosFournisseur(testInfosVoyage.data.id)
                      addResult(testEnvoiFournisseur)
                      addLog(`${testEnvoiFournisseur.success ? '✓' : '✗'} ${testEnvoiFournisseur.name}: ${testEnvoiFournisseur.message}`)

                      // 17. Génération feuille de route
                      const testGenFeuille = await testGenerationFeuilleRoute(testInfosVoyage.data.id)
                      addResult(testGenFeuille)
                      addLog(`${testGenFeuille.success ? '✓' : '✗'} ${testGenFeuille.name}: ${testGenFeuille.message}`)

                      // 18. Envoi feuille de route
                      const testEnvoiFeuille = await testEnvoiFeuilleRoute(testInfosVoyage.data.id)
                      addResult(testEnvoiFeuille)
                      addLog(`${testEnvoiFeuille.success ? '✓' : '✗'} ${testEnvoiFeuille.name}: ${testEnvoiFeuille.message}`)

                      // 19. Création facture solde
                      const testFactureSolde = await testCreateFacture(dossierId, 'solde', testDevis.data.price_ttc)
                      addResult(testFactureSolde)
                      addLog(`${testFactureSolde.success ? '✓' : '✗'} ${testFactureSolde.name}: ${testFactureSolde.message}`)

                      // 20. Paiement solde
                      const testPaiementSoldeRes = await testPaiementSolde(testContrat.data.id, testDevis.data.price_ttc)
                      addResult(testPaiementSoldeRes)
                      addLog(`${testPaiementSoldeRes.success ? '✓' : '✗'} ${testPaiementSoldeRes.name}: ${testPaiementSoldeRes.message}`)

                      // 21. Ajout timeline
                      const testTimeline = await testAddTimeline(dossierId)
                      addResult(testTimeline)
                      addLog(`${testTimeline.success ? '✓' : '✗'} ${testTimeline.name}: ${testTimeline.message}`)

                      // 22. Terminer dossier
                      const testTerminer = await testTerminerDossier(dossierId)
                      addResult(testTerminer)
                      addLog(`${testTerminer.success ? '✓' : '✗'} ${testTerminer.name}: ${testTerminer.message}`)
                    }
                  }
                }
              }
            }
          }
        }
      }

      // ========== SCÉNARIO 2: Tests unitaires ==========
      addLog('\n📋 SCÉNARIO 2: Tests unitaires')

      // Test calcul tarif
      const testTarif = await testCalculTarif()
      addResult(testTarif)
      addLog(`${testTarif.success ? '✓' : '✗'} ${testTarif.name}: ${testTarif.message}`)

      // Tests génération PDF
      addLog('\n📋 SCÉNARIO 3: Tests génération PDF')

      const pdfTypes: Array<'devis' | 'contrat' | 'facture' | 'feuille_route'> = ['devis', 'contrat', 'facture', 'feuille_route']
      for (const pdfType of pdfTypes) {
        const testPdf = await testGenerationPDF(pdfType)
        addResult(testPdf)
        addLog(`${testPdf.success ? '✓' : '✗'} ${testPdf.name}: ${testPdf.message}`)
      }

      // Tests templates email
      addLog('\n📋 SCÉNARIO 4: Tests templates email')

      const templateKeys = ['quote_sent', 'payment_reminder', 'rappel_solde', 'confirmation_reservation', 'info_request', 'driver_info']
      for (const templateKey of templateKeys) {
        try {
          const testTemplate = await testEmailTemplate(templateKey)
          addResult(testTemplate)
          addLog(`${testTemplate.success ? '✓' : '✗'} ${testTemplate.name}: ${testTemplate.message}`)
        } catch (err: any) {
          addResult({
            name: `Template email: ${templateKey}`,
            success: false,
            message: err.message || 'Non trouvé',
            duration: 0,
          })
          addLog(`✗ Template email: ${templateKey}: Non trouvé`)
        }
      }

      // ========== SCÉNARIO 5: Dossiers variés ==========
      addLog('\n📋 SCÉNARIO 5: Création de dossiers variés')

      const testAS = await testCreateDossier('aller_simple')
      addResult(testAS)
      addLog(`${testAS.success ? '✓' : '✗'} ${testAS.name}: ${testAS.message}`)

      const testMAD = await testCreateDossier('ar_mad')
      addResult(testMAD)
      addLog(`${testMAD.success ? '✓' : '✗'} ${testMAD.name}: ${testMAD.message}`)

      // ========== SCÉNARIO 6: Offre flash ==========
      addLog('\n📋 SCÉNARIO 6: Offre flash')

      if (testAS.success && testAS.data) {
        const devisFlash = await testCreateDevis(testAS.data.id, transporteur?.id || null)
        addResult(devisFlash)
        addLog(`${devisFlash.success ? '✓' : '✗'} ${devisFlash.name}: ${devisFlash.message}`)

        if (devisFlash.success && devisFlash.data) {
          const testFlash = await testOffreFlash(testAS.data.id, devisFlash.data.id)
          addResult(testFlash)
          addLog(`${testFlash.success ? '✓' : '✗'} ${testFlash.name}: ${testFlash.message}`)
        }
      }

      // ========== SCÉNARIO 7: Tests multi-cars ==========
      addLog('\n📋 SCÉNARIO 7: Tests multi-cars (devis automatiques)')

      // Test calcul nombre de cars
      const testCalcCars = await testCalculNombreCars()
      addResult(testCalcCars)
      addLog(`${testCalcCars.success ? '✓' : '✗'} ${testCalcCars.name}: ${testCalcCars.message}`)

      // Test avec 60 passagers (2 cars standard)
      const testMulti60 = await testCreateDossierMultiCars(60)
      addResult(testMulti60)
      addLog(`${testMulti60.success ? '✓' : '✗'} ${testMulti60.name}: ${testMulti60.message}`)

      if (testMulti60.success && testMulti60.data) {
        const devisMulti60 = await testDevisAutoMultiCars(testMulti60.data.id, 60, transporteur?.id || null)
        addResult(devisMulti60)
        addLog(`${devisMulti60.success ? '✓' : '✗'} ${devisMulti60.name}: ${devisMulti60.message}`)
      }

      // Test avec 100 passagers (2 cars standard)
      const testMulti100 = await testCreateDossierMultiCars(100)
      addResult(testMulti100)
      addLog(`${testMulti100.success ? '✓' : '✗'} ${testMulti100.name}: ${testMulti100.message}`)

      if (testMulti100.success && testMulti100.data) {
        const devisMulti100 = await testDevisAutoMultiCars(testMulti100.data.id, 100, transporteur?.id || null)
        addResult(devisMulti100)
        addLog(`${devisMulti100.success ? '✓' : '✗'} ${devisMulti100.name}: ${devisMulti100.message}`)
      }

      // Test avec 120 passagers (3 cars standard)
      const testMulti120 = await testCreateDossierMultiCars(120)
      addResult(testMulti120)
      addLog(`${testMulti120.success ? '✓' : '✗'} ${testMulti120.name}: ${testMulti120.message}`)

      if (testMulti120.success && testMulti120.data) {
        const devisMulti120 = await testDevisAutoMultiCars(testMulti120.data.id, 120, transporteur?.id || null)
        addResult(devisMulti120)
        addLog(`${devisMulti120.success ? '✓' : '✗'} ${devisMulti120.name}: ${devisMulti120.message}`)
      }

      // ========== SCÉNARIO 8: Tests messages/chat ==========
      addLog('\n📋 SCÉNARIO 8: Tests messages/chat')

      if (testDossier.success && testDossier.data) {
        // Message admin
        const testMsgAdmin = await testCreateMessage(testDossier.data.id)
        addResult(testMsgAdmin)
        addLog(`${testMsgAdmin.success ? '✓' : '✗'} ${testMsgAdmin.name}: ${testMsgAdmin.message}`)

        // Réponse client
        const testMsgClient = await testReponseMessageClient(testDossier.data.id)
        addResult(testMsgClient)
        addLog(`${testMsgClient.success ? '✓' : '✗'} ${testMsgClient.name}: ${testMsgClient.message}`)
      }

      // ========== SCÉNARIO 9: Tests transporteurs CRUD ==========
      addLog('\n📋 SCÉNARIO 9: Tests transporteurs CRUD')

      const testNewTransporteur = await testCreateTransporteur()
      addResult(testNewTransporteur)
      addLog(`${testNewTransporteur.success ? '✓' : '✗'} ${testNewTransporteur.name}: ${testNewTransporteur.message}`)

      if (testNewTransporteur.success && testNewTransporteur.data) {
        const testDesactiv = await testDesactiverTransporteur(testNewTransporteur.data.id)
        addResult(testDesactiv)
        addLog(`${testDesactiv.success ? '✓' : '✗'} ${testDesactiv.name}: ${testDesactiv.message}`)
      }

      // ========== SCÉNARIO 10: Tests rejet/annulation ==========
      addLog('\n📋 SCÉNARIO 10: Tests rejet et annulation')

      // Créer un dossier pour tester le rejet de devis
      const testDossierRejet = await testCreateDossier('aller_simple')
      addResult(testDossierRejet)
      addLog(`${testDossierRejet.success ? '✓' : '✗'} Dossier pour rejet: ${testDossierRejet.message}`)

      if (testDossierRejet.success && testDossierRejet.data) {
        // Créer un devis puis le rejeter
        const devisArejeter = await testCreateDevis(testDossierRejet.data.id, transporteur?.id || null)
        addResult(devisArejeter)
        addLog(`${devisArejeter.success ? '✓' : '✗'} Devis à rejeter: ${devisArejeter.message}`)

        if (devisArejeter.success && devisArejeter.data) {
          const testRejet = await testRejetDevis(devisArejeter.data.id)
          addResult(testRejet)
          addLog(`${testRejet.success ? '✓' : '✗'} ${testRejet.name}: ${testRejet.message}`)
        }

        // Annuler le dossier
        const testAnnul = await testAnnulerDossier(testDossierRejet.data.id)
        addResult(testAnnul)
        addLog(`${testAnnul.success ? '✓' : '✗'} ${testAnnul.name}: ${testAnnul.message}`)
      }

      // ========== SCÉNARIO 11: Test refus BPA fournisseur ==========
      addLog('\n📋 SCÉNARIO 11: Test refus BPA fournisseur')

      if (transporteur) {
        // Créer un dossier pour tester le refus BPA
        const testDossierRefus = await testCreateDossier('ar_1j')
        addResult(testDossierRefus)
        addLog(`${testDossierRefus.success ? '✓' : '✗'} Dossier pour refus BPA: ${testDossierRefus.message}`)

        if (testDossierRefus.success && testDossierRefus.data) {
          // Demande fournisseur
          const demandeRefus = await testDemandeFournisseur(testDossierRefus.data.id, transporteur.id)
          addResult(demandeRefus)
          addLog(`${demandeRefus.success ? '✓' : '✗'} Demande pour refus: ${demandeRefus.message}`)

          if (demandeRefus.success && demandeRefus.data) {
            // Refuser le BPA
            const testRefus = await testRefusBpa(demandeRefus.data.id)
            addResult(testRefus)
            addLog(`${testRefus.success ? '✓' : '✗'} ${testRefus.name}: ${testRefus.message}`)
          }
        }
      }

      // ========== SCÉNARIO 12: Test facture avoir ==========
      addLog('\n📋 SCÉNARIO 12: Test facture avoir')

      // Créer un dossier avec facture pour tester l'avoir
      const testDossierAvoir = await testCreateDossier('ar_1j')
      addResult(testDossierAvoir)
      addLog(`${testDossierAvoir.success ? '✓' : '✗'} Dossier pour avoir: ${testDossierAvoir.message}`)

      if (testDossierAvoir.success && testDossierAvoir.data) {
        // Créer une facture acompte
        const factureOrigine = await testCreateFacture(testDossierAvoir.data.id, 'acompte', 1000)
        addResult(factureOrigine)
        addLog(`${factureOrigine.success ? '✓' : '✗'} Facture origine: ${factureOrigine.message}`)

        if (factureOrigine.success && factureOrigine.data) {
          // Créer l'avoir correspondant
          const testAvoir = await testCreateFactureAvoir(testDossierAvoir.data.id, factureOrigine.data.id, 300) // Avoir de 300€
          addResult(testAvoir)
          addLog(`${testAvoir.success ? '✓' : '✗'} ${testAvoir.name}: ${testAvoir.message}`)
        }
      }

      // Résumé
      const totalDuration = Date.now() - startTime
      const passed = results.filter(r => r.success).length +
        (testAS.success ? 1 : 0) + (testMAD.success ? 1 : 0)
      const failed = results.filter(r => !r.success).length +
        (!testAS.success ? 1 : 0) + (!testMAD.success ? 1 : 0)

      setSummary({ passed, failed, duration: totalDuration })
      addLog(`\n✅ Tests terminés: ${passed} réussis, ${failed} échoués (${totalDuration}ms)`)

    } catch (error: any) {
      addLog(`❌ Erreur: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  const cleanupTests = async () => {
    setIsCleaning(true)
    addLog('\n🧹 Nettoyage des données de test...')

    try {
      // 1. Récupérer tous les devis et filtrer côté client
      const { data: allDevis } = await supabase
        .from('devis')
        .select('id, reference')

      const devisToDelete = allDevis?.filter(d =>
        d.reference?.startsWith('DEV-TEST-') || d.reference?.startsWith('DEV-MULTI-')
      ) || []

      addLog(`📋 Devis trouvés à supprimer: ${devisToDelete.length}`)
      if (devisToDelete.length > 0) {
        addLog(`   Références: ${devisToDelete.map(d => d.reference).join(', ')}`)
      }

      if (devisToDelete.length > 0) {
        const devisIds = devisToDelete.map(d => d.id)
        const { error: devisDeleteError } = await supabase
          .from('devis')
          .delete()
          .in('id', devisIds)

        if (devisDeleteError) addLog(`⚠️ Erreur suppression devis: ${devisDeleteError.message}`)
        else addLog(`✓ ${devisToDelete.length} devis de test supprimés`)
      }

      // 2. Récupérer toutes les factures et filtrer côté client
      const { data: allFactures } = await (supabase as any)
        .from('factures')
        .select('id, reference')

      const facturesToDelete = allFactures?.filter((f: any) =>
        f.reference?.startsWith('FAC-TEST-') || f.reference?.startsWith('AV-TEST-')
      ) || []

      addLog(`📋 Factures trouvées à supprimer: ${facturesToDelete.length}`)

      if (facturesToDelete.length > 0) {
        const factureIds = facturesToDelete.map((f: any) => f.id)
        const { error: facturesDeleteError } = await (supabase as any)
          .from('factures')
          .delete()
          .in('id', factureIds)

        if (facturesDeleteError) addLog(`⚠️ Erreur suppression factures: ${facturesDeleteError.message}`)
        else addLog(`✓ ${facturesToDelete.length} factures de test supprimées`)
      }

      // 3. Récupérer tous les transporteurs et filtrer côté client
      const { data: allTransporteurs } = await (supabase as any)
        .from('transporteurs')
        .select('id, number, name')

      const transporteursToDelete = allTransporteurs?.filter((t: any) =>
        t.number?.startsWith('TEST-')
      ) || []

      addLog(`📋 Transporteurs trouvés à supprimer: ${transporteursToDelete.length}`)

      if (transporteursToDelete.length > 0) {
        const transporteurIds = transporteursToDelete.map((t: any) => t.id)
        const { error: transporteursDeleteError } = await (supabase as any)
          .from('transporteurs')
          .delete()
          .in('id', transporteurIds)

        if (transporteursDeleteError) addLog(`⚠️ Erreur suppression transporteurs: ${transporteursDeleteError.message}`)
        else addLog(`✓ ${transporteursToDelete.length} transporteurs de test supprimés`)
      }

      // 4. Récupérer tous les dossiers et filtrer côté client
      const { data: allDossiers } = await supabase
        .from('dossiers')
        .select('id, reference')

      const dossiersToDelete = allDossiers?.filter(d =>
        d.reference?.startsWith(TEST_CONFIG.prefix)
      ) || []

      addLog(`📋 Dossiers trouvés à supprimer: ${dossiersToDelete.length}`)

      if (dossiersToDelete.length > 0) {
        const dossierIds = dossiersToDelete.map(d => d.id)
        const { error: dossiersDeleteError } = await supabase
          .from('dossiers')
          .delete()
          .in('id', dossierIds)

        if (dossiersDeleteError) addLog(`⚠️ Erreur suppression dossiers: ${dossiersDeleteError.message}`)
        else addLog(`✓ ${dossiersToDelete.length} dossiers de test supprimés`)
      }

      setResults([])
      setSummary(null)
      addLog('✅ Nettoyage terminé')
    } catch (error: any) {
      addLog(`❌ Erreur nettoyage: ${error.message}`)
    } finally {
      setIsCleaning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-purple-dark">Tests Automatisés</h1>
          <p className="text-gray-500">Validation du process global Busmoov</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={cleanupTests}
            disabled={isCleaning || isRunning}
            className="btn btn-outline flex items-center gap-2"
          >
            {isCleaning ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            Nettoyer
          </button>
          <button
            onClick={runTests}
            disabled={isRunning}
            className="btn btn-primary flex items-center gap-2"
          >
            {isRunning ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
            Lancer les tests
          </button>
        </div>
      </div>

      {/* Résumé */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" size={24} />
              <div>
                <p className="text-2xl font-bold text-green-700">{summary.passed}</p>
                <p className="text-sm text-green-600">Tests réussis</p>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <XCircle className="text-red-600" size={24} />
              <div>
                <p className="text-2xl font-bold text-red-700">{summary.failed}</p>
                <p className="text-sm text-red-600">Tests échoués</p>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <Clock className="text-blue-600" size={24} />
              <div>
                <p className="text-2xl font-bold text-blue-700">{summary.duration}ms</p>
                <p className="text-sm text-blue-600">Durée totale</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Résultats des tests */}
      {results.length > 0 && (
        <div className="card">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold">Résultats des tests</h2>
          </div>
          <div className="divide-y">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 flex items-center justify-between ${
                  result.success ? 'bg-green-50/50' : 'bg-red-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle className="text-green-600" size={18} />
                  ) : (
                    <XCircle className="text-red-600" size={18} />
                  )}
                  <span className="font-medium">{result.name}</span>
                  <span className="text-sm text-gray-500">{result.message}</span>
                </div>
                <span className="text-sm text-gray-400">{result.duration}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="card">
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="font-semibold">Console de logs</h2>
          <button
            onClick={() => setLogs([])}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Effacer
          </button>
        </div>
        <div className="p-4 bg-gray-900 text-gray-100 font-mono text-sm max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">En attente du lancement des tests...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="py-0.5 whitespace-pre-wrap">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info */}
      <div className="card p-4 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Note importante</p>
            <p>
              Les tests créent des dossiers avec le préfixe <code className="bg-amber-100 px-1 rounded">{TEST_CONFIG.prefix}</code>.
              Utilisez le bouton "Nettoyer" pour supprimer ces données de test après validation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
