import type {
  AuraProfile,
  GitHubStats,
  LeaderboardEntry,
  LeaderboardResponse,
} from "@/types/github";

const MAX_ENTRIES = 80;
const TOP_ENTRIES = 8;
const ENTRY_PREFIX = "git-aura:leaderboard:entry";
const FASTEST_KEY = "git-aura:leaderboard:fastest";
const BRIGHTEST_KEY = "git-aura:leaderboard:brightest";
const RAREST_KEY = "git-aura:leaderboard:rarest";

const seedEntries: LeaderboardEntry[] = [
  {
    username: "torvalds",
    displayName: "Linus Torvalds",
    avatarUrl: "https://github.com/torvalds.png",
    languageLabel: "C",
    primaryColor: "#7c8cff",
    energyLevel: 100,
    pulseSpeed: 3.6,
    glowIntensity: 2.2,
    ringCount: 7,
    particleCount: 1220,
    updatedAt: new Date(0).toISOString(),
  },
  {
    username: "yyx990803",
    displayName: "Evan You",
    avatarUrl: "https://github.com/yyx990803.png",
    languageLabel: "TypeScript",
    primaryColor: "#31d7ff",
    energyLevel: 91,
    pulseSpeed: 3.2,
    glowIntensity: 1.8,
    ringCount: 6,
    particleCount: 1180,
    updatedAt: new Date(0).toISOString(),
  },
  {
    username: "sindresorhus",
    displayName: "Sindre Sorhus",
    avatarUrl: "https://github.com/sindresorhus.png",
    languageLabel: "JavaScript",
    primaryColor: "#f7df1e",
    energyLevel: 94,
    pulseSpeed: 3.35,
    glowIntensity: 2.05,
    ringCount: 8,
    particleCount: 1320,
    updatedAt: new Date(0).toISOString(),
  },
];

const memoryEntries = new Map<string, LeaderboardEntry>(
  seedEntries.map((entry) => [entry.username.toLowerCase(), entry]),
);

type UpstashResult<T> = {
  result?: T;
  error?: string;
};

function entryKey(username: string): string {
  return `${ENTRY_PREFIX}:${username.toLowerCase()}`;
}

function rareScore(entry: LeaderboardEntry): number {
  return (
    entry.ringCount * 18 + entry.particleCount / 24 + entry.energyLevel * 0.7
  );
}

function redisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

async function redisCommand<T>(command: Array<string | number>): Promise<T> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("Upstash Redis is not configured");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  const payload = (await response.json()) as UpstashResult<T>;

  if (!response.ok || payload.error) {
    throw new Error(payload.error ?? "Upstash Redis request failed");
  }

  return payload.result as T;
}

function parseEntry(raw: unknown): LeaderboardEntry | null {
  if (!raw) return null;

  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as LeaderboardEntry;
    } catch {
      return null;
    }
  }

  if (typeof raw === "object") return raw as LeaderboardEntry;
  return null;
}

function buildLeaderboard(entries: LeaderboardEntry[]): LeaderboardResponse {
  return {
    fastest: [...entries]
      .sort((a, b) => b.pulseSpeed - a.pulseSpeed)
      .slice(0, TOP_ENTRIES),
    brightest: [...entries]
      .sort((a, b) => b.glowIntensity - a.glowIntensity)
      .slice(0, TOP_ENTRIES),
    rarest: [...entries]
      .sort((a, b) => rareScore(b) - rareScore(a))
      .slice(0, TOP_ENTRIES),
  };
}

async function getRedisBoard(key: string): Promise<LeaderboardEntry[]> {
  const usernames = await redisCommand<string[]>([
    "ZREVRANGE",
    key,
    0,
    TOP_ENTRIES - 1,
  ]);
  const entries = await Promise.all(
    usernames.map((username) =>
      redisCommand<unknown>(["GET", entryKey(username)])
        .then(parseEntry)
        .catch(() => null),
    ),
  );
  return entries.filter((entry): entry is LeaderboardEntry => Boolean(entry));
}

async function getRedisLeaderboard(): Promise<LeaderboardResponse> {
  const [fastest, brightest, rarest] = await Promise.all([
    getRedisBoard(FASTEST_KEY),
    getRedisBoard(BRIGHTEST_KEY),
    getRedisBoard(RAREST_KEY),
  ]);

  if (fastest.length === 0 && brightest.length === 0 && rarest.length === 0) {
    return buildLeaderboard(seedEntries);
  }

  return { fastest, brightest, rarest };
}

async function submitRedisEntry(entry: LeaderboardEntry) {
  const username = entry.username.toLowerCase();
  const encodedEntry = JSON.stringify(entry);

  await Promise.all([
    redisCommand(["SET", entryKey(username), encodedEntry]),
    redisCommand(["ZADD", FASTEST_KEY, entry.pulseSpeed, username]),
    redisCommand(["ZADD", BRIGHTEST_KEY, entry.glowIntensity, username]),
    redisCommand(["ZADD", RAREST_KEY, rareScore(entry), username]),
  ]);

  const lowestScoresOutsideTop = -(MAX_ENTRIES + 1);

  await Promise.all([
    redisCommand(["ZREMRANGEBYRANK", FASTEST_KEY, 0, lowestScoresOutsideTop]),
    redisCommand(["ZREMRANGEBYRANK", BRIGHTEST_KEY, 0, lowestScoresOutsideTop]),
    redisCommand(["ZREMRANGEBYRANK", RAREST_KEY, 0, lowestScoresOutsideTop]),
  ]).catch(() => undefined);
}

export function createLeaderboardEntry(
  stats: GitHubStats,
  aura: AuraProfile,
): LeaderboardEntry {
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

export async function submitLeaderboardEntry(entry: LeaderboardEntry) {
  if (redisConfigured()) {
    await submitRedisEntry(entry);
    return;
  }

  memoryEntries.set(entry.username.toLowerCase(), entry);

  if (memoryEntries.size > MAX_ENTRIES) {
    const removable = Array.from(memoryEntries.values())
      .sort(
        (a, b) =>
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      )
      .slice(0, memoryEntries.size - MAX_ENTRIES);

    for (const nextEntry of removable) {
      memoryEntries.delete(nextEntry.username.toLowerCase());
    }
  }
}

export async function getLeaderboard(): Promise<LeaderboardResponse> {
  if (redisConfigured()) {
    try {
      return await getRedisLeaderboard();
    } catch {
      return buildLeaderboard(Array.from(memoryEntries.values()));
    }
  }

  return buildLeaderboard(Array.from(memoryEntries.values()));
}
