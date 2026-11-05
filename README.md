# ibp-frontend

The web UI for the Inside Books Project
(IBP) database. Volunteers use it to look up inmates (TDCJ and federal), log
book requests, print package labels, add comments, manage prison units and
shipping settings, and view metrics. It is a React + TypeScript single-page
app built with Vite; all data comes from the FastAPI backend
([ibp-backend](https://github.com/jonkensta/ibp-backend)) under `/api/`.

The header search takes a name, an inmate ID, or the request number printed on
an old package label, but only numbers 264807-270049 (labels from roughly the
six months before the 2026-11-02 cutover). Older request numbers look like
6-digit TDCJ inmate IDs, so they are searched as inmate IDs only. The range is
set in `src/lib/legacyRequest.ts` and matches ibp-book-portal-extension's. A
number in the range is also searched as an inmate ID, and if that finds a
different inmate, both are listed instead of redirecting.

## Development

Requires Node.js 20.19 or newer (CI and the Docker build use Node 24).

```sh
npm ci
npm run dev
```

The dev server (http://localhost:5173) proxies `/api` to an ibp-backend on
`http://localhost:8000` (see `server.proxy` in `vite.config.ts`), so start the
backend first (`uv run fastapi dev ibp` in ibp-backend).

Optional build-time environment variables (copy `.env.example` to `.env.local`):

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | Backend base URL; leave unset to go through the proxy (set it only for a backend at another origin with `[server] cors_origins`) |
| `VITE_PRINT_SERVER_URL` | `http://localhost:40121` | Intake station's [ibp-print-server](https://github.com/jonkensta/ibp-print-server) |

## Checks

```sh
npm run lint         # ESLint
npm run typecheck    # tsc -b
npm run format:check # Prettier
npm run test:run     # Vitest, once
npm test             # Vitest, watch mode
```

Tests run in Vitest browser mode on headless Firefox via Playwright; install
the browser once with `npx playwright install firefox`.

CI (`.github/workflows/ci.yml`) runs lint, format check, build and tests on every
push and pull request to `main`.

## Build

```sh
npm run build   # tsc -b && vite build, output in dist/
npm run preview # serve dist/ locally
```

## Deployment

`.github/workflows/docker.yml` builds the Docker image (`Dockerfile`: a Node
build stage, then nginx serving `dist/`) for amd64 and arm64 and publishes it
to GHCR:

- `ghcr.io/jonkensta/ibp-frontend:main` and `:sha-<sha>` for each push to `main`
- `ghcr.io/jonkensta/ibp-frontend:vX.Y.Z` for each `v*` tag

Production (`ibp-server`, a Raspberry Pi 4) runs a pinned release tag in the
Docker Compose stack in ibp-backend's
[`deploy/pi/`](https://github.com/jonkensta/ibp-backend/tree/main/deploy/pi):
set `IBP_TAG` in `/srv/ibp/.env`, then `docker compose pull && docker compose
up -d`. See that directory's README for details.

nginx serves the app with an SPA fallback and proxies `/api/` to the backend
container. The image's default config is `nginx.conf` in this repo; the Pi
stack mounts its own HTTP-only copy (`deploy/pi/nginx.conf` in ibp-backend)
over it, so keep the two in step.
