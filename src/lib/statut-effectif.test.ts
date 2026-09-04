import { describe, it, expect } from 'vitest'
import { getStatutEffectif } from './utils'

const base = {
  status: 'pending-client',
  contractSignedAt: '2026-09-03T10:00:00Z',
  montantPaye: 0,
  acompteRequis: 590,
  hasBpaConfirme: false,
  hasInfosClient: false,
  infosValidees: false,
  chauffeurRecu: false,
}

describe('getStatutEffectif', () => {
  it('cas DOS-001051BA48 : signe, non paye -> en attente de paiement', () => {
    // Bug constate : le badge affichait « Att. retour client » alors que
    // le dossier etait signe et attendait le paiement.
    expect(getStatutEffectif(base)).toBe('pending-payment')
  })

  it('conserve le statut amont tant que le contrat n est pas signe', () => {
    expect(getStatutEffectif({ ...base, contractSignedAt: null })).toBe('pending-client')
    expect(getStatutEffectif({ ...base, contractSignedAt: null, status: 'new' })).toBe('new')
    expect(getStatutEffectif({ ...base, contractSignedAt: null, status: 'quotes_sent' })).toBe('quotes_sent')
  })

  it('paye mais sans BPA -> en attente resa', () => {
    expect(getStatutEffectif({ ...base, montantPaye: 590 })).toBe('pending-reservation')
  })

  it('paye + BPA, sans infos client -> en attente infos', () => {
    expect(getStatutEffectif({ ...base, montantPaye: 590, hasBpaConfirme: true })).toBe('pending-info')
  })

  it('infos recues non validees (BPA present) -> infos a valider', () => {
    expect(getStatutEffectif({
      ...base, montantPaye: 590, hasBpaConfirme: true, hasInfosClient: true,
    })).toBe('pending-info-received')
  })

  it('infos validees, chauffeur non recu -> attente chauffeur', () => {
    expect(getStatutEffectif({
      ...base, montantPaye: 590, hasBpaConfirme: true, hasInfosClient: true, infosValidees: true,
    })).toBe('pending-driver')
  })

  it('respecte les etats terminaux', () => {
    expect(getStatutEffectif({ ...base, status: 'completed' })).toBe('completed')
    expect(getStatutEffectif({ ...base, status: 'cancelled' })).toBe('cancelled')
  })

  it('paiement partiel insuffisant reste en attente de paiement', () => {
    expect(getStatutEffectif({ ...base, montantPaye: 200, acompteRequis: 590 })).toBe('pending-payment')
  })
})
