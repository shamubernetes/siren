import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles.css?url'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { Toaster } from '@/components/ui/sonner'

export const Route = createRootRoute({
  head: () => {
    const baseUrl = import.meta.env.BASE_URL || '/'
    const basePath = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

    return {
      meta: [
        {
          charSet: 'utf8',
        },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        {
          title: 'Siren',
        },
        {
          name: 'theme-color',
          content: '#10364f',
        },
        {
          name: 'msapplication-TileColor',
          content: '#10364f',
        },
      ],
      links: [
        {
          rel: 'stylesheet',
          href: appCss,
        },
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: `${basePath}/favicon.svg`,
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '96x96',
          href: `${basePath}/favicon-96x96.png`,
        },
        {
          rel: 'icon',
          href: `${basePath}/favicon.ico`,
        },
        {
          rel: 'apple-touch-icon',
          href: `${basePath}/apple-touch-icon.png`,
        },
        {
          rel: 'manifest',
          href: `${basePath}/site.webmanifest`,
        },
      ],
    }
  },

  component: RootLayout,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const isDev = import.meta.env.DEV

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          // Set the initial theme class ASAP to avoid flashes and icon swaps before hydration.
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
      </head>
      <body>
        {children}
        {isDev && (
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        )}
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  return (
    <ThemeProvider>
      <Outlet />
      <Toaster />
    </ThemeProvider>
  )
}
