export function ThemeInitScript() {
  return (
    <script
      // Set the initial theme class ASAP to avoid flashes and hydration-time swaps.
      // Mirrors next-themes defaults (storage key: "theme", values: "light" | "dark" | "system").
      dangerouslySetInnerHTML={{
        __html: `(function () {
  try {
    var stored = localStorage.getItem('theme')
    var theme = stored || 'system'
    var prefersDark = false

    try {
      prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {}

    var isDark = theme === 'dark' || (theme === 'system' && prefersDark)
    var root = document.documentElement

    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    root.style.colorScheme = isDark ? 'dark' : 'light'
  } catch {}
})()`,
      }}
    />
  )
}
