import { Link } from 'react-router-dom'
import { useLocalizedPath } from '@/components/i18n'

/**
 * Rend un texte contenant des liens en syntaxe markdown [ancre](/chemin).
 * Les chemins sont internes (sans préfixe de langue) et passent par
 * useLocalizedPath. Utilisé pour le maillage interne contextuel des
 * pages villes et des articles de blog.
 */
export function TextWithLinks({ text, className }: { text: string; className?: string }) {
  const localizedPath = useLocalizedPath()
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g)

  return (
    <p className={className}>
      {parts.map((part, i) => {
        const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (m) {
          return (
            <Link key={i} to={localizedPath(m[2])} className="text-magenta hover:underline">
              {m[1]}
            </Link>
          )
        }
        return part
      })}
    </p>
  )
}
