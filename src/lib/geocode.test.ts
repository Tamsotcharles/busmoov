import { describe, it, expect } from 'vitest'
import { pickBestGeocodeFeature } from './geocode'

const f = (result_type: string, country_code: string, name: string) => ({ properties: { result_type, country_code, name } })

describe('pickBestGeocodeFeature', () => {
  it('écarte le département quand une ville précise existe dans le pays', () => {
    const r = pickBestGeocodeFeature([
      f('state', 'fr', 'Isère'),
      f('city', 'fr', "Val-d'Isère"),
      f('city', 'td', 'Isere'),
    ], 'fr')
    expect(r?.properties.name).toBe("Val-d'Isère")
  })

  it('garde le département si rien de plus précis dans le pays', () => {
    const r = pickBestGeocodeFeature([f('state', 'fr', 'Isère'), f('city', 'td', 'Isere')], 'fr')
    expect(r?.properties.name).toBe('Isère')
  })

  it('conserve l\'ordre Geoapify entre lieux précis', () => {
    const r = pickBestGeocodeFeature([f('building', 'fr', 'D 517'), f('building', 'fr', 'D 302')], 'fr')
    expect(r?.properties.name).toBe('D 517')
  })

  it('ne restreint pas au pays : Bruges Belgique reste possible', () => {
    const r = pickBestGeocodeFeature([f('city', 'be', 'Bruges')], 'fr')
    expect(r?.properties.name).toBe('Bruges')
  })

  it('renvoie null sans résultat', () => {
    expect(pickBestGeocodeFeature([], 'fr')).toBeNull()
  })
})
