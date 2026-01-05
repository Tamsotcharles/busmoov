import { jsPDF } from 'jspdf'
import { formatDate, formatDateTime, formatPricePDF } from './utils'
import { supabase } from './supabase'
import type { CompanySettings } from '@/types/database'

// Cache pour le logo converti en PNG base64
let cachedLogoBase64: string | null = null

// Fonction pour charger et convertir le logo SVG en PNG base64
async function getLogoBase64(): Promise<string | null> {
  if (cachedLogoBase64) return cachedLogoBase64

  try {
    // Charger le SVG
    const response = await fetch('/logo-pdf.svg')
    const svgText = await response.text()

    // Créer une image à partir du SVG
    const img = new Image()
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    return new Promise((resolve) => {
      img.onload = () => {
        // Créer un canvas et dessiner l'image
        const canvas = document.createElement('canvas')
        canvas.width = img.width || 280
        canvas.height = img.height || 60

        const ctx = canvas.getContext('2d')
        if (ctx) {
          // Fond blanc
          ctx.fillStyle = 'white'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          // Dessiner le SVG
          ctx.drawImage(img, 0, 0)

          // Convertir en PNG base64
          cachedLogoBase64 = canvas.toDataURL('image/png')
          URL.revokeObjectURL(url)
          resolve(cachedLogoBase64)
        } else {
          resolve(null)
        }
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(null)
      }
      img.src = url
    })
  } catch (e) {
    console.warn('Could not load logo:', e)
    return null
  }
}

// Fonction pour ajouter le logo au PDF
async function addLogoToPdf(doc: jsPDF, x: number, y: number, width: number, height: number) {
  const logoBase64 = await getLogoBase64()
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', x, y, width, height)
    } catch (e) {
      console.warn('Could not add logo to PDF:', e)
      // Fallback: juste le texte
      doc.setTextColor(45, 27, 105)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Busmoov', x, y + 8)
    }
  } else {
    // Fallback: juste le texte
    doc.setTextColor(45, 27, 105)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Busmoov', x, y + 8)
  }
}

// Configuration entreprise par défaut (utilisée si la BDD n'est pas accessible)
const DEFAULT_COMPANY_INFO = {
  name: 'Busmoov',
  legalName: 'BUSMOOV SAS',
  address: '41 Rue Barrault',
  zipCity: '75013 Paris',
  phone: '01 76 31 12 83',
  email: 'infos@busmoov.com',
  siret: '853 867 703 00029',
  rcs: 'Paris 853 867 703',
  codeApe: '4939B',
  tvaIntracom: 'FR58853867703',
  rib: {
    iban: 'FR76 3000 4015 9600 0101 0820 195',
    bic: 'BNPAFRPPXXX',
  },
}

// Fonction pour charger les settings depuis la BDD
async function getCompanyInfo(): Promise<typeof DEFAULT_COMPANY_INFO> {
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .single()

    if (error || !data) {
      console.warn('Could not load company settings, using defaults')
      return DEFAULT_COMPANY_INFO
    }

    const settings = data as CompanySettings
    return {
      name: settings.name || DEFAULT_COMPANY_INFO.name,
      legalName: settings.legal_name || DEFAULT_COMPANY_INFO.legalName,
      address: settings.address || DEFAULT_COMPANY_INFO.address,
      zipCity: `${settings.zip || ''} ${settings.city || ''}`.trim() || DEFAULT_COMPANY_INFO.zipCity,
      phone: settings.phone || DEFAULT_COMPANY_INFO.phone,
      email: settings.email || DEFAULT_COMPANY_INFO.email,
      siret: settings.siret || DEFAULT_COMPANY_INFO.siret,
      rcs: settings.rcs || DEFAULT_COMPANY_INFO.rcs,
      codeApe: settings.code_ape || DEFAULT_COMPANY_INFO.codeApe,
      tvaIntracom: settings.tva_intracom || DEFAULT_COMPANY_INFO.tvaIntracom,
      rib: {
        iban: settings.iban || DEFAULT_COMPANY_INFO.rib.iban,
        bic: settings.bic || DEFAULT_COMPANY_INFO.rib.bic,
      },
    }
  } catch (err) {
    console.error('Error loading company settings:', err)
    return DEFAULT_COMPANY_INFO
  }
}

interface DevisData {
  reference: string
  dossier?: {
    reference: string
    client_name: string
    client_company?: string | null
    client_email: string
    client_phone?: string | null
    billing_address?: string | null
    billing_zip?: string | null
    billing_city?: string | null
    departure: string
    arrival: string
    departure_date: string
    departure_time?: string | null
    return_date?: string | null
    return_time?: string | null
    passengers: number
    luggage_type?: string | null
    trip_mode?: string | null
  } | null
  transporteur?: {
    name: string
    number: string
  } | null
  vehicle_type?: string | null
  price_ht: number
  price_ttc: number
  tva_rate?: number | null
  km?: string | null
  options?: string | null
  notes?: string | null
  created_at?: string | null
  validity_days?: number | null
  nombre_cars?: number | null
  nombre_chauffeurs?: number | null
  // Type de service
  service_type?: string | null
  // Durée en jours
  duree_jours?: number | null
  // Détail mise à disposition
  detail_mad?: string | null
  // Mise à disposition
  mad_lieu?: string | null
  mad_date?: string | null
  mad_heure?: string | null
  // Commentaires
  commentaires?: string | null
  // Bagages (peut aussi venir du dossier)
  luggage_type?: string | null
  // Options détaillées (péages, repas, parking, hébergement)
  options_details?: {
    peages?: { status: string; montant?: number }
    repas_chauffeur?: { status: string; montant?: number }
    parking?: { status: string; montant?: number }
    hebergement?: { status: string; montant?: number; nuits?: number }
  } | null
}

interface ContratData {
  reference: string
  price_ht?: number | null
  price_ttc: number
  acompte_amount?: number | null
  solde_amount?: number | null
  tva_rate?: number | null
  signed_at?: string | null
  client_name?: string | null
  client_company?: string | null
  client_email?: string | null
  client_phone?: string | null
  billing_address?: string | null
  billing_zip?: string | null
  billing_city?: string | null
  billing_country?: string | null
  nombre_cars?: number | null
  nombre_chauffeurs?: number | null
  // Type de service (aller_simple, aller_retour, circuit, mise_disposition)
  service_type?: string | null
  // Mise à disposition
  mad_lieu?: string | null
  mad_date?: string | null
  mad_heure?: string | null
  // Détail mise à disposition (texte libre)
  detail_mad?: string | null
  // Durée en jours (pour circuit/MAD)
  duree_jours?: number | null
  // Commentaires
  commentaires?: string | null
  km?: string | null
  // Prix de base du transfert (avant options)
  base_price_ttc?: number | null
  // Options sélectionnées (pour affichage en lignes séparées)
  options_lignes?: Array<{ label: string; montant: number }> | null
  dossier?: {
    reference: string
    client_name: string
    client_company?: string | null
    client_email: string
    client_phone?: string | null
    departure: string
    arrival: string
    departure_date: string
    departure_time?: string | null
    return_date?: string | null
    return_time?: string | null
    passengers: number
    vehicle_type?: string | null
    notes?: string | null
    trip_mode?: string | null
    transporteur?: {
      name: string
      number: string
    } | null
  } | null
  devis?: {
    reference: string
    nombre_cars?: number | null
    nombre_chauffeurs?: number | null
    transporteur?: {
      name: string
      number: string
    } | null
  } | null
  paiements?: Array<{
    type: string
    amount: number
    payment_date: string
    reference?: string | null
  }> | null
}

// Dessine une ligne horizontale
function drawLine(doc: jsPDF, y: number, startX: number = 15, endX?: number) {
  const pageWidth = doc.internal.pageSize.getWidth()
  doc.setDrawColor(200, 200, 200)
  doc.line(startX, y, endX || pageWidth - 15, y)
}

// Hauteur réservée pour le footer
const FOOTER_HEIGHT = 35

// Fonction pour dessiner le footer sur une page
function drawFooter(doc: jsPDF, companyInfo: typeof DEFAULT_COMPANY_INFO) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const footerY = pageHeight - 18

  doc.setDrawColor(200, 200, 200)
  doc.line(15, footerY - 8, pageWidth - 15, footerY - 8)

  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.text(
    `${companyInfo.legalName} - SIRET: ${companyInfo.siret} - RCS ${companyInfo.rcs} - Code APE: ${companyInfo.codeApe}`,
    pageWidth / 2,
    footerY - 3,
    { align: 'center' }
  )
  doc.text(
    `TVA Intracommunautaire: ${companyInfo.tvaIntracom} - ${companyInfo.address}, ${companyInfo.zipCity}`,
    pageWidth / 2,
    footerY + 2,
    { align: 'center' }
  )
  doc.text(
    `Tél: ${companyInfo.phone} - Email: ${companyInfo.email}`,
    pageWidth / 2,
    footerY + 7,
    { align: 'center' }
  )
}

// Vérifie si on doit passer à la page suivante et ajoute le footer si nécessaire
function checkPageBreak(doc: jsPDF, y: number, neededHeight: number, companyInfo: typeof DEFAULT_COMPANY_INFO): number {
  const pageHeight = doc.internal.pageSize.getHeight()
  const maxY = pageHeight - FOOTER_HEIGHT - 10 // Marge de sécurité

  if (y + neededHeight > maxY) {
    // Dessiner le footer sur la page actuelle
    drawFooter(doc, companyInfo)
    // Ajouter une nouvelle page
    doc.addPage()
    // Retourner la position Y de départ sur la nouvelle page
    return 20
  }
  return y
}

// Dessine un rectangle avec fond
function drawRect(doc: jsPDF, x: number, y: number, w: number, h: number, color: string) {
  const rgb = hexToRgb(color)
  if (rgb) {
    doc.setFillColor(rgb.r, rgb.g, rgb.b)
    doc.rect(x, y, w, h, 'F')
  }
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

// Format price for PDF - uses regular spaces (not narrow/non-breaking)
function formatAmount(amount: number): string {
  // Format number with French locale
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  // Replace narrow no-break space (U+202F) and non-breaking space (U+00A0) with regular space
  return formatted.replace(/[\u202F\u00A0]/g, ' ')
}

export async function generateDevisPDF(devis: DevisData): Promise<void> {
  const COMPANY_INFO = await getCompanyInfo()
  const doc = new jsPDF({
    format: 'a4',
    orientation: 'portrait'
  })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const tvaRate = devis.tva_rate || 10
  const tvaAmount = devis.price_ttc - devis.price_ht

  // Couleurs Busmoov
  const purpleDark = '#582C87' // Violet foncé Busmoov
  const magenta = '#E91E8C' // Magenta Busmoov
  const purpleLight = '#f3e8ff' // Violet clair pour fond
  const grayText = [80, 80, 80]

  // ========== HEADER ==========
  // Logo Busmoov à gauche (contient déjà le nom)
  await addLogoToPdf(doc, 15, 10, 50, 11)

  // Titre DEVIS (côté droit)
  doc.setFontSize(18)
  doc.setTextColor(88, 44, 135) // Purple Busmoov
  doc.setFont('helvetica', 'bold')
  doc.text('DEVIS', pageWidth - 15, 16, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(`N° ${devis.reference}`, pageWidth - 15, 23, { align: 'right' })
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`Date : ${formatDate(devis.created_at)}`, pageWidth - 15, 29, { align: 'right' })
  if (devis.dossier?.reference) {
    doc.text(`Dossier : ${devis.dossier.reference}`, pageWidth - 15, 35, { align: 'right' })
  }

  drawLine(doc, 42)

  // ========== INFO CLIENT & CONSEILLER ==========
  let y = 52

  // Client (gauche)
  drawRect(doc, 15, y - 5, 80, 7, purpleLight)
  doc.setFontSize(9)
  doc.setTextColor(88, 44, 135) // Purple Busmoov
  doc.setFont('helvetica', 'bold')
  doc.text("Client", 17, y)
  doc.setFont('helvetica', 'normal')

  y += 7
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  if (devis.dossier?.client_company) {
    doc.text(devis.dossier.client_company, 17, y)
    y += 5
  }
  doc.text(devis.dossier?.client_name || '-', 17, y)
  y += 5
  if (devis.dossier?.client_email) {
    doc.text(devis.dossier.client_email, 17, y)
    y += 5
  }
  if (devis.dossier?.client_phone) {
    doc.text(devis.dossier.client_phone, 17, y)
  }

  // Conseiller (droite)
  let cy = 52
  drawRect(doc, 110, cy - 5, 85, 7, purpleLight)
  doc.setFontSize(9)
  doc.setTextColor(88, 44, 135) // Purple Busmoov
  doc.setFont('helvetica', 'bold')
  doc.text('Votre conseiller', 112, cy)
  doc.setFont('helvetica', 'normal')

  cy += 7
  doc.setTextColor(0, 0, 0)
  doc.text('Equipe Busmoov', 112, cy)
  cy += 5
  doc.setTextColor(233, 30, 140) // Magenta Busmoov
  doc.text(COMPANY_INFO.email, 112, cy)
  cy += 5
  doc.setTextColor(0, 0, 0)
  doc.text(COMPANY_INFO.phone, 112, cy)

  // ========== DETAILS PRESTATION - 2 COLONNES ==========
  y = 95
  const colWidth = (pageWidth - 40) / 2
  const colLeftX = 15
  const colRightX = pageWidth / 2 + 5

  // Titre section
  drawRect(doc, 15, y - 5, pageWidth - 30, 7, purpleDark)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Détails de la prestation', 17, y)
  doc.setFont('helvetica', 'normal')

  y += 12
  const nombreCars = devis.nombre_cars || 1
  const nombreChauffeurs = devis.nombre_chauffeurs || 1

  // Colonne gauche - ALLER
  let leftY = y
  doc.setFontSize(9)
  doc.setTextColor(233, 30, 140) // Magenta Busmoov
  doc.setFont('helvetica', 'bold')
  doc.text('ALLER', colLeftX, leftY)
  doc.setFont('helvetica', 'normal')
  leftY += 7

  // Date/Heure départ
  doc.setTextColor(88, 44, 135) // Purple
  doc.text('Date de départ', colLeftX, leftY)
  leftY += 5
  doc.setTextColor(0, 0, 0)
  const departDate = devis.dossier?.departure_date ? formatDate(devis.dossier.departure_date) : '-'
  const departTime = devis.dossier?.departure_time || ''
  doc.text(`${departDate} ${departTime}`.trim(), colLeftX, leftY)
  leftY += 8

  // Lieu départ
  doc.setTextColor(88, 44, 135)
  doc.text('Lieu de départ', colLeftX, leftY)
  leftY += 5
  doc.setTextColor(0, 0, 0)
  const departLines = doc.splitTextToSize(devis.dossier?.departure || '-', colWidth - 10)
  doc.text(departLines, colLeftX, leftY)
  leftY += departLines.length * 4 + 4

  // Lieu arrivée
  doc.setTextColor(88, 44, 135)
  doc.text('Lieu de destination', colLeftX, leftY)
  leftY += 5
  doc.setTextColor(0, 0, 0)
  const arriveeLines = doc.splitTextToSize(devis.dossier?.arrival || '-', colWidth - 10)
  doc.text(arriveeLines, colLeftX, leftY)
  leftY += arriveeLines.length * 4

  // Colonne droite - RETOUR (si aller-retour) ou MAD
  let rightY = y
  // C'est un aller-retour si return_date existe OU si return_time existe (aller-retour même jour)
  const isAllerRetourDevis = !!(devis.dossier?.return_date || devis.dossier?.return_time)

  if (isAllerRetourDevis) {
    doc.setFontSize(9)
    doc.setTextColor(233, 30, 140) // Magenta
    doc.setFont('helvetica', 'bold')
    doc.text('RETOUR', colRightX, rightY)
    doc.setFont('helvetica', 'normal')
    rightY += 7

    // Date/Heure retour
    doc.setTextColor(88, 44, 135)
    const hasReturnDateDevis = !!devis.dossier?.return_date
    doc.text(hasReturnDateDevis ? 'Date de retour' : 'Heure de retour', colRightX, rightY)
    rightY += 5
    doc.setTextColor(0, 0, 0)
    if (hasReturnDateDevis) {
      const retourDate = formatDate(devis.dossier!.return_date!)
      const retourTime = devis.dossier?.return_time || ''
      doc.text(`${retourDate} ${retourTime}`.trim(), colRightX, rightY)
    } else {
      // Aller-retour même jour
      doc.text(devis.dossier?.return_time || '-', colRightX, rightY)
    }
    rightY += 8

    // Lieu départ retour (inverse de l'aller)
    doc.setTextColor(88, 44, 135)
    doc.text('Lieu de départ', colRightX, rightY)
    rightY += 5
    doc.setTextColor(0, 0, 0)
    const retourDepartLines = doc.splitTextToSize(devis.dossier?.arrival || '-', colWidth - 10)
    doc.text(retourDepartLines, colRightX, rightY)
    rightY += retourDepartLines.length * 4 + 4

    // Lieu arrivée retour
    doc.setTextColor(88, 44, 135)
    doc.text('Lieu de destination', colRightX, rightY)
    rightY += 5
    doc.setTextColor(0, 0, 0)
    const retourArriveeLines = doc.splitTextToSize(devis.dossier?.departure || '-', colWidth - 10)
    doc.text(retourArriveeLines, colRightX, rightY)
    rightY += retourArriveeLines.length * 4
  } else if (devis.mad_lieu || devis.mad_date || devis.mad_heure) {
    // Aller simple avec MAD
    doc.setFontSize(9)
    doc.setTextColor(233, 30, 140) // Magenta
    doc.setFont('helvetica', 'bold')
    doc.text('MISE À DISPOSITION', colRightX, rightY)
    doc.setFont('helvetica', 'normal')
    rightY += 7

    if (devis.mad_date) {
      doc.setTextColor(88, 44, 135)
      doc.text('Date', colRightX, rightY)
      rightY += 5
      doc.setTextColor(0, 0, 0)
      doc.text(`${formatDate(devis.mad_date)} ${devis.mad_heure || ''}`.trim(), colRightX, rightY)
      rightY += 8
    }

    if (devis.mad_lieu) {
      doc.setTextColor(88, 44, 135)
      doc.text('Lieu', colRightX, rightY)
      rightY += 5
      doc.setTextColor(0, 0, 0)
      const madLines = doc.splitTextToSize(devis.mad_lieu, colWidth - 10)
      doc.text(madLines, colRightX, rightY)
      rightY += madLines.length * 4
    }
  }

  y = Math.max(leftY, rightY) + 10

  // ========== INFORMATIONS VÉHICULE ==========
  drawRect(doc, 15, y - 4, pageWidth - 30, 7, purpleLight)
  doc.setFontSize(9)
  doc.setTextColor(88, 44, 135) // Purple
  doc.setFont('helvetica', 'bold')
  doc.text('Informations véhicule', 17, y)
  doc.setFont('helvetica', 'normal')

  y += 8
  doc.setTextColor(0, 0, 0)
  const vehicleDetails: [string, string][] = [
    ['Passagers', `${devis.dossier?.passengers || '-'} personnes`],
    ['Type de véhicule', devis.vehicle_type || 'Autocar standard'],
    ['Nombre de cars', `${nombreCars} véhicule${nombreCars > 1 ? 's' : ''}`],
    ['Nombre de chauffeurs', `${nombreChauffeurs} chauffeur${nombreChauffeurs > 1 ? 's' : ''}`],
  ]
  if (devis.km) {
    vehicleDetails.push(['Kilomètres inclus', devis.km])
  }
  // Bagages
  const luggageType = devis.luggage_type || devis.dossier?.luggage_type
  if (luggageType) {
    vehicleDetails.push(['Bagages', luggageType])
  }

  vehicleDetails.forEach(([label, value], i) => {
    const rowY = y + (i * 6)
    doc.setTextColor(100, 100, 100)
    doc.text(label, 17, rowY)
    doc.setTextColor(0, 0, 0)
    doc.text(value, 80, rowY)
  })

  y += vehicleDetails.length * 6 + 5

  // ========== COMMENTAIRES ==========
  // Note: devis.notes est réservé aux notes internes admin, ne pas afficher sur les docs clients
  if (devis.commentaires) {
    doc.setFontSize(9)
    doc.setTextColor(88, 44, 135)
    doc.setFont('helvetica', 'bold')
    doc.text('Commentaires', 17, y)
    doc.setFont('helvetica', 'normal')
    y += 6
    doc.setTextColor(grayText[0], grayText[1], grayText[2])
    const commentLines = doc.splitTextToSize(devis.commentaires, pageWidth - 35)
    doc.text(commentLines.slice(0, 4), 17, y)
    y += Math.min(commentLines.length, 4) * 4 + 8
  }

  // ========== TARIFICATION ==========
  drawRect(doc, 15, y - 4, pageWidth - 30, 7, purpleDark)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Tarification', 17, y)
  doc.setFont('helvetica', 'normal')

  y += 10
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)

  const prixParCarHT = devis.price_ht / nombreCars
  const prixParCarTTC = devis.price_ttc / nombreCars

  // Prix par car HT
  doc.text(`Prix par car HT`, 17, y)
  doc.text(`${formatAmount(prixParCarHT)} EUR`, pageWidth - 17, y, { align: 'right' })

  y += 6
  // Nombre de cars
  doc.text(`Nombre de cars`, 17, y)
  doc.text(`x ${nombreCars}`, pageWidth - 17, y, { align: 'right' })

  y += 6
  // Total HT
  doc.setFont('helvetica', 'bold')
  doc.text('Total HT', 17, y)
  doc.text(`${formatAmount(devis.price_ht)} EUR`, pageWidth - 17, y, { align: 'right' })
  doc.setFont('helvetica', 'normal')

  y += 6
  // TVA
  doc.text(`TVA (${tvaRate}%)`, 17, y)
  doc.text(`${formatAmount(tvaAmount)} EUR`, pageWidth - 17, y, { align: 'right' })

  y += 2
  drawLine(doc, y + 3, 120, pageWidth - 15)

  y += 10
  // Total TTC
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(233, 30, 140) // Magenta Busmoov
  doc.text('TOTAL TTC', 17, y)
  doc.text(`${formatAmount(devis.price_ttc)} EUR`, pageWidth - 17, y, { align: 'right' })
  doc.setFont('helvetica', 'normal')

  // Prix par car TTC
  y += 6
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`Soit ${formatAmount(prixParCarTTC)} EUR TTC par car`, pageWidth - 17, y, { align: 'right' })

  // Prix par personne
  if (devis.dossier?.passengers && devis.dossier.passengers > 0) {
    y += 4
    const pricePerPerson = devis.price_ttc / devis.dossier.passengers
    doc.text(`Soit ${formatAmount(pricePerPerson)} EUR TTC par personne`, pageWidth - 17, y, { align: 'right' })
  }

  // ========== OPTIONS DISPONIBLES ==========
  // Afficher les options non incluses avec leurs prix
  if (devis.options_details) {
    const opts = devis.options_details
    const optionsNonIncluses: { label: string; prix: string; detail?: string }[] = []

    // Calculer la durée pour les repas
    let dureeJours = devis.duree_jours || 1
    if (!devis.duree_jours && devis.dossier?.return_date && devis.dossier?.departure_date) {
      const depDate = new Date(devis.dossier.departure_date)
      const retDate = new Date(devis.dossier.return_date)
      dureeJours = Math.max(1, Math.ceil((retDate.getTime() - depDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    }
    const nbRepas = dureeJours * 2

    if (opts.peages?.status === 'non_inclus' && opts.peages?.montant && opts.peages.montant > 0) {
      optionsNonIncluses.push({ label: 'Péages', prix: `${formatAmount(opts.peages.montant)} €` })
    }
    if (opts.repas_chauffeur?.status === 'non_inclus' && opts.repas_chauffeur?.montant && opts.repas_chauffeur.montant > 0) {
      const totalRepas = opts.repas_chauffeur.montant * nbRepas * nombreChauffeurs
      optionsNonIncluses.push({
        label: 'Repas chauffeur',
        prix: `${formatAmount(totalRepas)} €`,
        detail: `(${opts.repas_chauffeur.montant}€ × ${nbRepas} repas × ${nombreChauffeurs} chauff.)`
      })
    }
    if (opts.parking?.status === 'non_inclus' && opts.parking?.montant && opts.parking.montant > 0) {
      optionsNonIncluses.push({ label: 'Parking', prix: `${formatAmount(opts.parking.montant)} €` })
    }
    if (opts.hebergement?.status === 'non_inclus' && opts.hebergement?.montant && opts.hebergement.montant > 0) {
      const nbNuits = opts.hebergement.nuits || 1
      const totalHeberg = opts.hebergement.montant * nbNuits * nombreChauffeurs
      optionsNonIncluses.push({
        label: 'Hébergement chauffeur',
        prix: `${formatAmount(totalHeberg)} €`,
        detail: `(${opts.hebergement.montant}€ × ${nbNuits} nuit${nbNuits > 1 ? 's' : ''} × ${nombreChauffeurs} chauff.)`
      })
    }

    if (optionsNonIncluses.length > 0) {
      y += 12
      y = checkPageBreak(doc, y, 40, COMPANY_INFO)

      drawRect(doc, 15, y - 4, pageWidth - 30, 7, '#fef3c7') // Amber clair
      doc.setFontSize(9)
      doc.setTextColor(146, 64, 14) // Amber foncé
      doc.setFont('helvetica', 'bold')
      doc.text('Options disponibles (non incluses)', 17, y)
      doc.setFont('helvetica', 'normal')

      y += 8
      doc.setFontSize(8)
      doc.setTextColor(60, 60, 60)

      optionsNonIncluses.forEach((opt, i) => {
        const lineY = y + (i * 6)
        doc.text(`• ${opt.label}`, 17, lineY)
        if (opt.detail) {
          doc.setTextColor(100, 100, 100)
          doc.text(opt.detail, 55, lineY)
          doc.setTextColor(60, 60, 60)
        }
        doc.setFont('helvetica', 'bold')
        doc.text(opt.prix, pageWidth - 17, lineY, { align: 'right' })
        doc.setFont('helvetica', 'normal')
      })
      y += optionsNonIncluses.length * 6
    }
  }

  // ========== MODALITES ==========
  y += 12
  // Vérifier si on a besoin d'une nouvelle page (modalités + RIB ~ 40px)
  y = checkPageBreak(doc, y, 40, COMPANY_INFO)

  doc.setFontSize(10)
  doc.setTextColor(88, 44, 135) // Purple
  doc.setFont('helvetica', 'bold')
  doc.text('Modalités de règlement', 15, y)
  doc.setFont('helvetica', 'normal')

  y += 7
  doc.setFontSize(8)
  doc.setTextColor(60, 60, 60)
  const modalites = [
    '• 30% à la réservation',
    '• Solde 45 jours avant le départ',
    '• Paiement par carte bancaire ou virement',
  ]
  modalites.forEach((m, i) => {
    doc.text(m, 17, y + (i * 4))
  })

  // RIB
  y += 16
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`IBAN: ${COMPANY_INFO.rib.iban}`, 17, y)
  y += 4
  doc.text(`BIC: ${COMPANY_INFO.rib.bic}`, 17, y)

  // ========== CONDITIONS ANNULATION ==========
  y += 10
  // Vérifier si on a besoin d'une nouvelle page (conditions ~ 70px)
  y = checkPageBreak(doc, y, 70, COMPANY_INFO)

  drawRect(doc, 15, y - 4, pageWidth - 30, 7, '#fff3cd')
  doc.setFontSize(9)
  doc.setTextColor(133, 100, 4)
  doc.setFont('helvetica', 'bold')
  doc.text("Conditions d'annulation", 17, y)
  doc.setFont('helvetica', 'normal')

  y += 7
  doc.setFontSize(7)
  doc.setTextColor(60, 60, 60)
  // Texte d'introduction
  const conditionsIntro = "La validation en ligne implique une acceptation totale de nos conditions générales de vente et donc des conditions d'annulation ci-dessous :"
  const introLines = doc.splitTextToSize(conditionsIntro, pageWidth - 35)
  doc.text(introLines, 17, y)
  y += introLines.length * 3.5 + 3

  doc.setFontSize(8)
  const conditions = [
    '30% du prix du service si l\'annulation intervient à J-31 ou plus',
    '50% du prix du service si l\'annulation intervient entre J-30 et J-14',
    '70% du prix du service si l\'annulation intervient entre J-13 et J-8',
    '100% du prix du service si l\'annulation intervient à J-7 ou moins',
  ]
  conditions.forEach((c, i) => {
    doc.text(`• ${c}`, 17, y + (i * 4))
  })

  // ========== VALIDITE ==========
  y += conditions.length * 4 + 6
  doc.setFontSize(9)
  doc.setTextColor(88, 44, 135) // Purple
  doc.setFont('helvetica', 'bold')
  doc.text(`Ce devis est valable ${devis.validity_days || 7} jours.`, 15, y)
  doc.setFont('helvetica', 'normal')

  // ========== FOOTER ==========
  drawFooter(doc, COMPANY_INFO)

  doc.save(`Devis_${devis.reference}.pdf`)
}

export async function generateContratPDF(contrat: ContratData): Promise<void> {
  const COMPANY_INFO = await getCompanyInfo()
  const doc = new jsPDF({
    format: 'a4',
    orientation: 'portrait'
  })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const tvaRate = contrat.tva_rate || 10
  const priceHT = contrat.price_ht || Math.round(contrat.price_ttc / (1 + tvaRate / 100))
  const tvaAmount = contrat.price_ttc - priceHT

  // Couleurs Busmoov
  const purpleDark = '#582C87'
  const magenta = '#E91E8C'
  const purpleLight = '#f3e8ff'
  const grayBg = '#f8f9fa'
  const borderGray = '#e5e7eb'

  const nombreCars = contrat.nombre_cars || contrat.devis?.nombre_cars || 1
  const nombreChauffeurs = contrat.nombre_chauffeurs || contrat.devis?.nombre_chauffeurs || 1

  // ========== HEADER - Logo grand à gauche ==========
  await addLogoToPdf(doc, 15, 10, 50, 11)

  // Infos émetteur à droite
  let ey = 15
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'bold')
  doc.text(COMPANY_INFO.legalName, pageWidth - 15, ey, { align: 'right' })
  ey += 5
  doc.setFont('helvetica', 'normal')
  doc.text(COMPANY_INFO.address, pageWidth - 15, ey, { align: 'right' })
  ey += 4
  doc.text(COMPANY_INFO.zipCity, pageWidth - 15, ey, { align: 'right' })
  ey += 4
  doc.text(`Tél: ${COMPANY_INFO.phone}`, pageWidth - 15, ey, { align: 'right' })
  ey += 4
  doc.text(COMPANY_INFO.email, pageWidth - 15, ey, { align: 'right' })
  ey += 4
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`SIRET: ${COMPANY_INFO.siret}`, pageWidth - 15, ey, { align: 'right' })
  ey += 4
  doc.text(`TVA: ${COMPANY_INFO.tvaIntracom}`, pageWidth - 15, ey, { align: 'right' })

  // ========== TITRE PROFORMA ==========
  let y = 55
  doc.setFontSize(22)
  doc.setTextColor(88, 44, 135)
  doc.setFont('helvetica', 'bold')
  doc.text('PROFORMA', 15, y)

  // Références
  y += 8
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'normal')
  doc.text(`N° ${contrat.reference}`, 15, y)
  doc.text(`Date : ${formatDate(contrat.signed_at || new Date().toISOString())}`, 80, y)
  if (contrat.dossier?.reference) {
    doc.text(`Dossier : ${contrat.dossier.reference}`, 140, y)
  }

  // ========== BLOC CLIENT ==========
  y += 12
  // Cadre client avec bordure
  doc.setDrawColor(88, 44, 135)
  doc.setLineWidth(0.5)
  doc.rect(15, y, 85, 35)

  // Header du bloc client
  drawRect(doc, 15, y, 85, 8, purpleDark)
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENT', 20, y + 5.5)

  // Contenu client
  let cy = y + 14
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  const clientCompany = contrat.client_company || contrat.dossier?.client_company
  const clientName = contrat.client_name || contrat.dossier?.client_name || '-'
  if (clientCompany) {
    doc.setFont('helvetica', 'bold')
    doc.text(clientCompany, 20, cy)
    cy += 5
    doc.setFont('helvetica', 'normal')
  }
  doc.text(clientName, 20, cy)
  cy += 5
  if (contrat.billing_address) {
    doc.text(contrat.billing_address, 20, cy)
    cy += 5
  }
  if (contrat.billing_zip || contrat.billing_city) {
    doc.text(`${contrat.billing_zip || ''} ${contrat.billing_city || ''}`.trim(), 20, cy)
  }

  // ========== SECTION PRESTATION (tableau) ==========
  y += 45

  // Header Prestation
  drawRect(doc, 15, y, pageWidth - 30, 8, purpleDark)
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('PRESTATION', 20, y + 5.5)

  y += 14

  // Type de trajet basé sur service_type ou trip_mode
  // IMPORTANT: Vérifier d'abord circuit/mise_disposition car ils peuvent avoir des dates de retour
  const serviceType = contrat.service_type || contrat.dossier?.trip_mode
  let typeTrajet = 'ALLER SIMPLE'
  // ar_mad = aller-retour mise à disposition (circuit multi-jours)
  const isMiseADispo = serviceType === 'circuit' || serviceType === 'mise_disposition' || serviceType === 'ar_mad'
  if (isMiseADispo) {
    typeTrajet = 'MISE À DISPOSITION'
    if (contrat.duree_jours && contrat.duree_jours > 1) {
      typeTrajet += ` (${contrat.duree_jours} jours)`
    }
  } else if (serviceType === 'aller_retour') {
    typeTrajet = 'ALLER / RETOUR'
  } else if (contrat.dossier?.return_date || contrat.dossier?.return_time) {
    // Seulement si pas de trip_mode spécifié, on déduit du return_date
    typeTrajet = 'ALLER / RETOUR'
  }

  doc.setFontSize(11)
  doc.setTextColor(233, 30, 140) // Magenta
  doc.setFont('helvetica', 'bold')
  doc.text(typeTrajet, 17, y)

  // Afficher le détail de mise à disposition si présent
  if (contrat.detail_mad && isMiseADispo) {
    y += 6
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    const madLines = doc.splitTextToSize(contrat.detail_mad, pageWidth - 40)
    doc.text(madLines.slice(0, 2), 17, y)
    y += madLines.slice(0, 2).length * 4
  }

  y += 10

  // Description du trajet - Départ
  doc.setFontSize(9)
  doc.setTextColor(88, 44, 135) // Purple
  doc.setFont('helvetica', 'bold')
  doc.text('Départ', 17, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const departureText = contrat.dossier?.departure || '-'
  const departureLinesContract = doc.splitTextToSize(departureText, 80)
  doc.text(departureLinesContract, 45, y)
  y += departureLinesContract.length * 4 + 4

  // Description du trajet - Arrivée
  doc.setTextColor(88, 44, 135) // Purple
  doc.setFont('helvetica', 'bold')
  doc.text('Arrivée', 17, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const arrivalText = contrat.dossier?.arrival || '-'
  const arrivalLinesContract = doc.splitTextToSize(arrivalText, 80)
  doc.text(arrivalLinesContract, 45, y)
  y += arrivalLinesContract.length * 4 + 6

  // Date et heure de départ
  doc.setTextColor(88, 44, 135) // Purple
  doc.setFont('helvetica', 'bold')
  doc.text('Date aller', 17, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const departDateContract = contrat.dossier?.departure_date ? formatDate(contrat.dossier.departure_date) : '-'
  const departTimeContract = contrat.dossier?.departure_time ? ` à ${contrat.dossier.departure_time}` : ''
  doc.text(`${departDateContract}${departTimeContract}`, 45, y)

  // Date de fin/retour - afficher pour tous les types si une date de retour existe
  const hasReturnDate = !!contrat.dossier?.return_date
  const hasReturnTime = !!contrat.dossier?.return_time
  const isAllerRetour = serviceType === 'aller_retour' || (!serviceType && !isMiseADispo && (hasReturnDate || hasReturnTime))

  if (hasReturnDate || hasReturnTime) {
    y += 5
    doc.setTextColor(88, 44, 135) // Purple
    doc.setFont('helvetica', 'bold')
    // Pour MAD: "Date fin", pour A/R: "Date retour" ou "Heure retour"
    const label = isMiseADispo ? 'Date fin' : (hasReturnDate ? 'Date retour' : 'Heure retour')
    doc.text(label, 17, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    if (hasReturnDate) {
      const returnDateContract = formatDate(contrat.dossier!.return_date!)
      const returnTimeContract = contrat.dossier?.return_time ? ` à ${contrat.dossier.return_time}` : ''
      doc.text(`${returnDateContract}${returnTimeContract}`, 45, y)
    } else {
      // Aller-retour même jour - afficher juste l'heure
      doc.text(contrat.dossier?.return_time || '-', 45, y)
    }
  }

  y += 8

  // Ligne séparatrice légère
  doc.setDrawColor(220, 220, 220)
  doc.line(17, y, 100, y)
  y += 6

  // Informations véhicule et passagers en 2 colonnes
  doc.setFontSize(8)

  // Colonne gauche
  doc.setTextColor(100, 100, 100)
  doc.text('Passagers', 17, y)
  doc.setTextColor(0, 0, 0)
  doc.text(`${contrat.dossier?.passengers || '-'} personnes`, 50, y)

  // Colonne droite
  doc.setTextColor(100, 100, 100)
  doc.text('Véhicule', 100, y)
  doc.setTextColor(0, 0, 0)
  doc.text(`${nombreCars} autocar${nombreCars > 1 ? 's' : ''}`, 130, y)

  y += 5
  doc.setTextColor(100, 100, 100)
  doc.text('Chauffeurs', 17, y)
  doc.setTextColor(0, 0, 0)
  doc.text(`${nombreChauffeurs} chauffeur${nombreChauffeurs > 1 ? 's' : ''}`, 50, y)

  // Kilométrage si disponible
  if (contrat.km) {
    doc.setTextColor(100, 100, 100)
    doc.text('Kilomètres', 100, y)
    doc.setTextColor(0, 0, 0)
    doc.text(contrat.km, 130, y)
  }

  y += 10

  // Ligne séparatrice
  doc.setDrawColor(200, 200, 200)
  doc.line(15, y, pageWidth - 15, y)
  y += 6

  // En-têtes du tableau de prix
  drawRect(doc, 15, y - 4, pageWidth - 30, 8, grayBg)
  doc.setFontSize(8)
  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'bold')
  doc.text('Désignation', 17, y)
  doc.text('Qté', 97, y)
  doc.text('Prix Unit. HT', 127, y)
  doc.text('TVA', 157, y)
  doc.text('Total HT', pageWidth - 17, y, { align: 'right' })

  // Ligne de données - Prestation transport
  y += 10
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  // Description condensée pour le tableau
  let trajetDescShort = 'Transport aller simple autocar'
  if (isMiseADispo) {
    trajetDescShort = `Mise à disposition autocar`
    if (contrat.duree_jours && contrat.duree_jours > 1) {
      trajetDescShort += ` (${contrat.duree_jours} jours)`
    }
  } else if (isAllerRetour) {
    trajetDescShort = 'Transport A/R autocar'
  }

  doc.text(trajetDescShort, 17, y)

  // Calculer le prix de base du transfert (sans options)
  const basePriceTTC = contrat.base_price_ttc || contrat.price_ttc
  const basePriceHT = Math.round((basePriceTTC / (1 + tvaRate / 100)) * 100) / 100
  const prixUnitHT = basePriceHT / nombreCars

  doc.text(`${nombreCars}`, 97, y)
  doc.text(`${formatAmount(prixUnitHT)} €`, 127, y)
  doc.text(`${tvaRate}%`, 157, y)
  doc.text(`${formatAmount(basePriceHT)} €`, pageWidth - 17, y, { align: 'right' })

  // Afficher les lignes d'options si présentes
  let totalOptionsHT = 0
  if (contrat.options_lignes && contrat.options_lignes.length > 0) {
    for (const opt of contrat.options_lignes) {
      y += 8
      const optionHT = Math.round((opt.montant / (1 + tvaRate / 100)) * 100) / 100
      totalOptionsHT += optionHT
      doc.text(opt.label, 17, y)
      doc.text('1', 97, y)
      doc.text(`${formatAmount(optionHT)} €`, 127, y)
      doc.text(`${tvaRate}%`, 157, y)
      doc.text(`${formatAmount(optionHT)} €`, pageWidth - 17, y, { align: 'right' })
    }
  }

  // Ligne séparatrice
  y += 8
  doc.setDrawColor(200, 200, 200)
  doc.line(15, y, pageWidth - 15, y)

  // ========== SECTION DÉTAILS TVA ==========
  y += 10
  // Vérifier si on a besoin d'une nouvelle page (section TVA + Récap ~ 80px)
  y = checkPageBreak(doc, y, 80, COMPANY_INFO)

  drawRect(doc, 15, y, pageWidth - 30, 8, grayBg)
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'bold')
  doc.text('DÉTAILS TVA', 17, y + 5.5)

  y += 14
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)

  // En-têtes TVA
  doc.setFont('helvetica', 'bold')
  doc.text('Taux TVA', 17, y)
  doc.text('Base HT', 70, y)
  doc.text('Montant TVA', 120, y)

  y += 6
  doc.setFont('helvetica', 'normal')
  doc.text(`${tvaRate}%`, 17, y)
  doc.text(`${formatAmount(priceHT)} €`, 70, y)
  doc.text(`${formatAmount(tvaAmount)} €`, 120, y)

  // ========== SECTION RÉCAPITULATIF ==========
  y += 15

  // Bloc récapitulatif aligné à droite
  const recapX = pageWidth - 95
  const recapWidth = 80

  drawRect(doc, recapX, y, recapWidth, 8, purpleDark)
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('RÉCAPITULATIF', recapX + 5, y + 5.5)

  y += 12
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'normal')

  // Total HT
  doc.text('Total HT', recapX + 5, y)
  doc.text(`${formatAmount(priceHT)} €`, recapX + recapWidth - 5, y, { align: 'right' })

  y += 6
  // Total TVA
  doc.text(`Total TVA (${tvaRate}%)`, recapX + 5, y)
  doc.text(`${formatAmount(tvaAmount)} €`, recapX + recapWidth - 5, y, { align: 'right' })

  y += 3
  doc.setDrawColor(200, 200, 200)
  doc.line(recapX + 5, y, recapX + recapWidth - 5, y)

  y += 7
  // Total TTC
  drawRect(doc, recapX, y - 4, recapWidth, 10, magenta)
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL TTC', recapX + 5, y + 2)
  doc.text(`${formatAmount(contrat.price_ttc)} €`, recapX + recapWidth - 5, y + 2, { align: 'right' })

  // Prix par personne/car
  y += 12
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  if (nombreCars > 1) {
    doc.text(`Soit ${formatAmount(contrat.price_ttc / nombreCars)} € TTC par car`, recapX + recapWidth - 5, y, { align: 'right' })
    y += 4
  }
  if (contrat.dossier?.passengers && contrat.dossier.passengers > 0) {
    doc.text(`Soit ${formatAmount(contrat.price_ttc / contrat.dossier.passengers)} € TTC par personne`, recapX + recapWidth - 5, y, { align: 'right' })
  }

  // ========== PAIEMENTS ==========
  const totalPaye = (contrat.paiements || []).reduce((sum, p) => sum + p.amount, 0)
  const resteARegler = contrat.price_ttc - totalPaye

  y += 15
  doc.setFontSize(9)
  doc.setTextColor(0, 128, 0)
  doc.setFont('helvetica', 'normal')
  doc.text('Déjà réglé :', recapX + 5, y)
  doc.text(`${formatAmount(totalPaye)} €`, recapX + recapWidth - 5, y, { align: 'right' })

  y += 6
  drawRect(doc, recapX, y - 4, recapWidth, 8, '#fef2f2')
  doc.setTextColor(185, 28, 28)
  doc.setFont('helvetica', 'bold')
  doc.text('Reste à régler :', recapX + 5, y)
  doc.text(`${formatAmount(resteARegler)} €`, recapX + recapWidth - 5, y, { align: 'right' })

  // ========== INFORMATIONS DE PAIEMENT ==========
  y += 20
  // Vérifier si on a besoin d'une nouvelle page (bloc paiement ~ 45px)
  y = checkPageBreak(doc, y, 45, COMPANY_INFO)

  // Cadre paiement
  doc.setDrawColor(88, 44, 135)
  doc.setLineWidth(0.5)
  doc.rect(15, y, pageWidth - 30, 35)

  drawRect(doc, 15, y, pageWidth - 30, 8, purpleLight)
  doc.setFontSize(9)
  doc.setTextColor(88, 44, 135)
  doc.setFont('helvetica', 'bold')
  doc.text('INFORMATIONS DE PAIEMENT', 20, y + 5.5)

  y += 14
  doc.setFontSize(8)
  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'normal')

  doc.setFont('helvetica', 'bold')
  doc.text('IBAN :', 20, y)
  doc.setFont('helvetica', 'normal')
  doc.text(COMPANY_INFO.rib.iban, 40, y)

  y += 5
  doc.setFont('helvetica', 'bold')
  doc.text('BIC :', 20, y)
  doc.setFont('helvetica', 'normal')
  doc.text(COMPANY_INFO.rib.bic, 40, y)

  y += 5
  doc.setFont('helvetica', 'bold')
  doc.text('Référence :', 20, y)
  doc.setFont('helvetica', 'normal')
  doc.text(contrat.reference, 50, y)

  // Modalités à droite du bloc paiement
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  const modalY = y - 10
  doc.text('Modalités : 30% à la réservation', 120, modalY)
  doc.text('Solde 45 jours avant le départ', 120, modalY + 4)
  doc.text('Paiement par CB ou virement', 120, modalY + 8)

  // ========== PAIEMENTS EFFECTUÉS ==========
  if (contrat.paiements && contrat.paiements.length > 0) {
    y += 15
    // Vérifier si on a besoin d'une nouvelle page
    y = checkPageBreak(doc, y, 10 + contrat.paiements.length * 4, COMPANY_INFO)
    doc.setFontSize(8)
    doc.setTextColor(21, 87, 36)
    doc.setFont('helvetica', 'bold')
    doc.text('Paiements effectués :', 20, y)
    doc.setFont('helvetica', 'normal')
    y += 5
    contrat.paiements.forEach((p, i) => {
      const typeLabel = p.type === 'cb' ? 'CB' : p.type === 'virement' ? 'Virement' : p.type
      doc.text(`• ${formatDate(p.payment_date)} - ${typeLabel} - ${formatAmount(p.amount)} €`, 25, y + (i * 4))
    })
    y += contrat.paiements.length * 4
  }

  // ========== CONDITIONS ANNULATION ==========
  y += 15
  // Vérifier si on a besoin d'une nouvelle page (conditions ~ 55px)
  y = checkPageBreak(doc, y, 55, COMPANY_INFO)

  drawRect(doc, 15, y - 4, pageWidth - 30, 7, '#fff3cd')
  doc.setFontSize(9)
  doc.setTextColor(133, 100, 4)
  doc.setFont('helvetica', 'bold')
  doc.text("Conditions d'annulation", 17, y)
  doc.setFont('helvetica', 'normal')

  y += 7
  doc.setFontSize(7)
  doc.setTextColor(60, 60, 60)
  // Texte d'introduction
  const conditionsIntroProforma = "La validation en ligne implique une acceptation totale de nos conditions générales de vente et donc des conditions d'annulation ci-dessous :"
  const introLinesProforma = doc.splitTextToSize(conditionsIntroProforma, pageWidth - 35)
  doc.text(introLinesProforma, 17, y)
  y += introLinesProforma.length * 3.5 + 3

  doc.setFontSize(8)
  const conditionsProforma = [
    '30% du prix du service si l\'annulation intervient à J-31 ou plus',
    '50% du prix du service si l\'annulation intervient entre J-30 et J-14',
    '70% du prix du service si l\'annulation intervient entre J-13 et J-8',
    '100% du prix du service si l\'annulation intervient à J-7 ou moins',
  ]
  conditionsProforma.forEach((c, i) => {
    doc.text(`• ${c}`, 17, y + (i * 4))
  })

  // ========== FOOTER ==========
  drawFooter(doc, COMPANY_INFO)

  doc.save(`Proforma_${contrat.reference}.pdf`)
}

// =============================================
// FACTURE PDF
// =============================================

interface FactureData {
  reference: string
  type: 'acompte' | 'solde' | 'avoir'
  amount_ht: number
  amount_ttc: number
  tva_rate?: number | null
  client_name?: string | null
  client_address?: string | null
  client_zip?: string | null
  client_city?: string | null
  created_at?: string | null
  nombre_cars?: number | null
  nombre_chauffeurs?: number | null
  // Prix de base du transfert (avant options) - pour affichage lignes séparées
  base_price_ttc?: number | null
  // Options sélectionnées (pour affichage en lignes séparées)
  options_lignes?: Array<{ label: string; montant: number }> | null
  dossier?: {
    reference: string
    departure?: string
    arrival?: string
    departure_date?: string
    passengers?: number
    client_name?: string
    client_email?: string
    nombre_cars?: number | null
    nombre_chauffeurs?: number | null
    total_ttc?: number | null
  } | null
  // Pour la facture de solde : référence à la facture d'acompte
  facture_acompte?: {
    reference: string
    amount_ttc: number
  } | null
}

export async function generateFacturePDF(facture: FactureData): Promise<void> {
  const COMPANY_INFO = await getCompanyInfo()
  const doc = new jsPDF({
    format: 'a4',
    orientation: 'portrait'
  })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const tvaRate = facture.tva_rate || 10
  const tvaAmount = facture.amount_ttc - facture.amount_ht

  // Couleurs Busmoov
  const purpleDark = '#582C87'
  const magenta = '#E91E8C'
  const purpleLight = '#f3e8ff'
  const grayBg = '#f8f9fa'

  // Déterminer le type de document
  const isAvoir = facture.type === 'avoir'
  const docTitle = isAvoir ? 'AVOIR' : 'FACTURE'
  const titleColor = isAvoir ? '#b42828' : purpleDark
  const accentColor = isAvoir ? '#b42828' : magenta

  // Récupérer nombre de cars et chauffeurs
  const nombreCars = facture.nombre_cars || facture.dossier?.nombre_cars || 1
  const nombreChauffeurs = facture.nombre_chauffeurs || facture.dossier?.nombre_chauffeurs || 1

  // ========== HEADER - Logo grand à gauche ==========
  await addLogoToPdf(doc, 15, 10, 50, 11)

  // Infos émetteur à droite
  let ey = 15
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'bold')
  doc.text(COMPANY_INFO.legalName, pageWidth - 15, ey, { align: 'right' })
  ey += 5
  doc.setFont('helvetica', 'normal')
  doc.text(COMPANY_INFO.address, pageWidth - 15, ey, { align: 'right' })
  ey += 4
  doc.text(COMPANY_INFO.zipCity, pageWidth - 15, ey, { align: 'right' })
  ey += 4
  doc.text(`Tél: ${COMPANY_INFO.phone}`, pageWidth - 15, ey, { align: 'right' })
  ey += 4
  doc.text(COMPANY_INFO.email, pageWidth - 15, ey, { align: 'right' })
  ey += 4
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`SIRET: ${COMPANY_INFO.siret}`, pageWidth - 15, ey, { align: 'right' })
  ey += 4
  doc.text(`TVA: ${COMPANY_INFO.tvaIntracom}`, pageWidth - 15, ey, { align: 'right' })

  // ========== TITRE FACTURE/AVOIR ==========
  let y = 55
  const titleRgb = hexToRgb(titleColor)
  doc.setFontSize(22)
  doc.setTextColor(titleRgb?.r || 88, titleRgb?.g || 44, titleRgb?.b || 135)
  doc.setFont('helvetica', 'bold')

  // Titre avec type de facture
  if (!isAvoir) {
    const typeLabel = facture.type === 'acompte' ? "D'ACOMPTE" : 'DE SOLDE'
    doc.text(`${docTitle} ${typeLabel}`, 15, y)
  } else {
    doc.text(docTitle, 15, y)
  }

  // Références
  y += 8
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'normal')
  doc.text(`N° ${facture.reference}`, 15, y)
  doc.text(`Date : ${formatDate(facture.created_at || new Date().toISOString())}`, 80, y)
  if (facture.dossier?.reference) {
    doc.text(`Dossier : ${facture.dossier.reference}`, 140, y)
  }

  // ========== BLOC CLIENT ==========
  y += 12
  // Cadre client avec bordure
  const clientBorderColor = hexToRgb(titleColor)
  doc.setDrawColor(clientBorderColor?.r || 88, clientBorderColor?.g || 44, clientBorderColor?.b || 135)
  doc.setLineWidth(0.5)
  doc.rect(15, y, 85, 32)

  // Header du bloc client
  drawRect(doc, 15, y, 85, 8, titleColor)
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURÉ À', 20, y + 5.5)

  // Contenu client
  let cy = y + 14
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  const clientName = facture.client_name || facture.dossier?.client_name || '-'
  doc.setFont('helvetica', 'bold')
  doc.text(clientName, 20, cy)
  cy += 5
  doc.setFont('helvetica', 'normal')
  if (facture.client_address) {
    doc.text(facture.client_address, 20, cy)
    cy += 5
  }
  if (facture.client_zip || facture.client_city) {
    doc.text(`${facture.client_zip || ''} ${facture.client_city || ''}`.trim(), 20, cy)
  }

  // ========== SECTION PRESTATION (tableau) ==========
  y += 42

  // Header Prestation
  drawRect(doc, 15, y, pageWidth - 30, 8, titleColor)
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('PRESTATION', 20, y + 5.5)

  y += 14

  // Type de facture (Acompte / Solde / Avoir)
  const factureTypeLabel = facture.type === 'acompte' ? 'ACOMPTE (30%)' : facture.type === 'solde' ? 'SOLDE' : 'AVOIR'

  doc.setFontSize(11)
  doc.setTextColor(233, 30, 140) // Magenta
  doc.setFont('helvetica', 'bold')
  doc.text(factureTypeLabel, 17, y)

  y += 10

  // Si on a les infos du dossier, afficher les détails du trajet
  if (facture.dossier) {
    // Description du trajet - Départ
    doc.setFontSize(9)
    doc.setTextColor(88, 44, 135) // Purple
    doc.setFont('helvetica', 'bold')
    doc.text('Départ', 17, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const departureTextFact = facture.dossier.departure || '-'
    const departureLinesFacture = doc.splitTextToSize(departureTextFact, 80)
    doc.text(departureLinesFacture, 45, y)
    y += departureLinesFacture.length * 4 + 4

    // Description du trajet - Arrivée
    doc.setTextColor(88, 44, 135) // Purple
    doc.setFont('helvetica', 'bold')
    doc.text('Arrivée', 17, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const arrivalTextFact = facture.dossier.arrival || '-'
    const arrivalLinesFacture = doc.splitTextToSize(arrivalTextFact, 80)
    doc.text(arrivalLinesFacture, 45, y)
    y += arrivalLinesFacture.length * 4 + 4

    // Date du voyage
    if (facture.dossier.departure_date) {
      doc.setTextColor(88, 44, 135) // Purple
      doc.setFont('helvetica', 'bold')
      doc.text('Date', 17, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(formatDate(facture.dossier.departure_date), 45, y)
      y += 6
    }

    // Ligne séparatrice légère
    doc.setDrawColor(220, 220, 220)
    doc.line(17, y, 100, y)
    y += 5

    // Informations véhicule et passagers en 2 colonnes
    doc.setFontSize(8)

    // Colonne gauche
    doc.setTextColor(100, 100, 100)
    doc.text('Passagers', 17, y)
    doc.setTextColor(0, 0, 0)
    doc.text(`${facture.dossier.passengers || '-'} personnes`, 50, y)

    // Colonne droite
    doc.setTextColor(100, 100, 100)
    doc.text('Véhicule', 100, y)
    doc.setTextColor(0, 0, 0)
    doc.text(`${nombreCars} autocar${nombreCars > 1 ? 's' : ''}`, 130, y)

    y += 5
    doc.setTextColor(100, 100, 100)
    doc.text('Chauffeurs', 17, y)
    doc.setTextColor(0, 0, 0)
    doc.text(`${nombreChauffeurs} chauffeur${nombreChauffeurs > 1 ? 's' : ''}`, 50, y)

    y += 8
  }

  // Ligne séparatrice
  doc.setDrawColor(200, 200, 200)
  doc.line(15, y, pageWidth - 15, y)
  y += 6

  // En-têtes du tableau de prix
  drawRect(doc, 15, y - 4, pageWidth - 30, 8, grayBg)
  doc.setFontSize(8)
  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'bold')
  doc.text('Désignation', 17, y)
  doc.text('Qté', 97, y)
  doc.text('Prix Unit. HT', 127, y)
  doc.text('TVA', 157, y)
  doc.text('Total HT', pageWidth - 17, y, { align: 'right' })

  // Ligne de données
  y += 10
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  // Si on a des options, afficher les lignes séparées
  const hasOptions = facture.options_lignes && facture.options_lignes.length > 0 && facture.base_price_ttc

  if (hasOptions && facture.base_price_ttc) {
    // Calculer les montants proportionnels (30% ou 70%)
    const ratio = facture.type === 'acompte' ? 0.3 : facture.type === 'solde' ? 0.7 : 1

    // Ligne 1: Transport
    const basePriceHT = Math.round((facture.base_price_ttc / (1 + tvaRate / 100)) * 100) / 100
    const transportHT = Math.round(basePriceHT * ratio * 100) / 100
    const prixUnitTransportHT = transportHT / nombreCars
    const displayTransportHT = isAvoir ? `-${formatAmount(Math.abs(prixUnitTransportHT))}` : formatAmount(prixUnitTransportHT)
    const displayTotalTransportHT = isAvoir ? `-${formatAmount(Math.abs(transportHT))}` : formatAmount(transportHT)

    const prefixLabel = facture.type === 'acompte' ? 'Acompte 30% - ' : facture.type === 'solde' ? 'Solde 70% - ' : isAvoir ? 'Avoir - ' : ''
    doc.setFontSize(8)
    doc.text(`${prefixLabel}Transport autocar`, 17, y)
    doc.text(`${nombreCars}`, 97, y)
    doc.text(`${displayTransportHT} €`, 127, y)
    doc.text(`${tvaRate}%`, 157, y)
    doc.text(`${displayTotalTransportHT} €`, pageWidth - 17, y, { align: 'right' })

    // Lignes options
    for (const opt of facture.options_lignes!) {
      y += 8
      const optHT = Math.round((opt.montant / (1 + tvaRate / 100)) * ratio * 100) / 100
      const displayOptHT = isAvoir ? `-${formatAmount(Math.abs(optHT))}` : formatAmount(optHT)
      doc.text(`${prefixLabel}${opt.label}`, 17, y)
      doc.text('1', 97, y)
      doc.text(`${displayOptHT} €`, 127, y)
      doc.text(`${tvaRate}%`, 157, y)
      doc.text(`${displayOptHT} €`, pageWidth - 17, y, { align: 'right' })
    }
  } else {
    // Affichage classique sans options
    let trajetDescFacture = 'Prestation de transport autocar'
    if (facture.type === 'acompte') {
      const totalTTC = facture.dossier?.total_ttc
      if (totalTTC) {
        trajetDescFacture = `Acompte 30% - Transport autocar (Total TTC : ${formatAmount(totalTTC)} €)`
      } else {
        trajetDescFacture = 'Acompte 30% - Transport autocar'
      }
    } else if (facture.type === 'solde') {
      if (facture.facture_acompte) {
        trajetDescFacture = `Solde 70% - Transport autocar (Acompte ${facture.facture_acompte.reference} : ${formatAmount(facture.facture_acompte.amount_ttc)} € TTC)`
      } else {
        trajetDescFacture = 'Solde 70% - Transport autocar'
      }
    } else if (isAvoir) {
      trajetDescFacture = 'Avoir - Transport autocar'
    }

    doc.setFontSize(8)
    doc.text(trajetDescFacture, 17, y)

    const prixUnitHT = facture.amount_ht / nombreCars
    const displayHT = isAvoir ? `-${formatAmount(Math.abs(prixUnitHT))}` : formatAmount(prixUnitHT)
    const displayTotalHT = isAvoir ? `-${formatAmount(Math.abs(facture.amount_ht))}` : formatAmount(facture.amount_ht)

    doc.text(`${nombreCars}`, 97, y)
    doc.text(`${displayHT} €`, 127, y)
    doc.text(`${tvaRate}%`, 157, y)
    doc.text(`${displayTotalHT} €`, pageWidth - 17, y, { align: 'right' })
  }

  // Ligne séparatrice
  y += 8
  doc.setDrawColor(200, 200, 200)
  doc.line(15, y, pageWidth - 15, y)

  // ========== SECTION DÉTAILS TVA ==========
  y += 10
  // Vérifier si on a besoin d'une nouvelle page (section TVA + Récap ~ 80px)
  y = checkPageBreak(doc, y, 80, COMPANY_INFO)

  drawRect(doc, 15, y, pageWidth - 30, 8, grayBg)
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'bold')
  doc.text('DÉTAILS TVA', 17, y + 5.5)

  y += 14
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)

  // En-têtes TVA
  doc.setFont('helvetica', 'bold')
  doc.text('Taux TVA', 17, y)
  doc.text('Base HT', 70, y)
  doc.text('Montant TVA', 120, y)

  y += 6
  doc.setFont('helvetica', 'normal')
  const displayBaseHT = isAvoir ? `-${formatAmount(Math.abs(facture.amount_ht))}` : formatAmount(facture.amount_ht)
  const displayTVA = isAvoir ? `-${formatAmount(Math.abs(tvaAmount))}` : formatAmount(tvaAmount)
  doc.text(`${tvaRate}%`, 17, y)
  doc.text(`${displayBaseHT} €`, 70, y)
  doc.text(`${displayTVA} €`, 120, y)

  // ========== SECTION RÉCAPITULATIF ==========
  y += 15

  // Bloc récapitulatif aligné à droite
  const recapX = pageWidth - 95
  const recapWidth = 80

  drawRect(doc, recapX, y, recapWidth, 8, titleColor)
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('RÉCAPITULATIF', recapX + 5, y + 5.5)

  y += 12
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'normal')

  // Total HT
  doc.text('Total HT', recapX + 5, y)
  doc.text(`${displayBaseHT} €`, recapX + recapWidth - 5, y, { align: 'right' })

  y += 6
  // Total TVA
  doc.text(`Total TVA (${tvaRate}%)`, recapX + 5, y)
  doc.text(`${displayTVA} €`, recapX + recapWidth - 5, y, { align: 'right' })

  y += 3
  doc.setDrawColor(200, 200, 200)
  doc.line(recapX + 5, y, recapX + recapWidth - 5, y)

  y += 7
  // Total TTC
  drawRect(doc, recapX, y - 4, recapWidth, 10, accentColor)
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL TTC', recapX + 5, y + 2)
  const displayTTC = isAvoir ? `-${formatAmount(Math.abs(facture.amount_ttc))}` : formatAmount(facture.amount_ttc)
  doc.text(`${displayTTC} €`, recapX + recapWidth - 5, y + 2, { align: 'right' })

  // Prix par personne/car
  if (!isAvoir) {
    y += 12
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    if (nombreCars > 1) {
      doc.text(`Soit ${formatAmount(facture.amount_ttc / nombreCars)} € TTC par car`, recapX + recapWidth - 5, y, { align: 'right' })
      y += 4
    }
    if (facture.dossier?.passengers && facture.dossier.passengers > 0) {
      doc.text(`Soit ${formatAmount(facture.amount_ttc / facture.dossier.passengers)} € TTC par personne`, recapX + recapWidth - 5, y, { align: 'right' })
    }
  }

  // ========== INFORMATIONS DE PAIEMENT (sauf pour avoir) ==========
  if (!isAvoir) {
    y += 20
    // Vérifier si on a besoin d'une nouvelle page (bloc paiement ~ 40px)
    y = checkPageBreak(doc, y, 40, COMPANY_INFO)

    // Cadre paiement
    doc.setDrawColor(88, 44, 135)
    doc.setLineWidth(0.5)
    doc.rect(15, y, pageWidth - 30, 30)

    drawRect(doc, 15, y, pageWidth - 30, 8, purpleLight)
    doc.setFontSize(9)
    doc.setTextColor(88, 44, 135)
    doc.setFont('helvetica', 'bold')
    doc.text('INFORMATIONS DE PAIEMENT', 20, y + 5.5)

    y += 14
    doc.setFontSize(8)
    doc.setTextColor(60, 60, 60)
    doc.setFont('helvetica', 'normal')

    doc.setFont('helvetica', 'bold')
    doc.text('IBAN :', 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(COMPANY_INFO.rib.iban, 40, y)

    y += 5
    doc.setFont('helvetica', 'bold')
    doc.text('BIC :', 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(COMPANY_INFO.rib.bic, 40, y)

    y += 5
    doc.setFont('helvetica', 'bold')
    doc.text('Référence :', 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(facture.reference, 50, y)
  }

  // ========== FOOTER ==========
  drawFooter(doc, COMPANY_INFO)

  const prefix = facture.type === 'acompte' ? 'Facture_Acompte' : facture.type === 'solde' ? 'Facture_Solde' : 'Avoir'
  doc.save(`${prefix}_${facture.reference}.pdf`)
}

// =============================================
// FEUILLE DE ROUTE PDF (Design Compact)
// =============================================

interface FeuilleRouteData {
  reference: string
  dossier_reference?: string | null
  type: 'aller' | 'retour' | 'aller_retour'
  client_name?: string | null
  client_phone?: string | null
  // Aller
  aller_date?: string | null
  aller_heure?: string | null
  aller_adresse_depart?: string | null
  aller_adresse_arrivee?: string | null
  aller_passagers?: number | null
  chauffeur_aller_nom?: string | null
  chauffeur_aller_tel?: string | null
  chauffeur_aller_immatriculation?: string | null
  // Retour
  retour_date?: string | null
  retour_heure?: string | null
  retour_adresse_depart?: string | null
  retour_adresse_arrivee?: string | null
  retour_passagers?: number | null
  chauffeur_retour_nom?: string | null
  chauffeur_retour_tel?: string | null
  chauffeur_retour_immatriculation?: string | null
  // Contact sur place
  contact_nom?: string | null
  contact_prenom?: string | null
  contact_tel?: string | null
  contact_email?: string | null
  // Notes
  commentaires?: string | null
  luggage_type?: string | null
  // Astreinte
  astreinte_tel?: string | null
  // Options incluses/non incluses
  options_incluses?: string[] | null
  options_non_incluses?: string[] | null
}

export async function generateFeuilleRoutePDF(data: FeuilleRouteData): Promise<void> {
  const COMPANY_INFO = await getCompanyInfo()
  const doc = new jsPDF({
    format: 'a4',
    orientation: 'portrait'
  })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Couleurs Busmoov
  const purpleDark = '#582C87' // Violet foncé Busmoov
  const magenta = '#E91E8C' // Magenta Busmoov
  const grayText = [80, 80, 80]

  // ========== HEADER ==========
  // Logo Busmoov à gauche (contient déjà le nom)
  await addLogoToPdf(doc, 15, 8, 50, 11)

  // Titre FEUILLE DE ROUTE (côté droit)
  doc.setFontSize(16)
  doc.setTextColor(88, 44, 135) // Purple dark
  doc.setFont('helvetica', 'bold')
  doc.text('FEUILLE DE ROUTE', pageWidth / 2 + 20, 15, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Devis ${data.reference} - Dossier ${data.dossier_reference || ''}`, pageWidth / 2 + 20, 22, { align: 'center' })

  let y = 40

  // ========== TYPE DE TRAJET ==========
  // Vérifier si c'est vraiment un aller/retour (avec date de retour)
  const isRealAllerRetour = data.type === 'aller_retour' && data.retour_date

  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  const typeLabel = isRealAllerRetour ? 'Transfert Aller/Retour' : data.type === 'retour' ? 'Transfert Retour' : 'Transfert Aller'
  doc.text(typeLabel, pageWidth / 2, y, { align: 'center' })

  y += 8
  // Passagers
  const paxAller = data.aller_passagers || '-'
  const paxRetour = data.retour_passagers || '-'
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  if (isRealAllerRetour) {
    doc.text(`${paxAller} passagers à l'aller / ${paxRetour} passagers au retour`, pageWidth / 2, y, { align: 'center' })
  } else if (data.type === 'retour') {
    doc.text(`${paxRetour} passagers`, pageWidth / 2, y, { align: 'center' })
  } else {
    doc.text(`${paxAller} passagers`, pageWidth / 2, y, { align: 'center' })
  }

  y += 15

  // ========== COLONNES ALLER / RETOUR ==========
  const colWidth = (pageWidth - 40) / 2
  const colLeftX = 15
  const colRightX = pageWidth / 2 + 5

  // Fonction pour dessiner une colonne de trajet avec chauffeur
  const drawTrajetColumnWithChauffeur = (
    startX: number,
    startY: number,
    title: string,
    titleColor: string,
    chauffeurNom: string | null | undefined,
    chauffeurTel: string | null | undefined,
    date: string | null | undefined,
    heure: string | null | undefined,
    depart: string | null | undefined,
    arrivee: string | null | undefined
  ) => {
    let colY = startY

    // Header avec titre
    const rgb = hexToRgb(titleColor)
    if (rgb) doc.setFillColor(rgb.r, rgb.g, rgb.b)
    doc.rect(startX, colY, colWidth, 8, 'F')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text(title, startX + 5, colY + 5.5)

    colY += 14

    // Contact chauffeur (en magenta Busmoov)
    doc.setFontSize(9)
    doc.setTextColor(233, 30, 140) // Magenta Busmoov
    doc.setFont('helvetica', 'bold')
    doc.text('Contact chauffeur ' + title.toLowerCase().replace('transfert ', ''), startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    const chauffeurInfo = chauffeurNom ? `${chauffeurNom} ${chauffeurTel || ''}` : '-'
    doc.text(chauffeurInfo, startX, colY)

    colY += 10
    // Date de départ
    doc.setTextColor(88, 44, 135) // Purple Busmoov
    doc.text('Date de départ', startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    doc.text(date ? formatDate(date) : '-', startX, colY)

    colY += 10
    // Heure de départ
    doc.setTextColor(88, 44, 135) // Purple Busmoov
    doc.text('Heure de départ', startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    doc.text(heure || '-', startX, colY)

    colY += 10
    // Lieu de départ
    doc.setTextColor(88, 44, 135) // Purple Busmoov
    doc.text('Lieu de départ', startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    const departLines = doc.splitTextToSize(depart || 'Non renseigné', colWidth - 5)
    doc.text(departLines, startX, colY)
    colY += departLines.length * 4 + 4

    // Lieu de destination
    doc.setTextColor(88, 44, 135) // Purple Busmoov
    doc.text('Lieu de destination', startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    const arriveeLines = doc.splitTextToSize(arrivee || 'Non renseigné', colWidth - 5)
    doc.text(arriveeLines, startX, colY)
    colY += arriveeLines.length * 4

    return colY
  }

  // Dessiner les colonnes
  // Vérifier si le retour existe vraiment (date de retour renseignée)
  const hasRetour = data.type === 'aller_retour' && data.retour_date
  const hasAller = data.type === 'aller' || data.type === 'aller_retour'
  const isRetourOnly = data.type === 'retour'

  let maxY = y
  if (hasAller || isRetourOnly) {
    // Si c'est un aller simple ou aller/retour, afficher l'aller
    // Si c'est retour seul, afficher le retour dans la colonne de gauche
    if (hasAller) {
      const endY = drawTrajetColumnWithChauffeur(
        colLeftX, y, 'Transfert aller', purpleDark,
        data.chauffeur_aller_nom, data.chauffeur_aller_tel,
        data.aller_date, data.aller_heure,
        data.aller_adresse_depart, data.aller_adresse_arrivee
      )
      maxY = Math.max(maxY, endY)
    } else if (isRetourOnly) {
      const endY = drawTrajetColumnWithChauffeur(
        colLeftX, y, 'Transfert retour', purpleDark,
        data.chauffeur_retour_nom, data.chauffeur_retour_tel,
        data.retour_date, data.retour_heure,
        data.retour_adresse_depart, data.retour_adresse_arrivee
      )
      maxY = Math.max(maxY, endY)
    }
  }

  // N'afficher la colonne retour que si c'est un vrai aller/retour avec date de retour
  if (hasRetour) {
    const endY = drawTrajetColumnWithChauffeur(
      colRightX, y, 'Transfert retour', purpleDark,
      data.chauffeur_retour_nom, data.chauffeur_retour_tel,
      data.retour_date, data.retour_heure,
      data.retour_adresse_depart, data.retour_adresse_arrivee
    )
    maxY = Math.max(maxY, endY)
  }

  y = maxY + 15

  // ========== OPTIONS INCLUSES / NON INCLUSES ==========
  const optColWidth = (pageWidth - 40) / 2

  // Colonne gauche - Votre contrat comprend
  doc.setFontSize(10)
  doc.setTextColor(88, 44, 135) // Purple Busmoov
  doc.setFont('helvetica', 'bold')
  doc.text('Votre contrat comprend', colLeftX, y)
  drawLine(doc, y + 2, colLeftX, colLeftX + optColWidth - 10)

  // Colonne droite - Votre contrat ne comprend pas
  doc.text('Votre contrat ne comprend pas', colRightX, y)
  drawLine(doc, y + 2, colRightX, colRightX + optColWidth - 10)

  y += 10
  doc.setFontSize(9)
  doc.setTextColor(grayText[0], grayText[1], grayText[2])
  doc.setFont('helvetica', 'normal')

  // Options incluses
  const incluses = data.options_incluses || []
  incluses.forEach((opt, i) => {
    doc.text(opt, colLeftX, y + i * 5)
  })

  // Options non incluses
  const nonIncluses = data.options_non_incluses || ['Kilomètres supplémentaires', 'Heures supplémentaires']
  nonIncluses.forEach((opt, i) => {
    doc.text(opt, colRightX, y + i * 5)
  })

  y += Math.max(incluses.length, nonIncluses.length) * 5 + 10

  // ========== INFORMATIONS COMPLÉMENTAIRES ==========
  doc.setFontSize(11)
  doc.setTextColor(88, 44, 135) // Purple Busmoov
  doc.setFont('helvetica', 'bold')
  doc.text('Informations complémentaires', 15, y)
  y += 8

  doc.setFontSize(9)
  doc.setTextColor(grayText[0], grayText[1], grayText[2])
  doc.setFont('helvetica', 'normal')

  // Type de bagage
  doc.setFont('helvetica', 'bold')
  doc.text('Type de bagage : ', 15, y)
  doc.setFont('helvetica', 'normal')
  const bagageFeuille = data.luggage_type || 'Pas de bagage'
  doc.text(bagageFeuille, 45, y)

  // Commentaires
  if (data.commentaires) {
    y += 8
    const commentLines = doc.splitTextToSize(data.commentaires, pageWidth - 30)
    doc.text(commentLines.slice(0, 3), 15, y)
    y += commentLines.slice(0, 3).length * 4
  }

  // ========== NUMÉRO D'ASTREINTE ==========
  y += 15
  doc.setFontSize(10)
  doc.setTextColor(233, 30, 140) // Magenta Busmoov
  doc.setFont('helvetica', 'bold')
  const astreinteTel = data.astreinte_tel || COMPANY_INFO.phone
  doc.text(`En cas d'urgence contacter le ${astreinteTel}.`, pageWidth / 2, y, { align: 'center' })

  // ========== PAGE 2 - RAPPEL LÉGISLATION ==========
  doc.addPage()

  y = 20
  doc.setFontSize(11)
  doc.setTextColor(88, 44, 135) // Purple Busmoov
  doc.setFont('helvetica', 'bold')
  doc.text('Rappel de la législation', 15, y)
  drawLine(doc, y + 2, 15, pageWidth - 15)

  y += 15
  doc.setFontSize(9)
  doc.setTextColor(grayText[0], grayText[1], grayText[2])

  const legislation = [
    { title: 'Amplitude', text: '12h pour un conducteur et 18h pour deux conducteurs en double équipage' },
    { title: 'Temps de conduite', text: '9h de conduite pour un conducteur par jour.' },
    { title: 'Coupure', text: 'une coupure de 45 min toutes les 4h30 de conduite.\nDe 21h à 06h (heures de nuit) les coupures ont lieu toutes les 4h de conduite.' },
    { title: 'Repos', text: '1 jour de repos obligatoire sur place pour les voyages de plus de 6 jours.' },
  ]

  legislation.forEach(item => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(88, 44, 135) // Purple Busmoov
    doc.text(item.title, 20, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(grayText[0], grayText[1], grayText[2])
    const lines = doc.splitTextToSize(item.text, pageWidth - 40)
    doc.text(lines, 20, y)
    y += lines.length * 5 + 8
  })

  // Message de remerciement
  y += 20
  doc.setFontSize(14)
  doc.setTextColor(0, 51, 102)
  doc.setFont('helvetica', 'bold')
  doc.text('Merci !', pageWidth / 2, y, { align: 'center' })
  y += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(grayText[0], grayText[1], grayText[2])
  doc.text(`L'équipe de ${COMPANY_INFO.name} vous souhaite un excellent voyage`, pageWidth / 2, y, { align: 'center' })

  // ========== FOOTER PAGE 2 ==========
  const footerY2 = pageHeight - 20
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.text(
    `${COMPANY_INFO.legalName} - SIRET: ${COMPANY_INFO.siret} - RCS ${COMPANY_INFO.rcs} - TVA: ${COMPANY_INFO.tvaIntracom}`,
    pageWidth / 2,
    footerY2,
    { align: 'center' }
  )
  doc.text(
    `${COMPANY_INFO.address}, ${COMPANY_INFO.zipCity} - Tel ${COMPANY_INFO.phone}`,
    pageWidth / 2,
    footerY2 + 5,
    { align: 'center' }
  )

  // Nom du fichier
  const clientNameForFile = data.client_name?.replace(/[^a-zA-Z0-9]/g, '-') || 'client'
  doc.save(`FEUILLE-DE-ROUTE-${data.reference}.pdf`)
}

// Version qui retourne le PDF en base64 pour envoi par email
export async function generateFeuilleRoutePDFBase64(data: FeuilleRouteData): Promise<{ base64: string; filename: string }> {
  const COMPANY_INFO = await getCompanyInfo()
  const doc = new jsPDF({
    format: 'a4',
    orientation: 'portrait'
  })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const purpleDark = '#582C87'
  const magenta = '#E91E8C'
  const grayText = [80, 80, 80]

  // HEADER
  await addLogoToPdf(doc, 15, 8, 50, 11)
  doc.setFontSize(16)
  doc.setTextColor(88, 44, 135)
  doc.setFont('helvetica', 'bold')
  doc.text('FEUILLE DE ROUTE', pageWidth / 2 + 20, 15, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Devis ${data.reference} - Dossier ${data.dossier_reference || ''}`, pageWidth / 2 + 20, 22, { align: 'center' })

  let y = 40

  // TYPE DE TRAJET
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  const typeLabel = data.type === 'aller_retour' ? 'Transfert Aller/Retour' : data.type === 'aller' ? 'Transfert Aller' : 'Transfert Retour'
  doc.text(typeLabel, pageWidth / 2, y, { align: 'center' })

  y += 8
  const paxAller = data.aller_passagers || '-'
  const paxRetour = data.retour_passagers || '-'
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  if (data.type === 'aller_retour') {
    doc.text(`${paxAller} passagers à l'aller / ${paxRetour} passagers au retour`, pageWidth / 2, y, { align: 'center' })
  } else if (data.type === 'aller') {
    doc.text(`${paxAller} passagers`, pageWidth / 2, y, { align: 'center' })
  } else {
    doc.text(`${paxRetour} passagers`, pageWidth / 2, y, { align: 'center' })
  }

  y += 15

  const colWidth = (pageWidth - 40) / 2
  const colLeftX = 15
  const colRightX = pageWidth / 2 + 5

  const drawTrajetColumnWithChauffeur = (
    startX: number, startY: number, title: string, titleColor: string,
    chauffeurNom: string | null | undefined, chauffeurTel: string | null | undefined,
    date: string | null | undefined, heure: string | null | undefined,
    depart: string | null | undefined, arrivee: string | null | undefined
  ) => {
    let colY = startY
    const rgb = hexToRgb(titleColor)
    if (rgb) doc.setFillColor(rgb.r, rgb.g, rgb.b)
    doc.rect(startX, colY, colWidth, 8, 'F')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text(title, startX + 5, colY + 5.5)
    colY += 14

    doc.setFontSize(9)
    doc.setTextColor(233, 30, 140)
    doc.setFont('helvetica', 'bold')
    doc.text('Contact chauffeur ' + title.toLowerCase().replace('transfert ', ''), startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    const chauffeurInfo = chauffeurNom ? `${chauffeurNom} ${chauffeurTel || ''}` : '-'
    doc.text(chauffeurInfo, startX, colY)
    colY += 10

    doc.setTextColor(88, 44, 135)
    doc.text('Date de départ', startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    doc.text(date ? formatDate(date) : '-', startX, colY)
    colY += 10

    doc.setTextColor(88, 44, 135)
    doc.text('Heure de départ', startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    doc.text(heure || '-', startX, colY)
    colY += 10

    doc.setTextColor(88, 44, 135)
    doc.text('Lieu de départ', startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    const departLines = doc.splitTextToSize(depart || 'Non renseigné', colWidth - 5)
    doc.text(departLines, startX, colY)
    colY += departLines.length * 4 + 4

    doc.setTextColor(88, 44, 135)
    doc.text('Lieu de destination', startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    const arriveeLines = doc.splitTextToSize(arrivee || 'Non renseigné', colWidth - 5)
    doc.text(arriveeLines, startX, colY)
    colY += arriveeLines.length * 4

    return colY
  }

  let maxY = y
  if (data.type === 'aller' || data.type === 'aller_retour') {
    const endY = drawTrajetColumnWithChauffeur(
      colLeftX, y, 'Transfert aller', purpleDark,
      data.chauffeur_aller_nom, data.chauffeur_aller_tel,
      data.aller_date, data.aller_heure,
      data.aller_adresse_depart, data.aller_adresse_arrivee
    )
    maxY = Math.max(maxY, endY)
  }

  if (data.type === 'retour' || data.type === 'aller_retour') {
    const endY = drawTrajetColumnWithChauffeur(
      colRightX, y, 'Transfert retour', purpleDark,
      data.chauffeur_retour_nom, data.chauffeur_retour_tel,
      data.retour_date, data.retour_heure,
      data.retour_adresse_depart, data.retour_adresse_arrivee
    )
    maxY = Math.max(maxY, endY)
  }

  y = maxY + 15

  // OPTIONS
  const optColWidth = (pageWidth - 40) / 2
  doc.setFontSize(10)
  doc.setTextColor(88, 44, 135)
  doc.setFont('helvetica', 'bold')
  doc.text('Votre contrat comprend', colLeftX, y)
  drawLine(doc, y + 2, colLeftX, colLeftX + optColWidth - 10)
  doc.text('Votre contrat ne comprend pas', colRightX, y)
  drawLine(doc, y + 2, colRightX, colRightX + optColWidth - 10)

  y += 10
  doc.setFontSize(9)
  doc.setTextColor(grayText[0], grayText[1], grayText[2])
  doc.setFont('helvetica', 'normal')

  const incluses = data.options_incluses || []
  incluses.forEach((opt, i) => { doc.text(opt, colLeftX, y + i * 5) })

  const nonIncluses = data.options_non_incluses || ['Kilomètres supplémentaires', 'Heures supplémentaires']
  nonIncluses.forEach((opt, i) => { doc.text(opt, colRightX, y + i * 5) })

  y += Math.max(incluses.length, nonIncluses.length) * 5 + 10

  // INFOS COMPLEMENTAIRES
  doc.setFontSize(11)
  doc.setTextColor(88, 44, 135)
  doc.setFont('helvetica', 'bold')
  doc.text('Informations complémentaires', 15, y)
  y += 8

  doc.setFontSize(9)
  doc.setTextColor(grayText[0], grayText[1], grayText[2])
  doc.setFont('helvetica', 'normal')
  doc.setFont('helvetica', 'bold')
  doc.text('Type de bagage : ', 15, y)
  doc.setFont('helvetica', 'normal')
  const bagageFeuille = data.luggage_type || 'Pas de bagage'
  doc.text(bagageFeuille, 45, y)

  if (data.commentaires) {
    y += 8
    const commentLines = doc.splitTextToSize(data.commentaires, pageWidth - 30)
    doc.text(commentLines.slice(0, 3), 15, y)
    y += commentLines.slice(0, 3).length * 4
  }

  // ASTREINTE
  y += 15
  doc.setFontSize(10)
  doc.setTextColor(233, 30, 140)
  doc.setFont('helvetica', 'bold')
  const astreinteTel = data.astreinte_tel || COMPANY_INFO.phone
  doc.text(`En cas d'urgence contacter le ${astreinteTel}.`, pageWidth / 2, y, { align: 'center' })

  // PAGE 2 - LEGISLATION
  doc.addPage()
  y = 20
  doc.setFontSize(11)
  doc.setTextColor(88, 44, 135)
  doc.setFont('helvetica', 'bold')
  doc.text('Rappel de la législation', 15, y)
  drawLine(doc, y + 2, 15, pageWidth - 15)

  y += 15
  doc.setFontSize(9)
  doc.setTextColor(grayText[0], grayText[1], grayText[2])

  const legislation = [
    { title: 'Amplitude', text: '12h pour un conducteur et 18h pour deux conducteurs en double équipage' },
    { title: 'Temps de conduite', text: '9h de conduite pour un conducteur par jour.' },
    { title: 'Coupure', text: 'une coupure de 45 min toutes les 4h30 de conduite.\nDe 21h à 06h (heures de nuit) les coupures ont lieu toutes les 4h de conduite.' },
    { title: 'Repos', text: '1 jour de repos obligatoire sur place pour les voyages de plus de 6 jours.' },
  ]

  legislation.forEach(item => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(88, 44, 135)
    doc.text(item.title, 20, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(grayText[0], grayText[1], grayText[2])
    const lines = doc.splitTextToSize(item.text, pageWidth - 40)
    doc.text(lines, 20, y)
    y += lines.length * 5 + 8
  })

  y += 20
  doc.setFontSize(14)
  doc.setTextColor(0, 51, 102)
  doc.setFont('helvetica', 'bold')
  doc.text('Merci !', pageWidth / 2, y, { align: 'center' })
  y += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(grayText[0], grayText[1], grayText[2])
  doc.text(`L'équipe de ${COMPANY_INFO.name} vous souhaite un excellent voyage`, pageWidth / 2, y, { align: 'center' })

  // FOOTER PAGE 2
  const footerY2 = pageHeight - 20
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.text(
    `${COMPANY_INFO.legalName} - SIRET: ${COMPANY_INFO.siret} - RCS ${COMPANY_INFO.rcs} - TVA: ${COMPANY_INFO.tvaIntracom}`,
    pageWidth / 2, footerY2, { align: 'center' }
  )
  doc.text(
    `${COMPANY_INFO.address}, ${COMPANY_INFO.zipCity} - Tel ${COMPANY_INFO.phone}`,
    pageWidth / 2, footerY2 + 5, { align: 'center' }
  )

  const filename = `FEUILLE-DE-ROUTE-${data.reference}.pdf`
  const base64 = doc.output('datauristring').split(',')[1]
  return { base64, filename }
}

// Interface pour les données du PDF Infos Voyage
interface InfosVoyageData {
  reference: string
  dossier_reference?: string | null
  client_name?: string | null
  client_phone?: string | null
  // Type de trajet
  type: 'aller' | 'retour' | 'aller_retour'
  // Aller
  aller_date?: string | null
  aller_heure?: string | null
  aller_passagers?: number | null
  aller_adresse_depart?: string | null
  aller_adresse_arrivee?: string | null
  // Retour
  retour_date?: string | null
  retour_heure?: string | null
  retour_passagers?: number | null
  retour_adresse_depart?: string | null
  retour_adresse_arrivee?: string | null
  // Contact sur place
  contact_nom?: string | null
  contact_prenom?: string | null
  contact_tel?: string | null
  contact_email?: string | null
  // Notes
  commentaires?: string | null
  luggage_type?: string | null
  // Date validation
  validated_at?: string | null
}

export async function generateInfosVoyagePDF(data: InfosVoyageData): Promise<void> {
  const COMPANY_INFO = await getCompanyInfo()
  const doc = new jsPDF({
    format: 'a4',
    orientation: 'portrait'
  })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Couleurs Busmoov
  const purpleDark = '#582C87' // Violet foncé Busmoov
  const magenta = '#E91E8C' // Magenta Busmoov
  const grayText = [80, 80, 80]

  // ========== HEADER ==========
  // Logo Busmoov à gauche (contient déjà le nom)
  await addLogoToPdf(doc, 15, 8, 50, 11)

  // Titre INFORMATIONS VOYAGE (côté droit)
  doc.setFontSize(16)
  doc.setTextColor(88, 44, 135) // Purple Busmoov
  doc.setFont('helvetica', 'bold')
  doc.text('INFORMATIONS VOYAGE', pageWidth / 2 + 20, 15, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Devis ${data.reference} - Dossier ${data.dossier_reference || ''}`, pageWidth / 2 + 20, 22, { align: 'center' })

  let y = 40

  // ========== TYPE DE TRAJET ==========
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  const typeLabel = data.type === 'aller_retour' ? 'Transfert Aller/Retour' : data.type === 'aller' ? 'Transfert Aller' : 'Transfert Retour'
  doc.text(typeLabel, pageWidth / 2, y, { align: 'center' })

  y += 8
  // Passagers
  const paxAller = data.aller_passagers || '-'
  const paxRetour = data.retour_passagers || '-'
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  if (data.type === 'aller_retour') {
    doc.text(`${paxAller} passagers à l'aller / ${paxRetour} passagers au retour`, pageWidth / 2, y, { align: 'center' })
  } else if (data.type === 'aller') {
    doc.text(`${paxAller} passagers`, pageWidth / 2, y, { align: 'center' })
  } else {
    doc.text(`${paxRetour} passagers`, pageWidth / 2, y, { align: 'center' })
  }

  y += 15

  // ========== COLONNES ALLER / RETOUR ==========
  const colWidth = (pageWidth - 40) / 2
  const colLeftX = 15
  const colRightX = pageWidth / 2 + 5

  // Fonction pour dessiner une colonne de trajet
  const drawTrajetColumn = (
    startX: number,
    startY: number,
    title: string,
    titleColor: string,
    date: string | null | undefined,
    heure: string | null | undefined,
    depart: string | null | undefined,
    arrivee: string | null | undefined,
    contactNom: string | null | undefined,
    contactTel: string | null | undefined
  ) => {
    let colY = startY

    // Header avec titre
    const rgb = hexToRgb(titleColor)
    if (rgb) doc.setFillColor(rgb.r, rgb.g, rgb.b)
    doc.rect(startX, colY, colWidth, 8, 'F')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text(title, startX + 5, colY + 5.5)

    colY += 14

    // Date de départ
    doc.setFontSize(9)
    doc.setTextColor(88, 44, 135) // Purple Busmoov
    doc.setFont('helvetica', 'normal')
    doc.text('Date de départ', startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    doc.text(date ? formatDate(date) : '-', startX, colY)

    colY += 10
    // Heure de départ
    doc.setTextColor(88, 44, 135) // Purple Busmoov
    doc.text('Heure de départ', startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    doc.text(heure || '-', startX, colY)

    colY += 10
    // Lieu de départ
    doc.setTextColor(88, 44, 135) // Purple Busmoov
    doc.text('Lieu de départ', startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    const departLines = doc.splitTextToSize(depart || 'Non renseigné', colWidth - 5)
    doc.text(departLines, startX, colY)
    colY += departLines.length * 4 + 4

    // Lieu de destination
    doc.setTextColor(88, 44, 135) // Purple Busmoov
    doc.text('Lieu de destination', startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    const arriveeLines = doc.splitTextToSize(arrivee || 'Non renseigné', colWidth - 5)
    doc.text(arriveeLines, startX, colY)
    colY += arriveeLines.length * 4 + 4

    // Contact sur place
    doc.setTextColor(233, 30, 140) // Magenta Busmoov
    doc.setFont('helvetica', 'bold')
    doc.text('Contact sur place', startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.text(contactNom || '-', startX, colY)

    colY += 6
    doc.setTextColor(233, 30, 140) // Magenta Busmoov
    doc.setFont('helvetica', 'bold')
    doc.text('Téléphone contact', startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.text(contactTel || '-', startX, colY)

    return colY
  }

  // Dessiner les colonnes
  let maxY = y
  if (data.type === 'aller' || data.type === 'aller_retour') {
    const contactName = [data.contact_prenom, data.contact_nom].filter(Boolean).join(' ')
    const endY = drawTrajetColumn(
      colLeftX, y, 'Transfert aller', purpleDark,
      data.aller_date, data.aller_heure,
      data.aller_adresse_depart, data.aller_adresse_arrivee,
      contactName, data.contact_tel
    )
    maxY = Math.max(maxY, endY)
  }

  if (data.type === 'retour' || data.type === 'aller_retour') {
    const contactName = [data.contact_prenom, data.contact_nom].filter(Boolean).join(' ')
    const endY = drawTrajetColumn(
      colRightX, y, 'Transfert retour', purpleDark,
      data.retour_date, data.retour_heure,
      data.retour_adresse_depart, data.retour_adresse_arrivee,
      contactName, data.contact_tel
    )
    maxY = Math.max(maxY, endY)
  }

  y = maxY + 20

  // ========== INFORMATIONS COMPLÉMENTAIRES ==========
  doc.setFontSize(11)
  doc.setTextColor(88, 44, 135) // Purple Busmoov
  doc.setFont('helvetica', 'bold')
  doc.text('Informations complémentaires', 15, y)
  y += 8

  doc.setFontSize(9)
  doc.setTextColor(grayText[0], grayText[1], grayText[2])
  doc.setFont('helvetica', 'normal')

  // Type de bagage
  doc.setFont('helvetica', 'bold')
  doc.text('Type de bagage : ', 15, y)
  doc.setFont('helvetica', 'normal')
  const bagageVoyage = data.luggage_type || 'Pas de bagage'
  doc.text(bagageVoyage, 45, y)

  // Commentaires
  if (data.commentaires) {
    y += 8
    const commentLines = doc.splitTextToSize(data.commentaires, pageWidth - 30)
    doc.text(commentLines.slice(0, 4), 15, y)
  }

  // ========== FOOTER ==========
  const footerY = pageHeight - 20
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.text(
    `${COMPANY_INFO.legalName} - SIRET: ${COMPANY_INFO.siret} - RCS ${COMPANY_INFO.rcs} - TVA: ${COMPANY_INFO.tvaIntracom}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  )
  doc.text(
    `${COMPANY_INFO.address}, ${COMPANY_INFO.zipCity} - Tel ${COMPANY_INFO.phone}`,
    pageWidth / 2,
    footerY + 5,
    { align: 'center' }
  )

  // Nom du fichier avec le nom du client
  const clientNameForFile = data.client_name?.replace(/[^a-zA-Z0-9]/g, '-') || 'client'
  doc.save(`${data.reference}-INFORMATION-VOYAGE-${clientNameForFile}.pdf`)
}

// Version qui retourne le PDF en base64 pour envoi par email
export async function generateInfosVoyagePDFBase64(data: InfosVoyageData): Promise<{ base64: string; filename: string }> {
  const COMPANY_INFO = await getCompanyInfo()
  const doc = new jsPDF({
    format: 'a4',
    orientation: 'portrait'
  })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Couleurs Busmoov
  const purpleDark = '#582C87' // Violet foncé Busmoov
  const magenta = '#E91E8C' // Magenta Busmoov
  const grayText = [80, 80, 80]

  // ========== HEADER ==========
  await addLogoToPdf(doc, 15, 8, 50, 11)

  doc.setFontSize(16)
  doc.setTextColor(88, 44, 135)
  doc.setFont('helvetica', 'bold')
  doc.text('INFORMATIONS VOYAGE', pageWidth / 2 + 20, 15, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Devis ${data.reference} - Dossier ${data.dossier_reference || ''}`, pageWidth / 2 + 20, 22, { align: 'center' })

  let y = 40

  // ========== TYPE DE TRAJET ==========
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  const typeLabel = data.type === 'aller_retour' ? 'Transfert Aller/Retour' : data.type === 'aller' ? 'Transfert Aller' : 'Transfert Retour'
  doc.text(typeLabel, pageWidth / 2, y, { align: 'center' })

  y += 8
  const paxAller = data.aller_passagers || '-'
  const paxRetour = data.retour_passagers || '-'
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  if (data.type === 'aller_retour') {
    doc.text(`${paxAller} passagers à l'aller / ${paxRetour} passagers au retour`, pageWidth / 2, y, { align: 'center' })
  } else if (data.type === 'aller') {
    doc.text(`${paxAller} passagers`, pageWidth / 2, y, { align: 'center' })
  } else {
    doc.text(`${paxRetour} passagers`, pageWidth / 2, y, { align: 'center' })
  }

  y += 15

  const colWidth = (pageWidth - 40) / 2
  const colLeftX = 15
  const colRightX = pageWidth / 2 + 5

  const drawTrajetColumn = (
    startX: number,
    startY: number,
    title: string,
    titleColor: string,
    date: string | null | undefined,
    heure: string | null | undefined,
    depart: string | null | undefined,
    arrivee: string | null | undefined,
    contactNom: string | null | undefined,
    contactTel: string | null | undefined
  ) => {
    let colY = startY

    const rgb = hexToRgb(titleColor)
    if (rgb) doc.setFillColor(rgb.r, rgb.g, rgb.b)
    doc.rect(startX, colY, colWidth, 8, 'F')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text(title, startX + 5, colY + 5.5)

    colY += 14

    doc.setFontSize(9)
    doc.setTextColor(88, 44, 135)
    doc.setFont('helvetica', 'normal')
    doc.text('Date de départ', startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    doc.text(date ? formatDate(date) : '-', startX, colY)

    colY += 10
    doc.setTextColor(88, 44, 135)
    doc.text('Heure de départ', startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    doc.text(heure || '-', startX, colY)

    colY += 10
    doc.setTextColor(88, 44, 135)
    doc.text('Lieu de départ', startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    const departLines = doc.splitTextToSize(depart || 'Non renseigné', colWidth - 5)
    doc.text(departLines, startX, colY)
    colY += departLines.length * 4 + 4

    doc.setTextColor(88, 44, 135)
    doc.text('Lieu de destination', startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    const arriveeLines = doc.splitTextToSize(arrivee || 'Non renseigné', colWidth - 5)
    doc.text(arriveeLines, startX, colY)
    colY += arriveeLines.length * 4 + 4

    doc.setTextColor(233, 30, 140)
    doc.setFont('helvetica', 'bold')
    doc.text('Contact sur place', startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.text(contactNom || '-', startX, colY)

    colY += 6
    doc.setTextColor(233, 30, 140)
    doc.setFont('helvetica', 'bold')
    doc.text('Téléphone contact', startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.text(contactTel || '-', startX, colY)

    return colY
  }

  let maxY = y
  if (data.type === 'aller' || data.type === 'aller_retour') {
    const contactName = [data.contact_prenom, data.contact_nom].filter(Boolean).join(' ')
    const endY = drawTrajetColumn(
      colLeftX, y, 'Transfert aller', purpleDark,
      data.aller_date, data.aller_heure,
      data.aller_adresse_depart, data.aller_adresse_arrivee,
      contactName, data.contact_tel
    )
    maxY = Math.max(maxY, endY)
  }

  if (data.type === 'retour' || data.type === 'aller_retour') {
    const contactName = [data.contact_prenom, data.contact_nom].filter(Boolean).join(' ')
    const endY = drawTrajetColumn(
      colRightX, y, 'Transfert retour', magenta,
      data.retour_date, data.retour_heure,
      data.retour_adresse_depart, data.retour_adresse_arrivee,
      contactName, data.contact_tel
    )
    maxY = Math.max(maxY, endY)
  }

  y = maxY + 20

  doc.setFontSize(11)
  doc.setTextColor(88, 44, 135)
  doc.setFont('helvetica', 'bold')
  doc.text('Informations complémentaires', 15, y)
  y += 8

  doc.setFontSize(9)
  doc.setTextColor(grayText[0], grayText[1], grayText[2])
  doc.setFont('helvetica', 'normal')

  doc.setFont('helvetica', 'bold')
  doc.text('Type de bagage : ', 15, y)
  doc.setFont('helvetica', 'normal')
  const bagageVoyage = data.luggage_type || 'Pas de bagage'
  doc.text(bagageVoyage, 45, y)

  if (data.commentaires) {
    y += 8
    const commentLines = doc.splitTextToSize(data.commentaires, pageWidth - 30)
    doc.text(commentLines.slice(0, 4), 15, y)
  }

  const footerY = pageHeight - 20
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.text(
    `${COMPANY_INFO.legalName} - SIRET: ${COMPANY_INFO.siret} - RCS ${COMPANY_INFO.rcs} - TVA: ${COMPANY_INFO.tvaIntracom}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  )
  doc.text(
    `${COMPANY_INFO.address}, ${COMPANY_INFO.zipCity} - Tel ${COMPANY_INFO.phone}`,
    pageWidth / 2,
    footerY + 5,
    { align: 'center' }
  )

  const clientNameForFile = data.client_name?.replace(/[^a-zA-Z0-9]/g, '-') || 'client'
  const filename = `${data.reference}-INFORMATION-VOYAGE-${clientNameForFile}.pdf`

  // Retourner le PDF en base64 au lieu de le télécharger
  const base64 = doc.output('datauristring').split(',')[1]
  return { base64, filename }
}
