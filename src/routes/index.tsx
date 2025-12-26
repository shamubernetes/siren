import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({
      to: '/alerts',
    })
  },
  component: IndexRedirect,
})

function IndexRedirect() {
  return null
}
