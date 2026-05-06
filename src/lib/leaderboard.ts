import type { AuraProfile, GitHubStats, LeaderboardEntry, LeaderboardResponse } from '@/types/github';

const MAX_ENTRIES = 80;

const seedEntries: LeaderboardEntry[] = [
  {
    username: 'torvalds',
    displayName: 'Linus Torvalds',
    avatarUrl: 'https://github.com/torvalds.png',
    languageLabel: 'C',
    primaryColor: '#7c8cff',
    energyLevel: 100,
    pulseSpeed: 3.6,
    glowIntensity: 2.2,
    ringCount: 7,
    particleCount: 1220,
    updatedAt: new Date(0).toISOString(),
  },
  {
    username: 'yyx990803',
    displayName: 'Evan You',
    avatarUrl: 'https://github.com/yyx990803.png',
    languageLabel: 'TypeScript',
    primaryColor: '#31d7ff',
    energyLevel: 91,
    pulseSpeed: 3.2,
    glowIntensity: 1.8,
    ringCount: 6,
    particleCount: 1180,
    updatedAt: new Date(0).toISOString(),
  },
  {
    username: 'sindresorhus',
    displayName: 'Sindre Sorhus',
    avatarUrl: 'https://github.com/sindresorhus.png',
    languageLabel: 'JavaScript',
    primaryColor: '#f7df1e',
    energyLevel: 94,
    pulseSpeed: 3.35,
    glowIntensity: 2.05,
    ringCount: 8,
    particleCount: 1320,
    updatedAt: new Date(0).toISOString(),
  },
];

const entries = new Map<string, LeaderboardEntry>(seedEntries.map((entry) => [entry.username.toLowerCase(), entry]));

function rareScore(entry: LeaderboardEntry): number {
  return entry.ringCount * 18 + entry.particleCount / 24 + entry.energyLevel * 0.7;
}

export function createLeaderboardEntry(stats: GitHubStats, aura: AuraProfile): LeaderboardEntry {
  return {
    username: stats.username,
    displayName: stats.displayName,
    avatarUrl: stats.avatarUrl,
    languageLabel: aura.languageLabel,
    primaryColor: aura.primaryColor,
    energyLevel: aura.energyLevel,
    pulseSpeed: aura.pulseSpeed,
    glowIntensity: aura.glowIntensity,
    ringCount: aura.ringCount,
    particleCount: aura.particleCount,
    updatedAt: new Date().toISOString(),
  };
}

export function submitLeaderboardEntry(entry: LeaderboardEntry) {
  entries.set(entry.username.toLowerCase(), entry);

  if (entries.size > MAX_ENTRIES) {
    const removable = Array.from(entries.values())
      .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
      .slice(0, entries.size - MAX_ENTRIES);

    for (const nextEntry of removable) {
      entries.delete(nextEntry.username.toLowerCase());
    }
  }
}

export function getLeaderboard(): LeaderboardResponse {
  const all = Array.from(entries.values());

  return {
    fastest: [...all].sort((a, b) => b.pulseSpeed - a.pulseSpeed).slice(0, 8),
    brightest: [...all].sort((a, b) => b.glowIntensity - a.glowIntensity).slice(0, 8),
    rarest: [...all].sort((a, b) => rareScore(b) - rareScore(a)).slice(0, 8),
  };
}
