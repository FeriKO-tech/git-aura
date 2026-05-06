import { NextResponse } from 'next/server';
import { GITHUB_AUTH_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const response = NextResponse.redirect(`${url.origin}/?oauth=logout`);
  response.cookies.delete(GITHUB_AUTH_COOKIE);
  return response;
}
