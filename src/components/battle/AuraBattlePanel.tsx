"use client";

import { FormEvent, useMemo, useState } from 'react';
import type { AuraProfile, GitHubStats } from '@/types/github';
import { formatCompact } from '@/lib/format';

type GitAuraResponse = {
  stats: GitHubStats;
  aura: AuraProfile;
};

type Fighter = GitAuraResponse & {
  score: number;
};

function battleScore(aura: AuraProfile, stats: GitHubStats): number {
  return Math.round(aura.energyLevel * 12 + aura.pulseSpeed * 86 + aura.glowIntensity * 92 + aura.ringCount * 46 + Math.log10(stats.totalStars + 1) * 120);
}

async function fetchFighter(username: string): Promise<Fighter> {
  const response = await fetch(`/api/github/${encodeURIComponent(username)}`);
  const payload = await response.json();

  if (!response.ok) throw new Error(payload?.error ?? `Could not load ${username}`);

  const data = payload as GitAuraResponse;
  return {
    ...data,
    score: battleScore(data.aura, data.stats),
  };
}

function FighterCard({ fighter, winner }: { fighter: Fighter; winner: boolean }) {
  return (
    <div className={`rounded-3xl border p-4 ${winner ? 'border-cyanAura/60 bg-cyanAura/10' : 'border-white/10 bg-white/[0.04]'}`}>
      <div className="flex items-center gap-3">
        <div
          className="h-14 w-14 rounded-2xl bg-cover bg-center"
          style={{ backgroundImage: `url(${fighter.stats.avatarUrl})`, boxShadow: `0 0 26px ${fighter.aura.primaryColor}66` }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-white">{fighter.stats.displayName ?? fighter.stats.username}</p>
          <p className="text-sm text-muted">@{fighter.stats.username}</p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/75">{fighter.aura.languageLabel}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-2xl bg-black/20 p-3">
          <p className="text-muted">Battle score</p>
          <p className="mt-1 text-2xl font-bold text-white">{formatCompact(fighter.score)}</p>
        </div>
        <div className="rounded-2xl bg-black/20 p-3">
          <p className="text-muted">Energy</p>
          <p className="mt-1 text-2xl font-bold text-white">{fighter.aura.energyLevel}%</p>
        </div>
        <div className="rounded-2xl bg-black/20 p-3">
          <p className="text-muted">Pulse</p>
          <p className="mt-1 text-xl font-semibold text-white">{fighter.aura.pulseSpeed}x</p>
        </div>
        <div className="rounded-2xl bg-black/20 p-3">
          <p className="text-muted">Stars</p>
          <p className="mt-1 text-xl font-semibold text-white">{formatCompact(fighter.stats.totalStars)}</p>
        </div>
      </div>
    </div>
  );
}

export function AuraBattlePanel() {
  const [left, setLeft] = useState('torvalds');
  const [right, setRight] = useState('yyx990803');
  const [fighters, setFighters] = useState<[Fighter, Fighter] | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const winnerIndex = useMemo(() => {
    if (!fighters) return -1;
    if (fighters[0].score === fighters[1].score) return -1;
    return fighters[0].score > fighters[1].score ? 0 : 1;
  }, [fighters]);

  async function runBattle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setError(null);

    try {
      const result = await Promise.all([fetchFighter(left.trim()), fetchFighter(right.trim())]);
      setFighters(result as [Fighter, Fighter]);
      setStatus('idle');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Battle failed');
      setStatus('error');
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-panel backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-hotAura/80">aura battle</p>
          <h3 className="mt-1 text-lg font-semibold text-white">Compare two GitHub profiles</h3>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted">energy duel</span>
      </div>

      <form onSubmit={runBattle} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input value={left} onChange={(event) => setLeft(event.target.value)} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none focus:border-cyanAura/70" />
        <input value={right} onChange={(event) => setRight(event.target.value)} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none focus:border-hotAura/70" />
        <button disabled={status === 'loading'} className="rounded-2xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-cyanAura disabled:opacity-50">
          {status === 'loading' ? 'Fighting...' : 'Battle'}
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-hotAura">{error}</p> : null}

      {fighters ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_auto_1fr] xl:items-center">
          <FighterCard fighter={fighters[0]} winner={winnerIndex === 0} />
          <div className="grid h-14 w-14 place-items-center justify-self-center rounded-full border border-white/10 bg-black/30 text-sm font-black text-white">VS</div>
          <FighterCard fighter={fighters[1]} winner={winnerIndex === 1} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">Run a battle to see who has the stronger aura signature.</p>
      )}
    </section>
  );
}
