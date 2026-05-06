import { NextResponse } from 'next/server';
import { getGithubAccessToken, githubOAuthConfigured } from '@/lib/auth';

export const runtime = 'nodejs';

type GitHubViewer = {
  login: string;
  avatar_url: string;
  html_url: string;
};

export async function GET() {
  const token = getGithubAccessToken();

  if (!token) {
    return NextResponse.json({ configured: githubOAuthConfigured(), authenticated: false });
  }

  const viewerResponse = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    next: { revalidate: 0 },
  });

  if (!viewerResponse.ok) {
    return NextResponse.json({ configured: githubOAuthConfigured(), authenticated: false, expired: true });
  }

  const viewer = (await viewerResponse.json()) as GitHubViewer;
  return NextResponse.json({ configured: githubOAuthConfigured(), authenticated: true, viewer });
}
