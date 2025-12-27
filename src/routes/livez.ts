import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/livez')({
  server: {
    handlers: {
      GET: async () => {
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
