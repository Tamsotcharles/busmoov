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
    metaDescription: 'Autocar couchette (sleeper bus) pour tournées, équipes sportives et longues distances de nuit — et les alternatives quand ce véhicule rare manque.',
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
  {
    slug: '/location-autocar-espagne',
    metaTitle: 'Location d\'autocar pour l\'Espagne depuis la France | Busmoov',
    metaDescription: 'Autocar avec chauffeur France → Espagne : Barcelone, Madrid, Pays basque, Costa Brava. Distances, double équipage, formalités — devis gratuit sous 24h.',
    h1: 'Location d\'autocar pour l\'Espagne',
    sousTitre: 'Barcelone, Madrid, la Costa Brava ou le Pays basque : emmenez votre groupe en Espagne en autocar avec chauffeur, formalités et réglementation gérées.',
    intro: [
      'L\'Espagne est la première destination étrangère des groupes français en autocar : voyages scolaires à Barcelone, séjours plage sur la Costa Brava, escapades à San Sebastián, pèlerinages vers Compostelle. Le car reste le moyen le plus simple et le plus économique d\'y emmener 30 à 60 personnes avec leurs bagages.',
      'Nos transporteurs partenaires disposent de la licence communautaire pour le transport international et font ces liaisons régulièrement — passage de frontière sans arrêt (espace Schengen), chauffeurs habitués aux autoroutes espagnoles et aux zones de dépose des grandes villes.',
    ],
    sections: [
      {
        h2: 'Distances et formats de voyage depuis la France',
        liste: [
          'Perpignan → Barcelone : 2h — faisable à la journée, même pour une sortie shopping à La Jonquera',
          'Toulouse ou Montpellier → Barcelone : 3h30 à 4h — week-end ou séjour, aller-retour à la journée possible',
          'Lyon → Barcelone (640 km) : journée de route classique avec pauses réglementaires',
          'Paris → Barcelone (1 030 km) : nuit roulée en double équipage, ou étape — voir notre guide du [long trajet en autocar](/blog/autocar-long-trajet)',
          'Biarritz → San Sebastián : 50 minutes — détaillé sur notre page [location d\'autocar à Biarritz](/location-autocar/biarritz)',
          'Madrid, Séville, Valence : séjours de plusieurs jours avec car en mise à disposition sur place',
        ],
      },
      {
        h2: 'Ce que gère le transporteur en Espagne',
        paragraphes: [
          'Les grandes villes espagnoles encadrent les autocars de tourisme : zones de bus turístico à Barcelone (dépose réglementée près de la Sagrada Família ou du Camp Nou), aires dédiées à Madrid. Les chauffeurs qui font ces lignes connaissent les accès — et pour un séjour, le car reste sur place avec le groupe, hébergement du chauffeur intégré au devis.',
        ],
      },
      {
        h2: 'Formalités pour votre groupe',
        liste: [
          'Espace Schengen : aucune formalité de frontière, une pièce d\'identité en cours de validité par passager',
          'Mineurs en voyage scolaire : autorisation de sortie de territoire (AST) + pièce d\'identité',
          'Le véhicule et le chauffeur : licence communautaire, attestations et réglementation espagnole — c\'est l\'affaire du transporteur',
        ],
      },
    ],
    faq: [
      {
        q: 'Combien coûte un autocar pour l\'Espagne ?',
        a: 'Au kilomètre sur les longues distances : comptez de l\'ordre de 5 à 7 € TTC/km parcouru. Exemples indicatifs aller-retour : Toulouse-Barcelone à la journée autour de 2 000 à 2 800 € TTC ; Paris-Barcelone en double équipage de l\'ordre de 6 000 à 8 000 € TTC. Devis précis gratuit sous 24h.',
      },
      {
        q: 'Peut-on faire Paris-Barcelone de nuit ?',
        a: 'Oui, en double équipage : deux chauffeurs se relaient, le groupe dort dans les sièges inclinables du grand tourisme, départ en soirée et arrivée au matin. Interdit en revanche pour les groupes de mineurs (pas de roulage entre minuit et 6h) — pour les scolaires, on planifie une étape.',
      },
      {
        q: 'Le car peut-il rester avec nous pendant le séjour ?',
        a: 'C\'est la formule habituelle : le car et le chauffeur restent en mise à disposition (excursions, soirées), avec les jours d\'immobilisation et l\'hébergement du chauffeur intégrés au devis.',
      },
    ],
    serviceType: 'Location d\'autocar avec chauffeur pour l\'Espagne',
  },
  {
    slug: '/location-autocar-italie',
    metaTitle: 'Location d\'autocar pour l\'Italie depuis la France | Busmoov',
    metaDescription: 'Autocar avec chauffeur France → Italie : Milan, Venise, Rome, lacs italiens. Distances, ZTL des villes italiennes, formalités — devis gratuit sous 24h.',
    h1: 'Location d\'autocar pour l\'Italie',
    sousTitre: 'Milan, Venise, Florence, Rome ou les lacs : l\'Italie en autocar avec chauffeur, avec un transporteur qui connaît les fameuses ZTL italiennes.',
    intro: [
      'Voyages scolaires d\'histoire de l\'art, pèlerinages vers Rome, escapades à Venise, séminaires sur les lacs : l\'Italie est une destination majeure des groupes français. Et c\'est le pays où le choix du bon transporteur compte le plus — les villes italiennes sont les plus réglementées d\'Europe pour les autocars.',
      'Toutes les grandes villes italiennes appliquent des ZTL (zones à trafic limité) avec permis de bus payants obligatoires : à Rome, Florence ou Venise, un car sans autorisation est verbalisé automatiquement par caméra. Nos transporteurs habitués de l\'Italie achètent les permis en amont et connaissent les checkpoints bus — un point que le devis intègre dès le départ.',
    ],
    sections: [
      {
        h2: 'Distances depuis la France',
        liste: [
          'Nice → Milan ou Turin : 2h30 à 3h — faisable à la journée depuis la Côte d\'Azur (voir [location d\'autocar à Nice](/location-autocar/nice))',
          'Lyon → Turin par le Fréjus : 3h — le tunnel est l\'affaire du transporteur (péage intégré)',
          'Lyon ou Grenoble → Milan : 4h30 — week-end design ou match à San Siro',
          'Paris → Milan (850 km) : journée complète de route ou nuit en double équipage',
          'Venise, Florence : séjours 3-4 jours avec étapes ; Rome (1 400 km depuis Paris) : étape obligatoire ou combiné avion + car sur place',
        ],
      },
      {
        h2: 'Les ZTL : ce qui distingue un bon devis Italie',
        paragraphes: [
          'Chaque ville fixe ses règles : permis bus journaliers à Rome (par zone), checkpoints d\'entrée à Florence, terminal obligatoire du Tronchetto à Venise (les cars ne vont pas plus loin — le groupe continue en vaporetto). Ces permis coûtent de quelques dizaines à quelques centaines d\'euros par ville et par jour : un devis sérieux les liste noir sur blanc. C\'est exactement le genre de piège que nos transporteurs italophones évitent.',
        ],
      },
      {
        h2: 'Formalités et équipements',
        liste: [
          'Espace Schengen : pièce d\'identité par passager, AST pour les mineurs en scolaire',
          'Vignettes environnementales des villes (Area B/C à Milan) : gérées par le transporteur',
          'Hiver : équipements neige obligatoires sur les axes alpins du 15 novembre au 15 avril',
        ],
      },
    ],
    faq: [
      {
        q: 'Combien coûte un autocar pour l\'Italie ?',
        a: 'La base kilométrique (5 à 7 € TTC/km) plus les permis ZTL des villes visitées. Exemple indicatif : Lyon-Milan aller-retour en étape autour de 4 000 à 5 500 € TTC ; un circuit Toscane d\'une semaine se chiffre sur mesure. Devis gratuit sous 24h, permis ZTL détaillés.',
      },
      {
        q: 'L\'autocar peut-il entrer dans Venise ?',
        a: 'Jusqu\'au terminal du Tronchetto ou du piazzale Roma uniquement — Venise est piétonne au-delà. Le groupe poursuit en vaporetto ; le car stationne au terminal, tout est organisé ainsi pour tous les groupes du monde.',
      },
      {
        q: 'Rome en car depuis la France, réaliste ?',
        a: 'À 1 400 km de Paris, Rome demande deux jours de route avec étape (Florence est l\'étape classique) — pertinent pour un circuit Italie complet. Pour Rome seule, l\'avion + un car local sur place est souvent plus rationnel : nous organisons aussi cette formule.',
      },
    ],
    serviceType: 'Location d\'autocar avec chauffeur pour l\'Italie',
  },
  {
    slug: '/location-autocar-belgique',
    metaTitle: 'Location d\'autocar pour la Belgique depuis la France | Busmoov',
    metaDescription: 'Autocar avec chauffeur France → Belgique : Bruxelles, Bruges, Gand, Anvers. LEZ belges, distances, formalités — devis gratuit sous 24h.',
    h1: 'Location d\'autocar pour la Belgique',
    sousTitre: 'Bruxelles, Bruges, Gand : la Belgique est la sortie étrangère la plus accessible des groupes français — 1h depuis Lille, une journée depuis Paris.',
    intro: [
      'La Belgique est l\'excursion transfrontalière par excellence : Bruges la médiévale, Bruxelles et sa Grand-Place, Gand, Anvers, les marchés de Noël, le shopping ou une visite d\'institutions européennes pour les scolaires. Depuis les Hauts-de-France, c\'est une sortie à la journée sans aucune contrainte ; depuis Paris, une grande journée ou un week-end.',
      'Attention au détail qui pique : les trois grandes villes flamandes et Bruxelles appliquent des LEZ (zones à basses émissions) avec enregistrement préalable obligatoire des véhicules étrangers — une amende automatique tombe sans lui. Nos transporteurs frontaliers enregistrent leurs véhicules d\'office.',
    ],
    sections: [
      {
        h2: 'Distances et idées de sorties',
        liste: [
          'Lille → Bruges ou Bruxelles : 1h à 1h15 — l\'excursion reine des groupes nordistes (voir [location d\'autocar à Lille](/location-autocar/lille))',
          'Paris → Bruxelles : 3h15 — journée complète Grand-Place + Atomium, ou week-end',
          'Reims → Bruxelles : 2h30 par l\'A34 — sortie CE classique du Grand Est',
          'Bruges, Gand, Anvers : combinables à deux villes dans une journée depuis le nord de la France',
          'Marchés de Noël (Bruxelles, Bruges) : très demandés fin novembre-décembre, réserver tôt',
        ],
      },
      {
        h2: 'LEZ belges : l\'enregistrement obligatoire',
        paragraphes: [
          'Bruxelles, Anvers et Gand verbalisent par caméra tout véhicule non enregistré dans leur LEZ, même conforme — l\'enregistrement est gratuit mais doit être fait avant d\'entrer. C\'est l\'affaire du transporteur, pas la vôtre ; nos partenaires qui font la Belgique l\'ont intégré à leur routine. Les zones de dépose cars de Bruges (Bargeplein) et de Bruxelles sont également balisées et connues des chauffeurs.',
        ],
      },
      {
        h2: 'Formalités',
        liste: [
          'Espace Schengen : pièce d\'identité par passager, AST pour les mineurs',
          'Aucun péage d\'autoroute pour les autocars de tourisme en Belgique',
          'Institutions européennes (Parlamentarium, hémicycle) : réservation de groupe gratuite, dépose dédiée quartier européen',
        ],
      },
    ],
    faq: [
      {
        q: 'Combien coûte un autocar pour Bruxelles ou Bruges ?',
        a: 'Depuis Lille, la journée démarre autour de 900 à 1 200 € TTC en autocar standard ; depuis Paris, comptez 1 400 à 1 900 € TTC selon l\'amplitude. Devis gratuit sous 24h, LEZ incluse.',
      },
      {
        q: 'Peut-on combiner deux villes belges dans la journée ?',
        a: 'Depuis le nord de la France, oui : Bruges le matin + Gand l\'après-midi est le combo classique. Depuis Paris, mieux vaut une seule ville pour garder du temps sur place.',
      },
      {
        q: 'Faut-il des papiers particuliers pour un voyage scolaire en Belgique ?',
        a: 'Pièce d\'identité + autorisation de sortie de territoire par élève, liste nominative à bord — comme pour toute sortie Schengen. Le détail est dans notre guide de la [sortie scolaire en autocar](/blog/organiser-sortie-scolaire-autocar).',
      },
    ],
    serviceType: 'Location d\'autocar avec chauffeur pour la Belgique',
  },
  {
    slug: '/location-autocar-suisse',
    metaTitle: 'Location d\'autocar pour la Suisse depuis la France | Busmoov',
    metaDescription: 'Autocar avec chauffeur France → Suisse : Genève, Lausanne, Zurich, montagne. Redevance suisse, formalités douane — devis gratuit sous 24h.',
    h1: 'Location d\'autocar pour la Suisse',
    sousTitre: 'Genève, Lausanne, Zurich, les Alpes suisses : un pays hors UE mais dans Schengen — votre transporteur gère la redevance et la douane.',
    intro: [
      'Séminaires à Genève, sorties CE à Lausanne ou Montreux, marchés de Noël de Bâle et Zurich, excursions à Lucerne ou Interlaken : la Suisse attire les groupes français toute l\'année — et elle est à moins d\'une heure de Lyon, Annecy ou Besançon côté Léman.',
      'Particularité : la Suisse est hors Union européenne mais dans Schengen. Pas de contrôle systématique des passagers (pièce d\'identité suffit), mais le véhicule doit s\'acquitter de la redevance forfaitaire suisse pour autocars — l\'équivalent de la vignette, gérée par le transporteur. Nos partenaires frontaliers passent la douane de Genève ou de Vallorbe chaque semaine.',
    ],
    sections: [
      {
        h2: 'Distances et destinations groupes',
        liste: [
          'Lyon ou Annecy → Genève : 1h30 / 45 min — détails sur nos pages [Lyon](/location-autocar/lyon) et [Grenoble](/location-autocar/grenoble)',
          'Paris → Genève : 5h30 — journée de route, ou TGV + car sur place pour les séminaires',
          'Strasbourg ou Mulhouse → Bâle et Zurich : 1h30 à 2h30 — marchés de Noël très demandés',
          'Lucerne, Interlaken, Zermatt : circuits montagne de 2-4 jours, routes alpines maîtrisées',
          'Montreux (festival de jazz), Davos, Bulle : événements et congrès avec navettes dédiées',
        ],
      },
      {
        h2: 'Redevance, douane et particularités suisses',
        paragraphes: [
          'Les autocars étrangers paient une redevance forfaitaire journalière ou annuelle pour circuler en Suisse — le transporteur l\'intègre au devis. Au passage de frontière, le chauffeur présente les documents du véhicule ; les passagers gardent simplement une pièce d\'identité à portée. À noter : les montants sur place sont en francs suisses et les autoroutes suisses n\'ont pas de péage au trajet (tout est dans la redevance).',
        ],
      },
      {
        h2: 'Montagne suisse : le terrain des chauffeurs confirmés',
        paragraphes: [
          'Cols, tunnels, routes de stations : la Suisse alpine exige des équipements hiver et des chauffeurs rodés à la montagne — c\'est le quotidien de nos transporteurs des Alpes et du Jura. Pour un séjour ski ou séminaire en altitude, le car reste sur place en mise à disposition.',
        ],
      },
    ],
    faq: [
      {
        q: 'Combien coûte un autocar pour Genève ?',
        a: 'Depuis Lyon, un aller-retour à la journée démarre autour de 1 100 à 1 500 € TTC redevance suisse incluse. Depuis Paris ou pour un circuit plusieurs jours, devis sur mesure sous 24h.',
      },
      {
        q: 'Faut-il un passeport pour la Suisse ?',
        a: 'Non : la Suisse est dans Schengen, une carte d\'identité en cours de validité suffit pour les ressortissants européens (AST en plus pour les mineurs en groupe scolaire).',
      },
      {
        q: 'Peut-on payer les extras du groupe en euros sur place ?',
        a: 'Souvent oui dans les zones touristiques, mais au taux du commerçant — prévoyez des francs suisses ou la carte. Côté transport, tout est réglé en euros dans votre devis Busmoov, redevance comprise.',
      },
    ],
    serviceType: 'Location d\'autocar avec chauffeur pour la Suisse',
  },
  {
    slug: '/location-autocar-allemagne',
    metaTitle: 'Location d\'autocar pour l\'Allemagne depuis la France | Busmoov',
    metaDescription: 'Autocar avec chauffeur France → Allemagne : marchés de Noël, Europa-Park, Munich, Berlin. Umweltzonen, distances — devis gratuit sous 24h.',
    h1: 'Location d\'autocar pour l\'Allemagne',
    sousTitre: 'Marchés de Noël, Europa-Park, Munich, Berlin ou la Forêt-Noire : l\'Allemagne en autocar avec chauffeur, vignette environnementale comprise.',
    intro: [
      'L\'Allemagne est une destination de groupe quatre saisons : Europa-Park (le parc préféré des CE de l\'Est de la France), les marchés de Noël de Cologne à Nuremberg, l\'Oktoberfest de Munich, Berlin pour les voyages scolaires d\'histoire, la Forêt-Noire pour les excursions nature. Depuis l\'Alsace et la Lorraine, la frontière est à quelques minutes.',
      'Côté réglementation : la plupart des centres-villes allemands sont des Umweltzonen (zones environnementales) exigeant la vignette verte sur le pare-brise — les véhicules de nos transporteurs frontaliers en sont équipés d\'office. Autoroutes gratuites pour les autocars, réseau impeccable : rouler en Allemagne est un plaisir de chauffeur.',
    ],
    sections: [
      {
        h2: 'Distances et destinations phares',
        liste: [
          'Strasbourg → Europa-Park : 45 min — la sortie CE n°1 de l\'Est (voir [location d\'autocar à Strasbourg](/location-autocar/strasbourg))',
          'Strasbourg → Fribourg et la Forêt-Noire : 1h — excursions nature et lacs (Titisee)',
          'Metz-Nancy → Trèves, Cologne : 1h à 3h — marchés de Noël et croisières sur la Moselle',
          'Paris → Cologne (500 km) : journée de route ; Munich (830 km) et Berlin (1 050 km) : étape ou nuit en double équipage — voir le [guide du long trajet](/blog/autocar-long-trajet)',
          'Oktoberfest (fin sept.-début oct.) et marchés de Noël (fin nov.-déc.) : réserver plusieurs mois à l\'avance',
        ],
      },
      {
        h2: 'Umweltzone : la vignette qui ne s\'improvise pas',
        paragraphes: [
          'Berlin, Munich, Cologne, Stuttgart et des dizaines de villes n\'admettent que les véhicules porteurs de la vignette verte (grüne Plakette) — amende immédiate sinon, même pour un car étranger. Elle s\'achète à l\'avance et se colle une fois pour toutes : les transporteurs qui font l\'Allemagne l\'ont déjà. C\'est l\'un des points que nous vérifions en sélectionnant le véhicule pour votre trajet.',
        ],
      },
      {
        h2: 'Formalités',
        liste: [
          'Espace Schengen : pièce d\'identité par passager, AST pour les mineurs en scolaire',
          'Autoroutes gratuites pour les autocars — pas de vignette autoroutière contrairement à la Suisse ou l\'Autriche',
          'Voyages mémoriels scolaires (Berlin, camps) : nos transporteurs habitués connaissent les sites et leurs accès cars',
        ],
      },
    ],
    faq: [
      {
        q: 'Combien coûte un autocar pour Europa-Park ?',
        a: 'Depuis Strasbourg-Colmar, l\'aller-retour à la journée démarre autour de 800 à 1 100 € TTC (amplitude longue : le parc ferme tard). Depuis Metz ou Besançon, comptez 1 300 à 1 800 € TTC. Devis gratuit sous 24h.',
      },
      {
        q: 'Berlin en car pour un voyage scolaire, comment ça se passe ?',
        a: 'À 1 050 km de Paris, le format classique est la nuit roulée en double équipage à l\'aller (interdite aux mineurs entre minuit et 6h — donc départ tôt le matin avec étape, ou double équipage de jour) puis le car en mise à disposition sur place pour les visites. Nous construisons le programme avec vous, réglementation comprise.',
      },
      {
        q: 'Les marchés de Noël allemands sont-ils accessibles en car ?',
        a: 'Très bien organisés : toutes les grandes villes ont des parkings cars dédiés à quelques minutes des marchés, souvent avec navettes. Décembre est la haute saison absolue des transporteurs de l\'Est — réservez dès septembre-octobre.',
      },
    ],
    serviceType: 'Location d\'autocar avec chauffeur pour l\'Allemagne',
  },
  {
    slug: '/location-autocar-pays-bas',
    metaTitle: 'Location d\'autocar pour les Pays-Bas depuis la France | Busmoov',
    metaDescription: 'Autocar avec chauffeur France → Pays-Bas : Amsterdam, Keukenhof, Rotterdam. Accès cars réglementés, distances — devis gratuit sous 24h.',
    h1: 'Location d\'autocar pour les Pays-Bas',
    sousTitre: 'Amsterdam, les tulipes du Keukenhof, Rotterdam : les Pays-Bas en autocar avec chauffeur — avec un pro des accès cars amstellodamois.',
    intro: [
      'Amsterdam et ses musées, le parc floral du Keukenhof au printemps, Rotterdam l\'architecturale, La Haye : les Pays-Bas sont une destination de choix pour les voyages scolaires, les clubs et les CE — à une journée de route du nord de la France.',
      'Le point technique du pays : Amsterdam restreint fortement les autocars de tourisme. Le centre leur est largement fermé, les déposes se font sur des arrêts dédiés payants en périphérie du cœur historique, et le stationnement sur des parkings cars excentrés. Un transporteur qui connaît le dispositif transforme cette contrainte en simple formalité.',
    ],
    sections: [
      {
        h2: 'Distances et incontournables',
        liste: [
          'Lille → Amsterdam : 3h — la grande journée ou le week-end des groupes nordistes',
          'Paris → Amsterdam (500 km) : 5h30 — week-end classique, ou étape à Bruges/Anvers à l\'aller',
          'Keukenhof (mi-mars à mi-mai uniquement) : le parc aux 7 millions de tulipes, parking cars dédié — LA sortie printemps des clubs et associations',
          'Rotterdam, La Haye, Delft : combinables en circuit 2-3 jours avec Amsterdam',
          'Croisière sur les canaux : embarquements groupes coordonnés avec la dépose du car',
        ],
      },
      {
        h2: 'Amsterdam en car : le dispositif',
        paragraphes: [
          'Les cars déposent aux arrêts officiels (zone des musées, gare centrale côté IJ) avec un temps limité, puis stationnent aux parkings dédiés hors centre. La LEZ d\'Amsterdam impose par ailleurs des normes d\'émission récentes aux autocars. Nos transporteurs qui font la ligne connaissent les arrêts, les créneaux et les normes — le groupe, lui, ne voit qu\'une chose : il est déposé au bon endroit à la bonne heure.',
        ],
      },
      {
        h2: 'Formalités',
        liste: [
          'Espace Schengen : pièce d\'identité, AST pour les mineurs en scolaire',
          'Keukenhof : billets groupes datés à réserver en amont — le car se cale sur votre créneau',
          'Séjours : le car reste en mise à disposition, hébergement chauffeur au devis',
        ],
      },
    ],
    faq: [
      {
        q: 'Combien coûte un autocar pour Amsterdam ?',
        a: 'Depuis Lille, la journée démarre autour de 1 500 à 2 000 € TTC ; depuis Paris, un week-end (aller-retour + mise à disposition sur place) se chiffre généralement entre 2 500 et 3 500 € TTC. Devis gratuit sous 24h.',
      },
      {
        q: 'Le Keukenhof est-il faisable à la journée depuis Paris ?',
        a: 'C\'est long mais courant en saison : départ très matinal, 5h de route, après-midi complète au parc, retour en soirée — une amplitude qui reste dans les clous d\'un seul chauffeur. Depuis Lille, c\'est une journée confortable.',
      },
      {
        q: 'Un voyage scolaire à Amsterdam, quelles précautions ?',
        a: 'Les classiques Schengen (pièce d\'identité + AST), et un programme calé sur les arrêts cars officiels — la maison Anne Frank et les musées se réservent des semaines à l\'avance pour les groupes. Voir aussi notre guide de la [sortie scolaire en autocar](/blog/organiser-sortie-scolaire-autocar).',
      },
    ],
    serviceType: 'Location d\'autocar avec chauffeur pour les Pays-Bas',
  },
  {
    slug: '/location-autocar-portugal',
    metaTitle: 'Location d\'autocar pour le Portugal depuis la France | Busmoov',
    metaDescription: 'Autocar avec chauffeur France → Portugal : Lisbonne, Porto, Fatima. Longue distance, étapes en Espagne, pèlerinages — devis gratuit sous 24h.',
    h1: 'Location d\'autocar pour le Portugal',
    sousTitre: 'Lisbonne, Porto et surtout Fatima : le Portugal en autocar, la grande traversée des pèlerinages et des associations franco-portugaises.',
    intro: [
      'Le Portugal en autocar, c\'est d\'abord une tradition : celle des pèlerinages vers Fatima et des voyages des associations franco-portugaises qui rentrent au pays en groupe. C\'est aussi, de plus en plus, des circuits touristiques Porto-Lisbonne et des séjours surf sur la côte atlantique.',
      'À 1 450 km de Bordeaux et 1 700 km de Paris (pour Porto), c\'est un vrai voyage longue distance : nuit roulée en double équipage à travers l\'Espagne, ou étape à Burgos/Salamanque — les deux formules se pratiquent, selon le groupe et le budget.',
    ],
    sections: [
      {
        h2: 'Les formats de voyage vers le Portugal',
        liste: [
          'Double équipage direct : Paris ou Bordeaux → Porto/Lisbonne en ~20-24h de route avec deux chauffeurs — la formule des associations',
          'Avec étape espagnole (Burgos, Salamanque) : deux jours de route plus confortables, incontournable pour les groupes de mineurs',
          'Fatima : les grands rendez-vous (13 mai, 13 octobre) mobilisent des cars de toute l\'Europe — réserver plusieurs mois à l\'avance',
          'Circuits Porto + vallée du Douro + Lisbonne : 5 à 8 jours avec car en mise à disposition',
          'Mécanique du long trajet (pauses, relais, kilométrage) : détaillée dans notre [guide de la longue distance](/blog/autocar-long-trajet)',
        ],
      },
      {
        h2: 'Ce que le transporteur gère sur la route',
        paragraphes: [
          'La traversée de l\'Espagne (péages, aires équipées pour les cars), les péages portugais dont certains sont à télépéage exclusif (le véhicule doit être équipé du badge — c\'est le cas des habitués de la ligne), et la réglementation des temps de conduite sur un trajet où elle structure tout. L\'hébergement des chauffeurs pendant le séjour est intégré au devis.',
        ],
      },
      {
        h2: 'Formalités',
        liste: [
          'Espace Schengen de bout en bout : pièce d\'identité par passager, AST pour les mineurs',
          'Pèlerinages : nos transporteurs habitués de Fatima connaissent les parkings du sanctuaire et le dispositif des grandes dates',
          'Sur place, le car reste avec le groupe : excursions (Braga, Coimbra, Sintra) incluses au programme',
        ],
      },
    ],
    faq: [
      {
        q: 'Combien coûte un autocar pour le Portugal ?',
        a: 'C\'est un voyage au long cours : comptez de l\'ordre de 9 000 à 14 000 € TTC pour un aller-retour Paris-Fatima/Lisbonne en double équipage avec quelques jours de mise à disposition sur place — soit, sur un car plein, souvent moins cher par personne que l\'avion pour un groupe avec bagages. Devis précis gratuit sous 24h.',
      },
      {
        q: 'Peut-on rouler de nuit jusqu\'au Portugal ?',
        a: 'Oui en double équipage pour un groupe d\'adultes — c\'est la formule classique des associations. Pour les mineurs, le roulage entre minuit et 6h est interdit : on planifie deux jours avec étape en Espagne.',
      },
      {
        q: 'Organisez-vous les pèlerinages vers Fatima ?',
        a: 'Le transport, oui — c\'est une demande récurrente des paroisses et associations. Précisez les dates (attention aux 13 mai et 13 octobre, très chargés) et l\'effectif : nous consultons les transporteurs qui font la ligne chaque année.',
      },
    ],
    serviceType: 'Location d\'autocar avec chauffeur pour le Portugal',
  },
  {
    slug: '/location-autocar-royaume-uni',
    metaTitle: 'Location d\'autocar pour le Royaume-Uni (Londres) | Busmoov',
    metaDescription: 'Autocar avec chauffeur France → Londres et Royaume-Uni : passeport post-Brexit, Shuttle ou ferry, conduite à gauche — devis gratuit sous 24h.',
    h1: 'Location d\'autocar pour le Royaume-Uni',
    sousTitre: 'Londres en autocar : traversée par le Shuttle ou le ferry, formalités post-Brexit et conduite à gauche — des transporteurs qui font la ligne chaque semaine.',
    intro: [
      'Londres reste LA destination des voyages scolaires français, Brexit ou pas : British Museum, relève de la garde, Harry Potter Studios, comédies musicales. L\'autocar y garde un avantage décisif — il embarque le groupe porte à porte, traverse par Calais, et reste disponible sur place pour les visites.',
      'Le Brexit a changé une chose essentielle : le passeport en cours de validité est obligatoire pour chaque passager (la carte d\'identité ne suffit plus), et les ressortissants non européens du groupe peuvent avoir besoin d\'un visa ou de l\'ETA britannique. C\'est LE point à verrouiller des semaines à l\'avance pour un groupe scolaire.',
    ],
    sections: [
      {
        h2: 'La traversée : Shuttle ou ferry',
        liste: [
          'Eurotunnel Le Shuttle (Calais → Folkestone, 35 min) : le car embarque dans la navette, le groupe reste à bord — rapide et insensible à la météo',
          'Ferry (Calais → Douvres, 1h30) : moins cher, le groupe monte sur le pont — l\'option des budgets scolaires',
          'Les formalités britanniques se passent côté français avant d\'embarquer : prévoir 1h à 1h30 de marge au terminal pour un groupe',
          'Paris → Londres : 6 à 7h porte à porte ; Lille → Londres : 4h30',
        ],
      },
      {
        h2: 'Rouler à gauche, entrer dans Londres',
        paragraphes: [
          'Les chauffeurs qui font le Royaume-Uni sont rodés à la conduite à gauche et aux véhicules adaptés. À Londres, les cars doivent respecter la LEZ (normes d\'émission strictes, enregistrement préalable) et les zones de dépose touristiques — le stationnement se fait sur les coach parks officiels. Le congestion charge ne s\'applique pas aux autocars de plus de 9 places, un des rares cadeaux de la capitale britannique.',
        ],
      },
      {
        h2: 'Formalités post-Brexit : la checklist groupe',
        liste: [
          'Passeport en cours de validité pour CHAQUE passager — à vérifier dès l\'inscription au voyage',
          'Élèves non-UE d\'un groupe scolaire : vérifier visa/ETA selon la nationalité, plusieurs semaines à l\'avance',
          'AST pour les mineurs + liste nominative du groupe',
          'Le transporteur gère les formalités du véhicule (autorisations UK, LEZ Londres)',
        ],
      },
    ],
    faq: [
      {
        q: 'Combien coûte un autocar pour Londres ?',
        a: 'Depuis Paris, un séjour scolaire type de 3-4 jours (aller-retour + car sur place) se chiffre généralement entre 4 500 et 7 000 € TTC selon la saison et la traversée choisie — traversée du car incluse. Devis gratuit sous 24h.',
      },
      {
        q: 'La carte d\'identité suffit-elle encore pour Londres ?',
        a: 'Non — depuis le Brexit, le passeport est obligatoire pour tous, mineurs compris. C\'est la première chose à annoncer aux familles d\'un voyage scolaire : un passeport se fait en quelques semaines en mairie.',
      },
      {
        q: 'Le car reste-t-il avec nous à Londres ?',
        a: 'Oui, c\'est la formule habituelle : transferts hôtel, Studios Harry Potter (à 30 km du centre), Windsor ou Oxford en excursion — le car et son chauffeur restent en mise à disposition tout le séjour.',
      },
    ],
    serviceType: 'Location d\'autocar avec chauffeur pour le Royaume-Uni',
  },
  {
    slug: '/autocar-pmr',
    metaTitle: 'Location d\'autocar PMR accessible fauteuil roulant | Busmoov',
    metaDescription: 'Autocar et minibus PMR avec chauffeur : élévateur, ancrages fauteuil roulant, normes. Un parc rare — réservez tôt. Devis gratuit sous 24h.',
    h1: 'Location d\'autocar accessible PMR',
    sousTitre: 'Élévateur, emplacements fauteuil roulant, chauffeurs formés : le transport de groupe accessible existe — il se réserve juste plus tôt.',
    intro: [
      'Associations, établissements médico-sociaux, familles, clubs seniors : le besoin de transport de groupe accessible est immense, et l\'offre existe — autocars et minibus équipés d\'un élévateur (UFR) et d\'emplacements sécurisés pour fauteuils roulants, avec des chauffeurs formés à leur manipulation.',
      'La réalité à connaître : ces véhicules sont rares. Un transporteur en possède un ou deux quand il en possède, et ils sont très demandés. La règle d\'or du transport PMR est donc simple : réserver le plus tôt possible — et décrire précisément les besoins pour dimensionner le bon véhicule.',
    ],
    sections: [
      {
        h2: 'Les véhicules accessibles',
        liste: [
          'Minibus PMR (jusqu\'à ~20 places) : rampe ou élévateur, 1 à 4 emplacements fauteuil — le plus courant et le plus souple',
          'Autocar UFR : élévateur intégré, 1 à 8 emplacements fauteuil selon la configuration, le reste du groupe en sièges classiques',
          'Emplacements à ancrages normalisés : le fauteuil est arrimé, son occupant ceinturé — sécurité identique à un siège',
          'Les configurations mixtes (fauteuils + valides) se composent selon votre groupe : donnez le nombre exact de fauteuils, dont électriques (plus lourds et encombrants)',
        ],
      },
      {
        h2: 'Bien préparer votre demande',
        paragraphes: [
          'Trois informations font un devis PMR précis : le nombre de personnes en fauteuil (manuel ou électrique), le nombre d\'accompagnants et de passagers valides, et les conditions d\'accès aux points de départ et d\'arrivée (un élévateur a besoin d\'un espace plat et dégagé). Si certains passagers peuvent transférer sur un siège, dites-le aussi : cela ouvre plus de configurations de véhicules.',
        ],
      },
      {
        h2: 'Délais et conseils',
        liste: [
          'Réservez 4 à 8 semaines à l\'avance minimum — le parc PMR est compté, surtout en mai-juin et septembre',
          'Prévoyez du temps aux montées/descentes : un élévateur, c\'est 2-3 minutes par fauteuil — le planning doit l\'intégrer',
          'Sorties à la journée, transferts médicaux de groupe, vacances adaptées, événements familiaux : tous les formats se font',
          'Le prix : légèrement supérieur à un véhicule standard équivalent (matériel spécifique et manipulations), chiffré au cas par cas',
        ],
      },
    ],
    faq: [
      {
        q: 'Combien coûte un autocar ou minibus PMR ?',
        a: 'Comptez une majoration de l\'ordre de 15 à 30 % par rapport au véhicule standard équivalent, liée à la rareté du matériel et au temps de manipulation. Un minibus PMR à la journée démarre autour de 800 à 1 000 € TTC. Devis précis gratuit sous 24h avec la configuration exacte.',
      },
      {
        q: 'Les fauteuils électriques sont-ils acceptés ?',
        a: 'Oui, mais signalez-les impérativement : ils sont plus lourds (jusqu\'à 150 kg et plus) et tous les élévateurs n\'ont pas la même capacité. Le transporteur vérifie la compatibilité avant de confirmer.',
      },
      {
        q: 'Le chauffeur aide-t-il aux montées et descentes ?',
        a: 'Les chauffeurs de véhicules PMR sont formés à la manipulation de l\'élévateur et à l\'arrimage des fauteuils. Pour l\'accompagnement des personnes au-delà, prévoyez vos accompagnants habituels — le chauffeur sécurise le transport, il ne remplace pas un accompagnant.',
      },
      {
        q: 'Peut-on mélanger passagers valides et personnes en fauteuil ?',
        a: 'Bien sûr — c\'est la configuration la plus courante : un autocar UFR transporte le groupe entier, fauteuils arrimés aux emplacements dédiés et le reste du groupe en sièges. Un seul véhicule, tout le monde ensemble.',
      },
    ],
    serviceType: 'Location d\'autocar et minibus accessibles PMR avec chauffeur',
  },
  {
    slug: '/autocar-disneyland-paris',
    metaTitle: 'Autocar pour Disneyland Paris : groupes, CE, scolaires | Busmoov',
    metaDescription: 'Location d\'autocar pour Disneyland Paris : dépose gare routière des parcs, CE, anniversaires, scolaires. Prix et organisation — devis gratuit sous 24h.',
    h1: 'Location d\'autocar pour Disneyland Paris',
    sousTitre: 'La sortie de groupe n°1 de France : dépose à la gare routière des parcs, le car vous attend, retour à la fermeture — devis gratuit en 24h.',
    intro: [
      'Comités d\'entreprise, anniversaires, associations, sorties scolaires de fin d\'année, arbres de Noël : Disneyland Paris est la destination de groupe la plus demandée de France. Et l\'autocar y est roi — le parc dispose d\'une gare routière dédiée aux cars, à quelques minutes à pied des entrées des deux parcs.',
      'Le format est rodé : prise en charge du groupe le matin, dépose à la gare routière de Marne-la-Vallée, le car stationne sur place toute la journée, et le retour se cale sur la fermeture ou le spectacle nocturne. Nos transporteurs franciliens y déposent des groupes toutes les semaines.',
    ],
    sections: [
      {
        h2: 'La journée type en autocar',
        liste: [
          'Départ calé pour l\'ouverture des parcs (9h30 en général) — depuis Paris, comptez 45 min à 1h de trajet',
          'Dépose à la gare routière des parcs : 5 minutes à pied de Disneyland Park et des Walt Disney Studios',
          'Le car reste stationné sur place (parking cars) : pas de rotation, le chauffeur est là toute la journée',
          'Retour après la fermeture ou le spectacle du soir — l\'amplitude reste dans les clous d\'un seul chauffeur depuis l\'Île-de-France',
          'Depuis la province (Lille, Reims, Rouen, Orléans…) : la journée reste faisable, l\'amplitude est calculée au devis',
        ],
      },
      {
        h2: 'CE, scolaires, anniversaires : les formats groupes',
        paragraphes: [
          'Les comités d\'entreprise combinent souvent billets groupes Disney et transport — nous gérons le car, la billetterie groupe se réserve auprès de Disney (tarifs dégressifs dès 20 personnes). Pour les sorties scolaires, les véhicules sont aux normes transport d\'enfants et le timing intègre les comptages : prévoir 20 minutes de battement à chaque montée. Pour un anniversaire ou un événement familial, un minibus 15-20 places suffit souvent — voir notre page [location de minibus](/services/location-minibus).',
        ],
      },
      {
        h2: 'Combien ça coûte ?',
        paragraphes: [
          'Depuis Paris ou la petite couronne, l\'aller-retour à la journée en autocar standard (jusqu\'à 59 places) se situe généralement entre 750 et 1 000 € TTC selon l\'amplitude — soit 13 à 18 € par personne sur un car plein, à ajouter aux billets d\'entrée. En minibus, comptez 500 à 700 € TTC. Depuis la province, le prix suit la distance — toutes les fourchettes sont dans notre [guide des prix](/blog/prix-location-autocar).',
        ],
      },
    ],
    faq: [
      {
        q: 'Le car peut-il rester jusqu\'au spectacle nocturne ?',
        a: 'Oui — c\'est même le format recommandé en été : le spectacle de clôture vaut le coup. Précisez-le au devis pour que l\'amplitude du chauffeur soit calculée en conséquence (depuis la province, un retour tardif peut nécessiter un second chauffeur).',
      },
      {
        q: 'Où le groupe retrouve-t-il le car le soir ?',
        a: 'À la gare routière des parcs, au même endroit que la dépose. Le chauffeur communique son emplacement exact et son numéro — fixez un point et une heure de regroupement dans le parc, la sortie de la foule prend du temps.',
      },
      {
        q: 'Gérez-vous aussi les billets d\'entrée ?',
        a: 'Non, uniquement le transport — la billetterie groupes se réserve directement auprès de Disneyland Paris (tarifs dès 20 personnes). Nos devis transport sont sans engagement : vous pouvez caler billets et car en parallèle.',
      },
      {
        q: 'Peut-on venir de province à la journée ?',
        a: 'Jusqu\'à environ 2h30-3h de route (Lille, Reims, Rouen, Orléans, Tours), oui — au-delà, le format week-end avec une nuit sur place devient plus confortable, le car restant en mise à disposition.',
      },
    ],
    serviceType: 'Location d\'autocar avec chauffeur pour Disneyland Paris',
  },
]

export function getLanding(slug: string): Landing | undefined {
  return landings.find((l) => l.slug === slug)
}
