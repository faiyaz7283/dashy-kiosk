import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App'
import { queryClient } from './shared/query'

/**
 * Application entry point.
 *
 * Renders the root App component into the #root DOM element
 * using React 19's createRoot API with StrictMode enabled.
 * Wrapped with QueryClientProvider for global data caching.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
