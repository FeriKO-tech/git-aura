# Git-Aura — GitHub Stats Visualizer

Git-Aura turns any GitHub profile into a living 3D aura. Enter a username and the app maps public developer stats into color, pulse speed, glow, orbit rings, particles and shareable media.

> Status: feature-complete MVP + stretch goals. Production deployment and demo media are the remaining polish steps.

## What it does

- Username search with loading and error states
- Shareable profile route: `/u/[username]`
- GitHub stats API route: `/api/github/[username]`
- GitHub OAuth for authenticated owner scans
- Dominant language detection and language-based color palettes
- React Three Fiber scene with a custom GLSL aura shader
- Entity modes: `aura`, `crystal`, `nebula`, `void`
- Visual presets: `cyberpunk`, `dark-fantasy`, `hologram`
- Pull request based orbit rings
- Yearly commit contribution based pulse speed
- Stars/followers/repos based glow, halo and particles
- Stats panel with language breakdown
- Aura battle mode for comparing two GitHub profiles
- Leaderboard for fastest, brightest and rarest auras
- Persistent leaderboard via Upstash Redis with in-memory fallback
- Dynamic Open Graph image for shareable user pages
- Export controls for PNG, WebM and GIF

## Visual mapping

| GitHub stat | Aura output |
| --- | --- |
| Commit contributions, last 365 days | Pulse speed and shader turbulence |
| Pull request contributions, last 365 days | Orbit ring count |
| Dominant language | Primary color palette |
| Stars | Glow intensity |
| Followers | Halo scale |
| Public repositories | Particle density |
| Overall activity | Energy score |

## Tech stack

- Next.js 14 App Router
- React + TypeScript
- React Three Fiber
- drei
- Three.js
- Tailwind CSS
- GitHub REST API
- GitHub OAuth
- Upstash Redis REST API with in-memory fallback
- Custom GLSL shader material
- MediaRecorder + gifenc for export

## Getting started

Install dependencies:

```bash
pnpm install
```

Create local env file:

```bash
cp .env.example .env.local
```

Run the app:

```bash
pnpm dev
```

Open:

```txt
http://localhost:3000
```

If you are running from the parent workspace folder, use:

```bash
pnpm --dir git-aura dev
```

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GITHUB_CLIENT_ID` | Optional | GitHub OAuth client id for private owner scans |
| `GITHUB_CLIENT_SECRET` | Optional | GitHub OAuth client secret |
| `GITHUB_TOKEN` | Optional | Raises public GitHub API rate limits for server-side requests |
| `UPSTASH_REDIS_REST_URL` | Optional | Enables persistent leaderboard storage |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Upstash Redis REST token |

Git-Aura uses GitHub GraphQL contribution stats for commit/PR contribution counts when a token is available, so displayed contribution metrics are scoped to the last 365 days instead of global GitHub search totals.

The app works without env variables, but with limitations:

- without GitHub OAuth, authenticated private owner scans are disabled;
- without `GITHUB_TOKEN`, public GitHub API rate limits are lower;
- without Upstash Redis, leaderboard falls back to in-memory storage.

## GitHub OAuth setup

Create a GitHub OAuth App for local development:

- Application name: `Git-Aura Local`
- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/github/callback`
- Device Flow: disabled

Then set:

```bash
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

For production, create a separate GitHub OAuth App with your deployed domain:

```txt
https://your-domain.vercel.app/api/auth/github/callback
```

The OAuth route requests `read:user repo` scope so the authenticated owner can include private repositories in their own aura scan.

## Upstash Redis leaderboard

The leaderboard automatically uses Upstash Redis when both variables are present:

```bash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

If these variables are missing, the app uses an in-memory fallback. That fallback is useful locally but is not persistent across server restarts or serverless instances.

## Available routes

| Route | Purpose |
| --- | --- |
| `/` | Main Git-Aura app |
| `/u/[username]` | Shareable user aura page |
| `/u/[username]/opengraph-image` | Dynamic social preview image |
| `/api/github/[username]` | GitHub stats + aura profile API |
| `/api/leaderboard` | Leaderboard GET/POST API |
| `/api/auth/github/start` | Start GitHub OAuth |
| `/api/auth/github/callback` | GitHub OAuth callback |
| `/api/auth/github/status` | OAuth status check |
| `/api/auth/github/logout` | Clear OAuth cookie |

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start local Next.js dev server |
| `pnpm build` | Build production app |
| `pnpm start` | Start production server |
| `pnpm lint` | Run Next.js lint |
| `pnpm typecheck` | Run TypeScript typecheck |

## Project structure

```txt
src/
├── app/
│   ├── api/
│   │   ├── auth/github/
│   │   ├── github/[username]/route.ts
│   │   └── leaderboard/route.ts
│   ├── u/[username]/
│   │   ├── opengraph-image.tsx
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── aura/
│   ├── battle/
│   ├── export/
│   ├── leaderboard/
│   ├── oauth/
│   ├── visual/
│   ├── GitAuraApp.tsx
│   ├── StatsPanel.tsx
│   └── UsernameForm.tsx
├── lib/
│   ├── aura-mapping.ts
│   ├── aura-visuals.ts
│   ├── auth.ts
│   ├── format.ts
│   ├── github.ts
│   ├── leaderboard.ts
│   └── record-gif.ts
└── types/
    ├── gifenc.d.ts
    └── github.ts
```

## Deployment checklist

1. Import `FeriKO-tech/git-aura` into Vercel.
2. Set framework preset to Next.js.
3. Add production env variables in Vercel Project Settings.
4. Create a production GitHub OAuth App with the Vercel callback URL.
5. Add production OAuth credentials to Vercel.
6. Redeploy.
7. Test `/api/auth/github/status`, `/api/leaderboard` and `/u/[username]`.
8. Add the final live demo URL to this README.

## Security notes

- Do not commit `.env.local`.
- `GITHUB_CLIENT_SECRET`, `GITHUB_TOKEN` and `UPSTASH_REDIS_REST_TOKEN` are secrets.
- Rotate secrets immediately if they are exposed in screenshots, logs or chat.
- OAuth tokens are stored in an `httpOnly` cookie.
- Public GitHub API data has rate limits and some metrics are estimates.

## Roadmap polish

The functional roadmap is complete. Recommended polish before promoting the repo:

- Add a live Vercel demo link.
- Add a screenshot or GIF preview to the top of this README.
- Rotate any secrets that were exposed during local setup.
- Add GitHub repo topics: `nextjs`, `threejs`, `react-three-fiber`, `github-api`, `glsl`, `webgl`, `portfolio`.

## License

MIT License. See `LICENSE` for details.
