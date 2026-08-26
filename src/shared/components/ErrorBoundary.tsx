/**
 * Error boundary — catches React rendering errors and shows fallback UI.
 *
 * Prevents full-app crashes from render errors (null access, type mismatches).
 * Logs errors to console.error for debugging. Provides a retry button that
 * resets the error state and re-renders children.
 *
 * Place at the top level (wrapping <App />) in main.tsx. Can also wrap
 * individual feature sections for graceful degradation.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

/** Props for the ErrorBoundary component. */
export interface ErrorBoundaryProps {
  /** Content to render when no error is active. */
  children: ReactNode
  /** Optional custom fallback UI. Defaults to the standard error card. */
  fallback?: ReactNode
}

/** Internal error state. */
interface ErrorBoundaryState {
  /** Whether an error has been caught. */
  hasError: boolean
  /** The caught error (for logging). */
  error: Error | null
}

/**
 * React error boundary with fallback UI and retry.
 *
 * Catches rendering errors in the child tree, logs them,
 * and displays a user-friendly error message with a retry button.
 *
 * @param props - Children to wrap and optional custom fallback.
 * @returns Error boundary wrapper.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Render error:', error, info.componentStack)
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex h-full w-full items-center justify-center bg-bg">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertTriangle className="h-8 w-8 text-warning" />
            <p className="text-sm font-medium text-text-primary">
              Something went wrong
            </p>
            <p className="max-w-xs text-xs text-text-muted">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={this.handleReset}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-bg-hover"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
