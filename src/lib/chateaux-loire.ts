/**
 * Page « location d'autocar pour les châteaux de la Loire », en 4 langues.
 * Chaque langue a son propre contenu, adapté à sa cible (groupes français ;
 * groupes britanniques via Paris ou les ferries ; groupes allemands en
 * circuit ; voyages scolaires espagnols via Paris), pas une traduction.
 *
 * Liens : [ancre](/chemin) avec le chemin interne FRANÇAIS ; il est traduit
 * dans la langue de la page (translatePath), en React comme au prérendu.
 * Prix : grille de départ « à partir de » du département de départ.
 * Faits sourcés : UNESCO (Val de Loire, 2000), domaine national de Chambord
 * (fréquentation 2025, parking P1), code de la route (R412-1), durées OSRM
 * + 15 %.
 */
import type { ImageSeo, TableauSeo } from './blog'
import type { SeoLanguage } from './seo-data'

export interface SectionChateaux {
  h2: string
  paragraphes: string[]
  /** Liste à puces affichée après le premier paragraphe */
  liste?: string[]
}

export interface ChateauxContenu {
  h1: string
  intro: string
  /** Image affichée juste après l'introduction (fichier dans public/images) */
  image?: ImageSeo
  prix: { h2: string; intro: string; tableau: TableauSeo; note: string }
  sections: SectionChateaux[]
  faq: { h2: string; questions: { q: string; a: string }[] }
  devis: { h2: string; texte: string }
  ui: { cta: string }
}

/** Même structure pour toutes les pages de destination multilingues. */
export type DestinationContenu = ChateauxContenu

export const chateauxLoire: Record<SeoLanguage, ChateauxContenu> = {
  fr: {
    h1: "Location d'autocar pour visiter les châteaux de la Loire",
    intro: "Pour visiter les châteaux de la Loire en groupe, l'autocar avec chauffeur est la solution la plus simple : les châteaux sont dispersés le long du fleuve, souvent loin des gares, et le car enchaîne deux ou trois visites dans la journée. Depuis Blois ou Tours, une journée en autocar démarre à partir de 700 € TTC ; depuis Paris, Chambord se rejoint en 2 h 30. Busmoov compare pour vous les devis de transporteurs vérifiés, du minibus 8 places à l'autocar 59 places, chauffeur toujours inclus.",
    prix: {
      h2: "Prix d'un autocar pour les châteaux de la Loire",
      intro: "Les prix de départ selon la ville de départ et la formule. Notre [guide des prix de location d'autocar](/blog/prix-location-autocar) détaille ce qui fait varier un devis.",
      tableau: {
        caption: 'Prix de départ 2026, TTC, chauffeur, carburant et péages inclus',
        headers: ['Départ et visites', 'Durée', 'Minibus 8 à 20 places', 'Autocar 21 à 59 places'],
        rows: [
          ['Blois vers Chambord et Cheverny, à la journée', '30 min', 'à partir de 600 €', 'à partir de 700 €'],
          ['Tours vers Chenonceau et Amboise, à la journée', '45 min', 'à partir de 700 €', 'à partir de 800 €'],
          ['Orléans vers Chambord, à la journée', '1 h', 'à partir de 700 €', 'à partir de 800 €'],
          ['Paris vers Chambord, à la journée', '2 h 30', 'à partir de 900 €', 'à partir de 1 000 €'],
          ['Paris, circuit de 2 jours (Chambord, Chenonceau, Amboise)', '2 h 30', 'à partir de 1 600 €', 'à partir de 1 800 €'],
        ],
      },
      note: "Prix de départ TTC (TVA transport 10 %), octobre 2026. Le prix exact dépend de la date, des horaires et de l'effectif ; parkings des châteaux, hébergement et repas du chauffeur en sus. Durées en autocar, hors pauses.",
    },
    sections: [
      {
        h2: 'Quels châteaux de la Loire visiter en autocar ?',
        paragraphes: [
          "Le Val de Loire, entre Sully-sur-Loire et Chalonnes, est inscrit au patrimoine mondial de l'UNESCO depuis 2000 sur environ 280 km. Les châteaux les plus faciles à combiner en car :",
        ],
        liste: [
          'Chambord : le plus grand château de la Loire, qui a accueilli près de 1,22 million de visiteurs en 2025, selon le domaine national',
          'Cheverny, à 30 minutes de Blois, avec ses intérieurs meublés',
          'Le château royal de Blois, au cœur de la ville',
          'Chenonceau, construit au-dessus du Cher',
          'Amboise, où se trouve la tombe de Léonard de Vinci, à 30 minutes de Tours',
          'Villandry et ses jardins, à 30 minutes de Tours',
        ],
      },
      {
        h2: 'Le meilleur itinéraire selon votre point de départ',
        paragraphes: [
          'Depuis Blois ou Orléans, Chambord et Cheverny tiennent dans la même journée : moins de 30 minutes de route les séparent. Depuis Tours, on associe plutôt Chenonceau et Amboise, ou Villandry et Azay-le-Rideau.',
          "Depuis Paris, une journée suffit pour Chambord, à 2 h 30 de route. Pour enchaîner Chambord et Chenonceau, distants d'environ 1 h 30, un circuit de deux jours avec une nuit à Blois, Amboise ou Tours évite une journée trop longue pour le groupe et pour le chauffeur. Les groupes qui partent de Paris trouveront nos départs sur la page [location d'autocar avec chauffeur à Paris](/location-autocar/paris), et ceux de Touraine sur la page [location d'autocar à Tours](/location-autocar/tours).",
        ],
      },
      {
        h2: 'Stationner le car aux châteaux',
        paragraphes: [
          "Chaque château a ses règles : à vérifier au moment de réserver les billets. À Chambord, les autocars stationnent sur le parking P1, à 600 mètres du château : 100 € par jour, gratuit pour le chauffeur sur présentation d'une preuve d'achat d'au moins 8 billets d'entrée le jour de la visite, selon le domaine. Prévoyez ce justificatif dans le car.",
        ],
      },
      {
        h2: 'Sortie scolaire aux châteaux de la Loire',
        paragraphes: [
          "Les châteaux de la Loire sont un grand classique des sorties de classe, du CM1 au lycée. Taux d'encadrement, ceinture, schéma de conduite à joindre au dossier : les règles du transport d'élèves sont réunies sur notre page [location de car pour les sorties scolaires](/services/sorties-scolaires). Une classe et ses accompagnateurs tiennent dans un [bus 50 places](/location-bus-50-places).",
        ],
      },
    ],
    faq: {
      h2: "Vos questions sur l'autocar pour les châteaux de la Loire",
      questions: [
        {
          q: 'Comment visiter les châteaux de la Loire sans voiture ?',
          a: 'En groupe, le plus simple est un car avec chauffeur au départ de chez vous, ou depuis la gare de Tours, Blois ou Orléans si le groupe arrive en train : le car fait ensuite le lien entre les châteaux, que les transports publics relient mal.',
        },
        {
          q: 'Où se loger pour visiter plusieurs châteaux ?',
          a: "Blois, Amboise et Tours sont les bases les plus pratiques : chacune place plusieurs châteaux à moins d'une heure de route. Le car peut rester sur place pendant le séjour ; le devis intègre alors la mise à disposition et l'hébergement du chauffeur.",
        },
        {
          q: "Qu'est-ce qui est inclus dans le prix du car ?",
          a: "Le chauffeur, le carburant et les péages. Les billets d'entrée, les parkings des châteaux, ainsi que l'hébergement et les repas du chauffeur sur un circuit de plusieurs jours restent à prévoir à part.",
        },
      ],
    },
    devis: {
      h2: "Votre devis d'autocar pour les châteaux de la Loire en 24h",
      texte: "Indiquez votre ville de départ, les châteaux à visiter, les dates et l'effectif : vous recevez plusieurs devis de transporteurs vérifiés sous 24h, gratuitement et sans engagement.",
    },
    ui: { cta: 'Demander un devis gratuit' },
  },

  en: {
    h1: 'Coach hire to visit the Loire Valley châteaux',
    intro: 'For a group, a coach with driver is the easiest way to see the Loire Valley châteaux: they are spread along the river, poorly served by public transport, and a driver links two or three visits in a day. From Paris, Chambord is 2 h 30 away by coach; from the ferry ports of Caen or Saint-Malo, plan a two-day trip. Busmoov compares quotes from vetted French coach operators, from an 8-seat minibus to a 59-seat coach, driver always included.',
    prix: {
      h2: 'Loire château coach hire prices',
      intro: 'Starting prices by departure point and type of trip, for a coach hired in France.',
      tableau: {
        caption: '2026 starting prices, incl. French VAT, driver, fuel and tolls',
        headers: ['Departure and visits', 'Coach journey', 'Minibus, 8 to 20 seats', 'Coach, 21 to 59 seats'],
        rows: [
          ['Paris to Chambord, day trip', '2 h 30', 'from €900', 'from €1,000'],
          ['Paris, 2-day tour (Chambord, Chenonceau, Amboise)', '2 h 30', 'from €1,600', 'from €1,800'],
          ['Caen ferry port, 2-day Loire tour', '3 h 15', 'from €1,800', 'from €2,000'],
          ['Saint-Malo ferry port, 2-day Loire tour', '4 h', 'from €1,800', 'from €2,000'],
          ['Tours to Chenonceau and Amboise, day trip', '45 min', 'from €700', 'from €800'],
        ],
      },
      note: 'Starting prices in euros, French VAT included (10%), October 2026. The exact price depends on dates, times and group size; château car parks, driver accommodation and meals are extra. Journey times by coach, excluding breaks.',
    },
    sections: [
      {
        h2: 'Which Loire châteaux to visit by coach?',
        paragraphes: [
          'The Loire Valley between Sully-sur-Loire and Chalonnes has been a UNESCO World Heritage Site since 2000, over some 280 km. The châteaux that combine most easily by coach:',
        ],
        liste: [
          'Chambord: the largest of the Loire châteaux, with nearly 1.22 million visitors in 2025 according to the national estate',
          'Cheverny, 30 minutes from Blois, known for its furnished interiors',
          'The royal château of Blois, in the heart of the town',
          'Chenonceau, built across the river Cher',
          'Amboise, where Leonardo da Vinci is buried, 30 minutes from Tours',
          'Villandry and its gardens, 30 minutes from Tours',
        ],
      },
      {
        h2: 'Itineraries for groups coming from the UK',
        paragraphes: [
          'Arriving by Eurostar or by air, most groups start from Paris: Chambord makes a comfortable day trip, while Chambord and Chenonceau, about 1 h 30 apart, are better over two days with a night in Blois, Amboise or Tours. Our [airport transfer service](/services/transfert-aeroport) can collect the group at the airport and continue straight to the Loire.',
          'Arriving by ferry, Caen is about 3 h 15 from Tours by coach and Saint-Malo about 4 h: the coach meets the group off the boat and the first château is visited the next morning. European driving-hours rules limit a driver to 9 hours at the wheel a day, with a 45-minute break after 4 h 30, which is why longer tours are planned in stages.',
        ],
      },
      {
        h2: 'Coach parking at the châteaux',
        paragraphes: [
          'Each château has its own rules, so check when booking tickets. At Chambord, coaches park in car park P1, 600 metres from the château: €100 a day, free for professional drivers on showing proof of purchase of at least 8 entry tickets on the day of the visit, according to the estate. Keep the ticket receipt on the coach.',
        ],
      },
      {
        h2: 'School trips to the Loire Valley',
        paragraphes: [
          'The Loire châteaux are a classic for school groups studying French or history. On French roads, children travel seated and must wear a seat belt wherever one is fitted (French Highway Code, article R412-1). See our [school trip coach hire](/services/sorties-scolaires) page for vehicle sizes and booking tips.',
        ],
      },
    ],
    faq: {
      h2: 'Your questions about coach hire for the Loire châteaux',
      questions: [
        {
          q: 'How can you visit the Loire châteaux without a car?',
          a: 'For a group, the simplest option is a coach with driver, from Paris, a ferry port, or Tours or Blois railway station if the group arrives by train: the coach then links the châteaux, which public transport serves poorly.',
        },
        {
          q: 'Where should a group stay?',
          a: "Blois, Amboise and Tours are the most practical bases: each puts several châteaux within an hour's drive. The coach can stay with the group for the whole tour; the quote then includes the driver's accommodation.",
        },
        {
          q: 'What is included in the coach price?',
          a: "The driver, fuel and tolls. Entry tickets, château car parks, and the driver's accommodation and meals on a multi-day tour are extra.",
        },
      ],
    },
    devis: {
      h2: 'Your Loire château coach quote within 24 hours',
      texte: 'Tell us your departure point, the châteaux you want to visit, your dates and group size: you receive several quotes from vetted [coach hire](/services/location-autocar) operators within 24 hours, free and with no obligation.',
    },
    ui: { cta: 'Get a free quote' },
  },

  de: {
    h1: 'Reisebus mit Fahrer für die Loire-Schlösser mieten',
    intro: 'Für Gruppen ist der Reisebus mit Fahrer die einfachste Art, die Loire-Schlösser zu besichtigen: Sie liegen verstreut entlang des Flusses, sind mit öffentlichen Verkehrsmitteln schlecht erreichbar, und der Bus verbindet zwei bis drei Besichtigungen an einem Tag. Ab Paris erreichen Sie Chambord in 2 Std. 30 Min.; ab Deutschland planen Sie die Anreise in Etappen. Busmoov vergleicht für Sie Angebote geprüfter Busunternehmen, vom Kleinbus mit 8 Plätzen bis zum Reisebus mit 59 Plätzen, immer mit Fahrer.',
    prix: {
      h2: 'Preise für einen Reisebus zu den Loire-Schlössern',
      intro: 'Startpreise je nach Abfahrtsort und Programm, für einen Bus ab Frankreich.',
      tableau: {
        caption: 'Startpreise 2026 inkl. MwSt., Fahrer, Kraftstoff und Maut',
        headers: ['Abfahrt und Besichtigungen', 'Fahrzeit', 'Kleinbus 8 bis 20 Plätze', 'Reisebus 21 bis 59 Plätze'],
        rows: [
          ['Paris nach Chambord, Tagesausflug', '2 Std. 30', 'ab 900 €', 'ab 1.000 €'],
          ['Paris, 2-tägige Rundreise (Chambord, Chenonceau, Amboise)', '2 Std. 30', 'ab 1.600 €', 'ab 1.800 €'],
          ['Blois nach Chambord und Cheverny, Tagesausflug', '30 Min.', 'ab 600 €', 'ab 700 €'],
          ['Tours nach Chenonceau und Amboise, Tagesausflug', '45 Min.', 'ab 700 €', 'ab 800 €'],
          ['Rundreise ab Deutschland (z. B. Frankfurt oder Straßburg)', '8 bis 9 Std.', 'auf Anfrage', 'auf Anfrage'],
        ],
      },
      note: 'Startpreise inkl. MwSt., Oktober 2026. Der genaue Preis hängt von Datum, Uhrzeiten und Gruppengröße ab; Parkgebühren an den Schlössern, Unterkunft und Verpflegung des Fahrers kommen hinzu. Fahrzeiten im Reisebus, ohne Pausen.',
    },
    sections: [
      {
        h2: 'Welche Loire-Schlösser mit dem Bus besichtigen?',
        paragraphes: [
          'Das Loiretal zwischen Sully-sur-Loire und Chalonnes gehört seit 2000 auf rund 280 km zum UNESCO-Welterbe. Diese Schlösser lassen sich mit dem Bus am besten kombinieren:',
        ],
        liste: [
          'Chambord: das größte Loire-Schloss, mit fast 1,22 Millionen Besuchern im Jahr 2025 laut der staatlichen Domäne',
          'Cheverny, 30 Minuten von Blois, bekannt für seine möblierten Innenräume',
          'Das Königsschloss von Blois, mitten in der Stadt',
          'Chenonceau, über den Fluss Cher gebaut',
          'Amboise mit dem Grab von Leonardo da Vinci, 30 Minuten von Tours',
          'Villandry und seine Gärten, 30 Minuten von Tours',
        ],
      },
      {
        h2: 'Anreise aus Deutschland: die Rundreise in Etappen',
        paragraphes: [
          'Von Frankfurt nach Blois sind es rund 750 km, gut 8 Std. 45 Min. Fahrzeit im Reisebus; ab Straßburg knapp 8 Stunden. Die EU-Lenkzeitregeln erlauben einem Fahrer höchstens 9 Stunden am Steuer pro Tag, mit 45 Minuten Pause nach 4 Std. 30: Für die Anreise braucht es daher eine Zwischenübernachtung oder zwei Fahrer.',
          'Ein bewährter Ablauf für 4 Tage: Anreise mit Übernachtung im Raum Blois; am zweiten Tag Chambord und Cheverny; am dritten Tag Chenonceau und Amboise mit Übernachtung in Tours; am vierten Tag Rückreise. Alternativ reist die Gruppe per Bahn oder Flugzeug nach Paris, und unser [Flughafentransfer](/services/transfert-aeroport) bringt sie direkt an die Loire.',
        ],
      },
      {
        h2: 'Parken an den Schlössern',
        paragraphes: [
          'Jedes Schloss hat eigene Regeln, prüfen Sie diese bei der Ticketbuchung. In Chambord parken Reisebusse auf dem Parkplatz P1, 600 Meter vom Schloss entfernt: 100 € pro Tag, für Berufsfahrer kostenlos gegen Vorlage eines Kaufbelegs über mindestens 8 Eintrittskarten am Besuchstag, so die Domäne. Halten Sie den Beleg im Bus bereit.',
        ],
      },
      {
        h2: 'Klassenfahrt an die Loire',
        paragraphes: [
          'Die Loire-Schlösser sind ein Klassiker für Französischkurse und Geschichtsprojekte. Auf französischen Straßen sitzen Kinder während der Fahrt und müssen angeschnallt sein, sobald der Sitz einen Gurt hat (französische Straßenverkehrsordnung, Artikel R412-1). Mehr zu Fahrzeuggrößen und Buchung finden Sie auf unserer Seite [Schülertransport](/services/sorties-scolaires).',
        ],
      },
    ],
    faq: {
      h2: 'Häufige Fragen zum Reisebus an die Loire',
      questions: [
        {
          q: 'Wie besichtigt man die Loire-Schlösser ohne Auto?',
          a: 'Für eine Gruppe am einfachsten mit einem Reisebus mit Fahrer, ab Paris oder ab dem Bahnhof von Tours oder Blois, wenn die Gruppe mit dem Zug anreist: Der Bus verbindet dann die Schlösser, die mit öffentlichen Verkehrsmitteln schlecht erreichbar sind.',
        },
        {
          q: 'Wo übernachtet man am besten?',
          a: 'Blois, Amboise und Tours sind die praktischsten Standorte: Von jedem aus liegen mehrere Schlösser in weniger als einer Stunde Fahrzeit. Der Bus kann die ganze Rundreise über bei der Gruppe bleiben; das Angebot umfasst dann die Unterkunft des Fahrers.',
        },
        {
          q: 'Was ist im Preis enthalten?',
          a: 'Fahrer, Kraftstoff und Maut. Eintrittskarten, Parkgebühren an den Schlössern sowie Unterkunft und Verpflegung des Fahrers bei mehrtägigen Reisen kommen hinzu.',
        },
      ],
    },
    devis: {
      h2: 'Ihr Angebot für die Loire-Schlösser in 24 Stunden',
      texte: 'Nennen Sie uns Abfahrtsort, gewünschte Schlösser, Reisedaten und Gruppengröße: Sie erhalten innerhalb von 24 Stunden mehrere kostenlose und unverbindliche Angebote geprüfter Unternehmen, wenn Sie einen [Reisebus mieten](/services/location-autocar).',
    },
    ui: { cta: 'Kostenloses Angebot anfordern' },
  },

  es: {
    h1: 'Alquiler de autocar para visitar los castillos del Loira',
    intro: 'Para un grupo, el autocar con conductor es la forma más sencilla de visitar los castillos del Loira: están repartidos a lo largo del río, mal comunicados en transporte público, y el autocar enlaza dos o tres visitas en un día. Desde París, Chambord queda a 2 h 30 en autocar, y desde el aeropuerto de Orly a 2 h 15. Busmoov compara presupuestos de transportistas franceses verificados, del minibús de 8 plazas al autocar de 59 plazas, siempre con conductor.',
    prix: {
      h2: 'Precio de un autocar para los castillos del Loira',
      intro: 'Precios de partida según el punto de salida y el programa, para un autocar contratado en Francia.',
      tableau: {
        caption: 'Precios de partida 2026, IVA incluido, con conductor, combustible y peajes',
        headers: ['Salida y visitas', 'Trayecto en autocar', 'Minibús de 8 a 20 plazas', 'Autocar de 21 a 59 plazas'],
        rows: [
          ['París a Chambord, excursión de un día', '2 h 30', 'desde 900 €', 'desde 1 000 €'],
          ['Circuito de 2 días desde París (Chambord, Chenonceau, Amboise)', '2 h 30', 'desde 1 600 €', 'desde 1 800 €'],
          ['Blois a Chambord y Cheverny, excursión de un día', '30 min', 'desde 600 €', 'desde 700 €'],
          ['Tours a Chenonceau y Amboise, excursión de un día', '45 min', 'desde 700 €', 'desde 800 €'],
          ['En autocar desde España (Madrid, Barcelona)', '11 a 13 h', 'bajo presupuesto', 'bajo presupuesto'],
        ],
      },
      note: 'Precios de partida con IVA incluido, octubre de 2026. El precio exacto depende de las fechas, los horarios y el número de personas; aparcamientos de los castillos, alojamiento y comidas del conductor aparte. Duraciones en autocar, sin pausas.',
    },
    sections: [
      {
        h2: '¿Qué castillos del Loira visitar en autocar?',
        paragraphes: [
          'El valle del Loira entre Sully-sur-Loire y Chalonnes es Patrimonio Mundial de la UNESCO desde 2000, a lo largo de unos 280 km. Los castillos que mejor se combinan en autocar:',
        ],
        liste: [
          'Chambord: el mayor castillo del Loira, con casi 1,22 millones de visitantes en 2025 según el dominio nacional',
          'Cheverny, a 30 minutos de Blois, conocido por sus interiores amueblados',
          'El castillo real de Blois, en pleno centro de la ciudad',
          'Chenonceau, construido sobre el río Cher',
          'Amboise, donde está la tumba de Leonardo da Vinci, a 30 minutos de Tours',
          'Villandry y sus jardines, a 30 minutos de Tours',
        ],
      },
      {
        h2: 'Viaje de estudios: París y los castillos del Loira',
        paragraphes: [
          'La mayoría de los grupos llegan a París en avión y combinan unos días en la capital con el Loira. Nuestro [traslado desde el aeropuerto](/services/transfert-aeroport) recoge al grupo en Orly o Charles de Gaulle y puede continuar directamente hacia los castillos: Chambord queda a 2 h 15 de Orly y a 2 h 45 de Charles de Gaulle.',
          'Un programa habitual: Chambord y Cheverny el primer día con noche en Blois, y Chenonceau y Amboise el segundo antes de volver a París. En autocar desde España, el viaje supera las 11 horas de conducción: la normativa europea limita a 9 horas al volante por conductor y día, con una pausa de 45 minutos cada 4 h 30, así que hacen falta dos conductores o una noche en ruta.',
        ],
      },
      {
        h2: 'Aparcar el autocar en los castillos',
        paragraphes: [
          'Cada castillo tiene sus normas, conviene comprobarlas al reservar las entradas. En Chambord, los autocares aparcan en el aparcamiento P1, a 600 metros del castillo: 100 € al día, gratis para conductores profesionales presentando el justificante de compra de al menos 8 entradas el día de la visita, según el dominio. Lleve el justificante en el autocar.',
        ],
      },
      {
        h2: 'Normas en Francia para grupos escolares',
        paragraphes: [
          'En las carreteras francesas, los menores viajan sentados y deben llevar el cinturón siempre que el asiento lo tenga (código de circulación francés, artículo R412-1). Encontrará tamaños de vehículo y consejos de reserva en nuestra página de [transporte escolar](/services/sorties-scolaires).',
        ],
      },
    ],
    faq: {
      h2: 'Preguntas frecuentes sobre el autocar para los castillos del Loira',
      questions: [
        {
          q: '¿Cómo visitar los castillos del Loira sin coche?',
          a: 'Para un grupo, lo más sencillo es un autocar con conductor desde París, desde el aeropuerto o desde la estación de Tours o Blois si el grupo llega en tren: el autocar enlaza después los castillos, que el transporte público comunica mal.',
        },
        {
          q: '¿Dónde alojarse para visitar varios castillos?',
          a: 'Blois, Amboise y Tours son las bases más prácticas: desde cada una, varios castillos quedan a menos de una hora. El autocar puede acompañar al grupo durante todo el circuito; el presupuesto incluye entonces el alojamiento del conductor.',
        },
        {
          q: '¿Qué incluye el precio del autocar?',
          a: 'El conductor, el combustible y los peajes. Las entradas, los aparcamientos de los castillos y el alojamiento y las comidas del conductor en un circuito de varios días van aparte.',
        },
      ],
    },
    devis: {
      h2: 'Su presupuesto de autocar para el Loira en 24 horas',
      texte: 'Indique el punto de salida, los castillos que desea visitar, las fechas y el número de personas: recibirá varios presupuestos gratuitos y sin compromiso de transportistas verificados de [alquiler de autocar](/services/location-autocar) en 24 horas.',
    },
    ui: { cta: 'Pedir presupuesto gratis' },
  },
}
