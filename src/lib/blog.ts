/**
 * Articles de blog SEO — français uniquement, contenu statique.
 * URL : /fr/blog et /fr/blog/<slug>
 *
 * ⚠️ Ne jamais publier la grille tarifaire interne (coefficients,
 * majorations régionales) : uniquement des fourchettes indicatives.
 */

export type BlogBlock =
  | { type: 'h2'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'callout'; text: string }

export interface BlogArticle {
  slug: string
  titre: string
  metaTitle: string
  metaDescription: string
  datePublication: string // AAAA-MM-JJ
  extrait: string
  blocks: BlogBlock[]
}

export const articles: BlogArticle[] = [
  {
    slug: 'prix-location-autocar',
    titre: 'Combien coûte la location d\'un autocar avec chauffeur ? Tarifs 2026',
    metaTitle: 'Prix location autocar avec chauffeur 2026 : tarifs et exemples | Busmoov',
    metaDescription: 'Combien coûte un autocar avec chauffeur ? Fourchettes de prix 2026 : journée dès 690 € TTC, ce qui fait varier le tarif, exemples concrets et conseils pour payer moins cher.',
    datePublication: '2026-09-04',
    extrait: 'Journée dès 690 € TTC, transferts, séjours : les vraies fourchettes de prix d\'un autocar avec chauffeur, ce qui les fait varier et comment payer moins cher.',
    blocks: [
      { type: 'p', text: 'C\'est la première question de tous les organisateurs de groupe — et la réponse honnête est : ça dépend. Mais pas de n\'importe quoi. Le prix d\'un autocar avec chauffeur obéit à une logique simple une fois qu\'on la connaît. Voici les fourchettes réelles pratiquées en France en 2026 et les facteurs qui les font bouger.' },
      { type: 'h2', text: 'Les fourchettes de prix en un coup d\'œil' },
      { type: 'ul', items: [
        'Sortie à la journée en autocar standard (aller-retour local, jusqu\'à 59 places) : à partir de 690 € TTC',
        'Journée à forte amplitude (départ tôt, retour tard) : comptez plutôt 790 à 830 € TTC',
        'Transfert aller simple (aéroport, gare, événement) : souvent moins cher qu\'une journée complète, chiffré selon la distance et l\'horaire',
        'Minibus avec chauffeur (8 à 20 places) : environ 10 % de moins qu\'un autocar standard sur le même trajet',
        'Autocar grande capacité (60 à 90 places) : de 15 à 70 % de plus qu\'un standard selon la taille',
        'Séjour de plusieurs jours avec le car sur place : le tarif intègre les journées d\'immobilisation et l\'hébergement du chauffeur',
        'Longue distance : au-delà des trajets régionaux, le prix se calcule essentiellement au kilomètre',
      ]},
      { type: 'callout', text: 'Tous les prix du transport de voyageurs s\'entendent TTC avec une TVA à 10 % en France.' },
      { type: 'h2', text: 'Les 6 facteurs qui font varier le prix' },
      { type: 'p', text: '1. La distance, évidemment — mais par tranches : un trajet de 80 km et un trajet de 95 km peuvent coûter le même prix, car les transporteurs raisonnent en tranches kilométriques.' },
      { type: 'p', text: '2. L\'amplitude horaire du chauffeur : c\'est le temps entre son départ du dépôt et son retour, pas seulement votre temps de trajet. Un aller-retour avec 6 heures d\'attente sur place mobilise le chauffeur toute la journée. Au-delà de 12 heures d\'amplitude, la réglementation impose un second chauffeur, ce qui ajoute environ 500 € TTC au transfert.' },
      { type: 'p', text: '3. La taille du véhicule : un groupe de 65 personnes peut partir en un autocar grande capacité ou en deux véhicules — le devis compare souvent les deux options.' },
      { type: 'p', text: '4. La saison et le jour : les samedis de mai-juin (mariages), les samedis de vacances d\'hiver (stations de ski) et les périodes de voyages scolaires sont les créneaux les plus tendus. Les prix montent et les disponibilités fondent.' },
      { type: 'p', text: '5. La région de départ : la densité de transporteurs varie ; un départ depuis une grande métropole trouve plus facilement un car proche, donc sans frais d\'approche.' },
      { type: 'p', text: '6. La mise à disposition : si le car reste avec vous entre l\'aller et le retour (circuit, étapes multiples), on parle de mise à disposition — plus souple, mais plus cher qu\'un simple aller-retour.' },
      { type: 'h2', text: 'Trois exemples concrets' },
      { type: 'ul', items: [
        'Sortie CE Paris → Deauville à la journée, 50 personnes, autocar standard : de l\'ordre de 1 100 à 1 400 € TTC selon l\'amplitude',
        'Transfert mariage : navette de 3 rotations le soir entre la mairie et le domaine (20 km), minibus : environ 600 à 800 € TTC',
        'Classe de neige Lyon → Alpe d\'Huez, aller-retour à une semaine d\'intervalle, 53 élèves + accompagnateurs : environ 2 000 à 2 600 € TTC les deux trajets',
      ]},
      { type: 'p', text: 'Ces montants sont indicatifs : chaque devis dépend des disponibilités réelles des transporteurs au moment de la demande. C\'est précisément l\'intérêt de comparer plusieurs propositions.' },
      { type: 'h2', text: 'L\'acompte et le paiement' },
      { type: 'p', text: 'La règle du marché : un acompte de 30 % à la réservation, le solde avant le départ. Si le départ est à moins de 30 jours, l\'acompte passe généralement à 50 %, et à 100 % à moins de 15 jours. Le paiement se fait par carte ou virement.' },
      { type: 'h2', text: 'Comment payer moins cher : 5 leviers' },
      { type: 'ul', items: [
        'Réservez tôt : 6 à 8 semaines à l\'avance pour un trajet standard, 3 mois pour un samedi de haute saison',
        'Soyez flexible sur les horaires : réduire l\'amplitude du chauffeur (partir un peu plus tard, rentrer un peu plus tôt) peut faire changer de tranche tarifaire',
        'Évitez le samedi si votre événement le permet : le vendredi ou le dimanche sont souvent moins demandés',
        'Ajustez le véhicule au groupe réel : passer de 62 à 59 participants évite le surcoût grande capacité',
        'Comparez plusieurs transporteurs : sur un même trajet, l\'écart entre deux devis atteint couramment 15 à 25 % — c\'est exactement ce que Busmoov fait pour vous en une seule demande',
      ]},
      { type: 'h2', text: 'Obtenir un prix précis pour votre trajet' },
      { type: 'p', text: 'Décrivez votre trajet (départ, destination, date, horaires, nombre de passagers) dans notre formulaire : vous recevez sous 24 h plusieurs devis gratuits de transporteurs vérifiés, sans engagement. Le prix affiché est ferme et tout compris — carburant, péages et chauffeur inclus.' },
    ],
  },
  {
    slug: 'organiser-sortie-scolaire-autocar',
    titre: 'Organiser une sortie scolaire en autocar : le guide complet',
    metaTitle: 'Sortie scolaire en autocar : réglementation, prix, checklist | Busmoov',
    metaDescription: 'Réglementation transport d\'enfants, nombre d\'accompagnateurs, délais de réservation, budget et checklist : tout pour organiser une sortie scolaire en autocar sereinement.',
    datePublication: '2026-09-04',
    extrait: 'Réglementation, accompagnateurs, délais, budget : le guide pratique de l\'enseignant ou du parent d\'élève qui organise une sortie scolaire en autocar.',
    blocks: [
      { type: 'p', text: 'Musée, théâtre, classe verte, voyage de fin d\'année : la sortie scolaire commence toujours par la même question logistique — le transport. Voici ce qu\'il faut savoir pour organiser le trajet en autocar dans les règles, sans stress et sans mauvaise surprise budgétaire.' },
      { type: 'h2', text: 'La réglementation du transport d\'enfants' },
      { type: 'ul', items: [
        'Le véhicule doit être un autocar de transport en commun aux normes, équipé de ceintures de sécurité — obligatoires et à boucler pour tous les passagers',
        'Le pictogramme « transport d\'enfants » doit être apposé à l\'avant et à l\'arrière du véhicule',
        'Le transporteur doit être inscrit au registre des transporteurs de voyageurs (licence communautaire) — c\'est systématiquement vérifié chez les transporteurs du réseau Busmoov',
        'Chaque enfant compte pour une place assise : pas de surnombre, jamais',
        'Les trajets de nuit (entre minuit et 6 h) sont interdits pour les transports en commun d\'enfants, sauf dérogation',
      ]},
      { type: 'h2', text: 'Combien d\'accompagnateurs prévoir ?' },
      { type: 'p', text: 'L\'Éducation nationale fixe les taux d\'encadrement de la sortie elle-même : en élémentaire, 2 adultes minimum par classe, puis 1 adulte supplémentaire par tranche de 15 élèves au-delà de 30 (les seuils varient en maternelle et pour les sorties avec nuitée). Pensez à compter les accompagnateurs dans la capacité du car : une classe de 28 élèves avec 4 adultes occupe 32 places.' },
      { type: 'h2', text: 'Quel autocar pour quel effectif ?' },
      { type: 'ul', items: [
        'Jusqu\'à 20 personnes : minibus — pratique pour les petites sections ou les sorties de club',
        'De 21 à 59 personnes : autocar standard, le format le plus courant et le plus économique par personne',
        'De 60 à 90 personnes : autocar grande capacité ou double étage — ou deux cars standard, parfois plus simple pour les déposes',
        'Deux classes qui partent ensemble : deux véhicules coordonnés valent souvent mieux qu\'un très grand car complet',
      ]},
      { type: 'h2', text: 'Les délais : quand réserver ?' },
      { type: 'p', text: 'Pour une sortie à la journée en période creuse, 3 à 4 semaines suffisent. Mais les périodes de sorties scolaires sont les mêmes pour tout le monde : mai-juin et septembre-octobre saturent vite. Pour ces créneaux — et pour tout voyage avec nuitée — demandez vos devis 2 à 3 mois à l\'avance. Vous obtiendrez plus de choix et de meilleurs prix.' },
      { type: 'h2', text: 'Le budget' },
      { type: 'p', text: 'Une sortie à la journée en autocar standard démarre à 690 € TTC pour un trajet local — soit environ 12 à 15 € par élève pour une classe et demie. Le prix dépend surtout de la distance et de l\'amplitude horaire (l\'heure de départ du car et l\'heure de retour). Un départ à 9 h et un retour à 17 h coûtent moins cher qu\'une amplitude de 7 h à 20 h. Pour les trajets plus longs (classe découverte, voyage de fin d\'année), le devis se construit sur mesure.' },
      { type: 'callout', text: 'Astuce budget : mutualiser le car entre deux classes du même niveau divise presque par deux le coût de transport par élève.' },
      { type: 'h2', text: 'La checklist de l\'organisateur' },
      { type: 'ul', items: [
        'Liste nominative des passagers (élèves et adultes) — à conserver et à remettre au chauffeur en cas de contrôle',
        'Autorisations de sortie signées des parents',
        'Horaires validés avec le transporteur : heure de prise en charge, lieu exact de montée (attention aux zones de stationnement des cars devant l\'école), heure de retour',
        'Numéro de téléphone du chauffeur récupéré la veille du départ — Busmoov vous le transmet automatiquement',
        'Répartition des élèves et des adultes dans le car (un adulte près de chaque porte)',
        'Consignes données aux élèves : ceinture bouclée, on reste assis pendant le trajet',
        'Prévoir les sacs à l\'avance : les soutes se chargent avant la montée des enfants',
      ]},
      { type: 'h2', text: 'Les erreurs à éviter' },
      { type: 'ul', items: [
        'Sous-estimer l\'effectif : ajouter 3 accompagnateurs de dernière minute dans un car complet est impossible — prévoyez une marge dès le devis',
        'Oublier le temps de montée/descente : 50 enfants ne montent pas dans un car en 2 minutes ; intégrez 15 minutes de battement à chaque étape',
        'Réserver sur le seul critère du prix le plus bas sans vérifier le transporteur : licence, assurance et véhicule récent ne se négocient pas quand on transporte des enfants',
        'Attendre la dernière semaine pour confirmer : sans acompte versé, le car n\'est pas bloqué',
      ]},
      { type: 'h2', text: 'Demander un devis pour votre sortie scolaire' },
      { type: 'p', text: 'Indiquez la date, le trajet, l\'effectif (élèves + accompagnateurs) et vos horaires souhaités : vous recevez plusieurs devis gratuits sous 24 h de transporteurs habitués aux scolaires, véhicules aux normes transport d\'enfants. Écoles, collèges, lycées : le paiement par bon de commande administratif est possible.' },
    ],
  },
]

export function getArticle(slug: string): BlogArticle | undefined {
  return articles.find((a) => a.slug === slug)
}
