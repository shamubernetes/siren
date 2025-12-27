import { createFileRoute } from '@tanstack/react-router'
import { checkReadiness } from '@/lib/health/health-check'

export const Route = createFileRoute('/readyz')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const signal = request.signal
        const status = await checkReadiness(signal)

        if (status.healthy) {
          return new Response('ready', {
            status: 200,
            headers: {
              'Content-Type': 'text/plain',
            },
          })
        }

        return new Response(status.message, {
          status: 503,
          headers: {
            'Content-Type': 'text/plain',
          },
        })
      },
    },
  },
})
