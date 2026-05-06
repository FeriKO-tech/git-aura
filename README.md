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
- Custom GLSL shader material
- MediaRecorder + gifenc for export

## Getting started

```bash
pnpm install
pnpm dev
```

Optional: copy `.env.example` to `.env.local` and set `GITHUB_TOKEN` to increase GitHub API rate limits.

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
