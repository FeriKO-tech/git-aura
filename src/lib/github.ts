import type { GitHubStats, LanguageBreakdown } from "@/types/github";
import { LANGUAGE_PALETTES } from "./aura-mapping";

const GITHUB_API = "https://api.github.com";
const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";
const USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
const CONTRIBUTION_WINDOW_DAYS = 365;

type GitHubUserResponse = {
  login: string;
  name: string | null;
  bio: string | null;
  html_url: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
};

type GitHubRepoResponse = {
  name: string;
  full_name: string;
  fork: boolean;
  language: string | null;
  size: number;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  pushed_at: string | null;
};

type SearchResponse = {
  total_count: number;
};

type ContributionStats = {
  commitCount: number;
  pullRequestCount: number;
  source: "graphql" | "search-fallback";
};

type ContributionsGraphQLResponse = {
  user: {
    contributionsCollection: {
      totalCommitContributions: number;
      totalPullRequestContributions: number;
      restrictedContributionsCount: number;
      contributionCalendar: {
        totalContributions: number;
      };
    };
  } | null;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

function headers(extra?: HeadersInit, accessToken?: string): HeadersInit {
  const base: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "git-aura",
  };

  const token = accessToken ?? process.env.GITHUB_TOKEN;

  if (token) {
    base.Authorization = `Bearer ${token}`;
  }

  return {
    ...base,
    ...(extra ?? {}),
  };
}

async function githubFetch<T>(
  path: string,
  extraHeaders?: HeadersInit,
  accessToken?: string,
): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: headers(extraHeaders, accessToken),
    next: { revalidate: 600 },
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    const message = details
      ? `GitHub request failed: ${details}`
      : "GitHub request failed";
    throw new GitHubApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

async function githubGraphql<T>(
  query: string,
  variables: Record<string, unknown>,
  accessToken?: string,
): Promise<T> {
  const token = accessToken ?? process.env.GITHUB_TOKEN;

  if (!token) {
    throw new GitHubApiError(
      "GitHub GraphQL requires GITHUB_TOKEN or OAuth token",
      401,
    );
  }

  const response = await fetch(GITHUB_GRAPHQL_API, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "git-aura",
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 600 },
  });

  const payload = (await response.json()) as GraphQLResponse<T>;

  if (!response.ok || payload.errors?.length) {
    throw new GitHubApiError(
      payload.errors?.map((error) => error.message).join("; ") ||
        "GitHub GraphQL request failed",
      response.status,
    );
  }

  if (!payload.data) {
    throw new GitHubApiError(
      "GitHub GraphQL response did not include data",
      502,
    );
  }

  return payload.data;
}

function buildSearchPath(
  endpoint: "commits" | "issues",
  query: string,
): string {
  const params = new URLSearchParams({
    q: query,
    per_page: "1",
  });

  return `/search/${endpoint}?${params.toString()}`;
}

async function searchTotal(
  endpoint: "commits" | "issues",
  query: string,
  accessToken?: string,
): Promise<number> {
  const accept =
    endpoint === "commits"
      ? { Accept: "application/vnd.github.cloak-preview+json" }
      : undefined;
  const data = await githubFetch<SearchResponse>(
    buildSearchPath(endpoint, query),
    accept,
    accessToken,
  );
  return data.total_count;
}

function contributionWindow() {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - CONTRIBUTION_WINDOW_DAYS);

  return {
    from,
    to,
    sinceDate: from.toISOString().slice(0, 10),
  };
}

async function fetchContributionStats(
  login: string,
  accessToken?: string,
): Promise<ContributionStats> {
  const { from, to } = contributionWindow();
  const data = await githubGraphql<ContributionsGraphQLResponse>(
    `query GitAuraContributions($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
          totalPullRequestContributions
          restrictedContributionsCount
          contributionCalendar {
            totalContributions
          }
        }
      }
    }`,
    {
      login,
      from: from.toISOString(),
      to: to.toISOString(),
    },
    accessToken,
  );

  if (!data.user) {
    throw new GitHubApiError("GitHub GraphQL user not found", 404);
  }

  return {
    commitCount: data.user.contributionsCollection.totalCommitContributions,
    pullRequestCount:
      data.user.contributionsCollection.totalPullRequestContributions,
    source: "graphql",
  };
}

async function fetchContributionStatsFallback(
  login: string,
  accessToken?: string,
): Promise<ContributionStats> {
  const { sinceDate } = contributionWindow();
  const [commitCount, pullRequestCount] = await Promise.all([
    searchTotal(
      "commits",
      `author:${login} author-date:>=${sinceDate}`,
      accessToken,
    ),
    searchTotal(
      "issues",
      `type:pr author:${login} created:>=${sinceDate}`,
      accessToken,
    ),
  ]);

  return {
    commitCount: Math.min(commitCount, 100000),
    pullRequestCount: Math.min(pullRequestCount, 100000),
    source: "search-fallback",
  };
}

async function fetchLanguageBreakdown(
  repos: GitHubRepoResponse[],
  accessToken?: string,
): Promise<Map<string, number>> {
  const languageBytes = new Map<string, number>();
  const interestingRepos = repos
    .filter((repo) => !repo.fork)
    .sort((a, b) => b.stargazers_count + b.size - (a.stargazers_count + a.size))
    .slice(0, 14);

  const languageResponses = await Promise.allSettled(
    interestingRepos.map((repo) =>
      githubFetch<Record<string, number>>(
        `/repos/${repo.full_name}/languages`,
        undefined,
        accessToken,
      ),
    ),
  );

  for (const result of languageResponses) {
    if (result.status !== "fulfilled") continue;

    for (const [language, bytes] of Object.entries(result.value)) {
      languageBytes.set(language, (languageBytes.get(language) ?? 0) + bytes);
    }
  }

  if (languageBytes.size > 0) return languageBytes;

  for (const repo of repos) {
    if (!repo.language) continue;
    languageBytes.set(
      repo.language,
      (languageBytes.get(repo.language) ?? 0) + Math.max(1, repo.size) * 1024,
    );
  }

  return languageBytes;
}

function languageColor(language: string): string {
  return LANGUAGE_PALETTES[language]?.[0] ?? LANGUAGE_PALETTES.Unknown[0];
}

function toLanguageBreakdown(
  languageBytes: Map<string, number>,
): LanguageBreakdown[] {
  const total = Array.from(languageBytes.values()).reduce(
    (sum, bytes) => sum + bytes,
    0,
  );

  if (total <= 0) return [];

  return Array.from(languageBytes.entries())
    .map(([name, bytes]) => ({
      name,
      bytes,
      color: languageColor(name),
      percentage: (bytes / total) * 100,
    }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 8);
}

export async function getGithubStats(
  rawUsername: string,
  accessToken?: string,
): Promise<GitHubStats> {
  const username = rawUsername.trim();

  if (!USERNAME_RE.test(username)) {
    throw new GitHubApiError("Invalid GitHub username", 400);
  }

  let authenticatedLogin: string | null = null;
  if (accessToken) {
    authenticatedLogin = await githubFetch<GitHubUserResponse>(
      "/user",
      undefined,
      accessToken,
    )
      .then((user) => user.login)
      .catch(() => null);
  }

  const isAuthenticatedOwner =
    authenticatedLogin?.toLowerCase() === username.toLowerCase();
  const [user, repos] = await Promise.all([
    isAuthenticatedOwner
      ? githubFetch<GitHubUserResponse>("/user", undefined, accessToken)
      : githubFetch<GitHubUserResponse>(
          `/users/${encodeURIComponent(username)}`,
          undefined,
          accessToken,
        ),
    isAuthenticatedOwner
      ? githubFetch<GitHubRepoResponse[]>(
          "/user/repos?visibility=all&affiliation=owner&sort=pushed&per_page=100",
          undefined,
          accessToken,
        )
      : githubFetch<GitHubRepoResponse[]>(
          `/users/${encodeURIComponent(username)}/repos?type=owner&sort=pushed&per_page=100`,
          undefined,
          accessToken,
        ),
  ]);

  const warnings: string[] = [];
  if (accessToken && !isAuthenticatedOwner) {
    warnings.push(
      "OAuth token is active, but private stats are available only for the authenticated owner profile.",
    );
  }

  const [contributionStats, languageBytes] = await Promise.all([
    fetchContributionStats(user.login, accessToken).catch(async (error) => {
      warnings.push(
        error instanceof Error
          ? `GraphQL contribution stats unavailable: ${error.message}`
          : "GraphQL contribution stats unavailable",
      );

      return fetchContributionStatsFallback(user.login, accessToken).catch(
        (fallbackError) => {
          warnings.push(
            fallbackError instanceof Error
              ? `Search contribution fallback unavailable: ${fallbackError.message}`
              : "Search contribution fallback unavailable",
          );

          return {
            commitCount: 0,
            pullRequestCount: 0,
            source: "search-fallback" as const,
          };
        },
      );
    }),
    fetchLanguageBreakdown(repos, accessToken).catch((error) => {
      warnings.push(
        error instanceof Error
          ? error.message
          : "Failed to fetch language stats",
      );
      return new Map<string, number>();
    }),
  ]);

  if (contributionStats.source === "search-fallback") {
    warnings.push(
      "Contribution counts are using capped Search API fallback for the last 365 days.",
    );
  }

  const languages = toLanguageBreakdown(languageBytes);
  const dominantLanguage = languages[0]?.name ?? "Unknown";

  return {
    username: user.login,
    displayName: user.name,
    bio: user.bio,
    profileUrl: user.html_url,
    avatarUrl: user.avatar_url,
    publicRepos: user.public_repos,
    followers: user.followers,
    following: user.following,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    totalStars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
    totalForks: repos.reduce((sum, repo) => sum + repo.forks_count, 0),
    totalWatchers: repos.reduce((sum, repo) => sum + repo.watchers_count, 0),
    totalOpenIssues: repos.reduce(
      (sum, repo) => sum + repo.open_issues_count,
      0,
    ),
    commitCount: contributionStats.commitCount,
    pullRequestCount: contributionStats.pullRequestCount,
    dominantLanguage,
    languages,
    apiWarnings: warnings.slice(0, 4),
    dataScope: isAuthenticatedOwner ? "authenticated" : "public",
  };
}
