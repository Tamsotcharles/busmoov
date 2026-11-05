/**
 * Guides du microsite busmoovlyon.fr (/guides/<slug>). Fichier pur : lu par
 * la page React ET par scripts/prerender.mjs. Contenu propre à Lyon, prix
 * uniquement en « à partir de » arrondis, liens internes au microsite
 * (/ et /guides/...) ; un seul lien vers le site national par guide au plus.
 */
import type { BlogBlock } from '../blog'

export interface LyonGuide {
  slug: string
  titre: string
  metaTitle: string
  metaDescription: string
  datePublication: string
  extrait: string
  blocks: BlogBlock[]
}

export const lyonGuides: LyonGuide[] = [
  {
    slug: 'transfert-aeroport-lyon-saint-exupery-groupe',
    titre: 'Transfert aéroport Lyon Saint-Exupéry pour un groupe : le mode d\'emploi',
    metaTitle: 'Transfert groupe aéroport Lyon Saint-Exupéry en autocar | Busmoov Lyon',
    metaDescription: 'Organiser le transfert d\'un groupe entre l\'aéroport Lyon Saint-Exupéry et Lyon, une station ou un séminaire : zone autocars, timing, bagages, prix de départ.',
    datePublication: '2026-11-05',
    extrait: 'Où le car attend, combien de temps prévoir après l\'atterrissage, quel véhicule selon le groupe et les bagages, et ce que coûte un transfert Saint-Exupéry.',
    blocks: [
      { type: 'p', text: 'Lyon Saint-Exupéry est à 25 kilomètres du centre, sans métro direct : pour un groupe de 15, 40 ou 80 personnes avec des valises, l\'autocar est la seule option qui évite d\'éclater le groupe entre le Rhônexpress, les taxis et les navettes. Voici comment se passe un transfert de groupe à Saint-Exupéry, du parking autocars au dépôt à l\'hôtel.' },
      { type: 'h2', text: 'Où le car attend votre groupe' },
      { type: 'p', text: 'L\'aéroport dispose d\'une zone de stationnement réservée aux autocars, au niveau des arrivées, à quelques minutes à pied des terminaux 1 et 2. Le chauffeur s\'y gare, vient à la sortie de la zone bagages avec un panneau au nom du groupe, puis ramène tout le monde au car. Pour un groupe qui arrive en TGV à la gare de Saint-Exupéry, la dépose se fait au même endroit : la gare est reliée aux terminaux par une passerelle.' },
      { type: 'h2', text: 'Le timing qui marche' },
      { type: 'ul', items: [
        'Donnez le numéro de vol au transporteur : le chauffeur suit l\'horaire réel et un retard ne vous coûte rien dans la limite habituelle d\'une heure.',
        'Comptez 45 minutes entre l\'atterrissage et le départ du car pour un vol européen avec bagages de soute, 1h15 pour un long-courrier avec passage à la douane.',
        'Vers le centre de Lyon, le trajet prend 30 à 40 minutes hors pointe par l\'A43, jusqu\'à une heure le vendredi soir et le lundi matin.',
        'Au départ, un groupe doit être à l\'aéroport deux heures avant un vol européen : le car part donc du centre trois heures avant le décollage.',
      ]},
      { type: 'h2', text: 'Quel véhicule selon le groupe' },
      { type: 'p', text: 'Jusqu\'à 18 personnes avec bagages, un minibus suffit. De 20 à 50 personnes, un autocar standard, dont les soutes accueillent une valise et un bagage cabine par passager. Au-delà, un autocar grande capacité ou deux véhicules. Le point qui fait basculer le choix est le volume des bagages : un groupe de ski ou une délégation sportive avec du matériel remplit les soutes bien avant les sièges. Indiquez-le dans la demande, le transporteur dimensionne en conséquence.' },
      { type: 'h2', text: 'Les destinations fréquentes depuis Saint-Exupéry' },
      { type: 'ul', items: [
        'Le centre de Lyon : hôtels de la Part-Dieu, de la presqu\'île et de la Confluence, Cité internationale pour les congrès.',
        'Les stations de ski de Savoie et d\'Isère : Val d\'Isère, Tignes, Les Arcs, Courchevel, l\'Alpe d\'Huez, Les 2 Alpes, à deux ou trois heures. Voir notre guide des transferts vers les stations.',
        'Eurexpo, à dix minutes de l\'aéroport, pour les exposants et visiteurs de salons.',
        'Le Beaujolais et les Monts d\'Or pour les séminaires résidentiels, à une heure.',
      ]},
      { type: 'h2', text: 'Combien ça coûte' },
      { type: 'table', caption: 'Prix de départ indicatifs 2026, TTC, chauffeur, carburant et péages inclus', headers: ['Transfert aller simple', 'Minibus 8-20 places', 'Bus standard 21-59 places'], rows: [
        ['Saint-Exupéry → centre de Lyon', 'à partir de 350 €', 'à partir de 400 €'],
        ['Saint-Exupéry → Eurexpo ou Part-Dieu', 'à partir de 350 €', 'à partir de 400 €'],
        ['Saint-Exupéry → station de ski savoyarde', 'à partir de 600 €', 'à partir de 900 €'],
      ]},
      { type: 'p', text: 'Un aller-retour réservé en une fois coûte moins cher que deux allers simples séparés. Les prix montent pendant les vacances de février et les grands salons d\'Eurexpo, quand les véhicules manquent.' },
      { type: 'h2', text: 'Ce qu\'il faut envoyer au transporteur' },
      { type: 'ul', items: [
        'Numéro de vol et heure d\'arrivée ou de départ, nombre exact de passagers, volume de bagages.',
        'Adresse précise de dépose ou de prise en charge, avec un numéro de téléphone joignable le jour J.',
        'Pour un aller-retour, les deux dates : le prix est calculé sur l\'ensemble.',
      ]},
      { type: 'callout', text: 'Décrivez votre transfert sur [la page d\'accueil de Busmoov Lyon](/) : vous recevez jusqu\'à trois devis de transporteurs lyonnais sous 24h, le chauffeur et les péages inclus.' },
    ],
  },
  {
    slug: 'bus-lyon-stations-de-ski',
    titre: 'Bus de Lyon vers les stations de ski : organiser le transport d\'un groupe',
    metaTitle: 'Bus Lyon stations de ski pour un groupe : transfert, séjour | Busmoov Lyon',
    metaDescription: 'Depuis Lyon, Val d\'Isère, Tignes, Les Arcs, l\'Alpe d\'Huez ou Les 2 Alpes en autocar : temps de trajet, règles d\'hiver, soutes à skis, prix de départ pour un club, une école ou un comité d\'entreprise.',
    datePublication: '2026-11-05',
    extrait: 'Temps de route depuis Lyon station par station, ce que le transporteur gère en hiver, le format qui convient à chaque groupe et les prix de départ.',
    blocks: [
      { type: 'p', text: 'Lyon est la meilleure base de France pour partir au ski en groupe : toutes les grandes stations de Savoie et d\'Isère sont à moins de trois heures, et les transporteurs lyonnais y montent chaque week-end de décembre à avril. Ce guide s\'adresse aux clubs, aux écoles, aux comités d\'entreprise et aux groupes d\'amis qui veulent un car plutôt qu\'une file de voitures sur l\'A43.' },
      { type: 'h2', text: 'Temps de route depuis Lyon' },
      { type: 'table', caption: 'Durées indicatives depuis le centre de Lyon, hors samedi de pointe', headers: ['Station', 'Route', 'Durée'], rows: [
        ['Chamrousse', 'A48 puis Grenoble', '1h45'],
        ['Les 2 Alpes, Alpe d\'Huez', 'A48, Grenoble, Bourg-d\'Oisans', '2h15'],
        ['Les Arcs, La Plagne', 'A43, Albertville, Moûtiers', '2h45'],
        ['Courchevel, Méribel, Val Thorens', 'A43, Moûtiers', '2h45 à 3h'],
        ['Val d\'Isère, Tignes', 'A43, Bourg-Saint-Maurice', '3h15'],
        ['Chamonix', 'A40 par Genève', '2h30'],
      ]},
      { type: 'p', text: 'Les samedis de février, ajoutez une à deux heures entre Albertville et les stations de Tarentaise. Un départ de Lyon à 6 heures ou une arrivée en milieu d\'après-midi évite le pire.' },
      { type: 'h2', text: 'Ce que gère le transporteur en hiver' },
      { type: 'ul', items: [
        'Les équipements hiver obligatoires de novembre à mars en montagne : chaînes ou pneus hiver à bord, c\'est sa responsabilité.',
        'La route : les chauffeurs lyonnais connaissent les cols fermés, les déviations et les parkings de chaque station.',
        'Les bagages : skis, chaussures, valises. Demandez un car à soutes XXL ou une remorque à skis pour un groupe de 50.',
        'Le temps de conduite : depuis Lyon, un chauffeur suffit pour un transfert ou une journée ; un second chauffeur ne s\'impose que si la journée dépasse 12 heures.',
      ]},
      { type: 'h2', text: 'Trois formats selon votre groupe' },
      { type: 'ul', items: [
        'La journée : départ 6h30, arrivée avant l\'ouverture des remontées, retour vers 17h. Le format des clubs et des comités d\'entreprise, le plus économique par personne.',
        'Le transfert de séjour : le car monte le samedi, redescend à vide et revient la semaine suivante. Le format des écoles en classe de neige et des groupes d\'amis.',
        'Le car sur place : il reste à la station toute la semaine pour les déplacements. Utile pour une station étalée ou un programme chargé, plus cher car le chauffeur est logé.',
      ]},
      { type: 'h2', text: 'Prix de départ depuis Lyon' },
      { type: 'table', caption: 'Prix de départ indicatifs 2026, TTC, chauffeur, carburant et péages inclus, hors vacances scolaires', headers: ['Formule', 'Minibus 8-20 places', 'Bus standard 21-59 places'], rows: [
        ['Journée ski Chamrousse ou Les 2 Alpes', 'à partir de 900 €', 'à partir de 1 000 €'],
        ['Transfert aller simple vers la Tarentaise', 'à partir de 600 €', 'à partir de 900 €'],
        ['Week-end 2 jours', 'à partir de 1 600 €', 'à partir de 1 800 €'],
        ['Séjour avec car sur place', 'Sur devis', 'Sur devis'],
      ]},
      { type: 'p', text: 'Sur un bus de 50 personnes plein, une journée ski revient à une vingtaine d\'euros par skieur pour le transport. Les vacances de Noël et de février augmentent les prix et surtout raréfient les cars : réservez avant la mi-décembre pour février.' },
      { type: 'h2', text: 'Écoles : la classe de neige depuis Lyon' },
      { type: 'p', text: 'Les écoles de la métropole partent en général à Chamrousse, aux 7 Laux, à Villard-de-Lans ou aux 2 Alpes. Le car monte le lundi matin avec les enfants, revient le vendredi, et un car local assure les éventuelles sorties sur place. Précisez le nombre d\'élèves et d\'accompagnateurs, le volume de bagages et les skis : nos transporteurs fournissent des véhicules aux normes transport d\'enfants et les attestations demandées par l\'établissement.' },
      { type: 'callout', text: 'Pour un départ de l\'aéroport plutôt que du centre, lisez aussi notre guide du [transfert à Saint-Exupéry](/guides/transfert-aeroport-lyon-saint-exupery-groupe). Et pour chiffrer votre sortie, [décrivez votre trajet](/) : trois devis de transporteurs lyonnais sous 24h.' },
    ],
  },
  {
    slug: 'prix-location-autocar-lyon',
    titre: 'Combien coûte la location d\'un autocar avec chauffeur à Lyon ?',
    metaTitle: 'Prix location autocar avec chauffeur à Lyon 2026 | Busmoov Lyon',
    metaDescription: 'Les prix de départ d\'un autocar ou d\'un minibus avec chauffeur à Lyon : transfert, journée, week-end, par taille de véhicule, et ce qui fait varier la facture.',
    datePublication: '2026-11-05',
    extrait: 'Transfert, journée dans la région, week-end, stations : les prix de départ à Lyon par type de véhicule, et les quatre facteurs qui font bouger un devis.',
    blocks: [
      { type: 'p', text: 'La question arrive toujours en premier, et la réponse honnête est « ça dépend », mais ça dépend de quatre choses précises. Voici les ordres de grandeur constatés à Lyon en 2026 pour un autocar avec chauffeur, et les leviers pour payer moins cher.' },
      { type: 'h2', text: 'Les quatre facteurs du prix' },
      { type: 'ul', items: [
        'La distance : le kilométrage réel aller et retour, péages compris.',
        'L\'amplitude du chauffeur : de son départ du dépôt à son retour. Une journée de 8 heures et une journée de 12 heures ne sont pas au même tarif, et au-delà de 12 heures il faut un second chauffeur.',
        'La taille du véhicule : minibus, autocar standard jusqu\'à 59 places, grande capacité jusqu\'à 90.',
        'La saison et le jour : un samedi de juin ou un week-end de février coûtent plus qu\'un mardi d\'octobre, parce que les cars manquent.',
      ]},
      { type: 'h2', text: 'Prix de départ à Lyon' },
      { type: 'table', caption: 'Prix de départ indicatifs 2026 au départ de Lyon, TTC, chauffeur, carburant et péages inclus, hors haute saison', headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'], rows: [
        ['Transfert aller simple dans la métropole ou vers Saint-Exupéry', 'à partir de 350 €', 'à partir de 400 €', 'à partir de 500 €'],
        ['Journée dans la métropole, le Beaujolais ou la Dombes', 'à partir de 600 €', 'à partir de 700 €', 'à partir de 800 €'],
        ['Journée Annecy, Genève, Grenoble ou station de ski', 'à partir de 900 €', 'à partir de 1 000 €', 'à partir de 1 200 €'],
        ['Week-end 2 jours', 'à partir de 1 600 €', 'à partir de 1 800 €', 'Sur devis'],
        ['Longue distance, plusieurs jours', 'Sur devis', 'Sur devis', 'Sur devis'],
      ]},
      { type: 'h2', text: 'Ce que le prix inclut' },
      { type: 'p', text: 'Dans nos devis, le chauffeur, le carburant, les péages et l\'assurance sont compris. Restent à votre charge les parkings sur place quand ils sont payants, les repas du chauffeur sur une journée longue, et son hébergement si le car reste plusieurs jours.' },
      { type: 'h2', text: 'Par personne, ça donne quoi' },
      { type: 'p', text: 'Sur un autocar standard plein, une journée dans la région revient à une quinzaine d\'euros par passager, un transfert vers l\'aéroport à moins de dix. C\'est moins cher que le Rhônexpress pour un groupe, et incomparable avec dix voitures et leurs parkings. Le minibus est plus cher par tête : il ne devient intéressant qu\'en dessous de 20 personnes.' },
      { type: 'h2', text: 'Cinq façons de payer moins cher' },
      { type: 'ul', items: [
        'Partir un jour de semaine plutôt qu\'un samedi.',
        'Remplir le car : le prix est au véhicule, pas à la personne.',
        'Limiter l\'amplitude : un retour à 18h plutôt qu\'à 21h peut changer de tranche.',
        'Éviter le car sur place pour un séjour si le groupe ne bouge pas entre l\'aller et le retour.',
        'Comparer : c\'est le principe de Busmoov Lyon, trois transporteurs répondent à la même demande.',
      ]},
      { type: 'callout', text: 'Les grilles exactes dépendent du transporteur et de la date. Pour un chiffre ferme, [décrivez votre trajet](/) : vous recevez jusqu\'à trois devis sous 24h, gratuits et sans engagement.' },
    ],
  },
  {
    slug: 'autocariste-lyon-comment-choisir',
    titre: 'Autocariste à Lyon : comment choisir, et pourquoi en comparer trois',
    metaTitle: 'Autocariste Lyon : choisir un transporteur fiable | Busmoov Lyon',
    metaDescription: 'Licence, assurance, âge des véhicules, chauffeurs, avis : ce qu\'il faut vérifier chez un autocariste lyonnais avant de réserver, et pourquoi la mise en concurrence protège votre budget.',
    datePublication: '2026-11-05',
    extrait: 'Les documents qu\'un autocariste doit pouvoir montrer, les questions à poser avant de signer, et la méthode Busmoov pour comparer sans y passer la journée.',
    blocks: [
      { type: 'p', text: 'La région lyonnaise compte des dizaines d\'autocaristes, des grands groupes régionaux aux entreprises familiales de cinq cars. Tous ne se valent pas sur la fiabilité, l\'âge du parc et la réactivité. Voici ce qu\'il faut vérifier, et comment nous le faisons pour vous.' },
      { type: 'h2', text: 'Les documents obligatoires' },
      { type: 'ul', items: [
        'La licence communautaire de transport de voyageurs, délivrée par la préfecture de région, sans laquelle une entreprise n\'a pas le droit de transporter un groupe contre rémunération.',
        'L\'attestation d\'assurance responsabilité civile professionnelle en cours de validité.',
        'Pour les chauffeurs : permis D et carte de qualification conducteur à jour.',
        'Pour un groupe d\'enfants : des véhicules équipés de ceintures et conformes aux règles du transport scolaire.',
      ]},
      { type: 'p', text: 'Chez Busmoov, ces documents sont vérifiés à l\'entrée d\'un transporteur dans le réseau et renouvelés à échéance. Vous n\'avez pas à les demander.' },
      { type: 'h2', text: 'Les questions qui font la différence' },
      { type: 'ul', items: [
        'Quel âge a le véhicule proposé ? Au-delà de dix ans, le confort et la fiabilité baissent.',
        'Le chauffeur connaît-il la destination ? Un transfert à Saint-Exupéry ou une montée en station ne se gèrent pas comme une ligne régulière.',
        'Que se passe-t-il en cas de panne ? Un bon autocariste a un véhicule de remplacement ou un accord avec un confrère.',
        'Le prix est-il ferme ? Péages, carburant, parking du chauffeur : tout doit être écrit.',
        'Qui appeler le jour J ? Un numéro d\'astreinte, pas un standard fermé le samedi.',
      ]},
      { type: 'h2', text: 'Pourquoi comparer trois devis' },
      { type: 'p', text: 'Sur un même trajet, deux autocaristes lyonnais sérieux peuvent différer de 10 à 20 %, selon leur dépôt, leur planning du jour et la taille de leur parc. Un car qui revient à vide d\'une autre prestation sera moins cher. La seule façon de le savoir est de demander à plusieurs. C\'est exactement ce que fait Busmoov Lyon : une demande, trois transporteurs du Rhône interrogés, trois devis présentés de la même façon.' },
      { type: 'h2', text: 'Les signaux d\'alerte' },
      { type: 'ul', items: [
        'Un prix très inférieur aux autres sans explication : véhicule ancien, sous-traitance non déclarée ou amplitude sous-estimée.',
        'Pas de devis écrit, ou un devis sans mention du véhicule et de l\'amplitude.',
        'Un acompte demandé en espèces ou sur un compte personnel.',
        'Aucune trace de l\'entreprise : pas de numéro SIRET, pas d\'adresse de dépôt.',
      ]},
      { type: 'callout', text: 'Vous voulez un autocariste lyonnais vérifié sans passer vos appels vous-même ? [Décrivez votre trajet](/), nous interrogeons trois transporteurs du réseau et vous choisissez.' },
    ],
  },
  {
    slug: 'sortie-scolaire-lyon-autocar',
    titre: 'Sortie scolaire en autocar depuis Lyon : destinations, règles et budget',
    metaTitle: 'Sortie scolaire en autocar à Lyon : destinations et prix | Busmoov Lyon',
    metaDescription: 'Organiser une sortie scolaire au départ de Lyon : Confluences, Vulcania, parc des Oiseaux, Pérouges, journée à la neige. Règles du transport d\'enfants, timing et prix de départ pour une classe.',
    datePublication: '2026-11-05',
    extrait: 'Les destinations qui tiennent dans une journée scolaire depuis Lyon, ce que l\'établissement doit fournir, et ce que coûte un car pour une ou deux classes.',
    blocks: [
      { type: 'p', text: 'Une sortie scolaire se joue sur l\'horaire : partir après l\'accueil du matin, rentrer avant la sortie des classes, et tenir la journée des enfants. Depuis Lyon, de nombreuses destinations tiennent dans ce cadre. Voici les plus demandées par les écoles de la métropole, et ce qu\'il faut prévoir côté transport.' },
      { type: 'h2', text: 'Destinations à moins d\'une heure' },
      { type: 'ul', items: [
        'Le musée des Confluences et le parc de la Tête d\'Or, dans Lyon : dépose sur les parkings cars dédiés.',
        'Pérouges et le parc des Oiseaux à Villars-les-Dombes, à 40 minutes : la journée Moyen Âge et nature.',
        'Le musée gallo-romain de Saint-Romain-en-Gal à Vienne, à 35 minutes.',
        'Les Monts d\'Or et les fermes pédagogiques des Monts du Lyonnais, à 30 minutes.',
      ]},
      { type: 'h2', text: 'Destinations à la journée' },
      { type: 'ul', items: [
        'Vulcania et le puy de Dôme, à 2 heures : la sortie sciences de référence, parking cars devant l\'entrée.',
        'Annecy et son lac, à 1h30 : journée nature et patrimoine.',
        'La journée à la neige à Chamrousse ou aux 7 Laux, à 1h45 : luge et raquettes pour les primaires, ski pour les collèges.',
        'Le Palais idéal du facteur Cheval à Hauterives, à 1h15.',
      ]},
      { type: 'h2', text: 'Les règles du transport d\'enfants' },
      { type: 'ul', items: [
        'Un siège par enfant, ceinture obligatoire ; pas d\'enfant debout.',
        'Véhicule équipé pour le transport d\'enfants et signalé comme tel.',
        'Liste des passagers et des accompagnateurs à bord, remise au chauffeur.',
        'Pour une sortie avec nuitée, l\'autorisation de l\'inspection et les attestations du transporteur, que nos partenaires fournissent sur demande.',
      ]},
      { type: 'h2', text: 'Combien de cars pour combien d\'élèves' },
      { type: 'p', text: 'Une classe et ses accompagnateurs tiennent dans un autocar standard de 50 à 59 places. Deux classes passent dans un autocar grande capacité de 60 à 70 places, ou dans deux cars standards si les deux classes font des programmes différents. Indiquez l\'effectif exact, accompagnateurs compris : le véhicule est dimensionné sur ce chiffre.' },
      { type: 'h2', text: 'Budget pour une classe' },
      { type: 'table', caption: 'Prix de départ indicatifs 2026, TTC, chauffeur, carburant et péages inclus, autocar standard', headers: ['Sortie', 'Prix de départ', 'Par élève, classe de 30 et 4 accompagnateurs'], rows: [
        ['Demi-journée dans Lyon ou la métropole', 'à partir de 400 €', 'environ 12 €'],
        ['Journée Pérouges, Dombes ou Vienne', 'à partir de 700 €', 'environ 21 €'],
        ['Journée Vulcania, Annecy ou neige', 'à partir de 1 000 €', 'environ 30 €'],
      ]},
      { type: 'p', text: 'Les établissements règlent par virement ou par mandat administratif après la prestation sur demande. Les sorties de mai et juin se réservent dès la rentrée de janvier : c\'est la période où les cars manquent.' },
      { type: 'callout', text: 'Décrivez la sortie, date, effectif et destination, sur [la page d\'accueil](/) : vous recevez jusqu\'à trois devis de transporteurs lyonnais habitués aux écoles. Pour une classe de neige, voir aussi notre guide [bus vers les stations de ski](/guides/bus-lyon-stations-de-ski).' },
    ],
  },
  {
    slug: 'fete-des-lumieres-en-autocar',
    titre: 'Venir à la Fête des Lumières en autocar : ce qu\'il faut savoir',
    metaTitle: 'Fête des Lumières de Lyon en autocar : accès, dépose, groupe | Busmoov Lyon',
    metaDescription: 'Organiser la venue d\'un groupe à la Fête des Lumières de Lyon en autocar : périmètre fermé, parkings relais, horaires, retour de nuit, prix de départ depuis la région.',
    datePublication: '2026-11-05',
    extrait: 'Le centre est fermé aux cars pendant la Fête : où déposer le groupe, comment rentrer après 22h, et quel budget pour une soirée ou un week-end lumières.',
    blocks: [
      { type: 'p', text: 'Chaque année autour du 8 décembre, la Fête des Lumières attire plus d\'un million et demi de visiteurs sur quatre soirs. Pour un comité d\'entreprise, une association ou un groupe d\'amis venus de la région, l\'autocar est le moyen le plus simple d\'y aller, à une condition : savoir où il peut s\'arrêter, parce que le centre de Lyon est fermé aux véhicules pendant la Fête.' },
      { type: 'h2', text: 'Le périmètre fermé' },
      { type: 'p', text: 'De la fin d\'après-midi à minuit, la presqu\'île, le Vieux Lyon et les quais sont interdits aux véhicules, cars compris. Les autocars sont orientés vers des parkings relais et des zones de dépose en périphérie du périmètre, communiquées par la Ville quelques semaines avant l\'événement. Le groupe termine en métro, en tram ou à pied. Les transporteurs lyonnais connaissent le dispositif et adaptent le point de dépose à votre programme.' },
      { type: 'h2', text: 'Le déroulé type d\'une soirée' },
      { type: 'ul', items: [
        'Départ de votre ville en fin d\'après-midi pour arriver en périphérie de Lyon vers 18h, avant la saturation des accès.',
        'Dépose au point convenu, trajet en transports en commun jusqu\'au parcours des illuminations, qui s\'allument à 19h ou 20h selon les soirs.',
        'Rendez-vous au car fixé à une heure et un lieu précis, avec le numéro du responsable : dans la foule, « devant la gare » ne suffit pas.',
        'Retour de nuit : prévoyez l\'heure réelle de fin pour que l\'amplitude du chauffeur soit respectée, ou un second chauffeur au-delà de 12 heures.',
      ]},
      { type: 'h2', text: 'Soirée ou week-end' },
      { type: 'p', text: 'À moins de deux heures, Saint-Étienne, Grenoble, Valence, Bourg-en-Bresse ou Mâcon, la soirée aller-retour est le format naturel. Au-delà, le week-end avec nuit à Lyon ou en périphérie est plus confortable et permet de voir deux soirs de parcours différents. Les hôtels de la métropole se remplissent des mois à l\'avance : réservez l\'hébergement avant le car.' },
      { type: 'h2', text: 'Prix de départ' },
      { type: 'table', caption: 'Prix de départ indicatifs 2026, TTC, chauffeur, carburant et péages inclus', headers: ['Format', 'Minibus 8-20 places', 'Bus standard 21-59 places'], rows: [
        ['Soirée aller-retour depuis une ville à moins d\'une heure', 'à partir de 600 €', 'à partir de 700 €'],
        ['Soirée aller-retour depuis une ville à deux heures', 'à partir de 900 €', 'à partir de 1 000 €'],
        ['Week-end 2 jours avec nuit à Lyon', 'à partir de 1 600 €', 'à partir de 1 800 €'],
      ]},
      { type: 'p', text: 'Le week-end de la Fête est l\'un des plus chargés de l\'année pour les autocaristes de la région : réservez en octobre, les cars disponibles début décembre se comptent sur les doigts d\'une main.' },
      { type: 'callout', text: 'Pour un groupe lyonnais qui part en sortie le même week-end, les mêmes contraintes s\'appliquent au départ. Dans les deux cas, [décrivez votre soirée](/) et vous recevez trois devis de transporteurs qui connaissent le dispositif.' },
    ],
  },
  {
    slug: 'bus-bde-lyon-wei-soiree-ski',
    titre: 'Location de bus pour un BDE à Lyon : WEI, soirées, ski et gala',
    metaTitle: 'Bus pour BDE à Lyon : week-end d\'intégration, soirées, ski | Busmoov Lyon',
    metaDescription: 'Louer un autocar pour un BDE lyonnais : week-end d\'intégration, navettes de soirée et de gala, séjour au ski. Règles à bord, caution, facture au nom de l\'association, prix de départ.',
    datePublication: '2026-11-05',
    extrait: 'Ce qu\'un transporteur accepte et refuse pour un WEI, comment faire partir 150 étudiants le même soir, et ce que coûtent un week-end, une soirée et une semaine au ski.',
    blocks: [
      { type: 'p', text: 'Lyon compte plus de 150 000 étudiants, de la Doua à Gerland, d\'Écully à Bron, et autant de bureaux des étudiants qui organisent chaque année un week-end d\'intégration, des soirées, un gala et souvent un séjour au ski. Tous ont le même problème : déplacer 50, 150 ou 400 personnes à un horaire fixe, de nuit, avec un budget d\'association. Voici comment un autocariste lyonnais traite une demande de BDE, ce qu\'il exige, et ce que coûtent les formats les plus courants.' },
      { type: 'h2', text: 'Le week-end d\'intégration' },
      { type: 'p', text: 'Le WEI est le plus gros déplacement de l\'année : un départ du campus un vendredi en fin d\'après-midi, un retour le dimanche, et entre les deux des cars qui dorment sur place ou repartent à Lyon. Les destinations habituelles des BDE lyonnais sont à moins de deux heures : bases de loisirs de l\'Ain et de l\'Isère, campings de l\'Ardèche et de la Drôme, villages vacances du Vercors ou des Bauges. Pour chaque car de 50 à 60 places, deux choix :' },
      { type: 'ul', items: [
        'Le car reste sur place tout le week-end, chauffeur hébergé par vos soins : vous disposez du véhicule pour une excursion le samedi, c\'est le format mise à disposition.',
        'Le car dépose le vendredi et revient le dimanche : moins cher si le programme ne bouge pas du site, c\'est le format aller-retour sans mise à disposition.',
      ]},
      { type: 'p', text: 'Un WEI de 300 étudiants mobilise cinq ou six autocars du même transporteur ou de deux transporteurs coordonnés. Les cars lyonnais partent vite entre la mi-septembre et la mi-octobre : les BDE qui réservent en juin ont le choix, ceux qui s\'y prennent fin août prennent ce qui reste.' },
      { type: 'h2', text: 'Les soirées et le gala' },
      { type: 'p', text: 'Pour une soirée dans une salle hors de la métropole ou un gala dans un château du Beaujolais ou des Dombes, le besoin est une navette : aller depuis le campus ou une place de la ville vers 21h, retour entre 3h et 5h. Deux points font la différence avec un transport classique. L\'amplitude du chauffeur d\'abord : une navette qui part à 20h et rentre à 5h fait neuf heures de service, ce qui tient avec un seul chauffeur, mais pas si le même car a travaillé toute la journée. Le transporteur prévoit donc un chauffeur de nuit dédié. Les rotations ensuite : plutôt que six cars qui partent ensemble à 21h, deux cars qui tournent trois fois coûtent moins cher si la salle est à moins de 30 minutes.' },
      { type: 'h2', text: 'Le séjour au ski' },
      { type: 'p', text: 'En janvier, les BDE lyonnais partent une semaine aux 2 Alpes, à l\'Alpe d\'Huez, aux Arcs ou à Tignes, à deux ou trois heures de Lyon. Le format courant est un aller le samedi ou le dimanche matin et un retour le samedi suivant, sans car sur place. Les soutes d\'un autocar standard prennent les skis et les sacs de 50 passagers ; au-delà, une remorque ou un véhicule supplémentaire. Tout est détaillé dans notre guide [des transferts vers les stations de ski](/guides/bus-lyon-stations-de-ski), y compris les contraintes des routes de montagne en période de neige.' },
      { type: 'h2', text: 'Ce que le transporteur demande à un BDE' },
      { type: 'ul', items: [
        'Une facture et un contrat au nom de l\'association, signés par le président ou le trésorier, avec le numéro de SIRET ou de RNA de l\'association.',
        'Un acompte à la réservation, le solde avant le départ. Les paiements par carte et par virement sont acceptés ; une subvention d\'école qui arrive après l\'événement se discute à l\'avance, pas la veille.',
        'Une caution ou une clause de dégradation : un siège taché, une vitre cassée ou un car à nettoyer après une soirée sont facturés. Le montant est inscrit au contrat.',
        'Un responsable majeur et joignable par car, qui compte les passagers à chaque départ et reste en contact avec le chauffeur.',
        'La liste des points d\'arrêt et des horaires une semaine avant, pas la veille au soir.',
      ]},
      { type: 'h2', text: 'Ce qui se passe à bord' },
      { type: 'p', text: 'La loi interdit de consommer de l\'alcool dans un autocar et le chauffeur est en droit de refuser un passager manifestement ivre ou de s\'arrêter si la sécurité l\'exige. Les transporteurs lyonnais qui travaillent avec les BDE le savent et le disent clairement avant le départ : musique oui, debout dans l\'allée non, ceintures attachées, pas de verre. Un BDE qui respecte ces règles retrouve le même transporteur l\'année suivante, à de meilleures conditions ; un car rendu sale coûte le nettoyage et la place sur la liste des clients que l\'on rappelle.' },
      { type: 'h2', text: 'Prix de départ' },
      { type: 'table', caption: 'Prix de départ indicatifs 2026 au départ de Lyon, TTC, chauffeur, carburant et péages inclus, par autocar', headers: ['Format', 'Minibus 8-20 places', 'Bus standard 21-59 places'], rows: [
        ['Navette de soirée aller-retour, salle à moins d\'une heure', 'à partir de 600 €', 'à partir de 700 €'],
        ['Journée d\'intégration ou de cohésion à moins de deux heures', 'à partir de 600 €', 'à partir de 700 €'],
        ['Week-end d\'intégration 2 jours', 'à partir de 1 600 €', 'à partir de 1 800 €'],
        ['Transfert aller-retour vers une station de ski, une semaine d\'écart', 'à partir de 1 200 €', 'à partir de 1 800 €'],
      ]},
      { type: 'p', text: 'Ramené au passager, un autocar standard plein revient à une quinzaine d\'euros par personne pour une soirée et autour de 35 € pour un week-end d\'intégration. Les prix montent en septembre et pendant les vacances de février ; un WEI de trois jours ou une semaine au ski avec car sur place se chiffrent sur devis. Notre guide [des prix de la location d\'autocar à Lyon](/guides/prix-location-autocar-lyon) détaille ce qui fait varier le tarif.' },
      { type: 'h2', text: 'Les campus et les points de départ habituels' },
      { type: 'ul', items: [
        'Campus de la Doua à Villeurbanne : Lyon 1, INSA, Polytech, CPE. Dépose et prise en charge sur l\'avenue Gaston Berger ou le boulevard du 11 Novembre, à convenir avec le chauffeur.',
        'Écully : EM Lyon et Centrale Lyon, accès facile par l\'A6, parking autocars sur les campus.',
        'Gerland, Bron et Vaise : Lyon 3 Manufacture, Lyon 2 Porte des Alpes, Lyon 1 Rockefeller, ESSCA, ISARA, universités catholiques.',
        'Pour un départ de nuit depuis le centre, les quais du Rhône et la place Bellecour ne sont pas accessibles aux cars : les points de rendez-vous se font à Perrache, Part-Dieu ou Charpennes.',
      ]},
      { type: 'callout', text: 'Décrivez votre événement sur [la page d\'accueil de Busmoov Lyon](/) : nombre de participants, date, destination, horaires de retour. Vous recevez sous 24h jusqu\'à trois devis de transporteurs lyonnais habitués aux BDE, avec le contrat et la facture au nom de votre association.' },
    ],
  },
]

export function getLyonGuide(slug: string): LyonGuide | undefined {
  return lyonGuides.find((g) => g.slug === slug)
}
