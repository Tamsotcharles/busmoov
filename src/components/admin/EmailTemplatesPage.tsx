import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Mail, Edit2, Eye, Save, X, Code, Send, CheckCircle, AlertCircle, FileText, Monitor } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

// Translations for {{t:key}} replacement in previews (mirrors send-email Edge Function)
const EMAIL_TRANSLATIONS: Record<string, Record<string, string>> = {
  fr: {
    hello: 'Bonjour', dear: 'Cher', dearClient: 'Cher client', dearMadamSir: 'Madame, Monsieur',
    bestRegards: 'Cordialement', theTeam: "L'équipe Busmoov", thankYou: 'Merci', thankYouForTrust: 'Merci pour votre confiance',
    requestConfirmTitle: 'Votre demande de devis a bien été reçue', requestConfirmIntro: 'Nous avons bien reçu votre demande de transport et nous vous en remercions.',
    requestConfirmDetails: 'Récapitulatif de votre demande', yourQuotesReady: 'Vos devis sont prêts',
    quotesReadyIntro: 'Bonne nouvelle ! Nous avons préparé des devis personnalisés pour votre demande de transport.',
    viewQuotes: 'Voir mes devis', quotesCount: 'devis disponible(s)',
    accessReminder: 'Vous pouvez également accéder à vos devis depuis', withReference: 'avec la référence',
    tripDetails: 'Détails du voyage', departure: 'Départ', arrival: 'Arrivée', date: 'Date',
    departureDate: 'Date de départ', returnDate: 'Date de retour', passengers: 'Passagers',
    reference: 'Référence', dossier: 'Dossier', yourReference: 'Votre référence', route: 'Trajet',
    paymentReminder: 'Rappel de paiement', paymentReminderIntro: 'Nous vous rappelons que votre acompte est en attente de règlement.',
    payNow: 'Payer maintenant', amountDue: 'Montant à régler', deposit: 'Acompte', depositAmount: "Montant de l'acompte",
    balance: 'Solde', balanceAmount: 'Solde restant', totalPrice: 'Prix total',
    payByCard: 'Payer par carte', payByTransfer: 'Payer par virement',
    bankTransferInfo: 'Informations pour le virement bancaire', iban: 'IBAN', bic: 'BIC',
    beneficiary: 'Bénéficiaire', paymentReference: 'Référence du paiement',
    bookingConfirmed: 'Votre réservation est confirmée', bookingConfirmedIntro: 'Nous avons le plaisir de vous confirmer votre réservation de transport.',
    confirmationTitle: 'Confirmation de réservation', reservationConfirmed: 'Votre réservation est confirmée !',
    tripInfoRequest: 'Informations voyage requises', tripInfoRequestIntro: 'Afin de finaliser votre réservation, nous avons besoin de quelques informations complémentaires.',
    fillTripInfo: 'Compléter les informations', accessClientSpace: 'Accéder à mon espace client',
    tripInfoReminder: 'Merci de compléter les informations de votre voyage',
    driverInfo: 'Coordonnées de votre chauffeur', driverInfoIntro: 'Voici les coordonnées de votre chauffeur pour votre voyage.',
    driverName: 'Nom du chauffeur', driverPhone: 'Téléphone', vehicleInfo: 'Informations véhicule',
    driverDetails: 'Détails du chauffeur', yourDriverIs: 'Votre chauffeur est',
    flashOffer: 'Offre flash', flashOfferIntro: "Profitez d'une réduction exceptionnelle sur votre réservation !",
    originalPrice: 'Prix initial', newPrice: 'Nouveau prix', validFor: 'Valable pendant', hours: 'heures',
    limitedTimeOffer: 'Offre limitée dans le temps', bookNow: 'Réserver maintenant',
    reviewRequest: 'Donnez votre avis', reviewRequestIntro: 'Votre voyage s\'est bien passé ? Partagez votre expérience avec nous !',
    leaveReview: 'Donner mon avis',
    footerText: 'Cet email a été envoyé par Busmoov', footerContact: 'Pour toute question, contactez-nous',
    unsubscribe: 'Se désabonner', needHelp: "Besoin d'aide ?", contactUs: 'Contactez-nous',
    reminderUrgent: 'Rappel urgent', reminderFriendly: 'Petit rappel', daysBeforeDeparture: 'jours avant le départ', actionRequired: 'Action requise',
    pending: 'En attente', confirmed: 'Confirmé', cancelled: 'Annulé', completed: 'Terminé',
    orderConfirmation: 'Confirmation de commande', orderConfirmationIntro: 'Suite à votre proposition, nous vous confirmons la réservation suivante :',
    serviceType: 'Type de prestation', at: 'à', duration: 'Durée', days: 'jour(s)',
    madDetail: 'Détail mise à disposition', numberOfVehicles: 'Nombre de véhicules', numberOfDrivers: 'Nombre de chauffeurs',
    agreedAmount: 'Montant convenu', validateOrder: 'Valider la commande',
    validationLinkNote: 'Ce lien vous permet de confirmer la commande en un clic, sans avoir à nous renvoyer de document.',
    returnBpaRequest: 'Merci de nous retourner le Bon Pour Accord (BPA) signé afin de finaliser cette réservation.',
    driverInfoRequest: "Demande d'informations chauffeur",
    driverInfoRequestIntro: 'Nous vous remercions pour la réservation suivante et vous prions de nous communiquer les informations du chauffeur :',
    pleaseProvide: 'Merci de nous communiquer', driverNameAndPhone: 'Nom et téléphone du chauffeur',
    vehiclePlate: "Immatriculation du véhicule", submitDriverInfo: 'Transmettre les informations',
    submitInfoNote: 'Ce lien vous permet de saisir les informations directement en ligne.',
    availabilityRequest: 'Demande de disponibilité',
    availabilityRequestIntro: 'Nous avons une demande de transport pour laquelle nous souhaitons connaître votre disponibilité.',
    pleaseSendQuote: 'Merci de nous faire parvenir votre meilleur tarif pour cette prestation.',
    submitProposal: 'Soumettre une proposition',
    paymentReceived: 'Paiement reçu', paymentReceivedIntro: 'Nous avons bien reçu votre paiement et vous en remercions.',
    paymentDetails: 'Détails du paiement', amountReceived: 'Montant reçu', paymentMethod: 'Mode de paiement',
    remainingBalance: 'Reste à payer', remainingBalanceNote: 'Ce montant sera à régler avant le départ.',
    fullyPaid: 'Votre réservation est entièrement réglée !',
  },
  es: {
    hello: 'Hola', dear: 'Estimado/a', dearClient: 'Estimado cliente', dearMadamSir: 'Estimado/a señor/a',
    bestRegards: 'Atentamente', theTeam: 'El equipo de Busmoov', thankYou: 'Gracias', thankYouForTrust: 'Gracias por su confianza',
    requestConfirmTitle: 'Su solicitud de presupuesto ha sido recibida', requestConfirmIntro: 'Hemos recibido su solicitud de transporte y le agradecemos su confianza.',
    requestConfirmDetails: 'Resumen de su solicitud', yourQuotesReady: 'Sus presupuestos están listos',
    quotesReadyIntro: '¡Buenas noticias! Hemos preparado presupuestos personalizados para su solicitud de transporte.',
    viewQuotes: 'Ver mis presupuestos', quotesCount: 'presupuesto(s) disponible(s)',
    accessReminder: 'También puede acceder a sus presupuestos desde', withReference: 'con la referencia',
    tripDetails: 'Detalles del viaje', departure: 'Salida', arrival: 'Llegada', date: 'Fecha',
    departureDate: 'Fecha de salida', returnDate: 'Fecha de regreso', passengers: 'Pasajeros',
    reference: 'Referencia', dossier: 'Expediente', yourReference: 'Su referencia', route: 'Trayecto',
    paymentReminder: 'Recordatorio de pago', paymentReminderIntro: 'Le recordamos que su anticipo está pendiente de pago.',
    payNow: 'Pagar ahora', amountDue: 'Importe a pagar', deposit: 'Anticipo', depositAmount: 'Importe del anticipo',
    balance: 'Saldo', balanceAmount: 'Saldo restante', totalPrice: 'Precio total',
    payByCard: 'Pagar con tarjeta', payByTransfer: 'Pagar por transferencia',
    bankTransferInfo: 'Información para la transferencia bancaria', iban: 'IBAN', bic: 'BIC',
    beneficiary: 'Beneficiario', paymentReference: 'Referencia del pago',
    bookingConfirmed: 'Su reserva está confirmada', bookingConfirmedIntro: 'Nos complace confirmarle su reserva de transporte.',
    confirmationTitle: 'Confirmación de reserva', reservationConfirmed: '¡Su reserva está confirmada!',
    tripInfoRequest: 'Información del viaje requerida', tripInfoRequestIntro: 'Para finalizar su reserva, necesitamos información adicional.',
    fillTripInfo: 'Completar información', accessClientSpace: 'Acceder a mi espacio cliente',
    tripInfoReminder: 'Por favor complete la información de su viaje',
    driverInfo: 'Datos de su conductor', driverInfoIntro: 'Aquí están los datos de contacto de su conductor para su viaje.',
    driverName: 'Nombre del conductor', driverPhone: 'Teléfono', vehicleInfo: 'Información del vehículo',
    driverDetails: 'Detalles del conductor', yourDriverIs: 'Su conductor es',
    flashOffer: 'Oferta flash', flashOfferIntro: '¡Aproveche un descuento excepcional en su reserva!',
    originalPrice: 'Precio original', newPrice: 'Nuevo precio', validFor: 'Válido durante', hours: 'horas',
    limitedTimeOffer: 'Oferta por tiempo limitado', bookNow: 'Reservar ahora',
    reviewRequest: 'Deje su opinión', reviewRequestIntro: '¿Su viaje fue bien? ¡Comparta su experiencia con nosotros!',
    leaveReview: 'Dar mi opinión',
    footerText: 'Este correo ha sido enviado por Busmoov', footerContact: 'Para cualquier pregunta, contáctenos',
    unsubscribe: 'Darse de baja', needHelp: '¿Necesita ayuda?', contactUs: 'Contáctenos',
    reminderUrgent: 'Recordatorio urgente', reminderFriendly: 'Pequeño recordatorio', daysBeforeDeparture: 'días antes de la salida', actionRequired: 'Acción requerida',
    pending: 'Pendiente', confirmed: 'Confirmado', cancelled: 'Cancelado', completed: 'Completado',
    orderConfirmation: 'Confirmación de pedido', orderConfirmationIntro: 'Tras su propuesta, le confirmamos la siguiente reserva:',
    serviceType: 'Tipo de servicio', at: 'a las', duration: 'Duración', days: 'día(s)',
    madDetail: 'Detalle puesta a disposición', numberOfVehicles: 'Número de vehículos', numberOfDrivers: 'Número de conductores',
    agreedAmount: 'Importe acordado', validateOrder: 'Validar pedido',
    validationLinkNote: 'Este enlace le permite confirmar el pedido con un clic, sin necesidad de devolver ningún documento.',
    returnBpaRequest: 'Por favor, devuélvanos el Acuerdo de Confirmación firmado para finalizar esta reserva.',
    driverInfoRequest: 'Solicitud de información del conductor',
    driverInfoRequestIntro: 'Le agradecemos la siguiente reserva y le rogamos que nos comunique la información del conductor:',
    pleaseProvide: 'Por favor proporcione', driverNameAndPhone: 'Nombre y teléfono del conductor',
    vehiclePlate: 'Matrícula del vehículo', submitDriverInfo: 'Enviar información',
    submitInfoNote: 'Este enlace le permite introducir la información directamente en línea.',
    availabilityRequest: 'Solicitud de disponibilidad',
    availabilityRequestIntro: 'Tenemos una solicitud de transporte para la cual nos gustaría conocer su disponibilidad.',
    pleaseSendQuote: 'Por favor envíenos su mejor tarifa para este servicio.',
    submitProposal: 'Enviar propuesta',
    paymentReceived: 'Pago recibido', paymentReceivedIntro: 'Hemos recibido su pago y le agradecemos.',
    paymentDetails: 'Detalles del pago', amountReceived: 'Importe recibido', paymentMethod: 'Método de pago',
    remainingBalance: 'Resto pendiente', remainingBalanceNote: 'Este importe deberá abonarse antes de la salida.',
    fullyPaid: '¡Su reserva está completamente pagada!',
  },
  de: {
    hello: 'Hallo', dear: 'Sehr geehrte/r', dearClient: 'Sehr geehrter Kunde', dearMadamSir: 'Sehr geehrte Damen und Herren',
    bestRegards: 'Mit freundlichen Grüßen', theTeam: 'Das Busmoov-Team', thankYou: 'Danke', thankYouForTrust: 'Vielen Dank für Ihr Vertrauen',
    requestConfirmTitle: 'Ihre Angebotsanfrage wurde erhalten', requestConfirmIntro: 'Wir haben Ihre Transportanfrage erhalten und danken Ihnen dafür.',
    requestConfirmDetails: 'Zusammenfassung Ihrer Anfrage', yourQuotesReady: 'Ihre Angebote sind fertig',
    quotesReadyIntro: 'Gute Nachrichten! Wir haben personalisierte Angebote für Ihre Transportanfrage vorbereitet.',
    viewQuotes: 'Meine Angebote ansehen', quotesCount: 'Angebot(e) verfügbar',
    accessReminder: 'Sie können auch über unsere Website auf Ihre Angebote zugreifen:', withReference: 'mit der Referenz',
    tripDetails: 'Reisedetails', departure: 'Abfahrt', arrival: 'Ankunft', date: 'Datum',
    departureDate: 'Abfahrtsdatum', returnDate: 'Rückreisedatum', passengers: 'Passagiere',
    reference: 'Referenz', dossier: 'Buchung', yourReference: 'Ihre Referenz', route: 'Strecke',
    paymentReminder: 'Zahlungserinnerung', paymentReminderIntro: 'Wir erinnern Sie daran, dass Ihre Anzahlung noch aussteht.',
    payNow: 'Jetzt bezahlen', amountDue: 'Zu zahlender Betrag', deposit: 'Anzahlung', depositAmount: 'Anzahlungsbetrag',
    balance: 'Restbetrag', balanceAmount: 'Verbleibender Betrag', totalPrice: 'Gesamtpreis',
    payByCard: 'Mit Karte bezahlen', payByTransfer: 'Per Überweisung bezahlen',
    bankTransferInfo: 'Bankverbindung für die Überweisung', iban: 'IBAN', bic: 'BIC',
    beneficiary: 'Empfänger', paymentReference: 'Zahlungsreferenz',
    bookingConfirmed: 'Ihre Buchung ist bestätigt', bookingConfirmedIntro: 'Wir freuen uns, Ihre Transportbuchung zu bestätigen.',
    confirmationTitle: 'Buchungsbestätigung', reservationConfirmed: 'Ihre Buchung ist bestätigt!',
    tripInfoRequest: 'Reiseinformationen erforderlich', tripInfoRequestIntro: 'Um Ihre Buchung abzuschließen, benötigen wir einige zusätzliche Informationen.',
    fillTripInfo: 'Informationen ausfüllen', accessClientSpace: 'Zu meinem Kundenbereich',
    tripInfoReminder: 'Bitte vervollständigen Sie Ihre Reiseinformationen',
    driverInfo: 'Kontaktdaten Ihres Fahrers', driverInfoIntro: 'Hier sind die Kontaktdaten Ihres Fahrers für Ihre Reise.',
    driverName: 'Name des Fahrers', driverPhone: 'Telefon', vehicleInfo: 'Fahrzeuginformationen',
    driverDetails: 'Fahrerdetails', yourDriverIs: 'Ihr Fahrer ist',
    flashOffer: 'Flash-Angebot', flashOfferIntro: 'Profitieren Sie von einem außergewöhnlichen Rabatt auf Ihre Buchung!',
    originalPrice: 'Ursprünglicher Preis', newPrice: 'Neuer Preis', validFor: 'Gültig für', hours: 'Stunden',
    limitedTimeOffer: 'Zeitlich begrenztes Angebot', bookNow: 'Jetzt buchen',
    reviewRequest: 'Geben Sie Ihre Bewertung ab', reviewRequestIntro: 'Hat Ihre Reise gut geklappt? Teilen Sie Ihre Erfahrung mit uns!',
    leaveReview: 'Bewertung abgeben',
    footerText: 'Diese E-Mail wurde von Busmoov gesendet', footerContact: 'Bei Fragen kontaktieren Sie uns',
    unsubscribe: 'Abmelden', needHelp: 'Brauchen Sie Hilfe?', contactUs: 'Kontaktieren Sie uns',
    reminderUrgent: 'Dringende Erinnerung', reminderFriendly: 'Kleine Erinnerung', daysBeforeDeparture: 'Tage vor der Abreise', actionRequired: 'Handlung erforderlich',
    pending: 'Ausstehend', confirmed: 'Bestätigt', cancelled: 'Storniert', completed: 'Abgeschlossen',
    orderConfirmation: 'Auftragsbestätigung', orderConfirmationIntro: 'Nach Ihrem Angebot bestätigen wir Ihnen folgende Buchung:',
    serviceType: 'Art der Leistung', at: 'um', duration: 'Dauer', days: 'Tag(e)',
    madDetail: 'Details zur Verfügung', numberOfVehicles: 'Anzahl Fahrzeuge', numberOfDrivers: 'Anzahl Fahrer',
    agreedAmount: 'Vereinbarter Betrag', validateOrder: 'Bestellung bestätigen',
    validationLinkNote: 'Mit diesem Link können Sie die Bestellung mit einem Klick bestätigen, ohne uns ein Dokument zurücksenden zu müssen.',
    returnBpaRequest: 'Bitte senden Sie uns die unterschriebene Auftragsbestätigung zurück, um diese Buchung abzuschließen.',
    driverInfoRequest: 'Anfrage Fahrerinformationen',
    driverInfoRequestIntro: 'Wir danken Ihnen für folgende Buchung und bitten Sie, uns die Fahrerinformationen mitzuteilen:',
    pleaseProvide: 'Bitte teilen Sie uns mit', driverNameAndPhone: 'Name und Telefon des Fahrers',
    vehiclePlate: 'Fahrzeugkennzeichen', submitDriverInfo: 'Informationen übermitteln',
    submitInfoNote: 'Mit diesem Link können Sie die Informationen direkt online eingeben.',
    availabilityRequest: 'Verfügbarkeitsanfrage',
    availabilityRequestIntro: 'Wir haben eine Transportanfrage, für die wir gerne Ihre Verfügbarkeit kennen würden.',
    pleaseSendQuote: 'Bitte senden Sie uns Ihr bestes Angebot für diese Leistung.',
    submitProposal: 'Angebot einreichen',
    paymentReceived: 'Zahlung erhalten', paymentReceivedIntro: 'Wir haben Ihre Zahlung erhalten und danken Ihnen.',
    paymentDetails: 'Zahlungsdetails', amountReceived: 'Erhaltener Betrag', paymentMethod: 'Zahlungsmethode',
    remainingBalance: 'Restbetrag', remainingBalanceNote: 'Dieser Betrag ist vor der Abreise zu begleichen.',
    fullyPaid: 'Ihre Buchung ist vollständig bezahlt!',
  },
  en: {
    hello: 'Hello', dear: 'Dear', dearClient: 'Dear customer', dearMadamSir: 'Dear Sir/Madam',
    bestRegards: 'Best regards', theTeam: 'The Busmoov Team', thankYou: 'Thank you', thankYouForTrust: 'Thank you for your trust',
    requestConfirmTitle: 'Your quote request has been received', requestConfirmIntro: 'We have received your transport request and thank you for your trust.',
    requestConfirmDetails: 'Summary of your request', yourQuotesReady: 'Your quotes are ready',
    quotesReadyIntro: 'Great news! We have prepared personalized quotes for your transport request.',
    viewQuotes: 'View my quotes', quotesCount: 'quote(s) available',
    accessReminder: 'You can also access your quotes from', withReference: 'using reference',
    tripDetails: 'Trip details', departure: 'Departure', arrival: 'Arrival', date: 'Date',
    departureDate: 'Departure date', returnDate: 'Return date', passengers: 'Passengers',
    reference: 'Reference', dossier: 'Booking', yourReference: 'Your reference', route: 'Route',
    paymentReminder: 'Payment reminder', paymentReminderIntro: 'This is a reminder that your deposit is pending payment.',
    payNow: 'Pay now', amountDue: 'Amount due', deposit: 'Deposit', depositAmount: 'Deposit amount',
    balance: 'Balance', balanceAmount: 'Remaining balance', totalPrice: 'Total price',
    payByCard: 'Pay by card', payByTransfer: 'Pay by bank transfer',
    bankTransferInfo: 'Bank transfer information', iban: 'IBAN', bic: 'BIC',
    beneficiary: 'Beneficiary', paymentReference: 'Payment reference',
    bookingConfirmed: 'Your booking is confirmed', bookingConfirmedIntro: 'We are pleased to confirm your transport booking.',
    confirmationTitle: 'Booking confirmation', reservationConfirmed: 'Your booking is confirmed!',
    tripInfoRequest: 'Trip information required', tripInfoRequestIntro: 'To finalize your booking, we need some additional information.',
    fillTripInfo: 'Fill in information', accessClientSpace: 'Access my client area',
    tripInfoReminder: 'Please complete your trip information',
    driverInfo: 'Your driver details', driverInfoIntro: 'Here are the contact details for your driver for your trip.',
    driverName: 'Driver name', driverPhone: 'Phone', vehicleInfo: 'Vehicle information',
    driverDetails: 'Driver details', yourDriverIs: 'Your driver is',
    flashOffer: 'Flash offer', flashOfferIntro: 'Take advantage of an exceptional discount on your booking!',
    originalPrice: 'Original price', newPrice: 'New price', validFor: 'Valid for', hours: 'hours',
    limitedTimeOffer: 'Limited time offer', bookNow: 'Book now',
    reviewRequest: 'Leave a review', reviewRequestIntro: 'Did your trip go well? Share your experience with us!',
    leaveReview: 'Leave my review',
    footerText: 'This email was sent by Busmoov', footerContact: 'For any questions, contact us',
    unsubscribe: 'Unsubscribe', needHelp: 'Need help?', contactUs: 'Contact us',
    reminderUrgent: 'Urgent reminder', reminderFriendly: 'Friendly reminder', daysBeforeDeparture: 'days before departure', actionRequired: 'Action required',
    pending: 'Pending', confirmed: 'Confirmed', cancelled: 'Cancelled', completed: 'Completed',
    orderConfirmation: 'Order confirmation', orderConfirmationIntro: 'Following your proposal, we confirm the following booking:',
    serviceType: 'Service type', at: 'at', duration: 'Duration', days: 'day(s)',
    madDetail: 'Disposal details', numberOfVehicles: 'Number of vehicles', numberOfDrivers: 'Number of drivers',
    agreedAmount: 'Agreed amount', validateOrder: 'Validate order',
    validationLinkNote: 'This link allows you to confirm the order in one click, without having to return any document.',
    returnBpaRequest: 'Please return the signed Confirmation Agreement to finalize this booking.',
    driverInfoRequest: 'Driver information request',
    driverInfoRequestIntro: 'Thank you for the following booking. Please provide us with the driver information:',
    pleaseProvide: 'Please provide', driverNameAndPhone: 'Driver name and phone',
    vehiclePlate: 'Vehicle registration', submitDriverInfo: 'Submit information',
    submitInfoNote: 'This link allows you to enter the information directly online.',
    availabilityRequest: 'Availability request',
    availabilityRequestIntro: 'We have a transport request for which we would like to know your availability.',
    pleaseSendQuote: 'Please send us your best rate for this service.',
    submitProposal: 'Submit proposal',
    paymentReceived: 'Payment received', paymentReceivedIntro: 'We have received your payment and thank you.',
    paymentDetails: 'Payment details', amountReceived: 'Amount received', paymentMethod: 'Payment method',
    remainingBalance: 'Remaining balance', remainingBalanceNote: 'This amount is due before departure.',
    fullyPaid: 'Your booking is fully paid!',
  },
}

/** Replace {{t:key}} translation placeholders with actual translated text */
function replaceTranslationKeys(html: string, lang: string): string {
  const translations = EMAIL_TRANSLATIONS[lang] || EMAIL_TRANSLATIONS['fr']
  return html.replace(/\{\{t:(\w+)\}\}/g, (_match, key) => {
    return translations[key] || EMAIL_TRANSLATIONS['fr'][key] || `{{t:${key}}}`
  })
}

interface EmailTemplate {
  id: string
  key: string
  name: string
  description: string | null
  subject: string
  body: string
  content: string | null
  html_content: string | null
  language: string | null
  variables: Array<{ name: string; description: string }> | null
  is_active: boolean | null
  type: string | null
  created_at: string | null
  updated_at: string | null
}

type Language = 'fr' | 'es' | 'de' | 'en'
type EditorTab = 'text' | 'html' | 'preview'

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
  { code: 'es', label: 'ES', flag: '🇪🇸' },
  { code: 'de', label: 'DE', flag: '🇩🇪' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
]

export function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [testError, setTestError] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('fr')
  const [editorTab, setEditorTab] = useState<EditorTab>('text')
  const [langCounts, setLangCounts] = useState<Record<Language, number>>({ fr: 0, es: 0, de: 0, en: 0 })

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    body: '',
    html_content: '',
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      const all = (data as unknown as EmailTemplate[]) || []
      setTemplates(all)

      // Count templates per language
      const counts: Record<Language, number> = { fr: 0, es: 0, de: 0, en: 0 }
      all.forEach(t => {
        const lang = (t.language || 'fr') as Language
        if (lang in counts) counts[lang]++
      })
      setLangCounts(counts)
    } catch (err) {
      console.error('Erreur chargement templates:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTemplates = templates.filter(t => (t.language || 'fr') === selectedLanguage)

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      description: template.description || '',
      subject: template.subject,
      body: template.body || '',
      html_content: template.html_content || '',
    })
    // Default to text tab, or html if there's custom html_content but no body
    setEditorTab(template.html_content && !template.body ? 'html' : 'text')
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!selectedTemplate) return

    setIsSaving(true)
    try {
      let updateData: Record<string, string | null>

      if (editorTab === 'html' || (editorTab === 'preview' && formData.html_content)) {
        // HTML mode: save html_content and sync body
        updateData = {
          name: formData.name,
          description: formData.description,
          subject: formData.subject,
          html_content: formData.html_content,
          body: formData.body || formData.html_content,
        }
      } else {
        // Text mode: save body, clear html_content so send-email uses body
        updateData = {
          name: formData.name,
          description: formData.description,
          subject: formData.subject,
          body: formData.body,
          html_content: null,
        }
      }

      const { error } = await supabase
        .from('email_templates')
        .update(updateData)
        .eq('id', selectedTemplate.id)

      if (error) throw error

      await loadTemplates()
      setIsEditing(false)
      setSelectedTemplate(null)
    } catch (err) {
      console.error('Erreur sauvegarde template:', err)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setSelectedTemplate(null)
  }

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setShowPreview(true)
  }

  const handleTest = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setTestEmail('')
    setTestStatus('idle')
    setTestError('')
    setShowTestModal(true)
  }

  const sendTestEmail = async () => {
    if (!selectedTemplate || !testEmail) return

    setTestStatus('sending')
    setTestError('')

    try {
      const testData: Record<string, string | number> = {}
      if (selectedTemplate.variables) {
        selectedTemplate.variables.forEach(v => {
          switch (v.name) {
            case 'client_name':
              testData[v.name] = 'Jean Test'
              break
            case 'reference':
              testData[v.name] = 'BUS-2025-TEST'
              break
            case 'departure':
              testData[v.name] = 'Paris'
              break
            case 'arrival':
              testData[v.name] = 'Lyon'
              break
            case 'departure_date':
              testData[v.name] = '15 janvier 2025'
              break
            case 'passengers':
              testData[v.name] = 45
              break
            case 'nb_devis':
              testData[v.name] = 3
              break
            case 'prix_ttc':
              testData[v.name] = 1250
              break
            case 'prix_barre':
              testData[v.name] = 1500
              break
            case 'validite_heures':
              testData[v.name] = 24
              break
            case 'montant_acompte':
            case 'montant_solde':
              testData[v.name] = 375
              break
            case 'date_limite':
              testData[v.name] = '8 janvier 2025'
              break
            case 'chauffeur_name':
              testData[v.name] = 'Michel Dupont'
              break
            case 'chauffeur_phone':
              testData[v.name] = '06 12 34 56 78'
              break
            case 'transporteur':
              testData[v.name] = 'Autocars Express'
              break
            default:
              testData[v.name] = `[${v.name}]`
          }
        })
        testData['lien_espace_client'] = 'https://busmoov.com/fr/mes-devis?ref=TEST'
        testData['lien_paiement'] = 'https://busmoov.com/fr/paiement?ref=TEST'
        testData['lien_infos_voyage'] = 'https://busmoov.com/fr/infos-voyage?ref=TEST'
      }

      const response = await supabase.functions.invoke('send-email', {
        body: {
          type: selectedTemplate.key,
          to: testEmail,
          data: testData,
        }
      })

      if (response.error) {
        throw new Error(response.error.message)
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erreur inconnue')
      }

      setTestStatus('success')
    } catch (err: any) {
      console.error('Erreur envoi test:', err)
      setTestStatus('error')
      setTestError(err.message || 'Erreur lors de l\'envoi')
    }
  }

  const demoValues: Record<string, string> = {
    // Client
    client_name: 'Jean Dupont',
    client_email: 'jean.dupont@email.com',
    reference: 'BUS-2025-001',
    dossier_reference: 'DOS-ABC123',
    // Voyage
    departure: 'Paris',
    arrival: 'Lyon',
    departure_date: '15 janvier 2025',
    departure_address: '12 Rue de Rivoli, 75001 Paris',
    arrival_address: '45 Place Bellecour, 69002 Lyon',
    return_date: '17 janvier 2025',
    passengers: '45',
    // Devis
    nb_devis: '3',
    devis_recap: '• Devis 1 : 1 150 € TTC\n• Devis 2 : 1 250 € TTC\n• Devis 3 : 1 380 € TTC',
    // Prix
    prix_ttc: '1 250',
    prix_barre: '1 500',
    total_ttc: '1 250 €',
    validite_heures: '24',
    // Paiement
    montant_acompte: '375',
    montant_solde: '875',
    reste_a_regler: '875 €',
    // Chauffeur
    chauffeur_name: 'Michel Dupont',
    chauffeur_phone: '06 12 34 56 78',
    chauffeur_immat: 'AB-123-CD',
    // Transporteur
    transporteur: 'Autocars Express',
    transporteur_name: 'Autocars Express',
    // Fournisseur
    type_prestation: 'Aller-retour avec MAD',
    trip_mode: 'Aller-retour',
    vehicle_type: 'Autocar standard (53 places)',
    prix_achat: '950 € HT',
    nb_cars: '1',
    nb_chauffeurs: '1',
    duree_jours: '3',
    detail_mad: 'Mise à disposition du 15 au 17 janvier',
    heure_depart: '08:00',
    heure_retour: '18:00',
    label_date_depart: 'Date de départ',
    label_date_retour: 'Date de retour',
    special_requests: 'Climatisation, WiFi',
    // Liens
    lien_espace_client: '#',
    lien_paiement: '#',
    lien_infos_voyage: '#',
    lien_formulaire: '#',
    lien_validation: '#',
    // Contact
    phone_display: '+33 1 86 65 01 45',
    email: 'infos@busmoov.com',
  }

  /** Replace {{t:key}} and {{variable}} placeholders for preview */
  const applyPreviewReplacements = (html: string, lang: string): string => {
    // Replace translation keys first
    html = replaceTranslationKeys(html, lang)
    // Replace variables
    Object.entries(demoValues).forEach(([key, value]) => {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value)
    })
    return html
  }

  // Replace variables in HTML/body for preview
  const getPreviewHtml = (template: EmailTemplate): string => {
    const html = template.html_content || template.body || ''
    return applyPreviewReplacements(html, template.language || 'fr')
  }

  // Build preview from current form data (for in-editor preview)
  const getEditorPreviewHtml = (): string => {
    let html = formData.html_content || formData.body || ''

    // If in text mode and no html_content, wrap body in basic HTML for readability
    if (!formData.html_content && formData.body) {
      html = `<div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">${formData.body.replace(/\n/g, '<br/>')}</div>`
    }

    return applyPreviewReplacements(html, selectedTemplate?.language || selectedLanguage)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-magenta"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Mail className="text-magenta" size={28} />
            Templates d'emails
          </h1>
          <p className="text-gray-500 mt-1">
            Personnalisez les emails envoyés automatiquement aux clients
          </p>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Code className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Variables disponibles</p>
            <p>
              Utilisez la syntaxe <code className="bg-blue-100 px-1 rounded">{'{{variable}}'}</code> pour insérer des données dynamiques.
              Chaque template affiche ses variables disponibles lors de l'édition.
            </p>
          </div>
        </div>
      </div>

      {/* Language tabs */}
      <div className="flex gap-2">
        {LANGUAGES.map(lang => (
          <button
            key={lang.code}
            onClick={() => setSelectedLanguage(lang.code)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
              selectedLanguage === lang.code
                ? 'bg-magenta text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              selectedLanguage === lang.code
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {langCounts[lang.code]}
            </span>
          </button>
        ))}
      </div>

      {/* Liste des templates */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {filteredTemplates.length} template{filteredTemplates.length > 1 ? 's' : ''} {LANGUAGES.find(l => l.code === selectedLanguage)?.flag}
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredTemplates.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Aucun template pour cette langue
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    template.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Mail size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{template.name}</span>
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-mono">
                        {template.key}
                      </span>
                      {template.html_content && (
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                          HTML
                        </span>
                      )}
                      {template.is_active && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                          Actif
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {template.description || template.subject}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePreview(template)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Apercu"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Modifier"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleTest(template)}
                    className="p-2 text-gray-400 hover:text-purple hover:bg-purple/10 rounded-lg"
                    title="Envoyer un test"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal d'édition */}
      <Modal
        isOpen={isEditing}
        onClose={handleCancel}
        title={`Modifier : ${selectedTemplate?.name}`}
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nom du template</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Devis prets"
              />
            </div>
            <div>
              <label className="label">Description</label>
              <input
                type="text"
                className="input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Envoye quand les devis sont prets"
              />
            </div>
          </div>

          <div>
            <label className="label">Sujet de l'email</label>
            <input
              type="text"
              className="input"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Vos {{nb_devis}} offres sont pretes - {{reference}}"
            />
          </div>

          {/* Variables disponibles */}
          {selectedTemplate?.variables && selectedTemplate.variables.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Variables disponibles (cliquer pour copier) :</p>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.variables.map((v, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`{{${v.name}}}`)
                    }}
                    className="text-xs bg-white border border-gray-200 px-2 py-1 rounded hover:bg-purple/10 hover:border-purple transition-colors"
                    title={v.description}
                  >
                    <code>{`{{${v.name}}}`}</code>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Editor tabs */}
          <div>
            <div className="flex border-b border-gray-200 mb-3">
              <button
                onClick={() => setEditorTab('text')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  editorTab === 'text'
                    ? 'border-magenta text-magenta'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText size={16} />
                Texte
              </button>
              <button
                onClick={() => setEditorTab('html')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  editorTab === 'html'
                    ? 'border-magenta text-magenta'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Code size={16} />
                HTML avancé
              </button>
              <button
                onClick={() => setEditorTab('preview')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  editorTab === 'preview'
                    ? 'border-magenta text-magenta'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Monitor size={16} />
                Aperçu
              </button>
            </div>

            {editorTab === 'text' && (
              <div>
                <textarea
                  className="input text-sm"
                  rows={14}
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Bonjour {{client_name}},&#10;&#10;Vos devis sont prêts..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Texte simple avec variables {'{{variable}}'}. Pas besoin de HTML.
                </p>
              </div>
            )}

            {editorTab === 'html' && (
              <div>
                <textarea
                  className="input font-mono text-sm"
                  rows={14}
                  value={formData.html_content}
                  onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                  placeholder="<!DOCTYPE html>..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Code HTML complet avec styles inline. Mode avancé pour une mise en page personnalisée.
                </p>
              </div>
            )}

            {editorTab === 'preview' && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 text-sm text-gray-500">
                  Aperçu avec données fictives
                </div>
                <iframe
                  srcDoc={getEditorPreviewHtml()}
                  className="w-full h-[350px] border-0 bg-white"
                  title="Editor preview"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={handleCancel}
              className="btn btn-secondary"
              disabled={isSaving}
            >
              <X size={18} />
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary flex items-center gap-2"
              disabled={isSaving}
            >
              <Save size={18} />
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de prévisualisation */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={`Apercu : ${selectedTemplate?.name}`}
        size="xl"
      >
        <div className="space-y-4">
          {/* Sujet */}
          <div className="bg-gray-100 rounded-lg p-3">
            <p className="text-sm text-gray-500 mb-1">Sujet :</p>
            <p className="font-medium text-gray-900">{selectedTemplate?.subject}</p>
          </div>

          {/* Preview HTML */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 text-sm text-gray-500">
              Apercu du contenu
            </div>
            <div className="p-4 bg-white">
              <iframe
                srcDoc={selectedTemplate ? getPreviewHtml(selectedTemplate) : ''}
                className="w-full h-[500px] border-0"
                title="Email preview"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t mt-4">
          <button
            onClick={() => setShowPreview(false)}
            className="btn btn-primary"
          >
            Fermer
          </button>
        </div>
      </Modal>

      {/* Modal d'envoi de test */}
      <Modal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        title={`Tester : ${selectedTemplate?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Envoyez un email de test pour verifier le rendu. Des donnees fictives seront utilisees pour les variables.
          </p>

          <div>
            <label className="label">Email de destination</label>
            <input
              type="email"
              className="input"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="votre@email.com"
            />
          </div>

          {testStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="text-green-500" size={20} />
              <span className="text-green-800">Email de test envoye avec succes !</span>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-red-500" size={20} />
                <span className="text-red-800">Erreur lors de l'envoi</span>
              </div>
              {testError && (
                <p className="text-sm text-red-600 mt-2">{testError}</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setShowTestModal(false)}
              className="btn btn-secondary"
            >
              Fermer
            </button>
            <button
              onClick={sendTestEmail}
              disabled={!testEmail || testStatus === 'sending'}
              className="btn btn-primary flex items-center gap-2"
            >
              <Send size={18} />
              {testStatus === 'sending' ? 'Envoi...' : 'Envoyer le test'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
