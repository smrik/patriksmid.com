# patriksmid.com

Patrik Šmid's personal website, built with Astro. Projects, writing, and about
pages build to static files in `dist/`.

## Publishing from GitHub

Cloud publishing is prepared. The Cloudflare connection and first live publish
still need verification. See the shared [website publishing setup](https://github.com/smrik/websites).

After that setup, edit through a pull request. GitHub checks the site, and a merge
to `main` publishes the tested build. The **Check and publish portfolio** workflow
can also run manually on `main`. Pull requests and other branches do not publish.
The publish job checks that the live `deployment.json` contains that exact commit
SHA before it succeeds. A successful build alone does not prove a live update.

The workflow needs the repository secret `CLOUDFLARE_API_TOKEN` and variable
`CLOUDFLARE_ACCOUNT_ID`. Missing connection details stop publishing with a clear
error. Keep credentials in GitHub settings, out of source files.

Once the first publish succeeds, portfolio pages are served by Cloudflare while
the laptop is off. These existing app routes continue to use their current origin:

- `/flatbot` and `/flatbot/*`
- `/hub` and `/hub/*`

Those apps still depend on their existing host. Their API requests, query strings,
headers, and bodies pass through unchanged. `www.patriksmid.com` sends a permanent
301 redirect to `https://patriksmid.com`, preserving the path and query string.

The Worker uses routes over the existing proxied DNS records. Keep those records
in place so the apps can still reach their origin. Worker-first routing makes the
www redirect run before static files. Each portfolio request therefore invokes
the Worker; the Workers Free plan allows 100,000 Worker requests per day. No paid
plan is enabled by this repository. See [Cloudflare routing](https://developers.cloudflare.com/workers/configuration/routing/routes/)
and [Workers limits](https://developers.cloudflare.com/workers/platform/limits/).

## Local checks

Use Node.js 24 and npm, as the GitHub workflow does:

```bash
npm ci
npm test
npm run preview
```

`npm test` builds the site, checks detail pages, and checks the cloud routing and
deployment safeguards. `npm run build` also builds the site on its own.
`npm run dev -- --background` starts the development server. Use
`npm run astro -- dev stop` to stop it.

The lower-level `npm run deploy` command is the CI upload step. It runs only in
the main-branch GitHub workflow. It requires the Cloudflare environment variables,
`GITHUB_SHA`, and a matching
`dist/deployment.json`. The GitHub workflow supplies these. It verifies the live
commit after upload. Use the workflow for publishing so these inputs come from
the same checked commit.

## Where to edit

| Path | Purpose |
| --- | --- |
| `src/pages/` | Portfolio pages and detail routes |
| `src/data/` | Project and writing entries |
| `src/layouts/`, `src/styles/` | Shared page structure and styles |
| `public/` | Files copied into the site |
| `worker/index.js`, `wrangler.jsonc` | Cloud routing and assets |
| `.github/workflows/publish.yml` | Checks and publishing |
| `tests/` | Site, routing, and deployment checks |

## Project workflow

Use [Project workflow](docs/PATRIK_WORKFLOW.md) for tasks, proposals, feedback and review.
