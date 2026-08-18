import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeContext'

/**
 * Theme toggle component.
 *
 * Cycles through three modes: light → dark → auto → light
 * Displays the current mode with an icon.
 */
export function ThemeToggle() {
  const { mode, setMode } = useTheme()

  const cycleTheme = () => {
    if (mode === 'light') {
      setMode('dark')
    } else if (mode === 'dark') {
      setMode('auto')
    } else {
      setMode('light')
    }
  }

  const getIcon = () => {
    switch (mode) {
      case 'light':
        return <Sun className="w-4 h-4" />
      case 'dark':
        return <Moon className="w-4 h-4" />
      case 'auto':
        return <Monitor className="w-4 h-4" />
    }
  }

  const getTitle = () => {
    switch (mode) {
      case 'light':
        return 'Light mode'
      case 'dark':
        return 'Dark mode'
      case 'auto':
        return 'Auto mode (dark at sunset, light at sunrise)'
    }
  }

  return (
    <button
      onClick={cycleTheme}
      className="p-1.5 rounded-md hover:bg-[var(--dt-bg-hover)] transition-colors"
      style={{ color: 'var(--dt-text-secondary)' }}
      title={getTitle()}
      aria-label={getTitle()}
    >
      {getIcon()}
    </button>
  )
}
