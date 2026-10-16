import { describe, it, expect } from 'vitest'
import { articles, articlesSimilaires } from './blog'

describe('articlesSimilaires (bloc « À lire aussi »)', () => {
  it('renvoie 3 articles, jamais l\'article lui-même', () => {
    for (const article of articles) {
      const similaires = articlesSimilaires(article)
      expect(similaires).toHaveLength(3)
      expect(similaires.map((a) => a.slug)).not.toContain(article.slug)
    }
  })

  it('rapproche les articles qui partagent un sujet rare', () => {
    const couchette = articles.find((a) => a.slug === 'autocar-avec-couchettes')!
    expect(articlesSimilaires(couchette).map((a) => a.slug)).toContain('autocar-long-trajet')
  })
})
