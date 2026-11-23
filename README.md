# patriksmid.com

A personal website built with Astro. It contains pages for projects, writing,
background information and Flatbot.

## Local setup

Use Node.js 22.12.0 or later and npm:

```bash
npm ci
npm run dev -- --background
```

Use the address printed by Astro. The repository's agent instructions use
background mode so the development server does not hold the terminal open.
Manage that server with:

```bash
npm run astro -- dev status
npm run astro -- dev logs
npm run astro -- dev stop
```

## Check and preview

```bash
npm test
npm run build
npm run preview
```

The test command checks project and writing detail routes. The build writes the
static site to `dist/`; preview serves that build locally. These commands are
separate from deployment.

## Where to edit

| Folder or file | Purpose |
| --- | --- |
| `src/pages/` | Site pages and detail routes |
| `src/layouts/` | Shared page structure |
| `src/styles/` | Shared styles |
| `src/content.config.ts` | Content collection definitions |
| `public/` | Files copied into the site |
| `tests/` | Route checks |

## Deployment

The existing `npm run deploy` command targets the owner's configured live site.
It runs tests and then copies `dist/` with `rsync --delete`; it does not create a
fresh build. Build and inspect the output first, and obtain approval for the
live update. Files absent from the local output can be removed from the live
site. A source edit or pull request does not deploy the site.

## Project workflow

Use [Project workflow](docs/PATRIK_WORKFLOW.md) for tasks, proposals, feedback and review.
