import type { SeoLanguage } from './seo-data'

/**
 * Blocs SEO de la home par langue (sous « Comment ça marche ? »). Une seule
 * source pour le rendu React (SectionsHome) et le prérendu statique.
 * La liste éventuelle s'affiche après le premier paragraphe. Les liens
 * internes utilisent les chemins français, traduits au rendu.
 *
 * Les versions EN, DE et ES visent surtout des groupes étrangers qui
 * voyagent en France (réponse de Charles, octobre 2026) : prix de départ
 * des trajets en France, aéroports français.
 */
export interface SectionHome {
  h2: string
  paragraphes: string[]
  liste?: string[]
}

const homeFr: SectionHome[] = [
  {
    h2: 'Bus, minibus ou autocar : quel véhicule pour votre groupe ?',
    paragraphes: [
      "Pour une [location de bus avec chauffeur](/location-bus), tout part de l'effectif. Jusqu'à 20 passagers, un minibus suffit pour une navette, une visite en ville ou un petit séminaire. De 21 à 59 personnes, c'est l'autocar standard, le plus demandé pour les sorties et excursions à la journée. Au-delà, un autocar grande capacité transporte jusqu'à 90 passagers sans scinder le groupe. Sur un long trajet, la soute, les toilettes à bord et le nombre de chauffeurs comptent autant que les places. Le chauffeur professionnel est toujours inclus : il conduit, gère le stationnement et respecte les temps de repos.",
    ],
  },
  {
    h2: 'Scolaires, associations, entreprises : qui réserve un car avec Busmoov ?',
    paragraphes: [
      "Nos clients sont des écoles, collèges et lycées, des comités d'entreprise, des clubs sportifs, des associations, des agences de voyage et des particuliers qui organisent un mariage. Pour une classe, la [location de car pour une sortie scolaire](/services/sorties-scolaires) obéit à des règles précises : ceinture obligatoire, taux d'encadrement, autorisation de sortie du territoire à l'étranger. Les entreprises réservent surtout des navettes de séminaire et des transferts d'invités, les clubs des déplacements de match le week-end. Chaque devis tient compte des horaires, de l'attente sur place et de l'amplitude de la journée du chauffeur.",
    ],
  },
  {
    h2: 'Navettes aéroport, gare et événements',
    paragraphes: [
      "Un groupe qui atterrit à Roissy, Orly ou Lyon-Saint-Exupéry n'a pas à se disperser en taxis. Avec un [transfert aéroport en autocar](/services/transfert-aeroport), le chauffeur suit l'heure d'arrivée du vol, attend en cas de retard et conduit tout le monde à l'hôtel ou sur le lieu de l'événement. Le principe est le même pour les gares TGV, les salons, les mariages ou les concerts. Quand les invités arrivent à des heures différentes, le car fait des rotations sur la journée au lieu d'un seul trajet. Indiquez simplement vos horaires dans la demande de devis.",
    ],
  },
  {
    h2: "Combien coûte une location d'autocar avec chauffeur ?",
    paragraphes: [
      'Nos prix de départ 2026, TTC, chauffeur, carburant et péages inclus, pour un minibus et pour un autocar :',
      "Le prix final dépend de la date, de la distance, de l'attente sur place et de la région : un samedi de juin coûte plus cher qu'un mardi de février. Notre [guide des prix de location d'autocar](/blog/prix-location-autocar) détaille chaque poste.",
    ],
    liste: [
      'Transfert aller simple (gare, aéroport) : à partir de 350 € en minibus, 400 € en autocar',
      'Journée locale aller-retour : à partir de 600 € et 700 €',
      'Journée régionale aller-retour : à partir de 900 € et 1 000 €',
      'Week-end de deux jours : à partir de 1 600 € et 1 800 €',
    ],
  },
  {
    h2: "Busmoov, la réservation d'autocar simplifiée depuis 2019",
    paragraphes: [
      "Busmoov est une marque du groupe Navelys, créée en 2019 pour simplifier la réservation d'un car de groupe. Au lieu d'appeler plusieurs transporteurs, vous décrivez votre trajet une seule fois : nous consultons notre réseau de plus de 180 autocaristes vérifiés et vous recevez jusqu'à trois devis sous 24h. Notre équipe suit le dossier jusqu'au départ, 6 jours sur 7, et le paiement se fait en ligne. Nous couvrons toute la France, de la [location d'autocar à Paris](/location-autocar/paris) aux grandes villes de région, ainsi que les voyages vers les pays voisins.",
    ],
  },
]

const homeEn: SectionHome[] = [
  {
    h2: 'Bus, minibus or coach: which vehicle for your group?',
    paragraphes: [
      "Choosing a vehicle starts with headcount. Up to 20 passengers, a minibus is enough for a transfer, a city tour or a small seminar: see our [minibus hire with driver](/services/location-minibus). From 21 to 59 people, the standard coach is the most requested option for day trips and excursions. Beyond that, a high-capacity coach carries up to 90 passengers without splitting the group. On a long journey, luggage space, an on-board toilet and the number of drivers matter as much as the seat count. A professional driver is always included: they drive, handle parking and respect mandatory rest times.",
    ],
  },
  {
    h2: 'Schools, associations, companies: who books a coach with Busmoov?',
    paragraphes: [
      "Our clients include schools, company social committees, sports clubs, associations, travel agencies and private customers organising a wedding. For a class, [coach hire for school trips](/services/sorties-scolaires) follows strict rules: seat belts, supervision ratios and travel documents for trips abroad. Companies mostly book seminar shuttles and guest transfers, while clubs book match-day travel at weekends. Every quote takes into account timings, waiting time on site and the length of the driver's working day.",
    ],
  },
  {
    h2: 'Airport, station and event shuttles',
    paragraphes: [
      "A group landing at Paris-Charles de Gaulle, Orly or Lyon-Saint-Exupéry doesn't need to split up into taxis. With an [airport transfer by coach](/services/transfert-aeroport), the driver tracks your flight's arrival time, waits if it is delayed and takes everyone straight to the hotel or venue. The same applies to high-speed train stations, trade fairs, weddings and concerts. When guests arrive at different times, the coach runs several rotations during the day instead of a single trip. Simply give your timings in your quote request.",
    ],
  },
  {
    h2: 'How much does coach hire with a driver cost in France?',
    paragraphes: [
      'Our 2026 starting prices for trips in France, including VAT, driver, fuel and tolls, for a minibus and for a coach:',
      'The final price depends on the date, the distance, waiting time on site and the region: a Saturday in June costs more than a Tuesday in February. Our page on [coach types and on-board equipment](/services/location-autocar) helps you choose the right model.',
    ],
    liste: [
      'Single transfer (station, airport): from €350 by minibus, €400 by coach',
      'Local day trip, return: from €600 and €700',
      'Regional day trip, return: from €900 and €1,000',
      'Two-day weekend: from €1,600 and €1,800',
    ],
  },
  {
    h2: 'Busmoov: coach booking made simple since 2019',
    paragraphes: [
      'Busmoov is a brand of the Navelys group, created in 2019 to make booking a group coach simple. Instead of calling several operators, you describe your trip once: we consult our network of more than 180 verified coach operators and you receive up to three quotes within 24 hours. Our team follows your booking until departure, 6 days a week, and payment is made online. We cover the whole of France, from Paris to the regions, including group tours such as [coach trips to the Loire Valley castles](/autocar-chateaux-de-la-loire).',
    ],
  },
]

const homeDe: SectionHome[] = [
  {
    h2: 'Bus, Minibus oder Reisebus: welches Fahrzeug für Ihre Gruppe?',
    paragraphes: [
      'Die Wahl des Fahrzeugs hängt zuerst von der Gruppengröße ab. Bis 20 Fahrgäste reicht ein Minibus für einen Transfer, eine Stadtrundfahrt oder ein kleines Seminar, siehe [Minibus mieten mit Fahrer](/services/location-minibus). Von 21 bis 59 Personen ist der Standardreisebus die meistgefragte Lösung für Tagesausflüge. Darüber hinaus befördert ein Großraumbus bis zu 90 Fahrgäste, ohne die Gruppe aufzuteilen. Auf langen Strecken zählen Gepäckraum, Bordtoilette und die Zahl der Fahrer ebenso wie die Sitzplätze. Ein Berufsfahrer ist immer inklusive: Er fährt, kümmert sich ums Parken und hält die vorgeschriebenen Ruhezeiten ein.',
    ],
  },
  {
    h2: 'Schulen, Vereine, Unternehmen: Wer bucht einen Bus über Busmoov?',
    paragraphes: [
      'Zu unseren Kunden gehören Schulen, Unternehmen, Sportvereine, Vereine, Reisebüros und Privatpersonen, die eine Hochzeit organisieren. Für eine Schulklasse gelten beim [Busmieten für Schulausflüge](/services/sorties-scolaires) klare Regeln: Anschnallpflicht, Betreuungsschlüssel und Reisedokumente für Fahrten ins Ausland. Unternehmen buchen vor allem Seminar-Shuttles und Gästetransfers, Vereine Fahrten zu Auswärtsspielen am Wochenende. Jedes Angebot berücksichtigt die Uhrzeiten, die Wartezeit vor Ort und die Länge des Arbeitstags des Fahrers.',
    ],
  },
  {
    h2: 'Shuttles zu Flughafen, Bahnhof und Veranstaltungen',
    paragraphes: [
      'Eine Gruppe, die in Paris-Charles de Gaulle, Orly oder Lyon-Saint-Exupéry landet, muss sich nicht auf mehrere Taxis verteilen. Beim [Flughafentransfer mit dem Reisebus](/services/transfert-aeroport) verfolgt der Fahrer die Ankunftszeit des Flugs, wartet bei Verspätung und bringt alle direkt zum Hotel oder zum Veranstaltungsort. Dasselbe gilt für TGV-Bahnhöfe, Messen, Hochzeiten und Konzerte. Kommen die Gäste zu unterschiedlichen Zeiten an, fährt der Bus über den Tag mehrere Runden statt einer einzigen Fahrt. Geben Sie Ihre Zeiten einfach in der Angebotsanfrage an.',
    ],
  },
  {
    h2: 'Was kostet ein Reisebus mit Fahrer in Frankreich?',
    paragraphes: [
      'Unsere Startpreise 2026 für Fahrten in Frankreich, inklusive MwSt., Fahrer, Kraftstoff und Maut, für einen Minibus und für einen Reisebus:',
      'Der Endpreis hängt vom Datum, der Strecke, der Wartezeit vor Ort und der Region ab: Ein Samstag im Juni kostet mehr als ein Dienstag im Februar. Auf unserer Seite zu [Reisebustypen und Ausstattung](/services/location-autocar) finden Sie das passende Modell.',
    ],
    liste: [
      'Einfacher Transfer (Bahnhof, Flughafen): ab 350 € im Minibus, ab 400 € im Reisebus',
      'Tagesausflug in der Umgebung, hin und zurück: ab 600 € bzw. 700 €',
      'Regionaler Tagesausflug, hin und zurück: ab 900 € bzw. 1.000 €',
      'Wochenende mit zwei Tagen: ab 1.600 € bzw. 1.800 €',
    ],
  },
  {
    h2: 'Busmoov: Busbuchung leicht gemacht seit 2019',
    paragraphes: [
      'Busmoov ist eine Marke der französischen Navelys-Gruppe und wurde 2019 gegründet, um die Buchung eines Gruppenbusses zu vereinfachen. Statt mehrere Busunternehmen anzurufen, beschreiben Sie Ihre Fahrt ein einziges Mal: Wir fragen unser Netz von über 180 geprüften Busunternehmen an, und Sie erhalten innerhalb von 24 Stunden bis zu drei Angebote. Unser Team begleitet Ihre Buchung bis zur Abfahrt, 6 Tage die Woche, und bezahlt wird online. Wir sind in ganz Frankreich im Einsatz, von Paris bis in die Regionen, zum Beispiel für eine [Busreise zu den Loire-Schlössern](/autocar-chateaux-de-la-loire).',
    ],
  },
]

const homeEs: SectionHome[] = [
  {
    h2: 'Autobús, minibús o autocar: ¿qué vehículo para su grupo?',
    paragraphes: [
      'La elección del vehículo depende ante todo del número de pasajeros. Hasta 20 personas, basta un minibús para un traslado, una visita por la ciudad o un pequeño seminario: consulte nuestro [alquiler de minibús con conductor](/services/location-minibus). De 21 a 59 personas, el autocar estándar es la opción más solicitada para las excursiones de un día. Por encima, un autocar de gran capacidad lleva hasta 90 pasajeros sin dividir al grupo. En un trayecto largo, el maletero, el aseo a bordo y el número de conductores cuentan tanto como las plazas. El conductor profesional siempre está incluido: conduce, se encarga del aparcamiento y respeta los tiempos de descanso obligatorios.',
    ],
  },
  {
    h2: 'Colegios, asociaciones, empresas: ¿quién reserva un autocar con Busmoov?',
    paragraphes: [
      'Entre nuestros clientes hay colegios e institutos, empresas, clubes deportivos, asociaciones, agencias de viajes y particulares que organizan una boda. Para una clase, el [alquiler de autocar para excursiones escolares](/services/sorties-scolaires) sigue normas precisas: cinturón obligatorio, ratio de acompañantes y documentación para los viajes al extranjero. Las empresas reservan sobre todo lanzaderas para seminarios y traslados de invitados; los clubes, desplazamientos a partidos el fin de semana. Cada presupuesto tiene en cuenta los horarios, la espera en el lugar y la duración de la jornada del conductor.',
    ],
  },
  {
    h2: 'Traslados al aeropuerto, a la estación y a eventos',
    paragraphes: [
      'Un grupo que aterriza en París-Charles de Gaulle, Orly o Lyon-Saint-Exupéry no tiene por qué repartirse en varios taxis. Con un [traslado al aeropuerto en autocar](/services/transfert-aeroport), el conductor sigue la hora de llegada del vuelo, espera en caso de retraso y lleva a todos directamente al hotel o al lugar del evento. Lo mismo vale para las estaciones de TGV, las ferias, bodas y conciertos. Si los invitados llegan a horas distintas, el autocar hace varias rotaciones a lo largo del día en lugar de un solo trayecto. Indique sus horarios en la solicitud de presupuesto.',
    ],
  },
  {
    h2: '¿Cuánto cuesta alquilar un autocar con conductor en Francia?',
    paragraphes: [
      'Nuestros precios de salida 2026 para trayectos en Francia, con IVA, conductor, combustible y peajes incluidos, para un minibús y para un autocar:',
      'El precio final depende de la fecha, la distancia, la espera en el lugar y la región: un sábado de junio cuesta más que un martes de febrero. En nuestra página sobre [tipos de autocar y equipamiento](/services/location-autocar) encontrará el modelo adecuado.',
    ],
    liste: [
      'Traslado simple (estación, aeropuerto): desde 350 € en minibús, 400 € en autocar',
      'Excursión local de un día, ida y vuelta: desde 600 € y 700 €',
      'Excursión regional de un día, ida y vuelta: desde 900 € y 1.000 €',
      'Fin de semana de dos días: desde 1.600 € y 1.800 €',
    ],
  },
  {
    h2: 'Busmoov: reservar un autocar, más fácil desde 2019',
    paragraphes: [
      'Busmoov es una marca del grupo francés Navelys, creada en 2019 para simplificar la reserva de un autocar para grupos. En lugar de llamar a varios transportistas, describe su trayecto una sola vez: consultamos nuestra red de más de 180 transportistas verificados y recibe hasta tres presupuestos en 24 horas. Nuestro equipo sigue la reserva hasta la salida, 6 días a la semana, y el pago se hace en línea. Cubrimos toda Francia, de París a las regiones, por ejemplo con un [viaje en autocar a los castillos del Loira](/autocar-chateaux-de-la-loire).',
    ],
  },
]

export const homeSeo: Record<SeoLanguage, SectionHome[]> = { fr: homeFr, en: homeEn, de: homeDe, es: homeEs }
