"use client";

import { useEffect, useState } from 'react';

type OAuthStatusResponse = {
  configured: boolean;
  authenticated: boolean;
  expired?: boolean;
  viewer?: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
};

export function OAuthStatus() {
  const [status, setStatus] = useState<OAuthStatusResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const response = await fetch('/api/auth/github/status');
        const payload = (await response.json()) as OAuthStatusResponse;
        if (!cancelled) setStatus(payload);
      } catch {
        if (!cancelled) setStatus({ configured: false, authenticated: false });
      }
    }

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-white/68 shadow-panel backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-muted">github oauth</p>
          <h3 className="mt-1 text-lg font-semibold text-white">Private stats unlock</h3>
        </div>
        {status?.authenticated ? (
          <span className="rounded-full border border-cyanAura/30 bg-cyanAura/10 px-3 py-1 text-xs text-cyanAura">connected</span>
        ) : (
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted">public mode</span>
        )}
      </div>

      {status?.authenticated && status.viewer ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="h-11 w-11 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${status.viewer.avatar_url})` }} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white">@{status.viewer.login}</p>
            <p className="text-xs text-muted">Private owner repos can now affect your aura.</p>
          </div>
          <a href="/api/auth/github/logout" className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted transition hover:border-hotAura/50 hover:text-hotAura">
            Logout
          </a>
        </div>
      ) : status?.configured ? (
        <div className="mt-4">
          <p>Connect GitHub to include private owner repos in the scan when generating your own aura.</p>
          <a href="/api/auth/github/start" className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyanAura">
            Connect GitHub
          </a>
        </div>
      ) : (
        <p className="mt-4">
          OAuth routes are implemented. Add <span className="font-mono text-cyanAura">GITHUB_CLIENT_ID</span> and{' '}
          <span className="font-mono text-cyanAura">GITHUB_CLIENT_SECRET</span> to enable the connect button.
        </p>
      )}
    </section>
  );
}
