import { describe, it, expect } from 'vitest'
import { etatFournisseur, labelEtatFournisseur } from './utils'

describe('etatFournisseur', () => {
  it('aucune demande -> attente de validation', () => {
    expect(etatFournisseur([])).toBe('attente_validate')
  })

  it('demandes sans validation ni BPA -> attente de validation', () => {
    expect(etatFournisseur([{ status: 'sent' }, { status: 'tarif_recu' }, { status: 'devis_created' }]))
      .toBe('attente_validate')
  })

  it('fournisseur valide (BPA envoye) mais pas confirme -> attente de BPA', () => {
    expect(etatFournisseur([{ status: 'validated' }])).toBe('attente_bpa')
    expect(etatFournisseur([{ status: 'sent' }, { status: 'validated' }])).toBe('attente_bpa')
  })

  it('BPA confirme -> confirme (prime sur validated)', () => {
    expect(etatFournisseur([{ status: 'bpa_received' }])).toBe('confirme')
    expect(etatFournisseur([{ bpa_received_at: '2026-09-03T10:00:00Z' }])).toBe('confirme')
    expect(etatFournisseur([{ status: 'validated' }, { status: 'bpa_received' }])).toBe('confirme')
  })

  it('libelles d attente', () => {
    expect(labelEtatFournisseur('attente_validate')).toBe('En attente de validation')
    expect(labelEtatFournisseur('attente_bpa')).toBe('En attente de BPA')
    expect(labelEtatFournisseur('confirme')).toBe('')
  })
})
