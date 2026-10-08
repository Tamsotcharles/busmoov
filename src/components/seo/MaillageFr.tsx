import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLocalizedPath } from '@/components/i18n'
import { TextWithLinks } from '@/components/ui/TextWithLinks'
import { villes } from '@/lib/villes'
import type { MaillageBloc } from '@/lib/maillage'

/**
 * Bloc de maillage interne (guides, landings, villes) pour les pages
 * services multilingues. Rendu uniquement en français : les pages liées
 * n'existent qu'en français. Même structure que la version statique dans
 * scripts/prerender.mjs (fonction `maillageFr`).
 */
export function MaillageFr({ bloc }: { bloc: MaillageBloc }) {
  const { i18n } = useTranslation()
  const localizedPath = useLocalizedPath()
  if (!i18n.language.startsWith('fr')) return null

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-purple-dark mb-6 text-center">{bloc.h2}</h2>
        <div className="space-y-4">
          {bloc.paragraphes.map((p, i) => (
            <TextWithLinks key={i} text={p} className="text-gray-700 leading-relaxed" />
          ))}
        </div>
        <h2 className="font-display text-2xl font-bold text-purple-dark mt-10 mb-4 text-center">{bloc.villesH2}</h2>
        <p className="text-sm text-gray-500 text-center leading-relaxed">
          {villes.map((v, i) => (
            <span key={v.slug}>
              <Link to={localizedPath(`/location-autocar/${v.slug}`)} className="text-magenta hover:underline">{v.nom}</Link>
              {i < villes.length - 1 ? ' · ' : ''}
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}
