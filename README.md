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

```bash
bun dev
```

### Deep links (PagerDuty)

Each alert instance has a stable URL:

- `/a/<fingerprint>`

You can copy it from the UI (Copy Link button) and use it in notifications.

If you’re templating Alertmanager notifications, the alert fingerprint is available per alert; for grouped notifications you may want to include **multiple** links or link to `/alerts` instead.
