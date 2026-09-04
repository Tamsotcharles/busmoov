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

export interface Ville {
  slug: string
  nom: string
  metaTitle: string
  metaDescription: string
  h1: string
  sousTitre: string
  intro: string[]
  destinations: VilleDestination[]
  trajets: string[]
  faq: VilleFaq[]
}

export const villes: Ville[] = [
  {
    slug: 'paris',
    nom: 'Paris',
    metaTitle: 'Location d\'autocar à Paris avec chauffeur — Devis 24h | Busmoov',
    metaDescription: 'Location d\'autocar et minibus avec chauffeur à Paris et en Île-de-France : transferts CDG et Orly, événements, excursions. Devis gratuit de transporteurs vérifiés sous 24h.',
    h1: 'Location d\'autocar avec chauffeur à Paris',
    sousTitre: 'Transferts aéroports, événements d\'entreprise, excursions : des transporteurs franciliens vérifiés, un devis gratuit en 24h.',
    intro: [
      'Paris et l\'Île-de-France concentrent la plus forte demande de transport de groupe en France : congrès à la Porte de Versailles, salons à Villepinte, matchs au Stade de France, séminaires à La Défense. Busmoov travaille avec des transporteurs implantés dans toute la région, ce qui évite les frais d\'approche d\'un car venant de loin.',
      'Du minibus 8 places pour un transfert VIP au double étage 90 places pour un grand événement, nous comparons pour vous plusieurs devis de transporteurs franciliens vérifiés. La circulation et le stationnement parisiens n\'ont pas de secret pour leurs chauffeurs : dépose au plus près, zones cars touristiques, vignettes Crit\'Air en règle.',
    ],
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
    metaDescription: 'Location d\'autocar et minibus avec chauffeur à Lyon : transferts Saint-Exupéry, stations de ski, Eurexpo, excursions Beaujolais. Devis gratuit sous 24h, transporteurs vérifiés.',
    h1: 'Location d\'autocar avec chauffeur à Lyon',
    sousTitre: 'Transferts Saint-Exupéry, navettes stations de ski, événements à Eurexpo : des transporteurs rhodaniens vérifiés, un devis gratuit en 24h.',
    intro: [
      'Carrefour entre Paris, les Alpes et la Méditerranée, Lyon est une des places fortes du transport par autocar. Salons à Eurexpo, matchs au Groupama Stadium, conventions à la Cité Internationale : Busmoov s\'appuie sur des transporteurs implantés dans le Rhône et l\'Ain pour couvrir la métropole sans frais d\'approche superflus.',
      'La spécialité locale, ce sont les navettes vers les stations : de décembre à avril, nos partenaires enchaînent les rotations vers les 3 Vallées, l\'Alpe d\'Huez ou les Portes du Soleil. Le reste de l\'année, cap sur le Beaujolais, Annecy ou Genève pour les sorties d\'entreprise et les excursions associatives.',
    ],
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
    metaDescription: 'Location d\'autocar et minibus avec chauffeur à Marseille : transferts port croisières et aéroport Marignane, excursions Provence. Devis gratuit sous 24h, transporteurs vérifiés.',
    h1: 'Location d\'autocar avec chauffeur à Marseille',
    sousTitre: 'Transferts croisières et aéroport Marignane, excursions en Provence, matchs au Vélodrome : des transporteurs provençaux vérifiés, un devis gratuit en 24h.',
    intro: [
      'Premier port de croisière de France, Marseille voit transiter chaque année des centaines de milliers de passagers qui rejoignent les terminaux du Cap Janet ou de la Major en groupe. Les transferts port ↔ aéroport Marseille-Provence (Marignane) et port ↔ centre-ville sont la spécialité de nos transporteurs locaux, rodés aux horaires d\'embarquement serrés.',
      'Au-delà du port, l\'autocar est le moyen le plus simple d\'emmener un groupe dans l\'arrière-pays : calanques de Cassis, Aix-en-Provence, Avignon ou le Luberon. Séminaires, mariages, clubs de supporters du côté du Vélodrome : nous comparons pour vous plusieurs devis de transporteurs des Bouches-du-Rhône.',
    ],
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
    metaDescription: 'Location d\'autocar et minibus avec chauffeur à Toulouse : transferts Blagnac, Carcassonne, Lourdes, Pyrénées et Andorre. Devis gratuit sous 24h, transporteurs vérifiés.',
    h1: 'Location d\'autocar avec chauffeur à Toulouse',
    sousTitre: 'Transferts Blagnac, excursions à Carcassonne et dans les Pyrénées, déplacements d\'entreprise : des transporteurs occitans vérifiés, un devis gratuit en 24h.',
    intro: [
      'Capitale européenne de l\'aéronautique, Toulouse génère un flux constant de déplacements professionnels : visites de sites industriels, délégations à accueillir à Blagnac, séminaires au MEETT. Nos transporteurs partenaires de Haute-Garonne connaissent ces circuits par cœur, badges et consignes d\'accès compris.',
      'Côté loisirs, la ville rose est une base de départ idéale : Carcassonne à une heure, Albi et sa cathédrale, les Pyrénées pour le ski ou la randonnée, Andorre pour les sorties shopping, Lourdes pour les pèlerinages en groupe. L\'autocar reste le moyen le plus économique de déplacer 30 à 90 personnes dans la région.',
    ],
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
    metaDescription: 'Location d\'autocar et minibus avec chauffeur à Bordeaux : circuits vignobles Saint-Émilion et Médoc, transferts Mérignac, Arcachon. Devis gratuit sous 24h, transporteurs vérifiés.',
    h1: 'Location d\'autocar avec chauffeur à Bordeaux',
    sousTitre: 'Circuits dans les vignobles, transferts Mérignac, escapades au bassin d\'Arcachon : des transporteurs girondins vérifiés, un devis gratuit en 24h.',
    intro: [
      'À Bordeaux, l\'autocar avec chauffeur est d\'abord l\'allié des visites de vignobles : Saint-Émilion, le Médoc et ses grands crus, Sauternes ou l\'Entre-deux-Mers. Quand la dégustation fait partie du programme, personne ne prend le volant — le car récupère le groupe au château et le ramène en ville, dans la soirée s\'il le faut.',
      'La métropole girondine, c\'est aussi les congrès au Palais 2 l\'Atlantique, les matchs au Matmut Atlantique, les transferts vers l\'aéroport de Mérignac et la grande évasion du week-end : le bassin d\'Arcachon et la dune du Pilat. Nous comparons pour vous plusieurs devis de transporteurs implantés en Gironde.',
    ],
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
]

export function getVille(slug: string): Ville | undefined {
  return villes.find((v) => v.slug === slug)
}
