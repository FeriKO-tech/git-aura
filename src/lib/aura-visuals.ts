import type { AuraMode, AuraPreset, AuraVisualOptions } from '@/types/github';

export const DEFAULT_VISUAL_OPTIONS: AuraVisualOptions = {
  mode: 'aura',
  preset: 'cyberpunk',
};

export const AURA_MODES: Record<AuraMode, { label: string; description: string }> = {
  aura: {
    label: 'Aura',
    description: 'Liquid shader sphere with additive glow.',
  },
  crystal: {
    label: 'Crystal',
    description: 'Sharper faceted core with wireframe refractions.',
  },
  nebula: {
    label: 'Nebula',
    description: 'Soft volumetric energy cloud with extra sparks.',
  },
  void: {
    label: 'Void',
    description: 'Dark core, inverted halo and heavier orbit motion.',
  },
};

export const AURA_PRESETS: Record<
  AuraPreset,
  {
    label: string;
    description: string;
    background: string;
    fog: string;
    panelTint: string;
    particleMultiplier: number;
    glowMultiplier: number;
  }
> = {
  cyberpunk: {
    label: 'Cyberpunk',
    description: 'Neon cyan/violet energy for a social-ready hero shot.',
    background: '#04040a',
    fog: '#04040a',
    panelTint: 'rgba(49, 215, 255, 0.12)',
    particleMultiplier: 1,
    glowMultiplier: 1,
  },
  'dark-fantasy': {
    label: 'Dark Fantasy',
    description: 'Warmer ritual glow with darker fog and slower menace.',
    background: '#060208',
    fog: '#10040a',
    panelTint: 'rgba(255, 77, 125, 0.12)',
    particleMultiplier: 0.82,
    glowMultiplier: 1.18,
  },
  hologram: {
    label: 'Hologram',
    description: 'Clean glassy scanline look for profile cards and demos.',
    background: '#02070c',
    fog: '#03111c',
    panelTint: 'rgba(125, 249, 255, 0.12)',
    particleMultiplier: 1.24,
    glowMultiplier: 0.92,
  },
};

export function normalizeAuraMode(value: string | null | undefined): AuraMode {
  if (value === 'crystal' || value === 'nebula' || value === 'void') return value;
  return 'aura';
}

export function normalizeAuraPreset(value: string | null | undefined): AuraPreset {
  if (value === 'dark-fantasy' || value === 'hologram') return value;
  return 'cyberpunk';
}

export function buildSharePath(username: string, options: AuraVisualOptions): string {
  const params = new URLSearchParams({
    mode: options.mode,
    preset: options.preset,
  });

  return `/u/${encodeURIComponent(username)}?${params.toString()}`;
}
