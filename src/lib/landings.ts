/**
 * Landing pages SEO françaises pilotées par données (rendues par
 * LandingSeoPage, prérendues par scripts/prerender.mjs, sitemap auto).
 * URL : /fr/<slug>. Les paragraphes acceptent les liens markdown
 * [ancre](/chemin). Ajouter une page = ajouter une entrée ici.
 */

export interface LandingSection {
  h2: string
  paragraphes?: string[]
  liste?: string[]
}

export interface LandingFaq {
  q: string
  a: string
}

export interface Landing {
  /** Chemin sans préfixe de langue, ex. /navette-entreprise */
  slug: string
  metaTitle: string
  metaDescription: string
  h1: string
  sousTitre: string
  intro: string[]
  sections: LandingSection[]
  faq: LandingFaq[]
  /** Libellé du service pour le JSON-LD. */
  serviceType: string
}

export const landings: Landing[] = [
  {
    slug: '/navette-aeroport-cdg',
    metaTitle: 'Navette aéroport CDG en autocar pour groupes | Busmoov',
    metaDescription: 'Transfert groupe aéroport Roissy CDG en autocar ou minibus avec chauffeur : dépose terminal, suivi des vols, départs matinaux. Devis gratuit sous 24h.',
    h1: 'Navette aéroport Roissy CDG pour groupes',
    sousTitre: 'Autocar ou minibus avec chauffeur entre Paris, l\'Île-de-France et les terminaux de Roissy — dépose au plus près, horaires calés sur votre vol.',
    intro: [
      'Premier aéroport de France, Roissy Charles-de-Gaulle voit transiter chaque jour des centaines de groupes : voyages scolaires, séminaires, circuits touristiques, délégations. La navette en autocar est le seul moyen de déplacer 30 ou 50 personnes avec leurs bagages en un seul mouvement — sans se disperser entre RER, taxis et VTC.',
      'Nos transporteurs franciliens font les rotations CDG quotidiennement : ils connaissent les niveaux de dépose de chaque terminal, les zones de stationnement autocars et les créneaux où l\'A1 et l\'A3 saturent. Vous donnez le numéro de vol, ils gèrent le reste.',
    ],
    sections: [
      {
        h2: 'Dépose et prise en charge : comment ça se passe à CDG',
        paragraphes: [
          'À l\'aller, l\'autocar dépose le groupe au niveau Départs du bon terminal (1, 2A à 2G, ou 3) — les zones de dépose cars sont chronométrées, le groupe descend et le véhicule repart. Au retour, le chauffeur suit votre vol en temps réel : en cas de retard, la prise en charge se décale automatiquement, sans supplément surprise. Le point de rendez-vous exact (porte de sortie, zone cars) vous est communiqué avec les coordonnées du chauffeur avant le voyage.',
        ],
      },
      {
        h2: 'Quel timing prévoir ?',
        liste: [
          'Vol long-courrier : présentation 3h avant le décollage — depuis Paris intra-muros, comptez 45 min à 1h15 de trajet selon l\'heure',
          'Vol européen : présentation 2h avant suffit dans la plupart des cas',
          'Départs très matinaux (avant 6h) : courants pour les vols de groupe, nos chauffeurs en font toutes les semaines',
          'Heure de pointe (7h-9h30, 17h-19h30) : l\'A1 sature — le chauffeur prévoit la marge, c\'est son métier',
        ],
      },
      {
        h2: 'Pour qui, et à quel prix ?',
        paragraphes: [
          'Voyages scolaires vers l\'étranger, séminaires qui accueillent des participants, groupes de touristes en circuit, sportifs en déplacement : tout groupe de 8 à 90 personnes avec des bagages. Un transfert simple Paris ↔ CDG en minibus démarre autour de 300 à 450 € TTC selon l\'horaire ; en autocar standard, comptez de l\'ordre de 450 à 690 € TTC. Le prix est ferme : chauffeur, carburant et péages inclus. Pour le détail des tarifs, voir notre guide du [prix de la location d\'un autocar](/blog/prix-location-autocar).',
        ],
      },
    ],
    faq: [
      {
        q: 'Que se passe-t-il si notre vol atterrit en retard ?',
        a: 'Le chauffeur suit le vol via son numéro : la prise en charge se cale sur l\'heure d\'atterrissage réelle. Une franchise d\'attente est incluse ; au-delà d\'un retard important, le transporteur vous prévient et s\'adapte.',
      },
      {
        q: 'L\'autocar peut-il déposer à plusieurs terminaux ?',
        a: 'Oui, si votre groupe est réparti sur plusieurs vols, l\'autocar enchaîne les terminaux (1, 2 et 3 sont à quelques minutes les uns des autres). Précisez-le dans la demande pour que le timing soit prévu.',
      },
      {
        q: 'Peut-on organiser une navette CDG pour un groupe hors de Paris ?',
        a: 'Bien sûr : nos transporteurs couvrent toute l\'Île-de-France et la province. Un aller simple Lille-CDG, Reims-CDG ou Rouen-CDG pour un groupe est un trajet courant, souvent plus économique que les billets de train pour tous.',
      },
      {
        q: 'Et pour l\'aéroport d\'Orly ?',
        a: 'Même service au sud de Paris : voir notre page dédiée à la [navette aéroport Orly](/navette-aeroport-orly).',
      },
    ],
    serviceType: 'Navette aéroport Roissy CDG pour groupes',
  },
  {
    slug: '/navette-aeroport-orly',
    metaTitle: 'Navette aéroport Orly en autocar pour groupes | Busmoov',
    metaDescription: 'Transfert groupe aéroport Orly en autocar ou minibus avec chauffeur : dépose Orly 1-2-3-4, suivi des vols, sud francilien. Devis gratuit sous 24h.',
    h1: 'Navette aéroport Orly pour groupes',
    sousTitre: 'Autocar ou minibus avec chauffeur entre Paris, le sud francilien et Orly 1-2-3-4 — le transfert groupe sans dispersion ni correspondances.',
    intro: [
      'Deuxième aéroport de France, Orly dessert massivement le sud de l\'Europe, l\'Afrique du Nord et les Outre-mer — des destinations très voyagées en groupe : familles, associations, scolaires, pèlerinages. Depuis Paris ou le sud de l\'Île-de-France, la navette en autocar évite au groupe la correspondance Orlyval et les taxis multiples.',
      'L\'aérogare unique d\'Orly (terminaux 1-2-3-4 reliés à pied) simplifie la logistique : une seule dépose suffit dans la plupart des cas. Nos transporteurs du sud francilien connaissent les accès par l\'A6 et l\'A106 et les créneaux à éviter.',
    ],
    sections: [
      {
        h2: 'Orly côté pratique pour un groupe',
        liste: [
          'Dépose au niveau Départs du terminal de votre vol (Orly 1-2-3 ou Orly 4) — les terminaux se rejoignent à pied en quelques minutes',
          'Présentation 2h avant un vol moyen-courrier, 3h pour les Outre-mer et les longs-courriers',
          'Depuis Paris intra-muros : 30 à 50 minutes selon l\'heure ; depuis l\'Essonne ou le Val-de-Marne, souvent moins',
          'Au retour : suivi du vol par le chauffeur, prise en charge en zone autocars avec point de rendez-vous précis communiqué à l\'avance',
        ],
      },
      {
        h2: 'Combien coûte une navette Orly pour un groupe ?',
        paragraphes: [
          'Un transfert simple Paris ↔ Orly démarre autour de 250 à 400 € TTC en minibus (8-20 personnes) et de 400 à 650 € TTC en autocar standard, selon l\'horaire et le point de départ. Prix ferme, chauffeur et péages inclus — à comparer aux 15 taxis qu\'il faudrait pour le même groupe. Les fourchettes détaillées sont dans notre guide du [prix de la location d\'un autocar](/blog/prix-location-autocar).',
        ],
      },
      {
        h2: 'CDG, Beauvais, province : on couvre aussi',
        paragraphes: [
          'Pour un départ depuis Roissy, voir la [navette aéroport CDG](/navette-aeroport-cdg). Les groupes qui décollent de Beauvais-Tillé (vols low-cost) réservent souvent la navette depuis Paris — 1h15 de trajet que l\'autocar transforme en simple formalité. Et pour tous les [transferts aéroport en groupe](/services/transfert-aeroport), notre page service détaille le fonctionnement.',
        ],
      },
    ],
    faq: [
      {
        q: 'Un même devis peut-il couvrir l\'aller à Orly et le retour à CDG ?',
        a: 'Oui, c\'est fréquent pour les circuits (arrivée et départ sur des vols différents). Indiquez les deux aéroports et les deux horaires dans votre demande : le devis couvre l\'ensemble.',
      },
      {
        q: 'Gérez-vous les départs de nuit ou très tôt le matin ?',
        a: 'Oui — les vols vers les Outre-mer et le Maghreb partent souvent tôt : une prise en charge à 4h30 du matin est un trajet ordinaire pour nos transporteurs franciliens.',
      },
      {
        q: 'Le car peut-il attendre si les bagages tardent à la livraison ?',
        a: 'Une franchise d\'attente après l\'atterrissage est prévue dans le devis, précisément pour absorber la livraison des bagages et le passage des contrôles.',
      },
    ],
    serviceType: 'Navette aéroport Orly pour groupes',
  },
  {
    slug: '/navette-entreprise',
    metaTitle: 'Navette d\'entreprise : transport de salariés en bus | Busmoov',
    metaDescription: 'Navette d\'entreprise régulière ou ponctuelle : domicile-travail, inter-sites, événements. Bus et minibus avec chauffeur, devis gratuit sous 24h.',
    h1: 'Navette d\'entreprise en bus ou minibus',
    sousTitre: 'Domicile-travail, liaisons inter-sites, événements : des navettes régulières ou ponctuelles avec chauffeur, dimensionnées à vos effectifs.',
    intro: [
      'Un site mal desservi par les transports en commun, deux établissements à relier, un parking saturé : la navette d\'entreprise répond à des problèmes très concrets de mobilité des salariés. Elle s\'inscrit de plus en plus dans les plans de mobilité employeur — et dans le bilan carbone, un bus rempli remplaçant des dizaines de voitures individuelles.',
      'Busmoov met en place des navettes ponctuelles (un événement, un salon, une journée) comme des dessertes régulières (tous les matins et soirs, aux horaires des équipes). Dans les deux cas : chauffeur professionnel, véhicule adapté à l\'effectif réel, facturation entreprise.',
    ],
    sections: [
      {
        h2: 'Les trois formats de navette entreprise',
        liste: [
          'Régulière domicile-travail : circuit fixe matin et soir depuis les gares ou zones d\'habitat vers le site — le format plan de mobilité, contractualisé au mois ou à l\'année',
          'Inter-sites : liaison entre deux établissements (siège ↔ usine, bureaux ↔ entrepôt), à la demande ou cadencée',
          'Événementielle : séminaire, salon, soirée d\'entreprise, visite de site — une journée ou quelques jours, voir aussi nos [déplacements d\'entreprise en autocar](/blog/autocar-deplacement-entreprise)',
        ],
      },
      {
        h2: 'Quel véhicule pour quelle navette ?',
        paragraphes: [
          'La bonne taille se calcule sur la fréquentation réelle, pas sur l\'effectif théorique : une navette domicile-travail transporte rarement 100 % des inscrits chaque jour. Un minibus 20 places couvre la plupart des dessertes de site ; un autocar standard (jusqu\'à 59 places) s\'impose pour les gros flux ou les événements. Notre page [location de bus](/location-bus) détaille les capacités.',
        ],
      },
      {
        h2: 'Combien ça coûte ?',
        paragraphes: [
          'Une navette événementielle à la journée démarre à 690 € TTC en autocar standard. Pour une desserte régulière, le tarif se construit sur le circuit, la fréquence et la durée d\'engagement — un devis sur mesure avec un interlocuteur unique, révisable quand vos effectifs évoluent. Facturation mensuelle entreprise, paiement par virement.',
        ],
      },
    ],
    faq: [
      {
        q: 'Peut-on tester une navette avant de s\'engager à l\'année ?',
        a: 'Oui, c\'est même recommandé : une période pilote de quelques semaines permet de mesurer la fréquentation réelle et d\'ajuster circuit, horaires et taille de véhicule avant de contractualiser.',
      },
      {
        q: 'La navette peut-elle être partagée entre plusieurs entreprises ?',
        a: 'Sur une même zone d\'activité, mutualiser une navette entre voisins divise les coûts — c\'est un montage courant dans les plans de mobilité inter-entreprises. Nous organisons le circuit et la répartition de la facturation.',
      },
      {
        q: 'Qui gère les aléas (chauffeur absent, panne) ?',
        a: 'Le transporteur, contractuellement : véhicule de remplacement et chauffeur suppléant font partie du service sur les dessertes régulières. Vous avez un numéro direct en cas d\'imprévu du matin.',
      },
      {
        q: 'La navette entreprise est-elle un avantage social imposable ?',
        a: 'Le transport collectif mis en place par l\'employeur pour les trajets domicile-travail bénéficie en général d\'un régime social favorable — votre expert-comptable confirmera le traitement exact selon votre montage.',
      },
    ],
    serviceType: 'Navette d\'entreprise avec chauffeur',
  },
  {
    slug: '/location-bus-50-places',
    metaTitle: 'Location de bus 50 places avec chauffeur — Devis 24h | Busmoov',
    metaDescription: 'Louez un bus 49 à 59 places avec chauffeur : le format le plus demandé et le plus économique par personne. Plusieurs devis gratuits sous 24h.',
    h1: 'Location de bus 50 places avec chauffeur',
    sousTitre: 'Le format le plus demandé de France : un autocar de tourisme de 49 à 59 places, chauffeur professionnel inclus, au meilleur prix par personne.',
    intro: [
      '« Un bus de 50 places » : c\'est la demande la plus fréquente que nous recevons — et pour cause, elle correspond à une classe avec ses accompagnateurs, un service d\'entreprise, une association ou une noce. Dans la pratique, ce besoin est couvert par l\'autocar de tourisme standard, décliné en 49, 53, 55 ou 59 sièges selon les modèles.',
      'Bonne nouvelle : c\'est aussi le format le plus économique par personne, parce que c\'est le plus répandu dans les flottes. Décrivez votre effectif exact et votre trajet : nous comparons plusieurs devis de transporteurs vérifiés et le véhicule proposé colle à votre groupe, ni trop grand ni trop juste.',
    ],
    sections: [
      {
        h2: 'Ce que comprend un bus 50 places',
        liste: [
          'Sièges inclinables et ceintures de sécurité pour tous les passagers',
          'Climatisation et chauffage, sonorisation avec micro',
          'Soutes à bagages (une valise + un bagage à main par personne sans difficulté)',
          'Selon les modèles : Wi-Fi, prises USB, écrans, toilettes (précisez vos besoins dans la demande)',
          'Et toujours : chauffeur professionnel, carburant et péages inclus dans le prix',
        ],
      },
      {
        h2: 'Combien coûte un bus de 50 places ?',
        paragraphes: [
          'À partir de 690 € TTC la journée pour un aller-retour local — soit environ 14 € par personne sur un car plein. Un transfert simple (aéroport, gare, événement) coûte moins ; un long trajet se calcule au kilomètre. Toutes les fourchettes sont dans notre guide du [prix de la location d\'un autocar](/blog/prix-location-autocar).',
        ],
      },
      {
        h2: 'Et si nous sommes 45, 55 ou 62 ?',
        paragraphes: [
          'En dessous de 45 personnes, le même autocar standard reste souvent la bonne réponse (le prix ne baisse pas beaucoup avec un véhicule plus petit, sauf à passer au [minibus](/services/location-minibus) sous 20 personnes). Au-delà de 59, deux options : un autocar grande capacité (60 à 90 places, y compris double étage) ou deux véhicules coordonnés — le devis compare les deux. Le tour complet des tailles est sur notre page [location de bus](/location-bus).',
        ],
      },
    ],
    faq: [
      {
        q: 'Un bus « 50 places » fait-il exactement 50 sièges ?',
        a: 'Rarement : les autocars standard existent en 49, 53, 55 ou 59 sièges selon les modèles. Donnez votre effectif exact (accompagnateurs compris) et le transporteur affecte un véhicule qui l\'accueille entièrement — jamais de surnombre, chaque passager a son siège.',
      },
      {
        q: 'Peut-on louer un bus 50 places sans chauffeur ?',
        a: 'Non : au-delà de 9 places, la conduite exige le permis D et une qualification professionnelle. Le chauffeur est donc toujours inclus — on vous explique tout dans notre article [louer un bus sans chauffeur, est-ce possible ?](/blog/location-bus-sans-chauffeur).',
      },
      {
        q: 'Quel délai pour réserver ?',
        a: 'Le format 50 places étant le plus répandu, les disponibilités sont bonnes hors haute saison : 2 à 4 semaines suffisent souvent. Pour un samedi de mai-juin ou une période de voyages scolaires, visez 2 mois.',
      },
    ],
    serviceType: 'Location de bus 50 places avec chauffeur',
  },
  {
    slug: '/location-autocar-ile-de-france',
    metaTitle: 'Location d\'autocar en Île-de-France avec chauffeur | Busmoov',
    metaDescription: 'Autocar et minibus avec chauffeur dans toute l\'Île-de-France : Paris, petite et grande couronne, La Défense, Disneyland, aéroports. Devis gratuit sous 24h.',
    h1: 'Location d\'autocar en Île-de-France',
    sousTitre: 'Paris, petite et grande couronne : la région la plus dense de France en transporteurs — prise en charge près de chez vous, sans frais d\'approche inutiles.',
    intro: [
      'L\'Île-de-France concentre à elle seule une part énorme du transport de groupe français : sièges sociaux à La Défense, salons à Villepinte et Porte de Versailles, matchs et concerts au Stade de France, Disneyland, deux aéroports internationaux — et douze millions d\'habitants qui se marient, partent en voyage scolaire et organisent des sorties associatives.',
      'L\'atout de la région pour vous : la densité de transporteurs. Que votre groupe parte de Boulogne-Billancourt, Montreuil, Créteil, Nanterre, Cergy, Meaux ou Évry, un car est basé à proximité — la prise en charge se fait près de chez vous, sans facturer des dizaines de kilomètres d\'approche. C\'est aussi l\'une des zones les mieux placées de France en tarifs.',
    ],
    sections: [
      {
        h2: 'Les grands motifs de location en Île-de-France',
        liste: [
          'Transferts aéroports pour groupes : voir nos pages dédiées [navette aéroport CDG](/navette-aeroport-cdg) et [navette aéroport Orly](/navette-aeroport-orly)',
          'Événements au Stade de France, à la Défense Arena ou à Bercy : navettes supporters, spectateurs et VIP — détails sur notre page [Saint-Denis](/location-autocar/saint-denis)',
          'Séminaires et salons : rotations hôtels ↔ Villepinte, Porte de Versailles, Le Bourget',
          'Sorties scolaires : Versailles, Provins, Parc Astérix, châteaux — véhicules aux normes transport d\'enfants',
          'Mariages en grande couronne : navettes invités entre Paris, la cérémonie et les domaines de Seine-et-Marne ou des Yvelines',
          'Excursions : Disneyland, Giverny, châteaux de la Loire à la journée',
        ],
      },
      {
        h2: 'Petite couronne, grande couronne : comment ça marche',
        paragraphes: [
          'Inutile de chercher une agence dans votre commune : vous décrivez le trajet (départ Rueil-Malmaison, Aulnay-sous-Bois ou Melun, peu importe), et nous consultons les transporteurs dont le dépôt est le mieux placé pour votre point de prise en charge. Le devis intègre le trajet d\'approche réel — c\'est précisément ce que la mise en concurrence optimise.',
          'Pour les départs depuis Paris intra-muros, les contraintes spécifiques (zones de dépose, Pass Autocar, Crit\'Air) sont détaillées sur notre page [location d\'autocar à Paris](/location-autocar/paris) ; pour l\'ouest francilien, voyez aussi la page [Versailles](/location-autocar/versailles).',
        ],
      },
      {
        h2: 'Les prix en Île-de-France',
        paragraphes: [
          'Bonne nouvelle : l\'Île-de-France fait partie des zones tarifaires les plus compétitives de France. Une journée en autocar standard démarre à 690 € TTC, un transfert aéroport simple coûte moins — toutes les fourchettes sont dans notre [guide des prix](/blog/prix-location-autocar). Les créneaux les plus tendus de l\'année : samedis de mai-juin (mariages) et périodes de salons.',
        ],
      },
    ],
    faq: [
      {
        q: 'Couvrez-vous toutes les communes d\'Île-de-France ?',
        a: 'Oui, les huit départements : Paris, Hauts-de-Seine, Seine-Saint-Denis, Val-de-Marne, Seine-et-Marne, Yvelines, Essonne et Val-d\'Oise. Le point de prise en charge peut être une adresse précise, une gare RER ou un parking — indiquez-le dans la demande.',
      },
      {
        q: 'Un car peut-il circuler dans Paris avec la ZFE ?',
        a: 'Oui : les véhicules de nos transporteurs franciliens respectent les vignettes Crit\'Air exigées dans la zone à faibles émissions, et les chauffeurs pratiquent les zones de dépose parisiennes au quotidien.',
      },
      {
        q: 'Faites-vous les navettes vers Disneyland Paris ?',
        a: 'C\'est l\'une des demandes les plus fréquentes de la région : CE, anniversaires, séminaires. Dépose directe aux parcs, le car attend sur place et vous ramène à la fermeture.',
      },
      {
        q: 'Quel est le délai pour un devis en Île-de-France ?',
        a: 'Sous 24h ouvrées, comme partout — mais la densité de transporteurs franciliens joue pour vous : même une demande à quelques jours du départ trouve souvent un véhicule, hors samedis de haute saison.',
      },
    ],
    serviceType: 'Location d\'autocar avec chauffeur en Île-de-France',
  },
  {
    slug: '/autocar-couchette',
    metaTitle: 'Location d\'autocar couchette : tournées et trajets de nuit | Busmoov',
    metaDescription: 'Autocar couchette (sleeper bus) pour tournées musicales, équipes sportives et longues distances de nuit — et les alternatives quand ce véhicule rare est indisponible.',
    h1: 'Location d\'autocar couchette',
    sousTitre: 'Le sleeper bus des tournées et des longues distances de nuit : un véhicule rare, que nous sourçons — avec les bonnes alternatives quand il n\'est pas disponible.',
    intro: [
      'L\'autocar couchette — ou sleeper bus — remplace les sièges par de vraies couchettes superposées : le groupe dort en roulant et se réveille à destination. C\'est le véhicule des tournées musicales et de leurs équipes techniques, de certaines équipes sportives, et des liaisons nocturnes longue distance.',
      'Soyons transparents : c\'est un véhicule rare en France — quelques dizaines d\'unités, très demandées en saison de festivals. Nous le sourçons auprès de spécialistes, et quand les disponibilités manquent, nous vous proposons l\'alternative qui fait le même travail pour une fraction du prix : l\'autocar grand tourisme de nuit avec double équipage.',
    ],
    sections: [
      {
        h2: 'À quoi ressemble un autocar couchette ?',
        liste: [
          'De 12 à 16 couchettes en configuration tournée (avec salon arrière et espace de vie), jusqu\'à une trentaine en configuration transport pur',
          'Couchettes individuelles avec rideau, liseuse et prise — literie fournie',
          'Salon, coin cuisine (frigo, machine à café), toilettes selon les modèles',
          'Soutes pour le matériel — dimensionnées pour le backline d\'une tournée',
          'Chauffeurs professionnels habitués au roulage de nuit, en double équipage sur les longues étapes',
        ],
      },
      {
        h2: 'Pour qui, concrètement ?',
        paragraphes: [
          'Trois profils représentent l\'essentiel des demandes. Les tournées musicales et leurs équipes : enchaîner les dates en dormant entre deux villes, c\'est exactement la raison d\'être du sleeper. Les équipes sportives sur des championnats à étapes éloignées. Et les groupes qui veulent transformer une très longue liaison (France-Espagne, France-Italie…) en nuit de sommeil plutôt qu\'en journée perdue.',
        ],
      },
      {
        h2: 'L\'alternative : la nuit en grand tourisme avec double équipage',
        paragraphes: [
          'Quand le couchette n\'est pas disponible — ou que son tarif de niche dépasse le budget — la solution éprouvée est l\'autocar grand tourisme de nuit : sièges inclinables grand espacement, deux chauffeurs qui se relaient (le véhicule ne s\'arrête que pour les pauses réglementaires), départ en soirée, arrivée au matin. C\'est ainsi que voyagent la plupart des groupes longue distance en Europe. Notre page [location de bus](/location-bus) détaille les niveaux de confort ; pour le budget, voyez le [guide des prix](/blog/prix-location-autocar) — le double équipage ajoute environ 500 € TTC au trajet.',
        ],
      },
    ],
    faq: [
      {
        q: 'Combien coûte un autocar couchette ?',
        a: 'C\'est un véhicule de niche : comptez un ordre de grandeur de 2 à 4 fois le prix d\'un autocar grand tourisme équivalent, uniquement sur devis selon l\'itinéraire et la durée. Les tournées le réservent à la semaine ou au mois.',
      },
      {
        q: 'Peut-on rouler toute la nuit sans s\'arrêter ?',
        a: 'Avec un seul chauffeur, non — la réglementation impose pauses et repos. Avec un double équipage (standard sur le couchette et sur les nuits en grand tourisme), le véhicule roule en continu hors pauses courtes : environ 900 à 1 000 km peuvent être couverts en une nuit.',
      },
      {
        q: 'Quel délai pour trouver un autocar couchette ?',
        a: 'Le plus tôt possible : pour la saison des festivals (mai-septembre), les sleeper se réservent plusieurs mois à l\'avance. Hors saison, quelques semaines peuvent suffire. Décrivez les dates et l\'itinéraire, nous consultons les spécialistes.',
      },
      {
        q: 'Le couchette convient-il à un voyage scolaire ?',
        a: 'Non : les trajets de nuit entre minuit et 6h sont interdits pour les transports en commun de mineurs. Pour un voyage scolaire longue distance, on planifie des étapes de jour — voir notre guide de la [sortie scolaire en autocar](/blog/organiser-sortie-scolaire-autocar).',
      },
    ],
    serviceType: 'Location d\'autocar couchette (sleeper bus)',
  },
]

export function getLanding(slug: string): Landing | undefined {
  return landings.find((l) => l.slug === slug)
}
