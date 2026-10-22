/**
 * Blocs SEO de la home française (sous « Comment ça marche ? »). Une seule
 * source pour le rendu React (SectionsHomeFr) et le prérendu statique.
 * La liste éventuelle s'affiche après le premier paragraphe.
 */
export interface SectionHome {
  h2: string
  paragraphes: string[]
  liste?: string[]
}

export const homeFr: SectionHome[] = [
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
