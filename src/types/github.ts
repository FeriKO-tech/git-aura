export type LanguageBreakdown = {
  name: string;
  bytes: number;
  color: string;
  percentage: number;
};

export type AuraMode = "aura" | "crystal" | "nebula" | "void";

export type AuraPreset = "cyberpunk" | "dark-fantasy" | "hologram";

export type AuraVisualOptions = {
  mode: AuraMode;
  preset: AuraPreset;
};

export type GitHubStats = {
  username: string;
  displayName: string | null;
  bio: string | null;
  profileUrl: string;
  avatarUrl: string;
  publicRepos: number;
  followers: number;
  following: number;
  createdAt: string;
  updatedAt: string;
  totalStars: number;
  totalForks: number;
  totalWatchers: number;
  totalOpenIssues: number;
  commitCount: number;
  pullRequestCount: number;
  dominantLanguage: string;
  languages: LanguageBreakdown[];
  apiWarnings: string[];
  dataScope: "public" | "authenticated";
};

export type AuraProfile = {
  username: string;
  languageLabel: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  pulseSpeed: number;
  ringCount: number;
  particleCount: number;
  glowIntensity: number;
  haloScale: number;
  turbulence: number;
  energyLevel: number;
};

export type LeaderboardEntry = {
  username: string;
  displayName: string | null;
  avatarUrl: string;
  languageLabel: string;
  primaryColor: string;
  energyLevel: number;
  pulseSpeed: number;
  glowIntensity: number;
  ringCount: number;
  particleCount: number;
  updatedAt: string;
};

export type LeaderboardResponse = {
  fastest: LeaderboardEntry[];
  brightest: LeaderboardEntry[];
  rarest: LeaderboardEntry[];
};
