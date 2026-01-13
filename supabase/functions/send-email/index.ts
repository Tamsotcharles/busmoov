// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============ TRADUCTIONS EMAIL ============
// Dictionnaire de traductions pour les emails automatiques
// USAGE: Dans vos templates, utilisez {{t:clé}} pour une traduction automatique
// Exemple: {{t:hello}} sera remplacé par "Bonjour" en FR, "Hallo" en DE, etc.
const EMAIL_TRANSLATIONS: Record<string, Record<string, string>> = {
  fr: {
    // Salutations
    hello: 'Bonjour',
    dear: 'Cher',
    dearClient: 'Cher client',
    dearMadamSir: 'Madame, Monsieur',

    // Formules de politesse
    bestRegards: 'Cordialement',
    theTeam: "L'équipe Busmoov",
    thankYou: 'Merci',
    thankYouForTrust: 'Merci pour votre confiance',

    // Confirmation demande
    requestConfirmTitle: 'Votre demande de devis a bien été reçue',
    requestConfirmIntro: 'Nous avons bien reçu votre demande de transport et nous vous en remercions.',
    requestConfirmDetails: 'Récapitulatif de votre demande',
    yourQuotesReady: 'Vos devis sont prêts',
    quotesReadyIntro: 'Bonne nouvelle ! Nous avons préparé des devis personnalisés pour votre demande de transport.',
    viewQuotes: 'Voir mes devis',
    quotesCount: 'devis disponible(s)',

    // Détails voyage
    tripDetails: 'Détails du voyage',
    departure: 'Départ',
    arrival: 'Arrivée',
    date: 'Date',
    departureDate: 'Date de départ',
    returnDate: 'Date de retour',
    passengers: 'Passagers',
    reference: 'Référence',
    yourReference: 'Votre référence',
    route: 'Trajet',

    // Paiement
    paymentReminder: 'Rappel de paiement',
    paymentReminderIntro: 'Nous vous rappelons que votre acompte est en attente de règlement.',
    payNow: 'Payer maintenant',
    amountDue: 'Montant à régler',
    deposit: 'Acompte',
    depositAmount: 'Montant de l\'acompte',
    balance: 'Solde',
    balanceAmount: 'Solde restant',
    totalPrice: 'Prix total',
    payByCard: 'Payer par carte',
    payByTransfer: 'Payer par virement',
    bankTransferInfo: 'Informations pour le virement bancaire',
    iban: 'IBAN',
    bic: 'BIC',
    beneficiary: 'Bénéficiaire',
    paymentReference: 'Référence du paiement',

    // Confirmation réservation
    bookingConfirmed: 'Votre réservation est confirmée',
    bookingConfirmedIntro: 'Nous avons le plaisir de vous confirmer votre réservation de transport.',
    confirmationTitle: 'Confirmation de réservation',
    reservationConfirmed: 'Votre réservation est confirmée !',

    // Infos voyage
    tripInfoRequest: 'Informations voyage requises',
    tripInfoRequestIntro: 'Afin de finaliser votre réservation, nous avons besoin de quelques informations complémentaires.',
    fillTripInfo: 'Compléter les informations',
    accessClientSpace: 'Accéder à mon espace client',
    tripInfoReminder: 'Merci de compléter les informations de votre voyage',

    // Infos chauffeur
    driverInfo: 'Coordonnées de votre chauffeur',
    driverInfoIntro: 'Voici les coordonnées de votre chauffeur pour votre voyage.',
    driverName: 'Nom du chauffeur',
    driverPhone: 'Téléphone',
    vehicleInfo: 'Informations véhicule',
    driverDetails: 'Détails du chauffeur',
    yourDriverIs: 'Votre chauffeur est',

    // Offre flash
    flashOffer: 'Offre flash',
    flashOfferIntro: 'Profitez d\'une réduction exceptionnelle sur votre réservation !',
    originalPrice: 'Prix initial',
    newPrice: 'Nouveau prix',
    validFor: 'Valable pendant',
    hours: 'heures',
    limitedTimeOffer: 'Offre limitée dans le temps',
    bookNow: 'Réserver maintenant',

    // Demande avis
    reviewRequest: 'Donnez votre avis',
    reviewRequestIntro: 'Votre voyage s\'est bien passé ? Partagez votre expérience avec nous !',
    leaveReview: 'Donner mon avis',

    // Footer
    footerText: 'Cet email a été envoyé par Busmoov',
    footerContact: 'Pour toute question, contactez-nous',
    unsubscribe: 'Se désabonner',
    needHelp: 'Besoin d\'aide ?',
    contactUs: 'Contactez-nous',

    // Rappels
    reminderUrgent: 'Rappel urgent',
    reminderFriendly: 'Petit rappel',
    daysBeforeDeparture: 'jours avant le départ',
    actionRequired: 'Action requise',

    // Statuts
    pending: 'En attente',
    confirmed: 'Confirmé',
    cancelled: 'Annulé',
    completed: 'Terminé',

    // Templates fournisseurs
    orderConfirmation: 'Confirmation de commande',
    orderConfirmationIntro: 'Suite à votre proposition, nous vous confirmons la réservation suivante :',
    serviceType: 'Type de prestation',
    at: 'à',
    duration: 'Durée',
    days: 'jour(s)',
    madDetail: 'Détail mise à disposition',
    numberOfVehicles: 'Nombre de véhicules',
    numberOfDrivers: 'Nombre de chauffeurs',
    agreedAmount: 'Montant convenu',
    validateOrder: 'Valider la commande',
    validationLinkNote: 'Ce lien vous permet de confirmer la commande en un clic, sans avoir à nous renvoyer de document.',
    returnBpaRequest: 'Merci de nous retourner le Bon Pour Accord (BPA) signé afin de finaliser cette réservation.',

    // Demande chauffeur
    driverInfoRequest: 'Demande d\'informations chauffeur',
    driverInfoRequestIntro: 'Nous vous remercions pour la réservation suivante et vous prions de nous communiquer les informations du chauffeur :',
    pleaseProvide: 'Merci de nous communiquer',
    driverNameAndPhone: 'Nom et téléphone du chauffeur',
    vehiclePlate: 'Immatriculation du véhicule',
    submitDriverInfo: 'Transmettre les informations',
    submitInfoNote: 'Ce lien vous permet de saisir les informations directement en ligne.',

    // Demande disponibilité
    availabilityRequest: 'Demande de disponibilité',
    availabilityRequestIntro: 'Nous avons une demande de transport pour laquelle nous souhaitons connaître votre disponibilité.',
    pleaseSendQuote: 'Merci de nous faire parvenir votre meilleur tarif pour cette prestation.',
    submitProposal: 'Soumettre une proposition',

    // Confirmation paiement
    paymentReceived: 'Paiement reçu',
    paymentReceivedIntro: 'Nous avons bien reçu votre paiement et vous en remercions.',
    paymentDetails: 'Détails du paiement',
    amountReceived: 'Montant reçu',
    paymentMethod: 'Mode de paiement',
    remainingBalance: 'Reste à payer',
    remainingBalanceNote: 'Ce montant sera à régler avant le départ.',
    fullyPaid: 'Votre réservation est entièrement réglée !',
  },

  es: {
    // Salutations
    hello: 'Hola',
    dear: 'Estimado/a',
    dearClient: 'Estimado cliente',
    dearMadamSir: 'Estimado/a señor/a',

    // Formules de politesse
    bestRegards: 'Atentamente',
    theTeam: 'El equipo de Busmoov',
    thankYou: 'Gracias',
    thankYouForTrust: 'Gracias por su confianza',

    // Confirmation demande
    requestConfirmTitle: 'Su solicitud de presupuesto ha sido recibida',
    requestConfirmIntro: 'Hemos recibido su solicitud de transporte y le agradecemos su confianza.',
    requestConfirmDetails: 'Resumen de su solicitud',
    yourQuotesReady: 'Sus presupuestos están listos',
    quotesReadyIntro: '¡Buenas noticias! Hemos preparado presupuestos personalizados para su solicitud de transporte.',
    viewQuotes: 'Ver mis presupuestos',
    quotesCount: 'presupuesto(s) disponible(s)',

    // Détails voyage
    tripDetails: 'Detalles del viaje',
    departure: 'Salida',
    arrival: 'Llegada',
    date: 'Fecha',
    departureDate: 'Fecha de salida',
    returnDate: 'Fecha de regreso',
    passengers: 'Pasajeros',
    reference: 'Referencia',
    yourReference: 'Su referencia',
    route: 'Trayecto',

    // Paiement
    paymentReminder: 'Recordatorio de pago',
    paymentReminderIntro: 'Le recordamos que su anticipo está pendiente de pago.',
    payNow: 'Pagar ahora',
    amountDue: 'Importe a pagar',
    deposit: 'Anticipo',
    depositAmount: 'Importe del anticipo',
    balance: 'Saldo',
    balanceAmount: 'Saldo restante',
    totalPrice: 'Precio total',
    payByCard: 'Pagar con tarjeta',
    payByTransfer: 'Pagar por transferencia',
    bankTransferInfo: 'Información para la transferencia bancaria',
    iban: 'IBAN',
    bic: 'BIC',
    beneficiary: 'Beneficiario',
    paymentReference: 'Referencia del pago',

    // Confirmation réservation
    bookingConfirmed: 'Su reserva está confirmada',
    bookingConfirmedIntro: 'Nos complace confirmarle su reserva de transporte.',
    confirmationTitle: 'Confirmación de reserva',
    reservationConfirmed: '¡Su reserva está confirmada!',

    // Infos voyage
    tripInfoRequest: 'Información del viaje requerida',
    tripInfoRequestIntro: 'Para finalizar su reserva, necesitamos información adicional.',
    fillTripInfo: 'Completar información',
    accessClientSpace: 'Acceder a mi espacio cliente',
    tripInfoReminder: 'Por favor complete la información de su viaje',

    // Infos chauffeur
    driverInfo: 'Datos de su conductor',
    driverInfoIntro: 'Aquí están los datos de contacto de su conductor para su viaje.',
    driverName: 'Nombre del conductor',
    driverPhone: 'Teléfono',
    vehicleInfo: 'Información del vehículo',
    driverDetails: 'Detalles del conductor',
    yourDriverIs: 'Su conductor es',

    // Offre flash
    flashOffer: 'Oferta flash',
    flashOfferIntro: '¡Aproveche un descuento excepcional en su reserva!',
    originalPrice: 'Precio original',
    newPrice: 'Nuevo precio',
    validFor: 'Válido durante',
    hours: 'horas',
    limitedTimeOffer: 'Oferta por tiempo limitado',
    bookNow: 'Reservar ahora',

    // Demande avis
    reviewRequest: 'Deje su opinión',
    reviewRequestIntro: '¿Su viaje fue bien? ¡Comparta su experiencia con nosotros!',
    leaveReview: 'Dar mi opinión',

    // Footer
    footerText: 'Este correo ha sido enviado por Busmoov',
    footerContact: 'Para cualquier pregunta, contáctenos',
    unsubscribe: 'Darse de baja',
    needHelp: '¿Necesita ayuda?',
    contactUs: 'Contáctenos',

    // Rappels
    reminderUrgent: 'Recordatorio urgente',
    reminderFriendly: 'Pequeño recordatorio',
    daysBeforeDeparture: 'días antes de la salida',
    actionRequired: 'Acción requerida',

    // Statuts
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
    completed: 'Completado',

    // Templates fournisseurs
    orderConfirmation: 'Confirmación de pedido',
    orderConfirmationIntro: 'Tras su propuesta, le confirmamos la siguiente reserva:',
    serviceType: 'Tipo de servicio',
    at: 'a las',
    duration: 'Duración',
    days: 'día(s)',
    madDetail: 'Detalle puesta a disposición',
    numberOfVehicles: 'Número de vehículos',
    numberOfDrivers: 'Número de conductores',
    agreedAmount: 'Importe acordado',
    validateOrder: 'Validar pedido',
    validationLinkNote: 'Este enlace le permite confirmar el pedido con un clic, sin necesidad de devolver ningún documento.',
    returnBpaRequest: 'Por favor, devuélvanos el Acuerdo de Confirmación firmado para finalizar esta reserva.',

    // Demande chauffeur
    driverInfoRequest: 'Solicitud de información del conductor',
    driverInfoRequestIntro: 'Le agradecemos la siguiente reserva y le rogamos que nos comunique la información del conductor:',
    pleaseProvide: 'Por favor proporcione',
    driverNameAndPhone: 'Nombre y teléfono del conductor',
    vehiclePlate: 'Matrícula del vehículo',
    submitDriverInfo: 'Enviar información',
    submitInfoNote: 'Este enlace le permite introducir la información directamente en línea.',

    // Demande disponibilité
    availabilityRequest: 'Solicitud de disponibilidad',
    availabilityRequestIntro: 'Tenemos una solicitud de transporte para la cual nos gustaría conocer su disponibilidad.',
    pleaseSendQuote: 'Por favor envíenos su mejor tarifa para este servicio.',
    submitProposal: 'Enviar propuesta',

    // Confirmation paiement
    paymentReceived: 'Pago recibido',
    paymentReceivedIntro: 'Hemos recibido su pago y le agradecemos.',
    paymentDetails: 'Detalles del pago',
    amountReceived: 'Importe recibido',
    paymentMethod: 'Método de pago',
    remainingBalance: 'Resto pendiente',
    remainingBalanceNote: 'Este importe deberá abonarse antes de la salida.',
    fullyPaid: '¡Su reserva está completamente pagada!',
  },

  de: {
    // Salutations
    hello: 'Hallo',
    dear: 'Sehr geehrte/r',
    dearClient: 'Sehr geehrter Kunde',
    dearMadamSir: 'Sehr geehrte Damen und Herren',

    // Formules de politesse
    bestRegards: 'Mit freundlichen Grüßen',
    theTeam: 'Das Busmoov-Team',
    thankYou: 'Danke',
    thankYouForTrust: 'Vielen Dank für Ihr Vertrauen',

    // Confirmation demande
    requestConfirmTitle: 'Ihre Angebotsanfrage wurde erhalten',
    requestConfirmIntro: 'Wir haben Ihre Transportanfrage erhalten und danken Ihnen dafür.',
    requestConfirmDetails: 'Zusammenfassung Ihrer Anfrage',
    yourQuotesReady: 'Ihre Angebote sind fertig',
    quotesReadyIntro: 'Gute Nachrichten! Wir haben personalisierte Angebote für Ihre Transportanfrage vorbereitet.',
    viewQuotes: 'Meine Angebote ansehen',
    quotesCount: 'Angebot(e) verfügbar',

    // Détails voyage
    tripDetails: 'Reisedetails',
    departure: 'Abfahrt',
    arrival: 'Ankunft',
    date: 'Datum',
    departureDate: 'Abfahrtsdatum',
    returnDate: 'Rückreisedatum',
    passengers: 'Passagiere',
    reference: 'Referenz',
    yourReference: 'Ihre Referenz',
    route: 'Strecke',

    // Paiement
    paymentReminder: 'Zahlungserinnerung',
    paymentReminderIntro: 'Wir erinnern Sie daran, dass Ihre Anzahlung noch aussteht.',
    payNow: 'Jetzt bezahlen',
    amountDue: 'Zu zahlender Betrag',
    deposit: 'Anzahlung',
    depositAmount: 'Anzahlungsbetrag',
    balance: 'Restbetrag',
    balanceAmount: 'Verbleibender Betrag',
    totalPrice: 'Gesamtpreis',
    payByCard: 'Mit Karte bezahlen',
    payByTransfer: 'Per Überweisung bezahlen',
    bankTransferInfo: 'Bankverbindung für die Überweisung',
    iban: 'IBAN',
    bic: 'BIC',
    beneficiary: 'Empfänger',
    paymentReference: 'Zahlungsreferenz',

    // Confirmation réservation
    bookingConfirmed: 'Ihre Buchung ist bestätigt',
    bookingConfirmedIntro: 'Wir freuen uns, Ihre Transportbuchung zu bestätigen.',
    confirmationTitle: 'Buchungsbestätigung',
    reservationConfirmed: 'Ihre Buchung ist bestätigt!',

    // Infos voyage
    tripInfoRequest: 'Reiseinformationen erforderlich',
    tripInfoRequestIntro: 'Um Ihre Buchung abzuschließen, benötigen wir einige zusätzliche Informationen.',
    fillTripInfo: 'Informationen ausfüllen',
    accessClientSpace: 'Zu meinem Kundenbereich',
    tripInfoReminder: 'Bitte vervollständigen Sie Ihre Reiseinformationen',

    // Infos chauffeur
    driverInfo: 'Kontaktdaten Ihres Fahrers',
    driverInfoIntro: 'Hier sind die Kontaktdaten Ihres Fahrers für Ihre Reise.',
    driverName: 'Name des Fahrers',
    driverPhone: 'Telefon',
    vehicleInfo: 'Fahrzeuginformationen',
    driverDetails: 'Fahrerdetails',
    yourDriverIs: 'Ihr Fahrer ist',

    // Offre flash
    flashOffer: 'Flash-Angebot',
    flashOfferIntro: 'Profitieren Sie von einem außergewöhnlichen Rabatt auf Ihre Buchung!',
    originalPrice: 'Ursprünglicher Preis',
    newPrice: 'Neuer Preis',
    validFor: 'Gültig für',
    hours: 'Stunden',
    limitedTimeOffer: 'Zeitlich begrenztes Angebot',
    bookNow: 'Jetzt buchen',

    // Demande avis
    reviewRequest: 'Geben Sie Ihre Bewertung ab',
    reviewRequestIntro: 'Hat Ihre Reise gut geklappt? Teilen Sie Ihre Erfahrung mit uns!',
    leaveReview: 'Bewertung abgeben',

    // Footer
    footerText: 'Diese E-Mail wurde von Busmoov gesendet',
    footerContact: 'Bei Fragen kontaktieren Sie uns',
    unsubscribe: 'Abmelden',
    needHelp: 'Brauchen Sie Hilfe?',
    contactUs: 'Kontaktieren Sie uns',

    // Rappels
    reminderUrgent: 'Dringende Erinnerung',
    reminderFriendly: 'Kleine Erinnerung',
    daysBeforeDeparture: 'Tage vor der Abreise',
    actionRequired: 'Handlung erforderlich',

    // Statuts
    pending: 'Ausstehend',
    confirmed: 'Bestätigt',
    cancelled: 'Storniert',
    completed: 'Abgeschlossen',

    // Templates fournisseurs
    orderConfirmation: 'Auftragsbestätigung',
    orderConfirmationIntro: 'Nach Ihrem Angebot bestätigen wir Ihnen folgende Buchung:',
    serviceType: 'Art der Leistung',
    at: 'um',
    duration: 'Dauer',
    days: 'Tag(e)',
    madDetail: 'Details zur Verfügung',
    numberOfVehicles: 'Anzahl Fahrzeuge',
    numberOfDrivers: 'Anzahl Fahrer',
    agreedAmount: 'Vereinbarter Betrag',
    validateOrder: 'Bestellung bestätigen',
    validationLinkNote: 'Mit diesem Link können Sie die Bestellung mit einem Klick bestätigen, ohne uns ein Dokument zurücksenden zu müssen.',
    returnBpaRequest: 'Bitte senden Sie uns die unterschriebene Auftragsbestätigung zurück, um diese Buchung abzuschließen.',

    // Demande chauffeur
    driverInfoRequest: 'Anfrage Fahrerinformationen',
    driverInfoRequestIntro: 'Wir danken Ihnen für folgende Buchung und bitten Sie, uns die Fahrerinformationen mitzuteilen:',
    pleaseProvide: 'Bitte teilen Sie uns mit',
    driverNameAndPhone: 'Name und Telefon des Fahrers',
    vehiclePlate: 'Fahrzeugkennzeichen',
    submitDriverInfo: 'Informationen übermitteln',
    submitInfoNote: 'Mit diesem Link können Sie die Informationen direkt online eingeben.',

    // Demande disponibilité
    availabilityRequest: 'Verfügbarkeitsanfrage',
    availabilityRequestIntro: 'Wir haben eine Transportanfrage, für die wir gerne Ihre Verfügbarkeit kennen würden.',
    pleaseSendQuote: 'Bitte senden Sie uns Ihr bestes Angebot für diese Leistung.',
    submitProposal: 'Angebot einreichen',

    // Confirmation paiement
    paymentReceived: 'Zahlung erhalten',
    paymentReceivedIntro: 'Wir haben Ihre Zahlung erhalten und danken Ihnen.',
    paymentDetails: 'Zahlungsdetails',
    amountReceived: 'Erhaltener Betrag',
    paymentMethod: 'Zahlungsmethode',
    remainingBalance: 'Restbetrag',
    remainingBalanceNote: 'Dieser Betrag ist vor der Abreise zu begleichen.',
    fullyPaid: 'Ihre Buchung ist vollständig bezahlt!',
  },

  en: {
    // Greetings
    hello: 'Hello',
    dear: 'Dear',
    dearClient: 'Dear customer',
    dearMadamSir: 'Dear Sir/Madam',

    // Sign-off
    bestRegards: 'Best regards',
    theTeam: 'The Busmoov Team',
    thankYou: 'Thank you',
    thankYouForTrust: 'Thank you for your trust',

    // Request confirmation
    requestConfirmTitle: 'Your quote request has been received',
    requestConfirmIntro: 'We have received your transport request and thank you for your trust.',
    requestConfirmDetails: 'Summary of your request',
    yourQuotesReady: 'Your quotes are ready',
    quotesReadyIntro: 'Great news! We have prepared personalized quotes for your transport request.',
    viewQuotes: 'View my quotes',
    quotesCount: 'quote(s) available',

    // Trip details
    tripDetails: 'Trip details',
    departure: 'Departure',
    arrival: 'Arrival',
    date: 'Date',
    departureDate: 'Departure date',
    returnDate: 'Return date',
    passengers: 'Passengers',
    reference: 'Reference',
    yourReference: 'Your reference',
    route: 'Route',

    // Payment
    paymentReminder: 'Payment reminder',
    paymentReminderIntro: 'This is a reminder that your deposit is pending payment.',
    payNow: 'Pay now',
    amountDue: 'Amount due',
    deposit: 'Deposit',
    depositAmount: 'Deposit amount',
    balance: 'Balance',
    balanceAmount: 'Remaining balance',
    totalPrice: 'Total price',
    payByCard: 'Pay by card',
    payByTransfer: 'Pay by bank transfer',
    bankTransferInfo: 'Bank transfer information',
    iban: 'IBAN',
    bic: 'BIC',
    beneficiary: 'Beneficiary',
    paymentReference: 'Payment reference',

    // Booking confirmation
    bookingConfirmed: 'Your booking is confirmed',
    bookingConfirmedIntro: 'We are pleased to confirm your transport booking.',
    confirmationTitle: 'Booking confirmation',
    reservationConfirmed: 'Your booking is confirmed!',

    // Trip info
    tripInfoRequest: 'Trip information required',
    tripInfoRequestIntro: 'To finalize your booking, we need some additional information.',
    fillTripInfo: 'Fill in information',
    accessClientSpace: 'Access my client area',
    tripInfoReminder: 'Please complete your trip information',

    // Driver info
    driverInfo: 'Your driver details',
    driverInfoIntro: 'Here are the contact details for your driver for your trip.',
    driverName: 'Driver name',
    driverPhone: 'Phone',
    vehicleInfo: 'Vehicle information',
    driverDetails: 'Driver details',
    yourDriverIs: 'Your driver is',

    // Flash offer
    flashOffer: 'Flash offer',
    flashOfferIntro: 'Take advantage of an exceptional discount on your booking!',
    originalPrice: 'Original price',
    newPrice: 'New price',
    validFor: 'Valid for',
    hours: 'hours',
    limitedTimeOffer: 'Limited time offer',
    bookNow: 'Book now',

    // Review request
    reviewRequest: 'Leave a review',
    reviewRequestIntro: 'Did your trip go well? Share your experience with us!',
    leaveReview: 'Leave my review',

    // Footer
    footerText: 'This email was sent by Busmoov',
    footerContact: 'For any questions, contact us',
    unsubscribe: 'Unsubscribe',
    needHelp: 'Need help?',
    contactUs: 'Contact us',

    // Reminders
    reminderUrgent: 'Urgent reminder',
    reminderFriendly: 'Friendly reminder',
    daysBeforeDeparture: 'days before departure',
    actionRequired: 'Action required',

    // Status
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed',

    // Supplier templates
    orderConfirmation: 'Order confirmation',
    orderConfirmationIntro: 'Following your proposal, we confirm the following booking:',
    serviceType: 'Service type',
    at: 'at',
    duration: 'Duration',
    days: 'day(s)',
    madDetail: 'Disposal details',
    numberOfVehicles: 'Number of vehicles',
    numberOfDrivers: 'Number of drivers',
    agreedAmount: 'Agreed amount',
    validateOrder: 'Validate order',
    validationLinkNote: 'This link allows you to confirm the order in one click, without having to return any document.',
    returnBpaRequest: 'Please return the signed Confirmation Agreement to finalize this booking.',

    // Driver info request
    driverInfoRequest: 'Driver information request',
    driverInfoRequestIntro: 'Thank you for the following booking. Please provide us with the driver information:',
    pleaseProvide: 'Please provide',
    driverNameAndPhone: 'Driver name and phone',
    vehiclePlate: 'Vehicle registration',
    submitDriverInfo: 'Submit information',
    submitInfoNote: 'This link allows you to enter the information directly online.',

    // Availability request
    availabilityRequest: 'Availability request',
    availabilityRequestIntro: 'We have a transport request for which we would like to know your availability.',
    pleaseSendQuote: 'Please send us your best rate for this service.',
    submitProposal: 'Submit proposal',

    // Payment confirmation
    paymentReceived: 'Payment received',
    paymentReceivedIntro: 'We have received your payment and thank you.',
    paymentDetails: 'Payment details',
    amountReceived: 'Amount received',
    paymentMethod: 'Payment method',
    remainingBalance: 'Remaining balance',
    remainingBalanceNote: 'This amount is due before departure.',
    fullyPaid: 'Your booking is fully paid!',
  },
}

// Fonction pour obtenir les traductions selon la langue
function getEmailTranslations(lang: string): Record<string, string> {
  return EMAIL_TRANSLATIONS[lang] || EMAIL_TRANSLATIONS['fr']
}

// Fonction pour traduire automatiquement le contenu d'un email
function translateEmailContent(content: string, lang: string): string {
  if (lang === 'fr') return content // Pas de traduction nécessaire pour le français

  const translations = getEmailTranslations(lang)
  const frTranslations = EMAIL_TRANSLATIONS['fr']

  // IMPORTANT: Protéger les placeholders {{...}} avant la traduction
  // Cela évite que les regex de traduction corrompent les variables
  const placeholders: string[] = []
  let result = content.replace(/\{\{[^}]+\}\}/g, (match) => {
    placeholders.push(match)
    return `__PLACEHOLDER_${placeholders.length - 1}__`
  })

  // Remplacer les textes français par leurs traductions
  for (const [key, frValue] of Object.entries(frTranslations)) {
    const translatedValue = translations[key] || frValue
    // Remplacer avec des limites de mots pour éviter les remplacements partiels
    const regex = new RegExp(escapeRegex(frValue), 'gi')
    result = result.replace(regex, translatedValue)
  }

  // Restaurer les placeholders originaux
  result = result.replace(/__PLACEHOLDER_(\d+)__/g, (_, index) => {
    return placeholders[parseInt(index)]
  })

  return result
}

// Échapper les caractères spéciaux pour regex
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ============ FIN TRADUCTIONS EMAIL ============

// Domaines autorisés pour CORS
const ALLOWED_ORIGINS = [
  'https://busmoov.com',
  'https://www.busmoov.com',
  'https://busmoov.fr',
  'https://www.busmoov.fr',
  'https://busmoov.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
]

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

// Interface pour les pièces jointes
interface Attachment {
  filename: string
  content: string // Base64 encoded
  contentType: string
}

// Interface pour la réponse Resend
interface ResendResponse {
  id?: string
  error?: {
    message: string
    name: string
  }
}

// Fonction pour envoyer un email via Resend API
async function sendEmailViaResend(
  to: string | string[],
  subject: string,
  htmlContent: string,
  attachments?: Attachment[]
): Promise<ResendResponse> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')

  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured')
  }

  const fromEmail = Deno.env.get('EMAIL_FROM') || 'Busmoov <infos@busmoov.com>'

  // Préparer les pièces jointes pour Resend
  const resendAttachments = attachments?.map(att => ({
    filename: att.filename,
    content: att.content, // Resend accepte le base64 directement
  }))

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: htmlContent,
      attachments: resendAttachments,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('Resend API error:', data)
    throw new Error(data.error?.message || `Resend API error: ${response.status}`)
  }

  return data
}

// Fonction pour charger un template depuis la base de données
// Cherche d'abord dans la langue demandée, sinon fallback sur le français avec traduction auto
async function loadTemplate(supabase: any, templateKey: string, language?: string): Promise<{ subject: string; body: string } | null> {
  const lang = (language || 'fr').toLowerCase()

  // D'abord, essayer de charger le template dans la langue demandée
  const { data: langData, error: langError } = await supabase
    .from('email_templates')
    .select('subject, body, html_content')
    .eq('key', templateKey)
    .eq('language', lang)
    .eq('is_active', true)
    .single()

  if (langData && !langError) {
    console.log(`Template ${templateKey} found in language: ${lang}`)
    return {
      subject: langData.subject,
      body: langData.html_content || langData.body
    }
  }

  // Si pas trouvé dans la langue demandée, charger le français et traduire automatiquement
  console.log(`Template ${templateKey} not found in ${lang}, falling back to French with auto-translation`)

  const { data, error } = await supabase
    .from('email_templates')
    .select('subject, body, html_content')
    .eq('key', templateKey)
    .eq('language', 'fr')
    .eq('is_active', true)
    .single()

  if (error || !data) {
    // Dernier essai sans filtre de langue (pour compatibilité avec anciens templates)
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('email_templates')
      .select('subject, body, html_content')
      .eq('key', templateKey)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (fallbackError || !fallbackData) {
      console.error('Template not found:', templateKey, fallbackError)
      return null
    }

    let subject = fallbackData.subject
    let body = fallbackData.html_content || fallbackData.body

    if (lang !== 'fr') {
      subject = translateEmailContent(subject, lang)
      body = translateEmailContent(body, lang)
    }

    return { subject, body }
  }

  let subject = data.subject
  let body = data.html_content || data.body

  // Traduire automatiquement si la langue n'est pas le français
  if (lang !== 'fr') {
    console.log(`Auto-translating template ${templateKey} from French to ${lang}`)
    subject = translateEmailContent(subject, lang)
    body = translateEmailContent(body, lang)
  }

  return { subject, body }
}

// Fonction pour remplacer les variables dans un template
// Supporte:
// - {{variable}} - Remplacement simple par valeur
// - {{t:clé}} - Traduction automatique selon la langue
// - {{#if variable}}...{{/if}} - Conditions
// - {{#if variable}}...{{else}}...{{/if}} - Conditions avec else
function replaceVariables(text: string, variables: Record<string, string>, language?: string): string {
  let result = text
  const lang = (language || variables.language || 'fr').toLowerCase()
  const translations = getEmailTranslations(lang)

  // 1. Remplacer les traductions {{t:clé}}
  result = result.replace(/\{\{t:(\w+)\}\}/g, (match, key) => {
    return translations[key] || EMAIL_TRANSLATIONS['fr'][key] || match
  })

  // 2. Remplacer les variables simples {{variable}}
  for (const [key, value] of Object.entries(variables)) {
    const safeValue = value ?? ''
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), safeValue)
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), safeValue)
  }

  // 3. IMPORTANT: Traiter d'abord les blocs avec {{else}}, puis ceux sans
  // Gérer {{#if variable}}...{{else}}...{{/if}}
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, ifContent, elseContent) => {
    const value = variables[varName]
    if (value && value !== '' && value !== 'false' && value !== 'null' && value !== 'undefined') {
      return ifContent
    }
    return elseContent
  })

  // 4. Gérer les conditions Handlebars simples {{#if variable}}...{{/if}} (sans else)
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, content) => {
    const value = variables[varName]
    if (value && value !== '' && value !== 'false' && value !== 'null' && value !== 'undefined') {
      return content
    }
    return ''
  })

  return result
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { type, to, subject, html_content, data, attachments } = await req.json()

    if (!to) {
      throw new Error('Email recipient (to) is required')
    }

    let finalSubject = subject
    let finalBody = html_content

    // Langue pour les traductions
    const language = data?.language || 'fr'

    // Variables par défaut (coordonnées Busmoov) - ajoutées à tous les emails
    const defaultVariables: Record<string, string> = {
      phone_display: '01 76 42 05 06',
      email: 'contact@busmoov.com',
      company_name: 'Busmoov',
      company_address: '123 Rue de la République, 75001 Paris',
      current_year: new Date().getFullYear().toString(),
    }

    // Fusionner les variables par défaut avec les données passées
    const mergedData = { ...defaultVariables, ...(data || {}) }

    // Si c'est un email custom, utiliser directement subject et html_content
    if (type === 'custom') {
      if (!subject || !html_content) {
        throw new Error('Subject and html_content are required for custom emails')
      }
      finalSubject = subject
      finalBody = html_content

      // Remplacer les variables même pour les emails custom (avec support traductions {{t:clé}})
      finalSubject = replaceVariables(finalSubject, mergedData, language)
      finalBody = replaceVariables(finalBody, mergedData, language)
    } else {
      // Charger le template depuis la base (avec support multilingue)
      const template = await loadTemplate(supabaseClient, type, language)
      if (!template) {
        throw new Error(`Template not found: ${type}`)
      }

      // Remplacer les variables (avec support traductions {{t:clé}})
      finalSubject = replaceVariables(template.subject, mergedData, language)
      finalBody = replaceVariables(template.body, mergedData, language)
    }

    // Envoyer l'email via Resend
    const result = await sendEmailViaResend(to, finalSubject, finalBody, attachments)

    console.log(`Email sent successfully to ${to} via Resend (id: ${result.id})`)

    // Logger l'email dans la table email_logs
    if (result.id) {
      try {
        const recipient = Array.isArray(to) ? to[0] : to
        // Pour les emails custom, utiliser le template_key passé dans data s'il existe
        const templateKey = type === 'custom' ? (data?.template_key || 'custom') : type
        const dossierId = data?.dossier_id || null

        await supabaseClient
          .from('email_logs')
          .insert({
            resend_id: result.id,
            recipient: recipient,
            sender: Deno.env.get('EMAIL_FROM') || 'infos@busmoov.com',
            subject: finalSubject,
            template_key: templateKey,
            dossier_id: dossierId,
            status: 'sent',
            sent_at: new Date().toISOString(),
            html_content: finalBody,
          })

        console.log(`Email logged in email_logs table (resend_id: ${result.id})`)
      } catch (logError) {
        // Ne pas faire échouer l'envoi si le logging échoue
        console.error('Failed to log email:', logError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        id: result.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
