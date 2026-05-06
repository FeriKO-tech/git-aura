import type { AuraProfile, GitHubStats } from "@/types/github";
import { formatCompact, formatPercent } from "@/lib/format";

type StatsPanelProps = {
  stats: GitHubStats;
  aura: AuraProfile;
};

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function StatsPanel({ stats, aura }: StatsPanelProps) {
  const metrics = [
    {
      label: "commits",
      value: formatCompact(stats.commitCount),
      hint: `${aura.pulseSpeed}x pulse`,
    },
    {
      label: "pull requests",
      value: formatCompact(stats.pullRequestCount),
      hint: `${aura.ringCount} orbit rings`,
    },
    {
      label: "stars",
      value: formatCompact(stats.totalStars),
      hint: `${aura.glowIntensity} glow`,
    },
    {
      label: "followers",
      value: formatCompact(stats.followers),
      hint: `${aura.haloScale} halo`,
    },
    {
      label: "public repos",
      value: formatCompact(stats.publicRepos),
      hint: `${formatCompact(aura.particleCount)} sparks`,
    },
    {
      label: "forks",
      value: formatCompact(stats.totalForks),
      hint: `${aura.energyLevel}% energy`,
    },
  ];

  return (
    <section className="rounded-3xl border border-white/10 bg-panel/70 p-5 shadow-panel backdrop-blur-xl">
      <div className="flex items-start gap-4">
        <div
          className="h-16 w-16 shrink-0 rounded-2xl border border-white/10 bg-cover bg-center shadow-aura"
          style={{ backgroundImage: `url(${stats.avatarUrl})` }}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.24em] text-cyanAura/80">
            profile scan · {stats.dataScope}
          </p>
          <h2 className="mt-1 truncate text-2xl font-bold text-white">
            {stats.displayName ?? stats.username}
          </h2>
          <a
            href={stats.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex text-sm text-muted transition hover:text-cyanAura"
          >
            @{stats.username}
          </a>
          {stats.bio ? (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/68">
              {stats.bio}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {metrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              dominant language
            </p>
            <p className="mt-1 text-xl font-semibold text-white">
              {aura.languageLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[aura.primaryColor, aura.secondaryColor, aura.accentColor].map(
              (color) => (
                <span
                  key={color}
                  className="h-8 w-8 rounded-full border border-white/15"
                  style={{
                    background: color,
                    boxShadow: `0 0 24px ${color}80`,
                  }}
                />
              ),
            )}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {stats.languages.length > 0 ? (
            stats.languages.map((language) => (
              <div key={language.name}>
                <div className="mb-1 flex items-center justify-between text-xs text-muted">
                  <span>{language.name}</span>
                  <span>{formatPercent(language.percentage)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${language.percentage}%`,
                      background: language.color,
                      boxShadow: `0 0 20px ${language.color}70`,
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">No public language data found.</p>
          )}
        </div>
      </div>

      {stats.apiWarnings.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-hotAura/30 bg-hotAura/10 p-4 text-sm text-hotAura">
          <p className="font-semibold">Partial GitHub data</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-hotAura/80">
            {stats.apiWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
