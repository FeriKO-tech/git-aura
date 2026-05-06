"use client";

import { FormEvent, useEffect, useState } from 'react';

type UsernameFormProps = {
  initialValue: string;
  isLoading: boolean;
  onSubmit: (username: string) => void;
};

const EXAMPLES = ['torvalds', 'gaearon', 'yyx990803', 'sindresorhus'];

export function UsernameForm({ initialValue, isLoading, onSubmit }: UsernameFormProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = value.trim();
    if (!username || isLoading) return;
    onSubmit(username);
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-3 shadow-panel backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="github-username">
          GitHub username
        </label>
        <div className="flex flex-1 items-center rounded-2xl border border-white/10 bg-black/25 px-4 py-3 focus-within:border-cyanAura/70">
          <span className="mr-2 font-mono text-sm text-cyanAura">github.com/</span>
          <input
            id="github-username"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="username"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 border-0 bg-transparent text-base text-white outline-none placeholder:text-muted"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || value.trim().length === 0}
          className="rounded-2xl bg-gradient-to-r from-cyanAura via-violetAura to-hotAura px-6 py-3 font-semibold text-white shadow-aura transition hover:scale-[1.015] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:scale-100"
        >
          {isLoading ? 'Scanning...' : 'Generate aura'}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2 px-1">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onSubmit(example)}
            disabled={isLoading}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted transition hover:border-cyanAura/70 hover:text-white disabled:opacity-50"
          >
            @{example}
          </button>
        ))}
      </div>
    </div>
  );
}
