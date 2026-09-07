/**
 * Pages villes SEO — contenu unique par ville (français uniquement,
 * ces pages ciblent les recherches « location autocar <ville> »).
 * URL : /fr/location-autocar/<slug>
 */

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
}

export interface Ville {
  slug: string
  nom: string
  metaTitle: string
  metaDescription: string
  h1: string
  sousTitre: string
  intro: string[]
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
  faq: VilleFaq[]
}

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
      "Votre événement se joue hors d'Île-de-France ? Busmoov organise aussi la [location d'autocar à Lille](/location-autocar/lille) pour les groupes du Nord, et les navettes de la semaine de course avec la [location d'autocar au Mans](/location-autocar/le-mans). Avant de valider votre budget, notre guide du [prix de la location d'un autocar](/blog/prix-location-autocar) détaille ce qui fait varier un devis.",
    ],
    faq: [
      {
        q: 'Combien coûte la location d\'un autocar avec chauffeur à Paris ?',
        a: 'Une journée en autocar standard (jusqu\'à 59 places) démarre à 690 € TTC pour un aller-retour local. Le tarif dépend de la distance, de l\'amplitude horaire et de la taille du véhicule. Un transfert aéroport simple coûte moins cher qu\'une mise à disposition à la journée : demandez un devis gratuit, vous recevez plusieurs propositions sous 24h.',
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
    nom: 'Lyon',
    metaTitle: 'Location d\'autocar à Lyon avec chauffeur — Devis 24h | Busmoov',
    metaDescription: "Autocar et minibus avec chauffeur à Lyon : transferts Saint-Exupéry, stations de ski, Eurexpo, Beaujolais. Devis gratuit sous 24h.",
    h1: 'Location d\'autocar avec chauffeur à Lyon',
    sousTitre: 'Transferts Saint-Exupéry, navettes stations de ski, événements à Eurexpo : des transporteurs rhodaniens vérifiés, un devis gratuit en 24h.',
    intro: [
      'Carrefour entre Paris, les Alpes et la Méditerranée, Lyon est une des places fortes du transport par autocar. Salons à Eurexpo, matchs au Groupama Stadium, conventions à la Cité Internationale : Busmoov s\'appuie sur des transporteurs implantés dans le Rhône et l\'Ain pour couvrir la métropole sans frais d\'approche superflus.',
      'La spécialité locale, ce sont les navettes vers les stations : de décembre à avril, nos partenaires enchaînent les rotations vers les 3 Vallées, l\'Alpe d\'Huez ou les Portes du Soleil. Le reste de l\'année, cap sur le Beaujolais, Annecy ou Genève pour les sorties d\'entreprise et les excursions associatives.',
    ],
    sectionLocale: {
      h2: "Un transfert ski bien préparé au départ de Lyon",
      paragraphes: [
        "Le schéma habituel : prise en charge à Part-Dieu ou Perrache tôt le matin, autoroute A43 vers la Maurienne (les 3 Vallées, la Tarentaise) ou A48/RD1091 vers l'Oisans. Les samedis de vacances de février sont les journées les plus chargées de l'année sur ces axes : les chauffeurs habitués partent 30 à 45 minutes plus tôt et connaissent les créneaux qui passent.",
        "Le matériel voyage en soute — comptez un sac ski + une valise par personne pour dimensionner le véhicule. L'hiver, pneus neige et chaînes sont obligatoires sur les routes d'accès aux stations (loi Montagne) : c'est l'équipement standard des cars de nos partenaires rhodaniens, rien à prévoir de votre côté.",
      ],
    },
    h2Destinations: "Alpes, lac d'Annecy, Beaujolais : où partent les groupes lyonnais",
    h2Trajets: "Trajets types au départ de Lyon",
    destinations: [
      { nom: 'Stations des Alpes', desc: 'Val Thorens, Courchevel, l\'Alpe d\'Huez, Chamonix : le transfert ski est la demande n°1 au départ de Lyon en hiver.' },
      { nom: 'Annecy et son lac', desc: 'L\'excursion à la journée préférée des CE lyonnais, à 1h30 de route.' },
      { nom: 'Le Beaujolais', desc: 'Route des vins, visites de domaines et repas de groupe — le car règle la question du retour.' },
      { nom: 'Genève', desc: 'Transferts aéroport de Genève et sorties transfrontalières : nos transporteurs gèrent les formalités du passage en Suisse.' },
      { nom: 'Pérouges et la Dombes', desc: 'Cité médiévale et parc des oiseaux : les classiques des sorties scolaires de la région.' },
      { nom: 'Vienne et la vallée du Rhône', desc: 'Jazz à Vienne, sites gallo-romains, caves de Condrieu à moins d\'une heure.' },
    ],
    trajets: [
      'Transfert Lyon ↔ aéroport Saint-Exupéry pour un groupe',
      'Navette week-end Lyon → station de ski (Tignes, Val d\'Isère, Les Arcs)',
      'Presqu\'île ↔ Eurexpo ou Groupama Stadium pour un événement',
      'Lyon → Annecy, Genève ou le Beaujolais à la journée',
    ],
    liensUtiles: [
      "Côté Alpes, la [location d'autocar à Grenoble](/location-autocar/grenoble) couvre l'Oisans et le Vercors ; côté Forez, la [location d'autocar à Saint-Étienne](/location-autocar/saint-etienne) gère notamment les déplacements de supporters. Et pour un petit comité, la [location de minibus avec chauffeur](/services/location-minibus) est souvent la formule la plus souple.",
    ],
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Lyon ?',
        a: 'Une journée en autocar standard démarre à 690 € TTC pour un aller-retour local. Un transfert vers une station des Alpes ou l\'aéroport Saint-Exupéry est chiffré selon la distance et l\'horaire. Vous recevez plusieurs devis gratuits de transporteurs de la région sous 24h.',
      },
      {
        q: 'Faites-vous les transferts vers les stations de ski ?',
        a: 'C\'est une de nos demandes les plus fréquentes au départ de Lyon. Les cars sont équipés de soutes pour les skis et les chauffeurs sont habitués aux routes de montagne (équipements hiver obligatoires inclus). Réservez tôt pour les samedis de vacances scolaires — c\'est le créneau le plus chargé de l\'année.',
      },
      {
        q: 'Peut-on aller en Suisse (Genève) avec l\'autocar ?',
        a: 'Oui. Nos transporteurs effectuent régulièrement Lyon-Genève, aéroport compris. Le véhicule dispose des autorisations nécessaires ; pensez simplement aux pièces d\'identité des passagers.',
      },
      {
        q: 'Quel délai pour obtenir un devis à Lyon ?',
        a: 'Sous 24h ouvrées dans la plupart des cas. Pour un départ en haute saison de ski (février-mars), demandez votre devis plusieurs semaines à l\'avance : les disponibilités partent vite.',
      },
    ],
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
    ],
    faq: [
      {
        q: 'Combien coûte la location d\'un autocar à Marseille ?',
        a: 'Une journée en autocar standard démarre à 690 € TTC pour un aller-retour local ; un transfert port ↔ aéroport pour un groupe est chiffré selon l\'horaire et le nombre de passagers. Vous recevez plusieurs devis gratuits de transporteurs provençaux sous 24h.',
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
    sousTitre: 'Transferts Blagnac, excursions à Carcassonne et dans les Pyrénées, déplacements d\'entreprise : des transporteurs occitans vérifiés, un devis gratuit en 24h.',
    intro: [
      'Capitale européenne de l\'aéronautique, Toulouse génère un flux constant de déplacements professionnels : visites de sites industriels, délégations à accueillir à Blagnac, séminaires au MEETT. Nos transporteurs partenaires de Haute-Garonne connaissent ces circuits par cœur, badges et consignes d\'accès compris.',
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
    ],
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Toulouse ?',
        a: 'Une journée en autocar standard démarre à 690 € TTC pour un aller-retour local. Carcassonne ou Albi à la journée restent dans les petites tranches kilométriques, donc parmi les sorties les plus économiques. Vous recevez plusieurs devis gratuits sous 24h.',
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
    sousTitre: 'Circuits dans les vignobles, transferts Mérignac, escapades au bassin d\'Arcachon : des transporteurs girondins vérifiés, un devis gratuit en 24h.',
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
    ],
    faq: [
      {
        q: 'Combien coûte la location d\'un autocar à Bordeaux ?',
        a: 'Une journée en autocar standard démarre à 690 € TTC pour un aller-retour local ; un circuit vignobles avec plusieurs étapes est chiffré selon l\'itinéraire et l\'amplitude. Vous recevez plusieurs devis gratuits de transporteurs girondins sous 24h.',
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
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Lille ?',
        a: 'Une journée en autocar standard démarre à 690 € TTC pour un aller-retour local. Une excursion à Bruges ou Bruxelles reste dans les tranches kilométriques basses — c\'est l\'une des sorties transfrontalières les plus économiques de France. Devis gratuit sous 24h.',
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
    ],
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Nantes ?',
        a: 'Une journée en autocar standard démarre à 690 € TTC pour un aller-retour local. L\'aller-retour Puy du Fou, avec son amplitude longue (les spectacles finissent tard), se chiffre selon l\'horaire de retour — précisez si vous restez pour la Cinéscénie. Devis gratuit sous 24h.',
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
    ],
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Biarritz ?',
        a: 'Une journée en autocar standard démarre à 690 € TTC pour un aller-retour local ; les transferts aéroport et navettes de soirée sont chiffrés selon l\'horaire. En été et pendant les grands week-ends de surf, réservez tôt : la côte basque est l\'une des zones les plus demandées de France. Devis gratuit sous 24h.',
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
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Arcachon ?',
        a: 'Une journée en autocar standard démarre à 690 € TTC pour un circuit local. Le transfert Bordeaux ↔ Arcachon pour un groupe est l\'une des demandes les plus courantes et reste économique. Devis gratuit sous 24h.',
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
    ],
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur au Mans ?',
        a: 'Une journée en autocar standard démarre à 690 € TTC pour un aller-retour local. Pendant la semaine des 24 Heures, la demande explose et les tarifs suivent les disponibilités : réservez plusieurs mois à l\'avance. Devis gratuit sous 24h.',
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
    ],
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Montpellier ?',
        a: 'Une journée en autocar standard démarre à 690 € TTC pour un aller-retour local — la Camargue ou le pont du Gard restent dans les petites tranches kilométriques. Devis gratuit de transporteurs de l\'Hérault sous 24h.',
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
    ],
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Saint-Étienne ?',
        a: 'Une journée en autocar standard démarre à 690 € TTC pour un aller-retour local. Un déplacement de supporters se chiffre selon la distance du stade adverse et l\'attente pendant le match. Devis gratuit sous 24h.',
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
      "Depuis l'Alsace, les liaisons longue distance passent souvent par la [location d'autocar à Lyon](/location-autocar/lyon) ou par la capitale — voir la [location d'autocar sur Paris](/location-autocar/paris). Pour budgéter une sortie marché de Noël, notre guide [combien coûte un autocar avec chauffeur ?](/blog/prix-location-autocar) donne les fourchettes réelles.",
    ],
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Strasbourg ?',
        a: 'Une journée en autocar standard démarre à 690 € TTC pour un aller-retour local. En période de marché de Noël (fin novembre à fin décembre), la demande est très forte : réservez dès septembre-octobre. Devis gratuit sous 24h.',
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
    ],
    faq: [
      {
        q: 'Combien coûte un autocar avec chauffeur à Grenoble ?',
        a: 'Une journée en autocar standard démarre à 690 € TTC pour un aller-retour local. Un transfert station se chiffre selon la distance et la saison — les samedis de vacances de février sont les créneaux les plus tendus de l\'année. Devis gratuit sous 24h.',
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
]

export function getVille(slug: string): Ville | undefined {
  return villes.find((v) => v.slug === slug)
}
