import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SeoFr } from '@/components/seo/Seo'
import { useLocalizedPath } from '@/components/i18n'
import { articles } from '@/lib/blog'
import { ArrowRight, Calendar } from 'lucide-react'

function formatDateFr(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Liste des articles de blog (français uniquement). */
export function BlogPage() {
  const localizedPath = useLocalizedPath()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showAdminLink={false} />
      <SeoFr
        title="Blog Busmoov — Conseils location d'autocar et transport de groupe"
        description="Prix, réglementation, organisation : les guides pratiques Busmoov pour réussir vos déplacements de groupe en autocar avec chauffeur."
        path="/blog"
      />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-3">Le blog Busmoov</h1>
          <p className="text-gray-600 text-center mb-12">
            Guides pratiques et conseils pour organiser vos transports de groupe en autocar.
          </p>

          <div className="space-y-6">
            {articles.map((a) => (
              <Link
                key={a.slug}
                to={localizedPath(`/blog/${a.slug}`)}
                className="card block hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <Calendar className="w-4 h-4" />
                  {formatDateFr(a.datePublication)}
                </div>
                <h2 className="text-xl font-semibold mb-2">{a.titre}</h2>
                <p className="text-gray-600 text-sm mb-3">{a.extrait}</p>
                <span className="text-magenta text-sm font-medium inline-flex items-center gap-1">
                  Lire l'article <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
