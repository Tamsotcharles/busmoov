/**
 * Traductions pour le widget de chat
 */

export type ChatLanguage = 'fr' | 'de' | 'es' | 'en'

export interface ChatTranslations {
  // Widget header
  chooseSupplier: string
  suppliersAvailable: string
  yourTransporter: string
  clientChat: string
  usuallyReplies: string
  supplier: string

  // Supplier selection
  selectSupplierPrompt: string
  clickToChat: string

  // Empty state
  welcomeAssistance: string
  askQuestionOrChoose: string
  startConversation: string

  // Messages
  you: string
  supplierLabel: string
  client: string
  assistantName: string

  // Input
  yourMessage: string

  // FAQ suggestions
  faqBaggage: string
  faqBaggageQuestion: string
  faqDriver: string
  faqDriverQuestion: string
  faqEmergency: string
  faqEmergencyQuestion: string
  faqBabySeat: string
  faqBabySeatQuestion: string
  faqToilets: string
  faqToiletsQuestion: string
  faqBreaks: string
  faqBreaksQuestion: string

  // Greeting
  greetingHello: string
  greetingIntro: string
  greetingFaq: string
  greetingPrompt: string

  // Greeting keywords
  greetingWords: string[]

  // FAQ Responses
  responses: {
    baggage: string
    babySeat: string
    toilets: string
    delay: string
    breaks: string
    food: string
    animals: string
    damages: string
    passengerList: string
    driverMeal: string
    schedule: string
    roadmap: string
    driverNotAvailable: string
    driverInfo: string
    emergencyNotAvailable: string
    emergencyInfo: string
  }

  // FAQ Keywords (for matching)
  keywords: {
    baggage: string[]
    driver: string[]
    emergency: string[]
    babySeat: string[]
    toilets: string[]
    delay: string[]
    breaks: string[]
    food: string[]
    animals: string[]
    damages: string[]
    passengerList: string[]
    driverMeal: string[]
    schedule: string[]
    roadmap: string[]
  }
}

const translations: Record<ChatLanguage, ChatTranslations> = {
  fr: {
    chooseSupplier: 'Choisir un fournisseur',
    suppliersAvailable: 'fournisseur(s) disponible(s)',
    yourTransporter: 'Votre transporteur',
    clientChat: 'Chat client',
    usuallyReplies: 'Généralement répond sous 1h',
    supplier: 'Fournisseur',

    selectSupplierPrompt: 'Sélectionnez un fournisseur pour lui envoyer un message',
    clickToChat: 'Cliquez pour discuter',

    welcomeAssistance: 'Bienvenue sur l\'assistance Busmoov',
    askQuestionOrChoose: 'Posez votre question ou choisissez un sujet',
    startConversation: 'Démarrez la conversation',

    you: 'Vous',
    supplierLabel: 'Fournisseur',
    client: 'Client',
    assistantName: 'Assistant Busmoov',

    yourMessage: 'Votre message...',

    faqBaggage: '📦 Bagages autorisés',
    faqBaggageQuestion: 'Combien de bagages puis-je emporter ?',
    faqDriver: '📞 Contact chauffeur',
    faqDriverQuestion: 'Comment contacter le chauffeur ?',
    faqEmergency: '🚨 Numéro d\'astreinte',
    faqEmergencyQuestion: 'Quel est le numéro d\'astreinte ?',
    faqBabySeat: '👶 Sièges enfants',
    faqBabySeatQuestion: 'Y a-t-il des sièges bébé ?',
    faqToilets: '🚽 Toilettes',
    faqToiletsQuestion: 'Y a-t-il des toilettes dans le bus ?',
    faqBreaks: '☕ Pauses',
    faqBreaksQuestion: 'Y a-t-il des pauses pendant le trajet ?',

    greetingHello: '👋 Bonjour !',
    greetingIntro: 'Je suis l\'assistant Busmoov. Je peux répondre à vos questions fréquentes sur votre voyage.',
    greetingFaq: '**Questions fréquentes :**\n• Bagages autorisés\n• Contact chauffeur\n• Numéro d\'astreinte\n• Toilettes / Pauses\n• Et plus...',
    greetingPrompt: '💬 Posez votre question ou sélectionnez un sujet ci-dessous !',

    greetingWords: ['bonjour', 'bonsoir', 'salut', 'hello', 'hi', 'coucou', 'hey'],

    responses: {
      baggage: `📦 **Bagages autorisés**

Chaque passager peut emporter :
• 1 bagage en soute (max 23 kg)
• 1 bagage à main

⚠️ Les bagages hors gabarit (vélos, poussettes, équipements sportifs) doivent être signalés à l'avance pour s'assurer qu'ils peuvent être transportés.`,
      babySeat: `👶 **Sièges enfants**

Les autocars ne sont pas équipés de sièges bébé ou rehausseurs.

✅ Vous pouvez apporter votre propre siège auto/rehausseur et l'installer à bord.

⚠️ Prévenez-nous à l'avance afin que le transporteur puisse prévoir l'espace nécessaire.`,
      toilets: `🚽 **Toilettes à bord**

Cela dépend du type de véhicule :
• **Autocar Grand Tourisme** : généralement équipé de toilettes
• **Minibus / Autocar Standard** : pas de toilettes

💡 Des pauses régulières sont prévues sur les longs trajets (environ toutes les 2h).`,
      delay: `⏰ **En cas de retard**

1. Vérifiez l'heure et le lieu de rendez-vous sur votre feuille de route
2. Patientez 15 minutes - les conditions de circulation peuvent causer des retards
3. Contactez le chauffeur directement (numéro sur votre feuille de route)
4. Si le chauffeur est injoignable, appelez le numéro d'astreinte

💡 Demandez "numéro d'astreinte" ou "contact chauffeur" pour obtenir ces informations.`,
      breaks: `☕ **Pauses pendant le trajet**

Le chauffeur effectue des pauses régulières conformément à la réglementation :
• Pause obligatoire de 45 min après 4h30 de conduite
• Sur les longs trajets : pause environ toutes les 2h

🚬 Il est strictement interdit de fumer dans le car.`,
      food: `🍽️ **Nourriture et boissons à bord**

✅ Autorisé :
• Boissons non alcoolisées en bouteille fermée
• Encas légers et non salissants

❌ Interdit :
• Alcool
• Repas chauds ou odorants
• Nourriture qui peut tacher

🧹 Merci de garder le car propre et de ramasser vos déchets.`,
      animals: `🐕 **Animaux à bord**

Les animaux ne sont généralement **pas autorisés** à bord des autocars.

Exception : les chiens d'assistance pour personnes handicapées sont acceptés.

💡 Si vous avez besoin d'un transport avec animal, veuillez nous contacter à l'avance pour étudier les possibilités.`,
      damages: `⚠️ **Responsabilité et dommages**

Le transporteur est responsable des passagers pendant le voyage.

Pour les bagages :
• Signalez immédiatement tout dommage au chauffeur
• Prenez des photos si possible
• Les objets de valeur doivent être gardés avec vous

📝 Une déclaration écrite pourra être nécessaire pour toute réclamation.`,
      passengerList: `📋 **Liste des passagers**

Une liste nominative peut être demandée pour :
• Les voyages avec mineurs
• Les voyages à l'étranger
• Les réservations de groupe

📝 Vous pouvez la transmettre via votre espace client dans la section "Informations voyage".`,
      driverMeal: `🍴 **Repas du chauffeur**

Lors de voyages avec repas prévu pour le groupe :
• Le repas du chauffeur est généralement à votre charge
• Prévoyez le même repas que le groupe ou un équivalent

💡 Cette information est normalement précisée dans votre contrat de réservation.`,
      schedule: `🕐 **Horaires de votre voyage**

Les horaires précis de votre voyage sont disponibles sur votre feuille de route.

📍 Informations incluses :
• Heure et lieu de prise en charge
• Heure d'arrivée estimée
• Points d'arrêt éventuels

💡 Consultez votre espace client ou demandez "feuille de route" pour plus de détails.`,
      roadmap: `📄 **Feuille de route**

Votre feuille de route contient toutes les informations de votre voyage :
• Horaires de départ et d'arrivée
• Adresses précises
• Contact du chauffeur (quand disponible)
• Numéro d'astreinte

📲 Vous pouvez la consulter et la télécharger depuis votre espace client.`,
      driverNotAvailable: `📞 **Contact chauffeur**

Les informations du chauffeur ne sont pas encore disponibles.

Elles seront communiquées **48h avant le départ** sur votre feuille de route dans votre espace client.

💡 Vous recevrez une notification par email dès qu'elles seront disponibles.`,
      driverInfo: `📞 **Contact chauffeur**`,
      emergencyNotAvailable: `🚨 **Numéro d'astreinte**

Le numéro d'astreinte n'est pas encore disponible.

Il sera communiqué sur votre feuille de route avant le départ.

⚠️ Pour les questions non urgentes, merci d'utiliser ce chat ou votre espace client.`,
      emergencyInfo: `🚨 **Numéro d'astreinte**`,
    },

    keywords: {
      baggage: ['bagage', 'bagages', 'valise', 'valises', 'soute', 'sac', 'sacs', 'combien de bagage', 'poids bagage'],
      driver: ['chauffeur', 'conducteur', 'contacter le chauffeur', 'contact chauffeur', 'joindre le chauffeur', 'tel chauffeur', 'telephone chauffeur', 'appeler chauffeur', 'numero chauffeur'],
      emergency: ['astreinte', 'urgence', 'numero urgence', 'numéro urgence', 'problème', 'probleme', 'retard bus', 'bus en retard', 'accident', 'panne'],
      babySeat: ['siège bébé', 'siege bebe', 'siège enfant', 'siege enfant', 'rehausseur', 'bébé', 'bebe', 'enfant en bas age', 'enfant en bas âge'],
      toilets: ['toilette', 'toilettes', 'wc', 'pipi', 'pause pipi', 'besoin pressant'],
      delay: ['retard', 'en retard', 'bus pas là', 'bus pas la', 'attendre', "n'arrive pas", 'narrive pas'],
      breaks: ['pause', 'pauses', 'arrêt', 'arret', 'arrêts', 'arrets', 'fumer', 'cigarette', 'repos'],
      food: ['manger', 'nourriture', 'boire', 'boisson', 'pique-nique', 'pique nique', 'repas', 'sandwich', 'collation'],
      animals: ['animal', 'animaux', 'chien', 'chat', 'chiens', 'chats', 'pet', 'compagnon'],
      damages: ['dégât', 'degat', 'dégâts', 'degats', 'casse', 'cassé', 'abîmé', 'abime', 'responsabilité', 'responsabilite', 'dommage'],
      passengerList: ['liste passagers', 'liste des passagers', 'passagers', 'noms passagers', 'nom des passagers', 'fournir liste', 'liste nominative'],
      driverMeal: ['repas chauffeur', 'nourrir chauffeur', 'chauffeur mange', 'déjeuner chauffeur', 'dejeuner chauffeur', 'restaurant chauffeur'],
      schedule: ['heure', 'heures', 'horaire', 'horaires', 'départ', 'depart', 'arrivée', 'arrivee', 'rendez-vous', 'rendez vous', 'rdv'],
      roadmap: ['feuille de route', 'feuille route', 'itinéraire', 'itineraire', 'programme', 'planning voyage'],
    },
  },

  de: {
    chooseSupplier: 'Anbieter wählen',
    suppliersAvailable: 'Anbieter verfügbar',
    yourTransporter: 'Ihr Transportunternehmen',
    clientChat: 'Kunden-Chat',
    usuallyReplies: 'Antwortet normalerweise innerhalb von 1 Stunde',
    supplier: 'Anbieter',

    selectSupplierPrompt: 'Wählen Sie einen Anbieter, um eine Nachricht zu senden',
    clickToChat: 'Klicken zum Chatten',

    welcomeAssistance: 'Willkommen beim Busmoov-Support',
    askQuestionOrChoose: 'Stellen Sie Ihre Frage oder wählen Sie ein Thema',
    startConversation: 'Gespräch starten',

    you: 'Sie',
    supplierLabel: 'Anbieter',
    client: 'Kunde',
    assistantName: 'Busmoov Assistent',

    yourMessage: 'Ihre Nachricht...',

    faqBaggage: '📦 Erlaubtes Gepäck',
    faqBaggageQuestion: 'Wie viel Gepäck darf ich mitnehmen?',
    faqDriver: '📞 Fahrerkontakt',
    faqDriverQuestion: 'Wie kann ich den Fahrer kontaktieren?',
    faqEmergency: '🚨 Notfallnummer',
    faqEmergencyQuestion: 'Wie lautet die Notfallnummer?',
    faqBabySeat: '👶 Kindersitze',
    faqBabySeatQuestion: 'Gibt es Kindersitze?',
    faqToilets: '🚽 Toiletten',
    faqToiletsQuestion: 'Gibt es Toiletten im Bus?',
    faqBreaks: '☕ Pausen',
    faqBreaksQuestion: 'Gibt es Pausen während der Fahrt?',

    greetingHello: '👋 Guten Tag!',
    greetingIntro: 'Ich bin der Busmoov-Assistent. Ich kann Ihre häufigen Fragen zu Ihrer Reise beantworten.',
    greetingFaq: '**Häufige Fragen:**\n• Erlaubtes Gepäck\n• Fahrerkontakt\n• Notfallnummer\n• Toiletten / Pausen\n• Und mehr...',
    greetingPrompt: '💬 Stellen Sie Ihre Frage oder wählen Sie unten ein Thema!',

    greetingWords: ['guten tag', 'hallo', 'hi', 'hey', 'moin', 'servus', 'grüß gott'],

    responses: {
      baggage: `📦 **Erlaubtes Gepäck**

Jeder Passagier darf mitnehmen:
• 1 Gepäckstück im Laderaum (max 23 kg)
• 1 Handgepäckstück

⚠️ Übergepäck (Fahrräder, Kinderwagen, Sportausrüstung) muss im Voraus angemeldet werden, um sicherzustellen, dass es transportiert werden kann.`,
      babySeat: `👶 **Kindersitze**

Die Busse sind nicht mit Kindersitzen oder Sitzerhöhungen ausgestattet.

✅ Sie können Ihren eigenen Kindersitz/Sitzerhöhung mitbringen und an Bord installieren.

⚠️ Bitte informieren Sie uns im Voraus, damit der Transporter den notwendigen Platz einplanen kann.`,
      toilets: `🚽 **Toiletten an Bord**

Dies hängt vom Fahrzeugtyp ab:
• **Reisebus Grand Tourisme**: in der Regel mit Toilette ausgestattet
• **Minibus / Standardbus**: keine Toilette

💡 Bei langen Fahrten sind regelmäßige Pausen vorgesehen (etwa alle 2 Stunden).`,
      delay: `⏰ **Bei Verspätung**

1. Überprüfen Sie Uhrzeit und Treffpunkt auf Ihrem Fahrplan
2. Warten Sie 15 Minuten - Verkehrsbedingungen können Verzögerungen verursachen
3. Kontaktieren Sie den Fahrer direkt (Nummer auf Ihrem Fahrplan)
4. Wenn der Fahrer nicht erreichbar ist, rufen Sie die Notfallnummer an

💡 Fragen Sie nach "Notfallnummer" oder "Fahrerkontakt", um diese Informationen zu erhalten.`,
      breaks: `☕ **Pausen während der Fahrt**

Der Fahrer macht regelmäßige Pausen gemäß den Vorschriften:
• Obligatorische Pause von 45 Min nach 4,5 Stunden Fahrt
• Bei langen Fahrten: Pause etwa alle 2 Stunden

🚬 Rauchen im Bus ist streng verboten.`,
      food: `🍽️ **Essen und Getränke an Bord**

✅ Erlaubt:
• Alkoholfreie Getränke in geschlossenen Flaschen
• Leichte, nicht schmutzende Snacks

❌ Verboten:
• Alkohol
• Warme oder stark riechende Speisen
• Lebensmittel, die Flecken verursachen können

🧹 Bitte halten Sie den Bus sauber und sammeln Sie Ihren Müll ein.`,
      animals: `🐕 **Tiere an Bord**

Tiere sind in Bussen generell **nicht erlaubt**.

Ausnahme: Assistenzhunde für Menschen mit Behinderungen sind zugelassen.

💡 Wenn Sie einen Transport mit Tier benötigen, kontaktieren Sie uns bitte im Voraus, um die Möglichkeiten zu prüfen.`,
      damages: `⚠️ **Haftung und Schäden**

Der Transporter ist während der Fahrt für die Passagiere verantwortlich.

Bei Gepäck:
• Melden Sie Schäden sofort dem Fahrer
• Machen Sie wenn möglich Fotos
• Wertsachen sollten Sie bei sich behalten

📝 Für Reklamationen kann eine schriftliche Erklärung erforderlich sein.`,
      passengerList: `📋 **Passagierliste**

Eine namentliche Liste kann angefordert werden für:
• Reisen mit Minderjährigen
• Auslandsreisen
• Gruppenreservierungen

📝 Sie können diese über Ihren Kundenbereich im Abschnitt "Reiseinformationen" übermitteln.`,
      driverMeal: `🍴 **Mahlzeit des Fahrers**

Bei Reisen mit geplanter Gruppenmahlzeit:
• Die Mahlzeit des Fahrers geht in der Regel zu Ihren Lasten
• Planen Sie die gleiche Mahlzeit wie für die Gruppe oder eine gleichwertige

💡 Diese Information ist normalerweise in Ihrem Reservierungsvertrag angegeben.`,
      schedule: `🕐 **Ihre Reisezeiten**

Die genauen Zeiten Ihrer Reise finden Sie auf Ihrem Fahrplan.

📍 Enthaltene Informationen:
• Abholzeit und -ort
• Geschätzte Ankunftszeit
• Eventuelle Haltepunkte

💡 Besuchen Sie Ihren Kundenbereich oder fragen Sie nach "Fahrplan" für weitere Details.`,
      roadmap: `📄 **Fahrplan**

Ihr Fahrplan enthält alle Informationen zu Ihrer Reise:
• Abfahrts- und Ankunftszeiten
• Genaue Adressen
• Kontakt des Fahrers (wenn verfügbar)
• Notfallnummer

📲 Sie können ihn in Ihrem Kundenbereich einsehen und herunterladen.`,
      driverNotAvailable: `📞 **Fahrerkontakt**

Die Fahrerinformationen sind noch nicht verfügbar.

Sie werden **48 Stunden vor Abfahrt** auf Ihrem Fahrplan in Ihrem Kundenbereich mitgeteilt.

💡 Sie erhalten eine E-Mail-Benachrichtigung, sobald sie verfügbar sind.`,
      driverInfo: `📞 **Fahrerkontakt**`,
      emergencyNotAvailable: `🚨 **Notfallnummer**

Die Notfallnummer ist noch nicht verfügbar.

Sie wird vor der Abfahrt auf Ihrem Fahrplan mitgeteilt.

⚠️ Für nicht dringende Fragen nutzen Sie bitte diesen Chat oder Ihren Kundenbereich.`,
      emergencyInfo: `🚨 **Notfallnummer**`,
    },

    keywords: {
      baggage: ['gepäck', 'gepack', 'koffer', 'tasche', 'taschen', 'laderaum', 'wie viel gepäck', 'gewicht gepäck'],
      driver: ['fahrer', 'fahrer kontaktieren', 'fahrerkontakt', 'fahrer erreichen', 'telefon fahrer', 'fahrer anrufen', 'nummer fahrer'],
      emergency: ['notfall', 'notfallnummer', 'dringend', 'problem', 'verspätung', 'bus verspätet', 'unfall', 'panne'],
      babySeat: ['kindersitz', 'babysitz', 'sitzerhöhung', 'baby', 'kleinkind', 'kind'],
      toilets: ['toilette', 'toiletten', 'wc', 'klo'],
      delay: ['verspätung', 'verspätet', 'bus nicht da', 'warten', 'kommt nicht'],
      breaks: ['pause', 'pausen', 'halt', 'rauchen', 'zigarette', 'ruhe'],
      food: ['essen', 'trinken', 'getränk', 'getränke', 'picknick', 'mahlzeit', 'sandwich', 'snack'],
      animals: ['tier', 'tiere', 'hund', 'katze', 'haustier'],
      damages: ['schaden', 'schäden', 'kaputt', 'beschädigt', 'haftung', 'verantwortung'],
      passengerList: ['passagierliste', 'namensliste', 'passagiere', 'namen', 'liste'],
      driverMeal: ['mahlzeit fahrer', 'fahrer essen', 'mittagessen fahrer', 'restaurant fahrer'],
      schedule: ['uhrzeit', 'zeit', 'zeiten', 'abfahrt', 'ankunft', 'treffpunkt'],
      roadmap: ['fahrplan', 'route', 'reiseplan', 'programm'],
    },
  },

  es: {
    chooseSupplier: 'Elegir proveedor',
    suppliersAvailable: 'proveedor(es) disponible(s)',
    yourTransporter: 'Su transportista',
    clientChat: 'Chat cliente',
    usuallyReplies: 'Normalmente responde en 1 hora',
    supplier: 'Proveedor',

    selectSupplierPrompt: 'Seleccione un proveedor para enviarle un mensaje',
    clickToChat: 'Haga clic para chatear',

    welcomeAssistance: 'Bienvenido a la asistencia Busmoov',
    askQuestionOrChoose: 'Haga su pregunta o elija un tema',
    startConversation: 'Iniciar conversación',

    you: 'Usted',
    supplierLabel: 'Proveedor',
    client: 'Cliente',
    assistantName: 'Asistente Busmoov',

    yourMessage: 'Su mensaje...',

    faqBaggage: '📦 Equipaje permitido',
    faqBaggageQuestion: '¿Cuánto equipaje puedo llevar?',
    faqDriver: '📞 Contacto conductor',
    faqDriverQuestion: '¿Cómo puedo contactar al conductor?',
    faqEmergency: '🚨 Número de emergencia',
    faqEmergencyQuestion: '¿Cuál es el número de emergencia?',
    faqBabySeat: '👶 Sillas para niños',
    faqBabySeatQuestion: '¿Hay sillas para bebés?',
    faqToilets: '🚽 Baños',
    faqToiletsQuestion: '¿Hay baños en el autobús?',
    faqBreaks: '☕ Paradas',
    faqBreaksQuestion: '¿Hay paradas durante el viaje?',

    greetingHello: '👋 ¡Hola!',
    greetingIntro: 'Soy el asistente de Busmoov. Puedo responder a sus preguntas frecuentes sobre su viaje.',
    greetingFaq: '**Preguntas frecuentes:**\n• Equipaje permitido\n• Contacto del conductor\n• Número de emergencia\n• Baños / Paradas\n• Y más...',
    greetingPrompt: '💬 ¡Haga su pregunta o seleccione un tema a continuación!',

    greetingWords: ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hey', 'saludos'],

    responses: {
      baggage: `📦 **Equipaje permitido**

Cada pasajero puede llevar:
• 1 maleta en bodega (máx 23 kg)
• 1 equipaje de mano

⚠️ El equipaje fuera de norma (bicicletas, cochecitos, equipos deportivos) debe ser notificado con anticipación para asegurar que pueda ser transportado.`,
      babySeat: `👶 **Sillas para niños**

Los autobuses no están equipados con sillas para bebés o elevadores.

✅ Puede traer su propia silla de auto/elevador e instalarla a bordo.

⚠️ Avísenos con anticipación para que el transportista pueda prever el espacio necesario.`,
      toilets: `🚽 **Baños a bordo**

Depende del tipo de vehículo:
• **Autocar Gran Turismo**: generalmente equipado con baño
• **Minibús / Autocar Estándar**: sin baño

💡 Se prevén paradas regulares en viajes largos (aproximadamente cada 2 horas).`,
      delay: `⏰ **En caso de retraso**

1. Verifique la hora y el lugar de encuentro en su hoja de ruta
2. Espere 15 minutos - las condiciones del tráfico pueden causar retrasos
3. Contacte al conductor directamente (número en su hoja de ruta)
4. Si el conductor no está disponible, llame al número de emergencia

💡 Pregunte por "número de emergencia" o "contacto del conductor" para obtener esta información.`,
      breaks: `☕ **Paradas durante el viaje**

El conductor hace paradas regulares según la normativa:
• Parada obligatoria de 45 min después de 4h30 de conducción
• En viajes largos: parada aproximadamente cada 2 horas

🚬 Está estrictamente prohibido fumar en el autobús.`,
      food: `🍽️ **Comida y bebidas a bordo**

✅ Permitido:
• Bebidas no alcohólicas en botella cerrada
• Snacks ligeros que no ensucien

❌ Prohibido:
• Alcohol
• Comidas calientes u olorosas
• Alimentos que puedan manchar

🧹 Por favor mantenga el autobús limpio y recoja su basura.`,
      animals: `🐕 **Animales a bordo**

Los animales generalmente **no están permitidos** en los autobuses.

Excepción: se aceptan perros de asistencia para personas con discapacidad.

💡 Si necesita un transporte con animal, contáctenos con anticipación para estudiar las posibilidades.`,
      damages: `⚠️ **Responsabilidad y daños**

El transportista es responsable de los pasajeros durante el viaje.

Para el equipaje:
• Informe inmediatamente cualquier daño al conductor
• Tome fotos si es posible
• Los objetos de valor deben mantenerse con usted

📝 Puede ser necesaria una declaración escrita para cualquier reclamación.`,
      passengerList: `📋 **Lista de pasajeros**

Se puede solicitar una lista nominativa para:
• Viajes con menores
• Viajes al extranjero
• Reservas de grupo

📝 Puede transmitirla a través de su espacio cliente en la sección "Información del viaje".`,
      driverMeal: `🍴 **Comida del conductor**

En viajes con comida prevista para el grupo:
• La comida del conductor generalmente corre por su cuenta
• Prevea la misma comida que el grupo o una equivalente

💡 Esta información normalmente se especifica en su contrato de reserva.`,
      schedule: `🕐 **Horarios de su viaje**

Los horarios exactos de su viaje están disponibles en su hoja de ruta.

📍 Información incluida:
• Hora y lugar de recogida
• Hora de llegada estimada
• Puntos de parada eventuales

💡 Consulte su espacio cliente o pregunte por "hoja de ruta" para más detalles.`,
      roadmap: `📄 **Hoja de ruta**

Su hoja de ruta contiene toda la información de su viaje:
• Horarios de salida y llegada
• Direcciones exactas
• Contacto del conductor (cuando esté disponible)
• Número de emergencia

📲 Puede consultarla y descargarla desde su espacio cliente.`,
      driverNotAvailable: `📞 **Contacto del conductor**

La información del conductor aún no está disponible.

Se comunicará **48 horas antes de la salida** en su hoja de ruta en su espacio cliente.

💡 Recibirá una notificación por email cuando esté disponible.`,
      driverInfo: `📞 **Contacto del conductor**`,
      emergencyNotAvailable: `🚨 **Número de emergencia**

El número de emergencia aún no está disponible.

Se comunicará en su hoja de ruta antes de la salida.

⚠️ Para preguntas no urgentes, por favor use este chat o su espacio cliente.`,
      emergencyInfo: `🚨 **Número de emergencia**`,
    },

    keywords: {
      baggage: ['equipaje', 'maleta', 'maletas', 'bodega', 'bolsa', 'bolsas', 'cuánto equipaje', 'peso equipaje'],
      driver: ['conductor', 'chofer', 'contactar conductor', 'contacto conductor', 'llamar conductor', 'teléfono conductor', 'número conductor'],
      emergency: ['emergencia', 'urgencia', 'número emergencia', 'problema', 'retraso autobús', 'autobús retrasado', 'accidente', 'avería'],
      babySeat: ['silla bebé', 'silla niño', 'elevador', 'bebé', 'niño pequeño'],
      toilets: ['baño', 'baños', 'wc', 'servicio'],
      delay: ['retraso', 'retrasado', 'autobús no llega', 'esperar', 'no llega'],
      breaks: ['parada', 'paradas', 'descanso', 'fumar', 'cigarrillo'],
      food: ['comer', 'comida', 'beber', 'bebida', 'picnic', 'comida', 'sandwich', 'snack'],
      animals: ['animal', 'animales', 'perro', 'gato', 'mascota'],
      damages: ['daño', 'daños', 'roto', 'dañado', 'responsabilidad'],
      passengerList: ['lista pasajeros', 'nombres pasajeros', 'pasajeros', 'nombres', 'lista nominativa'],
      driverMeal: ['comida conductor', 'almuerzo conductor', 'restaurante conductor'],
      schedule: ['hora', 'horas', 'horario', 'horarios', 'salida', 'llegada', 'punto de encuentro'],
      roadmap: ['hoja de ruta', 'itinerario', 'programa', 'plan de viaje'],
    },
  },

  en: {
    chooseSupplier: 'Choose a supplier',
    suppliersAvailable: 'supplier(s) available',
    yourTransporter: 'Your transporter',
    clientChat: 'Client chat',
    usuallyReplies: 'Usually replies within 1 hour',
    supplier: 'Supplier',

    selectSupplierPrompt: 'Select a supplier to send them a message',
    clickToChat: 'Click to chat',

    welcomeAssistance: 'Welcome to Busmoov assistance',
    askQuestionOrChoose: 'Ask your question or choose a topic',
    startConversation: 'Start conversation',

    you: 'You',
    supplierLabel: 'Supplier',
    client: 'Client',
    assistantName: 'Busmoov Assistant',

    yourMessage: 'Your message...',

    faqBaggage: '📦 Allowed luggage',
    faqBaggageQuestion: 'How much luggage can I bring?',
    faqDriver: '📞 Driver contact',
    faqDriverQuestion: 'How can I contact the driver?',
    faqEmergency: '🚨 Emergency number',
    faqEmergencyQuestion: 'What is the emergency number?',
    faqBabySeat: '👶 Child seats',
    faqBabySeatQuestion: 'Are there baby seats?',
    faqToilets: '🚽 Toilets',
    faqToiletsQuestion: 'Are there toilets on the bus?',
    faqBreaks: '☕ Breaks',
    faqBreaksQuestion: 'Are there breaks during the trip?',

    greetingHello: '👋 Hello!',
    greetingIntro: 'I\'m the Busmoov assistant. I can answer your frequent questions about your trip.',
    greetingFaq: '**Frequent questions:**\n• Allowed luggage\n• Driver contact\n• Emergency number\n• Toilets / Breaks\n• And more...',
    greetingPrompt: '💬 Ask your question or select a topic below!',

    greetingWords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],

    responses: {
      baggage: `📦 **Allowed Luggage**

Each passenger may bring:
• 1 piece of luggage in the hold (max 23 kg)
• 1 carry-on bag

⚠️ Oversized luggage (bicycles, strollers, sports equipment) must be reported in advance to ensure it can be transported.`,
      babySeat: `👶 **Child Seats**

Coaches are not equipped with baby seats or booster seats.

✅ You can bring your own car seat/booster and install it on board.

⚠️ Please let us know in advance so the transporter can plan the necessary space.`,
      toilets: `🚽 **Toilets on Board**

This depends on the vehicle type:
• **Grand Tourism Coach**: usually equipped with toilet
• **Minibus / Standard Coach**: no toilet

💡 Regular breaks are scheduled on long trips (approximately every 2 hours).`,
      delay: `⏰ **In Case of Delay**

1. Check the time and meeting place on your roadmap
2. Wait 15 minutes - traffic conditions can cause delays
3. Contact the driver directly (number on your roadmap)
4. If the driver is unreachable, call the emergency number

💡 Ask for "emergency number" or "driver contact" to get this information.`,
      breaks: `☕ **Breaks During the Trip**

The driver takes regular breaks in accordance with regulations:
• Mandatory 45-minute break after 4.5 hours of driving
• On long trips: break approximately every 2 hours

🚬 Smoking is strictly forbidden in the coach.`,
      food: `🍽️ **Food and Drinks on Board**

✅ Allowed:
• Non-alcoholic drinks in closed bottles
• Light, non-messy snacks

❌ Forbidden:
• Alcohol
• Hot or smelly food
• Food that can stain

🧹 Please keep the coach clean and collect your rubbish.`,
      animals: `🐕 **Animals on Board**

Animals are generally **not allowed** on coaches.

Exception: assistance dogs for people with disabilities are accepted.

💡 If you need transport with an animal, please contact us in advance to explore options.`,
      damages: `⚠️ **Liability and Damages**

The transporter is responsible for passengers during the journey.

For luggage:
• Report any damage to the driver immediately
• Take photos if possible
• Valuables should be kept with you

📝 A written statement may be required for any claim.`,
      passengerList: `📋 **Passenger List**

A nominal list may be requested for:
• Trips with minors
• International trips
• Group bookings

📝 You can submit it via your client area in the "Trip Information" section.`,
      driverMeal: `🍴 **Driver's Meal**

For trips with planned group meals:
• The driver's meal is usually at your expense
• Plan the same meal as the group or an equivalent

💡 This information is normally specified in your booking contract.`,
      schedule: `🕐 **Your Trip Schedule**

The exact times of your trip are available on your roadmap.

📍 Information included:
• Pickup time and location
• Estimated arrival time
• Possible stop points

💡 Check your client area or ask for "roadmap" for more details.`,
      roadmap: `📄 **Roadmap**

Your roadmap contains all the information about your trip:
• Departure and arrival times
• Exact addresses
• Driver contact (when available)
• Emergency number

📲 You can view and download it from your client area.`,
      driverNotAvailable: `📞 **Driver Contact**

The driver information is not yet available.

It will be communicated **48 hours before departure** on your roadmap in your client area.

💡 You will receive an email notification as soon as it is available.`,
      driverInfo: `📞 **Driver Contact**`,
      emergencyNotAvailable: `🚨 **Emergency Number**

The emergency number is not yet available.

It will be communicated on your roadmap before departure.

⚠️ For non-urgent questions, please use this chat or your client area.`,
      emergencyInfo: `🚨 **Emergency Number**`,
    },

    keywords: {
      baggage: ['luggage', 'baggage', 'suitcase', 'bag', 'bags', 'hold', 'how much luggage', 'luggage weight'],
      driver: ['driver', 'contact driver', 'driver contact', 'reach driver', 'driver phone', 'call driver', 'driver number'],
      emergency: ['emergency', 'urgent', 'emergency number', 'problem', 'bus delay', 'bus late', 'accident', 'breakdown'],
      babySeat: ['baby seat', 'child seat', 'booster', 'baby', 'infant', 'toddler'],
      toilets: ['toilet', 'toilets', 'bathroom', 'restroom', 'wc', 'loo'],
      delay: ['delay', 'delayed', 'late', 'bus not here', 'waiting', 'not arriving'],
      breaks: ['break', 'breaks', 'stop', 'smoke', 'cigarette', 'rest'],
      food: ['eat', 'food', 'drink', 'beverage', 'picnic', 'meal', 'sandwich', 'snack'],
      animals: ['animal', 'animals', 'dog', 'cat', 'pet', 'pets'],
      damages: ['damage', 'damages', 'broken', 'damaged', 'liability', 'responsibility'],
      passengerList: ['passenger list', 'names', 'passengers', 'passenger names', 'list of passengers'],
      driverMeal: ['driver meal', 'driver food', 'driver lunch', 'driver restaurant'],
      schedule: ['time', 'times', 'schedule', 'departure', 'arrival', 'meeting point', 'pickup'],
      roadmap: ['roadmap', 'route', 'itinerary', 'program', 'travel plan'],
    },
  },
}

export function getChatTranslations(language: ChatLanguage): ChatTranslations {
  return translations[language] || translations['fr']
}

export function getLanguageFromCountryCode(countryCode: string | null | undefined): ChatLanguage {
  switch (countryCode?.toUpperCase()) {
    case 'DE': return 'de'
    case 'ES': return 'es'
    case 'GB': return 'en'
    case 'FR':
    default: return 'fr'
  }
}
