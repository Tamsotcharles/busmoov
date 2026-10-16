import { Link } from 'react-router-dom'
import { useLocalizedPath } from '@/components/i18n'

/**
 * Rend un texte contenant des liens en syntaxe markdown [ancre](/chemin).
 * Les chemins internes (sans préfixe de langue) passent par
 * useLocalizedPath ; une URL http(s) est un lien externe (source d'un
 * chiffre, par exemple), ouvert dans un nouvel onglet. Utilisé pour le
 * maillage interne contextuel des pages villes et des articles de blog.
 */
export function TextWithLinks({ text, className, as: Tag = 'p' }: { text: string; className?: string; as?: 'p' | 'span' }) {
  const localizedPath = useLocalizedPath()
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g)

  return (
    <Tag className={className}>
      {parts.map((part, i) => {
        const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (m && /^https?:\/\//.test(m[2])) {
          return (
            <a key={i} href={m[2]} target="_blank" rel="noopener" className="text-magenta hover:underline">
              {m[1]}
            </a>
          )
        }
        if (m) {
          return (
            <Link key={i} to={localizedPath(m[2])} className="text-magenta hover:underline">
              {m[1]}
            </Link>
          )
        }
        return part
      })}
    </Tag>
  )
}
