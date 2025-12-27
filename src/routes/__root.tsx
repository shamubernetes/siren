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
import { ThemeInitScript } from '@/components/theme/theme-init-script'
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
        <ThemeInitScript />
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
