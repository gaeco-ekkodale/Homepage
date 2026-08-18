<div align="center">
  <img src="https://raw.githubusercontent.com/gaeco-ekkodale/.github/main/assets/gaeco_logo_horizontal_color.png" width="200" alt="gaeco logo">

  # Homepage

  <em>The start page of the gaeco platform, delivered as a micro-frontend with live setup status.</em>

  [![License](https://img.shields.io/badge/license-fair--code-blue.svg)](LICENSE.md)
  [![Version](https://img.shields.io/github/v/release/gaeco-ekkodale/Homepage)](../../releases)

  [gaeco-ekkodale Organization](https://github.com/gaeco-ekkodale) · [All Repos](https://github.com/orgs/gaeco-ekkodale/repositories)
</div>

---

gaeco (Graphs for Architecture, Engineering, Construction, Operations) is an event-driven microservice platform for BIM data management. It translates external building-industry standards (IFC, IBPDI, Brick Schema, ASHRAE 223 and others) into a shared, versioned classification and relationship model (Guideline + Ontology) and exposes consistent, graph-based building data (Instance) across use cases and departments — without forcing every consumer onto one rigid schema. Built for organizations managing building/portfolio data across disconnected departmental systems (construction, facilities management, leasing, accounting) that need automatic, reliable data propagation instead of manual, error-prone hand-offs.

> This project is licensed under the [Source Available](LICENSE.md). Source code is viewable and usable; commercial use is restricted.

---

The start page of the gaeco platform, delivered as a micro-frontend. It shows the four setup steps
of the platform and derives the status of each step live from the services involved.

Client-only service - there is no `Server/`.

## Project Structure

- **Client**: React micro-frontend (exposed as `./App` via Module Federation)
- **build**: Build configuration using the NUKE build system
- **\_docker**: Compose definition, env schemas and the App Registry package manifest
- **\_pipeline**: Azure DevOps CI/CD pipeline configurations

## Integration into PluginHost

PluginHost picks the start page plugin by **substring match on the plugin id** and renders it at
route `/` instead of its own built-in start page
(`PluginHost/Client/src/pages/hooks/usePlugins.ts`, `Mainpage.tsx`).

The container label `app.mfe.id` therefore **must** contain `homepage`:

```yaml
labels:
  "app.mfe.id": "homepage-client"
  "app.mfe.displayName": "Homepage Client"
  "app.mfe.description": "Homepage Client Application"
  "app.mfe.iconPath": "/homepage.svg"
  "app.mfe.entrypointPath": "/assets/remoteEntry.js"
  "app.mfe.exposedModule": "App"
  "app.mfe.route": "${MOUNT_ROUTE}"
```

Get the id wrong and nothing breaks visibly - the plugin just appears as an ordinary module and
PluginHost keeps showing its own start page.

Note that PluginHost renders the start page plugin *without* passing plugin props, so the client
must not depend on them.

## Development Setup

### Prerequisites

- Node.js 20+
- .NET SDK 8.0+ (only for the NUKE build)

### Local Development

```bash
cd Client
npm ci
npm run dev
```

The dev server runs on `http://localhost:3136`. See [`Client/README.md`](./Client/README.md) for the
environment variables and for how the per-step status is derived.

## Docker / Deployment

```bash
cd _docker
docker compose -f docker-compose.yml -f docker-compose-override.yml up -d --build
```

The client is published on `HOMEPAGE_CLIENT_OUTERPORT` (default `3136`).

The service ships as an App Registry package in two variants (Traefik-routed `server` and
host-published `-local`), built and pushed by `_pipeline/CD_Package.yml` via the NUKE `PackageCD`
target - identical to every other gaeco service.

### Build via NUKE

```bash
./build.sh    # Linux/macOS
.\build.ps1   # Windows
```

## Security

Authentication is provided by the host (Keycloak OIDC). The readiness probes forward the shell's
bearer token; a service that rejects it is reported as "not reachable / not authorized" rather than
as "nothing configured yet".
