# Deploying geez·art

geez·art is a pure static client-side app: the production build in `dist/` is
HTML + JS + CSS + self-hosted fonts, with zero backend and no runtime network
calls. That means you can host it anywhere that serves static files — and you
should pick the cheapest, most reliable option that also gives you a good
domain.

**Recommended: Cloudflare Pages** (free tier: unlimited bandwidth, unlimited
requests, ~500 builds/month). It's the natural fit — free, fast, global CDN,
automatic HTTPS, and one-click custom-domain support.

---

## Choosing a domain

| Option | Verdict |
| --- | --- |
| **`.et` domain** | Not practical for a non-Ethiopian owner. The `.et` registry is the state operator (Ethio telecom), applications are discretionary, and pricing is high — roughly **$195–610/yr** depending on category. Skip it. |
| **`.art` (e.g. `geez-art.art`, `geezart.art`)** | Recommended. The arts-community TLD fits a letter-art app perfectly. Typically **~$15–30/yr** at registrars like Porkbun, Namecheap, or Cloudflare Registrar. |
| **`.com` (e.g. `geezart.com`)** | Fine, cheapest (~$12–15/yr), but heavily squatted — the short, clean names are likely taken. |
| **Free `*.pages.dev` subdomain** | Use it to get live today; add a custom domain whenever you're ready. No lock-in. |

Recommended pick: **`geez-art.art`** (readable, on-topic, almost certainly
available). Second choice: `geezart.art`.

---

## Option A — GitHub + Cloudflare Pages (recommended)

Cloudflare builds from your repo on every push, so you get continuous
deploys for free.

### 1. Put the project in git

The repo is initialized but nothing is committed yet — everything is still
untracked.

```bash
cd /c/Users/mike-work/Desktop/geez-art
git add -A
git commit -m "geez-art: initial commit — fidel letter art app"
```

### 2. Push to GitHub

Create a repo on GitHub and push:

```bash
# with the GitHub CLI:
gh repo create geez-art --public --source . --push

# or create the repo in the browser, then:
git remote add origin git@github.com:YOUR_USERNAME/geez-art.git
git push -u origin main
```

Keep the repo **public** so the app and its source are genuinely open — the
whole project is MIT-able and intentionally dependency-light.

### 3. Connect Cloudflare Pages

1. Go to the [Cloudflare dashboard](https://dash.cloudflare.com/) → **Workers
   & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Pick your GitHub account and the `geez-art` repo.
3. Build configuration:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - (If the build complains about Node version: add an environment variable
     `NODE_VERSION = 22` — the Vite 6 toolchain needs Node 18+.)
4. Click **Save and Deploy**. Your first build runs immediately and you get a
   live URL like `geez-art.pages.dev`.

Because the app is a single page with no client-side routing, no redirect
rules or SPA fallback configuration are needed — Cloudflare serves `dist/`
as-is.

### 4. Set a custom domain

1. In your Pages project → **Custom domains** → **Add custom domain**.
2. Enter `geez-art.art` (or whatever you registered).
3. If the domain is on Cloudflare's own registrar, DNS is handled
   automatically. Otherwise Cloudflare shows you a **CNAME target** (e.g.
   `geez-art.pages.dev`) — add a CNAME record at your registrar pointing your
   domain at that target.
4. **HTTPS is automatic.** Cloudflare issues and renews the certificate and
   redirects HTTP → HTTPS with no work on your part.

---

## Option B — Direct upload with wrangler (no GitHub)

Don't want a GitHub repo? Deploy the built `dist/` straight to Cloudflare
Pages with the wrangler CLI.

```bash
# one-time: log in
npx wrangler@latest login

# one-time: create the Pages project
npx wrangler@latest pages project create geez-art

# build, then deploy the output folder
npm run build
npx wrangler@latest pages deploy dist --project-name=geez-art
```

Notes:

- If `git` isn't clean, wrangler may refuse to guess the commit metadata —
  add `--commit-dirty=true` or commit first.
- You can later attach a custom domain from the dashboard as in step 4 above.
- To fully replace the previous deployment, add `--branch=main`.

---

## Every deploy, in one line (with CI)

If you want an even lighter path, the GitHub workflow file can be:

```yaml
on: push
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci && npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          command: pages deploy dist --project-name=geez-art
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

(Skip this if you chose the GitHub-connected Pages flow — Cloudflare builds
for you.)

---

## Analytics (optional — off by default, never a blocker)

geez·art sends nothing, anywhere, until you opt in. Analytics are read from a
single meta tag; with no tag present (the default) the app loads no analytics
script and calls nothing — the privacy promise "nothing is uploaded" holds out
of the box.

**IMPORTANT — the shipped CSP blocks cross-origin tracking by design.** The
`public/_headers` file sets `script-src 'self'` (via `default-src`) and
`connect-src 'self'`, so following the instructions below WITHOUT also editing
the CSP silently no-ops. When you enable a provider, apply the matching CSP
change in `public/_headers` at the same time:

- **Plausible** → allow the script host: replace `default-src 'self'` with
  `default-src 'self' https://plausible.io` (or add a `script-src` line
  `script-src 'self' https://plausible.io`).
- **Beacon** → allow the collector: add `connect-src 'self' https://stats.example.com`
  (your endpoint).

**Enable Plausible** (privacy-friendly, script-based, EU-hosted):
Add the Plausible script to `index.html` `<head>` and a config tag:

```html
<script defer data-domain="geez-art.art" src="https://plausible.io/js/script.js"></script>
<meta name="geez-art:analytics" content='{"provider":"plausible","domain":"geez-art.art"}'>
```

**Enable a self-hosted collector** (`beacon` — zero scripts, POSTs JSON
`{ "event", "props" }` via `navigator.sendBeacon` to any endpoint you control,
e.g. a Cloudflare Worker):

```html
<meta name="geez-art:analytics" content='{"provider":"beacon","endpoint":"https://stats.example.com/e"}'>
```

Events tracked: `source` (image|video), `share_started` / `share_success` /
`share_cancelled` / `share_downloaded`, `export` (png|gif|video|html|text),
`dropzone_opened`, `example_used`, `referral_visit {ref}`.

> **⚠️ Enabling analytics invalidates the shipped privacy copy.** The default
> page states "no server requests, no cookies, no tracking, nothing stored"
> (footer + `src/i18n.ts`). Adding any provider makes that copy inaccurate, so
> update the privacy notice (`index.html` / `i18n.ts`) in the SAME commit.
> **Plausible** records visitor IPs by default and its outbound-link tracking
> writes a persistent `plausible_events` localStorage identifier — see its
> proxy / `data-sharing-off` config. **COPPA:** the app has a children angle; if
> under-13s are a real audience, keep analytics off or gate on verifiable
> parental consent.

---

## Checklist before you deploy

- [ ] `npm run build` succeeds locally and `dist/` looks right with
      `npm run preview`.
- [ ] Fonts are bundled (they are — `@fontsource-variable/*` is installed, so
      the site works fully offline with no external font requests).
- [ ] The meta description and title are set in `index.html` (they are).
- [ ] Social copy and share assets are ready (see `social-copy.md`).
- [ ] If you registered a `.art`/`.com`, DNS has propagated before you
      announce the URL.

That's it. Total ongoing cost: your domain renewal only.
