/**
 * Contenu de la page pilier « Location de bus » (/fr/location-bus).
 * Fichier pur (sans import React) : lu par LocationBusPage.tsx ET par
 * scripts/prerender.mjs pour que le HTML statique porte tout le contenu.
 * Les paragraphes acceptent les liens markdown [ancre](/chemin).
 *
 * ⚠️ Ne jamais publier la grille tarifaire interne : fourchettes seulement.
 */
import type { TableauSeo } from './blog'

export interface LocationBusType {
  titre: string
  desc: string
  lien: string
}

export interface LocationBusFaq {
  q: string
  a: string
}

export const locationBusIntro: string[] = [
  'Bus, car, autocar : trois mots pour un même service, un véhicule de tourisme avec chauffeur professionnel, dimensionné pour votre groupe. Busmoov réunit plus de 180 autocaristes vérifiés partout en France : vous décrivez votre trajet une seule fois, vous recevez jusqu\'à 3 devis comparables sous 24h, et vous réservez en ligne.',
  'Du [minibus de 8 à 20 places](/services/location-minibus) au double étage de 90 places, en passant par le [bus 50 places](/location-bus-50-places) qui reste le format le plus demandé, le bon véhicule dépend de votre effectif réel, de la distance et de l\'amplitude horaire de la journée. Cette page vous aide à choisir avant de demander votre [devis de bus en ligne](/devis-autocar).',
]

export const locationBusAtouts = [
  { titre: 'Devis gratuit en 24h', desc: 'Plusieurs propositions comparées, sans engagement.' },
  { titre: 'Transporteurs vérifiés', desc: 'Licences, assurances et véhicules contrôlés dans toute la France.' },
  { titre: 'Chauffeur professionnel inclus', desc: 'Carburant, péages et chauffeur compris dans le prix.' },
  { titre: 'Du minibus au double étage', desc: 'Le bon véhicule pour chaque taille de groupe, de 8 à 90 places.' },
]

export const locationBusTypes: LocationBusType[] = [
  { titre: 'Minibus (8-20 places)', desc: 'Transferts VIP, petits comités, navettes mariage : le format souple qui passe partout, avec chauffeur.', lien: '/location-minibus-20-places' },
  { titre: 'Bus standard (21-59 places)', desc: 'Le format le plus demandé et le plus économique par personne : sorties, excursions, voyages scolaires.', lien: '/location-bus-50-places' },
  { titre: 'Bus grand tourisme (60-90 places)', desc: 'Grande capacité et double étage pour les grands événements : sièges inclinables, écrans, soutes XXL.', lien: '/location-autocar-grande-capacite' },
]

export const locationBusTypesNote =
  'Bus, car, autocar : quel que soit le mot, il s\'agit du même service, un véhicule de tourisme avec chauffeur professionnel, dimensionné pour votre groupe. Pour les longs trajets de nuit, pensez à l\'[autocar couchette](/autocar-couchette) ; pour un groupe avec des personnes à mobilité réduite, à l\'[autocar accessible PMR](/autocar-pmr).'

const locationBusTableau: TableauSeo = {
  caption: 'Prix TTC indicatifs 2026 selon le véhicule et le format du trajet',
  headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grand tourisme 60-90 places'],
  rows: [
    ['Transfert aller simple, moins de 50 km', '360 à 540 €', '400 à 600 €', '460 à 1 000 €'],
    ['Journée locale, aller-retour (moins de 50 km)', '620 à 750 €', '690 à 830 €', '800 à 1 400 €'],
    ['Journée régionale, aller-retour (100 à 200 km)', '1 000 à 1 250 €', '1 100 à 1 400 €', '1 250 à 2 400 €'],
    ['Week-end 2 jours, bus à disposition (moins de 200 km)', '2 000 à 2 250 €', '2 200 à 2 500 €', 'Sur devis'],
    ['Longue distance (plus de 300 km)', 'Sur devis', 'Sur devis', 'Sur devis'],
  ],
}

export const locationBusPrix = {
  h2: 'Combien coûte la location d\'un bus avec chauffeur ?',
  paragraphes: [
    'Le prix d\'un bus dépend de quatre choses : la distance, l\'amplitude horaire du chauffeur (du départ au retour au dépôt), la taille du véhicule et la saison. Chauffeur, carburant et péages sont inclus dans nos devis. Voici les ordres de grandeur constatés en 2026 pour un départ depuis une grande agglomération, hors haute saison.',
  ],
  tableau: locationBusTableau,
  apres: [
    'Sur un bus de 50 places plein, une journée locale revient à 14 à 17 € par personne : c\'est le transport de groupe le moins cher qui existe, hors transports en commun. Le détail par distance, les exemples chiffrés et les leviers pour payer moins cher sont dans notre guide du [prix de la location d\'un autocar](/blog/prix-location-autocar).',
  ],
}

export const locationBusOccasions: string[] = [
  'Mariages et événements familiaux : navettes invités entre la mairie, la cérémonie et le lieu de réception, retour de nuit compris, voir notre guide [autocar pour un mariage](/blog/location-autocar-mariage)',
  'Séminaires, salons et [déplacements d\'entreprise](/blog/autocar-deplacement-entreprise), y compris les [navettes d\'entreprise](/navette-entreprise) régulières',
  '[Sorties scolaires](/services/sorties-scolaires) et voyages de classe, avec des véhicules aux normes transport d\'enfants',
  'Transferts aéroport et gare pour groupes : [Roissy CDG](/navette-aeroport-cdg), [Orly](/navette-aeroport-orly), gares TGV',
  'Excursions d\'associations et de clubs seniors : [journée à la mer](/blog/journee-mer-autocar), [Puy du Fou](/blog/puy-du-fou-en-autocar), [Disneyland Paris](/autocar-disneyland-paris)',
  'Déplacements sportifs, supporters, [soirées étudiantes](/blog/bus-soiree-etudiante-bde) et [team building](/blog/bus-team-building)',
]

export const locationBusEtapes = {
  h2: 'Comment louer un bus avec Busmoov en 3 étapes',
  liste: [
    '1. Décrivez votre trajet dans le formulaire : départ, destination, date, horaires et nombre de passagers. Deux minutes suffisent, et la demande est gratuite.',
    '2. Sous 24h, vous recevez jusqu\'à 3 devis de transporteurs vérifiés, présentés de la même façon pour être comparés d\'un coup d\'œil : véhicule, prix TTC ferme, conditions.',
    '3. Vous validez le devis de votre choix en ligne, vous réglez l\'acompte, et vous recevez les coordonnées du chauffeur avant le départ. Pour un départ dans moins de 30 jours, le paiement se fait en une fois.',
  ],
}

export const locationBusFaq: LocationBusFaq[] = [
  {
    q: 'Combien coûte la location d\'un bus avec chauffeur ?',
    a: 'Une journée en bus standard (jusqu\'à 59 places) démarre à 690 € TTC pour un aller-retour local. Le prix dépend de la distance, de l\'amplitude horaire et de la taille du véhicule : un minibus coûte environ 10 % de moins, un bus grande capacité 15 à 70 % de plus. Demandez un devis gratuit : vous recevez plusieurs propositions sous 24h.',
  },
  {
    q: 'Quelle différence entre un bus et un autocar ?',
    a: 'Dans le langage courant, aucune : on dit « bus » pour tout. Techniquement, le bus est un véhicule urbain (passagers debout autorisés) et l\'autocar un véhicule de tourisme routier avec sièges, ceintures et soutes à bagages. Pour un voyage de groupe, c\'est toujours un autocar qui est loué, c\'est ce que nous proposons, quel que soit le mot que vous employez.',
  },
  {
    q: 'Peut-on louer un bus sans chauffeur ?',
    a: 'Non : la conduite d\'un véhicule de plus de 9 places exige le permis D et une carte de qualification professionnelle. Tous nos bus sont donc loués avec un chauffeur professionnel, dont le coût, le carburant et les péages sont inclus dans le devis. Notre article [louer un bus sans chauffeur](/blog/location-bus-sans-chauffeur) explique les alternatives pour les très petits groupes.',
  },
  {
    q: 'Quel bus pour combien de passagers ?',
    a: 'Minibus de 8 à 20 places pour les petits groupes ; bus standard de 21 à 59 places, le format le plus économique par personne ; bus grand tourisme ou double étage de 60 à 90 places pour les grands événements. Indiquez votre effectif exact (accompagnateurs compris) et nous dimensionnons le véhicule.',
  },
  {
    q: 'Combien de temps à l\'avance faut-il réserver un bus ?',
    a: 'Deux à quatre semaines suffisent pour un trajet classique hors saison. Pour un samedi de mai-juin, un week-end de vacances scolaires ou un grand événement, visez deux mois : les bus se réservent vite et les prix montent avec la rareté.',
  },
  {
    q: 'Un bus loué en France peut-il aller à l\'étranger ?',
    a: 'Oui, nos transporteurs font régulièrement l\'Espagne, l\'Italie, la Belgique ou la Suisse. Chaque pays a ses règles (zones à trafic limité en Italie, vignette en Suisse, zones basses émissions en Belgique) : nos pages [location d\'autocar en Espagne](/location-autocar-espagne), [en Italie](/location-autocar-italie) et [en Belgique](/location-autocar-belgique) les détaillent.',
  },
]

export const locationBusVillesH2 = 'Louez votre bus au départ de votre ville'
