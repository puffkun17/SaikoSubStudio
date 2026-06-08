# SaikoSubStudio

A browser-based tool for aligning, merging, and styling bilingual subtitles, with a cinema-style preview simulator.

## Features

- Align and merge two subtitle tracks (e.g. original dialogue + translation or lyrics) using sequence alignment.
- Automatically classify segments as dialogue, notes/comments, or lyrics.
- Edit timing, merge lines, and apply ASS-compatible styles (font, size, color, outline, position).
- Preview subtitles overlaid on video in different aspect ratios (16:9, 2.39:1, 4:3, 1.9:1, etc.) and lighting environments.
- Export to ASS or SRT format.

The alignment and preview logic runs client-side. The tool does not perform speech-to-text or automatic transcription.

## Getting Started

```bash
git clone https://github.com/puffkun17/SaikoSubStudio.git
cd SaikoSubStudio
npm install
npm run dev
```

Open http://localhost:3000.

Basic workflow:
1. Load source subtitle file(s).
2. Review and adjust alignment in the workbench.
3. Preview in the theater simulator and export.

## Tech Stack

- Next.js (App Router)
- React 19 + TypeScript
- Zustand
- Framer Motion
- Tailwind CSS

## Version Notes / Releases

**v1.0.1** (2025-06 local release)
- Local version with newer feature iterations and refinements, extracted and integrated from the NAS SaikoBasement 1.0beta deployment (source: NAS `/volume1/web/saikobasement_prod`).
- Includes cleanup of sync backup files and dev artifacts for cleaner GitHub/CF Pages state.
- This is the active development line going forward. The full SaikoBasement remains only as static site on Synology NAS for archival/remote reference. Local PlayGround/SaikoBasement copy archived/removed from dev workspace.

**Downgraded for Cloudflare compatibility**: Next.js has been temporarily downgraded to 15.5.2 (from 16.x) because `@cloudflare/next-on-pages` (as of v1.13.x) has a peer dependency that only supports Next.js <= 15.5.2.

**Reminder**: When a newer version of `@cloudflare/next-on-pages` with proper Next.js 16+ support is released, upgrade back to the latest Next.js and remove any legacy-peer-deps workarounds.

## About the `.vercel` output directory

You do **not** need a Vercel account or host anything on Vercel.

- `npm run pages:build` runs `@cloudflare/next-on-pages`, which produces a deployment bundle in `.vercel/output/static`.
- This is the **standard artifact format** that Cloudflare Pages + Wrangler expects for Next.js apps.
- We then deploy with `wrangler pages deploy .vercel/output/static --project-name=...` (pure Cloudflare).
- `.vercel/` is gitignored and is just a build output — you can safely ignore it or delete it after deployment.
- The actual runtime is Cloudflare Pages (static assets + Edge Functions for the TMDB proxy).

This setup gives you the "NAS style" experience on the edge: configure APIs once on the host → automatic for all visitors.

## TMDB API & "后台" / Server-side Configuration (NAS-like experience)

The app needs a TMDB v3 API key for:
- Searching movie/TV metadata when loading subtitles.
- Fetching backdrops and episode stills ("剧照" pool) used as dynamic backgrounds in the Theater preview.
- "换张剧照" (shuffle stills) feature.

### Public Open-Source Version (recommended for the public GitHub branch)
- **No API keys are hardcoded or bundled** in the code (this is the public open-source experience).
- A server-side proxy (`/api/tmdb/[...path]`) is included so the key never leaves the server.
- **Configuration guide (self-host / open source):**
  1. Get a free TMDB v3 key: https://www.themoviedb.org/settings/api (sign up → API).
  2. For local dev: Copy `.env.example` → `.env.local` and set `TMDB_API_KEY=your_key`.
  3. For your own Cloudflare Pages deployment (self-host):
     - Deploy the code.
     - In the Cloudflare Pages dashboard for your project: Settings → Environment variables → Add `TMDB_API_KEY` (mark as secret).
  4. Fixed assets (preset scene backgrounds for "模拟场景" buttons when no TMDB data is loaded) are included in `public/` as `scene_portrait.png`, `scene_nature.png`, `scene_night.png` (plus TV bezel frames `tv-*.png`). They are static and always available.
  5. The client UI no longer asks end-users to enter a key.

See also `docs/预览场景与剧照机制.md` for technical details.

### Hosted Closed-Source Version (your private CF Pages deployment with built-in APIs)
- Use the **same codebase**.
- You (the maintainer) pre-configure the real TMDB key (and any future APIs) as a secret environment variable in **your** Cloudflare Pages project dashboard.
- Once set, **all visitors** to your hosted site get the full "NAS style" seamless experience:
  - TMDB search, metadata, and 剧照/stills work automatically.
  - No per-user key entry, no client-side prompts.
  - Fixed/preset scene images + TV frames are always served as static assets.
- This is exactly like the original NAS setup: configure the APIs **once on the host** → automatic fetching for everyone.
- "我提供你": You provide the actual key values in the CF Pages Environment variables / secrets. The public code stays clean (no keys committed).

**How to set on CF Pages (for the hosted version):**
- Go to your Pages project → Settings → Environment variables.
- Add `TMDB_API_KEY` (Production + Preview if desired) and paste your key. Mark it secret.
- Redeploy (or let the CI do it).

The proxy route will read `process.env.TMDB_API_KEY` at runtime on the edge.

This gives a complete, polished experience for end users of the hosted site while keeping the public open-source repo clean and documented.

## Deployment on Cloudflare Pages (both versions)

This project is set up for Cloudflare Pages (no Vercel hosting required).

**Build settings:**
- Build command: `npm ci && npm run pages:build`
- Build output directory: `.vercel/output/static`

### Local / Manual Deploy
See the sections above for token vs API key differences. For TMDB specifically, use the environment variable approach described in the "TMDB API & 后台" section.

**Easiest way (recommended for local development):**
```bash
npx wrangler login          # One-time browser login (for CF token if needed)
npm run deploy:pages
```

**Using an API token (for scripts or CI-like local runs):**
```bash
export CLOUDFLARE_API_TOKEN=你的token值
export CLOUDFLARE_ACCOUNT_ID=你的账号ID     # strongly recommended
npm run deploy:pages
```

Manual one-liner:
```bash
npm run pages:build && npx wrangler pages deploy .vercel/output/static --project-name=saikosubstudio
```

**Note:** The `pages:build` step works without any token. The token is only required for the actual `wrangler pages deploy` upload.

Local preview (no deploy, no token needed):
```bash
npm run pages:build
npm run preview
```

### Automated Deploy (recommended)
- Push to `main` (or use "Run workflow" in GitHub Actions tab) triggers `.github/workflows/deploy.yml`
- Requires a repository secret named `CLOUDFLARE_API_TOKEN` (for the GitHub Action to deploy to your Pages project).
  The token **must** have at minimum these permissions:
  - **User → User Details → Read**
  - **Account → Pages → Edit** (strongly recommended to scope it to the specific account)

  "Pages:Edit" alone is frequently **not enough** — Wrangler calls the `/memberships` endpoint which requires the User Details Read permission.

  **How to create the correct token**:
  1. Go to https://dash.cloudflare.com/profile/api-tokens
  2. "Create Custom token"
  3. Add the two permissions above
  4. Under Account Resources, select **only the account** that owns the Pages project (avoid "All accounts")
  5. Create the token and copy it
  6. In this repo: Settings → Secrets and variables → Actions → New repository secret named `CLOUDFLARE_API_TOKEN`

  **Optional but recommended**: Also add a secret called `CLOUDFLARE_ACCOUNT_ID` (visible in the left sidebar of the Cloudflare dashboard). The workflow will use it automatically and authentication becomes more stable.

See the workflow file for details and customization (e.g. preview deployments on PRs).

For the **hosted closed-source version**, you additionally set `TMDB_API_KEY` (and future API keys) as environment variables/secrets directly in the Cloudflare Pages dashboard for that project (not in this repo). This is what gives the "configure once on the host, automatic for users" experience.

## License

MIT
# Manual deploy trigger - Sun  7 Jun 2026 03:02:38 HKT
