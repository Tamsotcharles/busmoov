import { describe, it, expect } from 'vitest'
import {
  extraireDepartement,
  estDepartementProblematique,
  aDoubleEtageDispo,
  determinerAmplitudeGrille,
  calculerAmplitudeHeures,
  getMajorationRegionSync,
  optimizeVehicleCombination,
  calculateOptimalCars,
  formatEuros,
  formatDuree,
  VEHICLE_TYPES,
} from './pricing-rules'

/**
 * Ces fonctions decident du prix facture au client. Elles n'avaient
 * aucun test : une regression y passait inapercue jusqu'au devis.
 */

describe('extraireDepartement', () => {
  it('extrait le departement d un code postal a 5 chiffres', () => {
    expect(extraireDepartement('Paris (75001)')).toBe('75')
    expect(extraireDepartement('Lyon (69003)')).toBe('69')
    expect(extraireDepartement('Brest (29200)')).toBe('29')
  })

  it('distingue la Corse du Sud (2A) de la Haute-Corse (2B)', () => {
    // Piege classique : les deux departements partagent le prefixe 20.
    // 201xx -> Corse du Sud, 202xx -> Haute-Corse.
    expect(extraireDepartement('Ajaccio (20100)')).toBe('2A')
    expect(extraireDepartement('Bastia (20200)')).toBe('2B')
  })

  it('accepte un code postal court entre parentheses', () => {
    expect(extraireDepartement('Quelque part (75)')).toBe('75')
  })

  it('renvoie null quand aucun code postal n est present', () => {
    expect(extraireDepartement('Paris')).toBeNull()
    expect(extraireDepartement('')).toBeNull()
    expect(extraireDepartement(null)).toBeNull()
    expect(extraireDepartement(undefined)).toBeNull()
  })
})

describe('determinerAmplitudeGrille', () => {
  it('classe dans la bonne tranche de grille', () => {
    expect(determinerAmplitudeGrille(6)).toBe('8h')
    expect(determinerAmplitudeGrille(9)).toBe('10h')
    expect(determinerAmplitudeGrille(11)).toBe('12h')
    expect(determinerAmplitudeGrille(13)).toBe('9h_coupure')
  })

  it('inclut la borne haute dans la tranche inferieure', () => {
    // Une amplitude de 8h00 pile doit rester en grille 8h, pas basculer
    // en 10h : c'est un ecart de prix direct.
    expect(determinerAmplitudeGrille(8)).toBe('8h')
    expect(determinerAmplitudeGrille(10)).toBe('10h')
    expect(determinerAmplitudeGrille(12)).toBe('12h')
    expect(determinerAmplitudeGrille(8.01)).toBe('10h')
  })
})

describe('calculerAmplitudeHeures', () => {
  it('calcule une amplitude sur la meme journee', () => {
    // Exemple documente dans CLAUDE.md : depart 09:00, retour depot 17:30.
    expect(calculerAmplitudeHeures('09:00', '17:30')).toBe(8.5)
    expect(calculerAmplitudeHeures('08:00', '18:00')).toBe(10)
  })

  it('gere le passage de minuit', () => {
    // Retour a 01:00 apres un depart a 22:00 = 3h, pas -21h.
    expect(calculerAmplitudeHeures('22:00', '01:00')).toBe(3)
    expect(calculerAmplitudeHeures('23:30', '00:30')).toBe(1)
  })

  it('renvoie null sur une entree inexploitable', () => {
    expect(calculerAmplitudeHeures(null, '17:00')).toBeNull()
    expect(calculerAmplitudeHeures('09:00', null)).toBeNull()
    expect(calculerAmplitudeHeures('pas une heure', '17:00')).toBeNull()
  })
})

describe('majorations regionales', () => {
  it('n applique aucune majoration en Ile-de-France et grandes metropoles', () => {
    for (const dept of ['75', '69', '13', '33', '44', '59']) {
      expect(getMajorationRegionSync(dept).majoration_percent).toBe(0)
    }
  })

  it('applique une majoration sur les departements bretons', () => {
    // CLAUDE.md documente 15 % sur 22, 29, 49 et 56.
    for (const dept of ['22', '29', '56']) {
      expect(getMajorationRegionSync(dept).majoration_percent).toBeGreaterThan(0)
    }
  })

  it('ne majore pas quand le departement est inconnu', () => {
    // Un departement absent ne doit jamais renvoyer NaN ni undefined :
    // la majoration entre directement dans le calcul du prix.
    const r = getMajorationRegionSync(null)
    expect(r.majoration_percent).toBe(0)
    expect(Number.isFinite(r.majoration_percent)).toBe(true)
  })

  it('est coherent avec estDepartementProblematique', () => {
    for (const dept of ['22', '29', '56', '75', '69']) {
      const problematique = estDepartementProblematique(dept)
      expect(typeof problematique).toBe('boolean')
    }
    expect(estDepartementProblematique(null)).toBe(false)
    expect(aDoubleEtageDispo(null)).toBe(false)
  })
})

describe('VEHICLE_TYPES', () => {
  it('conserve les coefficients documentes', () => {
    const coefs = Object.fromEntries(VEHICLE_TYPES.map((v) => [v.type, v.coef]))
    expect(coefs['standard']).toBe(1.0)
    expect(coefs['60-63']).toBe(1.15)
    expect(coefs['70']).toBe(1.3)
    expect(coefs['83-90']).toBe(1.7)
  })

  it('classe les types par capacite decroissante', () => {
    const capacities = VEHICLE_TYPES.map((v) => v.capacity)
    expect([...capacities].sort((a, b) => b - a)).toEqual([...capacities])
  })

  it('associe une capacite plus grande a un coefficient plus eleve', () => {
    for (let i = 1; i < VEHICLE_TYPES.length; i++) {
      expect(VEHICLE_TYPES[i - 1].coef).toBeGreaterThan(VEHICLE_TYPES[i].coef)
    }
  })
})

describe('optimizeVehicleCombination', () => {
  it('offre toujours assez de places pour le groupe', () => {
    // Sous-dimensionner, c'est laisser des passagers a quai le jour J.
    for (const passengers of [10, 45, 57, 58, 90, 120, 200, 350]) {
      const result = optimizeVehicleCombination(passengers)
      expect(result.placesTotal).toBeGreaterThanOrEqual(passengers)
    }
  })

  it('tient dans un seul vehicule quand la capacite suffit', () => {
    expect(optimizeVehicleCombination(50).nombreCars).toBe(1)
    expect(optimizeVehicleCombination(57).nombreCars).toBe(1)
  })

  it('renvoie un cout relatif exploitable', () => {
    // coutRelatif multiplie le tarif de grille : un NaN produirait un
    // devis a NaN euros.
    const result = optimizeVehicleCombination(120)
    expect(Number.isFinite(result.coutRelatif)).toBe(true)
    expect(result.coutRelatif).toBeGreaterThan(0)
  })

  it('se limite aux vehicules standard quand la grande capacite est indisponible', () => {
    // Cas des departements sans double etage : proposer un 90 places
    // qu'aucun transporteur local ne possede fausse le devis.
    const result = optimizeVehicleCombination(150, false)
    expect(result.capaciteParCar).toBe(57)
    expect(result.placesTotal).toBeGreaterThanOrEqual(150)
  })
})

describe('calculateOptimalCars', () => {
  it('renvoie au moins un vehicule meme pour un tout petit groupe', () => {
    expect(calculateOptimalCars(1)).toBeGreaterThanOrEqual(1)
  })

  it('augmente le nombre de vehicules avec le nombre de passagers', () => {
    expect(calculateOptimalCars(200)).toBeGreaterThan(calculateOptimalCars(50))
  })

  it('tient compte de la capacite du type demande', () => {
    expect(calculateOptimalCars(60, 'standard')).toBe(2) // 57 places
    expect(calculateOptimalCars(60, '60-63')).toBe(1) // 63 places
    expect(calculateOptimalCars(20, 'minibus')).toBe(1)
    expect(calculateOptimalCars(21, 'minibus')).toBe(2)
  })

  it('retombe sur du standard si la grande capacite est indisponible', () => {
    expect(calculateOptimalCars(60, '83-90', false)).toBe(2)
  })
})

describe('formatage', () => {
  it('formate les montants a la francaise', () => {
    // CLAUDE.md impose la virgule decimale, l'espace pour les milliers
    // et systematiquement deux decimales.
    const formatted = formatEuros(1234.5)
    expect(formatted).toContain(',')
    expect(formatted).toContain('€')
    expect(formatted).toMatch(/1\s?234,50/)
  })

  it('garde deux decimales sur un montant rond', () => {
    expect(formatEuros(850)).toMatch(/850,00/)
  })

  it('formate les durees en heures et minutes', () => {
    expect(formatDuree(2)).toBe('2h')
    expect(formatDuree(2.5)).toBe('2h30')
    expect(formatDuree(0.75)).toBe('45min')
  })

  it('complete les minutes sur deux chiffres', () => {
    // 2h5 serait ambigu a la lecture d'une feuille de route.
    expect(formatDuree(2 + 5 / 60)).toBe('2h05')
  })
})
