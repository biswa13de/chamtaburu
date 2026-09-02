# Chamtaburu Web Platform

Website for **Chamtaburu Eco Village & Eco Resort**, Ajodhya Hills, Purulia.

One codebase, two static sites, built at the same commit:

```
VITE_SITE=village  npm run build   →  dist/village   →  chamtaburu.in
VITE_SITE=resort   npm run build   →  dist/resort    →  resort.chamtaburu.in
```

No backend, no database, no server — hosted as static files on Firebase Hosting.
See [docs/](docs/) for the full planning and architecture docs, in particular
[docs/02-architecture.md](docs/02-architecture.md) and
[docs/05-build-phases.md](docs/05-build-phases.md) for where the project stands.

## Prerequisites

- Node.js (version pinned in [.nvmrc](.nvmrc); `nvm use` if you use nvm)

## Getting started

```bash
npm install
npm run dev
```

The dev server defaults to the Village site. Set `VITE_SITE=resort` to work on the
Resort site instead:

```bash
VITE_SITE=resort npm run dev
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build for the current `VITE_SITE` target |
| `npm run preview` | Preview a production build locally |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm run check` | typecheck + lint + format:check — run before pushing |
| `npm run clean` | Remove `dist/` |

## Content

Editable content (copy, prices, cottage data) lives under `src/data/` as typed data —
see [docs/03-content-model.md](docs/03-content-model.md) for the schema.
