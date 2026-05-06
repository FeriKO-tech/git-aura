import { NextResponse } from "next/server";
import { getGithubAccessToken } from "@/lib/auth";
import { mapStatsToAura } from "@/lib/aura-mapping";
import { getGithubStats, GitHubApiError } from "@/lib/github";

export const runtime = "nodejs";
export const revalidate = 600;

export async function GET(
  _request: Request,
  context: { params: { username: string } },
) {
  try {
    const stats = await getGithubStats(
      context.params.username,
      getGithubAccessToken(),
    );
    const aura = mapStatsToAura(stats);

    return NextResponse.json(
      { stats, aura },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
        },
      },
    );
  } catch (error) {
    const status = error instanceof GitHubApiError ? error.status : 500;
    const message =
      status === 404
        ? "GitHub user not found"
        : error instanceof Error
          ? error.message
          : "Unexpected GitHub API error";

    return NextResponse.json(
      {
        error: message,
        status,
      },
      { status },
    );
  }
}
