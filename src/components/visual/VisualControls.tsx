"use client";

import type { AuraMode, AuraPreset, AuraVisualOptions } from '@/types/github';
import { AURA_MODES, AURA_PRESETS } from '@/lib/aura-visuals';

type VisualControlsProps = {
  value: AuraVisualOptions;
  onChange: (value: AuraVisualOptions) => void;
};

export function VisualControls({ value, onChange }: VisualControlsProps) {
  function setMode(mode: AuraMode) {
    onChange({ ...value, mode });
  }

  function setPreset(preset: AuraPreset) {
    onChange({ ...value, preset });
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-panel backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyanAura/80">entity style</p>
          <h3 className="mt-1 text-lg font-semibold text-white">Modes & presets</h3>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted">
          {AURA_MODES[value.mode].label} / {AURA_PRESETS[value.preset].label}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        {(Object.keys(AURA_MODES) as AuraMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setMode(mode)}
            className={`rounded-2xl border px-3 py-3 text-left transition ${
              value.mode === mode
                ? 'border-cyanAura/70 bg-cyanAura/10 text-white'
                : 'border-white/10 bg-white/[0.04] text-muted hover:border-white/25 hover:text-white'
            }`}
          >
            <span className="block text-sm font-semibold">{AURA_MODES[mode].label}</span>
            <span className="mt-1 block text-xs leading-5 opacity-70">{AURA_MODES[mode].description}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {(Object.keys(AURA_PRESETS) as AuraPreset[]).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setPreset(preset)}
            className={`rounded-2xl border px-3 py-3 text-left transition ${
              value.preset === preset
                ? 'border-violetAura/70 bg-violetAura/10 text-white'
                : 'border-white/10 bg-white/[0.04] text-muted hover:border-white/25 hover:text-white'
            }`}
          >
            <span className="block text-sm font-semibold">{AURA_PRESETS[preset].label}</span>
            <span className="mt-1 block text-xs leading-5 opacity-70">{AURA_PRESETS[preset].description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
