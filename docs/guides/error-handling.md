# Error Handling Guide — Dashy Kiosk v2

This guide contains detailed error handling rules and patterns. For quick reference, see [AGENTS.md](../../AGENTS.md) section 12.

## Structured Errors — ApiError (NON-NEGOTIABLE)

**All API errors must be `ApiError` instances.** Never throw plain `Error` objects from fetch code. Never reduce errors to `string | null` at the API boundary.

**Why:** Plain strings carry no status code, no backend detail, and no retryability signal. `ApiError` preserves all three so consumers can make smart decisions (retry, show specific message, redirect on 401).

### The ApiError class

Located at `src/shared/errors/ApiError.ts`:

```typescript
export class ApiError extends Error {
  public readonly status: number        // HTTP status (0 for network errors)
  public readonly detail: string | undefined  // Backend error detail
  public readonly isRetryable: boolean  // true for 5xx, 429, 0 (network)
}
```

### The parseApiError function

Located at `src/shared/errors/parseApiError.ts`. Always use this instead of manually constructing errors:

```typescript
// APPROVED: Centralized error parsing
const response = await fetch(url)
if (!response.ok) {
  throw await parseApiError(response)
}
```

**Forbidden patterns:**
```typescript
// FORBIDDEN: Plain Error with lost context
throw new Error('Weather API error: ' + response.statusText)

// FORBIDDEN: Manual error construction
throw new Error(`HTTP ${response.status}`)

// FORBIDDEN: String error
throw 'Something went wrong'

// FORBIDDEN: Swallowing the error silently
try {
  const response = await fetch(url)
  return response.json()
} catch {
  return null  // Error is lost
}
```

## Data Fetching — useQuery Error Handling (NON-NEGOTIABLE)

**Every `useQuery` consumer must handle the `error` state.** React Query provides `error`, `isError`, and `isPending` — use them.

### Hook return shape

All data-fetching hooks must return `error` alongside `data`, `isLoading`, etc.:

```typescript
// APPROVED: Hook returns structured error
export function useWeatherData() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['weather'],
    queryFn: fetchWeather,
  })

  return {
    current: data?.current ?? null,
    forecast: data?.forecast ?? [],
    isLoading,
    error: error instanceof Error ? error.message : null,
  }
}
```

### Consumer responsibility

Every component that calls a data hook **must check `error`** and render appropriate UI:

```tsx
// APPROVED: Component handles error state
const { events, isLoading, error } = useCalendarContext()

if (isLoading) {
  return <LoadingState />
}

if (error) {
  return <ErrorState message={error} onRetry={refetch} />
}

return <EventList events={events} />
```

**Forbidden patterns:**
```tsx
// FORBIDDEN: Ignoring error from a data hook
const { events, isLoading } = useCalendarContext()
// error is silently dropped — user sees loading forever if fetch fails

// FORBIDDEN: Guarding with data only (no error indication)
{weather && forecast[0] && <WeatherSummary />}
// If fetch fails, weather is null — section disappears with no explanation
```

### Calendar context pattern

The `CalendarDataContext` provider handles fetching. Views read from context. The context exposes `error` and `refetch` — views must render error UI when `error` is non-null.

## Mutations — useMutation Error Handling (NON-NEGOTIABLE)

**All mutations must handle errors.** Never let a failed mutation become an unhandled promise rejection.

### Pattern for mutation hooks

When wrapping mutation functions, always provide error feedback:

```typescript
// APPROVED: Mutation with error handling
const mutation = useMutation({
  mutationFn: createMasterChore,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['chores'] })
  },
  onError: (error) => {
    console.error('Failed to create chore:', error)
    // Error state is exposed to the caller for inline feedback
  },
})
```

### Pattern for callback-based actions

When mutations are exposed as callbacks (not `useMutation`), the caller must handle errors:

```tsx
// APPROVED: Caller wraps mutation in try/catch
const handleSave = async (data: CreateMasterChoreRequest) => {
  try {
    await createMaster(data)
    onClose()
  } catch (error) {
    console.error('Failed to create chore:', error)
    setSaveError(error instanceof Error ? error.message : 'Unknown error')
  }
}

// FORBIDDEN: Fire-and-forget mutation
const handleSave = async (data: CreateMasterChoreRequest) => {
  await createMaster(data)  // Unhandled rejection if this fails
  onClose()
}
```

## Error Boundary (NON-NEGOTIABLE)

**A top-level Error Boundary must wrap the entire app.** Render errors (null access, type mismatches) crash the whole app without one.

### Placement

- **Top level:** `src/shared/components/ErrorBoundary.tsx` wraps `<App />` in `main.tsx`
- **Per-feature (optional):** Wrap independent sections (calendar, weather, chores) for graceful degradation

### Fallback UI

The fallback must:
- Show a clear message ("Something went wrong")
- Log the error (`console.error`)
- Offer a retry button (calls `resetErrorBoundary` or `window.location.reload()`)

```tsx
// APPROVED: Error boundary with retry
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Render error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="text-text-primary">Something went wrong</p>
            <button onClick={() => this.setState({ hasError: false })}>
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
```

## React Query Retry Configuration (NON-NEGOTIABLE)

**The `queryClient` retry logic must check `ApiError.isRetryable`.** Don't retry 400s, 401s, 403s, 404s, or 422s — they won't succeed on retry.

```typescript
// APPROVED: Smart retry in queryClient
retry: (failureCount, error) => {
  if (error instanceof ApiError && !error.isRetryable) return false
  return failureCount < 2
}
```

**Current behavior:** The `queryClient` retries ALL errors 2 times. This wastes time on non-retryable errors (validation errors, not found, unauthorized).

## Global Error Handler (NON-NEGOTIABLE)

**`main.tsx` must register a global `unhandledrejection` handler.** This catches any promise rejections that slip through.

```typescript
// In main.tsx
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})
```

This is a safety net, not a replacement for proper error handling at the call site.

## Error Logging (NON-NEGOTIABLE)

**Log errors at the boundary.** Every error boundary, global handler, and mutation `onError` callback must `console.error` the error.

**Rules:**
- `console.error` for actual errors (failed fetches, render crashes, mutation failures)
- `console.warn` for recoverable issues (fallback data used, degraded mode)
- Never `console.log` errors — use the correct level
- Include context: which operation failed, what the input was

```typescript
// APPROVED: Error logging with context
console.error('Failed to fetch weather:', error)
console.error('Failed to create chore:', error, { choreData: data })

// FORBIDDEN: Silent catch
catch {
  // Error is swallowed — no log, no feedback
}
```

## Decision Tree

When handling an error, use this decision tree:

```
1. Am I writing a fetch function?
   YES → Use `throw await parseApiError(response)` for non-ok responses
   NO  → Continue

2. Am I consuming a useQuery hook?
   YES → Destructure `error` and render error UI when `isError` is true
   NO  → Continue

3. Am I writing a mutation?
   YES → Handle errors (try/catch or useMutation onError)
   NO  → Continue

4. Am I building a new feature view?
   YES → Check `isLoading`, `error`, and render all three states
   NO  → Continue

5. Am I catching an error?
   YES → Log it with console.error and provide user feedback
   NO  → Implementation is correct
```

## File Locations

| File | Purpose |
|------|---------|
| `src/shared/errors/ApiError.ts` | Structured error class |
| `src/shared/errors/parseApiError.ts` | Centralized error parser |
| `src/shared/errors/index.ts` | Barrel export |
| `src/shared/components/ErrorBoundary.tsx` | Error boundary component |
| `src/shared/query/queryClient.ts` | React Query retry config |
| `src/main.tsx` | Global error handler |

## References

- [React Query error handling](https://tanstack.com/query/v5/docs/react/guides/query-retries)
- [React Error Boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [FastAPI error format](https://fastapi.tiangolo.com/tutorial/handling-errors/) — `{"detail": "..."}` (default)
