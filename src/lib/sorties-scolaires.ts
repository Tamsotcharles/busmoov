/**
 * Contenu SEO français de la page /fr/services/sorties-scolaires,
 * affiché uniquement en français (les autres langues gardent le
 * contenu traduit). Prix : grille de départ « à partir de » (règle du
 * 12/10/2026). Règles et taux d'encadrement sourcés : arrêté du 2 juillet
 * 1982 (Légifrance), code de la route, guide Éduscol de décembre 2025.
 * Les liens s'écrivent [ancre](/chemin) ou [ancre](https://…).
 */
import type { TableauSeo } from './blog'

export interface SectionScolaire {
  h2: string
  intro: string
  /** Petits paragraphes après l'intro */
  paragraphes?: string[]
  liste?: string[]
  tableau?: TableauSeo
  apres?: string
}

export const sortiesScolairesFr: {
  prix: SectionScolaire
  reglementation: SectionScolaire
  encadrement: SectionScolaire
  faq: { q: string; a: string }[]
} = {
  prix: {
    h2: "Prix de location d'un car scolaire",
    intro: "Les prix de départ d'un car scolaire avec chauffeur, selon le format de la sortie. Le prix exact dépend du département de départ, de la date et de l'amplitude de la journée : votre devis gratuit le précise sous 24h.",
    tableau: {
      caption: "Prix de départ 2026 d'un car scolaire avec chauffeur, TTC, carburant et péages inclus",
      headers: ['Sortie', 'Minibus 8 à 20 places', 'Autocar 21 à 59 places', 'Par élève (car de 50)'],
      rows: [
        ['Transfert simple (gare, musée, gymnase)', 'à partir de 350 €', 'à partir de 400 €', 'environ 8 €'],
        ['Sortie à la journée, moins de 100 km', 'à partir de 600 €', 'à partir de 700 €', 'environ 14 €'],
        ['Sortie à la journée, 100 à 200 km', 'à partir de 900 €', 'à partir de 1 000 €', 'environ 20 €'],
        ['Voyage sur 2 jours', 'à partir de 1 600 €', 'à partir de 1 800 €', 'environ 36 €'],
        ["Longue distance ou voyage à l'étranger", 'Sur devis', 'Sur devis', 'sur devis'],
      ],
    },
    apres: "Prix de départ TTC (TVA transport 10 %), octobre 2026. Pour une classe de découverte, le car peut aussi faire deux trajets distincts : l'aller, puis le retour quelques jours plus tard.",
  },
  reglementation: {
    h2: 'Car scolaire : ce que dit la réglementation',
    intro: "Un car qui transporte un groupe d'élèves relève du « transport en commun d'enfants », c'est-à-dire un transport organisé à titre principal pour des moins de 18 ans. L'[arrêté du 2 juillet 1982](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000470037) et le code de la route fixent des règles précises :",
    liste: [
      'Les enfants voyagent assis (article 75), et chacun porte sa ceinture dès lors que son siège en est équipé (article R412-1 du code de la route).',
      "Un autocar mis en circulation depuis le 1er janvier 2010 et affecté à un transport d'enfants est équipé d'un éthylotest antidémarrage (article 75 bis).",
      "Le véhicule porte le pictogramme « transport d'enfants » à l'avant et à l'arrière (article 76).",
      'À chaque montée et descente des enfants, le chauffeur allume les feux de détresse (article 77).',
      "Chaque été, un arrêté interdit le transport en commun d'enfants pendant une journée de grands départs (le samedi 1er août en 2026), sauf à l'intérieur du département de prise en charge et des départements limitrophes.",
    ],
    apres: "Ces obligations reposent sur le transporteur, mais l'enseignant reste responsable du groupe : vérifier le pictogramme et le port de la ceinture au départ fait partie du rôle des encadrants.",
  },
  encadrement: {
    h2: "Taux d'encadrement dans le car : maternelle et élémentaire",
    intro: "Les taux d'encadrement des sorties scolaires s'appliquent aussi pendant le trajet. Tous les élèves transportés comptent comme une seule classe, et le chauffeur n'est jamais compté parmi les encadrants, selon le [guide Éduscol des sorties et voyages scolaires](https://eduscol.education.gouv.fr/sites/default/files/document/guide-sorties-et-voyages-scolaires-premier-degre-101622.pdf) (décembre 2025, circulaire du 16 juillet 2024).",
    paragraphes: [
      "En maternelle, quel que soit le type de sortie : 2 adultes dont l'enseignant jusqu'à 16 élèves, puis 1 adulte de plus pour 8 élèves.",
      "En élémentaire, pour une sortie sans nuitée : 2 adultes dont au moins un enseignant jusqu'à 30 élèves, puis 1 adulte de plus pour 15 élèves. Pour un voyage avec nuitée, le seuil descend à 24 élèves, puis 1 adulte de plus pour 12.",
    ],
    apres: "Deux points à régler avec le transporteur avant le départ. Si le car n'est pas conçu uniquement pour le transport d'enfants, le nombre total de passagers ne doit pas dépasser le nombre de places assises adultes, hors strapontins, indiqué sur son attestation d'aménagement. Et le schéma de conduite du trajet aller et retour, signé et tamponné par le transporteur, est à joindre au dossier d'autorisation de la sortie.",
  },
  faq: [
    {
      q: 'Comment organiser une sortie scolaire en autocar ?',
      a: "Fixez d'abord le projet pédagogique, la date et le nombre d'élèves et d'accompagnateurs. Demandez ensuite des devis avec les horaires et les adresses exactes. Le transporteur retenu fournit le schéma de conduite à joindre au dossier d'autorisation de sortie.",
    },
    {
      q: 'Comment faire une demande de location de car scolaire ?',
      a: "Remplissez le formulaire : établissement, nombre d'élèves et d'adultes, destination, dates et horaires. Vous recevez jusqu'à 3 devis de transporteurs sous 24h, avec un devis détaillé utilisable pour la validation de votre hiérarchie.",
    },
    {
      q: "Combien d'élèves dans un car de 50 places ?",
      a: "Les accompagnateurs occupent aussi des places : un car de 50 places accueille par exemple deux classes de 22 élèves avec leurs 6 encadrants. Comptez toujours élèves et adultes ensemble, le chauffeur à part.",
    },
  ],
}
