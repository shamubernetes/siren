import { useTheme } from 'next-themes'
import { MoonIcon, SunIcon } from 'lucide-react'
import { useCallback, useMemo } from 'react'

import { Button } from '@/components/ui/button'

type ThemeValue = 'light' | 'dark' | 'system'

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()

  const isDark = useMemo(() => {
    return (resolvedTheme ?? theme) === 'dark'
  }, [resolvedTheme, theme])

  const handleToggle = useCallback(() => {
    const isCurrentlyDark =
      typeof window !== 'undefined' &&
      typeof document?.documentElement?.classList?.contains === 'function'
        ? document.documentElement.classList.contains('dark')
        : isDark

    const nextTheme: ThemeValue = isCurrentlyDark ? 'light' : 'dark'
    setTheme(nextTheme)
  }, [isDark, setTheme])

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleToggle}
      aria-label="Toggle theme"
    >
      {/* Render both icons and let the html.dark class decide visibility to avoid hydration-time icon swapping */}
      <SunIcon className="size-4 dark:hidden" />
      <MoonIcon className="hidden size-4 dark:block" />
    </Button>
  )
}
