import type { Metadata } from 'next';
import { GitAuraApp } from '@/components/GitAuraApp';
import { normalizeAuraMode, normalizeAuraPreset } from '@/lib/aura-visuals';

type UserAuraPageProps = {
  params: { username: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function generateMetadata({ params }: UserAuraPageProps): Metadata {
  const username = decodeURIComponent(params.username);

  return {
    title: `@${username} Git-Aura`,
    description: `A living 3D GitHub aura generated from @${username}'s public developer stats.`,
    openGraph: {
      title: `@${username} Git-Aura`,
      description: `A living 3D GitHub aura generated from @${username}'s developer stats.`,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `@${username} Git-Aura`,
      description: `A living 3D GitHub aura generated from @${username}'s developer stats.`,
    },
  };
}

export default function UserAuraPage({ params, searchParams }: UserAuraPageProps) {
  const username = decodeURIComponent(params.username);
  const mode = normalizeAuraMode(firstParam(searchParams?.mode));
  const preset = normalizeAuraPreset(firstParam(searchParams?.preset));

  return <GitAuraApp initialUsername={username} initialVisualOptions={{ mode, preset }} />;
}
