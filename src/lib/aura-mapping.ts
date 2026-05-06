import type { AuraProfile, GitHubStats } from '@/types/github';
import { clamp } from './format';

export const LANGUAGE_PALETTES: Record<string, [string, string, string]> = {
  TypeScript: ['#31d7ff', '#2563eb', '#a855f7'],
  JavaScript: ['#f7df1e', '#ff9f1c', '#ffffff'],
  Java: ['#ff3b30', '#b91c1c', '#ffb86b'],
  Python: ['#4b8bbe', '#ffd43b', '#8be9fd'],
  Rust: ['#ff7a18', '#8b4513', '#ffd6a5'],
  Go: ['#00add8', '#0ea5e9', '#d8fbff'],
  C: ['#7c8cff', '#3949ab', '#f8fafc'],
  'C++': ['#9c6bff', '#6d28d9', '#f0abfc'],
  'C#': ['#9b4dca', '#68217a', '#f5d0fe'],
  PHP: ['#8892bf', '#4f5b93', '#e0e7ff'],
  Ruby: ['#cc342d', '#8b0000', '#ffd1d1'],
  Swift: ['#ff6f3c', '#f05138', '#ffe4d6'],
  Kotlin: ['#a97bff', '#7f52ff', '#ff8a00'],
  Dart: ['#00b4ab', '#0175c2', '#b2ffff'],
  CSS: ['#38bdf8', '#1d4ed8', '#f0f9ff'],
  HTML: ['#ff5722', '#e34c26', '#fff1e8'],
  Vue: ['#42b883', '#35495e', '#d1fae5'],
  Shell: ['#a3e635', '#4d7c0f', '#ecfccb'],
  Unknown: ['#9d7bff', '#31d7ff', '#ff4d7d'],
};

function paletteFor(language: string): [string, string, string] {
  return LANGUAGE_PALETTES[language] ?? LANGUAGE_PALETTES.Unknown;
}

function logScale(value: number, divisor: number, min: number, max: number): number {
  return clamp(Math.log10(value + 1) / divisor, min, max);
}

export function mapStatsToAura(stats: GitHubStats): AuraProfile {
  const [primaryColor, secondaryColor, accentColor] = paletteFor(stats.dominantLanguage || 'Unknown');
  const commitCharge = logScale(stats.commitCount, 3.2, 0, 1);
  const starCharge = logScale(stats.totalStars, 3.4, 0, 1);
  const followerCharge = logScale(stats.followers, 3.2, 0, 1);
  const repoCharge = logScale(stats.publicRepos, 2.3, 0, 1);
  const prCharge = logScale(stats.pullRequestCount, 2.6, 0, 1);

  const ringCount = clamp(Math.round(1 + prCharge * 7), 1, 8);
  const particleCount = Math.round(clamp(420 + repoCharge * 540 + starCharge * 360, 420, 1320));
  const energyLevel = Math.round(clamp((commitCharge * 0.36 + prCharge * 0.22 + starCharge * 0.2 + followerCharge * 0.14 + repoCharge * 0.08) * 100, 8, 100));

  return {
    username: stats.username,
    languageLabel: stats.dominantLanguage || 'Unknown',
    primaryColor,
    secondaryColor,
    accentColor,
    pulseSpeed: Number((0.75 + commitCharge * 2.85).toFixed(2)),
    ringCount,
    particleCount,
    glowIntensity: Number((0.55 + starCharge * 1.65).toFixed(2)),
    haloScale: Number((1.15 + followerCharge * 0.95).toFixed(2)),
    turbulence: Number((0.22 + commitCharge * 0.58 + repoCharge * 0.24).toFixed(2)),
    energyLevel,
  };
}
