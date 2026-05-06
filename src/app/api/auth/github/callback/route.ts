import { NextResponse } from 'next/server';
import { GITHUB_AUTH_COOKIE, GITHUB_AUTH_STATE_COOKIE, githubOAuthConfigured } from '@/lib/auth';

export const runtime = 'nodejs';

type TokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const savedState = request.headers.get('cookie')?.match(new RegExp(`${GITHUB_AUTH_STATE_COOKIE}=([^;]+)`))?.[1];

  if (!githubOAuthConfigured()) {
    return NextResponse.redirect(`${url.origin}/?oauth=not-configured`);
  }

  if (!code || !state || !savedState || state !== decodeURIComponent(savedState)) {
    return NextResponse.redirect(`${url.origin}/?oauth=invalid-state`);
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenPayload = (await tokenResponse.json()) as TokenResponse;

  if (!tokenResponse.ok || !tokenPayload.access_token) {
    return NextResponse.redirect(`${url.origin}/?oauth=token-error`);
  }

  const response = NextResponse.redirect(`${url.origin}/?oauth=connected`);
  response.cookies.delete(GITHUB_AUTH_STATE_COOKIE);
  response.cookies.set(GITHUB_AUTH_COOKIE, tokenPayload.access_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 14,
    path: '/',
  });

  return response;
}
