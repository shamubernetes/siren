import { createFileRoute } from '@tanstack/react-router'
import { createChildLogger } from '@/lib/logger'

const log = createChildLogger('http')

export const Route = createFileRoute('/livez')({
  server: {
    handlers: {
      GET: async () => {
        const startTime = Date.now()
        const path = '/livez'

        log.debug({ path }, 'request received')

        const latencyMs = Date.now() - startTime

        log.info({ path, status: 200, latencyMs }, 'response sent')

        return new Response('ok', {
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
          },
        })
      },
    },
  },
})
