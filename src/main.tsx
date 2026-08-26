import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
import './index.css'
import App from './App'
import { queryClient } from './shared/query'

/**
 * Global error handler for unhandled promise rejections.
 *
 * Catches any promise rejections that aren't handled by component-level
 * error handling. Logs to console.error for debugging.
 */
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})

/**
 * Application entry point.
 *
 * Renders the root App component into the #root DOM element
 * using React 19's createRoot API with StrictMode enabled.
 * Wrapped with ErrorBoundary to catch render errors and QueryClientProvider
 * for global data caching.
 *
 * React Query Devtools are conditionally rendered in development only.
 * Vite's dead code elimination tree-shakes them from production builds.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
