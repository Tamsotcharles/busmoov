import { useParams, Navigate, Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SeoFr } from '@/components/seo/Seo'
import { useLocalizedPath } from '@/components/i18n'
import { getArticle, articles, type BlogBlock } from '@/lib/blog'
import { getSiteBaseUrl } from '@/lib/utils'
import { ArrowRight, ArrowLeft, Calendar, Info } from 'lucide-react'

function formatDateFr(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function Block({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case 'h2':
      return <h2 className="text-2xl font-bold mt-10 mb-4">{block.text}</h2>
    case 'p':
      return <p className="text-gray-700 leading-relaxed mb-4">{block.text}</p>
    case 'ul':
      return (
        <ul className="list-disc pl-6 space-y-2 mb-4 text-gray-700">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )
    case 'callout':
      return (
        <div className="bg-purple-50 border-l-4 border-magenta rounded-r-lg p-4 my-6 flex gap-3">
          <Info className="w-5 h-5 text-magenta flex-none mt-0.5" />
          <p className="text-gray-700 text-sm leading-relaxed">{block.text}</p>
        </div>
      )
  }
}

/** Article de blog (français uniquement). */
export function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const localizedPath = useLocalizedPath()
  const article = slug ? getArticle(slug) : undefined

  if (!article) {
    return <Navigate to="/" replace />
  }

  const path = `/blog/${article.slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.titre,
    description: article.metaDescription,
    datePublished: article.datePublication,
    inLanguage: 'fr',
    url: `${getSiteBaseUrl()}/fr${path}`,
    author: { '@type': 'Organization', name: 'Busmoov', url: getSiteBaseUrl() },
    publisher: { '@type': 'Organization', name: 'Busmoov', url: getSiteBaseUrl() },
  }

  const autresArticles = articles.filter((a) => a.slug !== article.slug)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showAdminLink={false} />
      <SeoFr title={article.metaTitle} description={article.metaDescription} path={path} jsonLd={jsonLd} />

      <main className="pt-24 pb-16">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to={localizedPath('/blog')} className="text-sm text-magenta hover:underline inline-flex items-center gap-1 mb-6">
            <ArrowLeft className="w-4 h-4" /> Tous les articles
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{article.titre}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <Calendar className="w-4 h-4" />
            Publié le {formatDateFr(article.datePublication)} par l'équipe Busmoov
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 sm:p-10">
            {article.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}

            <div className="mt-10 pt-8 border-t border-gray-100 text-center">
              <h2 className="text-xl font-bold mb-3">Besoin d'un autocar avec chauffeur ?</h2>
              <p className="text-gray-600 text-sm mb-5">
                Recevez plusieurs devis gratuits de transporteurs vérifiés sous 24 h.
              </p>
              <Link to={localizedPath('/')} className="btn btn-primary inline-flex items-center gap-2">
                Demander un devis gratuit <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {autresArticles.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold mb-4">À lire aussi</h2>
              <div className="space-y-3">
                {autresArticles.map((a) => (
                  <Link key={a.slug} to={localizedPath(`/blog/${a.slug}`)} className="card block hover:shadow-md transition-shadow">
                    <span className="font-medium">{a.titre}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <Footer />
    </div>
  )
}
