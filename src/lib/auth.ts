import { cookies } from 'next/headers';

export const GITHUB_AUTH_COOKIE = 'git_aura_github_token';
export const GITHUB_AUTH_STATE_COOKIE = 'git_aura_oauth_state';

export function getGithubAccessToken(): string | undefined {
  return cookies().get(GITHUB_AUTH_COOKIE)?.value;
}

export function createOAuthState(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function githubOAuthConfigured(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}
