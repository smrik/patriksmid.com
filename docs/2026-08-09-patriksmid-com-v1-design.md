# patriksmid.com — v1 Design

Date: 2026-08-09

## Goal

Build a personal + professional website for Patrik Šmid that feels credible in finance and AI without becoming a CV website.

The site should be an evolving body of work: selected projects, writing, and background, with room to grow over time.

## Audience

Primary:
- Finance and AI people encountered online
- Potential collaborators, employers, and professional contacts

Secondary:
- General visitors interested in Patrik's work and interests

## Visual direction

Editorial/classic first, technical second.

Base style:
- Serif-led typography
- Strong typographic hierarchy
- Generous whitespace
- Thin rules and restrained layout
- Off-white / paper-like background
- Dark ink-style text
- Professional, understated feel inspired by high-quality editorial design

Technical layer:
- Monospace metadata for dates, tags, statuses, and technical details
- Small system-like labels such as `AUG 2026`, `ACTIVE`, `EXPERIMENT`, `NOTE`
- Subtle grid/system motifs where useful
- No neon, glassmorphism, hacker aesthetic, or generic developer-dashboard look

## Information architecture

### `/`
Homepage containing:
- Patrik Šmid masthead
- Short positioning line around finance, AI, and systems
- 2–3 sentence introduction
- Selected projects
- Latest writing
- Footer with LinkedIn, GitHub, and email

No prominent portrait on the homepage.

### `/projects`
Editorial project index.

Each item includes:
- Title
- Short description
- Date
- Status/category metadata
- Link to a project detail page when available

Projects can begin as short entries and grow into fuller case studies later.

### `/writing`
Chronological writing archive.

Each item includes:
- Title
- Date
- Category/tag
- Short description or excerpt

Writing is stored as Markdown/MDX.

### `/about`
Background and personal context without duplicating a full CV.

Content may include:
- Professional background
- Finance / AI / systems interests
- Personal interests
- LinkedIn link for formal career history

## Content model

Use Astro Content Collections for:
- `projects`
- `writing`

Publishing should be low-friction: add a Markdown/MDX file, commit, build, deploy.

## Architecture

- Astro
- Static-site generation
- Astro Content Collections
- Markdown/MDX content
- No database
- No CMS
- No backend for v1

The site should build to static files that can be served locally on the MSI and exposed through the existing Cloudflare Tunnel.

## Deployment

Target:
- `patriksmid.com`
- `www.patriksmid.com` redirects or resolves to the same site

Hosting:
- Static Astro build on the MSI
- Local HTTP service bound to localhost
- Cloudflare Tunnel publishes the site
- Tailscale remains for private administration

## v1 exclusions

Do not add yet:
- Now/currently page
- Newsletter
- Comments
- Authentication
- Database
- CMS
- Analytics unless clearly needed
- Heavy JavaScript interactions
- LinkedIn embed
- Automatic personal-data integrations

## Success criteria

v1 is successful when:
1. `patriksmid.com` loads publicly over HTTPS.
2. Homepage, Projects, Writing, and About pages work on desktop and mobile.
3. A new project or article can be published by adding one Markdown/MDX file.
4. Visual design feels editorial/classic with restrained technical details.
5. The site remains simple enough to understand and maintain personally.
