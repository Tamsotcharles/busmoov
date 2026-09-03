import { describe, it, expect } from 'vitest'

/**
 * Reproduit la logique de description de trajet de generateContratPDF
 * (pdf.ts n'exporte pas ces helpers). Verrouille le bug constate : une
 * proforma d'aller-retour meme jour (service_type 'round-trip' cote
 * dossier, non reconnu) s'affichait « Transport aller simple autocar ».
 */
function describeTrajet(serviceType: string | null, hasReturnDate: boolean, hasReturnTime: boolean) {
  const isMiseADispo =
    serviceType === 'circuit' || serviceType === 'mise_disposition' || serviceType === 'ar_mad'
  const isAllerRetour =
    !isMiseADispo &&
    (['aller_retour', 'round-trip', 'ar_1j', 'ar_sans_mad'].includes(serviceType || '') ||
      hasReturnDate ||
      hasReturnTime)
  if (isMiseADispo) return 'MAD'
  if (isAllerRetour) return 'ALLER_RETOUR'
  return 'ALLER_SIMPLE'
}

describe('description de trajet (proforma / contrat)', () => {
  it('reconnait l aller-retour quel que soit le vocabulaire', () => {
    // Les deux vocabulaires : devis (ar_1j, ar_sans_mad) et dossier (round-trip).
    expect(describeTrajet('round-trip', true, true)).toBe('ALLER_RETOUR')
    expect(describeTrajet('ar_1j', false, false)).toBe('ALLER_RETOUR')
    expect(describeTrajet('ar_sans_mad', false, false)).toBe('ALLER_RETOUR')
    expect(describeTrajet('aller_retour', false, false)).toBe('ALLER_RETOUR')
  })

  it('cas exact du bug : round-trip avec date de retour -> aller-retour', () => {
    // DOS-001051BA48 : service_type null -> dossier.trip_mode 'round-trip',
    // return 18/09 16:30. Affichait « aller simple » avant correction.
    expect(describeTrajet('round-trip', true, true)).toBe('ALLER_RETOUR')
  })

  it('deduit l aller-retour de la date de retour meme sans libelle exploitable', () => {
    expect(describeTrajet(null, true, false)).toBe('ALLER_RETOUR')
    expect(describeTrajet('', false, true)).toBe('ALLER_RETOUR')
  })

  it('reste aller simple sans date de retour ni libelle A/R', () => {
    expect(describeTrajet('aller_simple', false, false)).toBe('ALLER_SIMPLE')
    expect(describeTrajet('one-way', false, false)).toBe('ALLER_SIMPLE')
    expect(describeTrajet(null, false, false)).toBe('ALLER_SIMPLE')
  })

  it('la mise a disposition prime sur la date de retour', () => {
    // Une MAD a une date de fin, mais ne doit pas devenir « aller-retour ».
    expect(describeTrajet('ar_mad', true, true)).toBe('MAD')
    expect(describeTrajet('circuit', true, false)).toBe('MAD')
    expect(describeTrajet('mise_disposition', true, true)).toBe('MAD')
  })
})
