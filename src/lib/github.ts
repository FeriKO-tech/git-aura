import type { GitHubStats, LanguageBreakdown } from "@/types/github";
import { LANGUAGE_PALETTES } from "./aura-mapping";

const GITHUB_API = "https://api.github.com";
const USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

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

  const [commitResult, pullRequestResult, languageBytes] = await Promise.all([
    searchTotal("commits", `author:${user.login}`, accessToken).catch(
      (error) => {
        warnings.push(
          error instanceof Error
            ? error.message
            : "Failed to fetch commit count",
        );
        return 0;
      },
    ),
    searchTotal("issues", `type:pr author:${user.login}`, accessToken).catch(
      (error) => {
        warnings.push(
          error instanceof Error
            ? error.message
            : "Failed to fetch pull request count",
        );
        return 0;
      },
    ),
    fetchLanguageBreakdown(repos, accessToken).catch((error) => {
      warnings.push(
        error instanceof Error
          ? error.message
          : "Failed to fetch language stats",
      );
      return new Map<string, number>();
    }),
  ]);

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
    commitCount: commitResult,
    pullRequestCount: pullRequestResult,
    dominantLanguage,
    languages,
    apiWarnings: warnings.slice(0, 4),
    dataScope: isAuthenticatedOwner ? "authenticated" : "public",
  };
}
