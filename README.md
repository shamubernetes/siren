# TanStack Start + shadcn/ui

This is a template for a new TanStack Start project with React, TypeScript, and shadcn/ui.

## Siren (Alertmanager dashboard)

This app provides a clean UI for browsing **currently firing Alertmanager alerts** and stable deep links to individual alerts.

### Configure

Set `ALERTMANAGER_BASE_URL` to your Alertmanager base URL (reachable **from the server** running this app):

```bash
ALERTMANAGER_BASE_URL=http://alertmanager.monitoring.svc:9093
```

For local dev, you can put this in a `.env` file in the repo root.

### Run

#### Local Development

```bash
bun dev
```

#### Docker

Build the Docker image:

```bash
docker build -t siren:latest .
```

Run the container:

```bash
docker run -p 3000:3000 \
  -e ALERTMANAGER_BASE_URL=http://alertmanager.monitoring.svc:9093 \
  siren:latest
```

The `PORT` environment variable can be set to change the listening port (default: 3000).

#### GitHub Container Registry (GHCR)

Images are automatically built and published to GHCR on pushes to `main` and on version tags (`v*`).

Pull and run:

```bash
docker pull ghcr.io/<owner>/<repo>:latest
docker run -p 3000:3000 \
  -e ALERTMANAGER_BASE_URL=http://alertmanager.monitoring.svc:9093 \
  ghcr.io/<owner>/<repo>:latest
```

### CI/CD

Pull requests must pass the following checks before merging:
- Formatting check (`bun run format:check`)
- Linting (`bun run lint`)
- Type checking (`bun run typecheck`)
- Tests (`bun test`)

These checks are enforced via GitHub Actions. To enable branch protection:
1. Go to repository Settings → Branches
2. Add a branch protection rule for your default branch
3. Enable "Require status checks to pass before merging"
4. Select the `lint-and-check` job from the CI workflow

### Deep links (PagerDuty)

Each alert instance has a stable URL:

- `/a/<fingerprint>`

You can copy it from the UI (Copy Link button) and use it in notifications.

If you’re templating Alertmanager notifications, the alert fingerprint is available per alert; for grouped notifications you may want to include **multiple** links or link to `/alerts` instead.
