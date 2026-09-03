import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
// Initialiser i18n avant l'app
import './lib/i18n'
import App from './App.tsx'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { installGlobalErrorHandlers } from '@/lib/report-error'

// Capte les promesses rejetees et les erreurs hors rendu, que les
// ErrorBoundary de React ne voient pas.
installGlobalErrorHandlers()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Filet le plus externe : couvre aussi une panne des providers. */}
    <ErrorBoundary scope="root">
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
