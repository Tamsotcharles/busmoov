/**
 * Google Analytics 4 (gtag chargé dans index.html, ID G-LCWSGTQL2H).
 * Le tracking ne doit jamais casser le parcours : tout est best-effort.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  try {
    window.gtag?.('event', name, params)
  } catch {
    // bloqueur de pub, script non chargé… on ignore
  }
}
