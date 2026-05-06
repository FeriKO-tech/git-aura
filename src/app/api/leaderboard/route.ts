import { NextResponse } from 'next/server';
import { getLeaderboard, submitLeaderboardEntry } from '@/lib/leaderboard';
import type { LeaderboardEntry } from '@/types/github';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(getLeaderboard(), {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}

export async function POST(request: Request) {
  const entry = (await request.json()) as LeaderboardEntry;

  if (!entry.username || typeof entry.energyLevel !== 'number') {
    return NextResponse.json({ error: 'Invalid leaderboard entry' }, { status: 400 });
  }

  submitLeaderboardEntry(entry);
  return NextResponse.json(getLeaderboard());
}
