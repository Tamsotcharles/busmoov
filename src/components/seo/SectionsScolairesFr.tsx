import { useTranslation } from 'react-i18next'
import { TextWithLinks } from '@/components/ui/TextWithLinks'
import { TableauSeo } from '@/components/ui/TableauSeo'
import { sortiesScolairesFr, type SectionScolaire } from '@/lib/sorties-scolaires'
import { CheckCircle } from 'lucide-react'

/**
 * Blocs SEO français de la page sorties scolaires (prix, réglementation,
 * encadrement, FAQ). Rendu uniquement en français, comme MaillageFr ; même
 * contenu que la version statique de scripts/prerender.mjs.
 */
export function SectionsScolairesFr({ partie }: { partie: 'prix' | 'regles' | 'faq' }) {
  const { i18n } = useTranslation()
  if (!i18n.language.startsWith('fr')) return null
  const c = sortiesScolairesFr

  if (partie === 'faq') {
    return (
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-purple-dark mb-8 text-center">Vos questions sur la location de car scolaire</h2>
          <div className="space-y-4">
            {c.faq.map((f) => (
              <div key={f.q} className="card">
                <h3 className="font-semibold mb-2">{f.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const sections = partie === 'prix' ? [c.prix] : [c.reglementation, c.encadrement]
  return (
    <>
      {sections.map((s, i) => (
        <Bloc key={s.h2} s={s} fond={partie === 'regles' && i === 1} />
      ))}
    </>
  )
}

function Bloc({ s, fond }: { s: SectionScolaire; fond: boolean }) {
  return (
    <section className={`py-16 px-4 ${fond ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-purple-dark mb-6 text-center">{s.h2}</h2>
        <TextWithLinks text={s.intro} className="text-gray-700 leading-relaxed mb-6 max-w-3xl mx-auto" />
        {s.paragraphes?.map((p) => (
          <TextWithLinks key={p} text={p} className="text-gray-700 leading-relaxed mb-4 max-w-3xl mx-auto" />
        ))}
        {s.liste && (
          <ul className="space-y-3 max-w-3xl mx-auto mb-6">
            {s.liste.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-magenta flex-none mt-0.5" />
                <TextWithLinks as="span" text={item} className="text-gray-700" />
              </li>
            ))}
          </ul>
        )}
        {s.tableau && <TableauSeo {...s.tableau} />}
        {s.apres && <TextWithLinks text={s.apres} className="text-gray-700 leading-relaxed mt-6 max-w-3xl mx-auto" />}
      </div>
    </section>
  )
}
