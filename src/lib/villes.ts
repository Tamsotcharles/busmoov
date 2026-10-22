/**
 * Pages villes SEO — contenu unique par ville (français uniquement,
 * ces pages ciblent les recherches « location autocar <ville> »).
 * URL : /fr/location-autocar/<slug>
 */
import type { TableauSeo } from './blog'

export interface VilleFaq {
  q: string
  a: string
}

export interface VilleDestination {
  nom: string
  desc: string
}

export interface VilleSection {
  h2: string
  paragraphes: string[]
  /** Liste à puces insérée après le premier paragraphe (format enrichi) */
  liste?: string[]
}

interface VilleBase {
  slug: string
  nom: string
  metaTitle: string
  metaDescription: string
  h1: string
  sousTitre: string
  intro: string[]
  /**
   * Ville rattachée à une ville principale (slug) : exclue des blocs de
   * maillage automatiques (pied de page, listes « au départ de votre ville »,
   * « également disponible à », llms.txt). Elle n'est liée que depuis sa ville
   * principale, et reste dans le sitemap.
   */
  rattacheeA?: string
  /** « au Havre » quand « à + nom » ne convient pas (défaut : `à ${nom}`) */
  nomA?: string
  /** « du Havre » quand « de + nom » ne convient pas (défaut : `de ${nom}`) */
  nomDe?: string
  /** Sections éditoriales supplémentaires (calendrier, conseils) — liens markdown acceptés. */
  sections?: VilleSection[]
  faq: VilleFaq[]
}

/** Format historique des pages villes. */
export interface VilleClassique extends VilleBase {
  format?: 'classique'
  /** Section d'ancrage local (points de dépose, logistique propre à la ville). */
  sectionLocale: VilleSection
  /** Titres H2 personnalisés — éviter les intitulés identiques d'une ville à l'autre. */
  h2Destinations: string
  h2Trajets: string
  /**
   * Maillage interne contextuel : paragraphes contenant des liens en
   * syntaxe markdown [ancre exacte](/chemin) — ancres variées, jamais
   * le même libellé d'une ville à l'autre.
   */
  liensUtiles: string[]
  destinations: VilleDestination[]
  trajets: string[]
  /** Bloc prix de départ propre à la ville (majoration régionale intégrée). */
  prix?: VillePrix
}

export interface VillePrix {
  h2: string
  intro: string
  tableau: TableauSeo
  apres: string
}

export interface VillePrixLigne {
  trajet: string
  duree: string
  formule: string
  minibus: string
  autocar: string
  parPersonne: string
}

export interface VilleTrajetLigne {
  destination: string
  distance: string
  duree: string
  formule: string
  minibus: string
  autocar: string
  parPersonne: string
}

export interface VilleLieu {
  nom: string
  /** Temps de trajet depuis la ville, ou « en ville » */
  trajet: string
  desc: string
}

/**
 * Format enrichi (template « page ville » d'octobre 2026) : prix,
 * réservation, véhicules, minibus, sorties, budgets types, villes proches.
 * Dans tous les textes, les liens s'écrivent [ancre](/chemin) pour une
 * page interne (sans préfixe de langue) ou [ancre](https://…) pour une
 * source externe. Chaque H2 doit porter au moins un fait local vérifiable.
 */
export interface VilleEnrichie extends VilleBase {
  format: 'enrichi'
  prix: {
    h2: string
    intro: string
    /** Tableau détaillé (6 colonnes : durée, formule, minibus, autocar, par personne)… */
    lignes?: VillePrixLigne[]
    /** …ou tableau libre, plus compact (colonnes au choix). */
    tableau?: TableauSeo
    /** Ce qui fait varier le prix */
    variation?: string
    /** Mention sous le tableau : TTC, date, inclusions */
    note: string
  }
  /** Tableau des trajets vers les grandes villes (distance, durée, prix), placé après le H2 Prix */
  grandesVilles?: {
    h2: string
    intro: string
    lignes: VilleTrajetLigne[]
    note: string
  }
  commentLouer?: {
    h2: string
    etapes: string[]
    conseil: string
    /** Ce que le chauffeur prend en charge, ancré dans la ville */
    chauffeur?: string
  }
  vehicules?: VilleSection
  minibus?: VilleSection
  visiter?: { h2: string; intro: string; lieux: VilleLieu[] }
  /** H2 Devis : texte court, exemples de budgets facultatifs */
  budgets: { h2: string; intro: string; exemples?: string[]; note?: string }
  /** Slugs des pages villes voisines ou de la région (bloc de bas de page) */
  proximite: string[]
}

export type Ville = VilleClassique | VilleEnrichie

export const villes: Ville[] = [
  {
    slug: 'paris',
    nom: 'Paris',
    metaTitle: 'Location d\'autocar à Paris avec chauffeur — Devis 24h | Busmoov',
    metaDescription: "Autocar et minibus avec chauffeur à Paris et en Île-de-France : transferts CDG-Orly, événements, excursions. Devis gratuit sous 24h.",
    h1: 'Location d\'autocar avec chauffeur à Paris',
    sousTitre: 'Transferts aéroports, événements d\'entreprise, excursions : des transporteurs franciliens vérifiés, un devis gratuit en 24h.',
    intro: [
      'Paris et l\'Île-de-France concentrent la plus forte demande de transport de groupe en France : congrès à la Porte de Versailles, salons à Villepinte, matchs au Stade de France, séminaires à La Défense. Busmoov travaille avec des transporteurs implantés dans toute la région, ce qui évite les frais d\'approche d\'un car venant de loin.',
      'Du minibus 8 places pour un transfert VIP au double étage 90 places pour un grand événement, nous comparons pour vous plusieurs devis de transporteurs franciliens vérifiés. La circulation et le stationnement parisiens n\'ont pas de secret pour leurs chauffeurs : dépose au plus près, zones cars touristiques, vignettes Crit\'Air en règle.',
    ],
    sectionLocale: {
      h2: "Où monter et descendre en autocar dans Paris ?",
      paragraphes: [
        "Le vrai sujet à Paris n'est pas le trajet, c'est l'embarquement. Les grandes gares (Lyon, Montparnasse, Nord) ont des zones de dépose autocars mais elles sont chronométrées : le groupe doit être rassemblé avant l'arrivée du car. Pour un départ matinal, privilégiez un point large et dégagé — esplanade, parvis, contre-allée d'un grand boulevard — plutôt qu'une rue étroite du centre : nos chauffeurs vous proposent un point de rendez-vous précis dès la confirmation.",
        "Côté réglementation, la Ville de Paris impose le Pass Autocar pour le stationnement touristique et la ZFE exige une vignette Crit'Air en règle. Ce sont les affaires du transporteur, pas les vôtres : les véhicules de nos partenaires franciliens circulent dans Paris toute l'année et le devis intègre ces contraintes.",
      ],
    },
    h2Destinations: "De Versailles à la Champagne : les excursions des groupes parisiens",
    h2Trajets: "Trajets types en Île-de-France",
    destinations: [
      { nom: 'Château de Versailles', desc: 'La sortie de groupe la plus demandée au départ de Paris — 45 minutes de trajet, dépose devant la place d\'Armes.' },
      { nom: 'Disneyland Paris', desc: 'Comités d\'entreprise, anniversaires, séminaires : dépose directe aux parcs, le car vous attend sur place.' },
      { nom: 'Châteaux de la Loire', desc: 'Chambord et Chenonceau à la journée — comptez une amplitude de 12h avec deux visites.' },
      { nom: 'Reims et la Champagne', desc: 'Visite de caves à 1h30 de Paris : le car s\'impose quand la dégustation est au programme.' },
      { nom: 'Deauville et Honfleur', desc: 'L\'escapade normande classique des associations et des CE, à la journée.' },
      { nom: 'Provins et Fontainebleau', desc: 'Sorties scolaires médiévales et château impérial à moins d\'une heure.' },
    ],
    trajets: [
      'Transfert Paris ↔ aéroport Roissy CDG ou Orly pour un groupe (dépose terminal)',
      'Navette gare de Lyon / gare Montparnasse ↔ lieu de séminaire',
      'Circuit soirée : restaurant, croisière sur la Seine, retour hôtel',
      'Paris → Versailles, Disneyland, Vaux-le-Vicomte à la journée',
    ],
    liensUtiles: [
      "Tous nos services parisiens et franciliens en un coup d'œil : la [location de bus à Paris](/location-bus-paris) pour les soirées, tournages et navettes urbaines, les transferts groupes vers [l'aéroport CDG](/navette-aeroport-cdg) et [Orly](/navette-aeroport-orly), l'[autocar pour Disneyland Paris](/autocar-disneyland-paris), la [visite de Versailles en autocar](/location-autocar/versailles), les [événements au Stade de France](/location-autocar/saint-denis) — et la [location d'autocar en Île-de-France](/location-autocar-ile-de-france) pour les départs de petite et grande couronne.",
      "Votre événement se joue hors d'Île-de-France ? Busmoov organise aussi la [location d'autocar à Lille](/location-autocar/lille) pour les groupes du Nord, et les navettes de la semaine de course avec la [location d'autocar au Mans](/location-autocar/le-mans). Avant de valider votre budget, notre guide du [prix de la location d'un autocar](/blog/prix-location-autocar) détaille ce qui fait varier un devis.",
    ],
    sections: [
      {
        h2: 'L\'année des groupes à Paris',
        paragraphes: [
          'Paris ne connaît pas de basse saison, mais des pics. De février à mars, le Salon de l\'agriculture et les salons de la Porte de Versailles font venir des groupes de toute la France ; d\'avril à juin, les voyages scolaires de province convergent vers les musées, Versailles et Disneyland, et Roland-Garros déplace des entreprises par cars entiers. Juin et septembre sont les mois des séminaires et des congrès à Villepinte et au Palais des Congrès.',
          'L\'automne enchaîne les grands salons, la Paris Games Week et les concerts de la Défense Arena et du Stade de France, avec des navettes de soirée depuis toute l\'Île-de-France. Décembre est le mois des arbres de Noël d\'entreprise et des sorties aux vitrines des grands magasins et à Disneyland. Tout au long de l\'année, les matchs du PSG et du Stade Français mobilisent des cars de supporters. Les véhicules franciliens manquent surtout les samedis de mai et de juin et les deux premières semaines de décembre.',
        ],
      },
      {
        h2: 'Transfert aéroport pour un groupe : CDG et Orly depuis Paris',
        paragraphes: [
          'C\'est la demande numéro un à Paris. À Roissy, les cars déposent et reprennent aux zones autocars de chaque terminal, et le chauffeur suit le numéro de vol pour caler l\'attente ; comptez 45 minutes à une heure de route depuis le centre hors pointe, le double un vendredi soir. À Orly, l\'accès est plus court depuis le sud de Paris, avec une zone cars sous les terminaux. Dans les deux cas, précisez le terminal exact et le nombre de bagages : un groupe de 50 personnes avec valises de soute remplit un car standard et sa soute, pas un minibus et demi.',
          'Un transfert aller simple démarre à 400 € TTC en autocar standard, chauffeur et péages inclus, moins en minibus pour un petit groupe. Nos pages [navette aéroport Roissy CDG](/navette-aeroport-cdg) et [navette aéroport Orly](/navette-aeroport-orly) détaillent terminaux et horaires, et notre guide [organiser un transfert aéroport pour un groupe](/blog/transfert-aeroport-groupe-mode-emploi) donne la checklist à envoyer au transporteur. Pour le reste de la région, voir la [location d\'autocar en Île-de-France](/location-autocar-ile-de-france).',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Paris',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Paris : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Paris, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 350 €', 'à partir de 400 €', 'à partir de 500 €'],
          ['Journée locale, aller-retour', 'à partir de 600 €', 'à partir de 700 €', 'à partir de 800 €'],
          ['Journée régionale, aller-retour', 'à partir de 900 €', 'à partir de 1 000 €', 'à partir de 1 200 €'],
          ['Week-end 2 jours', 'à partir de 1 600 €', 'à partir de 1 800 €', 'Sur devis'],
        ],
      },
      apres: 'Le département ne porte pas de majoration régionale : ces prix de départ sont ceux de la grille nationale. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte la location d\'un autocar avec chauffeur à Paris ?',
        a: 'Une journée en autocar standard (jusqu\'à 59 places) démarre à 700 € TTC pour un aller-retour local. Le tarif dépend de la distance, de l\'amplitude horaire et de la taille du véhicule. Un transfert aéroport simple coûte moins cher qu\'une mise à disposition à la journée : demandez un devis gratuit, vous recevez plusieurs propositions sous 24h.',
      },
      {
        q: 'Le chauffeur connaît-il les règles de circulation des cars à Paris ?',
        a: 'Oui. Nos transporteurs partenaires franciliens pratiquent Paris au quotidien : zones de dépose autorisées, parcs de stationnement pour autocars, vignette Crit\'Air et restrictions de la ZFE. Vous n\'avez rien à gérer.',
      },
      {
        q: 'Peut-on organiser un transfert vers Roissy CDG ou Orly très tôt le matin ?',
        a: 'Oui, les départs très matinaux (avant 6h) sont courants pour les vols de groupe. Précisez l\'horaire de décollage dans votre demande : nous calons la prise en charge avec la marge nécessaire, enregistrement compris.',
      },
      {
        q: 'Quel autocar pour un groupe de plus de 60 personnes ?',
        a: 'Au-delà de 59 passagers, nous proposons des autocars grande capacité (60 à 90 places, dont double étage) ou deux véhicules coordonnés — souvent plus économique et plus souple pour les déposes en centre de Paris.',
      },
    ],
  },
  {
    slug: 'lyon',
    format: 'enrichi',
    nom: 'Lyon',
    metaTitle: 'Location autocar et bus à Lyon avec chauffeur | Busmoov',
    metaDescription: 'Autocar et minibus avec chauffeur à Lyon : transferts Saint-Exupéry, salons à Eurexpo, navettes ski. Devis gratuit sous 24h.',
    h1: "Location d'autocar et de bus avec chauffeur à Lyon",
    sousTitre: "Du minibus 8 places à l'autocar 59 places : des autocaristes du Rhône vérifiés et plusieurs devis gratuits sous 24h.",
    intro: [
      "Vous cherchez un bus à Lyon ? Salon à Eurexpo, transfert vers Saint-Exupéry, sortie scolaire ou week-end au ski : Busmoov compare pour vous les devis d'autocaristes du Rhône et de l'Ain, du minibus 8 places à l'autocar 59 places. Décrivez votre trajet ci-dessous, vous recevez plusieurs propositions sous 24h.",
    ],
    prix: {
      h2: "Prix d'une location de bus avec chauffeur à Lyon",
      intro: "Voici les budgets à prévoir pour les trajets les plus demandés au départ de Lyon, du transfert vers l'aéroport à la journée en montagne. Notre [guide des prix de location d'autocar](/blog/prix-location-autocar) détaille tout ce qui entre dans un devis.",
      lignes: [
        { trajet: 'Part-Dieu vers aéroport Saint-Exupéry', duree: '35 min', formule: 'Transfert aller simple', minibus: 'à partir de 350 €', autocar: 'à partir de 400 €', parPersonne: 'environ 8 €' },
        { trajet: 'Journée dans Lyon', duree: 'sur place', formule: 'Mise à disposition locale', minibus: 'à partir de 600 €', autocar: 'à partir de 700 €', parPersonne: 'environ 14 €' },
        { trajet: 'Lyon vers le Beaujolais (Villefranche-sur-Saône)', duree: '45 min', formule: 'Aller-retour à la journée', minibus: 'à partir de 600 €', autocar: 'à partir de 700 €', parPersonne: 'environ 14 €' },
        { trajet: 'Lyon vers Annecy', duree: '2 h', formule: 'Aller-retour à la journée', minibus: 'à partir de 900 €', autocar: 'à partir de 1 000 €', parPersonne: 'environ 20 €' },
        { trajet: 'Lyon vers Val Thorens', duree: '3 h', formule: 'Transfert aller simple', minibus: 'à partir de 900 €', autocar: 'à partir de 1 000 €', parPersonne: 'environ 20 €' },
      ],
      variation: "Trois facteurs font bouger le prix à Lyon. La date d'abord : les samedis de février vers les stations, la Fête des Lumières début décembre et les grands salons d'Eurexpo mobilisent beaucoup de cars. L'amplitude de la journée ensuite, attente sur place comprise. Enfin la distance : au-delà d'environ 9 heures de conduite dans la journée, un second chauffeur devient obligatoire.",
      note: "Prix de départ TTC (TVA transport 10 %), octobre 2026 ; le prix exact dépend de la date, des horaires et de l'effectif. Péages inclus ; parking, hébergement et repas du chauffeur en sus. Prix par personne calculé pour un car de 50 passagers.",
    },
    grandesVilles: {
      h2: "Prix d'un autocar de Lyon vers les grandes villes",
      intro: "Au carrefour de l'A6, de l'A7 et de l'A43, Lyon est à 2 h de Genève en autocar et à moins de 6 h de Paris. Voici les prix de départ pour un aller-retour vers les grandes villes ; au-delà, le prix se calcule sur devis, selon l'itinéraire. Au-delà de 4 h 30 de conduite, comptez en plus la pause réglementaire de 45 minutes du chauffeur.",
      lignes: [
        { destination: 'Lyon vers Saint-Étienne', distance: '65 km', duree: '1 h 15', formule: 'Aller-retour à la journée', minibus: 'à partir de 600 €', autocar: 'à partir de 700 €', parPersonne: 'environ 14 €' },
        { destination: 'Lyon vers Grenoble', distance: '105 km', duree: '1 h 30', formule: 'Aller-retour à la journée', minibus: 'à partir de 900 €', autocar: 'à partir de 1 000 €', parPersonne: 'environ 20 €' },
        { destination: 'Lyon vers Genève', distance: '150 km', duree: '2 h', formule: 'Aller-retour à la journée', minibus: 'à partir de 900 €', autocar: 'à partir de 1 000 €', parPersonne: 'environ 20 €' },
        { destination: 'Lyon vers Montpellier', distance: '305 km', duree: '4 h', formule: 'Aller-retour sur 2 jours', minibus: 'à partir de 1 600 €', autocar: 'à partir de 1 800 €', parPersonne: 'environ 36 €' },
        { destination: 'Lyon vers Marseille', distance: '315 km', duree: '4 h', formule: 'Aller-retour sur 2 jours', minibus: 'à partir de 1 600 €', autocar: 'à partir de 1 800 €', parPersonne: 'environ 36 €' },
        { destination: 'Lyon vers Paris', distance: '470 km', duree: '5 h 45', formule: 'Longue distance', minibus: 'Sur devis', autocar: 'Sur devis', parPersonne: 'sur devis' },
        { destination: 'Lyon vers Toulouse', distance: '540 km', duree: '6 h 30', formule: 'Longue distance', minibus: 'Sur devis', autocar: 'Sur devis', parPersonne: 'sur devis' },
        { destination: 'Lyon vers Bordeaux', distance: '555 km', duree: '7 h', formule: 'Longue distance', minibus: 'Sur devis', autocar: 'Sur devis', parPersonne: 'sur devis' },
      ],
      note: "Prix de départ TTC pour un aller-retour, octobre 2026. Distances routières de centre à centre, durées en autocar hors pauses. Péages inclus ; parking, hébergement et repas du chauffeur en sus.",
    },
    commentLouer: {
      h2: 'Comment louer un autocar avec chauffeur à Lyon ?',
      etapes: [
        'Décrivez votre trajet : départ, destination, dates et nombre de passagers.',
        'Nous consultons des autocaristes vérifiés du Rhône et des départements voisins.',
        'Vous recevez plusieurs devis sous 24h et choisissez le plus adapté.',
        'Vous réservez avec un acompte de 30 %, puis transmettez les horaires et adresses exactes.',
      ],
      conseil: "Point de prise en charge conseillé : les abords des gares Part-Dieu ou Perrache, plutôt que le cœur de la Presqu'île, où un car ne peut pas rester à l'arrêt.",
      chauffeur: "Avec un chauffeur, vous n'avez rien d'autre à gérer que votre groupe. C'est lui qui affronte les bouchons du tunnel de Fourvière, trouve où déposer tout le monde au pied de la basilique, monte les routes enneigées vers les stations et vous ramène du Beaujolais après la dégustation. Professionnel titulaire du permis D, il respecte des temps de conduite et de repos encadrés : votre groupe voyage l'esprit tranquille, et arrive à l'heure.",
    },
    vehicules: {
      h2: 'Minibus, autocar, double étage : quel véhicule à Lyon ?',
      paragraphes: [
        'Le bon véhicule dépend de votre effectif, mais aussi de votre destination dans Lyon :',
        "La contrainte lyonnaise : à Fourvière comme au Vieux-Lyon, les places autocars sont rares, et avec un grand car le chauffeur dépose le groupe puis repart stationner. Pour un petit comité qui enchaîne les visites, la [location de minibus avec chauffeur](/services/location-minibus) évite ce casse-tête.",
      ],
      liste: [
        '8 à 20 personnes : un minibus, le plus simple à garer en centre-ville.',
        '21 à 35 personnes : un midibus ou un autocar 35 places, le format des classes et des clubs sportifs.',
        "36 à 59 personnes : l'autocar standard, celui des [locations de bus 50 places](/location-bus-50-places) pour les comités d'entreprise et les associations.",
        '60 personnes et plus : un autocar à double étage ou deux cars.',
      ],
    },
    minibus: {
      h2: 'Minibus avec chauffeur à Lyon : navettes gare et aéroport',
      paragraphes: [
        "Lyon compte trois gares utiles aux groupes : Part-Dieu, Perrache et la gare TGV de l'aéroport Saint-Exupéry. De Part-Dieu ou de Perrache, comptez environ 35 minutes de route jusqu'à l'aéroport, et une vingtaine de minutes jusqu'à Eurexpo, à Chassieu.",
        "Deux usages reviennent souvent. L'arrivée en TGV à Part-Dieu, puis un transfert direct vers un séminaire à la Cité Internationale (moins de 10 minutes) ou à Eurexpo. Et l'arrivée en avion à Saint-Exupéry, puis la dépose à l'hôtel : notre service de [transfert aéroport](/services/transfert-aeroport) organise aussi le retour.",
      ],
    },
    sections: [
      {
        h2: 'L\'année des groupes à Lyon',
        paragraphes: [
          'Le calendrier lyonnais est rythmé par la montagne et par les grands rendez-vous de la ville. De décembre à mars, les transferts vers les stations depuis Saint-Exupéry, Part-Dieu et les entreprises de la région occupent les transporteurs tous les week-ends ; notre guide [partir au ski en autocar avec un groupe](/blog/autocar-station-de-ski-groupe) en détaille la logistique. Autour du 8 décembre, la Fête des Lumières attire des groupes de toute la France, mais la presqu\'île est fermée aux cars : dépose aux parkings relais et fin de trajet en métro.',
          'Le printemps et l\'été sont ceux des salons à Eurexpo, des Nuits de Fourvière en juin et juillet, de Jazz à Vienne en juillet et des sorties vers Annecy et le Beaujolais. En novembre, le Beaujolais nouveau fait les soirées de comités d\'entreprise dans les caves. Toute la saison, les matchs de l\'OL au Groupama Stadium et du LOU en rugby mobilisent des navettes de supporters, avec dépose aux parkings cars du stade à Décines.',
        ],
      },
      {
        h2: 'Le conseil du chauffeur : Part-Dieu, Saint-Exupéry, Eurexpo',
        paragraphes: [
          'Lyon est une ville où le lieu de dépose fait la différence. À Part-Dieu, les cars prennent les groupes côté Villette, pas côté Vivier-Merle, où l\'arrêt est impossible : donnez le bon côté au groupe. À Saint-Exupéry, la zone autocars se trouve au niveau des arrivées, à quelques minutes des terminaux, et le chauffeur suit le numéro de vol. À Eurexpo, les parkings cars sont vastes mais éloignés des halls : prévoyez dix minutes de marche. Pour un événement dans la presqu\'île ou le Vieux Lyon, la dépose se fait sur les quais, et la zone à faibles émissions impose des véhicules Crit\'Air récents, ce que nos transporteurs garantissent.',
          'Pour une sortie vers Genève ou la Suisse, le transporteur se charge de la vignette et des documents ; pour un festival ou un concert avec retour de nuit, notre guide [aller à un festival en bus](/blog/aller-a-un-festival-en-bus) explique comment gérer l\'amplitude du chauffeur. Lyon est aussi notre base pour Saint-Étienne et Grenoble.',
        ],
      },
    ],
    visiter: {
      h2: 'Lyon et ses alentours en autocar : que voir en groupe ?',
      intro: "Lyon compte 519 127 habitants ([Insee, population de référence 2023](https://www.insee.fr/fr/statistiques/8643952?geo=COM-69123)), et sa basilique de Fourvière accueille à elle seule plus de 2,5 millions de pèlerins et visiteurs par an, selon le [sanctuaire de Fourvière](https://www.fourviere.org/fr/vie-du-site-notre-dame-de-fourviere/notre-dame-de-fourviere/la-basilique/) (consulté en octobre 2026). De quoi remplir une journée de groupe sans quitter la ville, avant de rayonner vers les Alpes, le Beaujolais ou l'Ain.",
      lieux: [
        { nom: 'Fourvière et le Vieux-Lyon', trajet: 'en ville', desc: "Le quartier Renaissance et la colline de Fourvière font partie du site historique de Lyon, inscrit au patrimoine mondial de l'UNESCO en 1998. Les cars stationnent rue Roger Radisson et place Abbé Larue à Fourvière, quai Romain Rolland au Vieux-Lyon : 18 places autocars en tout dans le 5e arrondissement selon l'office de tourisme." },
        { nom: 'Annecy et son lac', trajet: '2 h', desc: "Vieille ville, canaux et croisière sur le lac : un classique des sorties de comités d'entreprise et des [déplacements d'entreprise en autocar](/blog/autocar-deplacement-entreprise). Départ le matin, retour à Lyon en fin d'après-midi." },
        { nom: 'Le Beaujolais', trajet: '45 min', desc: "Dix crus, de Brouilly à Saint-Amour, et des domaines qui reçoivent les groupes pour une dégustation et un repas. Avec le car, personne ne prend le volant au retour." },
        { nom: 'Les stations des Alpes', trajet: '2 h 45 à 3 h', desc: "Pour les 3 Vallées (Val Thorens, Courchevel, Méribel), le car prend l'A43 puis l'A430 vers Albertville et la RN90 jusqu'à Moûtiers. Pour l'Alpe d'Huez, il passe par Grenoble puis la RD1091 dans l'Oisans. Du 1er novembre au 31 mars, les équipements hiver sont obligatoires dans les communes de montagne (loi Montagne)." },
        { nom: 'Pérouges', trajet: '45 min', desc: "Cité médiévale de l'Ain classée parmi les Plus Beaux Villages de France, avec le parc des oiseaux de Villars-les-Dombes tout proche : un duo très demandé pour les [sorties scolaires en autocar](/services/sorties-scolaires)." },
      ],
    },
    faq: [
      {
        q: "Quel est le prix d'un bus de 50 places avec chauffeur à Lyon ?",
        a: "Comptez à partir de 400 € TTC pour un transfert vers Saint-Exupéry, 700 € pour une journée dans Lyon ou le Beaujolais et 1 000 € pour une journée à Annecy, soit dès 8 € par personne sur un car plein. Pour Paris ou plus loin, le prix se calcule sur devis.",
      },
      {
        q: "Combien coûte la location d'un bus avec chauffeur pour 30 personnes à Lyon ?",
        a: "Un autocar 35 places démarre aux mêmes prix qu'un autocar standard : à partir de 700 € TTC pour une sortie dans le Beaujolais et de 1 000 € pour une journée à Annecy. Le prix exact dépend de la date, des horaires et du kilométrage.",
      },
      {
        q: "Quel est le prix moyen d'un minibus avec chauffeur à Lyon ?",
        a: "Pour 8 à 20 personnes, comptez à partir de 350 € TTC pour un transfert vers l'aéroport et de 600 € pour une journée de mise à disposition en ville.",
      },
    ],
    budgets: {
      h2: 'Votre devis de bus avec chauffeur à Lyon en 24h',
      intro: "Chaque [devis autocar en ligne](/devis-autocar) est établi pour votre trajet, vos horaires et votre effectif. Pour vous donner un ordre d'idée, voici trois budgets types au départ de Lyon :",
      exemples: [
        "Comité d'entreprise de 50 personnes, Lyon vers Annecy à la journée, autocar 53 places, juin : à partir de 1 000 € TTC.",
        'Club sportif de 30 personnes, Lyon vers Marseille aller-retour sur 2 jours, autocar 35 places, mars : à partir de 1 800 € TTC, hébergement du chauffeur en sus.',
        'Séminaire de 15 personnes, navettes Part-Dieu vers Eurexpo sur la journée, minibus 20 places, janvier : à partir de 600 € TTC.',
      ],
      note: 'Prix de départ indicatifs, octobre 2026.',
    },
    proximite: ['grenoble', 'saint-etienne', 'annecy'],
  },
  {
    slug: 'marseille',
    nom: 'Marseille',
    metaTitle: 'Location d\'autocar à Marseille avec chauffeur — Devis 24h | Busmoov',
    metaDescription: "Autocar et minibus avec chauffeur à Marseille : transferts croisières et aéroport Marignane, excursions en Provence. Devis gratuit sous 24h.",
    h1: 'Location d\'autocar avec chauffeur à Marseille',
    sousTitre: 'Transferts croisières et aéroport Marignane, excursions en Provence, matchs au Vélodrome : des transporteurs provençaux vérifiés, un devis gratuit en 24h.',
    intro: [
      'Premier port de croisière de France, Marseille voit transiter chaque année des centaines de milliers de passagers qui rejoignent les terminaux du Cap Janet ou de la Major en groupe. Les transferts port ↔ aéroport Marseille-Provence (Marignane) et port ↔ centre-ville sont la spécialité de nos transporteurs locaux, rodés aux horaires d\'embarquement serrés.',
      'Au-delà du port, l\'autocar est le moyen le plus simple d\'emmener un groupe dans l\'arrière-pays : calanques de Cassis, Aix-en-Provence, Avignon ou le Luberon. Séminaires, mariages, clubs de supporters du côté du Vélodrome : nous comparons pour vous plusieurs devis de transporteurs des Bouches-du-Rhône.',
    ],
    sectionLocale: {
      h2: "Croisières : réussir l'embarquement au port de Marseille",
      paragraphes: [
        "Les compagnies demandent une présentation au terminal 3 à 4 heures avant l'appareillage, et les terminaux du Cap Janet ne sont pas au même endroit que ceux du J4/la Major : une erreur de terminal coûte une heure. Nos transporteurs marseillais font ces rotations chaque semaine — donnez le nom du navire et la compagnie, ils connaissent le bon quai.",
        "Pour les groupes qui arrivent en TGV, la dépose se fait à la gare routière attenante à Saint-Charles, puis liaison directe vers le port par le tunnel. Au débarquement, le car attend en zone dédiée : prévoyez 45 minutes entre la sortie de cabine et le départ réel, le temps de récupérer les bagages.",
      ],
    },
    h2Destinations: "Calanques, Provence, Camargue : les sorties des groupes marseillais",
    h2Trajets: "Trajets types à Marseille",
    destinations: [
      { nom: 'Cassis et les Calanques', desc: 'La sortie emblématique au départ de Marseille — dépose au port de Cassis pour embarquer vers les calanques.' },
      { nom: 'Aix-en-Provence', desc: 'À 30 minutes : marchés, Cours Mirabeau et fondation Vasarely pour les groupes culturels.' },
      { nom: 'Avignon et le Palais des Papes', desc: 'La grande journée patrimoine, souvent combinée avec le pont du Gard.' },
      { nom: 'Le Luberon', desc: 'Gordes, Roussillon, Lourmarin : circuits villages perchés pour associations et CE.' },
      { nom: 'La Camargue', desc: 'Saintes-Maries-de-la-Mer et Aigues-Mortes — sortie nature à la journée.' },
      { nom: 'Nice et la Côte d\'Azur', desc: 'Transferts inter-cités pour événements, congrès et festivals de la côte.' },
    ],
    trajets: [
      'Transfert terminal croisières (Cap Janet, la Major) ↔ aéroport Marignane',
      'Navette gare Saint-Charles ↔ hôtel ou lieu de séminaire',
      'Marseille → Cassis, Aix-en-Provence ou Avignon à la journée',
      'Transport de supporters vers l\'Orange Vélodrome',
    ],
    liensUtiles: [
      "Le long de l'arc méditerranéen, nous assurons aussi la [location d'autocar à Montpellier](/location-autocar/montpellier) ; vers le nord, la [location d'autocar avec chauffeur à Lyon](/location-autocar/lyon) prend le relais. Pour un groupe qui atterrit à Marignane, tout est détaillé sur notre page de [transfert aéroport en autocar](/services/transfert-aeroport).",
      "Combien prévoir ? Notre guide [combien coûte un autocar avec chauffeur](/blog/prix-location-autocar) détaille les prix par distance et par taille de véhicule, calanques comprises. Puis décrivez votre trajet dans notre [formulaire de devis autocar](/devis-autocar) : jusqu'à 3 offres de transporteurs provençaux sous 24h.",
    ],
    sections: [
      {
        h2: 'L\'année des groupes à Marseille',
        paragraphes: [
          'À Marseille, la saison des groupes commence avec les croisières : d\'avril à octobre, les transferts entre l\'aéroport de Marignane, la gare Saint-Charles et les terminaux du port occupent les transporteurs chaque jour d\'escale. L\'été, les calanques et Cassis attirent les comités d\'entreprise et les colonies, avec une contrainte : l\'accès aux massifs est réglementé de juin à septembre les jours de risque d\'incendie, et le chauffeur vérifie la carte la veille. Les [journées à la mer](/blog/journee-mer-autocar) des écoles et des centres de loisirs remplissent mai, juin et septembre.',
          'Septembre est le mois de la Foire internationale de Marseille au Parc Chanot, octobre celui de la Fiesta des Suds, décembre celui des pastorales, des crèches et des marchés de Noël de Provence, Aubagne et Aix en tête. Toute la saison, les matchs de l\'OM au Vélodrome mobilisent des cars de supporters de toute la région, et les mariages dans les bastides des Alpilles et du Luberon font les samedis de mai à septembre, voir notre guide [autocar pour un mariage](/blog/location-autocar-mariage).',
        ],
      },
      {
        h2: 'Vélodrome, Vieux-Port, Saint-Charles : où le car dépose à Marseille',
        paragraphes: [
          'Le Vieux-Port est en grande partie piéton : les groupes descendent sur le quai de Rive-Neuve ou cours Jean-Ballard et finissent à pied, à deux minutes. La gare Saint-Charles a une dépose cars en contrebas, square Narvik, plus pratique que le parvis. Au Vélodrome, les cars stationnent sur les parkings autocars du boulevard Michelet, et la dépose se fait avant la fermeture des accès, deux heures avant le coup d\'envoi les soirs de grand match. Le Parc Chanot et le Palais du Pharo ont leurs propres zones cars.',
          'À l\'aéroport de Marignane, la zone autocars se trouve devant les terminaux, à 25 minutes du centre hors pointe, le double un vendredi d\'été sur l\'A7. Pour les calanques, le car ne descend ni à Sormiou ni à Morgiou : il dépose à Cassis, au port ou au parking des Gorguettes, ou à Luminy pour les marcheurs. Pour la Côte d\'Azur et les festivals de l\'été, nous couvrons aussi [Nice](/location-autocar/nice) et [Montpellier](/location-autocar/montpellier).',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Marseille',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Marseille : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Marseille, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 350 €', 'à partir de 400 €', 'à partir de 500 €'],
          ['Journée locale, aller-retour', 'à partir de 600 €', 'à partir de 700 €', 'à partir de 800 €'],
          ['Journée régionale, aller-retour', 'à partir de 900 €', 'à partir de 1 000 €', 'à partir de 1 200 €'],
          ['Week-end 2 jours', 'à partir de 1 600 €', 'à partir de 1 800 €', 'Sur devis'],
        ],
      },
      apres: 'Le département ne porte pas de majoration régionale : ces prix de départ sont ceux de la grille nationale. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte la location d\'un autocar à Marseille ?',
        a: 'Une journée en autocar standard démarre à 700 € TTC pour un aller-retour local ; un transfert port ↔ aéroport pour un groupe est chiffré selon l\'horaire et le nombre de passagers. Vous recevez plusieurs devis gratuits de transporteurs provençaux sous 24h.',
      },
      {
        q: 'Gérez-vous les transferts pour les croisières ?',
        a: 'Oui, c\'est une spécialité marseillaise : prise en charge à l\'aéroport Marseille-Provence ou à la gare Saint-Charles, dépose directement au terminal d\'embarquement (Cap Janet, la Major), en tenant compte des horaires de la compagnie. Le sens inverse au débarquement fonctionne de la même façon.',
      },
      {
        q: 'L\'autocar peut-il descendre jusqu\'au port de Cassis ?',
        a: 'L\'accès au port de Cassis est restreint pour les grands autocars en saison ; nos chauffeurs déposent les groupes au parking relais des Gorguettes, avec navette locale vers le port. Nous vous l\'indiquons clairement au devis — pas de mauvaise surprise le jour J.',
      },
      {
        q: 'Peut-on louer un autocar pour un mariage en Provence ?',
        a: 'Oui, c\'est très demandé de mai à septembre : navettes entre la cérémonie, le domaine et les hôtels, y compris en soirée. Un minibus suffit souvent pour les allers-retours tardifs — nous vous conseillons la bonne formule selon le programme.',
      },
    ],
  },
  {
    slug: 'toulouse',
    nom: 'Toulouse',
    metaTitle: 'Location d\'autocar à Toulouse avec chauffeur — Devis 24h | Busmoov',
    metaDescription: "Autocar et minibus avec chauffeur à Toulouse : transferts Blagnac, Carcassonne, Lourdes, Pyrénées, Andorre. Devis gratuit sous 24h.",
    h1: 'Location d\'autocar avec chauffeur à Toulouse',
    sousTitre: 'Transferts Blagnac, excursions à Carcassonne et dans les Pyrénées, déplacements d\'entreprise : des autocaristes occitans vérifiés, un devis gratuit en 24h.',
    intro: [
      'Capitale européenne de l\'aéronautique, Toulouse génère un flux constant de déplacements professionnels : visites de sites industriels, délégations à accueillir à Blagnac, séminaires au MEETT. Nos autocaristes partenaires de Haute-Garonne connaissent ces circuits par cœur, badges et consignes d\'accès compris.',
      'Côté loisirs, la ville rose est une base de départ idéale : Carcassonne à une heure, Albi et sa cathédrale, les Pyrénées pour le ski ou la randonnée, Andorre pour les sorties shopping, Lourdes pour les pèlerinages en groupe. L\'autocar reste le moyen le plus économique de déplacer 30 à 90 personnes dans la région.',
    ],
    sectionLocale: {
      h2: "Blagnac, MEETT, Airbus : les accès groupes qui fonctionnent",
      paragraphes: [
        "L'aéroport de Blagnac, le MEETT et les sites Airbus se trouvent dans le même quadrant nord-ouest : un transfert combiné (aéroport → visite de site → parc des expositions) tient sans traverser la ville. Le MEETT dispose d'un parking autocars dédié ; pour les visites Airbus et la Cité de l'espace, la dépose se fait aux entrées visiteurs, badges et consignes gérés en amont.",
        "Aux heures de pointe, le périphérique toulousain est saturé dans le sens ouest le matin et l'inverse le soir : les chauffeurs locaux calent les horaires en conséquence. Pour les matchs au Stadium, la dépose des groupes se fait côté île du Ramier, avec retour au point convenu après la rencontre.",
      ],
    },
    h2Destinations: "Carcassonne, Pyrénées, Andorre : les excursions toulousaines",
    h2Trajets: "Trajets types au départ de Toulouse",
    destinations: [
      { nom: 'Carcassonne', desc: 'La cité médiévale à 1h de route — l\'excursion la plus demandée au départ de Toulouse, scolaires en tête.' },
      { nom: 'Albi', desc: 'Cathédrale Sainte-Cécile et musée Toulouse-Lautrec : la journée culturelle classique.' },
      { nom: 'Lourdes', desc: 'Pèlerinages en groupe : nos transporteurs sont habitués aux sanctuaires et à leurs zones de dépose.' },
      { nom: 'Andorre', desc: 'Sorties shopping et ski à la journée — passage de frontière sans formalité pour les résidents européens.' },
      { nom: 'Les Pyrénées', desc: 'Saint-Lary, Ax-les-Thermes, le pic du Midi : navettes ski l\'hiver, randonnée l\'été.' },
      { nom: 'La Cité de l\'Espace et Airbus', desc: 'Visites de sites emblématiques pour scolaires et séminaires — dépose sur les parkings dédiés.' },
    ],
    trajets: [
      'Transfert Toulouse ↔ aéroport de Blagnac pour un groupe',
      'Navette gare Matabiau ↔ MEETT ou site d\'entreprise',
      'Toulouse → Carcassonne, Albi ou Andorre à la journée',
      'Pèlerinage Toulouse → Lourdes (aller-retour ou séjour)',
    ],
    liensUtiles: [
      "Dans le grand Sud-Ouest, Busmoov couvre également la [location d'autocar à Bordeaux](/location-autocar/bordeaux) et, sur l'axe méditerranéen, la [location de car à Montpellier](/location-autocar/montpellier). Les établissements scolaires trouveront les règles d'encadrement dans notre guide de la [sortie scolaire en autocar](/blog/organiser-sortie-scolaire-autocar).",
      "Pour chiffrer une journée vers Carcassonne, Albi ou les Pyrénées, consultez les [prix de location d'un autocar en 2026](/blog/prix-location-autocar) avant de demander votre [devis de bus](/devis-autocar). Le format 50 places, le plus courant pour les groupes toulousains, a sa [page tarifs dédiée](/location-bus-50-places).",
    ],
    sections: [
      {
        h2: 'L\'année des groupes à Toulouse',
        paragraphes: [
          'Toute l\'année, Airbus et la Cité de l\'Espace reçoivent des scolaires et des séminaires venus de toute la France, souvent depuis la gare Matabiau ou l\'aéroport de Blagnac. De décembre à mars, les cars toulousains montent vers les stations des Pyrénées, Saint-Lary, Peyragudes, Ax 3 Domaines, et vers Andorre pour le ski et le shopping ; de mars à octobre, ils descendent vers Lourdes avec les pèlerinages diocésains, voir notre guide [pèlerinage à Lourdes en autocar](/blog/pelerinage-lourdes-en-autocar).',
          'Juin est le mois de Rio Loco sur la Prairie des Filtres et des sorties de fin d\'année vers Carcassonne et la Méditerranée ; septembre celui de Piano aux Jacobins et de la rentrée des congrès au MEETT ; décembre celui du marché de Noël du Capitole. Et de septembre à juin, le Stade Toulousain à Ernest-Wallon et le TFC au Stadium font le plein de navettes de supporters, avec des déplacements à Bordeaux, Montpellier ou Paris pour les grands matchs.',
        ],
      },
      {
        h2: 'Déplacement de supporters et sortie de club : le format toulousain',
        paragraphes: [
          'Un déplacement de supporters ou d\'un club sportif se cale sur l\'heure du match, pas sur l\'horaire du bureau. Vers Bordeaux ou Montpellier, à deux heures et demie, l\'aller-retour tient dans la journée avec un chauffeur, à condition que le match ne finisse pas après 23h. Vers Paris, La Rochelle ou Clermont, la journée dépasse 12 heures d\'amplitude : il faut un second chauffeur, un retour le lendemain ou un [autocar couchette](/autocar-couchette) pour un match en soirée.',
          'Les stades ont des parkings autocars, souvent à distance de l\'entrée et avec une heure limite d\'accès les soirs de grand match : le chauffeur connaît les dispositifs, donnez-lui l\'heure réelle de fin et un numéro de téléphone du responsable. L\'alcool à bord dépend du transporteur, les débordements sont facturés : notre guide [aller à un festival en bus](/blog/aller-a-un-festival-en-bus) reprend les règles qui valent aussi pour les matchs. Pour le ski avec un club, voir [partir au ski en autocar avec un groupe](/blog/autocar-station-de-ski-groupe).',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Toulouse',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Toulouse : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Toulouse, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 350 €', 'à partir de 400 €', 'à partir de 500 €'],
          ['Journée locale, aller-retour', 'à partir de 600 €', 'à partir de 700 €', 'à partir de 800 €'],
          ['Journée régionale, aller-retour', 'à partir de 900 €', 'à partir de 1 000 €', 'à partir de 1 200 €'],
          ['Week-end 2 jours', 'à partir de 1 600 €', 'à partir de 1 800 €', 'Sur devis'],
        ],
      },
      apres: 'Le département ne porte pas de majoration régionale : ces prix de départ sont ceux de la grille nationale. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Toulouse ?',
        a: 'Une journée en autocar standard démarre à 700 € TTC pour un aller-retour local. Carcassonne ou Albi à la journée restent dans les petites tranches kilométriques, donc parmi les sorties les plus économiques. Vous recevez plusieurs devis gratuits sous 24h.',
      },
      {
        q: 'Peut-on aller en Andorre en autocar ?',
        a: 'Oui, la sortie Andorre à la journée est un classique toulousain. Les chauffeurs connaissent la route de montagne et les zones de stationnement du Pas de la Case et d\'Andorre-la-Vieille. Pièce d\'identité requise pour chaque passager.',
      },
      {
        q: 'Organisez-vous des transports de pèlerinage vers Lourdes ?',
        a: 'Régulièrement : paroisses, hospitaliers et associations nous confient leurs trajets vers les sanctuaires. Les transporteurs habitués gèrent la dépose au plus près, y compris pour les personnes à mobilité réduite — précisez les besoins dans votre demande.',
      },
      {
        q: 'Quel véhicule pour une sortie scolaire au départ de Toulouse ?',
        a: 'Un autocar de tourisme aux normes transport d\'enfants, avec ceintures et chauffeur expérimenté. Nous demandons l\'effectif exact (élèves + accompagnateurs) pour dimensionner le véhicule — un car standard emmène jusqu\'à 59 personnes.',
      },
    ],
  },
  {
    slug: 'bordeaux',
    nom: 'Bordeaux',
    metaTitle: 'Location d\'autocar à Bordeaux avec chauffeur — Devis 24h | Busmoov',
    metaDescription: "Autocar et minibus avec chauffeur à Bordeaux : circuits vignobles Saint-Émilion et Médoc, Mérignac, Arcachon. Devis gratuit sous 24h.",
    h1: 'Location d\'autocar avec chauffeur à Bordeaux',
    sousTitre: 'Circuits dans les vignobles, transferts Mérignac, escapades au bassin d\'Arcachon : des autocaristes girondins vérifiés, un devis gratuit en 24h.',
    intro: [
      'À Bordeaux, l\'autocar avec chauffeur est d\'abord l\'allié des visites de vignobles : Saint-Émilion, le Médoc et ses grands crus, Sauternes ou l\'Entre-deux-Mers. Quand la dégustation fait partie du programme, personne ne prend le volant — le car récupère le groupe au château et le ramène en ville, dans la soirée s\'il le faut.',
      'La métropole girondine, c\'est aussi les congrès au Palais 2 l\'Atlantique, les matchs au Matmut Atlantique, les transferts vers l\'aéroport de Mérignac et la grande évasion du week-end : le bassin d\'Arcachon et la dune du Pilat. Nous comparons pour vous plusieurs devis de transporteurs implantés en Gironde.',
    ],
    sectionLocale: {
      h2: "Construire un circuit vignobles qui tient la journée",
      paragraphes: [
        "La règle d'or : deux propriétés le matin, déjeuner, une l'après-midi — pas plus. La route des châteaux du Médoc (la D2) est belle mais lente, et Saint-Émilion se visite à pied depuis le parking autocars au pied du village médiéval. Les domaines demandent des horaires précis pour les dégustations de groupe : le chauffeur en mise à disposition adapte le rythme aux débordements du déjeuner.",
        "Dans Bordeaux même, l'hyper-centre entre les quais et la place Gambetta est largement piéton : les prises en charge de groupe se font sur les quais rive gauche (dépose minute) ou aux abords de la gare Saint-Jean. Précisez l'hôtel du groupe, nos transporteurs girondins indiquent le point exact.",
      ],
    },
    h2Destinations: "Vignobles, Bassin, Pays basque : les sorties des groupes bordelais",
    h2Trajets: "Trajets types à Bordeaux",
    destinations: [
      { nom: 'Saint-Émilion', desc: 'Le circuit œnologique le plus demandé : village médiéval, châteaux et dégustations, retour sans conduire.' },
      { nom: 'Le Médoc', desc: 'Route des grands crus (Margaux, Pauillac, Saint-Estèphe) pour séminaires et clubs d\'œnologie.' },
      { nom: 'Bassin d\'Arcachon et dune du Pilat', desc: 'La journée nature classique : embarquement pour l\'île aux Oiseaux, montée à la dune.' },
      { nom: 'Cognac', desc: 'Visites de maisons de négoce à 1h30 — souvent combinées avec une étape à Angoulême.' },
      { nom: 'Le Pays basque', desc: 'Biarritz, Saint-Jean-de-Luz, Espelette : la grande sortie à la journée ou au week-end.' },
      { nom: 'Périgord et Sarlat', desc: 'Grottes, châteaux et gastronomie pour les groupes seniors et les associations.' },
    ],
    trajets: [
      'Transfert Bordeaux ↔ aéroport de Mérignac pour un groupe',
      'Circuit vignobles : Bordeaux → Saint-Émilion ou Médoc avec plusieurs étapes',
      'Navette gare Saint-Jean ↔ Palais des congrès ou hôtel',
      'Bordeaux → Arcachon et dune du Pilat à la journée',
    ],
    liensUtiles: [
      "Pour prolonger vers l'océan, voyez la [location d'autocar à Arcachon](/location-autocar/arcachon) ; plus au sud, la [location d'autocar à Biarritz](/location-autocar/biarritz) couvre tout le Pays basque. Un doute sur le vocabulaire ? Notre article [bus, car ou autocar : quelles différences ?](/blog/difference-bus-autocar-minibus) met tout le monde d'accord.",
      "Journée dans le vignoble, transfert Mérignac ou week-end au Bassin : notre [guide des prix de location d'autocar](/blog/prix-location-autocar) vous donne l'ordre de grandeur de chaque formule. Pour un chiffrage précis au départ de Bordeaux, demandez votre [devis autocar gratuit](/devis-autocar).",
    ],
    sections: [
      {
        h2: 'L\'année des groupes à Bordeaux',
        paragraphes: [
          'Le calendrier bordelais suit la vigne. De mai à octobre, les séminaires et les circuits œnologiques dans le Médoc et à Saint-Émilion occupent les transporteurs girondins en semaine ; en juin des années paires, Bordeaux Fête le Vin remplit les quais et les hôtels ; en septembre et octobre, les vendanges font les sorties de comités d\'entreprise et de groupes étrangers. L\'été, le [bassin d\'Arcachon](/location-autocar/arcachon) et la dune du Pilat sont la journée de référence des colonies, des écoles en juin et des associations.',
          'Toute la saison, l\'UBB à Chaban-Delmas et les Girondins au Matmut Atlantique mobilisent des navettes de supporters ; en novembre, le salon Bordeaux SO Good réunit les gourmands ; en décembre, le marché de Noël des allées de Tourny et les sorties au [Pays basque](/location-autocar/biarritz) font les week-ends. Les samedis de mai à septembre sont ceux des mariages dans les châteaux viticoles, où le car des invités se réserve plusieurs mois à l\'avance.',
        ],
      },
      {
        h2: 'Séminaire dans les châteaux : le montage type depuis Bordeaux',
        paragraphes: [
          'Le format le plus demandé à Bordeaux est la journée ou la soirée avec car à disposition : prise en charge à la gare Saint-Jean ou à l\'hôtel, route des châteaux du Médoc ou de Saint-Émilion, deux ou trois domaines avec visite et dégustation, déjeuner ou dîner au château, retour à Bordeaux. Le prix se calcule sur l\'amplitude du chauffeur : une journée de 9h à 18h entre dans la grille de base, un retour après le dîner à 23h passe sur l\'amplitude supérieure. Saint-Émilion est à 45 minutes, Pauillac à 1h : ne mélangez pas les deux rives dans la même journée.',
          'Pour deux jours, le car peut rester avec le groupe, chauffeur logé sur place, ou revenir le lendemain : la seconde option coûte moins cher si le groupe dort au château. Notre guide [déplacement d\'entreprise en autocar](/blog/autocar-deplacement-entreprise) compare les deux montages ; pour une sortie entre amis ou un anniversaire dans les vignes, voir [louer un bus pour une fête privée](/blog/louer-un-bus-pour-un-anniversaire). La gare Saint-Jean a une dépose cars côté Belcier, et l\'aéroport de Mérignac une zone autocars devant le hall B.',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Bordeaux',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Bordeaux : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Bordeaux, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 350 €', 'à partir de 400 €', 'à partir de 500 €'],
          ['Journée locale, aller-retour', 'à partir de 600 €', 'à partir de 700 €', 'à partir de 800 €'],
          ['Journée régionale, aller-retour', 'à partir de 900 €', 'à partir de 1 000 €', 'à partir de 1 200 €'],
          ['Week-end 2 jours', 'à partir de 1 600 €', 'à partir de 1 800 €', 'Sur devis'],
        ],
      },
      apres: 'Le département ne porte pas de majoration régionale : ces prix de départ sont ceux de la grille nationale. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte la location d\'un autocar à Bordeaux ?',
        a: 'Une journée en autocar standard démarre à 700 € TTC pour un aller-retour local ; un circuit vignobles avec plusieurs étapes est chiffré selon l\'itinéraire et l\'amplitude. Vous recevez plusieurs devis gratuits de transporteurs girondins sous 24h.',
      },
      {
        q: 'Le car peut-il nous attendre pendant les dégustations ?',
        a: 'Oui : pour un circuit œnologique, le véhicule reste à disposition toute la journée et enchaîne les étapes à votre rythme. C\'est la formule « mise à disposition », précisez-la dans votre demande pour un chiffrage juste.',
      },
      {
        q: 'Peut-on monter à la dune du Pilat en autocar ?',
        a: 'Les autocars stationnent au parking dédié au pied de la dune (emplacements réservés aux cars). L\'été, l\'accès est très fréquenté : nos chauffeurs visent une arrivée matinale pour éviter l\'attente.',
      },
      {
        q: 'Proposez-vous des navettes pour les mariages dans les châteaux ?',
        a: 'Très souvent : la Gironde regorge de domaines viticoles qui accueillent des mariages. Nous organisons les rotations invités entre la ville, le château et les hôtels, avec retour en fin de soirée. Un minibus complète souvent le dispositif pour les derniers départs.',
      },
    ],
  },
  {
    slug: 'lille',
    nom: 'Lille',
    metaTitle: 'Location d\'autocar à Lille avec chauffeur — Devis 24h | Busmoov',
    metaDescription: "Autocar et minibus avec chauffeur à Lille : excursions Bruges et Bruxelles, côte d'Opale, événements. Devis gratuit sous 24h.",
    h1: 'Location d\'autocar avec chauffeur à Lille',
    sousTitre: 'Excursions en Belgique, côte d\'Opale, événements au Grand Palais : des transporteurs nordistes vérifiés, un devis gratuit en 24h.',
    intro: [
      'Position unique en Europe : depuis Lille, un autocar atteint Bruxelles, Bruges ou la côte d\'Opale en une heure et quart. Cette situation de carrefour fait de la métropole lilloise un point de départ idéal pour les excursions transfrontalières des CE, associations et groupes scolaires — nos transporteurs des Hauts-de-France passent la frontière belge toutes les semaines.',
      'Sur place, les grands rendez-vous rythment la demande : salons à Lille Grand Palais, matchs au stade Pierre-Mauroy, et bien sûr la Braderie du premier week-end de septembre, où les navettes de groupe se réservent des mois à l\'avance. Du minibus au double étage, nous comparons plusieurs devis de transporteurs implantés dans le Nord.',
    ],
    sectionLocale: {
      h2: "Lille-Flandres, Lille-Europe, Grand Palais : les points de rendez-vous",
      paragraphes: [
        "Les deux gares sont à 400 mètres l'une de l'autre mais leurs accès cars diffèrent : pour un groupe qui arrive en TGV ou en Eurostar, la prise en charge se cale côté Lille-Europe (voirie plus large), et le Grand Palais dispose de sa propre zone de dépose le long du boulevard des Cités-Unies. Pour un départ d'excursion, le rendez-vous classique est le parvis de la porte de Valenciennes ou le Champ de Mars, plus faciles d'accès qu'une rue du Vieux-Lille.",
        "Pendant la Braderie (premier week-end de septembre), tout le centre est fermé à la circulation : les cars déposent en périphérie du périmètre, relayés par le métro. Si votre événement tombe ce week-end-là, on planifie le point de dépose dès le devis — pas le jour J.",
      ],
    },
    h2Destinations: "Belgique, côte d'Opale, mémoire 14-18 : où partent les groupes lillois",
    h2Trajets: "Trajets types au départ de Lille",
    destinations: [
      { nom: 'Bruges', desc: 'La « Venise du Nord » à 1h15 : l\'excursion transfrontalière préférée des groupes lillois.' },
      { nom: 'Bruxelles', desc: 'Grand-Place, Atomium, institutions européennes — la journée belge classique, à une heure de route.' },
      { nom: 'La côte d\'Opale', desc: 'Le Touquet, Boulogne-sur-Mer et Nausicaá, les deux caps : la sortie nature à la journée.' },
      { nom: 'Paris', desc: 'À 2h30 par autoroute : musées, spectacles et salons pour les groupes qui évitent la contrainte du train.' },
      { nom: 'La baie de Somme', desc: 'Saint-Valery et le Crotoy pour les sorties associatives et scolaires nature.' },
      { nom: 'Arras et les mémoriaux', desc: 'Circuits de mémoire 14-18 (Vimy, Notre-Dame-de-Lorette) très demandés par les scolaires.' },
    ],
    trajets: [
      'Transfert Lille ↔ aéroport de Lesquin ou gares Lille-Flandres / Lille-Europe',
      'Excursion Lille → Bruges ou Bruxelles à la journée',
      'Navette événement : Grand Palais, stade Pierre-Mauroy, Braderie de Lille',
      'Circuit mémoire 14-18 dans l\'Artois pour scolaires',
    ],
    liensUtiles: [
      "Les groupes nordistes qui descendent sur la capitale s'appuient sur notre [location d'autocar sur Paris](/location-autocar/paris) — à 2h30 par l'autoroute. Pour chiffrer le trajet avant de demander vos devis, consultez les [tarifs de location d'un autocar avec chauffeur](/blog/prix-location-autocar).",
    ],
    sections: [
      {
        h2: 'L\'année des groupes à Lille',
        paragraphes: [
          'Le calendrier lillois commence par le carnaval de Dunkerque, de janvier à mars, qui déplace des bandes entières en car depuis toute la métropole, et par les voyages de mémoire des collèges vers Arras, Vimy et la Somme au printemps. D\'avril à juin, les sorties scolaires vers la côte d\'Opale, Nausicaá et la baie de Somme occupent les cars de 50 places tous les jours de semaine, et les comités d\'entreprise partent à Bruges ou à Bruxelles à la journée.',
          'Le premier week-end de septembre, la Braderie de Lille remplit la ville et ferme le centre aux véhicules ; en octobre et novembre, les salons du Grand Palais et les concerts du Zénith prennent le relais ; en décembre, le marché de Noël de la place Rihour et les sorties vers les marchés belges et allemands font les samedis. Toute la saison, le LOSC au stade Pierre-Mauroy mobilise des navettes de supporters, et les étudiants du campus organisent leurs week-ends d\'intégration en septembre.',
        ],
      },
      {
        h2: 'Journée en Belgique depuis Lille : ce qu\'il faut savoir',
        paragraphes: [
          'Bruges est à 1h, Bruxelles à 1h15, Gand à 1h : la Belgique est la sortie naturelle des groupes lillois, sans formalité de frontière. Deux points de vigilance que gèrent nos transporteurs : les zones à basses émissions de Bruxelles, Anvers et Gand, qui imposent un véhicule récent enregistré avant le passage, et les centres historiques piétons, où le car dépose en périphérie, au Bargeplein à Bruges par exemple, avec dix minutes de marche jusqu\'au centre.',
          'Pour une journée, un départ à 8h et un retour à 20h tiennent dans l\'amplitude de base ; une soirée à Bruxelles avec retour après minuit passe sur une amplitude longue. Notre page [location d\'autocar en Belgique](/location-autocar-belgique) détaille les règles locales, et pour un [week-end aux marchés de Noël](/blog/marches-de-noel-en-autocar), Lille est la base idéale vers Bruxelles, Liège et Aix-la-Chapelle. Vers le sud, nous couvrons [Paris](/location-autocar/paris) et [Reims](/location-autocar/reims).',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Lille',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Lille : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Lille, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 350 €', 'à partir de 400 €', 'à partir de 500 €'],
          ['Journée locale, aller-retour', 'à partir de 600 €', 'à partir de 700 €', 'à partir de 800 €'],
          ['Journée régionale, aller-retour', 'à partir de 900 €', 'à partir de 1 000 €', 'à partir de 1 200 €'],
          ['Week-end 2 jours', 'à partir de 1 600 €', 'à partir de 1 800 €', 'Sur devis'],
        ],
      },
      apres: 'Le département ne porte pas de majoration régionale : ces prix de départ sont ceux de la grille nationale. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Lille ?',
        a: 'Une journée en autocar standard démarre à 700 € TTC pour un aller-retour local. Une excursion à Bruges ou Bruxelles reste dans les tranches kilométriques basses — c\'est l\'une des sorties transfrontalières les plus économiques de France. Devis gratuit sous 24h.',
      },
      {
        q: 'Peut-on passer en Belgique sans formalité ?',
        a: 'Oui, nos transporteurs effectuent les trajets vers la Belgique en routine (espace Schengen, licence communautaire). Prévoyez simplement une pièce d\'identité par passager.',
      },
      {
        q: 'Peut-on réserver une navette pour la Braderie de Lille ?',
        a: 'Oui, mais anticipez : le premier week-end de septembre est le créneau le plus tendu de l\'année dans la métropole. Demandez votre devis au printemps pour garantir le véhicule et un point de dépose réaliste par rapport au périmètre piéton.',
      },
      {
        q: 'Quel car pour un déplacement de supporters au stade Pierre-Mauroy ?',
        a: 'Les transporteurs habitués aux matchs connaissent les zones de stationnement autocars du stade et les horaires d\'accès. Indiquez le match et le nombre de supporters : le devis intègre l\'attente pendant la rencontre.',
      },
    ],
  },
  {
    slug: 'nantes',
    nom: 'Nantes',
    metaTitle: 'Location d\'autocar à Nantes avec chauffeur — Devis 24h | Busmoov',
    metaDescription: "Autocar et minibus avec chauffeur à Nantes : Puy du Fou, La Baule, Mont Saint-Michel, événements. Devis gratuit sous 24h.",
    h1: 'Location d\'autocar avec chauffeur à Nantes',
    sousTitre: 'Puy du Fou, presqu\'île de Guérande, événements d\'entreprise : des transporteurs ligériens vérifiés, un devis gratuit en 24h.',
    intro: [
      'Au départ de Nantes, une destination écrase toutes les autres dans les demandes de groupe : le Puy du Fou, à une heure et demie de route. Écoles, comités d\'entreprise, associations — nos transporteurs de Loire-Atlantique y déposent des groupes toute la saison et en connaissent les parkings et les horaires de spectacles.',
      'La métropole nantaise ne manque pas d\'autres motifs de déplacement : congrès à la Cité des Congrès, matchs à la Beaujoire, séminaires entre les Machines de l\'île et le vignoble. Et pour les sorties, l\'océan est à 45 minutes : La Baule, Pornic, la presqu\'île de Guérande. Nous comparons plusieurs devis de transporteurs locaux vérifiés.',
    ],
    sectionLocale: {
      h2: "Le jour J au Puy du Fou : le déroulé type",
      paragraphes: [
        "Départ de Nantes vers 7h30 pour être aux portes du parc à l'ouverture (1h30 par l'A83 puis l'A87), dépose au parking autocars dédié, et le véhicule reste sur place toute la journée. Le retour standard se cale sur la fermeture du parc ; pour la Cinéscénie, le spectacle finit vers minuit et demi — l'amplitude dépasse alors les 12 heures réglementaires d'un seul chauffeur, et le devis intègre d'office le second chauffeur.",
        "Pour les scolaires nantais, la solution la plus économique reste la côte : La Baule, Pornic ou les marais salants de Guérande sont à 45-60 minutes, soit une amplitude courte et un car qui revient dans la journée sans supplément.",
      ],
    },
    h2Destinations: "Du Puy du Fou au Mont Saint-Michel : les excursions nantaises",
    h2Trajets: "Trajets types à Nantes",
    destinations: [
      { nom: 'Puy du Fou', desc: 'LA destination de groupe de l\'Ouest — 1h30 de route, dépose au parking dédié, le car attend pendant les spectacles.' },
      { nom: 'La Baule et Guérande', desc: 'Plage, marais salants et cité médiévale : la journée océan des CE et des scolaires.' },
      { nom: 'Le Mont Saint-Michel', desc: 'À 2h de Nantes : l\'excursion patrimoine emblématique, avec dépose aux navettes de la baie.' },
      { nom: 'Les châteaux de la Loire', desc: 'Angers, Saumur, Villandry — circuits culturels à la journée dans le Val de Loire.' },
      { nom: 'Clisson et le vignoble', desc: 'Muscadet et architecture italienne à 30 minutes — sorties œnologiques et Hellfest en juin.' },
      { nom: 'Rennes et Saint-Malo', desc: 'La Bretagne voisine pour les déplacements d\'entreprise et les week-ends associatifs.' },
    ],
    trajets: [
      'Transfert Nantes ↔ aéroport Nantes Atlantique pour un groupe',
      'Nantes → Puy du Fou à la journée (scolaires, CE, associations)',
      'Navette gare ↔ Cité des Congrès ou site d\'entreprise',
      'Sortie La Baule / Guérande ou Mont Saint-Michel à la journée',
    ],
    liensUtiles: [
      "Depuis le grand Ouest, nous assurons aussi la [location d'autocar au Mans](/location-autocar/le-mans) — pratique pour combiner circuit des 24 Heures et châteaux — et la [location d'un autocar à Bordeaux](/location-autocar/bordeaux) plus au sud. Pour une classe, notre page [autocar pour sorties scolaires](/services/sorties-scolaires) détaille les véhicules aux normes.",
      "Vers les plages, le Puy du Fou ou Rennes, le prix dépend surtout de la distance et de l'amplitude de la journée : tout est expliqué dans notre guide [tarifs d'un autocar avec chauffeur](/blog/prix-location-autocar). Le [devis en ligne](/devis-autocar) vous donne ensuite jusqu'à 3 propositions nantaises sous 24h.",
    ],
    sections: [
      {
        h2: 'L\'année des groupes à Nantes',
        paragraphes: [
          'Le Puy du Fou donne le rythme : d\'avril à novembre, et surtout de mai à septembre, les cars nantais partent chaque matin vers les Épesses avec des écoles, des comités d\'entreprise et des associations, et reviennent le soir après la Cinéscénie les samedis d\'été, avec un second chauffeur ou une nuit sur place. Juin est le mois des sorties de fin d\'année vers l\'océan, La Baule, Pornic et Noirmoutier, et du Hellfest à Clisson, où les groupes d\'amis arrivent en bus avec tentes et glacières.',
          'L\'été, le Voyage à Nantes transforme la ville en parcours d\'art et les Machines de l\'île accueillent des groupes du monde entier ; en septembre, la Folle Journée se prépare pour janvier et les étudiants organisent leurs week-ends d\'intégration ; toute la saison, le FC Nantes à la Beaujoire et les concerts du Zénith font les navettes de soirée. Les cars de Loire-Atlantique manquent les samedis de juin et les week-ends de Puy du Fou en août.',
        ],
      },
      {
        h2: 'Bagages, bateaux et marées : les sorties océan depuis Nantes',
        paragraphes: [
          'Une sortie à la mer depuis Nantes se joue sur les horaires de marée et de bateau. Pour Noirmoutier, le passage du Gois n\'est praticable que quelques heures par jour, le pont l\'est toujours ; pour l\'île d\'Yeu, le car dépose à Fromentine et le bateau se réserve à part, avec un timing calé sur le retour. Pour La Baule et Pornic, les parkings cars du front de mer sont pleins dès 11h en juillet : partir à 8h30 garantit la place.',
          'Comptez une valise par enfant pour une classe de mer, un sac et une glacière par personne pour un comité d\'entreprise : dites le volume dans la demande, un car standard a des soutes, un minibus beaucoup moins. Notre guide [journée à la mer en autocar](/blog/journee-mer-autocar) reprend le déroulé type et le budget ; pour un festival, [aller à un festival en bus](/blog/aller-a-un-festival-en-bus) couvre le retour de nuit. Dans l\'Ouest, nous couvrons aussi [Rennes](/location-autocar/rennes) et [Le Mans](/location-autocar/le-mans).',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Nantes',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Nantes : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Nantes, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 350 €', 'à partir de 400 €', 'à partir de 500 €'],
          ['Journée locale, aller-retour', 'à partir de 600 €', 'à partir de 700 €', 'à partir de 800 €'],
          ['Journée régionale, aller-retour', 'à partir de 900 €', 'à partir de 1 000 €', 'à partir de 1 200 €'],
          ['Week-end 2 jours', 'à partir de 1 600 €', 'à partir de 1 800 €', 'Sur devis'],
        ],
      },
      apres: 'Le département ne porte pas de majoration régionale : ces prix de départ sont ceux de la grille nationale. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Nantes ?',
        a: 'Une journée en autocar standard démarre à 700 € TTC pour un aller-retour local. L\'aller-retour Puy du Fou, avec son amplitude longue (les spectacles finissent tard), se chiffre selon l\'horaire de retour — précisez si vous restez pour la Cinéscénie. Devis gratuit sous 24h.',
      },
      {
        q: 'Comment se passe une journée Puy du Fou en autocar ?',
        a: 'Départ tôt le matin, dépose au parking autocars du parc, le véhicule reste sur place et vous repartez après le dernier spectacle. Pour la Cinéscénie (fin vers minuit), la réglementation du temps de conduite peut imposer un second chauffeur — nous l\'intégrons au devis dès le départ.',
      },
      {
        q: 'Peut-on organiser une sortie scolaire à la journée vers l\'océan ?',
        a: 'Oui, La Baule, Pornic ou Guérande sont à 45-60 minutes : une amplitude courte, donc parmi les sorties scolaires les plus économiques au départ de Nantes. Véhicules aux normes transport d\'enfants.',
      },
      {
        q: 'Desservez-vous le Hellfest à Clisson ?',
        a: 'Oui, les navettes de groupe vers Clisson en juin sont courantes. Réservez plusieurs semaines à l\'avance : le week-end du festival mobilise beaucoup de véhicules dans la région.',
      },
    ],
  },
  {
    slug: 'biarritz',
    nom: 'Biarritz',
    metaTitle: 'Location d\'autocar à Biarritz avec chauffeur — Devis 24h | Busmoov',
    metaDescription: 'Location d\'autocar et minibus avec chauffeur à Biarritz et au Pays basque : San Sebastián, Espelette, séminaires, mariages. Devis gratuit sous 24h.',
    h1: 'Location d\'autocar avec chauffeur à Biarritz',
    sousTitre: 'Séminaires face à l\'océan, villages basques, escapades à San Sebastián : des transporteurs du Pays basque vérifiés, un devis gratuit en 24h.',
    intro: [
      'Biarritz est une terre de séminaires et d\'incentives : hôtels face à l\'océan, golf, surf, et un aéroport international à dix minutes du centre. Nos transporteurs basques assurent les transferts aéroport, les navettes entre hôtels et lieux d\'événement, et les soirées dans les villages de l\'arrière-pays — le retour de la cidrerie à minuit, c\'est leur quotidien.',
      'L\'autre grande demande, c\'est l\'Espagne : San Sebastián et ses pintxos sont à 50 minutes, Bilbao et le Guggenheim à 1h45. Passage de frontière sans formalité, chauffeurs bilingues fréquents — le Pays basque se visite des deux côtés de la Bidassoa, et l\'autocar est le seul moyen simple d\'y emmener un groupe.',
    ],
    sectionLocale: {
      h2: "Séminaires à Biarritz : la logistique qui marche",
      paragraphes: [
        "L'aéroport est à dix minutes des hôtels du centre — mais ces hôtels bordent des rues étroites où un autocar de 13 mètres ne manœuvre pas : pour les groupes logés autour de la Grande Plage ou du Port-Vieux, la navette se fait en minibus, ou la dépose se cale sur un point large comme le square d'Ixelles ou la côte des Basques côté Bellevue. C'est le genre de détail que nos transporteurs basques règlent d'office.",
        "Les soirées cidrerie ou restaurant dans l'arrière-pays (Espelette, Sare, la vallée de la Nive) se terminent tard : fixez l'heure de la dernière navette au devis, et pour un séminaire de plus de 40 personnes, la formule car + minibus permet des retours échelonnés sans payer deux gros véhicules.",
      ],
    },
    h2Destinations: "Des deux côtés de la Bidassoa : les sorties basques",
    h2Trajets: "Trajets types au Pays basque",
    destinations: [
      { nom: 'San Sebastián', desc: 'La perle basque espagnole à 50 minutes : vieille ville, pintxos et plage de la Concha.' },
      { nom: 'Espelette et les villages basques', desc: 'Ainhoa, Sare, la Rhune en petit train : le circuit arrière-pays des séminaires.' },
      { nom: 'Saint-Jean-de-Luz', desc: 'Port, baie et maison de l\'Infante à 20 minutes — la demi-journée classique.' },
      { nom: 'Bayonne', desc: 'Fêtes de Bayonne en été (navettes très demandées), chocolatiers et vieille ville toute l\'année.' },
      { nom: 'Bilbao et le Guggenheim', desc: 'La grande journée culturelle espagnole, à 1h45 de route.' },
      { nom: 'Saint-Jean-Pied-de-Port', desc: 'Porte de Compostelle au pied des Pyrénées — randonnées et gastronomie de groupe.' },
    ],
    trajets: [
      'Transfert aéroport de Biarritz ↔ hôtels pour séminaires et incentives',
      'Soirée cidrerie ou restaurant dans l\'arrière-pays avec retour tardif',
      'Excursion San Sebastián ou Bilbao à la journée',
      'Navettes mariage entre église, venue et hôtels de la côte',
    ],
    liensUtiles: [
      "Entre deux séminaires, les groupes basques remontent volontiers vers la [location d'autocar à Bordeaux](/location-autocar/bordeaux) ou rejoignent la ville rose via la [location d'autocar à Toulouse](/location-autocar/toulouse). Pour un transfert en comité restreint, un [minibus avec chauffeur](/services/location-minibus) suffit souvent.",
      "Un transfert depuis l'aéroport de Biarritz, une journée à Saint-Sébastien ou une semaine de surf trip ne se chiffrent pas pareil : notre guide des [prix de location d'autocar](/blog/prix-location-autocar) donne les fourchettes de chaque formule, avant votre [demande de devis autocar](/devis-autocar).",
    ],
    sections: [
      {
        h2: 'L\'année des groupes sur la côte basque',
        paragraphes: [
          'La côte basque vit sur deux saisons. De mai à octobre, les séminaires et les incentives remplissent Biarritz et Saint-Jean-de-Luz, avec des transferts depuis l\'aéroport de Biarritz-Pays basque et la gare de Bayonne, des soirées dans les villages et des journées à San Sebastián. Fin juillet, les fêtes de Bayonne déplacent des groupes de toute la région pendant cinq jours, avec des navettes de nuit et un centre fermé aux voitures ; en septembre, les compétitions de surf et le Temps d\'aimer la danse prolongent la saison.',
          'L\'hiver, la côte reste active : le Biarritz Olympique et l\'Aviron Bayonnais en rugby, les séminaires de janvier à mars quand les hôtels sont libres, les sorties shopping à San Sebastián et les journées ski à La Pierre-Saint-Martin ou Gourette, à 1h30. Les cars des Pyrénées-Atlantiques sont rares en juillet-août et pendant les fêtes de Bayonne : réservez dès le printemps.',
        ],
      },
      {
        h2: 'Passer en Espagne avec un groupe : San Sebastián, Bilbao, la Rhune',
        paragraphes: [
          'San Sebastián est à 45 minutes, Bilbao à 1h45 : les deux se font à la journée. Les centres sont piétons et les cars déposent aux zones autocars, près de la plage de la Concha à San Sebastián, au pied du Guggenheim à Bilbao, avant de rejoindre les parkings périphériques. Le transporteur gère les péages espagnols et les documents du véhicule ; aucune formalité pour les passagers. Pour un déjeuner de pintxos, prévoyez deux heures et un rendez-vous précis, la vieille ville de San Sebastián se perd vite.',
          'Côté français, le petit train de la Rhune part de Sare, avec un parking autocars, et se réserve pour les groupes ; Espelette et Ainhoa ont des parkings cars à l\'entrée des villages. Pour le reste de l\'Espagne, notre page [location d\'autocar en Espagne](/location-autocar-espagne) détaille les règles ; au nord, nous couvrons [Bordeaux](/location-autocar/bordeaux) et le [bassin d\'Arcachon](/location-autocar/arcachon). Pour un séminaire, le guide [déplacement d\'entreprise en autocar](/blog/autocar-deplacement-entreprise) complète cette page.',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Biarritz',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Biarritz : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Biarritz, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 400 €', 'à partir de 450 €', 'à partir de 550 €'],
          ['Journée locale, aller-retour', 'à partir de 700 €', 'à partir de 800 €', 'à partir de 900 €'],
          ['Journée régionale, aller-retour', 'à partir de 1 000 €', 'à partir de 1 100 €', 'à partir de 1 350 €'],
          ['Week-end 2 jours', 'à partir de 1 800 €', 'à partir de 2 000 €', 'Sur devis'],
        ],
      },
      apres: 'Les transporteurs du département appliquent des frais d\'approche d\'environ 10 % : ces prix de départ en tiennent compte. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Biarritz ?',
        a: 'Une journée en autocar standard démarre à 700 € TTC pour un aller-retour local ; les transferts aéroport et navettes de soirée sont chiffrés selon l\'horaire. En été et pendant les grands week-ends de surf, réservez tôt : la côte basque est l\'une des zones les plus demandées de France. Devis gratuit sous 24h.',
      },
      {
        q: 'Peut-on aller en Espagne (San Sebastián, Bilbao) en autocar ?',
        a: 'Oui, c\'est la demande n°1 au départ de Biarritz. Passage de frontière sans arrêt (Schengen), pièce d\'identité requise pour chaque passager. Pour Bilbao, l\'amplitude de la journée est plus longue — nous le prenons en compte dans le devis.',
      },
      {
        q: 'Faites-vous les navettes pour les fêtes de Bayonne ?',
        a: 'Oui, avec une organisation spécifique : circulation restreinte, points de dépose imposés en périphérie et retours de nuit. Les créneaux partent très vite — demandez votre devis dès le printemps.',
      },
      {
        q: 'Un minibus suffit-il pour un séminaire de 15 personnes ?',
        a: 'Parfaitement : un minibus 15-20 places avec chauffeur gère transferts aéroport, navettes restaurant et excursion villages basques. C\'est la formule la plus courante pour les petits comités de direction.',
      },
    ],
  },
  {
    slug: 'arcachon',
    nom: 'Arcachon',
    metaTitle: 'Location d\'autocar à Arcachon avec chauffeur — Devis 24h | Busmoov',
    metaDescription: 'Location d\'autocar et minibus avec chauffeur à Arcachon : dune du Pilat, Cap Ferret, séminaires et mariages sur le Bassin. Devis gratuit sous 24h.',
    h1: 'Location d\'autocar avec chauffeur à Arcachon',
    sousTitre: 'Dune du Pilat, villages ostréicoles, séminaires et mariages sur le Bassin : des transporteurs girondins vérifiés, un devis gratuit en 24h.',
    intro: [
      'Le Bassin d\'Arcachon est une destination de groupe avant d\'être un point de départ : séminaires en villa, mariages face à l\'eau, sorties CE autour de la dune du Pilat et des villages ostréicoles. Nos transporteurs girondins organisent aussi bien les transferts depuis Bordeaux (gare et aéroport à 50 minutes) que les circuits sur place.',
      'La logistique locale a ses particularités : presqu\'île du Cap Ferret accessible par une seule route, stationnement contraint en été, dégustations dans les cabanes ostréicoles où le car dépose au plus près. Des détails que les chauffeurs habitués du Bassin gèrent naturellement — et qui font la différence le jour J.',
    ],
    sectionLocale: {
      h2: "Haute saison sur le Bassin : les horaires qui sauvent la journée",
      paragraphes: [
        "De juin à septembre, l'A660 sature le samedi en milieu de matinée et la presqu'île du Cap Ferret ne se rejoint que par une seule route : un circuit d'été réussi part de Bordeaux avant 8h30, fait la dune du Pilat en première étape (le parking autocars est fluide avant 10h30), puis remonte vers les villages ostréicoles à contre-flux.",
        "Pour une croisière sur le Bassin (île aux Oiseaux, cabanes tchanquées), la dépose se fait à la jetée Thiers en plein centre d'Arcachon : le car ne stationne pas sur place, il dépose puis revient — un aller-retour que le chauffeur en mise à disposition gère entre deux étapes.",
      ],
    },
    h2Destinations: "Autour du Bassin : les incontournables en groupe",
    h2Trajets: "Trajets types sur le Bassin",
    destinations: [
      { nom: 'Dune du Pilat', desc: 'Le site naturel le plus visité de la région — parking autocars dédié, montée par l\'escalier en saison.' },
      { nom: 'Cap Ferret', desc: 'Phare, villages ostréicoles et dégustation d\'huîtres : la journée iconique du Bassin.' },
      { nom: 'Gujan-Mestras et ses ports', desc: 'Sept ports ostréicoles pour les dégustations de groupe — la sortie gourmande par excellence.' },
      { nom: 'Bordeaux et ses vignobles', desc: 'La capitale girondine et Saint-Émilion à moins d\'une heure pour compléter un séjour.' },
      { nom: 'Le Teich', desc: 'Réserve ornithologique : la sortie scolaire et nature de référence sur le Bassin.' },
      { nom: 'Biscarrosse et les lacs', desc: 'Grands lacs landais et musée de l\'Hydraviation à 30 minutes au sud.' },
    ],
    trajets: [
      'Transfert gare de Bordeaux ou aéroport de Mérignac ↔ Arcachon pour un groupe',
      'Circuit Bassin : dune du Pilat, ports ostréicoles, dégustation au Cap Ferret',
      'Navettes mariage entre église, villa et hôtels du Bassin',
      'Sortie scolaire réserve du Teich ou dune du Pilat',
    ],
    liensUtiles: [
      "Le Bassin se combine naturellement avec une étape urbaine : la [location d'autocar à Bordeaux](/location-autocar/bordeaux) est à 50 minutes, et la côte se descend jusqu'à la [location d'autocar au Pays basque](/location-autocar/biarritz). Les fourchettes budgétaires sont détaillées dans notre [guide des prix de location d'autocar](/blog/prix-location-autocar).",
    ],
    sections: [
      {
        h2: 'L\'année des groupes sur le bassin d\'Arcachon',
        paragraphes: [
          'Le Bassin tourne au rythme de l\'été, mais pas seulement. De mai à juin, les classes de mer et les sorties de fin d\'année des écoles girondines se succèdent au Teich, à la dune et sur les ports ostréicoles ; juillet et août sont ceux des colonies, des familles et des comités d\'entreprise, avec des routes saturées et des parkings pleins dès la fin de matinée. Septembre et octobre sont le meilleur moment pour les séminaires : plages libres, hôtels disponibles, dégustations d\'huîtres au calme.',
          'L\'hiver, les groupes de seniors et les associations viennent pour les huîtres et les marchés de Noël d\'Arcachon et d\'Andernos, et les clubs de marche pour la dune et la forêt. Les mariages au Cap Ferret et sur la presqu\'île font les samedis de juin à septembre, avec des navettes d\'invités entre Bordeaux et le Bassin. Les cars girondins sont pris d\'assaut les week-ends de juillet-août : réservez en avril.',
        ],
      },
      {
        h2: 'Cap Ferret, Le Teich, Biscarrosse : les accès cars du Bassin',
        paragraphes: [
          'Le tour du Bassin par la route fait 1h30 ; en bateau depuis Arcachon, le Cap Ferret est à 30 minutes, et le car peut attendre le groupe au Cap après avoir fait le tour. Sur la presqu\'île, la route unique est saturée l\'été et les villages ostréicoles ne laissent pas entrer les cars : dépose aux parkings du Cap Ferret et du Canon, puis marche ou navette. Le Teich a un parking cars à l\'entrée de la réserve ornithologique ; Biscarrosse et les lacs sont à 45 minutes par la forêt, sans difficulté.',
          'Pour la dune du Pilat, le parking cars est au pied, à cinq minutes de l\'escalier ; le chauffeur dépose, stationne et reprend au même endroit, et les billets de groupe se prennent à l\'entrée. Pour une journée mer avec une classe, notre guide [journée à la mer en autocar](/blog/journee-mer-autocar) donne le déroulé type ; pour les invités d\'un mariage, [autocar pour un mariage](/blog/location-autocar-mariage). Les groupes venus de la métropole trouvent aussi notre page [autocar à Bordeaux](/location-autocar/bordeaux).',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Arcachon',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Arcachon : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Arcachon, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 350 €', 'à partir de 400 €', 'à partir de 500 €'],
          ['Journée locale, aller-retour', 'à partir de 600 €', 'à partir de 700 €', 'à partir de 800 €'],
          ['Journée régionale, aller-retour', 'à partir de 900 €', 'à partir de 1 000 €', 'à partir de 1 200 €'],
          ['Week-end 2 jours', 'à partir de 1 600 €', 'à partir de 1 800 €', 'Sur devis'],
        ],
      },
      apres: 'Le département ne porte pas de majoration régionale : ces prix de départ sont ceux de la grille nationale. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Arcachon ?',
        a: 'Une journée en autocar standard démarre à 700 € TTC pour un circuit local. Le transfert Bordeaux ↔ Arcachon pour un groupe est l\'une des demandes les plus courantes et reste économique. Devis gratuit sous 24h.',
      },
      {
        q: 'L\'autocar peut-il circuler sur le Bassin en été ?',
        a: 'Oui, mais la circulation estivale est dense et le stationnement contraint, surtout au Cap Ferret. Nos chauffeurs locaux planifient les horaires en conséquence (départs matinaux, points de dépose connus) — c\'est intégré au devis, pas improvisé sur place.',
      },
      {
        q: 'Peut-on organiser les navettes d\'un mariage sur le Bassin ?',
        a: 'C\'est l\'une des grandes spécialités locales de mai à septembre : rotations entre les hôtels, la cérémonie et la réception, avec retours en fin de soirée. Un minibus en complément du car gère les derniers départs.',
      },
      {
        q: 'La dune du Pilat est-elle accessible en autocar ?',
        a: 'Oui, un parking autocars dédié se trouve au pied du site. En juillet-août, visez une arrivée avant 10h30 pour éviter la file — les chauffeurs habitués le savent et calent le programme en conséquence.',
      },
    ],
  },
  {
    slug: 'le-mans',
    nom: 'Le Mans',
    metaTitle: 'Location d\'autocar au Mans avec chauffeur — Devis 24h | Busmoov',
    metaDescription: 'Location d\'autocar et minibus avec chauffeur au Mans : 24 Heures du Mans, cité Plantagenêt, zoo de La Flèche, événements. Devis gratuit sous 24h.',
    h1: 'Location d\'autocar avec chauffeur au Mans',
    sousTitre: '24 Heures du Mans, séminaires, sorties scolaires : des transporteurs sarthois vérifiés, un devis gratuit en 24h.',
    intro: [
      'Au Mans, tout l\'agenda du transport de groupe tourne autour d\'un week-end de juin : les 24 Heures. Navettes entre gares, hôtels et circuit, déplacements de clubs et d\'entreprises qui reçoivent leurs clients en tribune — nos transporteurs sarthois connaissent les accès du circuit Bugatti, les parkings dédiés et les créneaux où la ville double de population.',
      'Le reste de l\'année, la Sarthe se prête aux sorties classiques : cité Plantagenêt et sa vieille ville préservée, zoo de La Flèche popularisé par la télévision, abbaye de l\'Épau. Et la position centrale du Mans — à une heure de Tours, deux heures de Paris et de Rennes — en fait une base pratique pour les déplacements d\'entreprise.',
    ],
    sectionLocale: {
      h2: "Semaine des 24 Heures : la logistique cars",
      paragraphes: [
        "Pendant la semaine de course, les accès au circuit sont réglementés par secteur et les parkings autocars se trouvent côté nord, avec marche d'approche vers les tribunes : une navette gare du Mans → circuit se cale tôt le matin, avant la fermeture progressive des axes. Pour une entreprise qui reçoit des invités en tribune ou en loge, la rotation continue hôtels ↔ circuit sur le week-end est la formule qui évite les attentes.",
        "Le reste de l'année, le circuit Bugatti accueille roulages, séminaires et visites du musée des 24 Heures avec une dépose simple à l'entrée principale — un transfert classique depuis Paris (2h) ou la gare du Mans (15 minutes).",
      ],
    },
    h2Destinations: "Circuit, châteaux de la Loire, zoo : les sorties sarthoises",
    h2Trajets: "Trajets types au Mans",
    destinations: [
      { nom: 'Circuit des 24 Heures', desc: 'Navettes course en juin, visites du musée et roulages d\'entreprise toute l\'année.' },
      { nom: 'Zoo de La Flèche', desc: 'À 45 minutes : la sortie scolaire et familiale la plus demandée de la Sarthe.' },
      { nom: 'La cité Plantagenêt', desc: 'Vieille ville, cathédrale Saint-Julien et Nuit des Chimères en été pour les groupes.' },
      { nom: 'Les châteaux de la Loire', desc: 'Tours, Amboise et Chenonceau à une heure : circuits culturels à la journée.' },
      { nom: 'Paris', desc: 'À 2h par autoroute pour salons, spectacles et musées sans contrainte de train.' },
      { nom: 'Solesmes et la vallée de la Sarthe', desc: 'Abbaye et villages de caractère pour les sorties associatives et seniors.' },
    ],
    trajets: [
      'Navettes 24 Heures du Mans : gare / hôtels / circuit pendant la semaine de course',
      'Transfert gare du Mans ↔ site d\'entreprise ou lieu de séminaire',
      'Sortie scolaire au zoo de La Flèche',
      'Le Mans → châteaux de la Loire ou Paris à la journée',
    ],
    liensUtiles: [
      "Beaucoup de groupes combinent la Sarthe et la capitale : notre page de [location d'autocar avec chauffeur à Paris](/location-autocar/paris) couvre les départs franciliens, et la [location d'autocar à Nantes](/location-autocar/nantes) prend le relais côté Atlantique.",
      "Semaine des 24 Heures ou sortie scolaire ordinaire, les tarifs ne sont pas les mêmes : notre guide [combien coûte la location d'un autocar](/blog/prix-location-autocar) explique l'effet de la saison et de l'amplitude horaire. Réservez tôt via notre [devis autocar en ligne](/devis-autocar) pour les dates de course.",
    ],
    sections: [
      {
        h2: 'L\'année des groupes au Mans',
        paragraphes: [
          'Le Mans vit au rythme du circuit : les 24 Heures en juin, les 24 Heures motos en avril, les 24 Heures camions en septembre et les roulages d\'entreprise toute l\'année font venir des groupes de clients, de salariés et de passionnés de toute la France. En dehors du circuit, le printemps est celui des sorties scolaires vers le zoo de La Flèche et des voyages vers les châteaux de la Loire, à moins d\'une heure, et l\'été celui de la Nuit des Chimères, qui illumine la cité Plantagenêt.',
          'En septembre, les étudiants organisent leurs week-ends d\'intégration et les entreprises leurs séminaires de rentrée ; en décembre, les sorties aux marchés de Noël et les arbres de Noël d\'entreprise font les samedis ; de septembre à mai, le MSB en basket et le Mans FC mobilisent des navettes. Les cars sarthois sont introuvables la semaine des 24 Heures : réservez en janvier.',
        ],
      },
      {
        h2: 'Le Mans, à mi-chemin : transferts et séminaires entre Paris et l\'Ouest',
        paragraphes: [
          'À 55 minutes de Paris en TGV et à une heure de Tours, Angers et Rennes par l\'autoroute, Le Mans est devenu une ville de séminaires : les participants arrivent en train, un car les attend sur le parvis de la gare et les emmène au circuit, à l\'abbaye de l\'Épau ou dans un domaine de la vallée de la Sarthe. Le format type est la journée avec car à disposition, de l\'arrivée du TGV du matin au départ de celui du soir, qui entre dans l\'amplitude de base.',
          'Pour un transfert vers Paris ou Roissy, comptez 2h15 par l\'A11, plus les bouchons franciliens ; un [minibus](/location-minibus-20-places) suffit à une délégation, un [bus de 50 places](/location-bus-50-places) à une équipe complète. Notre page [autocar à Tours](/location-autocar/tours) couvre les châteaux de la Loire, et [Nantes](/location-autocar/nantes) le Puy du Fou. Pour le montage d\'un séminaire, voir le guide [déplacement d\'entreprise en autocar](/blog/autocar-deplacement-entreprise).',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Le Mans',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Le Mans : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Le Mans, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 400 €', 'à partir de 450 €', 'à partir de 550 €'],
          ['Journée locale, aller-retour', 'à partir de 700 €', 'à partir de 800 €', 'à partir de 900 €'],
          ['Journée régionale, aller-retour', 'à partir de 1 000 €', 'à partir de 1 100 €', 'à partir de 1 350 €'],
          ['Week-end 2 jours', 'à partir de 1 800 €', 'à partir de 2 000 €', 'Sur devis'],
        ],
      },
      apres: 'Les transporteurs du département appliquent des frais d\'approche d\'environ 10 % : ces prix de départ en tiennent compte. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur au Mans ?',
        a: 'Une journée en autocar standard démarre à 700 € TTC pour un aller-retour local. Pendant la semaine des 24 Heures, la demande explose et les tarifs suivent les disponibilités : réservez plusieurs mois à l\'avance. Devis gratuit sous 24h.',
      },
      {
        q: 'Comment organiser des navettes pour les 24 Heures du Mans ?',
        a: 'Précisez vos points (gare, hôtels, quelle entrée du circuit) et vos horaires : les accès sont réglementés pendant la course et les chauffeurs habitués connaissent les itinéraires autorisés et les parkings autocars. Pour une entreprise qui reçoit des invités, la rotation continue sur le week-end est la formule la plus courante.',
      },
      {
        q: 'Peut-on privatiser un car pour amener des clients à un roulage ou au musée des 24 Heures ?',
        a: 'Oui, en dehors de la semaine de course, le circuit accueille événements d\'entreprise et visites toute l\'année — un autocar ou minibus depuis Paris ou la gare du Mans est la formule classique.',
      },
      {
        q: 'Quel véhicule pour une sortie scolaire au zoo de La Flèche ?',
        a: 'Un autocar standard aux normes transport d\'enfants (jusqu\'à 59 places). Le trajet court (45 min) et l\'amplitude réduite en font l\'une des sorties les plus économiques de la région.',
      },
    ],
  },
  {
    slug: 'montpellier',
    nom: 'Montpellier',
    metaTitle: 'Location d\'autocar à Montpellier avec chauffeur — Devis 24h | Busmoov',
    metaDescription: 'Location d\'autocar et minibus avec chauffeur à Montpellier : Camargue, pont du Gard, Sète, plages, congrès au Corum. Devis gratuit sous 24h.',
    h1: 'Location d\'autocar avec chauffeur à Montpellier',
    sousTitre: 'Congrès au Corum, plages, Camargue et pont du Gard : des transporteurs héraultais vérifiés, un devis gratuit en 24h.',
    intro: [
      'Ville de congrès et ville étudiante, Montpellier génère un flux continu de transports de groupe : conventions au Corum, salons au parc des expositions, matchs à la Mosson et au GGL Stadium, week-ends d\'intégration vers les plages. Nos transporteurs héraultais couvrent la métropole et son littoral à un quart d\'heure du centre.',
      'Le rayon d\'excursion est exceptionnel : la Camargue et ses flamants roses à 45 minutes, le pont du Gard et Nîmes à une heure, Sète et son port à 30 minutes, l\'arrière-pays des Cévennes pour les sorties nature. L\'autocar est le seul moyen d\'y emmener un groupe sans convoi de voitures.',
    ],
    sectionLocale: {
      h2: "L'Écusson est piéton : où les cars déposent-ils ?",
      paragraphes: [
        "Le centre historique de Montpellier est interdit aux véhicules : les groupes sont déposés en couronne — côté Corum sur l'allée piétonne de l'Esplanade Charles-de-Gaulle, ou à la gare Saint-Roch pour rejoindre la Comédie à pied en cinq minutes. Pour les congrès au Corum, la rotation hôtels ↔ Esplanade est le schéma standard, y compris pour les dîners de gala en soirée.",
        "Les plages (Palavas, Carnon, La Grande-Motte) sont à 15-20 minutes ; l'été, les retours de fin de journée remontent à contre-flux des embouteillages du littoral. Pour la Sud de France Arena, comptez la dépose au parking événementiel — le tram ne remplace pas un car pour 50 personnes avec matériel.",
      ],
    },
    h2Destinations: "Camargue, pont du Gard, littoral : les excursions montpelliéraines",
    h2Trajets: "Trajets types à Montpellier",
    destinations: [
      { nom: 'La Camargue', desc: 'Aigues-Mortes, Saintes-Maries-de-la-Mer, manades et flamants roses — la journée nature emblématique.' },
      { nom: 'Le pont du Gard et Nîmes', desc: 'Aqueduc romain et arènes à une heure : le circuit patrimoine antique des scolaires et des CE.' },
      { nom: 'Sète', desc: 'Port, mont Saint-Clair et halles : la sortie iodée à 30 minutes, joutes en été.' },
      { nom: 'Pézenas et le vignoble', desc: 'Ville de Molière et domaines du Languedoc pour les sorties œnologiques.' },
      { nom: 'Les Cévennes et la grotte des Demoiselles', desc: 'Gorges de l\'Hérault, Saint-Guilhem-le-Désert : nature et patrimoine à moins d\'une heure.' },
      { nom: 'Carcassonne', desc: 'La cité médiévale à 1h30 pour la grande journée d\'excursion.' },
    ],
    trajets: [
      'Transfert Montpellier ↔ aéroport Méditerranée ou gare Sud de France',
      'Navette congrès : Corum, parc des expositions, hôtels du centre',
      'Montpellier → Camargue, pont du Gard ou Sète à la journée',
      'Navette plages (Palavas, Carnon, La Grande-Motte) pour événements et intégrations',
    ],
    liensUtiles: [
      "Sur l'axe méditerranéen, Busmoov organise aussi la [location d'autocar à Marseille](/location-autocar/marseille) — transferts croisières compris — et, vers l'ouest, la [location d'autocar à Toulouse](/location-autocar/toulouse). Pour un groupe qui arrive en avion, le [transfert aéroport pour groupes](/services/transfert-aeroport) se réserve en une seule demande.",
      "Plages, Camargue, Cévennes ou transfert vers l'aéroport de Montpellier : repérez votre formule dans le guide des [tarifs de location d'autocar 2026](/blog/prix-location-autocar), puis demandez jusqu'à 3 [devis d'autocar](/devis-autocar) à nos transporteurs héraultais, sous 24h.",
    ],
    sections: [
      {
        h2: 'L\'année des groupes à Montpellier',
        paragraphes: [
          'Ville étudiante et ville de congrès, Montpellier a deux saisons de groupes. De septembre à novembre, les week-ends d\'intégration des écoles et de l\'université partent vers la Camargue, les Cévennes et l\'Espagne, et les congrès du Corum font le plein de navettes entre hôtels, gare Saint-Roch et aéroport. De mars à juin, les sorties scolaires vers Sète, le pont du Gard et la grotte des Demoiselles occupent les cars de 50 places en semaine, et les comités d\'entreprise descendent sur les plages de Palavas et de la Grande-Motte.',
          'L\'été, les festivals font les soirées : Montpellier Danse et le Festival de Radio France en juin-juillet, les Estivales sur l\'esplanade chaque vendredi, les férias de Nîmes et de Béziers à moins d\'une heure. Toute la saison, le MHSC à la Mosson et le MHR au GGL Stadium mobilisent des navettes de supporters. Les cars de l\'Hérault manquent surtout en septembre, le mois des intégrations, et les samedis de juin.',
        ],
      },
      {
        h2: 'Plages, férias et Espagne : les sorties de soirée et de week-end',
        paragraphes: [
          'Depuis Montpellier, la plage est à 15 minutes, Barcelone à 3h : les groupes étudiants et les comités d\'entreprise alternent les deux. Pour une soirée à Palavas ou à la Grande-Motte, un minibus ou un car en navette évite les voitures et la question du retour ; pour une féria à Nîmes ou Béziers, le car dépose en périphérie et le retour se fait après les dernières bodegas, avec un second chauffeur si la soirée dépasse 12 heures d\'amplitude. Nos guides [bus pour une soirée étudiante](/blog/bus-soiree-etudiante-bde) et [aller à un festival en bus](/blog/aller-a-un-festival-en-bus) détaillent les règles à bord.',
          'Pour un week-end à Barcelone, le car part le vendredi après-midi, dépose à l\'hôtel et reste ou revient, selon le budget ; notre page [location d\'autocar en Espagne](/location-autocar-espagne) couvre les règles locales. À l\'est, nous couvrons [Marseille](/location-autocar/marseille) et [Nice](/location-autocar/nice) ; à l\'ouest, [Toulouse](/location-autocar/toulouse).',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Montpellier',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Montpellier : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Montpellier, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 350 €', 'à partir de 400 €', 'à partir de 500 €'],
          ['Journée locale, aller-retour', 'à partir de 600 €', 'à partir de 700 €', 'à partir de 800 €'],
          ['Journée régionale, aller-retour', 'à partir de 900 €', 'à partir de 1 000 €', 'à partir de 1 200 €'],
          ['Week-end 2 jours', 'à partir de 1 600 €', 'à partir de 1 800 €', 'Sur devis'],
        ],
      },
      apres: 'Le département ne porte pas de majoration régionale : ces prix de départ sont ceux de la grille nationale. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Montpellier ?',
        a: 'Une journée en autocar standard démarre à 700 € TTC pour un aller-retour local — la Camargue ou le pont du Gard restent dans les petites tranches kilométriques. Devis gratuit de transporteurs de l\'Hérault sous 24h.',
      },
      {
        q: 'Gérez-vous les navettes de congrès au Corum ?',
        a: 'Oui, c\'est une demande hebdomadaire : rotations entre hôtels, gare Saint-Roch et lieux de congrès, y compris en soirée pour les dîners de gala. Le Corum étant en centre-ville, les chauffeurs locaux connaissent les points de dépose autorisés.',
      },
      {
        q: 'Peut-on organiser une journée Camargue avec plusieurs étapes ?',
        a: 'Oui, la formule mise à disposition est idéale : Aigues-Mortes le matin, manade et déjeuner, Saintes-Maries l\'après-midi. Le car reste avec le groupe toute la journée et enchaîne les étapes à votre rythme.',
      },
      {
        q: 'Quel car pour un week-end d\'intégration étudiant ?',
        a: 'Selon l\'effectif, un ou plusieurs autocars standard (59 places). Les week-ends de septembre-octobre sont chargés dans l\'Hérault : demandez vos devis dès l\'été pour garantir les véhicules.',
      },
    ],
  },
  {
    slug: 'saint-etienne',
    nom: 'Saint-Étienne',
    metaTitle: 'Location d\'autocar à Saint-Étienne avec chauffeur — Devis 24h | Busmoov',
    metaDescription: 'Location d\'autocar et minibus avec chauffeur à Saint-Étienne : matchs à Geoffroy-Guichard, Pilat, Le Puy-en-Velay, Lyon. Devis gratuit sous 24h.',
    h1: 'Location d\'autocar avec chauffeur à Saint-Étienne',
    sousTitre: 'Déplacements de supporters, sorties dans le Pilat, liaisons avec Lyon : des transporteurs ligériens vérifiés, un devis gratuit en 24h.',
    intro: [
      'À Saint-Étienne, le transport de groupe a une couleur : le vert. Les déplacements de supporters vers Geoffroy-Guichard — et surtout depuis le Chaudron vers les stades de toute la France — sont la grande spécialité des transporteurs ligériens, rodés aux escortes, aux horaires de match et aux parkings visiteurs.',
      'Hors football, la ville design (Cité du design, biennale) et sa position aux portes du Pilat en font un point de départ pratique : gorges de la Loire, Le Puy-en-Velay et sa cité mariale, et bien sûr Lyon à 50 minutes pour les navettes d\'entreprise, spectacles et salons. Nous comparons plusieurs devis de transporteurs de la Loire.',
    ],
    sectionLocale: {
      h2: "Jour de match à Geoffroy-Guichard",
      paragraphes: [
        "Un déplacement de supporters ne s'improvise pas : le parking visiteurs du Chaudron est assigné, les horaires d'arrivée sont imposés (généralement H-1h30) et certains matchs font l'objet d'arrêtés préfectoraux encadrant les convois. Les transporteurs stéphanois qui font les déplacements des Verts chaque saison connaissent le protocole par cœur — indiquez le match, ils gèrent le reste.",
        "Hors football, le point de rendez-vous le plus pratique pour un départ de groupe est le parvis de la gare de Châteaucreux, dimensionné pour les cars ; comptez 50 minutes vers Lyon par l'A47, davantage aux heures de pointe du couloir Givors-Brignais.",
      ],
    },
    h2Destinations: "Pilat, Velay, Lyon : où partent les groupes stéphanois",
    h2Trajets: "Trajets types à Saint-Étienne",
    destinations: [
      { nom: 'Le parc du Pilat', desc: 'Crêts, vignobles de Condrieu et villages perchés à 30 minutes — la sortie nature de référence.' },
      { nom: 'Le Puy-en-Velay', desc: 'Cité mariale et départ de Compostelle à 1h15 : pèlerinages et sorties patrimoine.' },
      { nom: 'Lyon', desc: 'À 50 minutes : spectacles, salons Eurexpo, matchs — la navette la plus demandée au départ de Saint-Étienne.' },
      { nom: 'Les gorges de la Loire', desc: 'Saint-Victor, croisières et château d\'Essalois pour les sorties associatives.' },
      { nom: 'Vichy et l\'Allier', desc: 'Ville thermale Belle Époque à 1h30 pour les groupes seniors.' },
      { nom: 'L\'Ardèche', desc: 'Gorges, caverne du Pont-d\'Arc et villages de caractère à moins de 2h.' },
    ],
    trajets: [
      'Déplacement de supporters : Geoffroy-Guichard ou stades extérieurs (parking visiteurs)',
      'Navette Saint-Étienne ↔ Lyon (Eurexpo, aéroport Saint-Exupéry, événements)',
      'Sortie scolaire ou associative dans le Pilat et les gorges de la Loire',
      'Pèlerinage vers Le Puy-en-Velay',
    ],
    liensUtiles: [
      "À 50 minutes, la [location d'autocar à Lyon](/location-autocar/lyon) ouvre sur Eurexpo et Saint-Exupéry ; côté massifs, la [location d'autocar dans les Alpes à Grenoble](/location-autocar/grenoble) prend le relais pour les stations. Les clubs peuvent aussi passer par notre page de [location de bus](/location-bus) pour dimensionner le véhicule d'équipe.",
      "Déplacement de supporters à Lyon, sortie dans le Pilat ou séjour au ski : notre guide des [prix d'un autocar avec chauffeur](/blog/prix-location-autocar) vous donne l'ordre de grandeur de chaque trajet. Le [formulaire de devis autocar](/devis-autocar) fait le reste, avec jusqu'à 3 offres sous 24h.",
    ],
    sections: [
      {
        h2: 'L\'année des groupes à Saint-Étienne',
        paragraphes: [
          'Saint-Étienne déplace ses groupes vers la nature et vers Lyon. Au printemps, les écoles partent dans le Pilat et aux gorges de la Loire, et les collèges vers Le Puy-en-Velay et le Puy du Fou ; l\'été, les centres de loisirs et les clubs descendent en Ardèche, au pont d\'Arc et aux gorges, à 1h30. En novembre, la Biennale du design les années paires et la Fête du livre font venir des groupes de toute la région ; de septembre à mai, les Verts à Geoffroy-Guichard mobilisent des navettes de supporters depuis tout le département et des déplacements vers les stades de Ligue.',
          'À 45 minutes de Lyon, Saint-Étienne envoie aussi ses groupes vers Eurexpo, le Groupama Stadium, les concerts de la LDLC Arena et la Fête des Lumières, et reçoit en retour des groupes lyonnais pour le musée d\'art moderne et le Pilat. L\'hiver, les stations du Pilat et du Mézenc accueillent les sorties luge et ski de fond des écoles. Les cars ligériens sont rares les soirs de derby et les week-ends de Biennale.',
        ],
      },
      {
        h2: 'Sorties nature dans le Pilat et en Ardèche : la logistique',
        paragraphes: [
          'Le Pilat est à 30 minutes mais ses routes sont étroites : le Bessat, le Crêt de l\'Œillon et les villages se font en car standard de 12 mètres, pas en grande capacité, et les parkings de départ de randonnée sont limités, le chauffeur dépose puis attend plus bas. L\'Ardèche, à 1h30, se fait en journée longue ou en week-end : le pont d\'Arc a un parking cars, les gorges se descendent en canoë avec des loueurs qui gèrent les groupes, et le car reprend à l\'arrivée en aval.',
          'Pour une classe, prévoyez les pique-niques dans les soutes et de l\'eau à bord ; pour un club, un départ à 7h et un retour à 20h entrent dans la grille de base. Notre guide [organiser une sortie scolaire en autocar](/blog/organiser-sortie-scolaire-autocar) donne la préparation, et [partir au ski en autocar avec un groupe](/blog/autocar-station-de-ski-groupe) couvre les sorties d\'hiver. Au nord, voir [Lyon](/location-autocar/lyon) ; à l\'ouest, [Clermont-Ferrand](/location-autocar/clermont-ferrand).',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Saint-Étienne',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Saint-Étienne : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Saint-Étienne, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 400 €', 'à partir de 450 €', 'à partir de 550 €'],
          ['Journée locale, aller-retour', 'à partir de 700 €', 'à partir de 800 €', 'à partir de 900 €'],
          ['Journée régionale, aller-retour', 'à partir de 1 000 €', 'à partir de 1 100 €', 'à partir de 1 350 €'],
          ['Week-end 2 jours', 'à partir de 1 800 €', 'à partir de 2 000 €', 'Sur devis'],
        ],
      },
      apres: 'Les transporteurs du département appliquent des frais d\'approche d\'environ 10 % : ces prix de départ en tiennent compte. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Saint-Étienne ?',
        a: 'Une journée en autocar standard démarre à 700 € TTC pour un aller-retour local. Un déplacement de supporters se chiffre selon la distance du stade adverse et l\'attente pendant le match. Devis gratuit sous 24h.',
      },
      {
        q: 'Organisez-vous les déplacements de supporters ?',
        a: 'Oui, c\'est une spécialité locale : les transporteurs habitués connaissent les parkings visiteurs, les horaires imposés par les préfectures et les points de regroupement. Indiquez le match et l\'effectif — attention, certains déplacements sont soumis à des arrêtés spécifiques, anticipez.',
      },
      {
        q: 'Peut-on faire une navette régulière vers Lyon pour un événement ?',
        a: 'Oui, la liaison Saint-Étienne ↔ Lyon (50 min) est la plus demandée : salons à Eurexpo, transferts vers l\'aéroport Saint-Exupéry, spectacles. Un aller-retour en soirée est tout à fait courant.',
      },
      {
        q: 'Quel véhicule pour une sortie dans le Pilat ?',
        a: 'Les routes du parc sont accessibles aux autocars standard, mais certains villages perchés se prêtent mieux au minibus. Nous adaptons le véhicule à votre itinéraire précis — mentionnez les étapes dans la demande.',
      },
    ],
  },
  {
    slug: 'strasbourg',
    nom: 'Strasbourg',
    metaTitle: 'Location d\'autocar à Strasbourg avec chauffeur — Devis 24h | Busmoov',
    metaDescription: 'Location d\'autocar et minibus avec chauffeur à Strasbourg : marché de Noël, route des vins d\'Alsace, Europa-Park, Colmar. Devis gratuit sous 24h.',
    h1: 'Location d\'autocar avec chauffeur à Strasbourg',
    sousTitre: 'Marché de Noël, route des vins, Europa-Park : des transporteurs alsaciens vérifiés, un devis gratuit en 24h.',
    intro: [
      'Strasbourg vit deux saisons de groupe très marquées. De fin novembre à Noël, le plus ancien marché de Noël de France attire des cars de toute l\'Europe — les créneaux et les zones de dépose réglementées de la Grande-Île se réservent dès septembre. Au printemps et à l\'automne, place à la route des vins : Obernai, Riquewihr, Ribeauvillé, avec dégustations où le car s\'impose.',
      'Capitale européenne, la ville accueille aussi sessions parlementaires, congrès et délégations — nos transporteurs alsaciens pratiquent les accès du quartier européen au quotidien. Et à 45 minutes côté allemand, Europa-Park est devenu la première destination de groupe de la région, CE et scolaires en tête.',
    ],
    sectionLocale: {
      h2: "Marché de Noël : le dispositif cars de la Grande-Île",
      paragraphes: [
        "Pendant l'Avent, Strasbourg encadre strictement les autocars de tourisme : dépose et reprise sur des zones dédiées en bord de Grande-Île, stationnement reporté sur des parkings périphériques, et un dispositif de sécurité qui évolue chaque année. Concrètement : le car dépose le groupe à quelques minutes à pied des marchés, repart stationner, et revient à l'heure convenue — prévoyez 3 à 4 heures sur place, c'est le format qui marche.",
        "Le reste de l'année, le quartier européen (Parlement, Conseil de l'Europe) offre des accès cars aisés pour les délégations, et la dépose centre-ville se cale place de l'Étoile, aux portes de la vieille ville.",
      ],
    },
    h2Destinations: "Route des vins, Forêt-Noire, Europa-Park : les sorties alsaciennes",
    h2Trajets: "Trajets types à Strasbourg",
    destinations: [
      { nom: 'La route des vins d\'Alsace', desc: 'Obernai, Riquewihr, Ribeauvillé : villages et caves à moins d\'une heure — la sortie œnologique par excellence.' },
      { nom: 'Europa-Park', desc: 'Le premier parc d\'attractions d\'Europe continentale à 45 minutes, côté allemand — CE et scolaires.' },
      { nom: 'Colmar', desc: 'Petite Venise et musée Unterlinden à 45 minutes ; féerique en période de marchés de Noël.' },
      { nom: 'Le mont Sainte-Odile', desc: 'Haut lieu spirituel alsacien et mur païen — pèlerinages et sorties patrimoine.' },
      { nom: 'Le château du Haut-Kœnigsbourg', desc: 'Forteresse restaurée avec parking autocars — l\'incontournable des scolaires.' },
      { nom: 'Baden-Baden et la Forêt-Noire', desc: 'Thermes et paysages allemands à moins d\'une heure pour les sorties transfrontalières.' },
    ],
    trajets: [
      'Transfert gare de Strasbourg ou aéroport d\'Entzheim ↔ hôtels et institutions',
      'Circuit route des vins avec dégustations (mise à disposition à la journée)',
      'Strasbourg → Europa-Park à la journée (CE, scolaires, associations)',
      'Navettes marché de Noël pour groupes (zones de dépose réglementées)',
    ],
    liensUtiles: [
      "En Moselle, à 2 h de route, la [location d'autocar à Metz](/location-autocar/metz) couvre les navettes vers Luxembourg, la Sarre et Verdun.",
      "Depuis l'Alsace, les liaisons longue distance passent souvent par la [location d'autocar à Lyon](/location-autocar/lyon) ou par la capitale — voir la [location d'autocar sur Paris](/location-autocar/paris). Pour budgéter une sortie marché de Noël, notre guide [combien coûte un autocar avec chauffeur ?](/blog/prix-location-autocar) donne les fourchettes réelles.",
    ],
    sections: [
      {
        h2: 'L\'année des groupes à Strasbourg',
        paragraphes: [
          'Décembre écrase tout : du dernier week-end de novembre au 24 décembre, le marché de Noël attire des groupes de toute la France et d\'Europe, et les cars du Bas-Rhin sont réservés dès septembre pour les samedis. Mais Strasbourg déplace des groupes toute l\'année : les sessions du Parlement européen une semaine par mois font venir des lycées et des associations, les séminaires se tiennent au Palais de la Musique et des Congrès de mars à juin et de septembre à novembre, et les sorties scolaires vers le Haut-Kœnigsbourg, Europa-Park et l\'Écomusée d\'Alsace remplissent mai et juin.',
          'L\'été, la route des vins et les villages de Riquewihr, Ribeauvillé et Eguisheim accueillent les comités d\'entreprise et les groupes étrangers ; en septembre et octobre, les vendanges et les fêtes du vin nouveau font les sorties de week-end. Toute la saison, le Racing à la Meinau et la SIG en basket mobilisent des navettes. Entre janvier et mars, les véhicules sont disponibles et les prix au plus bas.',
        ],
      },
      {
        h2: 'Europa-Park et l\'Allemagne : passer le Rhin avec un groupe',
        paragraphes: [
          'Europa-Park est à 45 minutes de Strasbourg, de l\'autre côté du Rhin, avec un parking autocars à l\'entrée du parc et des billets de groupe à réserver. Le car dépose le matin, attend sur le parking ou repart, et reprend le groupe à la fermeture ; pour les soirées d\'été, la fermeture tardive demande un chauffeur reposé ou une amplitude longue. Baden-Baden, Fribourg et la Forêt-Noire sont à moins d\'une heure et se combinent avec une journée en Alsace.',
          'Côté règles, les villes allemandes ont des zones environnementales qui exigent une vignette verte sur le véhicule, et l\'autoroute est gratuite pour les cars de tourisme : nos transporteurs alsaciens y roulent chaque semaine. Notre page [location d\'autocar en Allemagne](/location-autocar-allemagne) détaille le reste. Pour les groupes qui viennent de loin, [Nancy](/location-autocar/nancy) et [Reims](/location-autocar/reims) sont nos bases vers l\'ouest, et le guide [marchés de Noël en autocar](/blog/marches-de-noel-en-autocar) prépare la sortie de décembre.',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Strasbourg',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Strasbourg : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Strasbourg, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 350 €', 'à partir de 400 €', 'à partir de 500 €'],
          ['Journée locale, aller-retour', 'à partir de 600 €', 'à partir de 700 €', 'à partir de 800 €'],
          ['Journée régionale, aller-retour', 'à partir de 900 €', 'à partir de 1 000 €', 'à partir de 1 200 €'],
          ['Week-end 2 jours', 'à partir de 1 600 €', 'à partir de 1 800 €', 'Sur devis'],
        ],
      },
      apres: 'Le département ne porte pas de majoration régionale : ces prix de départ sont ceux de la grille nationale. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Strasbourg ?',
        a: 'Une journée en autocar standard démarre à 700 € TTC pour un aller-retour local. En période de marché de Noël (fin novembre à fin décembre), la demande est très forte : réservez dès septembre-octobre. Devis gratuit sous 24h.',
      },
      {
        q: 'Comment se passe la dépose au marché de Noël de Strasbourg ?',
        a: 'La Grande-Île est piétonne et les autocars utilisent des zones de dépose et parkings relais réglementés en périphérie. Nos transporteurs alsaciens connaissent le dispositif de sécurité mis en place chaque année et calent les horaires en conséquence.',
      },
      {
        q: 'Peut-on aller à Europa-Park en autocar ?',
        a: 'Oui, à 45 minutes de Strasbourg côté allemand — passage de frontière sans formalité, parking autocars dédié au parc. Le car reste sur place et vous repartez à la fermeture. C\'est la sortie CE la plus demandée de la région.',
      },
      {
        q: 'Le circuit route des vins inclut-il les dégustations ?',
        a: 'Le transport oui, les dégustations se réservent auprès des domaines. La formule mise à disposition permet d\'enchaîner 2-3 villages et caves à votre rythme, avec un chauffeur — personne ne conduit au retour, c\'est bien le but.',
      },
    ],
  },
  {
    slug: 'grenoble',
    nom: 'Grenoble',
    metaTitle: 'Location d\'autocar à Grenoble avec chauffeur — Devis 24h | Busmoov',
    metaDescription: 'Location d\'autocar et minibus avec chauffeur à Grenoble : transferts stations de ski, Vercors, Chartreuse, séminaires. Devis gratuit sous 24h.',
    h1: 'Location d\'autocar avec chauffeur à Grenoble',
    sousTitre: 'Transferts stations, Vercors et Chartreuse, séminaires tech : des transporteurs isérois vérifiés, un devis gratuit en 24h.',
    intro: [
      'Capitale des Alpes, Grenoble est cernée de stations : Chamrousse à 30 minutes, les 2 Alpes et l\'Alpe d\'Huez à un peu plus d\'une heure, Villard-de-Lans dans le Vercors à 40 minutes. L\'hiver, nos transporteurs isérois enchaînent les transferts ski — classes de neige, CE, groupes d\'amis — avec véhicules équipés et chauffeurs habitués aux routes de montagne et aux 21 virages de l\'Alpe d\'Huez.',
      'Le reste de l\'année, la ville high-tech (Presqu\'île scientifique, Inovallée) génère séminaires et visites de sites, tandis que Vercors et Chartreuse offrent les sorties nature : plateaux, monastère de la Grande Chartreuse, gorges du Furon. L\'autocar reste le moyen le plus sûr d\'emmener un groupe en altitude.',
    ],
    sectionLocale: {
      h2: "Monter en station depuis Grenoble : ce que gèrent les chauffeurs",
      paragraphes: [
        "Chamrousse se rejoint en 45 minutes par une montée en lacets, l'Oisans (Alpe d'Huez, les 2 Alpes) en 1h15 par la RD1091 le long de la Romanche : deux routes de montagne où la loi Montagne impose pneus hiver ou chaînes du 1er novembre au 31 mars. Les samedis de février, le trafic de l'Oisans se joue avant 8h — les chauffeurs isérois partent tôt et connaissent les créneaux.",
        "Le point de rendez-vous le plus simple pour un groupe est la gare de Grenoble (dépose cars côté Europole) ; pour les journées ski scolaires, le car reste en station et redescend le groupe à 16h30-17h, avant la vague des retours du samedi.",
      ],
    },
    h2Destinations: "Stations, Vercors, Chartreuse : les sorties grenobloises",
    h2Trajets: "Trajets types à Grenoble",
    destinations: [
      { nom: 'Les stations de l\'Oisans', desc: 'Alpe d\'Huez, les 2 Alpes : transferts ski avec soutes à matériel et chauffeurs montagne.' },
      { nom: 'Chamrousse', desc: 'La station de Grenoble à 30 minutes — sorties ski scolaires et journées raquettes.' },
      { nom: 'Le Vercors', desc: 'Villard-de-Lans, gorges de la Bourne, mémorial de la Résistance : nature et histoire à 40 minutes.' },
      { nom: 'La Chartreuse', desc: 'Monastère, caves de liqueur à Voiron et cols mythiques pour les sorties associatives.' },
      { nom: 'Annecy', desc: 'Le lac et la vieille ville à 1h15 : la journée hors Isère la plus demandée.' },
      { nom: 'Le lac de Monteynard', desc: 'Passerelles himalayennes et croisières — la sortie aventure des scolaires et des CE.' },
    ],
    trajets: [
      'Transfert Grenoble ↔ stations (Chamrousse, Alpe d\'Huez, les 2 Alpes, Vercors)',
      'Navette gare de Grenoble ↔ site d\'entreprise ou lieu de séminaire',
      'Classe de neige ou journée ski scolaire avec matériel en soute',
      'Sortie Vercors, Chartreuse ou Annecy à la journée',
    ],
    liensUtiles: [
      "Porte d'entrée des Alpes, Grenoble fonctionne en tandem avec la [location d'autocar à Lyon](/location-autocar/lyon) pour les arrivées TGV et Saint-Exupéry. Du minibus au double étage, notre page de [location de bus avec chauffeur](/location-bus) aide à choisir la bonne taille de véhicule.",
      "Transfert vers les stations, journée en Chartreuse ou classe de neige à la semaine : le [guide des prix de location d'autocar](/blog/prix-location-autocar) détaille les tarifs journée, transfert et séjour. Pour un chiffrage exact depuis Grenoble, demandez votre [devis de bus en ligne](/devis-autocar).",
    ],
    sections: [
      {
        h2: 'L\'année des groupes à Grenoble',
        paragraphes: [
          'À Grenoble, la saison des groupes commence avec la neige : de décembre à mars, les classes de neige, les sorties ski des écoles le mercredi et les transferts de clubs vers l\'Oisans, Chamrousse et les Sept Laux occupent les cars isérois tous les jours. Le printemps enchaîne avec les classes vertes dans le Vercors et la Chartreuse et les sorties scolaires au musée de Grenoble et à la Bastille ; l\'été, les clubs de randonnée et les colonies montent aux cols et aux lacs.',
          'Grenoble est aussi une ville de science et d\'industrie : les laboratoires du polygone scientifique, le CEA et les entreprises de la vallée organisent des séminaires et des visites de sites toute l\'année, avec des transferts depuis la gare et les aéroports de Lyon Saint-Exupéry et de Grenoble-Isère. De septembre à juin, le GF38 et les Brûleurs de Loups en hockey mobilisent des navettes, et la Fête des Lumières de Lyon, à une heure, fait une soirée de groupe en décembre.',
        ],
      },
      {
        h2: 'Classe de neige depuis Grenoble : le déroulé qui marche',
        paragraphes: [
          'Chamrousse est à 45 minutes, les Deux Alpes et l\'Alpe d\'Huez à 1h15, Villard-de-Lans à 45 minutes : depuis Grenoble, une classe de neige se fait à la journée ou en séjour sans longue route. Pour une sortie à la journée, départ à 8h, arrivée en station à 9h avant l\'ouverture des remontées, retour à 17h avant la descente des skieurs du week-end ; les cars isérois ont les équipements hiver obligatoires et les chauffeurs connaissent les routes de l\'Oisans en cas de chute de neige.',
          'Précisez le nombre d\'enfants et d\'accompagnateurs, les skis à transporter et l\'heure réelle de fin de journée en station : le transporteur choisit un car à soutes à skis et cale l\'amplitude. Nos guides [partir au ski en autocar avec un groupe](/blog/autocar-station-de-ski-groupe) et [organiser une sortie scolaire en autocar](/blog/organiser-sortie-scolaire-autocar) détaillent la préparation. Au nord, [Lyon](/location-autocar/lyon) est notre base pour les aéroports ; à l\'ouest, [Saint-Étienne](/location-autocar/saint-etienne).',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Grenoble',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Grenoble : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Grenoble, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 400 €', 'à partir de 450 €', 'à partir de 550 €'],
          ['Journée locale, aller-retour', 'à partir de 700 €', 'à partir de 800 €', 'à partir de 900 €'],
          ['Journée régionale, aller-retour', 'à partir de 1 000 €', 'à partir de 1 100 €', 'à partir de 1 350 €'],
          ['Week-end 2 jours', 'à partir de 1 800 €', 'à partir de 2 000 €', 'Sur devis'],
        ],
      },
      apres: 'Les transporteurs du département appliquent des frais d\'approche d\'environ 10 % : ces prix de départ en tiennent compte. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Grenoble ?',
        a: 'Une journée en autocar standard démarre à 700 € TTC pour un aller-retour local. Un transfert station se chiffre selon la distance et la saison — les samedis de vacances de février sont les créneaux les plus tendus de l\'année. Devis gratuit sous 24h.',
      },
      {
        q: 'Les cars sont-ils équipés pour la montagne ?',
        a: 'Oui : pneus hiver et chaînes pendant la saison (obligation loi Montagne), soutes adaptées au matériel de ski, chauffeurs habitués aux routes d\'altitude — y compris les 21 virages de l\'Alpe d\'Huez et la montée de Chamrousse.',
      },
      {
        q: 'Comment organiser une journée ski scolaire au départ de Grenoble ?',
        a: 'Chamrousse ou Villard-de-Lans sont les destinations types : départ 8h, retour 17h, amplitude raisonnable et coût maîtrisé. Le car reste en station pendant la journée. Véhicules aux normes transport d\'enfants, comptez les accompagnateurs dans l\'effectif.',
      },
      {
        q: 'Faut-il réserver longtemps à l\'avance pour un transfert ski ?',
        a: 'Pour un samedi de vacances scolaires d\'hiver, oui : 2 à 3 mois à l\'avance. Hors vacances et en semaine, quelques semaines suffisent et les tarifs sont plus doux.',
      },
    ],
  },
  {
    slug: 'versailles',
    nom: 'Versailles',
    metaTitle: 'Location d\'autocar à Versailles avec chauffeur — Devis 24h | Busmoov',
    metaDescription: 'Autocar et minibus avec chauffeur à Versailles et dans les Yvelines : dépose au château, sorties scolaires, séminaires. Devis gratuit sous 24h.',
    h1: 'Location d\'autocar avec chauffeur à Versailles',
    sousTitre: 'Dépose au château, sorties scolaires, séminaires dans les Yvelines : des transporteurs de l\'ouest francilien vérifiés, un devis gratuit en 24h.',
    intro: [
      'Versailles est la première destination de groupe de France : huit millions de visiteurs par an au château, dont une part énorme arrive en autocar. Écoles franciliennes, groupes étrangers, séminaires — nos transporteurs de l\'ouest parisien font la rotation Paris ↔ Versailles toutes les semaines et connaissent le rituel de la place d\'Armes par cœur.',
      'Mais les Yvelines ne se résument pas au château : congrès au Palais des Congrès de Versailles, grandes écoles et sièges d\'entreprise de Vélizy à Saint-Quentin-en-Yvelines, vallée de Chevreuse pour les séminaires au vert. Un autocar basé dans le département évite les frais d\'approche depuis Paris.',
    ],
    sectionLocale: {
      h2: 'Déposer un groupe au château de Versailles, mode d\'emploi',
      paragraphes: [
        'Le parking autocars officiel se trouve place d\'Armes, face au château : dépose du groupe, stationnement payant à la journée, et le chauffeur reste à proximité. Les matins de haute saison (avril-octobre), visez une arrivée avant 9h30 — la file des cars s\'allonge vite, et les créneaux de visite réservés n\'attendent pas.',
        'Les jours de Grandes Eaux Musicales (week-ends d\'été), l\'affluence double : réservez le créneau de visite et le car ensemble, et prévoyez le pique-nique en soute pour les scolaires — les pelouses côté pièce d\'eau des Suisses sont l\'option classique. Pour Trianon et le Hameau, la dépose se fait aux grilles de la Reine, à préciser dans la demande.',
      ],
    },
    h2Destinations: 'Autour de Versailles : les sorties des groupes yvelinois',
    h2Trajets: 'Trajets types à Versailles',
    liensUtiles: [
      'Les groupes parisiens qui visitent le château passent par notre page [location d\'autocar à Paris](/location-autocar/paris) — 45 minutes de trajet ; pour l\'ensemble de la région, voyez la [location d\'autocar en Île-de-France](/location-autocar-ile-de-france). Et pour une classe, notre guide de la [sortie scolaire en autocar](/blog/organiser-sortie-scolaire-autocar) détaille l\'encadrement.',
      "Un aller-retour Paris → Versailles ou une journée château et jardins relève de la tranche locale de notre guide des [prix de location d'autocar](/blog/prix-location-autocar) ; le [bus 50 places](/location-bus-50-places), format le plus demandé pour les visites de groupe, a sa page tarifs dédiée.",
    ],
    destinations: [
      { nom: 'Le château et Trianon', desc: 'La visite de groupe par excellence — dépose place d\'Armes ou grilles de la Reine, créneaux réservés.' },
      { nom: 'Paris', desc: 'À 45 minutes : musées et spectacles en complément du château pour les groupes en séjour.' },
      { nom: 'La vallée de Chevreuse', desc: 'Abbayes, châteaux de Breteuil et de Dampierre : séminaires au vert et sorties seniors.' },
      { nom: 'Rambouillet', desc: 'Château, bergerie nationale et forêt — le classique des sorties scolaires yvelinoises.' },
      { nom: 'France Miniature et Thoiry', desc: 'Les deux sorties familiales du département, à 20-30 minutes.' },
      { nom: 'Giverny', desc: 'Les jardins de Monet à une heure — souvent combinés avec Versailles pour les groupes étrangers.' },
    ],
    trajets: [
      'Transfert Paris ↔ Versailles pour un groupe avec créneau de visite',
      'Sortie scolaire francilienne au château (dépose place d\'Armes)',
      'Navette séminaire : hôtels de Versailles ↔ Palais des Congrès ou site d\'entreprise',
      'Circuit Versailles + Giverny ou vallée de Chevreuse à la journée',
    ],
    sections: [
      {
        h2: 'L\'année des groupes à Versailles',
        paragraphes: [
          'Le château donne le rythme : d\'avril à octobre, les Grandes Eaux musicales les week-ends et les Jardins musicaux en semaine attirent des groupes du monde entier, et les cars déposent et reprennent à la file sur l\'avenue de Paris. Mai et juin sont les mois des sorties scolaires, avec des classes venues de toute la France et des créneaux de visite à réserver des semaines à l\'avance ; les samedis d\'été, les Grandes Eaux nocturnes et leurs feux d\'artifice font des soirées de groupe avec retour tardif.',
          'En dehors du château, Versailles reçoit des séminaires dans ses hôtels et au Palais des Congrès, des groupes de seniors pour le marché Notre-Dame et le potager du Roi, et des sorties vers la vallée de Chevreuse et Rambouillet. L\'hiver, le château se visite au calme et les comités d\'entreprise y organisent leurs sorties de décembre ; les cars des Yvelines sont disponibles de novembre à mars, saturés les samedis de mai et de juin.',
        ],
      },
      {
        h2: 'Versailles depuis la province : TGV, autocar et journée complète',
        paragraphes: [
          'Beaucoup de groupes de province viennent à Versailles pour la journée : TGV jusqu\'à Paris, puis un car qui attend à la gare et emmène le groupe au château, le ramène le soir. Depuis Montparnasse ou la gare de Lyon, comptez 45 minutes à une heure hors pointe ; un car à disposition pour la journée évite le RER avec 50 personnes et leurs sacs. Le format inverse existe aussi : des groupes logés à Versailles, moins cher que Paris, qui partent chaque matin en car vers la capitale.',
          'Pour une classe, la visite du château se combine avec le Trianon ou les jardins, et le déjeuner se prend dans le parc ou dans un restaurant de groupe de la ville ; le car stationne au parking cars de la place d\'Armes et reprend à l\'heure convenue. Notre comparatif [train ou autocar pour un groupe](/blog/autocar-ou-train-groupe) chiffre le montage, et nos pages [autocar à Paris](/location-autocar/paris) et [location d\'autocar en Île-de-France](/location-autocar-ile-de-france) couvrent le reste de la région.',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Versailles',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Versailles : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Versailles, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 350 €', 'à partir de 400 €', 'à partir de 500 €'],
          ['Journée locale, aller-retour', 'à partir de 600 €', 'à partir de 700 €', 'à partir de 800 €'],
          ['Journée régionale, aller-retour', 'à partir de 900 €', 'à partir de 1 000 €', 'à partir de 1 200 €'],
          ['Week-end 2 jours', 'à partir de 1 600 €', 'à partir de 1 800 €', 'Sur devis'],
        ],
      },
      apres: 'Le département ne porte pas de majoration régionale : ces prix de départ sont ceux de la grille nationale. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte un autocar pour visiter Versailles ?',
        a: 'Depuis Paris ou l\'Île-de-France, l\'aller-retour à la journée en autocar standard démarre à 700 € TTC, stationnement place d\'Armes en sus (tarif journalier du parking cars). Devis gratuit sous 24h.',
      },
      {
        q: 'Le car peut-il rester sur place pendant la visite ?',
        a: 'Oui, c\'est le fonctionnement normal : dépose du groupe, stationnement au parking autocars de la place d\'Armes, et le chauffeur vous reprend à l\'heure convenue. Pour une visite Trianon en complément, le car fait la navette interne.',
      },
      {
        q: 'Faut-il réserver le créneau du château avant le car ?',
        a: 'Réservez les deux ensemble : le créneau de visite fixe l\'horaire de dépose, et les matins de haute saison se jouent à 30 minutes près. Nos transporteurs habitués calent le départ en conséquence.',
      },
      {
        q: 'Desservez-vous les communes autour de Versailles ?',
        a: 'Oui : Saint-Quentin-en-Yvelines, Vélizy, Le Chesnay, Saint-Germain-en-Laye… tout l\'ouest francilien. Le point de prise en charge est libre — adresse, gare ou parking.',
      },
    ],
  },
  {
    slug: 'saint-denis',
    nom: 'Saint-Denis',
    metaTitle: 'Location d\'autocar à Saint-Denis avec chauffeur — Devis 24h | Busmoov',
    metaDescription: 'Autocar et minibus avec chauffeur à Saint-Denis : Stade de France (matchs, concerts), basilique, CDG à 15 minutes. Devis gratuit sous 24h.',
    h1: 'Location d\'autocar avec chauffeur à Saint-Denis',
    sousTitre: 'Stade de France, concerts, basilique royale, CDG à un quart d\'heure : des transporteurs du nord francilien vérifiés, un devis gratuit en 24h.',
    intro: [
      'Saint-Denis abrite le plus gros générateur de transport de groupe d\'Île-de-France : le Stade de France. Matchs du XV et des Bleus, finales, concerts géants — chaque événement déplace des centaines de cars de supporters, de comités d\'entreprise et de groupes d\'amis venus de toute la France. Nos transporteurs du nord parisien en font leur quotidien.',
      'La ville a aussi ses trésors propres — la basilique cathédrale, nécropole des rois de France, très demandée par les scolaires et les groupes culturels — et un atout logistique : l\'aéroport de Roissy à quinze minutes par l\'A1, qui fait de Saint-Denis une base naturelle pour les groupes en transit.',
    ],
    sectionLocale: {
      h2: 'Jour de match ou de concert au Stade de France',
      paragraphes: [
        'Les grands événements déclenchent un dispositif spécifique : parkings autocars réservés autour du stade (à prébooker pour les grosses affiches), axes coupés à la sortie, et une évacuation qui prend du temps — comptez 45 minutes à 1 heure entre le coup de sifflet final et le départ réel du car. Les chauffeurs habitués arrivent 2 heures avant l\'événement et donnent au groupe un point de regroupement précis pour le retour.',
        'Pour les concerts qui finissent tard, vérifiez l\'amplitude : un aller-retour depuis la province avec retour à 2h du matin peut imposer un second chauffeur (quelques centaines d\'euros) — nos devis l\'intègrent d\'office quand c\'est le cas, pas de surprise au retour.',
      ],
    },
    h2Destinations: 'Depuis Saint-Denis : événements et patrimoine du nord francilien',
    h2Trajets: 'Trajets types à Saint-Denis',
    liensUtiles: [
      'Pour un vol de groupe, notre [navette aéroport CDG](/navette-aeroport-cdg) part de Saint-Denis en un quart d\'heure ; côté capitale, voyez la [location d\'autocar sur Paris](/location-autocar/paris) et, pour toute la région, la [location d\'autocar en Île-de-France](/location-autocar-ile-de-france).',
      "Navette vers le Stade de France, transfert CDG ou sortie scolaire en Seine-Saint-Denis : les fourchettes par formule sont dans notre guide [combien coûte un autocar avec chauffeur](/blog/prix-location-autocar). Décrivez votre besoin dans notre [devis autocar en ligne](/devis-autocar) : jusqu'à 3 propositions sous 24h.",
    ],
    destinations: [
      { nom: 'Le Stade de France', desc: 'Matchs, finales et concerts : navettes supporters et groupes depuis toute la France, parkings cars réservés.' },
      { nom: 'La basilique Saint-Denis', desc: 'La nécropole des rois — sortie scolaire et culturelle de référence du 93.' },
      { nom: 'Paris', desc: 'À 20 minutes : musées, spectacles et soirées pour compléter un événement au stade.' },
      { nom: 'Le Parc Astérix', desc: 'À 30 minutes par l\'A1 : la sortie CE et scolaire du nord francilien.' },
      { nom: 'Roissy CDG', desc: 'L\'aéroport à 15 minutes — transferts de groupes au départ ou à l\'arrivée.' },
      { nom: 'Chantilly', desc: 'Château, grandes écuries et hippodrome à 25 minutes pour les sorties patrimoine.' },
    ],
    trajets: [
      'Navette supporters ou CE vers le Stade de France (match, concert), attente incluse',
      'Transfert Saint-Denis ↔ aéroport CDG pour un groupe',
      'Sortie scolaire basilique + Stade de France (visites combinées)',
      'Saint-Denis → Parc Astérix ou Chantilly à la journée',
    ],
    sections: [
      {
        h2: 'L\'année des groupes à Saint-Denis',
        paragraphes: [
          'Le Stade de France fait le calendrier : les matchs du XV de France en février-mars et en novembre, la finale du Top 14 en juin, la Coupe de France en mai, puis les grands concerts de juin à septembre, parfois deux soirs de suite. Chaque date déplace des centaines de cars de supporters et de spectateurs venus de toute la France, avec un dispositif de stationnement imposé par la préfecture et des retours de nuit qui se préparent.',
          'En dehors du stade, Saint-Denis reçoit des groupes scolaires pour la basilique et les tombeaux des rois, des congressistes pour les hôtels de la Plaine, et sert de base aux groupes qui visitent Paris : les hôtels de la Plaine Saint-Denis sont moins chers que ceux de la capitale, et un car les relie au centre en 30 minutes hors pointe. L\'automne et le printemps sont les saisons des séminaires ; les cars franciliens manquent les soirs de match et de concert.',
        ],
      },
      {
        h2: 'Roissy, Paris, Parc Astérix : Saint-Denis comme base de groupe',
        paragraphes: [
          'À 20 minutes de Roissy par l\'A1 hors pointe et à 30 minutes du centre de Paris, Saint-Denis est une base pratique pour un groupe qui arrive par avion et visite la capitale sur plusieurs jours : transfert aéroport-hôtel le premier jour, car à disposition pour les journées à Paris, transfert retour. Le Parc Astérix est à 30 minutes au nord, Chantilly à 35, et le Musée de l\'Air du Bourget à 15 : des sorties de groupe qui se combinent avec le séjour.',
          'Le matin, l\'A1 vers Paris est saturée de 7h30 à 9h30 : un départ à 9h45 fait gagner une demi-heure ; le soir, la sortie de Paris est bouchée de 17h à 19h30. Nos pages [navette aéroport Roissy CDG](/navette-aeroport-cdg) et [autocar à Paris](/location-autocar/paris) détaillent les transferts, et le guide [organiser un transfert aéroport pour un groupe](/blog/transfert-aeroport-groupe-mode-emploi) donne la checklist. Pour les concerts et matchs, [aller à un festival en bus](/blog/aller-a-un-festival-en-bus) reprend les règles de retour de nuit.',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Saint-Denis',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Saint-Denis : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Saint-Denis, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 350 €', 'à partir de 400 €', 'à partir de 500 €'],
          ['Journée locale, aller-retour', 'à partir de 600 €', 'à partir de 700 €', 'à partir de 800 €'],
          ['Journée régionale, aller-retour', 'à partir de 900 €', 'à partir de 1 000 €', 'à partir de 1 200 €'],
          ['Week-end 2 jours', 'à partir de 1 600 €', 'à partir de 1 800 €', 'Sur devis'],
        ],
      },
      apres: 'Le département ne porte pas de majoration régionale : ces prix de départ sont ceux de la grille nationale. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte un car pour un match au Stade de France ?',
        a: 'Depuis l\'Île-de-France, l\'aller-retour en soirée avec attente pendant le match démarre autour de 800 € TTC en autocar standard. Depuis la province, le prix suit la distance et l\'amplitude — devis gratuit sous 24h avec le parking événement inclus quand il est réservable.',
      },
      {
        q: 'Le car peut-il stationner près du stade pendant l\'événement ?',
        a: 'Oui, sur les parkings autocars dédiés — mais pour les grosses affiches ils se réservent à l\'avance. Indiquez l\'événement exact dans votre demande : le transporteur gère la réservation du parking avec le billet d\'accès car.',
      },
      {
        q: 'Gérez-vous les retours tardifs après concert ?',
        a: 'C\'est la norme au Stade de France : sorties vers 23h30-minuit, évacuation lente, retours à 1h ou 2h. L\'amplitude est calculée honnêtement dès le devis, second chauffeur compris si nécessaire.',
      },
      {
        q: 'Peut-on combiner visite de la basilique et match le même jour ?',
        a: 'Très bien même : visite culturelle l\'après-midi, restaurant, puis le stade — le car reste avec le groupe toute la journée en mise à disposition.',
      },
    ],
  },
  {
    slug: 'nice',
    nom: 'Nice',
    metaTitle: 'Location d\'autocar à Nice avec chauffeur — Devis 24h | Busmoov',
    metaDescription: 'Autocar et minibus avec chauffeur à Nice et sur la Côte d\'Azur : Monaco, Cannes, villages perchés, congrès, croisières. Devis gratuit sous 24h.',
    h1: 'Location d\'autocar avec chauffeur à Nice',
    sousTitre: 'Congrès, croisières, Monaco et villages perchés : des autocaristes azuréens vérifiés, un devis gratuit en 24h.',
    intro: [
      'Deuxième aéroport de France, premier littoral touristique, et un chapelet de destinations mythiques à moins d\'une heure : Nice est une machine à groupes. Congrès et séminaires sur la Promenade, incentives dans les villages perchés, croisiéristes débarqués à Villefranche, supporters de l\'Allianz Riviera — nos transporteurs azuréens couvrent tout l\'arc entre Cannes et la frontière italienne.',
      'La spécificité locale, c\'est la géographie : une bande côtière étroite, des routes en corniche et une circulation dense l\'été. Les chauffeurs du cru connaissent les trois corniches, les accès de Monaco et les créneaux qui passent — un savoir qui vaut de l\'or un vendredi d\'août.',
    ],
    sectionLocale: {
      h2: 'Circuler en car sur la Côte d\'Azur : ce que gèrent les chauffeurs',
      paragraphes: [
        'La Promenade des Anglais encadre strictement les autocars de tourisme : zones de dépose dédiées, stationnement reporté vers le port et l\'ouest de la ville. Pour Monaco, les cars empruntent des accès et parkings imposés (les parkings des Pêcheurs ou de la Colle) avec navettes internes — on ne dépose pas un groupe devant le casino. Èze, Saint-Paul-de-Vence et les villages perchés se visitent depuis des parkings en contrebas, à quelques minutes à pied.',
        'L\'été et pendant les grands événements (Grand Prix de Monaco en mai, festival de Cannes), les temps de trajet doublent sur la bande côtière : les transporteurs locaux partent plus tôt, passent par le moyen pays quand il le faut, et savent quels créneaux éviter. C\'est exactement ce qu\'on achète avec un chauffeur du cru.',
      ],
    },
    h2Destinations: 'De Menton à Cannes : les sorties des groupes azuréens',
    h2Trajets: 'Trajets types à Nice',
    liensUtiles: [
      'Sur l\'arc méditerranéen, nous couvrons aussi la [location d\'autocar à Marseille](/location-autocar/marseille) — transferts croisières compris — et la [location d\'autocar à Montpellier](/location-autocar/montpellier). Pour un groupe qui atterrit à Nice-Côte d\'Azur, le fonctionnement des [transferts aéroport en groupe](/services/transfert-aeroport) est détaillé sur notre page service.',
      "Transfert aéroport Nice Côte d'Azur, journée à Monaco ou excursion dans l'arrière-pays : notre guide des [tarifs d'un autocar avec chauffeur](/blog/prix-location-autocar) donne les prix par distance, avec la majoration de haute saison estivale. Demandez ensuite votre [devis autocar](/devis-autocar) : jusqu'à 3 offres azuréennes sous 24h.",
    ],
    destinations: [
      { nom: 'Monaco', desc: 'Rocher, casino et musée océanographique à 30 minutes — parkings cars imposés, chauffeurs rodés au protocole.' },
      { nom: 'Èze et les corniches', desc: 'Le village perché iconique entre mer et ciel, sur la Moyenne Corniche.' },
      { nom: 'Saint-Paul-de-Vence', desc: 'Remparts, Fondation Maeght : la sortie culture et art de la Côte.' },
      { nom: 'Cannes et Antibes', desc: 'Croisette, vieux port et Picasso — l\'ouest azuréen à 45 minutes.' },
      { nom: 'Menton et l\'Italie', desc: 'Fête du citron, marché de Vintimille : la sortie transfrontalière du samedi.' },
      { nom: 'Les gorges du Verdon', desc: 'La grande excursion nature à 2h — journée longue, très demandée l\'été.' },
    ],
    trajets: [
      'Transfert aéroport Nice-Côte d\'Azur ↔ hôtels pour congrès et séminaires',
      'Excursion croisiéristes depuis Villefranche ou le port de Nice (Monaco, Èze, Saint-Paul)',
      'Navette soirée : dîner à Monaco ou Cannes avec retour de nuit',
      'Circuit villages perchés à la journée en mise à disposition',
    ],
    sections: [
      {
        h2: 'L\'année des groupes à Nice',
        paragraphes: [
          'La Côte d\'Azur n\'a pas de morte-saison, mais des temps forts. Février est celui du carnaval de Nice et de la Fête du citron à Menton, qui attirent des groupes de seniors et de comités d\'entreprise de toute la France ; mai est celui du Festival de Cannes et du Grand Prix de Monaco, où les transferts entre l\'aéroport, les hôtels et les sites se réservent des mois à l\'avance ; de mai à octobre, les croisiéristes débarquent à Villefranche et à Nice et partent en excursion vers Èze, Monaco et Saint-Paul-de-Vence.',
          'L\'été, Jazz à Juan et les Nuits du Sud de Vence font les soirées ; septembre et octobre sont les meilleurs mois pour les séminaires, avec des hôtels disponibles et une mer encore chaude. Toute la saison, l\'OGC Nice à l\'Allianz Riviera mobilise des navettes de supporters, et l\'aéroport, deuxième de France, génère des transferts de groupe chaque jour. Les cars des Alpes-Maritimes manquent en mai et pendant le carnaval.',
        ],
      },
      {
        h2: 'Aéroport de Nice, Monaco, Italie : les transferts de groupe sur la Côte',
        paragraphes: [
          'L\'aéroport de Nice est à 15 minutes du centre, avec des zones autocars devant chaque terminal : le chauffeur suit le numéro de vol et attend en zone cars. Monaco est à 30 minutes par la basse corniche, 20 par l\'autoroute, et la Principauté impose aux cars une réservation de créneau et un stationnement souterrain : nos transporteurs gèrent la formalité, mais prévenez-les de la date dès la demande de devis. Menton et Vintimille, en Italie, sont à 45 minutes, sans frontière mais avec des péages italiens et des zones à trafic limité dans les centres.',
          'Pour une excursion de croisiéristes, le timing se cale sur l\'heure de retour à bord, avec une marge d\'une heure sur la Côte en été ; pour un séminaire, les transferts entre Nice, Cannes et Monaco se font en minibus ou en car selon le nombre. Notre page [location d\'autocar en Italie](/location-autocar-italie) couvre la suite vers Gênes et San Remo, et [Marseille](/location-autocar/marseille) est notre autre base provençale. Le guide [organiser un transfert aéroport pour un groupe](/blog/transfert-aeroport-groupe-mode-emploi) donne la checklist.',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Nice',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Nice : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Nice, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 350 €', 'à partir de 400 €', 'à partir de 500 €'],
          ['Journée locale, aller-retour', 'à partir de 600 €', 'à partir de 700 €', 'à partir de 800 €'],
          ['Journée régionale, aller-retour', 'à partir de 900 €', 'à partir de 1 000 €', 'à partir de 1 200 €'],
          ['Week-end 2 jours', 'à partir de 1 600 €', 'à partir de 1 800 €', 'Sur devis'],
        ],
      },
      apres: 'Le département ne porte pas de majoration régionale : ces prix de départ sont ceux de la grille nationale. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Nice ?',
        a: 'Une journée en autocar standard démarre à 700 € TTC pour un circuit local. L\'été et pendant le Grand Prix de Monaco ou le festival de Cannes, réservez très tôt : la Côte d\'Azur est la zone la plus tendue de France sur ces semaines-là.',
      },
      {
        q: 'Peut-on entrer dans Monaco en autocar ?',
        a: 'Oui, via les accès et parkings autocars imposés par la Principauté, avec navettes ou marche vers le Rocher. Aucune formalité de frontière. Pendant le Grand Prix, le dispositif change complètement — dites-le dès la demande.',
      },
      {
        q: 'Gérez-vous les excursions pour croisiéristes ?',
        a: 'Oui : prise en charge au débarcadère de Villefranche (tender) ou au port de Nice, circuit calé sur les horaires du navire, retour garanti avant le rembarquement. Donnez le nom du bateau et la compagnie.',
      },
      {
        q: 'Un minibus n\'est-il pas plus adapté aux villages perchés ?',
        a: 'Souvent, oui : pour Èze village ou Sainte-Agnès, un minibus 20 places monte plus près que le grand car. Nous composons la bonne formule selon l\'itinéraire — parfois un car pour la côte et un minibus pour l\'étape perchée.',
      },
    ],
  },
  {
    slug: 'rennes',
    nom: 'Rennes',
    metaTitle: 'Location d\'autocar à Rennes avec chauffeur — Devis 24h | Busmoov',
    metaDescription: 'Autocar et minibus avec chauffeur à Rennes : Mont Saint-Michel, Saint-Malo, Brocéliande, événements bretons. Devis gratuit sous 24h.',
    h1: 'Location d\'autocar avec chauffeur à Rennes',
    sousTitre: 'Mont Saint-Michel, Saint-Malo, Brocéliande : la porte de la Bretagne pour vos groupes — transporteurs bretilliens vérifiés, devis gratuit en 24h.',
    intro: [
      'Capitale bretonne et ville étudiante majeure, Rennes est surtout une base de départ exceptionnelle : le Mont Saint-Michel à une heure, Saint-Malo à quarante-cinq minutes, la forêt de Brocéliande à trente — trois destinations de rêve pour les CE, les associations et les scolaires, toutes accessibles à la journée.',
      'La ville elle-même génère son flux : matchs au Roazhon Park, Transmusicales en décembre, congrès au Couvent des Jacobins, et un tissu d\'entreprises tech qui déplace ses équipes. Nos transporteurs d\'Ille-et-Vilaine couvrent le tout, du minibus au grand tourisme.',
    ],
    sectionLocale: {
      h2: 'Le combo breton : Mont Saint-Michel et Saint-Malo dans la même journée',
      paragraphes: [
        'C\'est LE circuit demandé au départ de Rennes : le Mont le matin (arrivée avant 10h pour éviter la marée humaine estivale), dépose au parking continental puis navettes officielles ou 35 minutes de marche vers l\'abbaye — le car ne va pas au pied du Mont, personne n\'y va. Déjeuner, puis Saint-Malo l\'après-midi : intra-muros par la porte Saint-Vincent, le car stationne aux parkings cars de l\'esplanade.',
        'Le timing tient dans une amplitude normale de chauffeur, à condition de partir vers 8h. Pour les grandes marées (spectaculaires au Mont), vérifiez les horaires : certaines submersions du passage ferment temporairement les navettes — les transporteurs locaux ont le calendrier.',
      ],
    },
    h2Destinations: 'Mont, côte et forêt : les excursions des groupes rennais',
    h2Trajets: 'Trajets types à Rennes',
    liensUtiles: [
      'Dans le grand Ouest, nous couvrons aussi la [location d\'autocar à Nantes](/location-autocar/nantes) — Puy du Fou compris — et, pour un événement d\'entreprise, notre page [navette d\'entreprise](/navette-entreprise) détaille les formats. Budget : voir le [guide des prix de location d\'autocar](/blog/prix-location-autocar).',
    ],
    destinations: [
      { nom: 'Le Mont Saint-Michel', desc: 'À 1h de route : parking continental, navettes vers l\'abbaye — la merveille se mérite à pied.' },
      { nom: 'Saint-Malo et Dinard', desc: 'Remparts, plages et Émeraude à 45 minutes : la journée iodée classique.' },
      { nom: 'Brocéliande', desc: 'Forêt de légendes à 30 minutes — la sortie scolaire et famille de référence.' },
      { nom: 'Cancale et la côte', desc: 'Huîtres face au Mont : la sortie gourmande des CE et des associations.' },
      { nom: 'Dinan', desc: 'Cité médiévale sur la Rance à 50 minutes, souvent combinée avec Saint-Malo.' },
      { nom: 'Le golfe du Morbihan', desc: 'Vannes et les embarquements pour les îles à 1h30 — la grande journée sud-Bretagne.' },
    ],
    trajets: [
      'Rennes → Mont Saint-Michel (et retour ou combo Saint-Malo) à la journée',
      'Navette match au Roazhon Park ou événement au Couvent des Jacobins',
      'Transfert gare de Rennes ↔ site d\'entreprise ou lieu de séminaire',
      'Sortie scolaire Brocéliande ou Dinan',
    ],
    sections: [
      {
        h2: 'L\'année des groupes à Rennes',
        paragraphes: [
          'Le printemps est la saison des scolaires : d\'avril à juin, les écoles bretonnes et normandes partent au Mont Saint-Michel, à Saint-Malo et à Brocéliande, et les cars de 50 places sont pris tous les jours de semaine. L\'été, les comités d\'entreprise et les associations descendent sur la côte d\'Émeraude et au golfe du Morbihan, et les festivals font les soirées : les Tombées de la nuit à Rennes en juillet, le Festival interceltique de Lorient en août, et les Vieilles Charrues à Carhaix mi-juillet, où les groupes rennais arrivent en bus avec tentes et glacières.',
          'Septembre est le mois des week-ends d\'intégration des écoles rennaises, octobre celui des congrès au Couvent des Jacobins, et décembre celui des Transmusicales et des marchés de Noël. Toute la saison, le Stade rennais au Roazhon Park mobilise des navettes de supporters, et les entreprises de la technopole organisent leurs séminaires sur la côte. Les cars d\'Ille-et-Vilaine manquent les samedis de juin et le week-end des Vieilles Charrues.',
        ],
      },
      {
        h2: 'Festivals et grandes marées : le conseil du transporteur breton',
        paragraphes: [
          'Un groupe qui part aux Vieilles Charrues depuis Rennes fait 1h45 de route et revient le dimanche ou le lundi : le car dépose au parking cars du festival, à distance du site, et reprend à l\'heure convenue, avec un responsable joignable. Pour une soirée au Festival interceltique ou aux Transmusicales, le retour se fait après le dernier concert, avec un second chauffeur si la journée dépasse 12 heures ; notre guide [aller à un festival en bus](/blog/aller-a-un-festival-en-bus) détaille les règles.',
          'Pour le Mont Saint-Michel, consultez le calendrier des grandes marées avant de fixer la date : les jours de fort coefficient, la passerelle ferme quelques heures autour de la pleine mer, et la vue vaut le déplacement. Pour Saint-Malo, les parkings cars de l\'esplanade sont pleins dès 11h en juillet : arrivez à 10h. Au sud, nous couvrons [Nantes](/location-autocar/nantes) et le Puy du Fou ; à l\'est, [Le Mans](/location-autocar/le-mans). Pour une classe, voir [organiser une sortie scolaire en autocar](/blog/organiser-sortie-scolaire-autocar).',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Rennes',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Rennes : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Rennes, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 400 €', 'à partir de 450 €', 'à partir de 550 €'],
          ['Journée locale, aller-retour', 'à partir de 700 €', 'à partir de 800 €', 'à partir de 900 €'],
          ['Journée régionale, aller-retour', 'à partir de 1 000 €', 'à partir de 1 100 €', 'à partir de 1 350 €'],
          ['Week-end 2 jours', 'à partir de 1 800 €', 'à partir de 2 000 €', 'Sur devis'],
        ],
      },
      apres: 'Les transporteurs du département appliquent des frais d\'approche d\'environ 10 % : ces prix de départ en tiennent compte. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Rennes ?',
        a: 'Une journée en autocar standard démarre à 700 € TTC ; le circuit Mont Saint-Michel + Saint-Malo se chiffre selon l\'amplitude. À noter : l\'Ille-et-Vilaine fait partie des zones bretonnes où les prix sont légèrement plus élevés qu\'ailleurs — la mise en concurrence de plusieurs transporteurs y est d\'autant plus utile.',
      },
      {
        q: 'Le car peut-il monter jusqu\'au Mont Saint-Michel ?',
        a: 'Non, personne : tous les véhicules s\'arrêtent au parking continental, puis navettes officielles gratuites ou 35 minutes à pied par la passerelle. Prévoyez ce temps dans le planning — et des chaussures confortables pour le groupe.',
      },
      {
        q: 'Gérez-vous les navettes pour les Transmusicales ?',
        a: 'Oui, en décembre les rotations vers le parc expo de Rennes aéroport sont un classique — retours de nuit inclus. Réservez tôt, le week-end du festival mobilise beaucoup de véhicules.',
      },
      {
        q: 'Peut-on rejoindre les îles (Bréhat, Belle-Île) en groupe ?',
        a: 'Le car assure la liaison jusqu\'à l\'embarcadère (Paimpol pour Bréhat, Quiberon pour Belle-Île), la traversée se réserve auprès des compagnies. Nous calons les horaires du car sur ceux du bateau.',
      },
    ],
  },
  {
    slug: 'reims',
    nom: 'Reims',
    metaTitle: 'Location d\'autocar à Reims avec chauffeur — Devis 24h | Busmoov',
    metaDescription: 'Autocar et minibus avec chauffeur à Reims : circuits champagne, caves, cathédrale, séminaires œnologiques. Devis gratuit sous 24h.',
    h1: 'Location d\'autocar avec chauffeur à Reims',
    sousTitre: 'Caves de champagne, cathédrale des sacres, vignoble classé UNESCO : des transporteurs marnais vérifiés, un devis gratuit en 24h.',
    intro: [
      'Reims vit au rythme du champagne — et le champagne se visite en car. Quand la dégustation fait partie du programme (et elle en fait toujours partie), personne ne conduit : les circuits caves et vignoble sont la première demande de groupe de la Marne, des séminaires parisiens aux clubs œnologiques en passant par les groupes étrangers.',
      'L\'atout maître de la ville : Paris à 45 minutes de TGV et 1h30 de route. Les séminaires d\'entreprise franciliens en font leur destination œno préférée — arrivée le matin, cathédrale et caves, dîner dans le vignoble, retour le soir ou nuit sur place. Nos transporteurs marnais orchestrent ces journées toute l\'année.',
    ],
    sectionLocale: {
      h2: 'Construire un circuit champagne qui tient ses promesses',
      paragraphes: [
        'La règle des grandes maisons rémoises (Veuve Clicquot, Taittinger, Pommery, Ruinart) : visites sur réservation à horaires stricts — le circuit se construit autour de ces créneaux, pas l\'inverse. Le format qui marche : une grande maison à Reims le matin, déjeuner, puis le vignoble l\'après-midi — la montagne de Reims par Verzenay et son phare, ou l\'avenue de Champagne à Épernay à 30 minutes.',
        'Dans le vignoble, les routes entre les villages (Hautvillers, berceau de Dom Pérignon, Aÿ, Bouzy) sont étroites : pour les groupes de moins de 20, le minibus passe partout et monte jusqu\'aux petites maisons familiales que les grands cars ne peuvent pas atteindre. La formule car + dégustations chez un vigneron indépendant est souvent la plus mémorable — et la plus économique.',
      ],
    },
    h2Destinations: 'Caves, vignoble et sacres : les sorties des groupes rémois',
    h2Trajets: 'Trajets types à Reims',
    liensUtiles: [
      'Les séminaires parisiens combinent souvent Reims avec notre [location d\'autocar sur Paris](/location-autocar/paris) — 1h30 de route ; côté est, la [location d\'autocar à Strasbourg](/location-autocar/strasbourg) couvre la route des vins d\'Alsace. Pour une soirée qui se prolonge dans le vignoble, un [minibus avec chauffeur](/services/location-minibus) gère les retours tardifs.',
      "Journée dans le vignoble champenois ou transfert vers Paris, le tarif dépend de la distance et de l'amplitude : repérez votre formule dans le guide des [prix de location d'autocar 2026](/blog/prix-location-autocar), puis demandez jusqu'à 3 [devis d'autocar](/devis-autocar) à nos transporteurs marnais.",
    ],
    destinations: [
      { nom: 'Les grandes maisons de Reims', desc: 'Veuve Clicquot, Taittinger, Pommery : crayères classées et dégustations sur réservation.' },
      { nom: 'Épernay et l\'avenue de Champagne', desc: 'Le kilomètre le plus riche du monde à 30 minutes — Moët, Mercier et leurs caves.' },
      { nom: 'Hautvillers', desc: 'Le village de Dom Pérignon, au cœur des coteaux classés UNESCO.' },
      { nom: 'La montagne de Reims', desc: 'Verzenay, son phare et les villages de grands crus — la boucle vignoble classique.' },
      { nom: 'La cathédrale et le palais du Tau', desc: 'Le site des sacres royaux : l\'étape culturelle de tout circuit rémois.' },
      { nom: 'Troyes', desc: 'Cité médiévale et magasins d\'usine à 1h15 — la journée shopping et patrimoine.' },
    ],
    trajets: [
      'Paris → Reims : journée séminaire œnologique (cathédrale + caves + vignoble)',
      'Circuit champagne en mise à disposition : Reims, Hautvillers, Épernay',
      'Transfert gare Champagne-Ardenne TGV ↔ hôtels et maisons de champagne',
      'Sortie CE ou club : caves + déjeuner dans le vignoble',
    ],
    sections: [
      {
        h2: 'L\'année des groupes à Reims',
        paragraphes: [
          'Reims vit au rythme du champagne et de ses visiteurs : d\'avril à octobre, les maisons de la ville et les vignerons d\'Épernay et de la montagne de Reims reçoivent des groupes chaque jour, avec un pic en septembre-octobre pour les vendanges et en décembre pour les sorties de fin d\'année des comités d\'entreprise. Les groupes parisiens arrivent en TGV en 45 minutes et repartent le soir, avec un car local pour le vignoble entre les deux.',
          'En dehors du vin, la cathédrale et le palais du Tau attirent les scolaires au printemps, les Flâneries musicales font les soirées de juin et juillet, les Habits de Lumière d\'Épernay celles de décembre, et le marché de Noël de Reims, l\'un des plus grands de France, remplit le parvis de la cathédrale du dernier week-end de novembre à Noël. Toute la saison, le Stade de Reims à Delaune mobilise des navettes. Les cars marnais manquent en septembre-octobre et les samedis de décembre.',
        ],
      },
      {
        h2: 'Reims depuis Paris : la journée champagne des entreprises',
        paragraphes: [
          'Le montage le plus demandé est la journée depuis Paris : TGV jusqu\'à Reims ou Champagne-Ardenne TGV, car à disposition pour deux maisons et un déjeuner, retour en TGV le soir ; ou car depuis Paris pour tout le trajet, 1h45 par l\'A4, ce qui évite les horaires de train et permet un dîner tardif. Le prix se calcule sur l\'amplitude du chauffeur : une journée de 9h à 19h entre dans la grille de base, un retour à Paris à 23h passe sur l\'amplitude supérieure, et un second chauffeur n\'est pas nécessaire.',
          'Précisez le nombre de personnes et les maisons choisies : les grandes maisons de Reims ont des parkings cars, les vignerons de la montagne de Reims des cours de ferme où un car de 12 mètres ne tourne pas toujours, et un minibus est alors plus adapté. Notre guide [déplacement d\'entreprise en autocar](/blog/autocar-deplacement-entreprise) détaille les montages, et [louer un bus pour une fête privée](/blog/louer-un-bus-pour-un-anniversaire) couvre les sorties entre amis. Vers l\'est, [Nancy](/location-autocar/nancy) et [Strasbourg](/location-autocar/strasbourg) sont nos bases suivantes.',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Reims',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Reims : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Reims, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 400 €', 'à partir de 450 €', 'à partir de 550 €'],
          ['Journée locale, aller-retour', 'à partir de 700 €', 'à partir de 800 €', 'à partir de 900 €'],
          ['Journée régionale, aller-retour', 'à partir de 1 000 €', 'à partir de 1 100 €', 'à partir de 1 350 €'],
          ['Week-end 2 jours', 'à partir de 1 800 €', 'à partir de 2 000 €', 'Sur devis'],
        ],
      },
      apres: 'Les transporteurs du département appliquent des frais d\'approche d\'environ 10 % : ces prix de départ en tiennent compte. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte un circuit champagne en autocar ?',
        a: 'Depuis Reims, la journée en mise à disposition démarre à 700 € TTC en autocar standard (visites et dégustations à réserver auprès des maisons, de 15 à 50 € par personne selon les caves). Depuis Paris, comptez à partir de 1 200 € TTC environ la journée complète.',
      },
      {
        q: 'Le car attend-il pendant les visites et le déjeuner ?',
        a: 'Oui, c\'est la formule mise à disposition : le véhicule et le chauffeur restent avec le groupe et enchaînent les étapes à votre rythme — y compris quand le déjeuner s\'éternise, c\'est prévu.',
      },
      {
        q: 'Faut-il réserver les caves avant le car ?',
        a: 'Réservez en parallèle : les créneaux des grandes maisons partent vite (plusieurs semaines à l\'avance en saison), et le circuit du car se cale sur ces horaires. Donnez-nous les créneaux obtenus, le transporteur construit l\'itinéraire autour.',
      },
      {
        q: 'Minibus ou grand car pour le vignoble ?',
        a: 'Jusqu\'à 20 personnes, le minibus est roi : il monte aux petites maisons des villages que les autocars ne peuvent pas atteindre. Au-delà, le grand car dessert les maisons principales et le minibus peut compléter pour une étape vigneron — on compose selon votre programme.',
      },
    ],
  },
  {
    slug: 'rouen',
    nom: 'Rouen',
    metaTitle: 'Location d\'autocar à Rouen avec chauffeur — Devis 24h | Busmoov',
    metaDescription: 'Autocar et minibus avec chauffeur à Rouen : Giverny, Étretat, Honfleur, plages du Débarquement, transferts Paris. Transporteurs normands vérifiés, devis gratuit sous 24h.',
    h1: 'Location d\'autocar avec chauffeur à Rouen',
    sousTitre: 'Giverny, Étretat, Honfleur, plages du Débarquement : la Normandie à la journée depuis Rouen, avec des transporteurs seinomarins vérifiés et un devis gratuit en 24h.',
    intro: [
      'Capitale normande à 1h30 de Paris, Rouen est un carrefour de groupes : scolaires de toute l\'Île-de-France en route vers les plages du Débarquement, comités d\'entreprise vers Honfleur et Étretat, congressistes au Parc des expositions et supporters au Kindarena. Les transporteurs de Seine-Maritime avec lesquels nous travaillons connaissent ces flux par cœur.',
      'Du minibus pour un transfert gare-entreprise au grand tourisme pour un voyage de classe, nous comparons pour vous plusieurs devis de transporteurs rouennais. Avantage de la Seine-Maritime : pas de majoration régionale sur les tarifs, et des véhicules disponibles toute l\'année hors Armada.',
    ],
    sectionLocale: {
      h2: 'Autocar dans le centre de Rouen : dépose sur les quais, pas dans le vieux Rouen',
      paragraphes: [
        'Le centre historique, de la cathédrale à la place du Vieux-Marché, est piéton ou en rues étroites : aucun car n\'y entre. Les groupes sont déposés sur les quais rive droite, à cinq minutes à pied de la cathédrale, ou boulevard des Belges côté musée des Beaux-Arts. Pour un événement au Kindarena ou au Zénith de Rouen, la dépose se fait aux parkings cars des sites, bien dimensionnés.',
        'Pour l\'Armada, dont la prochaine édition se tient en juin 2027, les quais sont fermés à la circulation : les cars déposent aux parkings relais en périphérie et le groupe rejoint les bateaux en navette ou à pied. Réservez plusieurs mois avant, toute la Normandie manque de véhicules cette semaine-là.',
      ],
    },
    h2Destinations: 'Impressionnistes, falaises et Histoire : les sorties depuis Rouen',
    h2Trajets: 'Trajets types à Rouen',
    liensUtiles: [
      "À l'estuaire de la Seine, à 1 h 15 de route, la [location d'autocar au Havre](/location-autocar/le-havre) couvre les escales de croisière, Étretat et la Côte d'Albâtre.",
      'Pour un groupe venu de la capitale, notre page [autocar au départ de Paris](/location-autocar/paris) couvre le transfert vers Rouen et la Normandie ; pour les établissements scolaires, le guide [préparer une sortie scolaire en autocar](/blog/organiser-sortie-scolaire-autocar) reprend les règles à respecter. Les prix par distance sont dans notre [guide tarifaire autocar](/blog/prix-location-autocar).',
    ],
    destinations: [
      { nom: 'Giverny', desc: 'La maison et les jardins de Monet à 1h : la sortie impressionniste des scolaires et des seniors, d\'avril à octobre.' },
      { nom: 'Étretat et Fécamp', desc: 'Les falaises à 1h15, le palais Bénédictine à Fécamp : la journée côte d\'Albâtre.' },
      { nom: 'Honfleur et Deauville', desc: 'Vieux bassin, planches et plage à 1h15 : le week-end ou la journée des comités d\'entreprise.' },
      { nom: 'Plages du Débarquement', desc: 'Arromanches, Omaha Beach, le cimetière américain à 2h : le voyage d\'Histoire des collèges et lycées.' },
      { nom: 'Le Havre', desc: 'Le centre Perret classé à l\'UNESCO et le MuMa à 1h : la sortie architecture et art moderne.' },
      { nom: 'Lyons-la-Forêt et la vallée de Seine', desc: 'Abbaye de Jumièges, Château-Gaillard, hêtraie de Lyons à 45 minutes : les boucles nature des associations.' },
    ],
    trajets: [
      'Rouen → Giverny ou Étretat à la journée',
      'Voyage scolaire Rouen → plages du Débarquement, un ou deux jours',
      'Transfert gare de Rouen-Rive-Droite ↔ site d\'entreprise, Parc expo ou Zénith',
      'Navette Rouen ↔ Paris ou aéroport Roissy CDG pour un groupe',
    ],
    sections: [
      {
        h2: 'Le calendrier des groupes à Rouen',
        paragraphes: [
          'La demande d\'autocars à Rouen suit un calendrier bien marqué. Au printemps, les collèges et lycées de toute la Normandie et de l\'Île-de-France partent vers les plages du Débarquement et le Mémorial de Caen : d\'avril à juin, les cars de 50 à 60 places sont les plus sollicités. L\'été, place aux comités d\'entreprise et aux associations vers Étretat, Honfleur et la côte fleurie, et aux groupes de touristes qui enchaînent Giverny et Rouen en une journée depuis Paris.',
          'L\'automne est celui de la Foire Saint-Romain, l\'une des plus grandes fêtes foraines de France, qui attire des groupes d\'amis et de comités d\'entreprise en soirée, et des salons au Parc des expositions. Tout au long de la saison, les matchs de hockey à l\'île Lacroix, les concerts du Zénith et les spectacles du Kindarena mobilisent des navettes en soirée, avec retour de nuit. Et tous les quatre à cinq ans, l\'Armada vide les parcs de véhicules de toute la région pendant dix jours : la prochaine est en juin 2027.',
        ],
      },
      {
        h2: 'Quel véhicule pour votre groupe rouennais ?',
        paragraphes: [
          'Pour un transfert vers Paris ou Roissy, un [minibus de 8 à 20 places](/location-minibus-20-places) suffit à une délégation ou à une petite équipe, avec ses bagages. Pour une classe et ses accompagnateurs, un [bus de 50 places](/location-bus-50-places) est le format standard, aux normes transport d\'enfants ; pour deux classes vers les plages du Débarquement, un [autocar grande capacité](/location-autocar-grande-capacite) évite de dédoubler le chauffeur et le prix. Les groupes de seniors vers Giverny demandent souvent un car à plancher surbaissé ou un [autocar accessible PMR](/autocar-pmr) avec élévateur.',
          'Dites-nous le nombre exact de passagers, accompagnateurs compris, et le volume de bagages : une journée Étretat n\'a pas les mêmes soutes qu\'un week-end à Honfleur. Le transporteur choisit le véhicule, vous recevez un devis par option.',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Rouen',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Rouen : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Rouen, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 350 €', 'à partir de 400 €', 'à partir de 500 €'],
          ['Journée locale, aller-retour', 'à partir de 600 €', 'à partir de 700 €', 'à partir de 800 €'],
          ['Journée régionale, aller-retour', 'à partir de 900 €', 'à partir de 1 000 €', 'à partir de 1 200 €'],
          ['Week-end 2 jours', 'à partir de 1 600 €', 'à partir de 1 800 €', 'Sur devis'],
        ],
      },
      apres: 'Le département ne porte pas de majoration régionale : ces prix de départ sont ceux de la grille nationale. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Rouen ?',
        a: 'Une journée en autocar standard démarre à 700 € TTC au départ de Rouen, chauffeur, carburant et péages inclus. La Seine-Maritime ne porte pas de majoration régionale : les prix y sont parmi les plus bas de l\'Ouest. Une sortie Étretat ou Giverny se chiffre à la journée, les plages du Débarquement plutôt sur une amplitude longue ou deux jours.',
      },
      {
        q: 'Un car peut-il s\'approcher de la cathédrale ou du Gros-Horloge ?',
        a: 'Non, le centre historique est piéton. Les groupes descendent sur les quais rive droite ou boulevard des Belges, à cinq minutes à pied. Le chauffeur stationne ensuite sur les parkings cars de la ville et revient à l\'heure convenue.',
      },
      {
        q: 'Faites-vous les transferts entre Rouen et Paris ?',
        a: 'Oui, c\'est l\'un des trajets les plus demandés : 1h30 par l\'A13, vers Paris, Roissy CDG ou Orly, pour un groupe en voyage ou un séminaire. Un aller simple en autocar standard démarre à 400 € TTC pour un trajet local, plus pour Paris selon l\'horaire.',
      },
      {
        q: 'Que se passe-t-il pendant l\'Armada ?',
        a: 'Les quais sont fermés aux véhicules pendant toute la manifestation. Nos transporteurs déposent aux parkings relais et aux points de navette définis par la ville. Les véhicules se réservent dès l\'automne précédent.',
      },
    ],
  },
  {
    slug: 'tours',
    nom: 'Tours',
    metaTitle: 'Location d\'autocar à Tours avec chauffeur — Devis 24h | Busmoov',
    metaDescription: 'Autocar et minibus avec chauffeur à Tours : châteaux de la Loire, Chenonceau, Amboise, Chambord, Beauval, Futuroscope. Transporteurs tourangeaux vérifiés, devis gratuit sous 24h.',
    h1: 'Location d\'autocar avec chauffeur à Tours',
    sousTitre: 'Chenonceau, Amboise, Chambord, Beauval : les châteaux de la Loire et le Val de Loire en groupe depuis Tours, avec des transporteurs d\'Indre-et-Loire vérifiés.',
    intro: [
      'Tours est la base de départ naturelle des châteaux de la Loire : Villandry à 20 minutes, Amboise et Chenonceau à 30, Azay-le-Rideau à 30, Chambord à une heure. Les groupes arrivent par le TGV à Saint-Pierre-des-Corps, à une heure de Paris, et un autocar local les attend pour la journée. C\'est le cas d\'usage numéro un de nos transporteurs tourangeaux.',
      'La ville génère aussi ses propres flux : congrès au Vinci, matchs et concerts, séminaires dans les domaines viticoles de Vouvray et Montlouis, voyages scolaires vers le zoo de Beauval et le Futuroscope. Du minibus au grand tourisme, nous comparons pour vous plusieurs devis de transporteurs d\'Indre-et-Loire.',
    ],
    sectionLocale: {
      h2: 'Arriver en TGV, continuer en autocar : la logistique tourangelle',
      paragraphes: [
        'La gare TGV est à Saint-Pierre-des-Corps, à dix minutes du centre, avec un parvis où les cars prennent les groupes à la descente du train. La gare de Tours centre, plus belle mais en impasse, se prête moins à la dépose d\'un car de 12 mètres. Pour un séminaire au Vinci, la dépose se fait boulevard Heurteloup ; le centre ancien, autour de la place Plumereau, est piéton.',
        'Dans les châteaux, les parkings autocars sont la règle, souvent à quelques centaines de mètres de l\'entrée : prévoyez dix minutes de marche à Chenonceau et Chambord, et un billet de groupe réservé à l\'avance, sans quoi le car attend. Le chauffeur connaît les horaires d\'ouverture et les sens de visite qui évitent les files.',
      ],
    },
    h2Destinations: 'Châteaux, zoo et vignobles : les journées de groupe depuis Tours',
    h2Trajets: 'Trajets types à Tours',
    liensUtiles: [
      'Les groupes parisiens combinent souvent TGV et autocar local, un montage détaillé dans notre comparatif [train ou autocar pour un groupe](/blog/autocar-ou-train-groupe). Pour une classe, le guide [organiser un voyage scolaire en car](/blog/organiser-sortie-scolaire-autocar) donne la marche à suivre ; pour le budget, le [guide des prix autocar](/blog/prix-location-autocar) détaille les tarifs par distance. Au nord, nous couvrons aussi la [location d\'autocar au Mans](/location-autocar/le-mans).',
    ],
    destinations: [
      { nom: 'Chenonceau', desc: 'Le château sur le Cher à 30 minutes : le plus visité de la Loire après Versailles, parking cars à 5 minutes de l\'entrée.' },
      { nom: 'Amboise et le Clos Lucé', desc: 'Château royal et dernière demeure de Léonard de Vinci à 30 minutes : la journée des collèges.' },
      { nom: 'Chambord et Blois', desc: 'Le géant de François Ier à 1h, souvent couplé avec Blois ou Cheverny pour une journée complète.' },
      { nom: 'Villandry et Azay-le-Rideau', desc: 'Jardins à la française à 20 minutes, château Renaissance à 30 : le combo d\'une demi-journée.' },
      { nom: 'ZooParc de Beauval', desc: 'Les pandas à 1h : la sortie de fin d\'année des écoles et des comités d\'entreprise, réservation de groupe obligatoire.' },
      { nom: 'Vouvray et Montlouis', desc: 'Caves troglodytes et dégustations à 15 minutes : le séminaire ou l\'anniversaire où personne ne conduit.' },
    ],
    trajets: [
      'Gare TGV de Saint-Pierre-des-Corps → châteaux de la Loire, journée avec car à disposition',
      'Voyage scolaire Tours → Beauval ou Futuroscope',
      'Navette séminaire Tours ↔ domaine viticole ou lieu de réception',
      'Transfert groupe Tours ↔ Paris, Nantes ou Bordeaux',
    ],
    sections: [
      {
        h2: 'L\'année des groupes en Touraine',
        paragraphes: [
          'La saison des châteaux ouvre à Pâques et ferme à la Toussaint : entre les deux, les cars tourangeaux enchaînent les groupes du TGV du matin au TGV du soir, avec un pic de mai à juin pour les scolaires et de septembre à octobre pour les seniors et les groupes étrangers. En mai, Vitiloire, la fête des vins de Loire, remplit le centre de Tours ; l\'été, les guinguettes des bords de Loire et le son et lumière d\'Amboise font les soirées de groupe.',
          'L\'hiver, les châteaux se parent pour Noël : Chenonceau, Amboise et Azay-le-Rideau proposent des visites décorées très demandées par les comités d\'entreprise en décembre. Le reste de l\'année, les congrès du Vinci, les matchs du TVB en volley et les séminaires dans les domaines de Vouvray et Montlouis assurent un flux régulier. Les cars se réservent facilement de novembre à mars, difficilement les samedis de mai.',
        ],
      },
      {
        h2: 'Le conseil du chauffeur : réussir sa journée châteaux',
        paragraphes: [
          'Réservez les billets de groupe avant le départ : à Chenonceau et Chambord, un groupe sans réservation attend parfois une heure en haute saison pendant que le car tourne. Commencez par le château le plus éloigné pour revenir vers Tours l\'après-midi, et comptez deux heures par château, déplacement du parking compris. Un déjeuner réservé dans un restaurant de groupe à Amboise ou Bléré évite de perdre une heure.',
          'Pour une journée depuis la gare TGV, l\'amplitude du chauffeur commence à la prise en charge et finit à la dépose du soir : un train à 9h et un retour à 19h tiennent dans la grille de base, un retour à 21h passe sur l\'amplitude supérieure. Prévoyez de l\'eau à bord en juillet et des chaussures de marche pour les jardins de Villandry. Pour une classe, notre guide [organiser une sortie scolaire en autocar](/blog/organiser-sortie-scolaire-autocar) complète ces conseils.',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Tours',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Tours : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Tours, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 400 €', 'à partir de 450 €', 'à partir de 550 €'],
          ['Journée locale, aller-retour', 'à partir de 700 €', 'à partir de 800 €', 'à partir de 900 €'],
          ['Journée régionale, aller-retour', 'à partir de 1 000 €', 'à partir de 1 100 €', 'à partir de 1 350 €'],
          ['Week-end 2 jours', 'à partir de 1 800 €', 'à partir de 2 000 €', 'Sur devis'],
        ],
      },
      apres: 'Les transporteurs du département appliquent des frais d\'approche d\'environ 10 % : ces prix de départ en tiennent compte. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Tours ?',
        a: 'Une journée en autocar standard démarre à 700 € TTC, un peu plus en Indre-et-Loire où les transporteurs appliquent des frais d\'approche. Une journée châteaux avec car à disposition se chiffre selon l\'amplitude du chauffeur : partir à 9h et rentrer à 18h tient dans la grille de base.',
      },
      {
        q: 'Combien de châteaux peut-on visiter dans la journée ?',
        a: 'Deux confortablement, trois au pas de course. Le combo classique est Chenonceau le matin et Amboise l\'après-midi, ou Villandry et Azay-le-Rideau pour une demi-journée. Chambord demande une heure de route dans chaque sens : prévoyez-le seul ou avec Blois.',
      },
      {
        q: 'Le car peut-il récupérer un groupe à la descente du TGV ?',
        a: 'Oui, c\'est le montage le plus courant pour les groupes parisiens : le chauffeur attend sur le parvis de Saint-Pierre-des-Corps avec le numéro de train, et le groupe part directement vers le premier château. Donnez l\'horaire du train, le car suit le retard éventuel.',
      },
      {
        q: 'Proposez-vous des cars pour Beauval et le Futuroscope ?',
        a: 'Oui, Beauval est à 1h et le Futuroscope à 1h : les deux ont des parkings autocars et des tarifs de groupe à réserver avant. Pour un établissement scolaire, nos transporteurs fournissent les véhicules aux normes transport d\'enfants.',
      },
    ],
  },
  {
    slug: 'dijon',
    nom: 'Dijon',
    metaTitle: 'Location d\'autocar à Dijon avec chauffeur — Devis 24h | Busmoov',
    metaDescription: 'Autocar et minibus avec chauffeur à Dijon : Beaune, route des Grands Crus, Hospices, abbaye de Fontenay, transferts Lyon et Suisse. Transporteurs bourguignons vérifiés, devis gratuit sous 24h.',
    h1: 'Location d\'autocar avec chauffeur à Dijon',
    sousTitre: 'Beaune, route des Grands Crus, Fontenay, Vézelay : la Bourgogne en groupe depuis Dijon, avec des transporteurs de Côte-d\'Or vérifiés et un devis gratuit en 24h.',
    intro: [
      'Dijon est la ville des séminaires et des sorties œnologiques : la route des Grands Crus commence aux portes de la ville, Beaune et ses Hospices sont à 45 minutes, et personne ne veut conduire après une dégustation. Comités d\'entreprise, clubs, groupes d\'amis et touristes étrangers en circuit forment le gros de la demande de nos transporteurs de Côte-d\'Or.',
      'La ville génère aussi ses flux propres : Foire gastronomique en novembre, congrès au Palais des Congrès, matchs et concerts au Zénith, et une position de carrefour entre Paris, Lyon et la Suisse qui fait de Dijon une étape des voyages longue distance. Du minibus au grand tourisme, nous comparons plusieurs devis pour vous.',
    ],
    sectionLocale: {
      h2: 'Dijon en autocar : secteur piéton, gare et Cité de la Gastronomie',
      paragraphes: [
        'Le cœur de Dijon, du palais des Ducs aux Halles, est piéton : les groupes descendent place Darcy ou sur les boulevards de ceinture, à cinq minutes de la place de la Libération. La Cité internationale de la Gastronomie et du Vin, près de la gare, dispose d\'une dépose pour les cars, comme le Zénith et le Parc des expositions.',
      ],
    },
    h2Destinations: 'Vignobles, abbayes et villages : les escapades des groupes dijonnais',
    h2Trajets: 'Trajets types à Dijon',
    liensUtiles: [
      'Pour un séminaire d\'entreprise avec soirée dans un domaine, notre guide [déplacement d\'entreprise en autocar](/blog/autocar-deplacement-entreprise) détaille les formats ; pour une soirée entre amis ou un anniversaire dans les vignes, voir [louer un bus pour une fête privée](/blog/louer-un-bus-pour-un-anniversaire). Dijon est aussi une étape vers [la Suisse en autocar](/location-autocar-suisse) et vers [Lyon](/location-autocar/lyon). Tarifs : [notre guide des prix](/blog/prix-location-autocar).',
    ],
    destinations: [
      { nom: 'Beaune et les Hospices', desc: 'La capitale des vins à 45 minutes : Hôtel-Dieu, caves et remparts, la journée la plus demandée.' },
      { nom: 'Route des Grands Crus', desc: 'Gevrey-Chambertin, Vougeot, Nuits-Saint-Georges : dégustations enchaînées, le car attend devant chaque domaine.' },
      { nom: 'Abbaye de Fontenay', desc: 'L\'abbaye cistercienne classée UNESCO à 1h, souvent couplée avec Flavigny ou Alésia.' },
      { nom: 'Vézelay', desc: 'La basilique et la colline éternelle à 1h30 : la sortie patrimoine et pèlerinage.' },
      { nom: 'Châteauneuf-en-Auxois et le canal de Bourgogne', desc: 'Village perché et écluses à 40 minutes : la demi-journée nature des associations.' },
      { nom: 'Le Creusot et le Morvan', desc: 'Parc naturel, lacs et villages à 1h15 : la journée verte des scolaires et des clubs de marche.' },
    ],
    trajets: [
      'Dijon → Beaune et route des Grands Crus, journée avec car à disposition',
      'Navette séminaire Dijon ↔ domaine viticole ou château',
      'Transfert gare de Dijon-Ville ↔ Palais des Congrès, Zénith ou Parc des expositions',
      'Voyage de groupe Dijon ↔ Lyon, Genève, Bâle ou Paris',
    ],
    sections: [
      {
        h2: 'L\'année des groupes à Dijon',
        paragraphes: [
          'Le calendrier dijonnais tourne autour du vin et de la table. Les vendanges, de mi-septembre à début octobre, attirent les groupes dans les domaines de la Côte de Nuits et de la Côte de Beaune. Début novembre, la Foire internationale et gastronomique remplit le Parc des expositions pendant dix jours, puis le troisième week-end de novembre, la vente des vins des Hospices de Beaune fait venir des groupes du monde entier : les cars de Côte-d\'Or sont tous pris cette semaine-là.',
          'Le printemps et l\'été sont ceux des séminaires dans les châteaux et les domaines, des sorties nature dans le Morvan et l\'Auxois, et des circuits de touristes étrangers qui font étape à Dijon entre Paris et Lyon. Les congrès au Palais des Congrès et les concerts du Zénith complètent l\'année. Hors Foire et vente des Hospices, les véhicules se trouvent facilement, y compris en semaine à quelques jours.',
        ],
      },
      {
        h2: 'Séminaire ou soirée dans les vignes : comment ça s\'organise',
        paragraphes: [
          'Le format le plus demandé à Dijon est le car à disposition pour une demi-journée ou une soirée : prise en charge au bureau ou à l\'hôtel, dépose au domaine pour la visite et la dégustation, attente du chauffeur, puis retour en ville ou vers le lieu de dîner. Le prix se calcule sur l\'amplitude du chauffeur : une soirée de 17h à 23h entre dans la grille de base, un retour à 1h du matin passe sur une amplitude longue. Comptez deux à trois domaines au maximum dans la même soirée, les dégustations prennent toujours plus de temps que prévu.',
          'Pour un séminaire de deux jours, le car peut rester avec le groupe, chauffeur logé sur place à votre charge, ou repartir et revenir : la seconde option coûte moins cher dès que le groupe ne bouge pas entre les deux. Notre guide [déplacement d\'entreprise en autocar](/blog/autocar-deplacement-entreprise) détaille les deux montages, et [louer un bus pour une fête privée](/blog/louer-un-bus-pour-un-anniversaire) couvre les sorties entre amis.',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Dijon',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Dijon : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Dijon, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 350 €', 'à partir de 400 €', 'à partir de 500 €'],
          ['Journée locale, aller-retour', 'à partir de 600 €', 'à partir de 700 €', 'à partir de 800 €'],
          ['Journée régionale, aller-retour', 'à partir de 900 €', 'à partir de 1 000 €', 'à partir de 1 200 €'],
          ['Week-end 2 jours', 'à partir de 1 600 €', 'à partir de 1 800 €', 'Sur devis'],
        ],
      },
      apres: 'Le département ne porte pas de majoration régionale : ces prix de départ sont ceux de la grille nationale. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Dijon ?',
        a: 'Une journée en autocar standard démarre à 700 € TTC, chauffeur, carburant et péages inclus, sans majoration régionale en Côte-d\'Or. Une journée vignobles avec le car à disposition se chiffre sur l\'amplitude : un départ à 9h et un retour à 18h entrent dans le tarif de base.',
      },
      {
        q: 'Le car peut-il s\'arrêter dans les domaines viticoles ?',
        a: 'Oui, c\'est le principe de la journée Grands Crus : le chauffeur dépose devant chaque domaine et attend. Prévenez les domaines du nombre de personnes et de l\'heure, et prévoyez de l\'eau et un déjeuner solide à bord.',
      },
      {
        q: 'Organisez-vous des transferts vers la Suisse ?',
        a: 'Oui, Dijon est à 2h de Bâle et 2h30 de Genève. Nos transporteurs ont les documents pour circuler en Suisse, y compris la vignette autoroutière. Pour un séjour, précisez si le car reste sur place ou revient entre l\'aller et le retour.',
      },
      {
        q: 'Y a-t-il des cars disponibles pendant la Foire gastronomique ?',
        a: 'Oui, mais la première quinzaine de novembre est chargée à Dijon : les groupes qui réservent en septembre ont le choix des véhicules, ceux qui s\'y prennent la semaine précédente prennent ce qui reste.',
      },
    ],
  },
  {
    slug: 'nancy',
    nom: 'Nancy',
    metaTitle: 'Location d\'autocar à Nancy avec chauffeur — Devis 24h | Busmoov',
    metaDescription: 'Autocar et minibus avec chauffeur à Nancy : Metz, Verdun, Strasbourg, Vosges, fêtes de Saint-Nicolas, transferts Lorraine. Transporteurs lorrains vérifiés, devis gratuit sous 24h.',
    h1: 'Location d\'autocar avec chauffeur à Nancy',
    sousTitre: 'Metz, Verdun, les Vosges, Strasbourg : la Lorraine et le Grand Est en groupe depuis Nancy, avec des transporteurs de Meurthe-et-Moselle vérifiés.',
    intro: [
      'Ville étudiante, ville d\'art nouveau et porte des Vosges, Nancy déplace des groupes toute l\'année : associations étudiantes vers Metz et Strasbourg, collèges vers Verdun et les champs de bataille, clubs vers Gérardmer et les lacs, comités d\'entreprise vers les marchés de Noël alsaciens. Nos transporteurs de Meurthe-et-Moselle couvrent tout le Grand Est.',
      'La ville elle-même mobilise des cars pour les fêtes de Saint-Nicolas début décembre, les spectacles du Zénith, les congrès du Centre Prouvé et les matchs au stade Marcel-Picot. Du minibus au grand tourisme, nous comparons pour vous plusieurs devis de transporteurs lorrains.',
    ],
    sectionLocale: {
      h2: 'Place Stanislas, gare et Zénith : où le car dépose à Nancy',
      paragraphes: [
        'La place Stanislas et la vieille ville sont piétonnes : les groupes sont déposés sur les boulevards qui ceinturent le centre, cours Léopold ou place Carnot, à trois minutes de la place. Le Centre Prouvé, accolé à la gare, a sa propre dépose cars ; le Zénith et le Parc des expositions ont des parkings autocars.',
        'Pendant les fêtes de Saint-Nicolas, le premier week-end de décembre, le centre est fermé à la circulation pour le défilé : les cars déposent aux parkings relais et le groupe finit en tram. Les transporteurs lorrains connaissent le dispositif, mais le samedi du défilé se réserve en octobre.',
      ],
    },
    h2Destinations: 'Lorraine, Vosges et Alsace : les sorties des groupes nancéiens',
    h2Trajets: 'Trajets types à Nancy',
    liensUtiles: [
      'En décembre, le circuit des marchés de Noël a son mode d\'emploi : [sortie aux marchés de Noël en autocar](/blog/marches-de-noel-en-autocar), avec notre page [autocar à Strasbourg](/location-autocar/strasbourg) pour l\'arrivée. Pour une classe en voyage de mémoire à Verdun, voir [organiser une sortie scolaire](/blog/organiser-sortie-scolaire-autocar) ; pour un séjour dans les Vosges en hiver, [partir au ski en autocar avec un groupe](/blog/autocar-station-de-ski-groupe). Budget : [guide des tarifs autocar](/blog/prix-location-autocar).',
    ],
    destinations: [
      { nom: 'Metz', desc: 'Centre Pompidou-Metz, cathédrale et quartier impérial à 45 minutes : la journée culture, avec dépose au pied du musée.' },
      { nom: 'Verdun et les champs de bataille', desc: 'Mémorial, ossuaire de Douaumont et forts à 1h15 : le voyage de mémoire des classes de 3e et de 1re.' },
      { nom: 'Strasbourg et Colmar', desc: 'Marchés de Noël, Parlement européen, route des vins à 1h30 : la grande journée de décembre et de printemps.' },
      { nom: 'Gérardmer et les Vosges', desc: 'Lac, stations de ski et crêtes à 1h15 : la journée nature l\'été, la journée luge et ski l\'hiver.' },
      { nom: 'Lunéville et la colline de Sion', desc: 'Château des Lumières et site de Barrès à 30 à 45 minutes : la demi-journée patrimoine des associations.' },
      { nom: 'Luxembourg et Trèves', desc: 'À 1h30 et 2h : la sortie européenne des étudiants et des comités d\'entreprise.' },
    ],
    trajets: [
      'Nancy → Verdun, voyage de mémoire scolaire à la journée',
      'Navette Saint-Nicolas, Zénith ou stade Marcel-Picot, retour de nuit compris',
      'Nancy → Strasbourg ou Colmar pour les marchés de Noël',
      'Transfert gare de Nancy ↔ Centre Prouvé, campus ou site d\'entreprise',
    ],
    sections: [
      {
        h2: 'L\'année des groupes à Nancy',
        paragraphes: [
          'Nancy vit au rythme de ses fêtes. Début décembre, les fêtes de Saint-Nicolas et leur défilé attirent des groupes de toute la Lorraine, en même temps que les marchés de Noël de la place Charles III et, à une heure et demie, ceux de Strasbourg et de Colmar : décembre est le mois où les cars lorrains manquent. En octobre, Nancy Jazz Pulsations remplit la pépinière et les salles ; en septembre, Le Livre sur la Place occupe la place de la Carrière.',
          'L\'été, le spectacle son et lumière de la place Stanislas fait les soirées de groupes et les sorties de comités d\'entreprise. Le printemps et l\'automne sont ceux des voyages de mémoire des collèges et lycées vers Verdun et les champs de bataille, et des sorties nature vers les Vosges. Les matchs de l\'ASNL et du SLUC, les concerts du Zénith et les congrès du Centre Prouvé complètent le calendrier.',
        ],
      },
      {
        h2: 'Voyage de mémoire à Verdun : le déroulé type',
        paragraphes: [
          'Depuis Nancy, comptez 1h15 de route jusqu\'à Verdun. Un déroulé qui tient dans la journée scolaire : départ à 8h, Mémorial de Verdun à 9h30 pendant deux heures, déjeuner tiré du sac ou en restaurant de groupe, ossuaire de Douaumont et fort de Douaumont ou de Vaux l\'après-midi, village détruit de Fleury sur le chemin, retour à Nancy vers 17h30. Les sites ont des parkings autocars et des créneaux de groupe à réserver, le Mémorial en particulier.',
          'Pour deux classes, un [autocar grande capacité](/location-autocar-grande-capacite) ou deux bus standards : le premier coûte moins cher, le second laisse chaque classe avec ses accompagnateurs. Les transporteurs de Meurthe-et-Moselle fournissent les véhicules aux normes transport d\'enfants et les documents demandés par les établissements. Le détail des règles et de la préparation est dans notre guide [organiser une sortie scolaire en autocar](/blog/organiser-sortie-scolaire-autocar).',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Nancy',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Nancy : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Nancy, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 400 €', 'à partir de 450 €', 'à partir de 550 €'],
          ['Journée locale, aller-retour', 'à partir de 700 €', 'à partir de 800 €', 'à partir de 900 €'],
          ['Journée régionale, aller-retour', 'à partir de 1 000 €', 'à partir de 1 100 €', 'à partir de 1 350 €'],
          ['Week-end 2 jours', 'à partir de 1 800 €', 'à partir de 2 000 €', 'Sur devis'],
        ],
      },
      apres: 'Les transporteurs du département appliquent des frais d\'approche d\'environ 10 % : ces prix de départ en tiennent compte. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Nancy ?',
        a: 'Une journée en autocar standard démarre à 700 € TTC, un peu plus en Meurthe-et-Moselle où les transporteurs appliquent des frais d\'approche. Comparer plusieurs devis y est d\'autant plus utile : la différence entre deux transporteurs lorrains sur une journée Verdun dépasse souvent 10 %.',
      },
      {
        q: 'Le car peut-il déposer place Stanislas ?',
        a: 'Non, la place et la vieille ville sont piétonnes. La dépose se fait cours Léopold ou place Carnot, à trois minutes à pied, et le chauffeur revient au même endroit à l\'heure convenue.',
      },
      {
        q: 'Peut-on faire Strasbourg et Colmar dans la même journée ?',
        a: 'Oui depuis Nancy, à condition de partir tôt : 1h30 jusqu\'à Strasbourg, une heure sur place entre les deux villes, retour à 22h. L\'amplitude du chauffeur reste sous les 12 heures. En décembre, les samedis sont saturés sur l\'A4 : préférez un vendredi ou un dimanche.',
      },
      {
        q: 'Faites-vous les voyages scolaires vers Verdun ?',
        a: 'C\'est le trajet scolaire le plus demandé en Lorraine. Les sites ont des parkings autocars et des visites de groupe à réserver. Pour deux classes, un autocar grande capacité ou deux cars standards, selon l\'établissement.',
      },
    ],
  },
  {
    slug: 'clermont-ferrand',
    nom: 'Clermont-Ferrand',
    metaTitle: 'Location d\'autocar à Clermont-Ferrand avec chauffeur — Devis 24h | Busmoov',
    metaDescription: 'Autocar et minibus avec chauffeur à Clermont-Ferrand : Vulcania, puy de Dôme, Sancy, Le Pal, Vichy, matchs de l\'ASM. Transporteurs auvergnats vérifiés, devis gratuit sous 24h.',
    h1: 'Location d\'autocar avec chauffeur à Clermont-Ferrand',
    sousTitre: 'Vulcania, puy de Dôme, Sancy, Le Pal : les volcans et l\'Auvergne en groupe depuis Clermont-Ferrand, avec des transporteurs du Puy-de-Dôme vérifiés.',
    intro: [
      'Au pied des volcans, Clermont-Ferrand est la base des sorties nature et sciences : Vulcania à 30 minutes, le puy de Dôme et son train panoramique à 20, le massif du Sancy à une heure. Écoles, centres de loisirs, clubs de randonnée et comités d\'entreprise forment la demande de nos transporteurs du Puy-de-Dôme, avec un pic de mars à octobre.',
      'La ville a aussi ses grands rendez-vous : les matchs de l\'ASM au stade Marcel-Michelin, les concerts du Zénith d\'Auvergne, les salons de la Grande Halle et les congrès du Polydome, sans oublier les déplacements des équipes de Michelin et des laboratoires. Du minibus au grand tourisme, nous comparons plusieurs devis pour vous.',
    ],
    sectionLocale: {
      h2: 'Volcans, stade et Zénith : la logistique autocar à Clermont',
      paragraphes: [
        'Le centre ancien, autour de la cathédrale de lave noire et de la place de Jaude, est en grande partie piéton : les groupes descendent boulevard Desaix ou place Delille, à cinq minutes. Le stade Marcel-Michelin, le Zénith et la Grande Halle d\'Auvergne, en périphérie, ont des parkings autocars et des accès directs à l\'autoroute.',
        'Pour le puy de Dôme, les cars ne montent pas : dépose au parking du col de Ceyssat ou à la gare du Panoramique des Dômes, le train à crémaillère fait le reste. À Vulcania, un parking autocars jouxte l\'entrée. Dans le Sancy, les routes du Mont-Dore et de Besse sont équipées pour les cars toute l\'année, chaînes à bord l\'hiver.',
      ],
    },
    h2Destinations: 'Volcans, lacs et parcs : les journées de groupe en Auvergne',
    h2Trajets: 'Trajets types à Clermont-Ferrand',
    liensUtiles: [
      'Pour un voyage de classe, notre guide [organiser une sortie scolaire en autocar](/blog/organiser-sortie-scolaire-autocar) et notre page [autocar accessible PMR](/autocar-pmr) complètent celle-ci ; pour un déplacement de supporters ou d\'une équipe, voir [louer un bus pour un groupe sportif ou festif](/blog/aller-a-un-festival-en-bus). Au sud, nous couvrons aussi la [location d\'autocar à Saint-Étienne](/location-autocar/saint-etienne) et [Lyon](/location-autocar/lyon). Tarifs : [guide des prix de location d\'autocar](/blog/prix-location-autocar).',
    ],
    destinations: [
      { nom: 'Vulcania', desc: 'Le parc des volcans à 30 minutes : la sortie scolaire et familiale de référence, d\'avril à novembre, parking cars devant l\'entrée.' },
      { nom: 'Puy de Dôme', desc: 'Le train panoramique depuis le col de Ceyssat à 20 minutes : le sommet des classes de CM et des séminaires qui veulent prendre de la hauteur.' },
      { nom: 'Massif du Sancy', desc: 'Mont-Dore, Besse, lac Pavin à 1h : randonnée l\'été, ski et luge l\'hiver, sur des routes équipées pour les cars.' },
      { nom: 'Le Pal', desc: 'Parc d\'attractions et zoo à 1h30 : la journée de fin d\'année des écoles et des comités d\'entreprise.' },
      { nom: 'Vichy', desc: 'La reine des villes d\'eaux à 45 minutes : opéra, parcs et thermes, la sortie des clubs de seniors.' },
      { nom: 'Saint-Nectaire et les villages de lave', desc: 'Fromage, église romane et Murol à 45 minutes : la demi-journée terroir des associations.' },
    ],
    trajets: [
      'Sortie scolaire Clermont-Ferrand → Vulcania ou puy de Dôme',
      'Navette match de l\'ASM ou concert au Zénith d\'Auvergne',
      'Journée Sancy ou Le Pal pour un centre de loisirs ou un comité d\'entreprise',
      'Transfert gare de Clermont-Ferrand ou aéroport d\'Aulnat ↔ site d\'entreprise ou lieu de séminaire',
    ],
    sections: [
      {
        h2: 'L\'année des groupes en Auvergne',
        paragraphes: [
          'Le calendrier clermontois commence avec le Festival international du court métrage en février, qui attire des groupes d\'étudiants et de cinéphiles de toute la France. De mars à novembre, Vulcania et le puy de Dôme font la saison des scolaires et des centres de loisirs, avec un pic en mai-juin pour les sorties de fin d\'année. L\'été, le Sancy et les lacs d\'Auvergne accueillent les clubs de randonnée, les colonies et les comités d\'entreprise.',
          'De septembre à juin, les matchs de l\'ASM au stade Marcel-Michelin mobilisent des navettes de supporters depuis tout le département et au-delà, et les déplacements vers les stades adverses se font en car avec deux chauffeurs ou nuit sur place. L\'hiver, les stations du Sancy, Super-Besse et le Mont-Dore, accueillent les classes de neige et les sorties luge des centres de loisirs. Les concerts du Zénith d\'Auvergne et les salons de la Grande Halle complètent l\'année.',
        ],
      },
      {
        h2: 'Classe de neige et classe verte dans le Sancy',
        paragraphes: [
          'Le Sancy est à une heure de Clermont-Ferrand, ce qui en fait la destination la plus simple de France pour une classe de neige ou une classe verte : le car monte le lundi matin avec les enfants et les bagages, redescend, et revient le vendredi. Entre les deux, les déplacements sur place se font à pied ou avec un car local pour une journée ski ou une sortie au lac Pavin. Les transporteurs du Puy-de-Dôme roulent toute l\'année sur ces routes, avec les équipements hiver obligatoires de novembre à mars.',
          'Précisez le nombre d\'élèves et d\'accompagnateurs, le volume de bagages, souvent une valise et un sac par enfant, et les éventuels skis à transporter : un car avec soutes XXL ou une remorque évite un second véhicule. Pour un établissement, nos transporteurs fournissent les attestations demandées. Nos guides [organiser une sortie scolaire en autocar](/blog/organiser-sortie-scolaire-autocar) et [partir au ski en autocar avec un groupe](/blog/autocar-station-de-ski-groupe) détaillent la préparation.',
        ],
      },
    ],
    prix: {
      h2: 'Prix de départ d\'un autocar avec chauffeur à Clermont-Ferrand',
      intro: 'Quatre facteurs font le prix d\'un car au départ de Clermont-Ferrand : la distance, l\'amplitude horaire du chauffeur, la taille du véhicule et la saison. Chauffeur, carburant et péages sont toujours inclus dans nos devis. Voici les ordres de grandeur 2026, hors haute saison.',
      tableau: {
        caption: 'Prix de départ indicatifs 2026 au départ de Clermont-Ferrand, TTC, chauffeur, carburant et péages inclus',
        headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
        rows: [
          ['Transfert aller simple local (gare, aéroport, site)', 'à partir de 350 €', 'à partir de 400 €', 'à partir de 500 €'],
          ['Journée locale, aller-retour', 'à partir de 600 €', 'à partir de 700 €', 'à partir de 800 €'],
          ['Journée régionale, aller-retour', 'à partir de 900 €', 'à partir de 1 000 €', 'à partir de 1 200 €'],
          ['Week-end 2 jours', 'à partir de 1 600 €', 'à partir de 1 800 €', 'Sur devis'],
        ],
      },
      apres: 'Le département ne porte pas de majoration régionale : ces prix de départ sont ceux de la grille nationale. Sur un bus de 50 personnes, la journée locale revient à une quinzaine d\'euros par passager. Les samedis de mai à septembre et les vacances scolaires font monter les prix et raréfient les véhicules : demandez vos devis six à huit semaines avant, et comparez, c\'est tout l\'intérêt de recevoir plusieurs propositions.',
    },
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Clermont-Ferrand ?',
        a: 'Une journée en autocar standard démarre à 700 € TTC, chauffeur, carburant et péages inclus, sans majoration régionale dans le Puy-de-Dôme. Une sortie Vulcania ou puy de Dôme tient dans une journée locale ; le Sancy et Le Pal se chiffrent sur une amplitude plus longue.',
      },
      {
        q: 'Le car peut-il monter au sommet du puy de Dôme ?',
        a: 'Non, le sommet est fermé aux véhicules. Le car dépose à la gare du Panoramique des Dômes, le train à crémaillère monte en quinze minutes. Les billets de groupe se réservent à l\'avance, surtout en juillet-août.',
      },
      {
        q: 'Proposez-vous des navettes pour les matchs de l\'ASM ?',
        a: 'Oui, les déplacements de supporters vers Marcel-Michelin et vers les stades adverses sont fréquents. Pour un déplacement à Toulouse, Bordeaux ou Paris, prévoyez un second chauffeur ou un retour le lendemain : l\'amplitude dépasse 12 heures.',
      },
      {
        q: 'Les cars sont-ils équipés pour le Sancy en hiver ?',
        a: 'Oui, les transporteurs auvergnats roulent toute l\'année vers le Mont-Dore et Super-Besse, avec chaînes ou pneus hiver à bord comme la loi l\'exige en montagne. Pour une classe de neige, demandez un car avec soutes à skis.',
      },
    ],
  },
  {
    slug: 'angers',
    format: 'enrichi',
    nom: 'Angers',
    metaTitle: 'Location autocar et bus à Angers avec chauffeur | Busmoov',
    metaDescription: 'Autocar et minibus avec chauffeur à Angers : gare Saint-Laud, Puy du Fou, Saumur, Terra Botanica. Prix de départ et devis gratuit sous 24h.',
    h1: "Location d'autocar et de bus avec chauffeur à Angers",
    sousTitre: "Du minibus 8 places à l'autocar 59 places, toujours avec chauffeur : des autocaristes de l'Anjou vérifiés et plusieurs devis gratuits sous 24h.",
    intro: [
      "Vous cherchez un bus à Angers ? Sortie au Puy du Fou, journée à Saumur, séminaire en centre-ville ou classe au Futuroscope : Busmoov compare pour vous les devis d'autocaristes de Maine-et-Loire, du minibus 8 places à l'autocar 59 places, chauffeur toujours inclus. Décrivez votre trajet ci-dessous, vous recevez plusieurs propositions sous 24h.",
    ],
    prix: {
      h2: "Prix d'une location de bus avec chauffeur à Angers",
      intro: "Les prix de départ des trajets les plus demandés au départ d'Angers. Notre [guide des prix de location d'autocar](/blog/prix-location-autocar) détaille ce qui fait varier un devis.",
      tableau: {
        caption: "Prix de départ 2026 au départ d'Angers, TTC, chauffeur, carburant et péages inclus",
        headers: ['Trajet', 'Durée', 'Minibus 8 à 20 places', 'Autocar 21 à 59 places'],
        rows: [
          ['Gare Saint-Laud vers Terra Botanica, aller simple', '15 min', 'à partir de 400 €', 'à partir de 450 €'],
          ['Journée en ville, mise à disposition', 'sur place', 'à partir de 700 €', 'à partir de 800 €'],
          ['Saumur, aller-retour à la journée', '1 h', 'à partir de 700 €', 'à partir de 800 €'],
          ['Puy du Fou, aller-retour à la journée', '1 h 15', 'à partir de 700 €', 'à partir de 800 €'],
          ['Futuroscope, aller-retour à la journée', '2 h 30', 'à partir de 1 000 €', 'à partir de 1 100 €'],
          ['Paris, aller-retour sur 2 jours', '3 h 45', 'à partir de 1 800 €', 'à partir de 2 000 €'],
        ],
      },
      note: "Prix de départ TTC (TVA transport 10 %), octobre 2026. Le prix exact dépend de la date, des horaires et de l'effectif ; parking, hébergement et repas du chauffeur en sus. Durées en autocar, hors pauses.",
    },
    sections: [
      {
        h2: 'Navettes gare Saint-Laud et aéroport',
        paragraphes: [
          "Pour un groupe qui arrive en train, la gare Angers Saint-Laud, desservie par le TGV, est le point de rendez-vous le plus simple. Côté avion, l'aéroport d'Angers-Loire, à Marcé, n'assure plus de vols commerciaux selon son exploitant : les groupes arrivent par Nantes-Atlantique. Les temps de trajet à prévoir en autocar :",
          "Le minibus avec chauffeur est le bon format pour un petit groupe, à la descente du train comme à l'arrivée d'un vol : le chauffeur suit l'horaire et conduit le groupe directement à l'hôtel ou au lieu de séminaire.",
        ],
        liste: [
          'Gare Saint-Laud vers le château : environ 5 minutes',
          'Gare Saint-Laud vers Terra Botanica : 15 minutes',
          'Angers vers l\'aéroport Nantes-Atlantique : environ 1 h 30',
        ],
      },
      {
        h2: 'Visiter Angers en groupe : château, dépose et stationnement',
        paragraphes: [
          "Angers compte 159 022 habitants ([Insee, population de référence 2023](https://www.insee.fr/fr/statistiques/8643952?geo=COM-49007)). Son château, qui abrite la tenture de l'Apocalypse, a accueilli 318 000 visiteurs en 2024 : c'est le 3e monument national le plus visité de France hors Paris, selon le [château d'Angers](https://www.chateau-angers.fr/actualites/318-000-visiteurs-une-frequentation-historique-en-2024-pour-le-chateau-d-angers-qui-devient-le-3e-monument-national-visite-de-france-hors-paris). Ce qu'il faut savoir pour y amener un car, d'après l'office de tourisme :",
          "En pratique, le car dépose le groupe rue Marceau puis repart stationner : prévoyez le point de reprise et l'heure avec le chauffeur avant la visite.",
        ],
        liste: [
          'Dépose et reprise des groupes rue Marceau, à quelques minutes à pied du château : 2 places seulement',
          'Stationnement boulevard Olivier Couffon, une vingtaine de places, à un quart d\'heure à pied du château, avec un code d\'accès à demander à l\'office de tourisme',
          'Hors centre, Terra Botanica fait partie des sites équipés pour accueillir les autocars de tourisme',
        ],
      },
      {
        h2: 'Les sorties en car autour d\'Angers',
        paragraphes: [
          'Les excursions les plus demandées au départ d\'Angers, avec le temps de trajet en autocar :',
          'Pour une sortie scolaire, le Futuroscope et Terra Botanica restent les valeurs sûres : voyez notre page [sorties scolaires en autocar](/services/sorties-scolaires).',
        ],
        liste: [
          'Terra Botanica (15 min) : le parc à thème consacré au végétal, aux portes de la ville',
          'Saumur (1 h) : le château, le Cadre Noir et les caves creusées dans le tuffeau, où de nombreux domaines reçoivent les groupes',
          'Le Puy du Fou (1 h 15) : rester pour la Cinéscénie, le spectacle nocturne, signifie un retour tard dans la nuit, à anticiper dans le devis ; notre guide pour [aller au Puy du Fou en autocar](/blog/puy-du-fou-en-autocar) détaille l\'organisation',
          'Le Futuroscope (2 h 30) : départ tôt le matin, retour en début de soirée',
        ],
      },
      {
        h2: 'Quel véhicule pour votre groupe ?',
        paragraphes: [
          'Le bon format dépend d\'abord de votre effectif :',
          'Pendant les Accroche-Cœurs, le festival des arts de la rue qui anime la ville en septembre (du 11 au 13 septembre en 2026), et les samedis de mai à septembre, les véhicules partent vite : demandez vos devis six à huit semaines avant.',
        ],
        liste: [
          '8 à 20 personnes : un [minibus 20 places avec chauffeur](/location-minibus-20-places), le plus simple en centre-ville',
          '21 à 35 personnes : un midibus ou un autocar 35 places',
          '36 à 59 personnes : l\'autocar standard, celui des [locations de bus 50 places](/location-bus-50-places)',
          '60 personnes et plus : un autocar à double étage ou deux cars',
        ],
      },
      {
        h2: 'Minibus à Angers : avec ou sans chauffeur ?',
        paragraphes: [
          "Beaucoup d'offres de « location de minibus à Angers » sont des véhicules à conduire soi-même. Avec le permis B, on ne conduit qu'un véhicule de 9 places au maximum, conducteur compris ; au-delà, il faut le permis D, donc un chauffeur professionnel. Chez Busmoov, le chauffeur est toujours inclus : il conduit, gère la dépose et le stationnement, et respecte des temps de conduite encadrés. Notre article sur la [location de bus sans chauffeur](/blog/location-bus-sans-chauffeur) compare les deux formules.",
        ],
      },
    ],
    faq: [
      {
        q: 'Comment réserver un minibus avec chauffeur à Angers ?',
        a: "Indiquez votre trajet, vos dates et votre effectif dans le formulaire : nous consultons les transporteurs de Maine-et-Loire et vous recevez plusieurs devis sous 24h.",
      },
      {
        q: 'Comment comparer les offres de location de bus à Angers ?',
        a: "À prestation égale : même véhicule, mêmes horaires, mêmes inclusions (péages, parking, repas du chauffeur). Les écarts entre devis viennent souvent de l'amplitude retenue ou d'un second chauffeur.",
      },
      {
        q: 'Où se trouvent les agences de location de bus à Angers ?',
        a: "Vous n'avez pas besoin de vous déplacer : le car vient vous chercher à l'adresse de votre choix, à Angers comme dans l'agglomération. Les transporteurs que nous consultons sont basés en Maine-et-Loire et dans les départements voisins.",
      },
    ],
    budgets: {
      h2: 'Votre devis de bus avec chauffeur à Angers en 24h',
      intro: "Décrivez votre trajet dans le formulaire en haut de page : départ, destination, dates et effectif. Vous recevez plusieurs devis de transporteurs vérifiés sous 24h, gratuitement et sans engagement.",
    },
    proximite: ['nantes', 'le-mans', 'rennes', 'tours'],
  },
  {
    slug: 'annecy',
    format: 'enrichi',
    nom: 'Annecy',
    metaTitle: 'Location autocar et bus à Annecy avec chauffeur | Busmoov',
    metaDescription: 'Autocar et minibus avec chauffeur à Annecy : aéroport de Genève, tour du lac, stations, Chamonix. Prix de départ et devis gratuit sous 24h.',
    h1: "Location d'autocar et de bus avec chauffeur à Annecy",
    sousTitre: "Du minibus 8 places à l'autocar double étage, toujours avec chauffeur : des autocaristes de Haute-Savoie vérifiés et plusieurs devis gratuits sous 24h.",
    intro: [
      "Vous cherchez un bus à Annecy ? Transfert depuis l'aéroport de Genève, séminaire au bord du lac, sortie au Semnoz ou week-end au ski : Busmoov compare pour vous les devis d'autocaristes de Haute-Savoie, du minibus 8 places à l'autocar 59 places, chauffeur toujours inclus. Décrivez votre trajet ci-dessous, vous recevez plusieurs propositions sous 24h.",
    ],
    prix: {
      h2: "Prix d'une location de bus avec chauffeur à Annecy",
      intro: "Les prix de départ des trajets les plus demandés au départ d'Annecy. Notre [guide des prix de location d'autocar](/blog/prix-location-autocar) détaille ce qui fait varier un devis.",
      tableau: {
        caption: "Prix de départ 2026 au départ d'Annecy, TTC, chauffeur, carburant et péages inclus",
        headers: ['Trajet', 'Durée', 'Minibus 8 à 20 places', 'Autocar 21 à 59 places'],
        rows: [
          ['Aéroport de Genève vers Annecy, aller simple', '1 h', 'à partir de 350 €', 'à partir de 400 €'],
          ['Tour du lac ou journée en ville, mise à disposition', 'sur place', 'à partir de 600 €', 'à partir de 700 €'],
          ['La Clusaz, aller-retour à la journée', '45 min', 'à partir de 600 €', 'à partir de 700 €'],
          ['Yvoire, aller-retour à la journée', '1 h 15', 'à partir de 600 €', 'à partir de 700 €'],
          ['Chamonix, aller-retour à la journée', '1 h 30', 'à partir de 600 €', 'à partir de 700 €'],
          ['Lyon, aller-retour à la journée', '2 h', 'à partir de 900 €', 'à partir de 1 000 €'],
        ],
      },
      note: "Prix de départ TTC (TVA transport 10 %), octobre 2026. Le prix exact dépend de la date, des horaires et de l'effectif ; parking, hébergement et repas du chauffeur en sus. Durées en autocar, hors pauses.",
    },
    sections: [
      {
        h2: 'Navettes gare d\'Annecy et aéroports de Genève et Lyon',
        paragraphes: [
          "La gare d'Annecy, desservie par le TGV, est à deux pas du centre. L'aéroport d'Annecy-Meythet n'accueille plus de ligne régulière : les groupes qui arrivent en avion passent par Genève ou par Lyon-Saint-Exupéry. Les temps de trajet à prévoir en autocar :",
          "Pour un séminaire ou un groupe d'invités, le chauffeur suit l'horaire du vol ou du train et conduit le groupe directement à l'hôtel. Notre service de [transfert aéroport en autocar](/services/transfert-aeroport) organise aussi le retour.",
        ],
        liste: [
          "Gare d'Annecy vers le centre Bonlieu : environ 5 minutes",
          'Aéroport de Genève vers Annecy : environ 1 h, passage de la frontière compris',
          'Aéroport de Lyon-Saint-Exupéry vers Annecy : environ 1 h 30',
        ],
      },
      {
        h2: 'Visiter Annecy en groupe : dépose et stationnement du car',
        paragraphes: [
          "Annecy compte 132 117 habitants ([Insee, population de référence 2023](https://www.insee.fr/fr/statistiques/8643952?geo=COM-74010)), et la vieille ville se visite à pied, au bord du lac. Chaque juin, le Festival international du film d'animation y réunit en plus 18 200 accrédités venus de 118 pays (édition 2025, selon le [Festival d'Annecy](https://www.annecyfestival.com/en/news/2025-full-report)). Pour amener un car au centre, l'office de tourisme indique :",
          "En pratique, le car dépose le groupe rue Jean Jaurès puis repart stationner : convenez du point et de l'heure de reprise avec le chauffeur avant la visite.",
        ],
        liste: [
          'Dépose et reprise des groupes rue Jean Jaurès, à côté du centre Bonlieu : arrêt rapide uniquement, toilettes dans le centre Bonlieu',
          "Stationnement avenue de France, le long de l'église Sainte-Bernadette",
          "Le parking autocars de la Tournette est fermé pour travaux jusqu'au 31 mars 2027",
        ],
      },
      {
        h2: "Les sorties en car autour d'Annecy",
        paragraphes: [
          "Les excursions les plus demandées au départ d'Annecy, avec le temps de trajet en autocar :",
          "Notre guide pour [partir au ski en autocar avec un groupe](/blog/autocar-station-de-ski-groupe) détaille les équipements et les horaires des transferts en station.",
        ],
        liste: [
          'Les gorges du Fier (15 min) : passerelles accrochées à la paroi, à la sortie de la ville',
          'Talloires et la rive est du lac (30 min), ou le Semnoz et son panorama sur les Alpes (30 min)',
          'La Clusaz et Le Grand-Bornand (45 min) : les stations les plus proches, l\'hiver comme l\'été',
          'Yvoire (1 h 15) : village médiéval au bord du Léman',
          'Chamonix (1 h 30) : au pied du Mont-Blanc',
        ],
      },
      {
        h2: 'Quel véhicule pour votre groupe ?',
        paragraphes: [
          "Jusqu'à 20 personnes, un [minibus 20 places avec chauffeur](/location-minibus-20-places) passe partout, y compris sur les routes de col. De 21 à 59 personnes, c'est l'autocar standard, celui des [locations de bus 50 places](/location-bus-50-places). Au-delà, la Haute-Savoie fait partie des départements où l'on trouve des autocars à double étage. Pendant le Festival du film d'animation (du 21 au 27 juin en 2026), l'été et les samedis de vacances d'hiver, demandez vos devis six à huit semaines avant.",
        ],
      },
      {
        h2: 'Minibus à Annecy : avec ou sans chauffeur ?',
        paragraphes: [
          "Beaucoup d'offres de « location de minibus à Annecy » sont des véhicules à conduire soi-même. Avec le permis B, on ne conduit qu'un véhicule de 9 places au maximum, conducteur compris ; au-delà, il faut le permis D, donc un chauffeur professionnel. Chez Busmoov, le chauffeur est toujours inclus : il conduit, gère la dépose et les routes de montagne, et respecte des temps de conduite encadrés. Notre article sur la [location de bus sans chauffeur](/blog/location-bus-sans-chauffeur) compare les deux formules.",
        ],
      },
    ],
    faq: [
      {
        q: 'Comment réserver un minibus avec chauffeur à Annecy ?',
        a: "Indiquez votre trajet, vos dates et votre effectif dans le formulaire : nous consultons les transporteurs de Haute-Savoie et vous recevez plusieurs devis sous 24h.",
      },
      {
        q: 'Comment se déplacer en transport public à Annecy ?',
        a: "Le réseau de bus Sibra dessert Annecy et le Grand Annecy : pratique pour quelques personnes, beaucoup moins pour un groupe avec bagages ou un horaire précis. Un car privé vous prend et vous dépose aux adresses de votre choix.",
      },
      {
        q: 'Où se trouvent les agences de location de bus à Annecy ?',
        a: "Vous n'avez pas besoin de vous déplacer : le car vient vous chercher à l'adresse de votre choix, à Annecy comme autour du lac. Les transporteurs que nous consultons sont basés en Haute-Savoie et dans les départements voisins.",
      },
    ],
    budgets: {
      h2: 'Votre devis de bus avec chauffeur à Annecy en 24h',
      intro: "Décrivez votre trajet dans le formulaire en haut de page : départ, destination, dates et effectif. Vous recevez plusieurs devis de transporteurs vérifiés sous 24h, gratuitement et sans engagement.",
    },
    proximite: ['lyon', 'grenoble'],
  },
  {
    slug: 'le-havre',
    format: 'enrichi',
    nom: 'Le Havre',
    nomA: 'au Havre',
    nomDe: 'du Havre',
    rattacheeA: 'rouen',
    metaTitle: 'Location autocar et bus au Havre avec chauffeur | Busmoov',
    metaDescription: 'Autocar et minibus avec chauffeur au Havre : escales de croisière, Étretat, Honfleur, Mémorial de Caen. Prix de départ et devis gratuit sous 24h.',
    h1: "Location d'autocar et de bus avec chauffeur au Havre",
    sousTitre: "Du minibus 8 places à l'autocar 59 places, toujours avec chauffeur : des autocaristes de Seine-Maritime vérifiés et plusieurs devis gratuits sous 24h.",
    intro: [
      "Vous cherchez un bus au Havre ? Excursion pour une escale de croisière, journée à Étretat ou Honfleur, séminaire ou sortie scolaire : Busmoov compare pour vous les devis d'autocaristes de Seine-Maritime, du minibus 8 places à l'autocar 59 places, chauffeur toujours inclus. Décrivez votre trajet ci-dessous, vous recevez plusieurs propositions sous 24h.",
    ],
    prix: {
      h2: "Prix d'une location de bus avec chauffeur au Havre",
      intro: "Les prix de départ des trajets les plus demandés au départ du Havre. Notre [guide des prix de location d'autocar](/blog/prix-location-autocar) détaille ce qui fait varier un devis.",
      tableau: {
        caption: "Prix de départ 2026 au départ du Havre, TTC, chauffeur, carburant et péages inclus",
        headers: ['Trajet', 'Durée', 'Minibus 8 à 20 places', 'Autocar 21 à 59 places'],
        rows: [
          ['Gare vers le terminal de croisière, aller simple', '5 à 10 min', 'à partir de 400 €', 'à partir de 450 €'],
          ['Journée au Havre, mise à disposition', 'sur place', 'à partir de 700 €', 'à partir de 800 €'],
          ['Honfleur, aller-retour à la journée', '30 min', 'à partir de 700 €', 'à partir de 800 €'],
          ['Étretat et Fécamp, aller-retour à la journée', '45 min', 'à partir de 700 €', 'à partir de 800 €'],
          ['Mémorial de Caen, aller-retour à la journée', '1 h 15', 'à partir de 700 €', 'à partir de 800 €'],
          ['Paris, aller-retour à la journée', '2 h 45', 'à partir de 1 000 €', 'à partir de 1 100 €'],
        ],
      },
      note: "Prix de départ TTC (TVA transport 10 %), octobre 2026. Le prix exact dépend de la date, des horaires et de l'effectif ; parking, hébergement et repas du chauffeur en sus. Durées en autocar, hors pauses.",
    },
    sections: [
      {
        h2: 'Navettes gare, terminal de croisière et aéroports',
        paragraphes: [
          "La gare du Havre est reliée directement à Paris Saint-Lazare, et le terminal de croisière de la Pointe de Floride se trouve à environ 2,5 km de la gare. Il n'y a pas de grand aéroport à proximité : les groupes qui arrivent en avion passent souvent par Paris. Les temps de trajet à prévoir en autocar :",
          "Le minibus avec chauffeur convient à un petit groupe qui arrive en train ou débarque d'un paquebot : le chauffeur suit l'horaire et conduit le groupe directement à l'hôtel, au séminaire ou en excursion.",
        ],
        liste: [
          'Gare du Havre vers le terminal de croisière : 5 à 10 minutes',
          'Le Havre vers l\'aéroport de Deauville-Normandie : environ 45 minutes',
          'Le Havre vers l\'aéroport Paris-Charles-de-Gaulle : environ 3 heures',
        ],
      },
      {
        h2: 'Escales de croisière : excursions en car depuis le port',
        paragraphes: [
          "Le Havre compte 166 687 habitants ([Insee, population de référence 2023](https://www.insee.fr/fr/statistiques/8643952?geo=COM-76351)), et son port a reçu 137 escales de paquebots et plus de 430 000 passagers maritimes en 2025, selon [Le Havre Seine Métropole](https://www.lehavreseinemetropole.fr/croisieres-un-nouvel-horizon). Une escale dure souvent une journée : le car prend le groupe au terminal, enchaîne une ou deux visites et le ramène avant l'appareillage.",
          "Le centre-ville reconstruit par Auguste Perret, inscrit au patrimoine mondial de l'UNESCO en 2005, se visite à pied à quelques minutes du port. Pour une excursion plus longue, Étretat et Honfleur sont à moins d'une heure ; prévoyez toujours une marge confortable sur l'heure de retour à bord.",
        ],
      },
      {
        h2: 'Les sorties en car autour du Havre',
        paragraphes: [
          'Les excursions les plus demandées au départ du Havre, avec le temps de trajet en autocar :',
          'Pour une classe, les règles du transport d\'élèves (ceinture, taux d\'encadrement, schéma de conduite) sont rassemblées sur notre page [location de car pour les sorties scolaires](/services/sorties-scolaires).',
        ],
        liste: [
          'Honfleur (30 min) : le vieux bassin et ses maisons à pans de bois, de l\'autre côté du pont de Normandie',
          'Étretat (45 min) : les falaises et l\'arche de la Côte d\'Albâtre',
          'Fécamp (45 min) : le port et le Palais Bénédictine',
          'Deauville (45 min) : les planches et la plage',
          'Le Mémorial de Caen (1 h 15) : la Seconde Guerre mondiale et le Débarquement',
        ],
      },
      {
        h2: 'Quel véhicule pour votre groupe ?',
        paragraphes: [
          "Jusqu'à 20 personnes, un [minibus 20 places avec chauffeur](/location-minibus-20-places) suffit, y compris pour les petites rues d'Étretat ou de Honfleur. De 21 à 59 personnes, c'est l'autocar standard, celui des [locations de bus 50 places](/location-bus-50-places). Les jours d'escale de plusieurs paquebots et les week-ends d'été, les cars sont très demandés : réservez six à huit semaines à l'avance.",
        ],
      },
      {
        h2: 'Minibus au Havre : avec ou sans chauffeur ?',
        paragraphes: [
          "Beaucoup d'offres de « location de minibus au Havre » sont des véhicules à conduire soi-même. Avec le permis B, on ne conduit qu'un véhicule de 9 places au maximum, conducteur compris ; au-delà, il faut le permis D, donc un chauffeur professionnel. Chez Busmoov, le chauffeur est toujours inclus : il conduit, gère la dépose et respecte des temps de conduite encadrés, ce qui compte pour tenir l'horaire d'un retour à bord.",
        ],
      },
    ],
    faq: [
      {
        q: 'Comment réserver un minibus avec chauffeur au Havre ?',
        a: "Indiquez votre trajet, vos dates et votre effectif dans le formulaire : nous consultons les transporteurs de Seine-Maritime et vous recevez plusieurs devis sous 24h.",
      },
      {
        q: 'Quels services de transport touristique au Havre ?',
        a: "Transferts entre la gare, le terminal de croisière et les hôtels, excursions à la journée sur la Côte d'Albâtre ou à Honfleur, mise à disposition d'un car pour un séminaire ou un événement : le car vous prend et vous dépose aux adresses de votre choix.",
      },
      {
        q: 'Où trouver une agence de location de bus au Havre ?',
        a: "Vous n'avez pas besoin de vous déplacer : le car vient vous chercher à l'adresse de votre choix. Les transporteurs que nous consultons sont basés en Seine-Maritime et dans les départements voisins.",
      },
    ],
    budgets: {
      h2: 'Votre devis de bus avec chauffeur au Havre en 24h',
      intro: "Décrivez votre trajet dans le formulaire en haut de page : départ, destination, dates et effectif. Vous recevez plusieurs devis de transporteurs vérifiés sous 24h, gratuitement et sans engagement.",
    },
    proximite: ['rouen'],
  },
  {
    slug: 'metz',
    format: 'enrichi',
    nom: 'Metz',
    rattacheeA: 'strasbourg',
    metaTitle: 'Location autocar et bus à Metz avec chauffeur | Busmoov',
    metaDescription: 'Autocar et minibus avec chauffeur à Metz : Luxembourg, Sarre, Trèves, Verdun, navettes gare et aéroport. Prix de départ et devis gratuit sous 24h.',
    h1: "Location d'autocar et de bus avec chauffeur à Metz",
    sousTitre: "Du minibus 8 places à l'autocar 59 places, toujours avec chauffeur : des autocaristes de Moselle vérifiés et plusieurs devis gratuits sous 24h.",
    intro: [
      "Vous cherchez un bus à Metz ? Navette vers la gare ou l'aéroport, journée au Luxembourg ou en Sarre, sortie scolaire à Verdun ou séminaire : Busmoov compare pour vous les devis d'autocaristes de Moselle, du minibus 8 places à l'autocar 59 places, chauffeur toujours inclus. Décrivez votre trajet ci-dessous, vous recevez plusieurs propositions sous 24h.",
    ],
    prix: {
      h2: "Prix d'une location de bus avec chauffeur à Metz",
      intro: "Les prix de départ des trajets les plus demandés au départ de Metz. Notre [guide des prix de location d'autocar](/blog/prix-location-autocar) détaille ce qui fait varier un devis.",
      tableau: {
        caption: 'Prix de départ 2026 au départ de Metz, TTC, chauffeur, carburant et péages inclus',
        headers: ['Trajet', 'Durée', 'Minibus 8 à 20 places', 'Autocar 21 à 59 places'],
        rows: [
          ["Gare de Metz vers l'aéroport Metz-Nancy-Lorraine, aller simple", '30 min', 'à partir de 400 €', 'à partir de 450 €'],
          ['Journée à Metz, mise à disposition', 'sur place', 'à partir de 700 €', 'à partir de 800 €'],
          ['Luxembourg, aller-retour à la journée', '1 h', 'à partir de 700 €', 'à partir de 800 €'],
          ['Verdun, aller-retour à la journée', '1 h', 'à partir de 700 €', 'à partir de 800 €'],
          ['Sarrebruck, aller-retour à la journée', '1 h', 'à partir de 700 €', 'à partir de 800 €'],
          ['Strasbourg, aller-retour à la journée', '2 h', 'à partir de 1 000 €', 'à partir de 1 100 €'],
        ],
      },
      note: "Prix de départ TTC (TVA transport 10 %), octobre 2026. Le prix exact dépend de la date, des horaires et de l'effectif ; parking, hébergement et repas du chauffeur en sus. Durées en autocar, hors pauses.",
    },
    sections: [
      {
        h2: 'Navettes gare, TGV et aéroports',
        paragraphes: [
          "Metz a deux portes d'entrée ferroviaires : la gare de Metz-Ville, en plein centre, et la gare Lorraine TGV, en rase campagne entre Metz et Nancy. Côté avion, l'aéroport Metz-Nancy-Lorraine est le plus proche, mais beaucoup de groupes passent par celui de Luxembourg. Les temps de trajet à prévoir en autocar :",
          "Un minibus avec chauffeur attend le groupe à l'arrivée du train ou du vol, même en cas de retard, et le conduit directement à l'hôtel ou au séminaire : pas de correspondance en bus régional avec les bagages.",
        ],
        liste: [
          "Gare de Metz-Ville vers l'aéroport Metz-Nancy-Lorraine : environ 30 minutes",
          'Gare de Metz-Ville vers la gare Lorraine TGV : environ 30 minutes',
          "Metz vers l'aéroport de Luxembourg : environ 1 heure",
        ],
      },
      {
        h2: 'Visiter Metz en groupe',
        paragraphes: [
          "Metz compte 122 572 habitants ([Insee, population de référence 2023](https://www.insee.fr/fr/statistiques/8643952?geo=COM-57463)). Son premier site de visite, le Centre Pompidou-Metz, se trouve juste derrière la gare et a accueilli 315 148 visiteurs en 2025, hors groupes scolaires, selon [le musée](https://api.centrepompidou-metz.fr/files/bc856faa/cp_bilan_frequentation_2025_7janv3.pdf).",
          "La cathédrale Saint-Étienne possède la plus grande surface de vitraux de France, environ 6 500 m², dont des créations de Chagall ([office de tourisme de Metz](https://www.tourisme-metz.com/en/page/838145823-vitraux-de-la-cathedrale-saint-etienne)). Le car dépose le groupe au plus près du centre piéton, repart stationner et revient à l'heure convenue : une demi-journée suffit pour enchaîner le musée et la cathédrale.",
        ],
      },
      {
        h2: "Sarre, Trèves, Luxembourg : l'étranger à une heure de Metz",
        paragraphes: [
          "Metz est l'une des rares villes françaises d'où l'on fait une sortie à l'étranger dans la journée sans long trajet. Les destinations transfrontalières les plus demandées, avec le temps de trajet en autocar :",
          "Pour un séjour plus loin en Allemagne (Cologne, Munich, Europa-Park) ou pour les règles des zones environnementales, voyez notre page [location d'autocar pour l'Allemagne](/location-autocar-allemagne).",
        ],
        liste: [
          'Sarrebruck (1 h) : la capitale de la Sarre et son marché de Noël',
          "Völklingen (1 h) : l'ancienne usine sidérurgique, inscrite au patrimoine mondial de l'UNESCO",
          'Trèves (1 h 30) : la Porta Nigra et la plus ancienne ville romaine d\'Allemagne',
          'Luxembourg (1 h) : la vieille ville et les quartiers européens',
          "Schengen (45 min) : le village qui a donné son nom à l'accord, au point de rencontre de trois pays",
        ],
      },
      {
        h2: 'Les sorties en car autour de Metz',
        paragraphes: [
          "Côté français, le pôle de loisirs d'Amnéville (zoo, parc d'attractions) est à 30 minutes, et Verdun, ses champs de bataille et l'ossuaire de Douaumont à une heure : c'est la sortie mémorielle de référence pour les collèges et lycées. Nancy et la place Stanislas sont aussi à une heure, voir notre page [location d'autocar à Nancy](/location-autocar/nancy). Pour l'Alsace et ses marchés de Noël, comptez deux heures jusqu'à Strasbourg, où nous avons une [page de location d'autocar à Strasbourg](/location-autocar/strasbourg).",
          'Pour une classe, les règles du transport d\'élèves (ceinture, taux d\'encadrement, schéma de conduite) sont rassemblées sur notre page [location de car pour les sorties scolaires](/services/sorties-scolaires).',
        ],
      },
      {
        h2: 'Quel véhicule pour votre groupe ?',
        paragraphes: [
          "Jusqu'à 20 personnes, un [minibus 20 places avec chauffeur](/location-minibus-20-places) suffit pour une navette ou une visite en ville. De 21 à 59 personnes, c'est l'autocar standard, celui des [locations de bus 50 places](/location-bus-50-places). En décembre, les week-ends de marchés de Noël en Lorraine, en Sarre et en Alsace saturent les plannings : réservez dès septembre.",
        ],
      },
      {
        h2: 'Minibus à Metz : avec ou sans chauffeur ?',
        paragraphes: [
          "Une grande partie des offres de « location de minibus à Metz » sont des véhicules sans chauffeur. Or le permis B limite à 9 places, conducteur compris ; au-delà, il faut le permis D et donc un chauffeur professionnel. Chez Busmoov, le chauffeur est toujours inclus : il connaît les accès cars de Luxembourg et des villes allemandes, gère la dépose et respecte des temps de conduite encadrés.",
        ],
      },
    ],
    faq: [
      {
        q: 'Comment réserver un bus avec chauffeur à Metz ?',
        a: 'Indiquez votre trajet, vos dates et votre effectif dans le formulaire : nous consultons les transporteurs de Moselle et vous recevez plusieurs devis sous 24h.',
      },
      {
        q: 'Peut-on aller en Allemagne ou au Luxembourg en car depuis Metz ?',
        a: "Oui. Sarrebruck, Völklingen et Luxembourg sont à environ une heure, Trèves à une heure et demie : une excursion à la journée suffit. Chaque passager doit avoir sa pièce d'identité, et une autorisation de sortie du territoire pour les mineurs en sortie scolaire.",
      },
      {
        q: 'Où trouver une agence de location de bus à Metz ?',
        a: "Vous n'avez pas besoin de vous déplacer : le car vient vous chercher à l'adresse de votre choix. Les transporteurs que nous consultons sont basés en Moselle et dans les départements voisins.",
      },
    ],
    budgets: {
      h2: 'Votre devis de bus avec chauffeur à Metz en 24h',
      intro: 'Décrivez votre trajet dans le formulaire en haut de page : départ, destination, dates et effectif. Vous recevez plusieurs devis de transporteurs vérifiés sous 24h, gratuitement et sans engagement.',
    },
    proximite: ['strasbourg', 'nancy'],
  },
]

/** « à Lyon », « au Havre » */
export const aLaVille = (v: Ville): string => v.nomA ?? `à ${v.nom}`
/** « de Lyon », « du Havre » */
export const deLaVille = (v: Ville): string => v.nomDe ?? `de ${v.nom}`

/** Villes listées dans les blocs de maillage automatiques (hors villes rattachées). */
export const villesMaillees: Ville[] = villes.filter((v) => !v.rattacheeA)

export function getVille(slug: string): Ville | undefined {
  return villes.find((v) => v.slug === slug)
}
