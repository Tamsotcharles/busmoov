import { describe, it, expect } from 'vitest'
import { checkRequiresManualReview } from './manual-review'

const base = { departure: 'Pantin, IDF, France', arrival: 'Charleroi, Belgique', trip_mode: 'round-trip' }

describe('checkRequiresManualReview', () => {
  it('ignore le libellé « Étapes: » ajouté par le formulaire', () => {
    expect(checkRequiresManualReview({ ...base, special_requests: 'Étapes: Pause toilette \nÉquipements: Climatisation, Micro' })).toBeNull()
    expect(checkRequiresManualReview({ ...base, special_requests: "Étapes: Nous n'avons pas de demandes particulières" })).toBeNull()
  })

  it('détecte toujours les vraies prestations complexes', () => {
    expect(checkRequiresManualReview({ ...base, special_requests: 'Étapes: navette entre hôtel et salon toutes les heures' })).toContain('navette')
    expect(checkRequiresManualReview({ ...base, special_requests: 'Étapes: 2 étapes, Lille puis Bruxelles' })).toContain('etapes')
    expect(checkRequiresManualReview({ ...base, special_requests: 'Plusieurs arrêts prévus' })).toContain('plusieurs arrets')
    expect(checkRequiresManualReview({ ...base, notes: '=== DÉTAIL MISE À DISPOSITION ===\n3 jours sur place' })).toContain('mise a disposition')
  })

  it('compare en mots entiers : Madrid et madame ne sont pas « mad »', () => {
    expect(checkRequiresManualReview({ ...base, arrival: 'Madrid, Espagne', special_requests: 'Étapes: hôtel pour madame Durand' })).toBeNull()
    expect(checkRequiresManualReview({ ...base, special_requests: 'MAD sur 2 jours' })).toContain('mad')
  })

  it('garde les autres règles', () => {
    expect(checkRequiresManualReview({ departure: 'Lyon, ARA, France', arrival: 'Lyon (Part-Dieu), France' })).toContain('Même ville')
    expect(checkRequiresManualReview({ ...base, trip_mode: 'circuit' })).toContain('circuit')
  })
})
