# SPOTlightIFY

A purely personal, ultra-precise Spotify listening dashboard — a permanent, more
refined "Wrapped". Static Astro site deployed to GitHub Pages.

This repo only ever ships **pre-aggregated statistics**, never raw per-play
timestamps. Raw data lives in the private [`spotlightify-data`](https://github.com/Nonowarwood/spotlightify-data)
repo and is combined here at build time — see `scripts/aggregate/`.

A lightweight client-side passphrase gate sits in front of the content
(`src/components/gate/`). It's a deterrent, not real security — see below.

## Local development

```bash
npm install
npm run fixture:build   # generates synthetic data, aggregates it, builds the site
npm run preview
```

Or, against real (checked-out) data from the private repo:

```bash
git clone https://github.com/Nonowarwood/spotlightify-data ../spotlightify-data-checkout
npm run aggregate -- --input ../spotlightify-data-checkout --output public/data
npm run dev
```

## Deployment (GitHub Actions)

`.github/workflows/build-deploy.yml` runs on a schedule (3×/day), on push to
`main`, and on demand. It checks out this repo plus the private data repo (via
`DATA_REPO_PAT`, a fine-grained PAT scoped to `spotlightify-data` with
`contents: read`), runs the aggregation pipeline, builds, and deploys via
GitHub Pages.

### One-time repo setup

1. Settings → Pages → Source = **GitHub Actions**.
2. Secrets:
   ```bash
   gh secret set DATA_REPO_PAT --repo Nonowarwood/SPOTlightIFY
   gh secret set PUBLIC_PASSPHRASE_HASH --repo Nonowarwood/SPOTlightIFY
   ```
   `DATA_REPO_PAT`: a fine-grained personal access token, scoped only to the
   `spotlightify-data` repo, `Contents: Read-only` permission.

   `PUBLIC_PASSPHRASE_HASH`: the SHA-256 hex digest of your chosen passphrase.
   Generate it with:
   ```bash
   printf '%s' 'your-passphrase-here' | shasum -a 256 | cut -d' ' -f1
   ```
   Astro inlines `PUBLIC_`-prefixed env vars into the client bundle at build
   time — the plaintext passphrase itself is never stored in either repo.

## Privacy model

- **Private repo** (`spotlightify-data`): raw per-play data, exact timestamps.
- **This repo**: only pre-bucketed aggregates (`scripts/aggregate/` enforces
  this with a build-time file-size tripwire — see `scripts/aggregate/index.ts`).
- **Passphrase gate**: an extra deterrent layer on top, acknowledged as not
  real security — the JSON files under `/data/` are still fetchable by direct
  URL by anyone who finds them. The real privacy boundary is the aggregate-only
  pipeline above.

## Pages

- `/` — Overview: total listening time, top artists/tracks/albums.
- `/trends/` — listening time trends over time.
- `/patterns/` — calendar heatmap + hour-of-day/day-of-week matrix.
- `/sound/` — genre breakdown, plus mood/energy analysis if the Spotify app
  has extended-quota access to `audio-features` (see `spotlightify-data`'s
  `scripts/spike-audio-features.ts`).
- `/records/` — streaks, skip rate, most-replayed tracks.
