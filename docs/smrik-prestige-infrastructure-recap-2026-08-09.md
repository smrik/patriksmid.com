# smrik-prestige infrastructure & patriksmid.com — setup recap

Updated: 2026-08-09

This note records the infrastructure built so far, why each piece exists, how the pieces connect, and the current state of the personal website project. It is intentionally detailed so it can be used as a project/source handoff later.

---

## 1. High-level architecture

The MSI Prestige laptop (`smrik-prestige`) has been repurposed as an always-on Linux home server.

It currently serves four broad roles:

1. **Private infrastructure hub**
   - Tailscale remote access
   - Syncthing hub for the Obsidian/RAM vault
   - Restic backups
   - SSH / remote administration

2. **Personal AI agent host**
   - Hermes Agent runs under its own restricted Linux user
   - OpenAI Codex authentication is configured
   - Hermes can read the Obsidian vault through a read-only bind mount
   - Signal provides a remote chat interface

3. **Self-hosted application server**
   - Anki sync server runs locally
   - Reviews are then published to Beeminder through the existing Anki workflow
   - The Anki server is publicly reachable through Cloudflare Tunnel, so clients no longer require Tailscale

4. **Public web host**
   - `patriksmid.com` is registered
   - Cloudflare is authoritative DNS
   - A persistent Cloudflare Tunnel connects the server to Cloudflare
   - Astro personal-site development has started in Git/GitHub
   - The final root website is not deployed yet

Conceptually:

```text
                           Internet
                              |
                         Cloudflare
                    DNS + HTTPS + Tunnel
                              |
                    cloudflared on MSI
                              |
              +---------------+---------------+
              |                               |
     anki.patriksmid.com              patriksmid.com
        Anki sync server              future Astro site


Private devices
      |
   Tailscale
      |
 smrik-prestige
      |
 +----+---------------------------+
 |                                |
SSH/admin                   private services
                              |
                        Syncthing / Hermes


Obsidian vault sync:

Main laptop <----> smrik-prestige <----> Android phone
                       |
                 Restic backups
                       |
              Hermes read-only view
```

The important architectural separation is:

```text
Tailscale   = private infrastructure / administration
Cloudflare  = intentionally public services
Syncthing   = file synchronization
Restic      = backup/history independent of sync
GitHub      = source control for software/projects
```

These systems solve different problems and should not be treated as interchangeable.

---

# 2. Server

## Machine

Hostname:

```text
smrik-prestige
```

The server is the repurposed MSI Prestige 14 laptop.

Relevant hardware from the original setup:

```text
CPU: Intel Core i7-10710U
GPU: NVIDIA GTX 1650 Max-Q
RAM: 16 GB
```

Operating system:

```text
Arch-family Linux / EndeavourOS
systemd
```

The machine is intended to stay powered on and function as the stable center of the personal infrastructure.

---

# 3. Tailscale

Tailscale is installed on the relevant machines and provides the private network connecting devices even when they are on unrelated physical networks.

This solved the original problem where the main laptop and the MSI were on different Wi-Fi/network connections but Syncthing still needed to reach the server.

A Syncthing connection was observed using a Tailscale IPv6 address:

```text
[fd7a:115c:a1e0::...]:22000
```

This demonstrated that Syncthing could discover/use a route over the Tailscale network.

Practical role:

```text
Laptop --------\
Phone ----------> private Tailscale network ---> smrik-prestige
Other devices --/
```

Tailscale should remain the default route for things that are **not supposed to be public**, especially:

- SSH
- server administration
- internal dashboards
- Syncthing administration
- sensitive agent/system interfaces
- backup administration

The later Cloudflare setup does **not** replace Tailscale.

---

# 4. Syncthing / RAM vault

## Goal

Use `smrik-prestige` as the always-on synchronization hub so the main laptop and Android phone do not need to find each other directly.

Topology:

```text
Main laptop <----> smrik-prestige <----> Android
```

This is intentionally hub-and-spoke rather than requiring all devices to maintain direct peer relationships.

## Server folder

Syncthing folder ID:

```text
ugsbf-zumnh
```

Label:

```text
RAM
```

Server path:

```text
/home/smrik/srv/RAM
```

The server copy contains the main Obsidian vault structure, including:

```text
00_Index/
Attachments/
Daily/
Life/
Projects/
System/
Thesis/
Zettelkasten/
.agent/
.agents/
.claude/
.obsidian/
...
Home.md
Inbox.md
Inbox Mobile.md
Parked.md
AGENTS.md
CLAUDE.md
```

## Android

The Android/Termux vault path used during setup was:

```text
/data/data/com.termux/files/home/storage/shared/Documents/PatriksVault
```

The path was verified from Termux by listing the real vault contents.

Android initially appeared stuck/out-of-sync, but after correcting the folder/path configuration the sync worked.

## Why the server hub matters

Because the MSI is intended to remain online:

- laptop can sync while phone is offline
- phone can sync while laptop is offline
- neither endpoint needs the other endpoint to be reachable directly
- the server maintains a current copy for backup and read-only agent access

Sync is **not** backup. A deletion or bad edit can propagate between peers, which is why Restic exists separately.

---

# 5. Restic backup

The RAM/server data also has Restic backup infrastructure.

Earlier validation included:

- successful Restic snapshot
- restore test completed successfully
- systemd user timer for automatic backups
- retention policy configured

Recorded retention design:

```text
7 daily
4 weekly
12 monthly
```

The important conceptual distinction:

```text
Syncthing:
"make these folders agree"

Restic:
"preserve recoverable historical snapshots"
```

A corrupted/deleted file synchronized everywhere may still be recoverable from Restic.

---

# 6. Restricted Hermes Linux user

A dedicated Linux user was created:

```text
hermes
```

Recorded identity:

```text
uid=1001(hermes)
gid=1002(hermes)
```

The account has:

```text
no sudo access
```

Verification:

```text
sudo -l -U hermes
```

returned that the user is not allowed to run sudo.

This is an important security boundary: Hermes is not simply running as the main `smrik` account.

---

# 7. Hermes workspace and read-only vault

Hermes has two intentionally different locations.

Writable agent workspace:

```text
/home/hermes/workspace
```

Read-only view of the vault:

```text
/home/hermes/vault
```

The real vault lives at:

```text
/home/smrik/srv/RAM
```

A bind mount exposes it to Hermes:

```text
/home/smrik/srv/RAM
        |
        | bind mount, read-only
        v
/home/hermes/vault
```

A persistent systemd mount unit was created:

```text
home-hermes-vault.mount
```

The mount was verified with:

```text
findmnt /home/hermes/vault
```

and reported the filesystem as read-only.

Read test:

```text
sudo -u hermes test -r /home/hermes/vault/Home.md
```

succeeded.

Write test:

```text
sudo -u hermes touch /home/hermes/vault/_write-test
```

failed with:

```text
Read-only file system
```

Hermes itself was then tested against the boundary:

- it listed the top-level vault files successfully
- it summarized `Home.md`
- an explicit request to create `hermes-write-test.md` failed because the filesystem was read-only

This is the intended behavior.

The security model is:

```text
Hermes may:
- inspect the personal knowledge base
- reason over notes
- create its own files in workspace / Hermes home
- maintain its own skills/memory

Hermes may NOT:
- silently rewrite the Obsidian vault
- delete notes
- alter the source vault through this mount
- sudo into the rest of the machine
```

---

# 8. Hermes Agent installation

Hermes Agent was installed under the `hermes` Linux account.

Version verified during setup:

```text
Hermes Agent v0.20.0 (2026.8.3)
Python 3.11.15
OpenAI SDK 2.24.0
```

Launcher:

```text
/home/hermes/.local/bin/hermes
```

Hermes data/config locations:

```text
/home/hermes/.hermes/config.yaml
/home/hermes/.hermes/.env
/home/hermes/.hermes/auth.json
/home/hermes/.hermes/skills/
/home/hermes/.hermes/sessions/
/home/hermes/.hermes/logs/
/home/hermes/.hermes/cron/
```

The installer itself used `uv` and created a Python virtual environment.

Bundled skills were synchronized during installation.

Browser/Playwright support was not fully completed during the initial installer pass on Arch; this did not block the core Hermes/Signal use case.

---

# 9. Hermes inference

Hermes was authenticated against OpenAI Codex through the device-login flow.

The setup wizard changed the provider to:

```text
openai-codex
```

and selected a Codex model.

This means Hermes can use the existing subscription-authenticated Codex path rather than requiring every request to use the OpenRouter API key.

No authentication tokens or secrets should ever be committed to Git or copied into project notes.

---

# 10. signal-cli

`signal-cli` was installed system-wide.

Installed version:

```text
signal-cli 0.14.7
```

Installation path:

```text
/opt/signal-cli-0.14.7/
```

Symlink/command:

```text
/usr/local/bin/signal-cli
```

The server was linked as a Signal linked device using:

```text
signal-cli link -n "HermesAgent"
```

The Signal account number is intentionally omitted from this note.

The HTTP daemon was tested manually using a loopback-only address:

```text
127.0.0.1:8080
```

Health check:

```bash
curl -i http://127.0.0.1:8080/api/v1/check
```

returned:

```text
HTTP/1.1 200 OK
```

---

# 11. Persistent Signal daemon

A system service was created:

```text
/etc/systemd/system/signal-cli-hermes.service
```

It runs `signal-cli` as the restricted `hermes` user.

The service initially failed with:

```text
status=226/NAMESPACE
```

The journal identified the actual cause:

```text
/home/hermes/.config/signal-cli: No such file or directory
```

The real credential/data directory was:

```text
/home/hermes/.local/share/signal-cli
```

The nonexistent `ReadWritePaths=/home/hermes/.config/signal-cli` line was removed.

After correction:

```text
signal-cli-hermes.service
Active: active (running)
```

The HTTP endpoint returned `200 OK` after Java finished starting.

The service is enabled at boot.

---

# 12. Hermes Signal gateway

Hermes Gateway was configured to talk to:

```text
http://127.0.0.1:8080
```

Security configuration:

- direct-message users denied by default
- only the owner's Signal identity allowed
- group messaging disabled
- Signal was set as the home channel

The user-level systemd service is:

```text
hermes-gateway.service
```

The original installation failed because `sudo -iu hermes` did not provide:

```text
XDG_RUNTIME_DIR
DBUS_SESSION_BUS_ADDRESS
```

Persistent user services were enabled with:

```text
sudo loginctl enable-linger hermes
sudo systemctl start user@1001.service
```

The gateway was then started through the Hermes user manager.

It was explicitly enabled:

```text
systemctl --user enable hermes-gateway.service
```

and verified as:

```text
active (running)
enabled
```

A complete end-to-end test worked:

```text
Signal Note to Self
        |
        v
signal-cli HTTP daemon
        |
        v
Hermes Gateway
        |
        v
OpenAI Codex
        |
        v
read-only Obsidian vault
```

After reboot, a Signal message still received a Hermes response with no manual terminal startup.

That reboot test confirmed the entire Signal/Hermes chain is persistent.

---

# 13. Anki self-hosting

An Anki sync server was also set up on the Linux server.

Its purpose is not only synchronization: the wider Anki workflow publishes review data to Beeminder.

Originally, syncing depended on Tailscale being enabled because the Anki clients were pointed at a private Tailscale address.

That was functional but annoying, especially on mobile.

The solution was to publish the Anki sync service through the public Cloudflare ingress instead.

Current public hostname:

```text
anki.patriksmid.com
```

The service was tested with Tailscale disabled and sync worked.

Important security model:

```text
Public Internet
      |
      v
Cloudflare HTTPS
      |
      v
Cloudflare Tunnel
      |
      v
local Anki sync service
```

The raw Anki HTTP service itself does not need to be directly exposed on the router/public IP.

The exact local Anki service port was not captured in this note and should be added later if needed.

---

# 14. Domain registration

Domain purchased:

```text
patriksmid.com
```

Registrar:

```text
Porkbun
```

Only the `.com` domain was purchased.

No unnecessary registrar hosting/email/website-builder package was required for the self-hosted architecture.

The domain is suitable as the long-term identity for:

- personal website
- professional profile
- projects
- writing
- future apps
- service subdomains

Examples:

```text
patriksmid.com
www.patriksmid.com
anki.patriksmid.com
<future-service>.patriksmid.com
```

Subdomains do not need to be purchased separately.

---

# 15. Cloudflare DNS

`patriksmid.com` was added to Cloudflare on the free plan.

Cloudflare assigned two authoritative nameservers.

The domain's nameservers at Porkbun were changed to the Cloudflare nameservers.

After DNS propagation, Cloudflare reported the domain as active.

This means the roles are now:

```text
Porkbun
= registrar
= records who owns/renews patriksmid.com

Cloudflare DNS
= authoritative DNS
= answers "where should patriksmid.com traffic go?"

smrik-prestige
= origin/server
= actually runs the applications
```

Porkbun and Cloudflare are therefore not competing services in this setup; they occupy different layers.

---

# 16. Cloudflare Tunnel

`cloudflared` was installed on `smrik-prestige`.

A tunnel was created and named:

```text
smrik-prestige
```

It became healthy in the Cloudflare dashboard.

The tunnel was installed as a persistent Linux system service using the Cloudflare-provided tunnel token.

Service:

```text
cloudflared
```

It was verified as running independently of the shell.

A tunnel token is a secret and should never be recorded in this note or committed to Git.

## Why Tunnel was chosen

Without Tunnel, a conventional self-hosted public site might require:

```text
Internet
  |
public router IP
  |
port forwarding 80/443
  |
server
```

That introduces:

- router configuration
- inbound ports
- public-IP concerns
- CGNAT complications
- direct origin exposure

Cloudflare Tunnel reverses the direction.

The server initiates an outbound persistent connection:

```text
smrik-prestige ----outbound----> Cloudflare
```

When a visitor later requests a published hostname, Cloudflare carries the request down the already-established tunnel.

Therefore:

- no router port forwarding was needed
- no static public IP was needed
- the server's origin did not need to be directly reachable from the Internet

---

# 17. First public-hosting test

Before exposing Anki, a deliberately trivial web service was used to verify the complete public path.

Temporary local service:

```text
Python http.server
127.0.0.1:8088
```

Test content:

```text
Hello from smrik-prestige
```

Published hostname:

```text
hello.patriksmid.com
```

The browser successfully loaded the message.

That proved:

```text
Browser
  -> public DNS
  -> Cloudflare
  -> Cloudflare Tunnel
  -> cloudflared on MSI
  -> localhost:8088
  -> Python web server
```

A temporary `hello-site.service` was created and tested for persistence.

After the architecture was proven and Anki was working, the test service was disabled and deleted.

Therefore `hello-site.service` is **not** part of the current production stack.

The Cloudflare `hello` route can also be removed if it has not already been deleted.

---

# 18. Current public/private boundary

A useful rule for future services:

## Keep private through Tailscale

Examples:

```text
SSH
Syncthing admin
Hermes internals
server dashboards
backup controls
anything containing private personal data
```

## Publish deliberately through Cloudflare

Examples:

```text
patriksmid.com
anki.patriksmid.com
future public apps/APIs
demo projects
```

Do not expose a service merely because it *can* be exposed.

---

# 19. Personal website design

The intended website is:

```text
patriksmid.com
```

Purpose:

- personal + professional
- credible for finance/AI audiences
- not merely a web CV
- evolving work-in-progress
- space for projects and writing

Planned v1 pages:

```text
/
 /projects
 /writing
 /about
```

Visual direction:

```text
classic/editorial first
technical second
```

Desired qualities:

- NYT/editorial inspiration
- professional/classy feel
- serif-led typography
- whitespace
- thin rules/dividers
- restrained colors
- monospace metadata and technical details
- modern technical quirks without a neon/hacker aesthetic
- no prominent portrait
- LinkedIn/GitHub/contact links
- writing can grow gradually over time

No v1 requirement for:

- database
- CMS
- authentication
- comments
- newsletter
- heavy JavaScript
- "Now" page
- LinkedIn embed

---

# 20. Astro website architecture

Framework chosen:

```text
Astro
```

Planned architecture:

```text
Astro static site
├── homepage
├── projects
├── writing
├── about
└── content collections
    ├── projects
    └── writing
```

Projects/writing are intended to be Markdown/MDX so publishing stays cheap:

```text
add Markdown
commit
build
deploy
```

No server-side application runtime is required for v1.

Future production flow:

```text
main laptop
   |
git push
   v
GitHub
   |
git pull
   v
smrik-prestige
   |
npm run build
   v
dist/
   |
local HTTP service
   |
Cloudflare Tunnel
   v
patriksmid.com
```

This deliberately uses Git instead of Syncthing for source code.

Git gives:

- commit history
- diffs
- branches
- pull requests
- rollback
- clean deployments

Syncthing is appropriate for the vault; Git is appropriate for software source.

---

# 21. GitHub website repository

GitHub repository:

```text
smrik/patriksmid.com
```

Default branch:

```text
main
```

Initial bootstrap commits:

```text
chore: initialize repository
chore: ignore worktrees
```

Local main repo on Windows:

```text
C:\Projects\projects\patriksmid.com
```

Feature worktree:

```text
C:\Projects\projects\patriksmid.com\.worktrees\initial-site
```

Feature branch:

```text
feat/initial-site
```

`.worktrees/` is ignored by Git.

The feature branch was rebased after the `.gitignore` commit was added to `main`.

---

# 22. Astro scaffold current state

Windows Node version during scaffold:

```text
v24.10.0
```

Astro would not initialize directly into the non-empty Git worktree, so it was first scaffolded into:

```text
_astro
```

The generated project files were then moved into the worktree root.

Dependencies were installed successfully:

```text
288 packages
0 vulnerabilities
```

A production build succeeded:

```text
output: static
1 page built
Complete!
```

Generated output:

```text
dist/
```

The temporary `_astro` folder was removed.

The feature worktree `.gitignore` includes:

```text
.worktrees/
node_modules/
dist/
.astro/
```

Astro scaffold files include:

```text
.vscode/
AGENTS.md
CLAUDE.md
astro.config.mjs
package-lock.json
package.json
public/
src/
tsconfig.json
```

The scaffold has been committed on:

```text
feat/initial-site
```

Task 1 of the website implementation is therefore complete.

---

# 23. Website implementation next state

The next planned step is Astro Content Collections.

Planned directories:

```text
src/data/projects/
src/data/writing/
```

Planned configuration:

```text
src/content.config.ts
```

Collections:

```text
projects
writing
```

Project metadata:

```text
title
description
date
status
featured
```

Writing metadata:

```text
title
description
date
category
draft
```

This step has not yet been completed in the current sequence.

---

# 24. Services worth checking after a reboot

Useful commands:

```bash
systemctl status cloudflared --no-pager
```

```bash
systemctl status signal-cli-hermes.service --no-pager
```

For the Hermes user service:

```bash
sudo -u hermes -H env XDG_RUNTIME_DIR=/run/user/1001 DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1001/bus systemctl --user status hermes-gateway.service --no-pager
```

Read-only Hermes mount:

```bash
findmnt /home/hermes/vault
```

Syncthing:

```bash
syncthing cli show connections
```

Anki public access can be tested by syncing with Tailscale disabled.

---

# 25. Security decisions made deliberately

Several choices were intentionally conservative.

## Hermes isolation

Hermes:
- has a dedicated Unix user
- has no sudo
- receives the vault read-only
- has its own writable workspace

## Loopback binding

Local HTTP services intended to sit behind Cloudflare should preferably bind to:

```text
127.0.0.1
```

rather than:

```text
0.0.0.0
```

unless LAN exposure is deliberately required.

## Tunnel token

The Cloudflare tunnel token is a credential.

Never:
- commit it
- put it in Obsidian/project source notes
- paste the full token into public chats/logs

## Public/private split

Cloudflare Tunnel does not imply every application should become public.

Public routes should be added one at a time and intentionally.

## Signal

The Hermes Signal gateway:
- denies users by default
- allows only the owner's identity
- has groups disabled

This is important because Hermes has terminal/tool capabilities even though its OS account is restricted.

---

# 26. Mental model / why the architecture makes sense

The full system can be thought of as layers.

```text
NAME
patriksmid.com
     |
     v
DNS
Cloudflare says where the name goes
     |
     v
EDGE / PUBLIC ENTRY
Cloudflare accepts HTTPS traffic
     |
     v
TUNNEL
cloudflared maintains the private route home
     |
     v
SERVER
smrik-prestige
     |
     v
SERVICE
Anki / future Astro HTTP server / another app
```

Private administration follows a separate lane:

```text
device
  |
Tailscale
  |
smrik-prestige
  |
SSH / Syncthing / internal systems
```

This separation is one of the most important things to preserve as the homelab grows.

---

# 27. Immediate next steps

Website:

```text
1. Add Astro content collections
2. Add project + writing sample content
3. Build shared editorial layout
4. Build Home / Projects / Writing / About
5. Push feature branch
6. Review PR
7. Merge
8. Clone/pull repo on MSI
9. npm ci && npm run build
10. Serve dist/ on localhost
11. Publish patriksmid.com through existing Cloudflare Tunnel
```

Infrastructure later:

```text
- document exact Anki local port/service name
- consider automatic website deployment only after manual deployment works
- periodically update signal-cli
- periodically verify Restic restores
- keep public-service inventory small and explicit
```

---

# 28. One-sentence summary

`smrik-prestige` is now an always-on Linux home server connected privately through Tailscale, synchronizing and backing up the RAM/Obsidian vault, running a sandboxed Hermes agent accessible through Signal, hosting an Anki sync server publicly through Cloudflare Tunnel, and serving as the future deployment target for the GitHub-managed Astro site at `patriksmid.com`.
