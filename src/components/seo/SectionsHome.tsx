import { useTranslation } from 'react-i18next'
import { TextWithLinks } from '@/components/ui/TextWithLinks'
import { homeSeo } from '@/lib/home-seo'
import type { SeoLanguage } from '@/lib/seo-data'
import { CheckCircle } from 'lucide-react'

/**
 * Blocs SEO de la home (véhicules, clientèles, transferts, prix, Busmoov),
 * contenu propre à chaque langue ; même contenu que la version statique de
 * scripts/prerender.mjs.
 */
export function SectionsHome() {
  const { i18n } = useTranslation()
  const lang = i18n.language.slice(0, 2) as SeoLanguage
  const sections = homeSeo[lang]
  if (!sections) return null

  return (
    <>
      {sections.map((s, i) => (
        <section key={s.h2} className={`py-16 px-4 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-purple-dark mb-6 text-center">{s.h2}</h2>
            {s.paragraphes.map((p, j) => (
              <div key={p}>
                <TextWithLinks text={p} className="text-gray-700 leading-relaxed mb-4" />
                {j === 0 && s.liste && (
                  <ul className="space-y-3 mb-6">
                    {s.liste.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-magenta flex-none mt-0.5" />
                        <TextWithLinks as="span" text={item} className="text-gray-700" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
