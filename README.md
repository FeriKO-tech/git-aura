# Git-Aura — GitHub Stats Visualizer

Enter a GitHub username and Git-Aura turns the profile into a living 3D aura: pulse speed, colors, orbit rings, glow and particles are generated from public GitHub stats.

## MVP

- Username search with loading/error states
- Next.js API route for GitHub profile stats
- Dominant language → aura palette
- Commits → pulse speed
- Pull requests → orbit rings
- Stars/followers/repos → glow, halo and particles
- React Three Fiber scene with custom GLSL shader
- PNG, WebM and GIF export controls

## Tech stack

- Next.js 14 App Router
- React + TypeScript
- React Three Fiber + drei
- Tailwind CSS
- GitHub REST API
- GitHub OAuth
- Upstash Redis REST API with in-memory fallback
- Custom GLSL shader material
- MediaRecorder + gifenc for export

## Getting started

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to `.env.local` and fill only the variables you need.

### GitHub OAuth

Create a GitHub OAuth App:

- Local homepage URL: `http://localhost:3000`
- Local callback URL: `http://localhost:3000/api/auth/github/callback`

Then set:

```bash
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

For production, create a separate GitHub OAuth App with callback URL:

```txt
https://your-domain.vercel.app/api/auth/github/callback
```

### GitHub API token

Optional, but recommended for higher public API rate limits:

```bash
GITHUB_TOKEN=
```

### Persistent leaderboard

The leaderboard uses Upstash Redis if these variables are present:

```bash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

If they are missing, Git-Aura uses an in-memory fallback for local development.

## Project structure

```txt
src/
├── app/
│   ├── api/github/[username]/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── aura/
│   ├── export/
│   ├── GitAuraApp.tsx
│   ├── StatsPanel.tsx
│   └── UsernameForm.tsx
├── lib/
│   ├── aura-mapping.ts
│   ├── format.ts
│   ├── github.ts
│   └── record-gif.ts
└── types/
    ├── github.ts
    └── gifenc.d.ts
```

## Notes

Public GitHub API data has rate limits and some metrics are estimates. Add `GITHUB_TOKEN` in production for more stable requests.

## License

MIT License. See `LICENSE` for details.
