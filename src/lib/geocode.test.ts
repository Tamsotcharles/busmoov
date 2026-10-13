import { describe, it, expect } from 'vitest'
import { pickBestGeocodeFeature, geocodeTokens } from './geocode'

const f = (result_type: string, country_code: string, formatted: string) => ({
  properties: { result_type, country_code, formatted, name: formatted.split(',')[0] },
})

describe('geocodeTokens', () => {
  it('normalise accents, casse et ponctuation, ignore les mots d\'une lettre', () => {
    expect(geocodeTokens("Val d'Isère, 73150")).toEqual(['val', 'isere', '73150'])
    expect(geocodeTokens('Aéroport Lyon Saint-Exupéry')).toEqual(['aeroport', 'lyon', 'saint', 'exupery'])
  })
})

describe('pickBestGeocodeFeature', () => {
  it('écarte le département quand une ville précise existe', () => {
    const r = pickBestGeocodeFeature([
      f('state', 'fr', 'Isère, France'),
      f('city', 'fr', "73150 Val-d'Isère, France"),
      f('city', 'td', 'Isere, Ouara, Tchad'),
    ], 'fr', 'Val d isère')
    expect(r?.properties.formatted).toBe("73150 Val-d'Isère, France")
  })

  it('garde le département si rien de plus précis', () => {
    const r = pickBestGeocodeFeature([f('state', 'fr', 'Isère, France')], 'fr', 'Isère')
    expect(r?.properties.formatted).toBe('Isère, France')
  })

  it('préfère le résultat qui reprend le plus de mots de la saisie (aéroport vs village homonyme)', () => {
    const r = pickBestGeocodeFeature([
      f('city', 'fr', 'Saint-Exupéry, NAQ, France'),
      f('amenity', 'fr', 'Aéroport Lyon Saint-Exupéry - Gare TGV, Parvis de la Gare, 69124 Colombier-Saugnieu, France'),
      f('amenity', 'fr', "Taxi Aéroport Lyon, Rue d'Espagne, 69124 Colombier-Saugnieu, France"),
    ], 'fr', 'Aéroport Lyon Saint-Exupéry, France')
    expect(r?.properties.formatted).toContain('Aéroport Lyon Saint-Exupéry - Gare TGV')
  })

  it('respecte un pays explicite dans la saisie (Bruges Belgique, pas Bruges France)', () => {
    const r = pickBestGeocodeFeature([
      f('city', 'fr', 'Bruges-Capbis-Mifaget, NAQ, France'),
      f('city', 'be', 'Bruges, Flandre-Occidentale, Belgique'),
    ], 'fr', 'Bruges, Flandre, Belgique')
    expect(r?.properties.country_code).toBe('be')
  })

  it('à égalité, préfère le pays demandé puis l\'ordre Geoapify', () => {
    const r = pickBestGeocodeFeature([
      f('city', 'us', 'Paris, TX, United States'),
      f('city', 'fr', 'Paris, IDF, France'),
    ], 'fr', 'Paris')
    expect(r?.properties.country_code).toBe('fr')
    const r2 = pickBestGeocodeFeature([f('building', 'fr', 'D 517, France'), f('building', 'fr', 'D 302, France')], 'fr', 'route')
    expect(r2?.properties.formatted).toBe('D 517, France')
  })

  it('sans saisie, se comporte comme avant (premier lieu précis du pays)', () => {
    const r = pickBestGeocodeFeature([f('city', 'td', 'Isere, Tchad'), f('city', 'fr', 'Isère-ville, France')], 'fr')
    expect(r?.properties.country_code).toBe('fr')
  })

  it('renvoie null sans résultat', () => {
    expect(pickBestGeocodeFeature([], 'fr', 'x')).toBeNull()
  })
})
