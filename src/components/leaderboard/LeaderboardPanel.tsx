"use client";

import { useEffect, useState } from "react";
import type {
  AuraProfile,
  GitHubStats,
  LeaderboardEntry,
  LeaderboardResponse,
} from "@/types/github";
import { formatCompact } from "@/lib/format";

type LeaderboardPanelProps = {
  stats: GitHubStats | null;
  aura: AuraProfile | null;
};

type BoardKey = keyof LeaderboardResponse;

const EMPTY_BOARD: LeaderboardResponse = {
  fastest: [],
  brightest: [],
  rarest: [],
};

const BOARD_LABELS: Record<BoardKey, string> = {
  fastest: "Fastest pulse",
  brightest: "Brightest glow",
  rarest: "Rarest aura",
};

function createEntry(stats: GitHubStats, aura: AuraProfile): LeaderboardEntry {
  return {
    username: stats.username,
    displayName: stats.displayName,
    avatarUrl: stats.avatarUrl,
    languageLabel: aura.languageLabel,
    primaryColor: aura.primaryColor,
    energyLevel: aura.energyLevel,
    pulseSpeed: aura.pulseSpeed,
    glowIntensity: aura.glowIntensity,
    ringCount: aura.ringCount,
    particleCount: aura.particleCount,
    updatedAt: new Date().toISOString(),
  };
}

function EntryRow({
  entry,
  index,
  metric,
}: {
  entry: LeaderboardEntry;
  index: number;
  metric: BoardKey;
}) {
  const value =
    metric === "fastest"
      ? `${entry.pulseSpeed}x`
      : metric === "brightest"
        ? `${entry.glowIntensity} glow`
        : `${entry.ringCount} rings`;

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 text-xs text-muted">
        #{index + 1}
      </span>
      <div
        className="h-10 w-10 shrink-0 rounded-xl bg-cover bg-center"
        style={{
          backgroundImage: `url(${entry.avatarUrl})`,
          boxShadow: `0 0 22px ${entry.primaryColor}55`,
        }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {entry.displayName ?? entry.username}
        </p>
        <p className="truncate text-xs text-muted">
          @{entry.username} · {entry.languageLabel}
        </p>
      </div>
      <span className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs text-white/75">
        {value}
      </span>
    </li>
  );
}

export function LeaderboardPanel({ stats, aura }: LeaderboardPanelProps) {
  const [board, setBoard] = useState<LeaderboardResponse>(EMPTY_BOARD);
  const [status, setStatus] = useState<"idle" | "syncing" | "synced" | "error">(
    "syncing",
  );

  useEffect(() => {
    let cancelled = false;

    async function syncLeaderboard() {
      setStatus("syncing");

      try {
        const response = await fetch("/api/leaderboard");
        const payload = (await response.json()) as LeaderboardResponse;
        if (!cancelled) {
          setBoard(payload);
          setStatus("synced");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    void syncLeaderboard();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!stats || !aura) return;
    const currentStats = stats;
    const currentAura = aura;
    let cancelled = false;

    async function submitCurrentAura() {
      try {
        const response = await fetch("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createEntry(currentStats, currentAura)),
        });
        const payload = (await response.json()) as LeaderboardResponse;
        if (!cancelled) {
          setBoard(payload);
          setStatus("synced");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    void submitCurrentAura();

    return () => {
      cancelled = true;
    };
  }, [stats, aura]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-panel backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyanAura/80">
            leaderboard
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            Fastest / brightest / rarest
          </h3>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted">
          {status === "syncing"
            ? "syncing"
            : status === "error"
              ? "local fallback"
              : `${formatCompact(board.rarest.length)} entries`}
        </span>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {(Object.keys(BOARD_LABELS) as BoardKey[]).map((key) => (
          <div
            key={key}
            className="rounded-2xl border border-white/10 bg-black/20 p-3"
          >
            <p className="mb-3 px-1 text-xs uppercase tracking-[0.2em] text-muted">
              {BOARD_LABELS[key]}
            </p>
            <ol className="space-y-2">
              {board[key].slice(0, 5).map((entry, index) => (
                <EntryRow
                  key={`${key}-${entry.username}`}
                  entry={entry}
                  index={index}
                  metric={key}
                />
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
