"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AuraStage } from "@/components/aura/AuraStage";
import { AuraBattlePanel } from "@/components/battle/AuraBattlePanel";
import { ExportControls } from "@/components/export/ExportControls";
import { LeaderboardPanel } from "@/components/leaderboard/LeaderboardPanel";
import { OAuthStatus } from "@/components/oauth/OAuthStatus";
import { StatsPanel } from "@/components/StatsPanel";
import { UsernameForm } from "@/components/UsernameForm";
import { VisualControls } from "@/components/visual/VisualControls";
import { buildSharePath, DEFAULT_VISUAL_OPTIONS } from "@/lib/aura-visuals";
import type {
  AuraProfile,
  AuraVisualOptions,
  GitHubStats,
} from "@/types/github";

type GitAuraResponse = {
  stats: GitHubStats;
  aura: AuraProfile;
};

type GitAuraAppProps = {
  initialUsername?: string;
  initialVisualOptions?: AuraVisualOptions;
};

const DEFAULT_USERNAME = "torvalds";

export function GitAuraApp({
  initialUsername = DEFAULT_USERNAME,
  initialVisualOptions = DEFAULT_VISUAL_OPTIONS,
}: GitAuraAppProps) {
  const [username, setUsername] = useState(initialUsername);
  const [stats, setStats] = useState<GitHubStats | null>(null);
  const [aura, setAura] = useState<AuraProfile | null>(null);
  const [visualOptions, setVisualOptions] =
    useState<AuraVisualOptions>(initialVisualOptions);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  const sharePath = useMemo(
    () => buildSharePath(stats?.username ?? username, visualOptions),
    [stats, username, visualOptions],
  );

  const loadUser = useCallback(async (nextUsername: string) => {
    const cleanUsername = nextUsername.trim();
    if (!cleanUsername) return;

    setUsername(cleanUsername);
    setIsLoading(true);
    setError(null);
    setCopyState("idle");

    try {
      const response = await fetch(
        `/api/github/${encodeURIComponent(cleanUsername)}`,
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to generate aura");
      }

      const nextPayload = payload as GitAuraResponse;
      setStats(nextPayload.stats);
      setAura(nextPayload.aura);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Failed to generate aura",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser(initialUsername);
  }, [initialUsername, loadUser]);

  async function copyShareUrl() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${sharePath}`,
      );
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute left-[-12rem] top-[-10rem] h-96 w-96 rounded-full bg-cyanAura/20 blur-3xl" />
        <div className="absolute right-[-10rem] top-1/3 h-[30rem] w-[30rem] rounded-full bg-violetAura/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-6">
        <header className="grid gap-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-panel backdrop-blur-xl lg:grid-cols-[1fr_0.8fr] lg:p-8">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-cyanAura/90">
              GitHub Stats Visualizer
            </p>
            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              Turn GitHub profiles into living 3D auras.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">
              Commits control pulse speed, languages set the neon palette, pull
              requests spawn orbit rings, and social proof turns into glow.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/api/auth/github/start"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black shadow-aura transition hover:bg-cyanAura"
              >
                Connect GitHub
              </a>
              <a
                href="#leaderboard"
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white/75 transition hover:border-violetAura/60 hover:text-violetAura"
              >
                View leaderboard
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-muted">
              stretch goals online
            </p>
            <div className="mt-4 space-y-3 text-sm text-white/74">
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.04] px-4 py-3">
                <span>Share URL</span>
                <span className="text-cyanAura">/u/[username]</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.04] px-4 py-3">
                <span>Entity modes</span>
                <span className="text-violetAura">
                  aura / crystal / nebula / void
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.04] px-4 py-3">
                <span>Social preview</span>
                <span className="text-hotAura">dynamic OG image</span>
              </div>
            </div>
          </div>
        </header>

        <UsernameForm
          initialValue={username}
          isLoading={isLoading}
          onSubmit={loadUser}
        />
        <VisualControls value={visualOptions} onChange={setVisualOptions} />

        {error ? (
          <div className="rounded-3xl border border-hotAura/30 bg-hotAura/10 p-5 text-hotAura shadow-panel">
            <p className="font-semibold">Aura generation failed</p>
            <p className="mt-2 text-sm text-hotAura/80">{error}</p>
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <div className="space-y-6">
            {aura ? (
              <AuraStage
                aura={aura}
                visualOptions={visualOptions}
                onCanvasReady={setCanvas}
              />
            ) : (
              <div className="grid min-h-[480px] place-items-center rounded-[2rem] border border-white/10 bg-black/30 text-muted lg:min-h-[680px]">
                {isLoading
                  ? "Scanning GitHub signal..."
                  : "Enter a username to generate an aura."}
              </div>
            )}
            <ExportControls canvas={canvas} username={username} />
          </div>

          <div className="space-y-6">
            {stats && aura ? (
              <StatsPanel stats={stats} aura={aura} />
            ) : (
              <div className="rounded-3xl border border-white/10 bg-panel/70 p-5 shadow-panel backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.24em] text-cyanAura/80">
                  profile scan
                </p>
                <div className="mt-5 space-y-3">
                  {Array.from({ length: 8 }, (_, index) => (
                    <div
                      key={index}
                      className="h-14 animate-pulse rounded-2xl bg-white/[0.05]"
                    />
                  ))}
                </div>
              </div>
            )}

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-panel backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.28em] text-muted">
                shareable url
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                Ready for socials
              </h3>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3 font-mono text-sm text-cyanAura">
                {sharePath}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={sharePath}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/75 transition hover:border-cyanAura/60 hover:text-cyanAura"
                >
                  Open
                </a>
                <button
                  type="button"
                  onClick={copyShareUrl}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyanAura"
                >
                  {copyState === "copied" ? "Copied" : "Copy link"}
                </button>
              </div>
              {copyState === "error" ? (
                <p className="mt-2 text-sm text-hotAura">
                  Could not copy link in this browser.
                </p>
              ) : null}
            </section>

            <OAuthStatus />
          </div>
        </section>

        <AuraBattlePanel />
        <div id="leaderboard">
          <LeaderboardPanel stats={stats} aura={aura} />
        </div>
      </div>
    </main>
  );
}
