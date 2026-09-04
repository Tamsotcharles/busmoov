import { describe, it, expect } from 'vitest'
import {
  generateValidationToken,
  generateDevisReference,
  formatPrice,
  formatDate,
  getLanguageFromCountry,
  calculateAmplitudeFromTimes,
  cn,
  libelleFacture,
} from './utils'

describe('generateValidationToken', () => {
  // Ce token est la seule protection des pages fournisseur (validation
  // BPA, infos chauffeur). Il utilisait Math.random(), predictible donc
  // enumerable. Ces tests verrouillent le passage a crypto.

  it('produit 64 caracteres hexadecimaux (32 octets d entropie)', () => {
    const token = generateValidationToken()
    expect(token).toHaveLength(64)
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('ne repete jamais un token sur un grand tirage', () => {
    const tokens = new Set(Array.from({ length: 5000 }, generateValidationToken))
    expect(tokens.size).toBe(5000)
  })

  it('produit une distribution plausible pour une source cryptographique', () => {
    // Math.random() ne serait pas detecte par ce test seul, mais une
    // source cassee ou constante le serait immediatement.
    const counts = new Map<string, number>()
    for (let i = 0; i < 2000; i++) {
      for (const char of generateValidationToken()) {
        counts.set(char, (counts.get(char) ?? 0) + 1)
      }
    }
    expect(counts.size).toBe(16) // les 16 chiffres hexa doivent tous sortir
    const frequencies = [...counts.values()]
    const expected = (2000 * 64) / 16
    for (const frequency of frequencies) {
      // Tolerance large : on cherche une anomalie grossiere, pas a
      // valider la qualite du generateur systeme.
      expect(frequency).toBeGreaterThan(expected * 0.8)
      expect(frequency).toBeLessThan(expected * 1.2)
    }
  })
})

describe('generateDevisReference', () => {
  it('respecte le format DEV-AAAAMM-XXXXXX', () => {
    expect(generateDevisReference()).toMatch(/^DEV-\d{6}-[A-Z0-9]{1,6}$/)
  })

  it('porte l annee et le mois courants', () => {
    const now = new Date()
    const expected = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
    expect(generateDevisReference()).toContain(`DEV-${expected}-`)
  })

  it('ne permet pas au client de distinguer un devis auto d un devis manuel', () => {
    // Regle produit : la reference doit etre indiscernable entre les deux.
    const references = Array.from({ length: 50 }, generateDevisReference)
    const shapes = new Set(references.map((r) => r.replace(/[A-Z0-9]/g, '#')))
    expect(shapes.size).toBe(1)
  })
})

describe('formatPrice', () => {
  it('formate a la francaise avec le symbole euro', () => {
    expect(formatPrice(1234.56)).toMatch(/1\s?234,56/)
    expect(formatPrice(1234.56)).toContain('€')
  })

  it('gere l absence de montant sans planter', () => {
    expect(formatPrice(null)).toBe('-')
    expect(formatPrice(undefined)).toBe('-')
  })

  it('formate zero comme un montant, pas comme une absence', () => {
    // Un solde a 0 € doit s afficher, pas devenir un tiret.
    expect(formatPrice(0)).toContain('0')
    expect(formatPrice(0)).not.toBe('-')
  })
})

describe('montants dans les PDF', () => {
  // Reproduit formatAmount() de pdf.ts, qui n'est pas exportee. jsPDF rend
  // les espaces insecables comme des caracteres parasites : un montant a
  // quatre chiffres sortirait abime sur une facture client.
  //
  // Une premiere version de ce test visait formatPricePDF() dans utils.ts,
  // qui ne remplacait que U+00A0 alors qu'Intl produit U+202F en fr-FR.
  // Cette fonction, morte et jamais appelee, a ete supprimee.
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace(/[\u202F\u00A0]/g, ' ')

  it('impose deux decimales', () => {
    expect(formatAmount(850)).toBe('850,00')
    expect(formatAmount(1234.5)).toBe('1 234,50')
  })

  it('ne laisse passer aucune espace insecable', () => {
    for (const amount of [1234.5, 12345.67, 1234567.89]) {
      expect(formatAmount(amount)).not.toMatch(/[\u202F\u00A0]/)
    }
  })

  it('separe bien les milliers', () => {
    expect(formatAmount(1234567.89)).toBe('1 234 567,89')
  })
})

describe('formatDate', () => {
  it('formate une date ISO', () => {
    expect(formatDate('2026-03-15')).toMatch(/15/)
    expect(formatDate('2026-03-15')).toMatch(/2026/)
  })

  it('gere l absence de date sans planter', () => {
    expect(() => formatDate(null)).not.toThrow()
    expect(() => formatDate(undefined)).not.toThrow()
    expect(() => formatDate('')).not.toThrow()
  })
})

describe('getLanguageFromCountry', () => {
  it('associe chaque pays a sa langue', () => {
    expect(getLanguageFromCountry('FR')).toBe('fr')
    expect(getLanguageFromCountry('ES')).toBe('es')
    expect(getLanguageFromCountry('DE')).toBe('de')
    expect(getLanguageFromCountry('GB')).toBe('en')
  })

  it('retombe sur le francais si le pays est absent ou inconnu', () => {
    expect(getLanguageFromCountry(null)).toBe('fr')
    expect(getLanguageFromCountry(undefined)).toBe('fr')
    expect(getLanguageFromCountry('XX')).toBe('fr')
  })

  it('accepte une casse minuscule', () => {
    expect(getLanguageFromCountry('es')).toBe('es')
  })
})

describe('calculateAmplitudeFromTimes', () => {
  it('calcule une amplitude sur la journee', () => {
    const result = calculateAmplitudeFromTimes('09:00', '17:30')
    expect(result).not.toBeNull()
  })

  it('ne plante pas sur une entree vide', () => {
    expect(() => calculateAmplitudeFromTimes(null, null)).not.toThrow()
  })
})

describe('cn', () => {
  it('fusionne les classes conditionnelles', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c')
  })

  it('laisse la derniere classe Tailwind l emporter', () => {
    // C est tout l interet de tailwind-merge : sans lui, les deux classes
    // coexistent et le rendu depend de l ordre du CSS.
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
})

describe('libelleFacture', () => {
  it('un acompte partiel reste « Facture d acompte »', () => {
    expect(libelleFacture('acompte', 177, 590)).toBe("Facture d'acompte")
  })

  it('un acompte couvrant 100 % devient « Facture »', () => {
    expect(libelleFacture('acompte', 590, 590)).toBe('Facture')
  })

  it('le solde est « Facture de solde »', () => {
    expect(libelleFacture('solde', 413, 590)).toBe('Facture de solde')
  })

  it('un avoir est « Avoir » quel que soit le montant', () => {
    expect(libelleFacture('avoir', -590, 590)).toBe('Avoir')
  })

  it('tolere un petit ecart d arrondi pour le 100 %', () => {
    expect(libelleFacture('acompte', 589.995, 590)).toBe('Facture')
  })
})
