/**
 * Point de collecte unique des erreurs runtime.
 *
 * Aujourd'hui les erreurs partent seulement dans la console : quand un
 * client signale « ça ne marche pas », il ne reste aucune trace cote
 * Busmoov. Ce module centralise la remontee pour qu'un branchement futur
 * (Sentry ou equivalent) se fasse ici, sans toucher aux appelants.
 *
 * Brancher un service : appeler setErrorReporter() au demarrage, par
 * exemple dans main.tsx.
 */

export interface ErrorContext {
  /** Zone concernee : "route", "admin", "unhandled-rejection"... */
  scope?: string
  componentStack?: string
  [key: string]: unknown
}

type Reporter = (error: Error, context: ErrorContext) => void

let externalReporter: Reporter | null = null

/** Branche un service de monitoring. Sans appel, seule la console reçoit. */
export function setErrorReporter(reporter: Reporter | null) {
  externalReporter = reporter
}

export function reportError(error: Error, context: ErrorContext = {}) {
  const enriched: ErrorContext = {
    ...context,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    timestamp: new Date().toISOString(),
  }

  console.error(`[busmoov:${context.scope ?? 'app'}]`, error, enriched)

  if (externalReporter) {
    try {
      externalReporter(error, enriched)
    } catch (reporterError) {
      // Un monitoring casse ne doit jamais aggraver l'incident qu'il observe.
      console.error('[busmoov] echec du reporter d erreur', reporterError)
    }
  }
}

/**
 * Capte ce qui echappe aux ErrorBoundary de React : promesses rejetees
 * sans catch et erreurs hors cycle de rendu (callbacks, listeners).
 * C'est la majorite des erreurs reelles d'une application asynchrone.
 */
export function installGlobalErrorHandlers() {
  if (typeof window === 'undefined') return

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    const error = reason instanceof Error ? reason : new Error(String(reason))
    reportError(error, { scope: 'unhandled-rejection' })
  })

  window.addEventListener('error', (event) => {
    // Les erreurs de chargement de ressource (img, script) remontent ici
    // sans objet Error : elles ne sont pas exploitables, on les ignore.
    if (!event.error) return
    reportError(event.error, { scope: 'window-error' })
  })
}
