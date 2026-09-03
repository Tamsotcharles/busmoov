import { describe, it, expect, vi, beforeEach } from 'vitest'

// Le module supabase ouvre une connexion reseau a l'import : on le
// remplace avant de charger utils.
const rpc = vi.fn()
vi.mock('./supabase', () => ({
  supabase: { rpc },
}))

const { generateFactureReference } = await import('./utils')

describe('generateFactureReference', () => {
  beforeEach(() => rpc.mockReset())

  it('demande le numero a la base, sans jamais le calculer localement', async () => {
    // Le point essentiel : la numerotation doit venir d'une sequence
    // Postgres atomique. Deux admins facturant simultanement obtiendraient
    // sinon le meme numero.
    rpc.mockResolvedValue({ data: '1000-09-2026', error: null })

    await expect(generateFactureReference()).resolves.toBe('1000-09-2026')
    expect(rpc).toHaveBeenCalledExactlyOnceWith('next_facture_reference')
  })

  it('refuse d emettre plutot que d inventer un numero en cas d erreur', async () => {
    // Une facture mal numerotee est un probleme comptable et legal :
    // mieux vaut echouer visiblement.
    rpc.mockResolvedValue({ data: null, error: { message: 'permission denied' } })
    await expect(generateFactureReference()).rejects.toThrow(/permission denied/)
  })

  it('refuse aussi une reponse vide', async () => {
    rpc.mockResolvedValue({ data: null, error: null })
    await expect(generateFactureReference()).rejects.toThrow(/numéro de facture/)
  })
})

describe('format NUMERO-MOIS-ANNEE', () => {
  // Reproduit le rendu de next_facture_reference() cote SQL, pour figer
  // le contrat de format attendu par la comptabilite.
  const render = (numero: number, mois: number, annee: number) =>
    `${numero}-${String(mois).padStart(2, '0')}-${annee}`

  const PATTERN = /^\d+-\d{2}-\d{4}$/

  it('rend le format attendu', () => {
    expect(render(1000, 9, 2026)).toBe('1000-09-2026')
    expect(render(1000, 9, 2026)).toMatch(PATTERN)
  })

  it('complete le mois sur deux chiffres', () => {
    // "1000-9-2026" casserait le tri et la lecture comptable.
    expect(render(1000, 1, 2026)).toBe('1000-01-2026')
    expect(render(1042, 12, 2026)).toBe('1042-12-2026')
  })

  it('laisse le numero croitre sans padding', () => {
    // La sequence est continue et ne doit jamais etre tronquee.
    expect(render(9999, 3, 2027)).toMatch(PATTERN)
    expect(render(123456, 3, 2027)).toMatch(PATTERN)
  })

  it('ne reconnait pas l ancien format aleatoire', () => {
    // L'index unique et la migration s'appuient sur ce motif pour
    // distinguer les anciennes references des nouvelles.
    expect('FA-2601-042').not.toMatch(PATTERN)
    expect('FS-2601-999').not.toMatch(PATTERN)
    expect('AV-DOS-ABC123-01').not.toMatch(PATTERN)
  })
})
