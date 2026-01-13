import { jsPDF } from 'jspdf'
import { formatDate, formatDateTime, formatPricePDF, formatDateLocalized } from './utils'
import { supabase } from './supabase'
import type { CompanySettings } from '@/types/database'

// Traductions PDF par langue
type PdfLanguage = 'fr' | 'es' | 'de' | 'en'

interface PdfTranslations {
  // Documents
  quote: string
  invoice: string
  proforma: string
  contract: string
  roadmap: string
  creditNote: string
  // Headers
  number: string
  date: string
  dossier: string
  client: string
  yourAdvisor: string
  teamBusmoov: string
  // Sections
  serviceDetails: string
  outward: string
  return: string
  madTitle: string
  vehicleInfo: string
  pricing: string
  // Fields
  departureDate: string
  returnDate: string
  returnTime: string
  departurePlace: string
  destinationPlace: string
  place: string
  vehicle: string
  vehicleType: string
  passengers: string
  persons: string
  driver: string
  drivers: string
  cars: string
  numberOfCars: string
  numberOfDrivers: string
  includedKm: string
  luggage: string
  distance: string
  duration: string
  days: string
  // Pricing
  priceHT: string
  priceTTC: string
  pricePerCarHT: string
  pricePerCarTTC: string
  vatRate: string
  vatAmount: string
  total: string
  totalHT: string
  totalTTC: string
  deposit: string
  balance: string
  balanceBefore: string
  alreadyPaid: string
  remaining: string
  perPerson: string
  perCar: string
  unitPrice: string
  quantity: string
  // Options
  options: string
  optionsAvailable: string
  tolls: string
  tollsIncluded: string
  tollsNotIncluded: string
  driverMeals: string
  mealsIncluded: string
  mealsNotIncluded: string
  parking: string
  parkingIncluded: string
  parkingNotIncluded: string
  driverAccommodation: string
  accommodationIncluded: string
  accommodationNotIncluded: string
  // Payment
  paymentTerms: string
  paymentMethod: string
  bankTransfer: string
  creditCard: string
  bankDetails: string
  iban: string
  bic: string
  beneficiary: string
  reference: string
  amount: string
  depositOnBooking: string
  balanceBeforeDeparture: string
  paymentByCardOrTransfer: string
  // Invoice specific
  invoiceDate: string
  dueDate: string
  paymentReceived: string
  // Contract
  signedOn: string
  billingAddress: string
  // Cancellation
  cancellationConditions: string
  cancellationIntro: string
  cancellation31: string
  cancellation30to14: string
  cancellation13to8: string
  cancellation7: string
  // Roadmap
  driverInfo: string
  driverName: string
  driverPhone: string
  tripDetails: string
  pickupAddress: string
  destinationAddress: string
  comments: string
  contactOnSite: string
  // Validity
  validUntil: string
  validFor: string
  quoteValidFor: string
  // Misc
  page: string
  of: string
  generatedOn: string
  standardBus: string
  orText: string
  billedTo: string
  invoiceDeposit: string
  invoiceBalance: string
  // Luggage types
  luggageLight: string
  luggageMedium: string
  luggageHeavy: string
  luggageNone: string
  // Table headers (factures/proformas)
  designation: string
  qty: string
  unitPriceHT: string
  // Service descriptions
  transportOneWay: string
  transportRoundTrip: string
  transportMAD: string
  coach: string
  // Section headers
  prestation: string
  summary: string
  paymentInfo: string
  remainingToPay: string
  paymentsMade: string
  paymentCB: string
  paymentTransfer: string
  // Trip types
  tripOneWay: string
  tripRoundTrip: string
  tripMAD: string
  tripMADDays: string
  // Invoice line descriptions
  transportService: string
  depositPercent: string
  balancePercent: string
  creditNoteDesc: string
  totalTTCLabel: string
  depositRefLabel: string
  vatDetails: string
}


const PDF_TRANSLATIONS: Record<PdfLanguage, PdfTranslations> = {
  fr: {
    quote: 'DEVIS',
    invoice: 'FACTURE',
    proforma: 'PROFORMA',
    contract: 'CONTRAT',
    roadmap: 'FEUILLE DE ROUTE',
    creditNote: 'AVOIR',
    number: 'N°',
    date: 'Date',
    dossier: 'Dossier',
    client: 'Client',
    yourAdvisor: 'Votre conseiller',
    teamBusmoov: 'Equipe Busmoov',
    serviceDetails: 'Détails de la prestation',
    outward: 'ALLER',
    return: 'RETOUR',
    madTitle: 'MISE À DISPOSITION',
    vehicleInfo: 'Informations véhicule',
    pricing: 'Tarification',
    departureDate: 'Date de départ',
    returnDate: 'Date de retour',
    returnTime: 'Heure de retour',
    departurePlace: 'Lieu de départ',
    destinationPlace: 'Lieu de destination',
    place: 'Lieu',
    vehicle: 'Véhicule',
    vehicleType: 'Type de véhicule',
    passengers: 'Passagers',
    persons: 'personnes',
    driver: 'chauffeur',
    drivers: 'chauffeurs',
    cars: 'car(s)',
    numberOfCars: 'Nombre de cars',
    numberOfDrivers: 'Nombre de chauffeurs',
    includedKm: 'Kilomètres inclus',
    luggage: 'Bagages',
    distance: 'Distance',
    duration: 'Durée',
    days: 'jours',
    priceHT: 'Prix HT',
    priceTTC: 'Prix TTC',
    pricePerCarHT: 'Prix par car HT',
    pricePerCarTTC: 'EUR TTC par car',
    vatRate: 'TVA',
    vatAmount: 'Montant TVA',
    total: 'Total',
    totalHT: 'Total HT',
    totalTTC: 'TOTAL TTC',
    deposit: 'Acompte',
    balance: 'Solde',
    balanceBefore: 'Solde avant départ',
    alreadyPaid: 'Déjà réglé',
    remaining: 'Reste à payer',
    perPerson: 'par personne',
    perCar: 'par car',
    unitPrice: 'Prix unitaire',
    quantity: 'Quantité',
    options: 'Options',
    optionsAvailable: 'Options disponibles (non incluses)',
    tolls: 'Péages',
    tollsIncluded: 'Péages inclus',
    tollsNotIncluded: 'Péages non inclus',
    driverMeals: 'Repas chauffeur',
    mealsIncluded: 'Repas chauffeur inclus',
    mealsNotIncluded: 'Repas chauffeur non inclus',
    parking: 'Parking',
    parkingIncluded: 'Parking inclus',
    parkingNotIncluded: 'Parking non inclus',
    driverAccommodation: 'Hébergement chauffeur',
    accommodationIncluded: 'Hébergement chauffeur inclus',
    accommodationNotIncluded: 'Hébergement chauffeur non inclus',
    paymentTerms: 'Modalités de règlement',
    paymentMethod: 'Mode de paiement',
    bankTransfer: 'Virement bancaire',
    creditCard: 'Carte bancaire',
    bankDetails: 'Coordonnées bancaires',
    iban: 'IBAN',
    bic: 'BIC',
    beneficiary: 'Bénéficiaire',
    reference: 'Référence',
    amount: 'Montant',
    depositOnBooking: '30% à la réservation',
    balanceBeforeDeparture: 'Solde 45 jours avant le départ',
    paymentByCardOrTransfer: 'Paiement par carte bancaire ou virement',
    invoiceDate: 'Date de facturation',
    dueDate: 'Date d\'échéance',
    paymentReceived: 'Paiement reçu le',
    signedOn: 'Signé le',
    billingAddress: 'Adresse de facturation',
    cancellationConditions: 'Conditions d\'annulation',
    cancellationIntro: 'La validation en ligne implique une acceptation totale de nos conditions générales de vente et donc des conditions d\'annulation ci-dessous :',
    cancellation31: '30% du prix du service si l\'annulation intervient à J-31 ou plus',
    cancellation30to14: '50% du prix du service si l\'annulation intervient entre J-30 et J-14',
    cancellation13to8: '70% du prix du service si l\'annulation intervient entre J-13 et J-8',
    cancellation7: '100% du prix du service si l\'annulation intervient à J-7 ou moins',
    driverInfo: 'Informations chauffeur',
    driverName: 'Nom du chauffeur',
    driverPhone: 'Téléphone',
    tripDetails: 'Détails du trajet',
    pickupAddress: 'Adresse de prise en charge',
    destinationAddress: 'Adresse de destination',
    comments: 'Commentaires',
    contactOnSite: 'Contact sur place',
    validUntil: 'Valable jusqu\'au',
    validFor: 'Validité',
    quoteValidFor: 'Ce devis est valable',
    page: 'Page',
    of: 'sur',
    generatedOn: 'Généré le',
    standardBus: 'Autocar standard',
    orText: 'Soit',
    billedTo: 'FACTURÉ À',
    invoiceDeposit: "D'ACOMPTE",
    invoiceBalance: 'DE SOLDE',
    luggageLight: 'Léger (sacs à main, petits sacs)',
    luggageMedium: 'Moyen (valises cabine)',
    luggageHeavy: 'Volumineux (grosses valises)',
    luggageNone: 'Aucun bagage',
    designation: 'Désignation',
    qty: 'Qté',
    unitPriceHT: 'Prix Unit. HT',
    transportOneWay: 'Transport aller simple autocar',
    transportRoundTrip: 'Transport aller-retour autocar',
    transportMAD: 'Mise à disposition autocar',
    coach: 'autocar',
    prestation: 'PRESTATION',
    summary: 'RÉCAPITULATIF',
    paymentInfo: 'INFORMATIONS DE PAIEMENT',
    remainingToPay: 'Reste à régler',
    paymentsMade: 'Paiements effectués',
    paymentCB: 'CB',
    paymentTransfer: 'Virement',
    tripOneWay: 'ALLER SIMPLE',
    tripRoundTrip: 'ALLER / RETOUR',
    tripMAD: 'MISE À DISPOSITION',
    tripMADDays: 'jours',
    transportService: 'Prestation de transport autocar',
    depositPercent: 'Acompte',
    balancePercent: 'Solde',
    creditNoteDesc: 'Avoir - Transport autocar',
    totalTTCLabel: 'Total TTC',
    depositRefLabel: 'Acompte',
    vatDetails: 'DÉTAILS TVA',
  },
  es: {
    quote: 'PRESUPUESTO',
    invoice: 'FACTURA',
    proforma: 'PROFORMA',
    contract: 'CONTRATO',
    roadmap: 'HOJA DE RUTA',
    creditNote: 'NOTA DE CRÉDITO',
    number: 'N°',
    date: 'Fecha',
    dossier: 'Expediente',
    client: 'Cliente',
    yourAdvisor: 'Su asesor',
    teamBusmoov: 'Equipo Busmoov',
    serviceDetails: 'Detalles del servicio',
    outward: 'IDA',
    return: 'VUELTA',
    madTitle: 'PUESTA A DISPOSICIÓN',
    vehicleInfo: 'Información del vehículo',
    pricing: 'Tarifas',
    departureDate: 'Fecha de salida',
    returnDate: 'Fecha de regreso',
    returnTime: 'Hora de regreso',
    departurePlace: 'Lugar de salida',
    destinationPlace: 'Lugar de destino',
    place: 'Lugar',
    vehicle: 'Vehículo',
    vehicleType: 'Tipo de vehículo',
    passengers: 'Pasajeros',
    persons: 'personas',
    driver: 'conductor',
    drivers: 'conductores',
    cars: 'autocar(es)',
    numberOfCars: 'Número de autocares',
    numberOfDrivers: 'Número de conductores',
    includedKm: 'Kilómetros incluidos',
    luggage: 'Equipaje',
    distance: 'Distancia',
    duration: 'Duración',
    days: 'días',
    priceHT: 'Precio sin IVA',
    priceTTC: 'Precio con IVA',
    pricePerCarHT: 'Precio por autocar sin IVA',
    pricePerCarTTC: 'EUR con IVA por autocar',
    vatRate: 'IVA',
    vatAmount: 'Importe IVA',
    total: 'Total',
    totalHT: 'Total sin IVA',
    totalTTC: 'TOTAL CON IVA',
    deposit: 'Anticipo',
    balance: 'Saldo',
    balanceBefore: 'Saldo antes de la salida',
    alreadyPaid: 'Ya pagado',
    remaining: 'Pendiente de pago',
    perPerson: 'por persona',
    perCar: 'por autocar',
    unitPrice: 'Precio unitario',
    quantity: 'Cantidad',
    options: 'Opciones',
    optionsAvailable: 'Opciones disponibles (no incluidas)',
    tolls: 'Peajes',
    tollsIncluded: 'Peajes incluidos',
    tollsNotIncluded: 'Peajes no incluidos',
    driverMeals: 'Comidas conductor',
    mealsIncluded: 'Comidas conductor incluidas',
    mealsNotIncluded: 'Comidas conductor no incluidas',
    parking: 'Parking',
    parkingIncluded: 'Parking incluido',
    parkingNotIncluded: 'Parking no incluido',
    driverAccommodation: 'Alojamiento conductor',
    accommodationIncluded: 'Alojamiento conductor incluido',
    accommodationNotIncluded: 'Alojamiento conductor no incluido',
    paymentTerms: 'Condiciones de pago',
    paymentMethod: 'Forma de pago',
    bankTransfer: 'Transferencia bancaria',
    creditCard: 'Tarjeta de crédito',
    bankDetails: 'Datos bancarios',
    iban: 'IBAN',
    bic: 'BIC',
    beneficiary: 'Beneficiario',
    reference: 'Referencia',
    amount: 'Importe',
    depositOnBooking: '30% en la reserva',
    balanceBeforeDeparture: 'Saldo 45 días antes de la salida',
    paymentByCardOrTransfer: 'Pago por tarjeta de crédito o transferencia',
    invoiceDate: 'Fecha de facturación',
    dueDate: 'Fecha de vencimiento',
    paymentReceived: 'Pago recibido el',
    signedOn: 'Firmado el',
    billingAddress: 'Dirección de facturación',
    cancellationConditions: 'Condiciones de cancelación',
    cancellationIntro: 'La validación en línea implica la aceptación total de nuestras condiciones generales de venta y, por tanto, de las condiciones de cancelación siguientes:',
    cancellation31: '30% del precio del servicio si la cancelación se produce en J-31 o más',
    cancellation30to14: '50% del precio del servicio si la cancelación se produce entre J-30 y J-14',
    cancellation13to8: '70% del precio del servicio si la cancelación se produce entre J-13 y J-8',
    cancellation7: '100% del precio del servicio si la cancelación se produce en J-7 o menos',
    driverInfo: 'Información del conductor',
    driverName: 'Nombre del conductor',
    driverPhone: 'Teléfono',
    tripDetails: 'Detalles del trayecto',
    pickupAddress: 'Dirección de recogida',
    destinationAddress: 'Dirección de destino',
    comments: 'Comentarios',
    contactOnSite: 'Contacto en el lugar',
    validUntil: 'Válido hasta',
    validFor: 'Validez',
    quoteValidFor: 'Este presupuesto es válido por',
    page: 'Página',
    of: 'de',
    generatedOn: 'Generado el',
    standardBus: 'Autocar estándar',
    orText: 'Es decir',
    billedTo: 'FACTURADO A',
    invoiceDeposit: 'DE ANTICIPO',
    invoiceBalance: 'DE SALDO',
    luggageLight: 'Ligero (bolsos, bolsas pequeñas)',
    luggageMedium: 'Mediano (maletas de cabina)',
    luggageHeavy: 'Voluminoso (maletas grandes)',
    luggageNone: 'Sin equipaje',
    designation: 'Descripción',
    qty: 'Cant.',
    unitPriceHT: 'Precio Unit. s/IVA',
    transportOneWay: 'Transporte solo ida autocar',
    transportRoundTrip: 'Transporte ida y vuelta autocar',
    transportMAD: 'Puesta a disposición autocar',
    coach: 'autocar',
    prestation: 'SERVICIO',
    summary: 'RESUMEN',
    paymentInfo: 'INFORMACIÓN DE PAGO',
    remainingToPay: 'Pendiente de pago',
    paymentsMade: 'Pagos realizados',
    paymentCB: 'Tarjeta',
    paymentTransfer: 'Transferencia',
    tripOneWay: 'SOLO IDA',
    tripRoundTrip: 'IDA Y VUELTA',
    tripMAD: 'PUESTA A DISPOSICIÓN',
    tripMADDays: 'días',
    transportService: 'Servicio de transporte en autocar',
    depositPercent: 'Anticipo',
    balancePercent: 'Saldo',
    creditNoteDesc: 'Nota de crédito - Transporte en autocar',
    totalTTCLabel: 'Total IVA incl.',
    depositRefLabel: 'Anticipo',
    vatDetails: 'DETALLE IVA',
  },
  de: {
    quote: 'ANGEBOT',
    invoice: 'RECHNUNG',
    proforma: 'PROFORMA',
    contract: 'VERTRAG',
    roadmap: 'ROUTENPLAN',
    creditNote: 'GUTSCHRIFT',
    number: 'Nr.',
    date: 'Datum',
    dossier: 'Akte',
    client: 'Kunde',
    yourAdvisor: 'Ihr Berater',
    teamBusmoov: 'Team Busmoov',
    serviceDetails: 'Leistungsdetails',
    outward: 'HINFAHRT',
    return: 'RÜCKFAHRT',
    madTitle: 'BEREITSTELLUNG',
    vehicleInfo: 'Fahrzeuginformationen',
    pricing: 'Preisgestaltung',
    departureDate: 'Abfahrtsdatum',
    returnDate: 'Rückfahrtdatum',
    returnTime: 'Rückfahrtzeit',
    departurePlace: 'Abfahrtsort',
    destinationPlace: 'Zielort',
    place: 'Ort',
    vehicle: 'Fahrzeug',
    vehicleType: 'Fahrzeugtyp',
    passengers: 'Passagiere',
    persons: 'Personen',
    driver: 'Fahrer',
    drivers: 'Fahrer',
    cars: 'Bus(se)',
    numberOfCars: 'Anzahl Busse',
    numberOfDrivers: 'Anzahl Fahrer',
    includedKm: 'Inklusive Kilometer',
    luggage: 'Gepäck',
    distance: 'Entfernung',
    duration: 'Dauer',
    days: 'Tage',
    priceHT: 'Preis netto',
    priceTTC: 'Preis brutto',
    pricePerCarHT: 'Preis pro Bus netto',
    pricePerCarTTC: 'EUR brutto pro Bus',
    vatRate: 'MwSt.',
    vatAmount: 'MwSt.-Betrag',
    total: 'Gesamt',
    totalHT: 'Gesamt netto',
    totalTTC: 'GESAMT BRUTTO',
    deposit: 'Anzahlung',
    balance: 'Restbetrag',
    balanceBefore: 'Restbetrag vor Abfahrt',
    alreadyPaid: 'Bereits bezahlt',
    remaining: 'Noch zu zahlen',
    perPerson: 'pro Person',
    perCar: 'pro Bus',
    unitPrice: 'Einzelpreis',
    quantity: 'Menge',
    options: 'Optionen',
    optionsAvailable: 'Verfügbare Optionen (nicht inbegriffen)',
    tolls: 'Mautgebühren',
    tollsIncluded: 'Mautgebühren inklusive',
    tollsNotIncluded: 'Mautgebühren nicht inklusive',
    driverMeals: 'Fahrermahlzeiten',
    mealsIncluded: 'Fahrermahlzeiten inklusive',
    mealsNotIncluded: 'Fahrermahlzeiten nicht inklusive',
    parking: 'Parken',
    parkingIncluded: 'Parken inklusive',
    parkingNotIncluded: 'Parken nicht inklusive',
    driverAccommodation: 'Fahrerunterkunft',
    accommodationIncluded: 'Fahrerunterkunft inklusive',
    accommodationNotIncluded: 'Fahrerunterkunft nicht inklusive',
    paymentTerms: 'Zahlungsbedingungen',
    paymentMethod: 'Zahlungsmethode',
    bankTransfer: 'Überweisung',
    creditCard: 'Kreditkarte',
    bankDetails: 'Bankverbindung',
    iban: 'IBAN',
    bic: 'BIC',
    beneficiary: 'Empfänger',
    reference: 'Referenz',
    amount: 'Betrag',
    depositOnBooking: '30% bei der Buchung',
    balanceBeforeDeparture: 'Restbetrag 45 Tage vor Abfahrt',
    paymentByCardOrTransfer: 'Zahlung per Kreditkarte oder Überweisung',
    invoiceDate: 'Rechnungsdatum',
    dueDate: 'Fälligkeitsdatum',
    paymentReceived: 'Zahlung erhalten am',
    signedOn: 'Unterzeichnet am',
    billingAddress: 'Rechnungsadresse',
    cancellationConditions: 'Stornierungsbedingungen',
    cancellationIntro: 'Die Online-Validierung impliziert die vollständige Akzeptanz unserer Allgemeinen Geschäftsbedingungen und damit der folgenden Stornierungsbedingungen:',
    cancellation31: '30% des Servicepreises bei Stornierung ab J-31 oder mehr',
    cancellation30to14: '50% des Servicepreises bei Stornierung zwischen J-30 und J-14',
    cancellation13to8: '70% des Servicepreises bei Stornierung zwischen J-13 und J-8',
    cancellation7: '100% des Servicepreises bei Stornierung ab J-7 oder weniger',
    driverInfo: 'Fahrerinformationen',
    driverName: 'Fahrername',
    driverPhone: 'Telefon',
    tripDetails: 'Fahrdetails',
    pickupAddress: 'Abholadresse',
    destinationAddress: 'Zieladresse',
    comments: 'Kommentare',
    contactOnSite: 'Kontakt vor Ort',
    validUntil: 'Gültig bis',
    validFor: 'Gültigkeit',
    quoteValidFor: 'Dieses Angebot ist gültig für',
    page: 'Seite',
    of: 'von',
    generatedOn: 'Erstellt am',
    standardBus: 'Standardbus',
    orText: 'D.h.',
    billedTo: 'RECHNUNG AN',
    invoiceDeposit: 'ANZAHLUNG',
    invoiceBalance: 'RESTBETRAG',
    luggageLight: 'Leicht (Handtaschen, kleine Taschen)',
    luggageMedium: 'Mittel (Handgepäck)',
    luggageHeavy: 'Groß (große Koffer)',
    luggageNone: 'Kein Gepäck',
    designation: 'Bezeichnung',
    qty: 'Menge',
    unitPriceHT: 'Einzelpreis netto',
    transportOneWay: 'Einfache Fahrt Reisebus',
    transportRoundTrip: 'Hin- und Rückfahrt Reisebus',
    transportMAD: 'Bereitstellung Reisebus',
    coach: 'Reisebus',
    prestation: 'LEISTUNG',
    summary: 'ZUSAMMENFASSUNG',
    paymentInfo: 'ZAHLUNGSINFORMATIONEN',
    remainingToPay: 'Noch zu zahlen',
    paymentsMade: 'Zahlungen erfolgt',
    paymentCB: 'Kreditkarte',
    paymentTransfer: 'Überweisung',
    tripOneWay: 'EINFACHE FAHRT',
    tripRoundTrip: 'HIN- UND RÜCKFAHRT',
    tripMAD: 'BEREITSTELLUNG',
    tripMADDays: 'Tage',
    transportService: 'Busbeförderungsleistung',
    depositPercent: 'Anzahlung',
    balancePercent: 'Restbetrag',
    creditNoteDesc: 'Gutschrift - Busbeförderung',
    totalTTCLabel: 'Gesamtbetrag inkl. MwSt',
    depositRefLabel: 'Anzahlung',
    vatDetails: 'MWST-DETAILS',
  },
  en: {
    quote: 'QUOTE',
    invoice: 'INVOICE',
    proforma: 'PROFORMA',
    contract: 'CONTRACT',
    roadmap: 'TRIP SHEET',
    creditNote: 'CREDIT NOTE',
    number: 'No.',
    date: 'Date',
    dossier: 'File',
    client: 'Client',
    yourAdvisor: 'Your advisor',
    teamBusmoov: 'Team Busmoov',
    serviceDetails: 'Service details',
    outward: 'OUTBOUND',
    return: 'RETURN',
    madTitle: 'AT-DISPOSAL SERVICE',
    vehicleInfo: 'Vehicle information',
    pricing: 'Pricing',
    departureDate: 'Departure date',
    returnDate: 'Return date',
    returnTime: 'Return time',
    departurePlace: 'Departure location',
    destinationPlace: 'Destination',
    place: 'Location',
    vehicle: 'Vehicle',
    vehicleType: 'Vehicle type',
    passengers: 'Passengers',
    persons: 'persons',
    driver: 'driver',
    drivers: 'drivers',
    cars: 'coach(es)',
    numberOfCars: 'Number of coaches',
    numberOfDrivers: 'Number of drivers',
    includedKm: 'Kilometres included',
    luggage: 'Luggage',
    distance: 'Distance',
    duration: 'Duration',
    days: 'days',
    priceHT: 'Price excl. VAT',
    priceTTC: 'Price incl. VAT',
    pricePerCarHT: 'Price per coach excl. VAT',
    pricePerCarTTC: 'GBP incl. VAT per coach',
    vatRate: 'VAT',
    vatAmount: 'VAT amount',
    total: 'Total',
    totalHT: 'Total excl. VAT',
    totalTTC: 'TOTAL INCL. VAT',
    deposit: 'Deposit',
    balance: 'Balance',
    balanceBefore: 'Balance before departure',
    alreadyPaid: 'Already paid',
    remaining: 'Remaining balance',
    perPerson: 'per person',
    perCar: 'per coach',
    unitPrice: 'Unit price',
    quantity: 'Quantity',
    options: 'Options',
    optionsAvailable: 'Available options (not included)',
    tolls: 'Tolls',
    tollsIncluded: 'Tolls included',
    tollsNotIncluded: 'Tolls not included',
    driverMeals: 'Driver meals',
    mealsIncluded: 'Driver meals included',
    mealsNotIncluded: 'Driver meals not included',
    parking: 'Parking',
    parkingIncluded: 'Parking included',
    parkingNotIncluded: 'Parking not included',
    driverAccommodation: 'Driver accommodation',
    accommodationIncluded: 'Driver accommodation included',
    accommodationNotIncluded: 'Driver accommodation not included',
    paymentTerms: 'Payment terms',
    paymentMethod: 'Payment method',
    bankTransfer: 'Bank transfer',
    creditCard: 'Credit card',
    bankDetails: 'Bank details',
    iban: 'IBAN',
    bic: 'BIC',
    beneficiary: 'Beneficiary',
    reference: 'Reference',
    amount: 'Amount',
    depositOnBooking: '30% on booking',
    balanceBeforeDeparture: 'Balance 45 days before departure',
    paymentByCardOrTransfer: 'Payment by credit card or bank transfer',
    invoiceDate: 'Invoice date',
    dueDate: 'Due date',
    paymentReceived: 'Payment received on',
    signedOn: 'Signed on',
    billingAddress: 'Billing address',
    cancellationConditions: 'Cancellation conditions',
    cancellationIntro: 'Online validation implies full acceptance of our terms and conditions and therefore the cancellation conditions below:',
    cancellation31: '30% of the service price if cancellation occurs D-31 or more',
    cancellation30to14: '50% of the service price if cancellation occurs between D-30 and D-14',
    cancellation13to8: '70% of the service price if cancellation occurs between D-13 and D-8',
    cancellation7: '100% of the service price if cancellation occurs D-7 or less',
    driverInfo: 'Driver information',
    driverName: 'Driver name',
    driverPhone: 'Phone',
    tripDetails: 'Trip details',
    pickupAddress: 'Pick-up address',
    destinationAddress: 'Destination address',
    comments: 'Comments',
    contactOnSite: 'On-site contact',
    validUntil: 'Valid until',
    validFor: 'Validity',
    quoteValidFor: 'This quote is valid for',
    page: 'Page',
    of: 'of',
    generatedOn: 'Generated on',
    standardBus: 'Standard coach',
    orText: 'i.e.',
    billedTo: 'BILLED TO',
    invoiceDeposit: 'DEPOSIT',
    invoiceBalance: 'BALANCE',
    luggageLight: 'Light (handbags, small bags)',
    luggageMedium: 'Medium (cabin luggage)',
    luggageHeavy: 'Large (large suitcases)',
    luggageNone: 'No luggage',
    designation: 'Description',
    qty: 'Qty',
    unitPriceHT: 'Unit Price excl. VAT',
    transportOneWay: 'One-way coach transport',
    transportRoundTrip: 'Round-trip coach transport',
    transportMAD: 'Coach at disposal',
    coach: 'coach',
    prestation: 'SERVICE',
    summary: 'SUMMARY',
    paymentInfo: 'PAYMENT INFORMATION',
    remainingToPay: 'Remaining to pay',
    paymentsMade: 'Payments made',
    paymentCB: 'Card',
    paymentTransfer: 'Transfer',
    tripOneWay: 'ONE WAY',
    tripRoundTrip: 'ROUND TRIP',
    tripMAD: 'AT DISPOSAL',
    tripMADDays: 'days',
    transportService: 'Coach transport service',
    depositPercent: 'Deposit',
    balancePercent: 'Balance',
    creditNoteDesc: 'Credit note - Coach transport',
    totalTTCLabel: 'Total incl. VAT',
    depositRefLabel: 'Deposit',
    vatDetails: 'VAT DETAILS',
  },
}

// Fonction pour obtenir les traductions PDF
function getPdfTranslations(lang: string = 'fr'): PdfTranslations {
  const language = (lang?.toLowerCase() || 'fr') as PdfLanguage
  return PDF_TRANSLATIONS[language] || PDF_TRANSLATIONS.fr
}

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
  vatRate: 10,
  vatLabel: 'TVA',
  rib: {
    iban: 'FR76 3000 4015 9600 0101 0820 195',
    bic: 'BNPAFRPPXXX',
    beneficiary: 'BUSMOOV SAS',
  },
}

// Type pour les informations pays
interface CountryInfo {
  code: string
  name: string
  vatRate: number
  vatLabel: string
  phone: string
  email: string
  address: string
  city: string
  companyName: string
  siret: string
  tvaIntra: string
  invoicePrefix: string
  proformaPrefix: string
  bankName: string
  bankIban: string
  bankBic: string
  bankBeneficiary: string
}

// Cache pour les infos pays
const countryInfoCache: Record<string, CountryInfo> = {}

// Fonction pour récupérer les informations d'un pays
async function getCountryInfo(countryCode: string = 'FR'): Promise<CountryInfo> {
  // Vérifier le cache
  if (countryInfoCache[countryCode]) {
    return countryInfoCache[countryCode]
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('countries')
      .select('*')
      .eq('code', countryCode)
      .single()

    if (error || !data) {
      console.warn(`Could not load country ${countryCode}, using FR defaults`)
      // Fallback sur FR
      if (countryCode !== 'FR') {
        return getCountryInfo('FR')
      }
      // Retourner les valeurs par défaut
      return {
        code: 'FR',
        name: 'France',
        vatRate: 10,
        vatLabel: 'TVA',
        phone: '01 76 31 12 83',
        email: 'infos@busmoov.com',
        address: '41 Rue Barrault',
        city: '75013 Paris',
        companyName: 'Busmoov',
        siret: '853 867 703 00029',
        tvaIntra: 'FR58853867703',
        invoicePrefix: 'FR-',
        proformaPrefix: 'PRO-FR-',
        bankName: 'BNP Paribas',
        bankIban: 'FR76 3000 4015 9600 0101 0820 195',
        bankBic: 'BNPAFRPPXXX',
        bankBeneficiary: 'BUSMOOV SAS',
      }
    }

    const countryInfo: CountryInfo = {
      code: data.code,
      name: data.name,
      vatRate: parseFloat(data.vat_rate) || 10,
      vatLabel: data.vat_label || 'TVA',
      phone: data.phone_display || data.phone || '',
      email: data.email || '',
      address: data.address || '',
      city: data.city || '',
      companyName: data.company_name || 'Busmoov',
      siret: data.siret || '',
      tvaIntra: data.tva_intra || '',
      invoicePrefix: data.invoice_prefix || '',
      proformaPrefix: data.proforma_prefix || '',
      bankName: data.bank_name || '',
      bankIban: data.bank_iban || '',
      bankBic: data.bank_bic || '',
      bankBeneficiary: data.bank_beneficiary || '',
    }

    // Mettre en cache
    countryInfoCache[countryCode] = countryInfo
    return countryInfo
  } catch (err) {
    console.error('Error loading country info:', err)
    // Fallback
    return {
      code: 'FR',
      name: 'France',
      vatRate: 10,
      vatLabel: 'TVA',
      phone: '01 76 31 12 83',
      email: 'infos@busmoov.com',
      address: '41 Rue Barrault',
      city: '75013 Paris',
      companyName: 'Busmoov',
      siret: '853 867 703 00029',
      tvaIntra: 'FR58853867703',
      invoicePrefix: 'FR-',
      proformaPrefix: 'PRO-FR-',
      bankName: 'BNP Paribas',
      bankIban: 'FR76 3000 4015 9600 0101 0820 195',
      bankBic: 'BNPAFRPPXXX',
      bankBeneficiary: 'BUSMOOV SAS',
    }
  }
}

// Fonction pour charger les settings depuis la BDD (avec support multi-pays)
export async function getCompanyInfo(countryCode: string = 'FR'): Promise<typeof DEFAULT_COMPANY_INFO> {
  try {
    // Charger les infos du pays
    const countryInfo = await getCountryInfo(countryCode)

    // Charger les settings généraux de l'entreprise
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .single()

    if (error || !data) {
      console.warn('Could not load company settings, using country defaults')
      // Utiliser les infos du pays comme fallback
      return {
        name: countryInfo.companyName || DEFAULT_COMPANY_INFO.name,
        legalName: countryInfo.companyName || DEFAULT_COMPANY_INFO.legalName,
        address: countryInfo.address || DEFAULT_COMPANY_INFO.address,
        zipCity: countryInfo.city || DEFAULT_COMPANY_INFO.zipCity,
        phone: countryInfo.phone || DEFAULT_COMPANY_INFO.phone,
        email: countryInfo.email || DEFAULT_COMPANY_INFO.email,
        siret: countryInfo.siret || DEFAULT_COMPANY_INFO.siret,
        rcs: DEFAULT_COMPANY_INFO.rcs,
        codeApe: DEFAULT_COMPANY_INFO.codeApe,
        tvaIntracom: countryInfo.tvaIntra || DEFAULT_COMPANY_INFO.tvaIntracom,
        vatRate: countryInfo.vatRate,
        vatLabel: countryInfo.vatLabel,
        rib: {
          iban: countryInfo.bankIban || DEFAULT_COMPANY_INFO.rib.iban,
          bic: countryInfo.bankBic || DEFAULT_COMPANY_INFO.rib.bic,
          beneficiary: countryInfo.bankBeneficiary || DEFAULT_COMPANY_INFO.rib.beneficiary,
        },
      }
    }

    const settings = data as CompanySettings

    // Fusionner les settings généraux avec les infos spécifiques au pays
    // Les infos pays ont priorité pour: TVA, RIB, téléphone, email, adresse
    return {
      name: countryInfo.companyName || settings.name || DEFAULT_COMPANY_INFO.name,
      legalName: countryInfo.companyName || settings.legal_name || DEFAULT_COMPANY_INFO.legalName,
      address: countryInfo.address || settings.address || DEFAULT_COMPANY_INFO.address,
      zipCity: countryInfo.city || `${settings.zip || ''} ${settings.city || ''}`.trim() || DEFAULT_COMPANY_INFO.zipCity,
      phone: countryInfo.phone || settings.phone || DEFAULT_COMPANY_INFO.phone,
      email: countryInfo.email || settings.email || DEFAULT_COMPANY_INFO.email,
      siret: countryInfo.siret || settings.siret || DEFAULT_COMPANY_INFO.siret,
      rcs: settings.rcs || DEFAULT_COMPANY_INFO.rcs,
      codeApe: settings.code_ape || DEFAULT_COMPANY_INFO.codeApe,
      tvaIntracom: countryInfo.tvaIntra || settings.tva_intracom || DEFAULT_COMPANY_INFO.tvaIntracom,
      vatRate: countryInfo.vatRate,
      vatLabel: countryInfo.vatLabel,
      rib: {
        iban: countryInfo.bankIban || settings.iban || DEFAULT_COMPANY_INFO.rib.iban,
        bic: countryInfo.bankBic || settings.bic || DEFAULT_COMPANY_INFO.rib.bic,
        beneficiary: countryInfo.bankBeneficiary || DEFAULT_COMPANY_INFO.rib.beneficiary,
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
    country_code?: string | null
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
  country_code?: string | null
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

export async function generateDevisPDF(devis: DevisData, lang: string = 'fr'): Promise<void> {
  // Récupérer les infos pays basées sur country_code du dossier
  const countryCode = devis.dossier?.country_code || 'FR'
  const countryInfo = await getCountryInfo(countryCode)

  // Déterminer la langue à partir du pays si non spécifiée
  const effectiveLang = lang || (countryCode === 'DE' ? 'de' : countryCode === 'ES' ? 'es' : countryCode === 'GB' ? 'en' : 'fr')

  const COMPANY_INFO = await getCompanyInfo(countryCode)
  const t = getPdfTranslations(effectiveLang)
  const doc = new jsPDF({
    format: 'a4',
    orientation: 'portrait'
  })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  // Utiliser le taux TVA du pays (prioritaire pour garantir le bon taux légal), sinon celui du devis
  const tvaRate = countryInfo.vatRate ?? devis.tva_rate ?? 10
  const vatLabel = countryInfo.vatLabel || t.vatRate
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
  doc.text(t.quote, pageWidth - 15, 16, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(`${t.number} ${devis.reference}`, pageWidth - 15, 23, { align: 'right' })
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`${t.date} : ${formatDateLocalized(devis.created_at, effectiveLang)}`, pageWidth - 15, 29, { align: 'right' })
  if (devis.dossier?.reference) {
    doc.text(`${t.dossier} : ${devis.dossier.reference}`, pageWidth - 15, 35, { align: 'right' })
  }

  drawLine(doc, 42)

  // ========== INFO CLIENT & CONSEILLER ==========
  let y = 52

  // Client (gauche)
  drawRect(doc, 15, y - 5, 80, 7, purpleLight)
  doc.setFontSize(9)
  doc.setTextColor(88, 44, 135) // Purple Busmoov
  doc.setFont('helvetica', 'bold')
  doc.text(t.client, 17, y)
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
  doc.text(t.yourAdvisor, 112, cy)
  doc.setFont('helvetica', 'normal')

  cy += 7
  doc.setTextColor(0, 0, 0)
  doc.text(t.teamBusmoov, 112, cy)
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
  doc.text(t.serviceDetails, 17, y)
  doc.setFont('helvetica', 'normal')

  y += 12
  const nombreCars = devis.nombre_cars || 1
  const nombreChauffeurs = devis.nombre_chauffeurs || 1

  // Colonne gauche - ALLER
  let leftY = y
  doc.setFontSize(9)
  doc.setTextColor(233, 30, 140) // Magenta Busmoov
  doc.setFont('helvetica', 'bold')
  doc.text(t.outward, colLeftX, leftY)
  doc.setFont('helvetica', 'normal')
  leftY += 7

  // Date/Heure départ
  doc.setTextColor(88, 44, 135) // Purple
  doc.text(t.departureDate, colLeftX, leftY)
  leftY += 5
  doc.setTextColor(0, 0, 0)
  const departDate = devis.dossier?.departure_date ? formatDateLocalized(devis.dossier.departure_date, effectiveLang) : '-'
  const departTime = devis.dossier?.departure_time || ''
  doc.text(`${departDate} ${departTime}`.trim(), colLeftX, leftY)
  leftY += 8

  // Lieu départ
  doc.setTextColor(88, 44, 135)
  doc.text(t.departurePlace, colLeftX, leftY)
  leftY += 5
  doc.setTextColor(0, 0, 0)
  const departLines = doc.splitTextToSize(devis.dossier?.departure || '-', colWidth - 10)
  doc.text(departLines, colLeftX, leftY)
  leftY += departLines.length * 4 + 4

  // Lieu arrivée
  doc.setTextColor(88, 44, 135)
  doc.text(t.destinationPlace, colLeftX, leftY)
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
    doc.text(t.return, colRightX, rightY)
    doc.setFont('helvetica', 'normal')
    rightY += 7

    // Date/Heure retour
    doc.setTextColor(88, 44, 135)
    const hasReturnDateDevis = !!devis.dossier?.return_date
    doc.text(hasReturnDateDevis ? t.returnDate : t.returnTime, colRightX, rightY)
    rightY += 5
    doc.setTextColor(0, 0, 0)
    if (hasReturnDateDevis) {
      const retourDate = formatDateLocalized(devis.dossier!.return_date!, effectiveLang)
      const retourTime = devis.dossier?.return_time || ''
      doc.text(`${retourDate} ${retourTime}`.trim(), colRightX, rightY)
    } else {
      // Aller-retour même jour
      doc.text(devis.dossier?.return_time || '-', colRightX, rightY)
    }
    rightY += 8

    // Lieu départ retour (inverse de l'aller)
    doc.setTextColor(88, 44, 135)
    doc.text(t.departurePlace, colRightX, rightY)
    rightY += 5
    doc.setTextColor(0, 0, 0)
    const retourDepartLines = doc.splitTextToSize(devis.dossier?.arrival || '-', colWidth - 10)
    doc.text(retourDepartLines, colRightX, rightY)
    rightY += retourDepartLines.length * 4 + 4

    // Lieu arrivée retour
    doc.setTextColor(88, 44, 135)
    doc.text(t.destinationPlace, colRightX, rightY)
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
    doc.text(t.madTitle, colRightX, rightY)
    doc.setFont('helvetica', 'normal')
    rightY += 7

    if (devis.mad_date) {
      doc.setTextColor(88, 44, 135)
      doc.text(t.date, colRightX, rightY)
      rightY += 5
      doc.setTextColor(0, 0, 0)
      doc.text(`${formatDateLocalized(devis.mad_date, effectiveLang)} ${devis.mad_heure || ''}`.trim(), colRightX, rightY)
      rightY += 8
    }

    if (devis.mad_lieu) {
      doc.setTextColor(88, 44, 135)
      doc.text(t.place, colRightX, rightY)
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
  doc.text(t.vehicleInfo, 17, y)
  doc.setFont('helvetica', 'normal')

  y += 8
  doc.setTextColor(0, 0, 0)
  const vehicleDetails: [string, string][] = [
    [t.passengers, `${devis.dossier?.passengers || '-'} ${t.persons}`],
    [t.vehicleType, devis.vehicle_type || t.standardBus],
    [t.numberOfCars, `${nombreCars} ${t.vehicle}${nombreCars > 1 ? 's' : ''}`],
    [t.numberOfDrivers, `${nombreChauffeurs} ${nombreChauffeurs > 1 ? t.drivers : t.driver}`],
  ]
  if (devis.km) {
    vehicleDetails.push([t.includedKm, devis.km])
  }
  // Bagages
  const luggageType = devis.luggage_type || devis.dossier?.luggage_type
  if (luggageType) {
    vehicleDetails.push([t.luggage, luggageType])
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
    doc.text(t.comments, 17, y)
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
  doc.text(t.pricing, 17, y)
  doc.setFont('helvetica', 'normal')

  y += 10
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)

  const prixParCarHT = devis.price_ht / nombreCars
  const prixParCarTTC = devis.price_ttc / nombreCars

  // Prix par car HT
  doc.text(t.pricePerCarHT, 17, y)
  doc.text(`${formatAmount(prixParCarHT)} EUR`, pageWidth - 17, y, { align: 'right' })

  y += 6
  // Nombre de cars
  doc.text(t.numberOfCars, 17, y)
  doc.text(`x ${nombreCars}`, pageWidth - 17, y, { align: 'right' })

  y += 6
  // Total HT
  doc.setFont('helvetica', 'bold')
  doc.text(t.totalHT, 17, y)
  doc.text(`${formatAmount(devis.price_ht)} EUR`, pageWidth - 17, y, { align: 'right' })
  doc.setFont('helvetica', 'normal')

  y += 6
  // TVA
  doc.text(`${vatLabel} (${tvaRate}%)`, 17, y)
  doc.text(`${formatAmount(tvaAmount)} EUR`, pageWidth - 17, y, { align: 'right' })

  y += 2
  drawLine(doc, y + 3, 120, pageWidth - 15)

  y += 10
  // Total TTC
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(233, 30, 140) // Magenta Busmoov
  doc.text(t.totalTTC, 17, y)
  doc.text(`${formatAmount(devis.price_ttc)} EUR`, pageWidth - 17, y, { align: 'right' })
  doc.setFont('helvetica', 'normal')

  // Prix par car TTC
  y += 6
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`${t.orText} ${formatAmount(prixParCarTTC)} ${t.pricePerCarTTC}`, pageWidth - 17, y, { align: 'right' })

  // Prix par personne
  if (devis.dossier?.passengers && devis.dossier.passengers > 0) {
    y += 4
    const pricePerPerson = devis.price_ttc / devis.dossier.passengers
    doc.text(`${t.orText} ${formatAmount(pricePerPerson)} EUR TTC ${t.perPerson}`, pageWidth - 17, y, { align: 'right' })
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
      optionsNonIncluses.push({ label: t.tolls, prix: `${formatAmount(opts.peages.montant)} €` })
    }
    if (opts.repas_chauffeur?.status === 'non_inclus' && opts.repas_chauffeur?.montant && opts.repas_chauffeur.montant > 0) {
      const totalRepas = opts.repas_chauffeur.montant * nbRepas * nombreChauffeurs
      optionsNonIncluses.push({
        label: t.driverMeals,
        prix: `${formatAmount(totalRepas)} €`,
        detail: `(${opts.repas_chauffeur.montant}€ × ${nbRepas} × ${nombreChauffeurs})`
      })
    }
    if (opts.parking?.status === 'non_inclus' && opts.parking?.montant && opts.parking.montant > 0) {
      optionsNonIncluses.push({ label: t.parking, prix: `${formatAmount(opts.parking.montant)} €` })
    }
    if (opts.hebergement?.status === 'non_inclus' && opts.hebergement?.montant && opts.hebergement.montant > 0) {
      const nbNuits = opts.hebergement.nuits || 1
      const totalHeberg = opts.hebergement.montant * nbNuits * nombreChauffeurs
      optionsNonIncluses.push({
        label: t.driverAccommodation,
        prix: `${formatAmount(totalHeberg)} €`,
        detail: `(${opts.hebergement.montant}€ × ${nbNuits} × ${nombreChauffeurs})`
      })
    }

    if (optionsNonIncluses.length > 0) {
      y += 12
      y = checkPageBreak(doc, y, 40, COMPANY_INFO)

      drawRect(doc, 15, y - 4, pageWidth - 30, 7, '#fef3c7') // Amber clair
      doc.setFontSize(9)
      doc.setTextColor(146, 64, 14) // Amber foncé
      doc.setFont('helvetica', 'bold')
      doc.text(t.optionsAvailable, 17, y)
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
  doc.text(t.paymentTerms, 15, y)
  doc.setFont('helvetica', 'normal')

  y += 7
  doc.setFontSize(8)
  doc.setTextColor(60, 60, 60)
  const modalites = [
    `• ${t.depositOnBooking}`,
    `• ${t.balanceBeforeDeparture}`,
    `• ${t.paymentByCardOrTransfer}`,
  ]
  modalites.forEach((m, i) => {
    doc.text(m, 17, y + (i * 4))
  })

  // RIB
  y += 16
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`${t.iban}: ${COMPANY_INFO.rib.iban}`, 17, y)
  y += 4
  doc.text(`${t.bic}: ${COMPANY_INFO.rib.bic}`, 17, y)

  // ========== CONDITIONS ANNULATION ==========
  y += 10
  // Vérifier si on a besoin d'une nouvelle page (conditions ~ 70px)
  y = checkPageBreak(doc, y, 70, COMPANY_INFO)

  drawRect(doc, 15, y - 4, pageWidth - 30, 7, '#fff3cd')
  doc.setFontSize(9)
  doc.setTextColor(133, 100, 4)
  doc.setFont('helvetica', 'bold')
  doc.text(t.cancellationConditions, 17, y)
  doc.setFont('helvetica', 'normal')

  y += 7
  doc.setFontSize(7)
  doc.setTextColor(60, 60, 60)
  // Texte d'introduction
  const introLines = doc.splitTextToSize(t.cancellationIntro, pageWidth - 35)
  doc.text(introLines, 17, y)
  y += introLines.length * 3.5 + 3

  doc.setFontSize(8)
  const conditions = [
    t.cancellation31,
    t.cancellation30to14,
    t.cancellation13to8,
    t.cancellation7,
  ]
  conditions.forEach((c, i) => {
    doc.text(`• ${c}`, 17, y + (i * 4))
  })

  // ========== VALIDITE ==========
  y += conditions.length * 4 + 6
  doc.setFontSize(9)
  doc.setTextColor(88, 44, 135) // Purple
  doc.setFont('helvetica', 'bold')
  doc.text(`${t.quoteValidFor} ${devis.validity_days || 7} ${t.days}.`, 15, y)
  doc.setFont('helvetica', 'normal')

  // ========== FOOTER ==========
  drawFooter(doc, COMPANY_INFO)

  doc.save(`Devis_${devis.reference}.pdf`)
}

export async function generateContratPDF(contrat: ContratData, lang: string = 'fr'): Promise<void> {
  // Récupérer les infos pays basées sur country_code
  const countryCode = contrat.country_code || 'FR'
  const countryInfo = await getCountryInfo(countryCode)

  // Déterminer la langue à partir du pays si non spécifiée
  const effectiveLang = lang || (countryCode === 'DE' ? 'de' : countryCode === 'ES' ? 'es' : countryCode === 'GB' ? 'en' : 'fr')

  const COMPANY_INFO = await getCompanyInfo(countryCode)
  const t = getPdfTranslations(effectiveLang)
  const doc = new jsPDF({
    format: 'a4',
    orientation: 'portrait'
  })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  // Utiliser le taux TVA du pays (prioritaire pour garantir le bon taux légal), sinon celui du contrat
  const tvaRate = countryInfo.vatRate ?? contrat.tva_rate ?? 10
  const vatLabel = countryInfo.vatLabel || t.vatRate
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
  doc.text(`${t.driverPhone}: ${COMPANY_INFO.phone}`, pageWidth - 15, ey, { align: 'right' })
  ey += 4
  doc.text(COMPANY_INFO.email, pageWidth - 15, ey, { align: 'right' })
  ey += 4
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`SIRET: ${COMPANY_INFO.siret}`, pageWidth - 15, ey, { align: 'right' })
  ey += 4
  doc.text(`${t.vatRate}: ${COMPANY_INFO.tvaIntracom}`, pageWidth - 15, ey, { align: 'right' })

  // ========== TITRE PROFORMA ==========
  let y = 55
  doc.setFontSize(22)
  doc.setTextColor(88, 44, 135)
  doc.setFont('helvetica', 'bold')
  doc.text(t.proforma, 15, y)

  // Références
  y += 8
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'normal')
  doc.text(`${t.number} ${contrat.reference}`, 15, y)
  doc.text(`${t.date} : ${formatDateLocalized(contrat.signed_at || new Date().toISOString(), effectiveLang)}`, 80, y)
  if (contrat.dossier?.reference) {
    doc.text(`${t.dossier} : ${contrat.dossier.reference}`, 140, y)
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
  doc.text(t.client.toUpperCase(), 20, y + 5.5)

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
  doc.text(t.prestation, 20, y + 5.5)

  y += 14

  // Type de trajet basé sur service_type ou trip_mode
  // IMPORTANT: Vérifier d'abord circuit/mise_disposition car ils peuvent avoir des dates de retour
  const serviceType = contrat.service_type || contrat.dossier?.trip_mode
  let typeTrajet = t.tripOneWay
  // ar_mad = aller-retour mise à disposition (circuit multi-jours)
  const isMiseADispo = serviceType === 'circuit' || serviceType === 'mise_disposition' || serviceType === 'ar_mad'
  if (isMiseADispo) {
    typeTrajet = t.tripMAD
    if (contrat.duree_jours && contrat.duree_jours > 1) {
      typeTrajet += ` (${contrat.duree_jours} ${t.tripMADDays})`
    }
  } else if (serviceType === 'aller_retour') {
    typeTrajet = t.tripRoundTrip
  } else if (contrat.dossier?.return_date || contrat.dossier?.return_time) {
    // Seulement si pas de trip_mode spécifié, on déduit du return_date
    typeTrajet = t.tripRoundTrip
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
  doc.text(t.departurePlace, 17, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const departureText = contrat.dossier?.departure || '-'
  const departureLinesContract = doc.splitTextToSize(departureText, 80)
  doc.text(departureLinesContract, 45, y)
  y += departureLinesContract.length * 4 + 4

  // Description du trajet - Arrivée
  doc.setTextColor(88, 44, 135) // Purple
  doc.setFont('helvetica', 'bold')
  doc.text(t.destinationPlace, 17, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const arrivalText = contrat.dossier?.arrival || '-'
  const arrivalLinesContract = doc.splitTextToSize(arrivalText, 80)
  doc.text(arrivalLinesContract, 45, y)
  y += arrivalLinesContract.length * 4 + 6

  // Date et heure de départ
  doc.setTextColor(88, 44, 135) // Purple
  doc.setFont('helvetica', 'bold')
  doc.text(t.departureDate, 17, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const departDateContract = contrat.dossier?.departure_date ? formatDateLocalized(contrat.dossier.departure_date, effectiveLang) : '-'
  const departTimeContract = contrat.dossier?.departure_time ? ` ${contrat.dossier.departure_time}` : ''
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
      const returnDateContract = formatDateLocalized(contrat.dossier!.return_date!, effectiveLang)
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
  doc.text(t.passengers, 17, y)
  doc.setTextColor(0, 0, 0)
  doc.text(`${contrat.dossier?.passengers || '-'} ${t.persons}`, 50, y)

  // Colonne droite
  doc.setTextColor(100, 100, 100)
  doc.text(t.vehicle, 100, y)
  doc.setTextColor(0, 0, 0)
  doc.text(`${nombreCars} ${t.coach}${nombreCars > 1 ? 's' : ''}`, 130, y)

  y += 5
  doc.setTextColor(100, 100, 100)
  doc.text(t.numberOfDrivers, 17, y)
  doc.setTextColor(0, 0, 0)
  doc.text(`${nombreChauffeurs} ${nombreChauffeurs > 1 ? t.drivers : t.driver}`, 50, y)

  // Kilométrage si disponible
  if (contrat.km) {
    doc.setTextColor(100, 100, 100)
    doc.text(t.includedKm, 100, y)
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
  doc.text(t.designation, 17, y)
  doc.text(t.qty, 97, y)
  doc.text(t.unitPriceHT, 127, y)
  doc.text(vatLabel, 157, y)
  doc.text(t.totalHT, pageWidth - 17, y, { align: 'right' })

  // Ligne de données - Prestation transport
  y += 10
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  // Description condensée pour le tableau
  let trajetDescShort = t.transportOneWay
  if (isMiseADispo) {
    trajetDescShort = t.transportMAD
    if (contrat.duree_jours && contrat.duree_jours > 1) {
      trajetDescShort += ` (${contrat.duree_jours} ${t.days})`
    }
  } else if (isAllerRetour) {
    trajetDescShort = t.transportRoundTrip
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
  doc.text(`${t.vatDetails}`, 17, y + 5.5)

  y += 14
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)

  // En-têtes TVA
  doc.setFont('helvetica', 'bold')
  doc.text(`Taux ${vatLabel}`, 17, y)
  doc.text('Base HT', 70, y)
  doc.text(`Montant ${vatLabel}`, 120, y)

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
  doc.text(t.summary, recapX + 5, y + 5.5)

  y += 12
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'normal')

  // Total HT
  doc.text(t.totalHT, recapX + 5, y)
  doc.text(`${formatAmount(priceHT)} €`, recapX + recapWidth - 5, y, { align: 'right' })

  y += 6
  // Total TVA
  doc.text(`Total ${vatLabel} (${tvaRate}%)`, recapX + 5, y)
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
  doc.text(t.totalTTC, recapX + 5, y + 2)
  doc.text(`${formatAmount(contrat.price_ttc)} €`, recapX + recapWidth - 5, y + 2, { align: 'right' })

  // Prix par personne/car
  y += 12
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  if (nombreCars > 1) {
    doc.text(`${t.orText} ${formatAmount(contrat.price_ttc / nombreCars)} € TTC ${t.perCar}`, recapX + recapWidth - 5, y, { align: 'right' })
    y += 4
  }
  if (contrat.dossier?.passengers && contrat.dossier.passengers > 0) {
    doc.text(`${t.orText} ${formatAmount(contrat.price_ttc / contrat.dossier.passengers)} € TTC ${t.perPerson}`, recapX + recapWidth - 5, y, { align: 'right' })
  }

  // ========== PAIEMENTS ==========
  const totalPaye = (contrat.paiements || []).reduce((sum, p) => sum + p.amount, 0)
  const resteARegler = contrat.price_ttc - totalPaye

  y += 15
  doc.setFontSize(9)
  doc.setTextColor(0, 128, 0)
  doc.setFont('helvetica', 'normal')
  doc.text(`${t.alreadyPaid} :`, recapX + 5, y)
  doc.text(`${formatAmount(totalPaye)} €`, recapX + recapWidth - 5, y, { align: 'right' })

  y += 6
  drawRect(doc, recapX, y - 4, recapWidth, 8, '#fef2f2')
  doc.setTextColor(185, 28, 28)
  doc.setFont('helvetica', 'bold')
  doc.text(`${t.remainingToPay} :`, recapX + 5, y)
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
  doc.text(t.paymentInfo, 20, y + 5.5)

  y += 14
  doc.setFontSize(8)
  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'normal')

  doc.setFont('helvetica', 'bold')
  doc.text(`${t.iban} :`, 20, y)
  doc.setFont('helvetica', 'normal')
  doc.text(COMPANY_INFO.rib.iban, 40, y)

  y += 5
  doc.setFont('helvetica', 'bold')
  doc.text(`${t.bic} :`, 20, y)
  doc.setFont('helvetica', 'normal')
  doc.text(COMPANY_INFO.rib.bic, 40, y)

  y += 5
  doc.setFont('helvetica', 'bold')
  doc.text(`${t.reference} :`, 20, y)
  doc.setFont('helvetica', 'normal')
  doc.text(contrat.reference, 50, y)

  // Modalités à droite du bloc paiement
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  const modalY = y - 10
  doc.text(t.depositOnBooking, 120, modalY)
  doc.text(t.balanceBeforeDeparture, 120, modalY + 4)
  doc.text(t.paymentByCardOrTransfer, 120, modalY + 8)

  // ========== PAIEMENTS EFFECTUÉS ==========
  if (contrat.paiements && contrat.paiements.length > 0) {
    y += 15
    // Vérifier si on a besoin d'une nouvelle page
    y = checkPageBreak(doc, y, 10 + contrat.paiements.length * 4, COMPANY_INFO)
    doc.setFontSize(8)
    doc.setTextColor(21, 87, 36)
    doc.setFont('helvetica', 'bold')
    doc.text(`${t.paymentsMade} :`, 20, y)
    doc.setFont('helvetica', 'normal')
    y += 5
    contrat.paiements.forEach((p, i) => {
      const typeLabel = p.type === 'cb' ? t.paymentCB : p.type === 'virement' ? t.paymentTransfer : p.type
      doc.text(`• ${formatDateLocalized(p.payment_date, effectiveLang)} - ${typeLabel} - ${formatAmount(p.amount)} €`, 25, y + (i * 4))
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
  doc.text(t.cancellationConditions, 17, y)
  doc.setFont('helvetica', 'normal')

  y += 7
  doc.setFontSize(7)
  doc.setTextColor(60, 60, 60)
  // Texte d'introduction
  const conditionsIntroProforma = t.cancellationIntro
  const introLinesProforma = doc.splitTextToSize(conditionsIntroProforma, pageWidth - 35)
  doc.text(introLinesProforma, 17, y)
  y += introLinesProforma.length * 3.5 + 3

  doc.setFontSize(8)
  const conditionsProforma = [
    t.cancellation31,
    t.cancellation30to14,
    t.cancellation13to8,
    t.cancellation7,
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
  country_code?: string | null
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

export async function generateFacturePDF(facture: FactureData, lang: string = 'fr'): Promise<void> {
  // Récupérer les infos pays basées sur country_code
  const countryCode = facture.country_code || 'FR'
  const countryInfo = await getCountryInfo(countryCode)

  // Déterminer la langue à partir du pays si non spécifiée
  const effectiveLang = lang || (countryCode === 'DE' ? 'de' : countryCode === 'ES' ? 'es' : countryCode === 'GB' ? 'en' : 'fr')

  const COMPANY_INFO = await getCompanyInfo(countryCode)
  const t = getPdfTranslations(effectiveLang)
  const doc = new jsPDF({
    format: 'a4',
    orientation: 'portrait'
  })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  // Utiliser le taux TVA du pays (prioritaire pour garantir le bon taux légal), sinon celui de la facture
  const tvaRate = countryInfo.vatRate ?? facture.tva_rate ?? 10
  const vatLabel = countryInfo.vatLabel || t.vatRate
  const tvaAmount = facture.amount_ttc - facture.amount_ht

  // Couleurs Busmoov
  const purpleDark = '#582C87'
  const magenta = '#E91E8C'
  const purpleLight = '#f3e8ff'
  const grayBg = '#f8f9fa'

  // Déterminer le type de document
  const isAvoir = facture.type === 'avoir'
  const docTitle = isAvoir ? t.creditNote : t.invoice
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
    const typeLabel = facture.type === 'acompte' ? t.invoiceDeposit : t.invoiceBalance
    doc.text(`${docTitle} ${typeLabel}`, 15, y)
  } else {
    doc.text(docTitle, 15, y)
  }

  // Références
  y += 8
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'normal')
  doc.text(`${t.number} ${facture.reference}`, 15, y)
  doc.text(`${t.date} : ${formatDateLocalized(facture.created_at || new Date().toISOString(), effectiveLang)}`, 80, y)
  if (facture.dossier?.reference) {
    doc.text(`${t.dossier} : ${facture.dossier.reference}`, 140, y)
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
  doc.text(t.billedTo, 20, y + 5.5)

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
  doc.text(t.prestation, 20, y + 5.5)

  y += 14

  // Type de facture (Acompte / Solde / Avoir)
  const factureTypeLabel = facture.type === 'acompte' ? `${t.deposit} (30%)` : facture.type === 'solde' ? t.balance : t.creditNote

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
    doc.text(t.departurePlace, 17, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const departureTextFact = facture.dossier.departure || '-'
    const departureLinesFacture = doc.splitTextToSize(departureTextFact, 80)
    doc.text(departureLinesFacture, 45, y)
    y += departureLinesFacture.length * 4 + 4

    // Description du trajet - Arrivée
    doc.setTextColor(88, 44, 135) // Purple
    doc.setFont('helvetica', 'bold')
    doc.text(t.destinationPlace, 17, y)
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
      doc.text(t.date, 17, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(formatDateLocalized(facture.dossier.departure_date, effectiveLang), 45, y)
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
    doc.text(t.passengers, 17, y)
    doc.setTextColor(0, 0, 0)
    doc.text(`${facture.dossier.passengers || '-'} ${t.persons}`, 50, y)

    // Colonne droite
    doc.setTextColor(100, 100, 100)
    doc.text(t.vehicle, 100, y)
    doc.setTextColor(0, 0, 0)
    doc.text(`${nombreCars} ${t.coach}${nombreCars > 1 ? 's' : ''}`, 130, y)

    y += 5
    doc.setTextColor(100, 100, 100)
    doc.text(t.numberOfDrivers, 17, y)
    doc.setTextColor(0, 0, 0)
    doc.text(`${nombreChauffeurs} ${nombreChauffeurs > 1 ? t.drivers : t.driver}`, 50, y)

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
  doc.text(t.designation, 17, y)
  doc.text(t.qty, 97, y)
  doc.text(t.unitPriceHT, 127, y)
  doc.text(vatLabel, 157, y)
  doc.text(t.totalHT, pageWidth - 17, y, { align: 'right' })

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

    const prefixLabel = facture.type === 'acompte' ? `${t.depositPercent} 30% - ` : facture.type === 'solde' ? `${t.balancePercent} 70% - ` : isAvoir ? `${t.creditNote} - ` : ''
    doc.setFontSize(8)
    doc.text(`${prefixLabel}${t.transportService}`, 17, y)
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
    let trajetDescFacture = t.transportService
    if (facture.type === 'acompte') {
      const totalTTC = facture.dossier?.total_ttc
      if (totalTTC) {
        trajetDescFacture = `${t.depositPercent} 30% - ${t.transportService} (${t.totalTTCLabel} : ${formatAmount(totalTTC)} €)`
      } else {
        trajetDescFacture = `${t.depositPercent} 30% - ${t.transportService}`
      }
    } else if (facture.type === 'solde') {
      if (facture.facture_acompte) {
        trajetDescFacture = `${t.balancePercent} 70% - ${t.transportService} (${t.depositRefLabel} ${facture.facture_acompte.reference} : ${formatAmount(facture.facture_acompte.amount_ttc)} € TTC)`
      } else {
        trajetDescFacture = `${t.balancePercent} 70% - ${t.transportService}`
      }
    } else if (isAvoir) {
      trajetDescFacture = t.creditNoteDesc
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
  doc.text(`${t.vatDetails}`, 17, y + 5.5)

  y += 14
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)

  // En-têtes TVA
  doc.setFont('helvetica', 'bold')
  doc.text(`Taux ${vatLabel}`, 17, y)
  doc.text('Base HT', 70, y)
  doc.text(`Montant ${vatLabel}`, 120, y)

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
  doc.text(t.summary, recapX + 5, y + 5.5)

  y += 12
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'normal')

  // Total HT
  doc.text(t.totalHT, recapX + 5, y)
  doc.text(`${displayBaseHT} €`, recapX + recapWidth - 5, y, { align: 'right' })

  y += 6
  // Total TVA
  doc.text(`Total ${vatLabel} (${tvaRate}%)`, recapX + 5, y)
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
  doc.text(t.totalTTC, recapX + 5, y + 2)
  const displayTTC = isAvoir ? `-${formatAmount(Math.abs(facture.amount_ttc))}` : formatAmount(facture.amount_ttc)
  doc.text(`${displayTTC} €`, recapX + recapWidth - 5, y + 2, { align: 'right' })

  // Prix par personne/car
  if (!isAvoir) {
    y += 12
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    if (nombreCars > 1) {
      doc.text(`${t.orText} ${formatAmount(facture.amount_ttc / nombreCars)} € TTC ${t.perCar}`, recapX + recapWidth - 5, y, { align: 'right' })
      y += 4
    }
    if (facture.dossier?.passengers && facture.dossier.passengers > 0) {
      doc.text(`${t.orText} ${formatAmount(facture.amount_ttc / facture.dossier.passengers)} € TTC ${t.perPerson}`, recapX + recapWidth - 5, y, { align: 'right' })
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
    doc.text(t.paymentInfo, 20, y + 5.5)

    y += 14
    doc.setFontSize(8)
    doc.setTextColor(60, 60, 60)
    doc.setFont('helvetica', 'normal')

    doc.setFont('helvetica', 'bold')
    doc.text(`${t.iban} :`, 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(COMPANY_INFO.rib.iban, 40, y)

    y += 5
    doc.setFont('helvetica', 'bold')
    doc.text(`${t.bic} :`, 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(COMPANY_INFO.rib.bic, 40, y)

    y += 5
    doc.setFont('helvetica', 'bold')
    doc.text(`${t.reference} :`, 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(facture.reference, 50, y)
  }

  // ========== FOOTER ==========
  drawFooter(doc, COMPANY_INFO)

  const prefix = facture.type === 'acompte' ? 'Facture_Acompte' : facture.type === 'solde' ? 'Facture_Solde' : 'Avoir'
  doc.save(`${prefix}_${facture.reference}.pdf`)
}

// Version qui retourne le PDF en base64 pour envoi par email
export async function generateFacturePDFBase64(facture: FactureData, lang: string = 'fr'): Promise<{ base64: string; filename: string }> {
  // Récupérer les infos pays basées sur country_code
  const countryCode = facture.country_code || 'FR'
  const countryInfo = await getCountryInfo(countryCode)

  // Déterminer la langue à partir du pays si non spécifiée
  const effectiveLang = lang || (countryCode === 'DE' ? 'de' : countryCode === 'ES' ? 'es' : countryCode === 'GB' ? 'en' : 'fr')

  const COMPANY_INFO = await getCompanyInfo(countryCode)
  const t = getPdfTranslations(effectiveLang)
  const doc = new jsPDF({
    format: 'a4',
    orientation: 'portrait'
  })
  const pageWidth = doc.internal.pageSize.getWidth()
  // Utiliser le taux TVA du pays (prioritaire pour garantir le bon taux légal), sinon celui de la facture
  const tvaRate = countryInfo.vatRate ?? facture.tva_rate ?? 10
  const vatLabel = countryInfo.vatLabel || t.vatRate
  const tvaAmount = facture.amount_ttc - facture.amount_ht

  // Couleurs Busmoov
  const purpleDark = '#582C87'
  const magenta = '#E91E8C'

  // Déterminer le type de document
  const isAvoir = facture.type === 'avoir'
  const docTitle = isAvoir ? t.creditNote : t.invoice
  const titleColor = isAvoir ? '#b42828' : purpleDark

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
    const typeLabel = facture.type === 'acompte' ? t.invoiceDeposit : t.invoiceBalance
    doc.text(`${docTitle} ${typeLabel}`, 15, y)
  } else {
    doc.text(docTitle, 15, y)
  }

  // Références
  y += 8
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'normal')
  doc.text(`${t.number} ${facture.reference}`, 15, y)
  doc.text(`${t.date} : ${formatDateLocalized(facture.created_at || new Date().toISOString(), effectiveLang)}`, 80, y)
  if (facture.dossier?.reference) {
    doc.text(`${t.dossier} : ${facture.dossier.reference}`, 140, y)
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
  doc.text(t.billedTo, 20, y + 5.5)

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
  doc.text(t.prestation, 20, y + 5.5)

  y += 14

  // Type de facture (Acompte / Solde / Avoir)
  const factureTypeLabel = facture.type === 'acompte' ? `${t.deposit} (30%)` : facture.type === 'solde' ? t.balance : t.creditNote

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
    doc.text(t.departurePlace, 17, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const departureTextFact = facture.dossier.departure || '-'
    const departureLinesFacture = doc.splitTextToSize(departureTextFact, 80)
    doc.text(departureLinesFacture, 45, y)
    y += departureLinesFacture.length * 4 + 4

    // Description du trajet - Arrivée
    doc.setTextColor(88, 44, 135) // Purple
    doc.setFont('helvetica', 'bold')
    doc.text(t.destinationPlace, 17, y)
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
      doc.text(t.date, 17, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(formatDateLocalized(facture.dossier.departure_date, effectiveLang), 45, y)
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
    doc.text(t.passengers, 17, y)
    doc.setTextColor(0, 0, 0)
    doc.text(`${facture.dossier.passengers || '-'} ${t.persons}`, 50, y)

    // Colonne droite
    doc.setTextColor(100, 100, 100)
    doc.text(t.vehicle, 100, y)
    doc.setTextColor(0, 0, 0)
    doc.text(`${nombreCars} ${t.coach}${nombreCars > 1 ? 's' : ''}`, 130, y)

    y += 5
    doc.setTextColor(100, 100, 100)
    doc.text(t.drivers, 100, y)
    doc.setTextColor(0, 0, 0)
    doc.text(`${nombreChauffeurs}`, 130, y)

    y += 8
  }

  // ========== TABLEAU DES MONTANTS ==========
  y += 5

  // Cadre du tableau avec ombre légère
  const tableWidth = 90
  const tableX = pageWidth - tableWidth - 15
  const tableY = y

  // Fond du tableau
  doc.setFillColor(248, 249, 250)
  doc.rect(tableX, tableY, tableWidth, 32, 'F')

  // Bordure
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.rect(tableX, tableY, tableWidth, 32)

  // Ligne HT
  y = tableY + 7
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(t.totalHT, tableX + 5, y)
  doc.setTextColor(0, 0, 0)
  doc.text(`${formatAmount(facture.amount_ht)} €`, tableX + tableWidth - 5, y, { align: 'right' })

  // Ligne TVA
  y += 8
  doc.setTextColor(100, 100, 100)
  doc.text(`${vatLabel} (${tvaRate}%)`, tableX + 5, y)
  doc.setTextColor(0, 0, 0)
  doc.text(`${formatAmount(tvaAmount)} €`, tableX + tableWidth - 5, y, { align: 'right' })

  // Ligne de séparation avant total
  y += 4
  doc.setDrawColor(150, 150, 150)
  doc.line(tableX + 5, y, tableX + tableWidth - 5, y)

  // Total TTC - plus grand et en couleur
  y += 9
  const amountRgb = hexToRgb(isAvoir ? '#b42828' : magenta)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(amountRgb?.r || 233, amountRgb?.g || 30, amountRgb?.b || 140)
  doc.text(t.totalTTC, tableX + 5, y)
  doc.text(`${formatAmount(Math.abs(facture.amount_ttc))} €`, tableX + tableWidth - 5, y, { align: 'right' })

  // Pour les avoirs, ajouter un signe négatif
  if (isAvoir) {
    doc.setFontSize(10)
    doc.text('(à déduire)', tableX + 5, y + 5)
  }

  // ========== INFORMATIONS DE PAIEMENT (sauf pour avoir) ==========
  if (!isAvoir) {
    y = tableY + 50
    // Cadre paiement
    doc.setDrawColor(88, 44, 135)
    doc.setLineWidth(0.5)
    doc.rect(15, y, pageWidth - 30, 30)

    const purpleLight = '#f3e8ff'
    drawRect(doc, 15, y, pageWidth - 30, 8, purpleLight)
    doc.setFontSize(9)
    doc.setTextColor(88, 44, 135)
    doc.setFont('helvetica', 'bold')
    doc.text(t.paymentInfo, 20, y + 5.5)

    y += 14
    doc.setFontSize(8)
    doc.setTextColor(60, 60, 60)
    doc.setFont('helvetica', 'normal')

    doc.setFont('helvetica', 'bold')
    doc.text(`${t.iban} :`, 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(COMPANY_INFO.rib.iban, 40, y)

    y += 5
    doc.setFont('helvetica', 'bold')
    doc.text(`${t.bic} :`, 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(COMPANY_INFO.rib.bic, 40, y)

    y += 5
    doc.setFont('helvetica', 'bold')
    doc.text(`${t.reference} :`, 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(facture.reference, 50, y)
  }

  // ========== FOOTER ==========
  drawFooter(doc, COMPANY_INFO)

  const prefix = facture.type === 'acompte' ? 'Facture_Acompte' : facture.type === 'solde' ? 'Facture_Solde' : 'Avoir'
  const filename = `${prefix}_${facture.reference}.pdf`

  // Retourner le base64 au lieu de télécharger
  const pdfBase64 = doc.output('datauristring').split(',')[1]
  return { base64: pdfBase64, filename }
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

export async function generateFeuilleRoutePDF(data: FeuilleRouteData, lang: string = 'fr'): Promise<void> {
  const COMPANY_INFO = await getCompanyInfo()
  const t = getPdfTranslations(lang)
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
  doc.text(t.roadmap, pageWidth / 2 + 20, 15, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Devis ${data.reference}${data.dossier_reference ? ` - Dossier ${data.dossier_reference}` : ''}`, pageWidth / 2 + 20, 22, { align: 'center' })

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
  // Si aller seul ou retour seul: une seule colonne pleine largeur
  const isSingleColumn = data.type === 'aller' || data.type === 'retour'
  const colWidth = isSingleColumn ? pageWidth - 30 : (pageWidth - 40) / 2
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
    arrivee: string | null | undefined,
    columnWidth: number = colWidth
  ) => {
    let colY = startY

    // Header avec titre
    const rgb = hexToRgb(titleColor)
    if (rgb) doc.setFillColor(rgb.r, rgb.g, rgb.b)
    doc.rect(startX, colY, columnWidth, 8, 'F')
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
    doc.text(t.departureDate, startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    doc.text(date ? formatDateLocalized(date, lang) : '-', startX, colY)

    colY += 10
    // Heure de départ
    doc.setTextColor(88, 44, 135) // Purple Busmoov
    doc.text(t.departureDate.replace('Date', 'Heure'), startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    doc.text(heure || '-', startX, colY)

    colY += 10
    // Lieu de départ
    doc.setTextColor(88, 44, 135) // Purple Busmoov
    doc.text(t.departurePlace, startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    const departLines = doc.splitTextToSize(depart || 'Non renseigné', columnWidth - 5)
    doc.text(departLines, startX, colY)
    colY += departLines.length * 4 + 4

    // Lieu de destination
    doc.setTextColor(88, 44, 135) // Purple Busmoov
    doc.text('Lieu de destination', startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    const arriveeLines = doc.splitTextToSize(arrivee || 'Non renseigné', columnWidth - 5)
    doc.text(arriveeLines, startX, colY)
    colY += arriveeLines.length * 4

    return colY
  }

  // Dessiner les colonnes selon le type
  let maxY = y
  if (data.type === 'aller') {
    // Aller seul - colonne pleine largeur
    const endY = drawTrajetColumnWithChauffeur(
      colLeftX, y, 'Transfert aller', purpleDark,
      data.chauffeur_aller_nom, data.chauffeur_aller_tel,
      data.aller_date, data.aller_heure,
      data.aller_adresse_depart, data.aller_adresse_arrivee,
      colWidth
    )
    maxY = Math.max(maxY, endY)
  } else if (data.type === 'retour') {
    // Retour seul - colonne pleine largeur
    const endY = drawTrajetColumnWithChauffeur(
      colLeftX, y, 'Transfert retour', purpleDark,
      data.chauffeur_retour_nom, data.chauffeur_retour_tel,
      data.retour_date, data.retour_heure,
      data.retour_adresse_depart, data.retour_adresse_arrivee,
      colWidth
    )
    maxY = Math.max(maxY, endY)
  } else if (data.type === 'aller_retour') {
    // Aller-retour - deux colonnes
    const endYAller = drawTrajetColumnWithChauffeur(
      colLeftX, y, 'Transfert aller', purpleDark,
      data.chauffeur_aller_nom, data.chauffeur_aller_tel,
      data.aller_date, data.aller_heure,
      data.aller_adresse_depart, data.aller_adresse_arrivee,
      colWidth
    )
    const endYRetour = drawTrajetColumnWithChauffeur(
      colRightX, y, 'Transfert retour', purpleDark,
      data.chauffeur_retour_nom, data.chauffeur_retour_tel,
      data.retour_date, data.retour_heure,
      data.retour_adresse_depart, data.retour_adresse_arrivee,
      colWidth
    )
    maxY = Math.max(maxY, endYAller, endYRetour)
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
export async function generateFeuilleRoutePDFBase64(data: FeuilleRouteData, lang: string = 'fr'): Promise<{ base64: string; filename: string }> {
  const COMPANY_INFO = await getCompanyInfo()
  const t = getPdfTranslations(lang)
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
  doc.text(t.roadmap, pageWidth / 2 + 20, 15, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Devis ${data.reference}${data.dossier_reference ? ` - Dossier ${data.dossier_reference}` : ''}`, pageWidth / 2 + 20, 22, { align: 'center' })

  let y = 40

  // TYPE DE TRAJET (traduit selon la langue)
  const outwardLabel = lang === 'de' ? 'Hinfahrt' : lang === 'es' ? 'Ida' : lang === 'en' ? 'Outbound' : 'Aller'
  const returnLabel = lang === 'de' ? 'Rückfahrt' : lang === 'es' ? 'Vuelta' : lang === 'en' ? 'Return' : 'Retour'
  const transferLabel = lang === 'de' ? 'Transfer' : lang === 'es' ? 'Traslado' : lang === 'en' ? 'Transfer' : 'Transfert'
  const passengersLabel = lang === 'de' ? 'Passagiere' : lang === 'es' ? 'pasajeros' : lang === 'en' ? 'passengers' : 'passagers'

  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  const typeLabel = data.type === 'aller_retour' ? `${transferLabel} ${outwardLabel}/${returnLabel}` : data.type === 'aller' ? `${transferLabel} ${outwardLabel}` : `${transferLabel} ${returnLabel}`
  doc.text(typeLabel, pageWidth / 2, y, { align: 'center' })

  y += 8
  const paxAller = data.aller_passagers || '-'
  const paxRetour = data.retour_passagers || '-'
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  if (data.type === 'aller_retour') {
    const outLabel = lang === 'de' ? 'zur Hinfahrt' : lang === 'es' ? 'a la ida' : lang === 'en' ? 'outbound' : "à l'aller"
    const retLabel = lang === 'de' ? 'zur Rückfahrt' : lang === 'es' ? 'a la vuelta' : lang === 'en' ? 'return' : 'au retour'
    doc.text(`${paxAller} ${passengersLabel} ${outLabel} / ${paxRetour} ${passengersLabel} ${retLabel}`, pageWidth / 2, y, { align: 'center' })
  } else if (data.type === 'aller') {
    doc.text(`${paxAller} ${passengersLabel}`, pageWidth / 2, y, { align: 'center' })
  } else {
    doc.text(`${paxRetour} ${passengersLabel}`, pageWidth / 2, y, { align: 'center' })
  }

  y += 15

  // Si aller seul ou retour seul: une seule colonne pleine largeur
  const isSingleColumn = data.type === 'aller' || data.type === 'retour'
  const colWidth = isSingleColumn ? pageWidth - 30 : (pageWidth - 40) / 2
  const colLeftX = 15
  const colRightX = pageWidth / 2 + 5

  // Traductions pour la feuille de route
  const driverContactLabel = lang === 'de' ? 'Fahrerkontakt' : lang === 'es' ? 'Contacto conductor' : lang === 'en' ? 'Driver contact' : 'Contact chauffeur'
  const departureDateLabel = lang === 'de' ? 'Abfahrtsdatum' : lang === 'es' ? 'Fecha de salida' : lang === 'en' ? 'Departure date' : 'Date de départ'
  const departureTimeLabel = lang === 'de' ? 'Abfahrtszeit' : lang === 'es' ? 'Hora de salida' : lang === 'en' ? 'Departure time' : 'Heure de départ'
  const departureLocationLabel = lang === 'de' ? 'Abfahrtsort' : lang === 'es' ? 'Lugar de salida' : lang === 'en' ? 'Departure location' : 'Lieu de départ'
  const destinationLabel = lang === 'de' ? 'Zielort' : lang === 'es' ? 'Destino' : lang === 'en' ? 'Destination' : 'Lieu de destination'
  const notSpecifiedLabel = lang === 'de' ? 'Nicht angegeben' : lang === 'es' ? 'No especificado' : lang === 'en' ? 'Not specified' : 'Non renseigné'

  const drawTrajetColumnWithChauffeur = (
    startX: number, startY: number, title: string, titleColor: string,
    chauffeurNom: string | null | undefined, chauffeurTel: string | null | undefined,
    date: string | null | undefined, heure: string | null | undefined,
    depart: string | null | undefined, arrivee: string | null | undefined,
    columnWidth: number = colWidth
  ) => {
    let colY = startY
    const rgb = hexToRgb(titleColor)
    if (rgb) doc.setFillColor(rgb.r, rgb.g, rgb.b)
    doc.rect(startX, colY, columnWidth, 8, 'F')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text(title, startX + 5, colY + 5.5)
    colY += 14

    doc.setFontSize(9)
    doc.setTextColor(233, 30, 140)
    doc.setFont('helvetica', 'bold')
    // Extraire le type (aller/retour) du titre pour le contact chauffeur
    const typeForContact = title.toLowerCase().includes('retour') || title.toLowerCase().includes('return') || title.toLowerCase().includes('rück') || title.toLowerCase().includes('vuelta') ? (lang === 'de' ? 'Rückfahrt' : lang === 'es' ? 'vuelta' : lang === 'en' ? 'return' : 'retour') : (lang === 'de' ? 'Hinfahrt' : lang === 'es' ? 'ida' : lang === 'en' ? 'outbound' : 'aller')
    doc.text(`${driverContactLabel} ${typeForContact}`, startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    const chauffeurInfo = chauffeurNom ? `${chauffeurNom} ${chauffeurTel || ''}` : '-'
    doc.text(chauffeurInfo, startX, colY)
    colY += 10

    doc.setTextColor(88, 44, 135)
    doc.text(departureDateLabel, startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    doc.text(date ? formatDateLocalized(date, lang) : '-', startX, colY)
    colY += 10

    doc.setTextColor(88, 44, 135)
    doc.text(departureTimeLabel, startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    doc.text(heure || '-', startX, colY)
    colY += 10

    doc.setTextColor(88, 44, 135)
    doc.text(departureLocationLabel, startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    const departLines = doc.splitTextToSize(depart || notSpecifiedLabel, columnWidth - 5)
    doc.text(departLines, startX, colY)
    colY += departLines.length * 4 + 4

    doc.setTextColor(88, 44, 135)
    doc.text(destinationLabel, startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    const arriveeLines = doc.splitTextToSize(arrivee || notSpecifiedLabel, columnWidth - 5)
    doc.text(arriveeLines, startX, colY)
    colY += arriveeLines.length * 4

    return colY
  }

  // Titres traduits pour les colonnes
  const outboundTitle = `${transferLabel} ${outwardLabel}`
  const returnTitle = `${transferLabel} ${returnLabel}`

  let maxY = y
  if (data.type === 'aller') {
    // Aller seul - colonne pleine largeur
    const endY = drawTrajetColumnWithChauffeur(
      colLeftX, y, outboundTitle, purpleDark,
      data.chauffeur_aller_nom, data.chauffeur_aller_tel,
      data.aller_date, data.aller_heure,
      data.aller_adresse_depart, data.aller_adresse_arrivee,
      colWidth
    )
    maxY = Math.max(maxY, endY)
  } else if (data.type === 'retour') {
    // Retour seul - colonne pleine largeur
    const endY = drawTrajetColumnWithChauffeur(
      colLeftX, y, returnTitle, purpleDark,
      data.chauffeur_retour_nom, data.chauffeur_retour_tel,
      data.retour_date, data.retour_heure,
      data.retour_adresse_depart, data.retour_adresse_arrivee,
      colWidth
    )
    maxY = Math.max(maxY, endY)
  } else if (data.type === 'aller_retour') {
    // Aller-retour - deux colonnes
    const endYAller = drawTrajetColumnWithChauffeur(
      colLeftX, y, outboundTitle, purpleDark,
      data.chauffeur_aller_nom, data.chauffeur_aller_tel,
      data.aller_date, data.aller_heure,
      data.aller_adresse_depart, data.aller_adresse_arrivee,
      colWidth
    )
    const endYRetour = drawTrajetColumnWithChauffeur(
      colRightX, y, returnTitle, purpleDark,
      data.chauffeur_retour_nom, data.chauffeur_retour_tel,
      data.retour_date, data.retour_heure,
      data.retour_adresse_depart, data.retour_adresse_arrivee,
      colWidth
    )
    maxY = Math.max(maxY, endYAller, endYRetour)
  }

  y = maxY + 15

  // OPTIONS - traductions
  const contractIncludesLabel = lang === 'de' ? 'Ihr Vertrag beinhaltet' : lang === 'es' ? 'Su contrato incluye' : lang === 'en' ? 'Your contract includes' : 'Votre contrat comprend'
  const contractNotIncludesLabel = lang === 'de' ? 'Nicht im Vertrag enthalten' : lang === 'es' ? 'No incluido en su contrato' : lang === 'en' ? 'Not included in your contract' : 'Votre contrat ne comprend pas'
  const optColWidth = (pageWidth - 40) / 2
  doc.setFontSize(10)
  doc.setTextColor(88, 44, 135)
  doc.setFont('helvetica', 'bold')
  doc.text(contractIncludesLabel, colLeftX, y)
  drawLine(doc, y + 2, colLeftX, colLeftX + optColWidth - 10)
  doc.text(contractNotIncludesLabel, colRightX, y)
  drawLine(doc, y + 2, colRightX, colRightX + optColWidth - 10)

  y += 10
  doc.setFontSize(9)
  doc.setTextColor(grayText[0], grayText[1], grayText[2])
  doc.setFont('helvetica', 'normal')

  const incluses = data.options_incluses || []
  incluses.forEach((opt, i) => { doc.text(opt, colLeftX, y + i * 5) })

  const defaultExtraKm = lang === 'de' ? 'Zusätzliche Kilometer' : lang === 'es' ? 'Kilómetros adicionales' : lang === 'en' ? 'Extra kilometres' : 'Kilomètres supplémentaires'
  const defaultExtraHours = lang === 'de' ? 'Zusätzliche Stunden' : lang === 'es' ? 'Horas adicionales' : lang === 'en' ? 'Extra hours' : 'Heures supplémentaires'
  const nonIncluses = data.options_non_incluses || [defaultExtraKm, defaultExtraHours]
  nonIncluses.forEach((opt, i) => { doc.text(opt, colRightX, y + i * 5) })

  y += Math.max(incluses.length, nonIncluses.length) * 5 + 10

  // INFOS COMPLEMENTAIRES - traductions
  const additionalInfoLabel = lang === 'de' ? 'Zusätzliche Informationen' : lang === 'es' ? 'Información adicional' : lang === 'en' ? 'Additional information' : 'Informations complémentaires'
  const luggageTypeLabel = lang === 'de' ? 'Gepäckart: ' : lang === 'es' ? 'Tipo de equipaje: ' : lang === 'en' ? 'Luggage type: ' : 'Type de bagage : '
  const noLuggageLabel = lang === 'de' ? 'Kein Gepäck' : lang === 'es' ? 'Sin equipaje' : lang === 'en' ? 'No luggage' : 'Pas de bagage'
  doc.setFontSize(11)
  doc.setTextColor(88, 44, 135)
  doc.setFont('helvetica', 'bold')
  doc.text(additionalInfoLabel, 15, y)
  y += 8

  doc.setFontSize(9)
  doc.setTextColor(grayText[0], grayText[1], grayText[2])
  doc.setFont('helvetica', 'normal')
  doc.setFont('helvetica', 'bold')
  doc.text(luggageTypeLabel, 15, y)
  doc.setFont('helvetica', 'normal')
  const bagageFeuille = data.luggage_type || noLuggageLabel
  doc.text(bagageFeuille, 15 + doc.getTextWidth(luggageTypeLabel), y)

  if (data.commentaires) {
    y += 8
    const commentLines = doc.splitTextToSize(data.commentaires, pageWidth - 30)
    doc.text(commentLines.slice(0, 3), 15, y)
    y += commentLines.slice(0, 3).length * 4
  }

  // ASTREINTE - traduction
  const emergencyContactLabel = lang === 'de' ? 'Im Notfall kontaktieren Sie' : lang === 'es' ? 'En caso de emergencia contactar al' : lang === 'en' ? 'In case of emergency contact' : "En cas d'urgence contacter le"
  y += 15
  doc.setFontSize(10)
  doc.setTextColor(233, 30, 140)
  doc.setFont('helvetica', 'bold')
  const astreinteTel = data.astreinte_tel || COMPANY_INFO.phone
  doc.text(`${emergencyContactLabel} ${astreinteTel}.`, pageWidth / 2, y, { align: 'center' })

  // PAGE 2 - LEGISLATION
  const legislationReminderLabel = lang === 'de' ? 'Gesetzliche Hinweise' : lang === 'es' ? 'Recordatorio de la legislación' : lang === 'en' ? 'Legislation reminder' : 'Rappel de la législation'
  doc.addPage()
  y = 20
  doc.setFontSize(11)
  doc.setTextColor(88, 44, 135)
  doc.setFont('helvetica', 'bold')
  doc.text(legislationReminderLabel, 15, y)
  drawLine(doc, y + 2, 15, pageWidth - 15)

  y += 15
  doc.setFontSize(9)
  doc.setTextColor(grayText[0], grayText[1], grayText[2])

  // Législation traduite
  const legislationData = lang === 'de' ? [
    { title: 'Arbeitszeit', text: '12h für einen Fahrer und 18h für zwei Fahrer im Doppelteam' },
    { title: 'Fahrzeit', text: '9h Fahrzeit pro Tag für einen Fahrer.' },
    { title: 'Pause', text: 'Eine 45-minütige Pause alle 4h30 Fahrzeit.\nVon 21h bis 06h (Nachtzeiten) erfolgen die Pausen alle 4h Fahrzeit.' },
    { title: 'Ruhezeit', text: '1 Ruhetag vor Ort obligatorisch für Reisen über 6 Tage.' },
  ] : lang === 'es' ? [
    { title: 'Amplitud', text: '12h para un conductor y 18h para dos conductores en doble equipo' },
    { title: 'Tiempo de conducción', text: '9h de conducción por día para un conductor.' },
    { title: 'Descanso', text: 'Un descanso de 45 min cada 4h30 de conducción.\nDe 21h a 06h (horas nocturnas) los descansos tienen lugar cada 4h de conducción.' },
    { title: 'Reposo', text: '1 día de reposo obligatorio en el lugar para viajes de más de 6 días.' },
  ] : lang === 'en' ? [
    { title: 'Working hours', text: '12h for one driver and 18h for two drivers in double crew' },
    { title: 'Driving time', text: '9h driving time per day for one driver.' },
    { title: 'Break', text: 'A 45-minute break every 4h30 of driving.\nFrom 21h to 06h (night hours) breaks take place every 4h of driving.' },
    { title: 'Rest', text: '1 mandatory rest day on site for trips over 6 days.' },
  ] : [
    { title: 'Amplitude', text: '12h pour un conducteur et 18h pour deux conducteurs en double équipage' },
    { title: 'Temps de conduite', text: '9h de conduite pour un conducteur par jour.' },
    { title: 'Coupure', text: 'une coupure de 45 min toutes les 4h30 de conduite.\nDe 21h à 06h (heures de nuit) les coupures ont lieu toutes les 4h de conduite.' },
    { title: 'Repos', text: '1 jour de repos obligatoire sur place pour les voyages de plus de 6 jours.' },
  ]

  legislationData.forEach(item => {
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

  // Message de remerciement traduit
  const thankYouLabel = lang === 'de' ? 'Danke!' : lang === 'es' ? '¡Gracias!' : lang === 'en' ? 'Thank you!' : 'Merci !'
  const wishesLabel = lang === 'de' ? `Das Team von ${COMPANY_INFO.name} wünscht Ihnen eine gute Reise` : lang === 'es' ? `El equipo de ${COMPANY_INFO.name} le desea un excelente viaje` : lang === 'en' ? `The ${COMPANY_INFO.name} team wishes you an excellent trip` : `L'équipe de ${COMPANY_INFO.name} vous souhaite un excellent voyage`
  y += 20
  doc.setFontSize(14)
  doc.setTextColor(0, 51, 102)
  doc.setFont('helvetica', 'bold')
  doc.text(thankYouLabel, pageWidth / 2, y, { align: 'center' })
  y += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(grayText[0], grayText[1], grayText[2])
  doc.text(wishesLabel, pageWidth / 2, y, { align: 'center' })

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

export async function generateInfosVoyagePDF(data: InfosVoyageData, lang: string = 'fr'): Promise<void> {
  const COMPANY_INFO = await getCompanyInfo()
  const t = getPdfTranslations(lang)
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

  // Titre traduit pour "Informations voyage"
  const titleInfosVoyage = lang === 'de' ? 'REISEINFORMATIONEN' : lang === 'es' ? 'INFORMACIÓN DEL VIAJE' : lang === 'en' ? 'TRIP INFORMATION' : 'INFORMATIONS VOYAGE'

  // ========== HEADER ==========
  // Logo Busmoov à gauche (contient déjà le nom)
  await addLogoToPdf(doc, 15, 8, 50, 11)

  // Titre INFORMATIONS VOYAGE (côté droit)
  doc.setFontSize(16)
  doc.setTextColor(88, 44, 135) // Purple Busmoov
  doc.setFont('helvetica', 'bold')
  doc.text(titleInfosVoyage, pageWidth / 2 + 20, 15, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Devis ${data.reference}${data.dossier_reference ? ` - Dossier ${data.dossier_reference}` : ''}`, pageWidth / 2 + 20, 22, { align: 'center' })

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
  // Si aller seul ou retour seul: une seule colonne pleine largeur
  const isSingleColumn = data.type === 'aller' || data.type === 'retour'
  const colWidth = isSingleColumn ? pageWidth - 30 : (pageWidth - 40) / 2
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
    contactTel: string | null | undefined,
    columnWidth: number
  ) => {
    let colY = startY

    // Header avec titre
    const rgb = hexToRgb(titleColor)
    if (rgb) doc.setFillColor(rgb.r, rgb.g, rgb.b)
    doc.rect(startX, colY, columnWidth, 8, 'F')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text(title, startX + 5, colY + 5.5)

    colY += 14

    // Date de départ
    doc.setFontSize(9)
    doc.setTextColor(88, 44, 135) // Purple Busmoov
    doc.setFont('helvetica', 'normal')
    doc.text(t.departureDate, startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    doc.text(date ? formatDateLocalized(date, lang) : '-', startX, colY)

    colY += 10
    // Heure de départ
    doc.setTextColor(88, 44, 135) // Purple Busmoov
    doc.text(t.departureDate.replace('Date', 'Heure'), startX, colY)
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

  // Dessiner les colonnes - seulement celles qui correspondent au type
  let maxY = y
  const contactName = [data.contact_prenom, data.contact_nom].filter(Boolean).join(' ')

  if (data.type === 'aller') {
    // Aller seul - colonne pleine largeur
    const endY = drawTrajetColumn(
      colLeftX, y, 'Transfert aller', purpleDark,
      data.aller_date, data.aller_heure,
      data.aller_adresse_depart, data.aller_adresse_arrivee,
      contactName, data.contact_tel,
      colWidth
    )
    maxY = Math.max(maxY, endY)
  } else if (data.type === 'retour') {
    // Retour seul - colonne pleine largeur
    const endY = drawTrajetColumn(
      colLeftX, y, 'Transfert retour', purpleDark,
      data.retour_date, data.retour_heure,
      data.retour_adresse_depart, data.retour_adresse_arrivee,
      contactName, data.contact_tel,
      colWidth
    )
    maxY = Math.max(maxY, endY)
  } else if (data.type === 'aller_retour') {
    // Aller-retour - deux colonnes
    const endYAller = drawTrajetColumn(
      colLeftX, y, 'Transfert aller', purpleDark,
      data.aller_date, data.aller_heure,
      data.aller_adresse_depart, data.aller_adresse_arrivee,
      contactName, data.contact_tel,
      colWidth
    )
    maxY = Math.max(maxY, endYAller)

    const endYRetour = drawTrajetColumn(
      colRightX, y, 'Transfert retour', purpleDark,
      data.retour_date, data.retour_heure,
      data.retour_adresse_depart, data.retour_adresse_arrivee,
      contactName, data.contact_tel,
      colWidth
    )
    maxY = Math.max(maxY, endYRetour)
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
export async function generateInfosVoyagePDFBase64(data: InfosVoyageData, lang: string = 'fr'): Promise<{ base64: string; filename: string }> {
  const COMPANY_INFO = await getCompanyInfo()
  const t = getPdfTranslations(lang)
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

  // Titre traduit pour "Informations voyage"
  const titleInfosVoyage = lang === 'de' ? 'REISEINFORMATIONEN' : lang === 'es' ? 'INFORMACIÓN DEL VIAJE' : lang === 'en' ? 'TRIP INFORMATION' : 'INFORMATIONS VOYAGE'

  // ========== HEADER ==========
  await addLogoToPdf(doc, 15, 8, 50, 11)

  doc.setFontSize(16)
  doc.setTextColor(88, 44, 135)
  doc.setFont('helvetica', 'bold')
  doc.text(titleInfosVoyage, pageWidth / 2 + 20, 15, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Devis ${data.reference}${data.dossier_reference ? ` - Dossier ${data.dossier_reference}` : ''}`, pageWidth / 2 + 20, 22, { align: 'center' })

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

  // Si aller seul ou retour seul: une seule colonne pleine largeur
  const isSingleColumn = data.type === 'aller' || data.type === 'retour'
  const colWidth = isSingleColumn ? pageWidth - 30 : (pageWidth - 40) / 2
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
    contactTel: string | null | undefined,
    columnWidth: number
  ) => {
    let colY = startY

    const rgb = hexToRgb(titleColor)
    if (rgb) doc.setFillColor(rgb.r, rgb.g, rgb.b)
    doc.rect(startX, colY, columnWidth, 8, 'F')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text(title, startX + 5, colY + 5.5)

    colY += 14

    doc.setFontSize(9)
    doc.setTextColor(88, 44, 135)
    doc.setFont('helvetica', 'normal')
    doc.text(t.departureDate, startX, colY)
    colY += 5
    doc.setTextColor(0, 0, 0)
    doc.text(date ? formatDateLocalized(date, lang) : '-', startX, colY)

    colY += 10
    doc.setTextColor(88, 44, 135)
    doc.text(t.departureDate.replace('Date', 'Heure'), startX, colY)
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

  // Dessiner les colonnes - seulement celles qui correspondent au type
  let maxY = y
  const contactName = [data.contact_prenom, data.contact_nom].filter(Boolean).join(' ')

  if (data.type === 'aller') {
    // Aller seul - colonne pleine largeur
    const endY = drawTrajetColumn(
      colLeftX, y, 'Transfert aller', purpleDark,
      data.aller_date, data.aller_heure,
      data.aller_adresse_depart, data.aller_adresse_arrivee,
      contactName, data.contact_tel,
      colWidth
    )
    maxY = Math.max(maxY, endY)
  } else if (data.type === 'retour') {
    // Retour seul - colonne pleine largeur
    const endY = drawTrajetColumn(
      colLeftX, y, 'Transfert retour', magenta,
      data.retour_date, data.retour_heure,
      data.retour_adresse_depart, data.retour_adresse_arrivee,
      contactName, data.contact_tel,
      colWidth
    )
    maxY = Math.max(maxY, endY)
  } else if (data.type === 'aller_retour') {
    // Aller-retour - deux colonnes
    const endYAller = drawTrajetColumn(
      colLeftX, y, 'Transfert aller', purpleDark,
      data.aller_date, data.aller_heure,
      data.aller_adresse_depart, data.aller_adresse_arrivee,
      contactName, data.contact_tel,
      colWidth
    )
    maxY = Math.max(maxY, endYAller)

    const endYRetour = drawTrajetColumn(
      colRightX, y, 'Transfert retour', magenta,
      data.retour_date, data.retour_heure,
      data.retour_adresse_depart, data.retour_adresse_arrivee,
      contactName, data.contact_tel,
      colWidth
    )
    maxY = Math.max(maxY, endYRetour)
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
