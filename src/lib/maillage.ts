/**
 * Blocs de maillage interne français affichés en bas des pages services
 * multilingues (location-autocar, location-minibus). Fichier pur : lu par
 * le composant MaillageFr ET par scripts/prerender.mjs. Les paragraphes
 * acceptent les liens markdown [ancre](/chemin). Rendu uniquement en
 * français (les pages liées n'existent qu'en français).
 */

export interface MaillageBloc {
  h2: string
  paragraphes: string[]
  villesH2: string
}

export type MaillageServiceKey = 'location-autocar' | 'location-minibus' | 'transfert-aeroport' | 'sorties-scolaires'

export const maillageServices: Record<MaillageServiceKey, MaillageBloc> = {
  'transfert-aeroport': {
    h2: 'Aller plus loin : nos pages par aéroport et nos guides',
    paragraphes: [
      'Les deux aéroports parisiens ont leur page dédiée, avec les terminaux, le timing et les prix : [navette aéroport Roissy CDG](/navette-aeroport-cdg) et [navette aéroport Orly](/navette-aeroport-orly). Avant de réserver, notre guide [organiser un transfert aéroport pour un groupe](/blog/transfert-aeroport-groupe-mode-emploi) détaille les quatre étapes, les erreurs classiques et la checklist à envoyer au transporteur.',
      'Selon la taille du groupe : [minibus 20 places](/location-minibus-20-places) jusqu\'à 18 voyageurs avec bagages, [bus 50 places](/location-bus-50-places) au-delà, [autocar grande capacité](/location-autocar-grande-capacite) pour les très grands groupes. Les fourchettes de prix par distance sont dans le guide du [prix de la location d\'un autocar](/blog/prix-location-autocar), et le [devis en ligne](/devis-autocar) vous apporte jusqu\'à 3 propositions sous 24h.',
    ],
    villesH2: 'Transfert aéroport au départ de votre ville',
  },
  'sorties-scolaires': {
    h2: 'Aller plus loin : organiser la sortie, destinations et budget',
    paragraphes: [
      'Notre guide [organiser une sortie scolaire en autocar](/blog/organiser-sortie-scolaire-autocar) reprend les étapes, les documents et les règles de sécurité. Côté destinations, les plus demandées ont leur page : [autocar pour Disneyland Paris](/autocar-disneyland-paris), [Puy du Fou en autocar](/blog/puy-du-fou-en-autocar), [journée à la mer](/blog/journee-mer-autocar), et pour les voyages à l\'étranger, nos pages [Espagne](/location-autocar-espagne), [Italie](/location-autocar-italie) et [Royaume-Uni](/location-autocar-royaume-uni).',
      'Pour le budget : une classe avec ses accompagnateurs tient dans un [bus 50 places](/location-bus-50-places), deux classes dans un [autocar grande capacité](/location-autocar-grande-capacite). Les fourchettes par distance sont dans le guide du [prix de la location d\'un autocar](/blog/prix-location-autocar), et un [devis en ligne](/devis-autocar) vous donne jusqu\'à 3 propositions sous 24h, adaptées aux budgets d\'établissement.',
    ],
    villesH2: 'Sorties scolaires au départ de votre ville',
  },
  'location-autocar': {
    h2: 'Aller plus loin : nos pages et guides sur la location d\'autocar',
    paragraphes: [
      'Pour cadrer votre budget, commencez par notre guide du [prix de la location d\'un autocar](/blog/prix-location-autocar), avec les tarifs 2026 par distance et taille de véhicule, puis demandez votre [devis autocar en ligne](/devis-autocar) : jusqu\'à 3 propositions sous 24h. Le format le plus courant a sa page dédiée, la [location de bus 50 places](/location-bus-50-places), et notre page [location de bus](/location-bus) compare toutes les capacités.',
      'Selon votre projet : [navette aéroport CDG](/navette-aeroport-cdg) ou [Orly](/navette-aeroport-orly), [navette d\'entreprise](/navette-entreprise), [autocar pour Disneyland Paris](/autocar-disneyland-paris), [autocar accessible PMR](/autocar-pmr), [autocar couchette](/autocar-couchette) pour les longs trajets de nuit. Pour un déplacement hors de France, nos pages [Espagne](/location-autocar-espagne), [Italie](/location-autocar-italie), [Belgique](/location-autocar-belgique) et [Suisse](/location-autocar-suisse) détaillent les règles locales.',
    ],
    villesH2: 'Location d\'autocar au départ de votre ville',
  },
  'location-minibus': {
    h2: 'Aller plus loin : minibus, tarifs et devis',
    paragraphes: [
      'Un minibus coûte environ 10 % de moins qu\'un autocar standard sur le même trajet : les fourchettes détaillées par distance sont dans notre guide du [prix de la location d\'un autocar](/blog/prix-location-autocar). Pour un chiffrage précis, demandez votre [devis en ligne](/devis-autocar) : jusqu\'à 3 propositions de transporteurs vérifiés sous 24h.',
      'Le minibus est le véhicule type des [transferts aéroport](/services/transfert-aeroport), vers [Roissy CDG](/navette-aeroport-cdg) comme vers [Orly](/navette-aeroport-orly), et des [navettes d\'entreprise](/navette-entreprise). Pour un groupe de 15 à 20 personnes, notre page [minibus 20 places](/location-minibus-20-places) détaille les tarifs ; au-delà, passez à la [location de bus](/location-bus) : le [bus 50 places](/location-bus-50-places) devient vite plus économique par personne.',
    ],
    villesH2: 'Location de minibus au départ de votre ville',
  },
}
