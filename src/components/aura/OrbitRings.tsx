"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AuraProfile, AuraVisualOptions } from "@/types/github";

type Ring = {
  radius: number;
  tube: number;
  rotation: [number, number, number];
  color: string;
  speed: number;
  opacity: number;
};

export function OrbitRings({
  aura,
  visualOptions,
}: {
  aura: AuraProfile;
  visualOptions: AuraVisualOptions;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const rings = useMemo<Ring[]>(() => {
    const modeRadius =
      visualOptions.mode === "void"
        ? 0.9
        : visualOptions.mode === "nebula"
          ? 1.14
          : 1;
    const modeSpeed =
      visualOptions.mode === "void"
        ? 1.38
        : visualOptions.mode === "crystal"
          ? 0.7
          : 1;
    const modeOpacity = visualOptions.preset === "hologram" ? 0.82 : 1;

    return Array.from({ length: aura.ringCount }, (_, index) => {
      const step = index / Math.max(1, aura.ringCount - 1);
      return {
        radius: (1.72 + index * 0.14) * modeRadius,
        tube: 0.006 + step * 0.006,
        rotation: [
          Math.PI * (0.18 + step * 0.52),
          Math.PI * (0.08 + step * 0.36),
          Math.PI * step,
        ],
        color:
          index % 3 === 0
            ? aura.primaryColor
            : index % 3 === 1
              ? aura.secondaryColor
              : aura.accentColor,
        speed: (0.08 + step * 0.18) * modeSpeed,
        opacity: (0.24 + step * 0.3) * modeOpacity,
      };
    });
  }, [aura, visualOptions]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    groupRef.current.children.forEach((child, index) => {
      child.rotation.z += delta * rings[index].speed * aura.pulseSpeed;
      child.rotation.x +=
        Math.sin(state.clock.elapsedTime * 0.2 + index) * 0.0009;
    });
  });

  return (
    <group ref={groupRef}>
      {rings.map((ring, index) => (
        <mesh key={`${ring.radius}-${index}`} rotation={ring.rotation}>
          <torusGeometry args={[ring.radius, ring.tube, 10, 180]} />
          <meshBasicMaterial
            color={ring.color}
            transparent
            opacity={ring.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
