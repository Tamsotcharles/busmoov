/**
 * Page « location d'autocar à Paris » en anglais, allemand et espagnol. La
 * version française reste la page ville /fr/location-autocar/paris
 * (src/lib/villes.ts) ; les quatre sont reliées par hreflang via la clé SEO
 * « ville-paris ».
 *
 * Cible : groupes étrangers qui visitent Paris (réponse de Charles, octobre
 * 2026). Chaque langue part de ses points d'arrivée : Eurostar et ferries
 * pour EN, ICE/TGV vers Gare de l'Est pour DE, avion et TGV depuis Barcelone
 * pour ES.
 *
 * Liens : [ancre](/chemin) avec le chemin interne FRANÇAIS, traduit au rendu.
 * Prix : grille nationale « à partir de » (le 75 n'est pas majoré).
 * Faits : ceux de la page Paris FR (Pass Autocar, Crit'Air, zones de dépose
 * des gares), temps de conduite UE (règlement 561/2006 : 9 h par jour,
 * 10 h deux fois par semaine), durées OSRM + 15 %.
 */
import type { DestinationContenu } from './chateaux-loire'

export const parisIntl: Record<'en' | 'de' | 'es', DestinationContenu> = {
  en: {
    h1: 'Coach hire with driver in Paris',
    image: { src: '/images/location-autocar-paris-busmoov.jpg', alt: 'Busmoov coach with driver by the Seine, with the Eiffel Tower in Paris', width: 1000, height: 656 },
    intro: 'Hiring a coach with a driver is the simplest way to move a group around Paris: airport and station transfers, a full-day city tour, or day trips to Versailles, Disneyland or the Champagne region. A transfer from the airport to central Paris starts from €400 including VAT in a standard coach, and a full day at your disposal from €700. Busmoov compares quotes from verified Paris-region operators, from 8-seat minibuses to 59-seat coaches, driver always included.',
    prix: {
      h2: 'Coach hire prices in Paris',
      intro: 'Starting prices for the trips groups book most often from Paris. Driver, fuel and tolls are always included.',
      tableau: {
        caption: '2026 starting prices from Paris, including VAT, driver, fuel and tolls',
        headers: ['Trip', 'Time by coach', 'Minibus, 8 to 20 seats', 'Coach, 21 to 59 seats'],
        rows: [
          ['Charles de Gaulle or Orly airport ↔ central Paris, one way', '30 min to 1 h', 'from €350', 'from €400'],
          ['Full day at your disposal in Paris', 'in the city', 'from €600', 'from €700'],
          ['Versailles, return day trip', '45 min', 'from €600', 'from €700'],
          ['Disneyland Paris, return day trip', '45 min', 'from €600', 'from €700'],
          ['Reims and Champagne, return day trip', '2 h', 'from €900', 'from €1,000'],
          ['Loire Valley castles (Chambord), return day trip', '2 h 30', 'from €900', 'from €1,000'],
        ],
      },
      note: "Starting prices including VAT (10% on passenger transport in France), October 2026. The exact price depends on the date, timings and group size; parking, and the driver's accommodation and meals on multi-day trips, are extra. Coach times exclude breaks and traffic.",
    },
    sections: [
      {
        h2: 'Arriving in Paris with a group: Eurostar, airports and ferries',
        paragraphes: [
          'Most groups from the UK and Ireland reach Paris by Eurostar, which arrives at Gare du Nord, or fly into Charles de Gaulle, Orly or Beauvais. A coach waiting at the station or the terminal saves the group from splitting into taxis or taking the metro with luggage. Typical coach times to central Paris:',
          'The driver tracks your flight or train, waits if it is delayed and meets the group at the coach drop-off zone. Our [airport transfer service](/services/transfert-aeroport) explains how pick-ups work at each terminal.',
        ],
        liste: [
          'Charles de Gaulle airport: 45 minutes to 1 hour outside rush hour',
          'Orly airport: about 30 minutes',
          'Beauvais airport (low-cost flights): about 1 hour 30',
          'Calais ferry port, for groups crossing from Dover: about 3 hours 30',
        ],
      },
      {
        h2: 'Getting around Paris by coach: drop-offs and parking',
        paragraphes: [
          "In Paris, the challenge isn't the drive, it's boarding. The main stations (Gare du Nord, Gare de Lyon, Montparnasse) have coach drop-off zones, but stops are short: the group should be ready before the coach pulls in. For an early departure, a wide, open meeting point such as a square or a boulevard service road works better than a narrow street; your driver suggests a precise spot once the booking is confirmed.",
          "The City of Paris requires a coach parking pass (Pass Autocar) for tourist parking, and the low-emission zone requires a Crit'Air sticker. That's the operator's job, not yours: our partners' coaches drive in Paris all year round, and quotes include these constraints.",
        ],
      },
      {
        h2: 'Day trips from Paris by coach',
        paragraphes: [
          'The excursions groups book most often from Paris, with the time by coach:',
          'For the Loire, our page on [coach trips to the Loire Valley castles](/autocar-chateaux-de-la-loire) details itineraries and coach parking at the castles. The Mont-Saint-Michel, 5 h 15 away, is too far for a return day trip with one driver: EU rules cap daily driving at 9 hours, extendable to 10 twice a week, so plan two drivers or an overnight stop.',
        ],
        liste: [
          "Versailles (45 min): the palace and gardens, with coach drop-off at the Place d'Armes",
          'Disneyland Paris (45 min): direct drop-off at the parks, the coach waits on site',
          "Giverny (1 h 15): Monet's house and gardens, open from spring to autumn",
          'Fontainebleau (1 h 15): the château and its forest',
          'Reims (2 h): Champagne cellar tours, where a coach makes sense as tastings are on the programme',
          'Chambord and the Loire Valley (2 h 30): a long day with two visits',
        ],
      },
      {
        h2: 'Which vehicle for your group in Paris?',
        paragraphes: [
          'Up to 20 people, a [minibus with driver](/services/location-minibus) is easier to park and to stop in central Paris. From 21 to 59 people, the standard coach is the usual choice, with a luggage hold for airport transfers: a group of 50 with suitcases fills a coach and its hold. Above 59 passengers, we offer high-capacity coaches of up to 90 seats, including double-deckers, or two coordinated vehicles. Teachers will find the rules on seat belts and supervision on our page on [coach hire for school trips](/services/sorties-scolaires).',
        ],
      },
    ],
    faq: {
      h2: 'Coach hire in Paris: your questions',
      questions: [
        {
          q: 'How much does it cost to hire a coach with driver in Paris?',
          a: "A full day in a standard coach (up to 59 seats) starts from €700 including VAT, and a one-way airport transfer from €400. The price depends on the distance, the driver's working hours and the size of the vehicle. Request a free quote: you receive up to three offers within 24 hours.",
        },
        {
          q: 'Can the coach meet us at Gare du Nord when the Eurostar arrives?',
          a: 'Yes. Give your train number and arrival time in your request: the driver waits at a coach stop near the station and adjusts if the train is late. Have the group ready to board quickly, as stops are short.',
        },
        {
          q: 'Can we visit the Mont-Saint-Michel in a day from Paris?',
          a: 'Only with two drivers: the round trip takes over 10 hours of driving, more than one driver may do in a day under EU rules. Most groups stay overnight in Normandy or Brittany, which also leaves time for the visit.',
        },
        {
          q: 'Do we need to deal with Paris coach regulations ourselves?',
          a: "No. Our Paris-region partner operators handle the coach parking pass, the Crit'Air sticker for the low-emission zone and the authorised drop-off zones. You have nothing to arrange.",
        },
      ],
    },
    devis: {
      h2: 'Your coach quote for Paris within 24 hours',
      texte: 'Describe your trip in the form: pick-up points, dates, timings and group size. You receive up to three quotes from verified operators within 24 hours, free and with no obligation.',
    },
    ui: { cta: 'Get a free quote' },
  },
  de: {
    h1: 'Reisebus mit Fahrer in Paris mieten',
    image: { src: '/images/location-autocar-paris-busmoov.jpg', alt: 'Busmoov-Reisebus mit Fahrer an der Seine vor dem Eiffelturm in Paris', width: 1000, height: 656 },
    intro: 'Mit einem Reisebus samt Fahrer bewegt sich eine Gruppe in Paris am einfachsten: Transfer vom Flughafen oder Bahnhof, Stadtrundfahrt oder Tagesausflug nach Versailles, ins Disneyland oder in die Champagne. Ein Transfer vom Flughafen in die Pariser Innenstadt kostet ab 400 € inklusive MwSt. im Standardreisebus, ein ganzer Tag zur Verfügung ab 700 €. Busmoov vergleicht Angebote geprüfter Busunternehmen aus der Region Paris, vom Minibus mit 8 Plätzen bis zum Reisebus mit 59 Plätzen, Fahrer immer inklusive.',
    prix: {
      h2: 'Preise für einen Reisebus mit Fahrer in Paris',
      intro: 'Startpreise für die Fahrten, die Gruppen ab Paris am häufigsten buchen. Fahrer, Kraftstoff und Maut sind immer enthalten.',
      tableau: {
        caption: 'Startpreise 2026 ab Paris, inklusive MwSt., Fahrer, Kraftstoff und Maut',
        headers: ['Fahrt', 'Fahrzeit im Bus', 'Minibus, 8 bis 20 Plätze', 'Reisebus, 21 bis 59 Plätze'],
        rows: [
          ['Flughafen Charles de Gaulle oder Orly ↔ Pariser Innenstadt, einfach', '30 Min. bis 1 Std.', 'ab 350 €', 'ab 400 €'],
          ['Ganzer Tag zur Verfügung in Paris', 'in der Stadt', 'ab 600 €', 'ab 700 €'],
          ['Versailles, Tagesausflug hin und zurück', '45 Min.', 'ab 600 €', 'ab 700 €'],
          ['Disneyland Paris, Tagesausflug hin und zurück', '45 Min.', 'ab 600 €', 'ab 700 €'],
          ['Reims und die Champagne, Tagesausflug hin und zurück', '2 Std.', 'ab 900 €', 'ab 1.000 €'],
          ['Loire-Schlösser (Chambord), Tagesausflug hin und zurück', '2 Std. 30', 'ab 900 €', 'ab 1.000 €'],
        ],
      },
      note: 'Startpreise inklusive MwSt. (10 % auf Personenbeförderung in Frankreich), Oktober 2026. Der genaue Preis hängt von Datum, Uhrzeiten und Gruppengröße ab; Parkgebühren sowie Unterkunft und Verpflegung des Fahrers bei mehrtägigen Reisen kommen hinzu. Fahrzeiten ohne Pausen und Verkehr.',
    },
    sections: [
      {
        h2: 'Mit der Gruppe in Paris ankommen: Bahn und Flughafen',
        paragraphes: [
          "Gruppen aus Deutschland reisen oft mit dem ICE oder TGV an, direkt aus Frankfurt, Stuttgart oder München, und kommen am Gare de l'Est an. Andere fliegen nach Charles de Gaulle, Orly oder Beauvais. Ein Bus, der am Bahnhof oder am Terminal wartet, erspart der Gruppe Taxis und die Metro mit Gepäck. Typische Fahrzeiten im Bus bis in die Innenstadt:",
          'Der Fahrer verfolgt Ihren Flug oder Zug, wartet bei Verspätung und empfängt die Gruppe an der Haltezone für Reisebusse. Wie die Abholung an den einzelnen Terminals funktioniert, erklärt unsere Seite zum [Flughafentransfer](/services/transfert-aeroport).',
        ],
        liste: [
          'Flughafen Charles de Gaulle: 45 Minuten bis 1 Stunde außerhalb der Stoßzeiten',
          'Flughafen Orly: etwa 30 Minuten',
          'Flughafen Beauvais (Billigflüge): etwa 1 Stunde 30',
        ],
      },
      {
        h2: 'Mit dem Bus durch Paris: Ein- und Ausstieg, Parken',
        paragraphes: [
          'In Paris ist nicht die Fahrt das Problem, sondern das Einsteigen. Die großen Bahnhöfe (Gare du Nord, Gare de Lyon, Montparnasse) haben Haltezonen für Reisebusse, aber die Haltezeit ist kurz: Die Gruppe sollte bereitstehen, bevor der Bus vorfährt. Für eine frühe Abfahrt eignet sich ein weiter, freier Treffpunkt, etwa ein Platz oder die Nebenfahrbahn eines Boulevards, besser als eine enge Straße; der Fahrer nennt Ihnen nach der Buchung einen genauen Treffpunkt.',
          "Die Stadt Paris verlangt für das touristische Parken einen Bus-Parkausweis (Pass Autocar), und die Umweltzone schreibt eine Crit'Air-Plakette vor, das französische Gegenstück zur Umweltplakette. Darum kümmert sich das Busunternehmen: Die Busse unserer Partner fahren das ganze Jahr in Paris, und die Angebote berücksichtigen diese Vorgaben.",
        ],
      },
      {
        h2: 'Tagesausflüge ab Paris mit dem Bus',
        paragraphes: [
          'Die Ausflüge, die Gruppen ab Paris am häufigsten buchen, mit der Fahrzeit im Bus:',
          'Routen und Busparkplätze an den Schlössern beschreibt unsere Seite zur [Busreise zu den Loire-Schlössern](/autocar-chateaux-de-la-loire). Der Mont-Saint-Michel liegt 5 Std. 15 entfernt und ist mit einem Fahrer nicht an einem Tag hin und zurück machbar: Die EU-Lenkzeiten erlauben 9 Stunden pro Tag, zweimal pro Woche 10. Planen Sie zwei Fahrer oder eine Übernachtung ein.',
        ],
        liste: [
          "Versailles (45 Min.): Schloss und Gärten, Ausstieg an der Place d'Armes",
          'Disneyland Paris (45 Min.): Ausstieg direkt an den Parks, der Bus wartet vor Ort',
          'Giverny (1 Std. 15): Haus und Garten von Claude Monet, von Frühjahr bis Herbst geöffnet',
          'Fontainebleau (1 Std. 15): Schloss und Wald',
          'Reims (2 Std.): Champagnerkeller; bei einer Verkostung ist der Bus die naheliegende Lösung',
          'Chambord und das Loiretal (2 Std. 30): ein langer Tag mit zwei Besichtigungen',
        ],
      },
      {
        h2: 'Welches Fahrzeug für Ihre Gruppe in Paris?',
        paragraphes: [
          'Bis 20 Personen ist ein [Minibus mit Fahrer](/services/location-minibus) in der Pariser Innenstadt leichter zu parken und anzuhalten. Von 21 bis 59 Personen ist der Standardreisebus die übliche Wahl, mit Gepäckraum für Flughafentransfers: Eine Gruppe von 50 Personen mit Koffern füllt einen Bus samt Gepäckraum. Ab 60 Fahrgästen bieten wir Großraumbusse mit bis zu 90 Plätzen, auch Doppeldecker, oder zwei abgestimmte Fahrzeuge an. Für eine Klassenfahrt nach Paris finden Lehrkräfte die Regeln zu Gurten und Betreuung auf unserer Seite zum [Schülertransport](/services/sorties-scolaires).',
        ],
      },
    ],
    faq: {
      h2: 'Reisebus in Paris: Ihre Fragen',
      questions: [
        {
          q: 'Was kostet ein Reisebus mit Fahrer in Paris?',
          a: 'Ein ganzer Tag im Standardreisebus (bis 59 Plätze) kostet ab 700 € inklusive MwSt., ein einfacher Flughafentransfer ab 400 €. Der Preis hängt von der Strecke, der Arbeitszeit des Fahrers und der Fahrzeuggröße ab. Fordern Sie ein kostenloses Angebot an: Sie erhalten innerhalb von 24 Stunden bis zu drei Angebote.',
        },
        {
          q: "Kann uns der Bus am Gare de l'Est abholen, wenn der ICE ankommt?",
          a: 'Ja. Geben Sie Zugnummer und Ankunftszeit in Ihrer Anfrage an: Der Fahrer wartet an einer Haltestelle für Reisebusse in Bahnhofsnähe und passt sich bei Verspätung an. Die Gruppe sollte schnell einsteigen können, da die Haltezeit kurz ist.',
        },
        {
          q: 'Kann man den Mont-Saint-Michel an einem Tag ab Paris besuchen?',
          a: 'Nur mit zwei Fahrern: Hin- und Rückfahrt dauern über 10 Stunden reine Fahrzeit, mehr als ein Fahrer nach den EU-Regeln an einem Tag fahren darf. Die meisten Gruppen übernachten in der Normandie oder der Bretagne, was auch mehr Zeit für die Besichtigung lässt.',
        },
        {
          q: 'Müssen wir uns um die Pariser Vorschriften für Reisebusse kümmern?',
          a: "Nein. Unsere Partner aus der Region Paris kümmern sich um den Bus-Parkausweis, die Crit'Air-Plakette für die Umweltzone und die zugelassenen Haltezonen. Sie müssen nichts organisieren.",
        },
      ],
    },
    devis: {
      h2: 'Ihr Angebot für einen Reisebus in Paris in 24 Stunden',
      texte: 'Beschreiben Sie Ihre Fahrt im Formular: Abholorte, Daten, Uhrzeiten und Gruppengröße. Sie erhalten innerhalb von 24 Stunden bis zu drei Angebote geprüfter Busunternehmen, kostenlos und unverbindlich.',
    },
    ui: { cta: 'Kostenloses Angebot anfordern' },
  },
  es: {
    h1: 'Alquiler de autocar con conductor en París',
    image: { src: '/images/location-autocar-paris-busmoov.jpg', alt: 'Autocar Busmoov con conductor junto al Sena y la torre Eiffel en París', width: 1000, height: 656 },
    intro: 'Un autocar con conductor es la forma más sencilla de mover a un grupo por París: traslados desde el aeropuerto o la estación, visita panorámica de la ciudad o excursiones a Versalles, Disneyland o la Champaña. Un traslado del aeropuerto al centro de París cuesta desde 400 € IVA incluido en autocar estándar, y un día completo a disposición desde 700 €. Busmoov compara presupuestos de transportistas verificados de la región de París, del minibús de 8 plazas al autocar de 59, conductor siempre incluido.',
    prix: {
      h2: 'Precios de alquiler de autocar con conductor en París',
      intro: 'Precios desde para los trayectos que más reservan los grupos en París. El conductor, el combustible y los peajes siempre están incluidos.',
      tableau: {
        caption: 'Precios desde 2026 con salida de París, IVA, conductor, combustible y peajes incluidos',
        headers: ['Trayecto', 'Tiempo en autocar', 'Minibús, de 8 a 20 plazas', 'Autocar, de 21 a 59 plazas'],
        rows: [
          ['Aeropuerto Charles de Gaulle u Orly ↔ centro de París, solo ida', '30 min a 1 h', 'desde 350 €', 'desde 400 €'],
          ['Día completo a disposición en París', 'en la ciudad', 'desde 600 €', 'desde 700 €'],
          ['Versalles, excursión de un día ida y vuelta', '45 min', 'desde 600 €', 'desde 700 €'],
          ['Disneyland París, excursión de un día ida y vuelta', '45 min', 'desde 600 €', 'desde 700 €'],
          ['Reims y la Champaña, excursión de un día ida y vuelta', '2 h', 'desde 900 €', 'desde 1.000 €'],
          ['Castillos del Loira (Chambord), excursión de un día ida y vuelta', '2 h 30', 'desde 900 €', 'desde 1.000 €'],
        ],
      },
      note: 'Precios desde con IVA (10 % sobre el transporte de viajeros en Francia), octubre de 2026. El precio exacto depende de la fecha, los horarios y el tamaño del grupo; el aparcamiento, y el alojamiento y las comidas del conductor en viajes de varios días, se cobran aparte. Tiempos en autocar sin pausas ni tráfico.',
    },
    sections: [
      {
        h2: 'Llegar a París en grupo: avión y tren',
        paragraphes: [
          'La mayoría de los grupos españoles llegan a París en avión, a Orly, Charles de Gaulle o Beauvais, o en el TGV directo desde Barcelona, que llega a la estación de Gare de Lyon. Un autocar que espera en la terminal o en la estación evita repartir al grupo en taxis o en el metro con el equipaje. Tiempos habituales en autocar hasta el centro:',
          'El conductor sigue su vuelo o su tren, espera en caso de retraso y recibe al grupo en la zona de autocares. Nuestra página de [traslado al aeropuerto](/services/transfert-aeroport) explica cómo funciona la recogida en cada terminal.',
        ],
        liste: [
          'Aeropuerto de Orly: unos 30 minutos',
          'Aeropuerto Charles de Gaulle: de 45 minutos a 1 hora fuera de las horas punta',
          'Aeropuerto de Beauvais (vuelos low cost): aproximadamente 1 hora 30',
        ],
      },
      {
        h2: 'Moverse por París en autocar: subidas, bajadas y aparcamiento',
        paragraphes: [
          'En París, lo difícil no es el trayecto sino la subida al autocar. Las grandes estaciones (Gare de Lyon, Gare du Nord, Montparnasse) tienen zonas para autocares, pero la parada es breve: el grupo debe estar listo antes de que llegue el vehículo. Para una salida temprana conviene un punto de encuentro amplio y despejado, como una plaza o el lateral de un bulevar, mejor que una calle estrecha; el conductor le propone un punto preciso tras la confirmación.',
          "El Ayuntamiento de París exige un pase de estacionamiento para autocares turísticos (Pass Autocar), y la zona de bajas emisiones exige la etiqueta Crit'Air, el equivalente francés de la etiqueta ambiental de la DGT. De eso se ocupa el transportista: los autocares de nuestros socios circulan por París todo el año y los presupuestos incluyen estas obligaciones.",
        ],
      },
      {
        h2: 'Excursiones de un día desde París en autocar',
        paragraphes: [
          'Las excursiones que más reservan los grupos desde París, con el tiempo en autocar:',
          'Para el Loira, nuestra página de [viaje en autocar a los castillos del Loira](/autocar-chateaux-de-la-loire) detalla itinerarios y aparcamiento en los castillos. El Mont-Saint-Michel, a 5 h 15, queda demasiado lejos para ir y volver en el día con un solo conductor: la normativa europea limita la conducción a 9 horas diarias, 10 dos veces por semana. Prevea dos conductores o una noche en ruta.',
        ],
        liste: [
          "Versalles (45 min): el palacio y los jardines, con bajada en la Place d'Armes",
          'Disneyland París (45 min): bajada directa en los parques, el autocar espera en el lugar',
          'Giverny (1 h 15): la casa y los jardines de Monet, abiertos de primavera a otoño',
          'Fontainebleau (1 h 15): el castillo y su bosque',
          'Reims (2 h): visita de bodegas de champán, donde el autocar se impone si hay degustación',
          'Chambord y el valle del Loira (2 h 30): un día largo con dos visitas',
        ],
      },
      {
        h2: '¿Qué vehículo para su grupo en París?',
        paragraphes: [
          'Hasta 20 personas, un [minibús con conductor](/services/location-minibus) es más fácil de aparcar y de detener en el centro de París. De 21 a 59 personas, el autocar estándar es la opción habitual, con maletero para los traslados al aeropuerto: un grupo de 50 personas con maletas llena un autocar y su bodega. A partir de 60 pasajeros, ofrecemos autocares de gran capacidad de hasta 90 plazas, incluidos de dos pisos, o dos vehículos coordinados. Para un viaje de estudios a París, los profesores encontrarán las normas sobre cinturones y acompañantes en nuestra página de [transporte escolar](/services/sorties-scolaires).',
        ],
      },
    ],
    faq: {
      h2: 'Autocar en París: sus preguntas',
      questions: [
        {
          q: '¿Cuánto cuesta alquilar un autocar con conductor en París?',
          a: 'Un día completo en autocar estándar (hasta 59 plazas) cuesta desde 700 € IVA incluido, y un traslado simple al aeropuerto desde 400 €. El precio depende de la distancia, de la jornada del conductor y del tamaño del vehículo. Pida un presupuesto gratis: recibirá hasta tres ofertas en 24 horas.',
        },
        {
          q: '¿Puede recogernos el autocar en la Gare de Lyon a la llegada del TGV desde Barcelona?',
          a: 'Sí. Indique el número de tren y la hora de llegada en su solicitud: el conductor espera en una parada de autocares cerca de la estación y se adapta si el tren llega con retraso. El grupo debe poder subir rápido, porque la parada es breve.',
        },
        {
          q: '¿Se puede visitar el Mont-Saint-Michel en un día desde París?',
          a: 'Solo con dos conductores: la ida y vuelta supera las 10 horas de conducción, más de lo que un conductor puede hacer en un día según la normativa europea. La mayoría de los grupos duermen en Normandía o Bretaña, lo que además deja más tiempo para la visita.',
        },
        {
          q: '¿Tenemos que ocuparnos de la normativa de autocares de París?',
          a: "No. Nuestros transportistas de la región de París se encargan del pase de estacionamiento, la etiqueta Crit'Air para la zona de bajas emisiones y las zonas de parada autorizadas. Usted no tiene que gestionar nada.",
        },
      ],
    },
    devis: {
      h2: 'Su presupuesto de autocar en París en 24 horas',
      texte: 'Describa su trayecto en el formulario: puntos de recogida, fechas, horarios y número de personas. Recibirá hasta tres presupuestos de transportistas verificados en 24 horas, gratis y sin compromiso.',
    },
    ui: { cta: 'Pedir presupuesto gratis' },
  },
}
