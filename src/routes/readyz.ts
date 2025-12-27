import { createFileRoute } from '@tanstack/react-router'
import { checkReadiness } from '@/lib/health/health-check'
import { createChildLogger } from '@/lib/logger'

const log = createChildLogger('http')

export const Route = createFileRoute('/readyz')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const startTime = Date.now()
        const path = '/readyz'

        log.debug({ path }, 'request received')

        const signal = request.signal
        const status = await checkReadiness(signal)

        const latencyMs = Date.now() - startTime

        if (status.healthy) {
          log.info({ path, status: 200, latencyMs }, 'response sent')

          return new Response('ready', {
            status: 200,
            headers: {
              'Content-Type': 'text/plain',
            },
          })
        }

        log.info({ path, status: 503, latencyMs }, 'response sent')

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
