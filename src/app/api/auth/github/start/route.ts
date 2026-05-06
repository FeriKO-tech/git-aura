import { NextResponse } from 'next/server';
import { createOAuthState, GITHUB_AUTH_STATE_COOKIE, githubOAuthConfigured } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  if (!githubOAuthConfigured()) {
    return NextResponse.json(
      { error: 'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.' },
      { status: 501 },
    );
  }

  const url = new URL(request.url);
  const state = createOAuthState();
  const redirectUri = `${url.origin}/api/auth/github/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID ?? '',
    redirect_uri: redirectUri,
    scope: 'read:user repo',
    state,
    allow_signup: 'false',
  });

  const response = NextResponse.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
  response.cookies.set(GITHUB_AUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    path: '/',
  });

  return response;
}
