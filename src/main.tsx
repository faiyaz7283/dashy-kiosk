import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'
import App from './App'
import { queryClient } from './shared/query'

/**
 * Application entry point.
 *
 * Renders the root App component into the #root DOM element
 * using React 19's createRoot API with StrictMode enabled.
 * Wrapped with QueryClientProvider for global data caching.
 *
 * React Query Devtools are conditionally rendered in development only.
 * Vite's dead code elimination tree-shakes them from production builds.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </StrictMode>,
)
