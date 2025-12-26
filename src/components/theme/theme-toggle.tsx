import { useTheme } from 'next-themes'
import { MoonIcon, SunIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'

type ThemeValue = 'light' | 'dark' | 'system'

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const isDark = useMemo(() => {
    if (!isMounted) {
      return false
    }

    return (resolvedTheme ?? theme) === 'dark'
  }, [isMounted, resolvedTheme, theme])

  const handleToggle = useCallback(() => {
    const nextTheme: ThemeValue = isDark ? 'light' : 'dark'
    setTheme(nextTheme)
  }, [isDark, setTheme])

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleToggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? (
        <MoonIcon className="size-4" />
      ) : (
        <SunIcon className="size-4" />
      )}
    </Button>
  )
}
