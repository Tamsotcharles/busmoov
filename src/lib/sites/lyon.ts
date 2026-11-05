/**
 * Contenu du microsite busmoovlyon.fr (une page). Fichier pur : lu par la
 * page React ET par scripts/prerender.mjs. Texte propre à Lyon, distinct de
 * la page ville /fr/location-autocar/lyon du site principal.
 * Prix uniquement en « à partir de » arrondis.
 */
import type { TableauSeo } from '../blog'

export const lyonSite = {
  domaine: 'busmoovlyon.fr',
  url: 'https://www.busmoovlyon.fr/',
  titre: 'Location d\'autocar avec chauffeur à Lyon : devis en 24h | Busmoov Lyon',
  description: 'Autocar, bus et minibus avec chauffeur à Lyon et dans le Rhône : transferts Saint-Exupéry et Part-Dieu, stations de ski, séminaires, sorties scolaires. Transporteurs lyonnais vérifiés, jusqu\'à 3 devis gratuits sous 24h.',
  h1: 'Location d\'autocar avec chauffeur à Lyon',
  sousTitre: 'Transporteurs lyonnais vérifiés, prix ferme chauffeur et péages inclus, jusqu\'à 3 devis comparés sous 24h.',
  telephone: '01 76 31 12 83',
  telephoneHref: '+33176311283',
  intro: [
    'Busmoov Lyon est le service de réservation d\'autocar avec chauffeur consacré à la métropole lyonnaise et au Rhône. Une seule demande, et vous recevez sous 24h jusqu\'à trois propositions de transporteurs implantés à Lyon, Villeurbanne, Vénissieux ou Saint-Priest, comparables d\'un coup d\'œil : véhicule, prix TTC ferme, conditions.',
    'Pourquoi un service dédié ? Parce qu\'un transfert à Saint-Exupéry un vendredi soir, une montée en station en février ou une dépose sur la presqu\'île un jour de Fête des Lumières ne se préparent pas depuis Paris. Nos transporteurs partenaires connaissent les accès de Part-Dieu, les parkings d\'Eurexpo, les règles de la zone à faibles émissions et les horaires auxquels le périphérique se bloque.',
  ],
  prestations: {
    h2: 'Ce que nous organisons au départ de Lyon',
    items: [
      { titre: 'Transferts aéroport et gare', desc: 'Lyon Saint-Exupéry, Part-Dieu, Perrache : prise en charge d\'un groupe à l\'arrivée du vol ou du TGV, dépose à l\'hôtel, au siège ou au lieu de séminaire. Le chauffeur suit l\'horaire réel du vol.' },
      { titre: 'Stations de ski', desc: 'Les 2 Alpes, l\'Alpe d\'Huez, Val d\'Isère, Tignes, Les Arcs, Courchevel, Chamrousse : transferts et séjours de clubs, d\'écoles et de comités d\'entreprise, cars équipés pour la montagne, soutes à skis.' },
      { titre: 'Séminaires et événements d\'entreprise', desc: 'Navettes entre hôtels, Eurexpo, la Cité internationale, le Groupama Stadium ou la LDLC Arena ; sorties dans le Beaujolais et les Monts du Lyonnais ; journées à Annecy ou Pérouges.' },
      { titre: 'Sorties scolaires et périscolaires', desc: 'Écoles, collèges et lycées de la métropole : musée des Confluences, Vulcania, parc des Oiseaux, journées à la neige, voyages de fin d\'année. Véhicules aux normes transport d\'enfants.' },
      { titre: 'Supporters et sorties de clubs', desc: 'Déplacements vers le Groupama Stadium, le Matmut Stadium de Gerland et les stades adverses, tournois de jeunes, sorties de clubs seniors et d\'associations.' },
      { titre: 'Mariages et fêtes privées', desc: 'Navettes d\'invités entre la mairie, le domaine et les hôtels, retour de nuit compris, dans le Beaujolais, les Dombes ou les Monts d\'Or.' },
    ],
  },
  prix: {
    h2: 'Prix de départ d\'un autocar avec chauffeur à Lyon',
    intro: 'Le prix dépend de la distance, de l\'amplitude horaire du chauffeur, de la taille du véhicule et de la saison. Chauffeur, carburant et péages sont inclus. Ordres de grandeur 2026 au départ de la métropole, hors haute saison.',
    tableau: {
      caption: 'Prix de départ indicatifs 2026 au départ de Lyon, TTC, chauffeur, carburant et péages inclus',
      headers: ['Prestation', 'Minibus 8-20 places', 'Bus standard 21-59 places', 'Grande capacité 60-90 places'],
      rows: [
        ['Transfert Saint-Exupéry ou Part-Dieu, aller simple', 'à partir de 350 €', 'à partir de 400 €', 'à partir de 500 €'],
        ['Journée dans la métropole ou le Beaujolais', 'à partir de 600 €', 'à partir de 700 €', 'à partir de 800 €'],
        ['Journée Annecy, Genève, Grenoble ou station de ski', 'à partir de 900 €', 'à partir de 1 000 €', 'à partir de 1 200 €'],
        ['Week-end 2 jours', 'à partir de 1 600 €', 'à partir de 1 800 €', 'Sur devis'],
      ],
    } as TableauSeo,
    apres: 'Sur un bus de 50 places plein, une journée dans la région revient à une quinzaine d\'euros par personne. Les vacances de Noël et de février font monter les prix vers la montagne et raréfient les véhicules : pour un transfert ski en février, demandez vos devis avant la mi-décembre.',
  },
  zones: {
    h2: 'Zones desservies',
    intro: 'Toute la métropole de Lyon et le département du Rhône, ainsi que les départs depuis l\'Ain, l\'Isère et la Loire voisines :',
    villes: ['Lyon, tous arrondissements', 'Villeurbanne', 'Vénissieux', 'Vaulx-en-Velin', 'Saint-Priest', 'Bron', 'Caluire-et-Cuire', 'Écully', 'Oullins', 'Meyzieu', 'Décines-Charpieu', 'Rillieux-la-Pape', 'Givors', 'Villefranche-sur-Saône', 'Vienne', 'Bourgoin-Jallieu', 'Saint-Étienne et sa région'],
  },
  etapes: {
    h2: 'Comment ça marche',
    liste: [
      'Décrivez votre trajet dans le formulaire : départ, destination, date, horaires, nombre de passagers. Deux minutes, sans engagement.',
      'Sous 24h, vous recevez jusqu\'à trois devis de transporteurs lyonnais vérifiés, présentés de la même façon pour être comparés.',
      'Vous validez en ligne le devis de votre choix, vous réglez l\'acompte par carte ou virement, et vous recevez les coordonnées du chauffeur avant le départ.',
    ],
  },
  faq: [
    { q: 'Vos transporteurs sont-ils basés à Lyon ?', a: 'Oui. Pour un départ de la métropole, nous ne sollicitons que des transporteurs du Rhône et des départements limitrophes, ce qui évite les frais d\'approche d\'un car venant de loin et garantit un chauffeur qui connaît la ville.' },
    { q: 'Un autocar peut-il entrer dans la presqu\'île et le Vieux Lyon ?', a: 'Les cars déposent sur les quais et aux abords, pas dans les rues piétonnes. Le jour de la Fête des Lumières, la presqu\'île est fermée aux véhicules : dépose aux parkings relais et fin de trajet en métro. Le chauffeur connaît les dispositifs.' },
    { q: 'La zone à faibles émissions de Lyon s\'applique-t-elle aux autocars ?', a: 'Oui, la ZFE de la métropole impose une vignette Crit\'Air récente aux véhicules lourds. Nos transporteurs partenaires y roulent tous les jours avec des véhicules conformes ; vous n\'avez rien à gérer.' },
    { q: 'Combien coûte un transfert entre Saint-Exupéry et le centre de Lyon pour un groupe ?', a: 'Un aller simple démarre à 350 € TTC en minibus et à 400 € TTC en autocar standard, chauffeur et péages inclus, selon l\'horaire et le point de dépose. Donnez le numéro de vol : le chauffeur attend en zone autocars et suit un retard éventuel.' },
    { q: 'Faut-il deux chauffeurs pour aller en station de ski ?', a: 'Pas depuis Lyon pour une journée ou un transfert : Val d\'Isère, Les Arcs ou l\'Alpe d\'Huez sont à moins de trois heures. Un second chauffeur ne s\'impose que si la journée dépasse 12 heures d\'amplitude, par exemple un aller-retour dans la journée avec attente sur place très longue.' },
    { q: 'Quel délai pour réserver ?', a: 'Deux à trois semaines suffisent hors saison. Pour un samedi de mai ou juin, les vacances de février ou le week-end de la Fête des Lumières, visez six à huit semaines : les cars lyonnais partent vite.' },
  ],
}

export type LyonSite = typeof lyonSite
