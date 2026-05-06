"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AuraProfile, AuraVisualOptions } from "@/types/github";
import { AURA_PRESETS } from "@/lib/aura-visuals";

function seedFromString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function random(seed: number) {
  let state = seed || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 10000) / 10000;
  };
}

export function ParticleField({
  aura,
  visualOptions,
}: {
  aura: AuraProfile;
  visualOptions: AuraVisualOptions;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const preset = AURA_PRESETS[visualOptions.preset];
  const modeMultiplier =
    visualOptions.mode === "nebula"
      ? 1.42
      : visualOptions.mode === "void"
        ? 0.72
        : visualOptions.mode === "crystal"
          ? 0.86
          : 1;
  const particleCount = Math.round(
    aura.particleCount * preset.particleMultiplier * modeMultiplier,
  );
  const particleSize =
    visualOptions.mode === "nebula"
      ? 0.029
      : visualOptions.preset === "hologram"
        ? 0.018
        : 0.022;
  const particleColor =
    visualOptions.mode === "void"
      ? aura.primaryColor
      : visualOptions.preset === "hologram"
        ? aura.primaryColor
        : aura.accentColor;

  const positions = useMemo(() => {
    const rand = random(
      seedFromString(
        aura.username +
          aura.languageLabel +
          visualOptions.mode +
          visualOptions.preset,
      ),
    );
    const nextPositions = new Float32Array(particleCount * 3);

    for (let index = 0; index < particleCount; index += 1) {
      const radius =
        2.35 + rand() * (visualOptions.mode === "nebula" ? 2.8 : 2.15);
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(rand() * 2 - 1);
      const wobble = Math.sin(index * 0.37) * 0.16;

      nextPositions[index * 3] =
        Math.sin(phi) * Math.cos(theta) * (radius + wobble);
      nextPositions[index * 3 + 1] = Math.cos(phi) * (radius * 0.78);
      nextPositions[index * 3 + 2] =
        Math.sin(phi) * Math.sin(theta) * (radius - wobble);
    }

    return nextPositions;
  }, [aura, particleCount, visualOptions]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    pointsRef.current.rotation.y +=
      delta *
      (0.026 + aura.pulseSpeed * 0.012) *
      (visualOptions.mode === "void" ? -1.1 : 1);
    pointsRef.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.12) * 0.08;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={particleColor}
        size={particleSize}
        sizeAttenuation
        transparent
        opacity={visualOptions.mode === "void" ? 0.58 : 0.72}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
