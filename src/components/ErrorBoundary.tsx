import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reportError } from '@/lib/report-error'

interface Props {
  children: ReactNode
  /** Identifie la zone qui a plante dans les logs (ex. "route", "admin"). */
  scope?: string
}

interface State {
  error: Error | null
  /** L'erreur vient d'un chunk lazy introuvable (deploiement pendant la visite). */
  isStaleChunk: boolean
}

/**
 * Un chunk charge paresseusement disparait a chaque deploiement : son nom
 * contient un hash de contenu. Un onglet reste ouvert pendant une mise en
 * ligne demande donc un fichier qui n'existe plus et reçoit un 404 ou du
 * HTML a la place du JS. Sans traitement, l'utilisateur voit une page
 * blanche alors qu'un simple rechargement suffit.
 *
 * Les messages varient selon le navigateur, d'ou la detection par motifs.
 */
function isChunkLoadError(error: Error): boolean {
  const text = `${error.name} ${error.message}`
  return (
    /ChunkLoadError/i.test(text) ||
    /Loading chunk [\w-]+ failed/i.test(text) ||
    /Failed to fetch dynamically imported module/i.test(text) ||
    /error loading dynamically imported module/i.test(text) ||
    /Importing a module script failed/i.test(text)
  )
}

/**
 * Empeche qu'une exception dans un composant vide toute la page.
 * Sans ce filet, la moindre erreur de rendu donnait un ecran blanc sans
 * aucune trace, cote client comme cote admin.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, isStaleChunk: false }

  static getDerivedStateFromError(error: Error): State {
    return { error, isStaleChunk: isChunkLoadError(error) }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Un chunk perime n'est pas un bug : on recharge une seule fois.
    // Le drapeau de session evite une boucle de rechargement si le
    // fichier manque vraiment (deploiement casse, cache CDN incoherent).
    if (isChunkLoadError(error)) {
      let alreadyTried = true
      try {
        alreadyTried = sessionStorage.getItem('busmoov:chunk-reloaded') === '1'
        if (!alreadyTried) sessionStorage.setItem('busmoov:chunk-reloaded', '1')
      } catch {
        // Navigation privee ou stockage bloque : on ne recharge pas,
        // l'utilisateur gardera le bouton manuel.
      }
      if (!alreadyTried) {
        window.location.reload()
        return
      }
    }

    reportError(error, {
      scope: this.props.scope ?? 'app',
      componentStack: errorInfo.componentStack ?? undefined,
    })
  }

  private handleReload = () => {
    try {
      sessionStorage.removeItem('busmoov:chunk-reloaded')
    } catch {
      // sans importance : le rechargement a lieu de toute façon
    }
    window.location.reload()
  }

  render() {
    const { error, isStaleChunk } = this.state
    if (!error) return this.props.children

    // Volontairement sans useTranslation : i18next peut lui-meme etre la
    // cause du plantage. Ce texte doit s'afficher quoi qu'il arrive.
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="card max-w-md w-full text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {isStaleChunk ? 'Une nouvelle version est disponible' : 'Une erreur est survenue'}
          </h1>
          <p className="text-gray-600 mb-6">
            {isStaleChunk
              ? "Le site a été mis à jour pendant votre visite. Rechargez la page pour continuer."
              : "Nous n'avons pas pu afficher cette page. Vous pouvez réessayer, ou nous contacter si le problème persiste."}
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={this.handleReload} className="btn btn-primary">
              Recharger la page
            </button>
            {!isStaleChunk && (
              <a href="/" className="btn btn-secondary">
                Retour à l'accueil
              </a>
            )}
          </div>
          {!isStaleChunk && (
            <p className="text-xs text-gray-400 mt-6">
              Si vous nous contactez, indiquez&nbsp;:{' '}
              <code className="font-mono">{error.name}</code>
            </p>
          )}
        </div>
      </div>
    )
  }
}
