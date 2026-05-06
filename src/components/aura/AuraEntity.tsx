"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AuraMode, AuraProfile, AuraVisualOptions } from "@/types/github";
import { AURA_PRESETS } from "@/lib/aura-visuals";

const vertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

uniform float uTime;
uniform float uPulseSpeed;
uniform float uTurbulence;

float wave(vec3 p) {
  float t = uTime * uPulseSpeed;
  return sin(p.x * 4.6 + t) * 0.08 +
    sin(p.y * 7.2 - t * 0.72) * 0.055 +
    sin(p.z * 6.3 + t * 1.18) * 0.045;
}

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;

  float distortion = wave(position) * uTurbulence;
  vec3 transformed = position + normal * distortion;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

uniform float uTime;
uniform float uPulseSpeed;
uniform float uGlowIntensity;
uniform vec3 uPrimary;
uniform vec3 uSecondary;
uniform vec3 uAccent;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  float time = uTime * uPulseSpeed;
  float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.15);
  float bands = sin((vUv.y + noise(vUv * 8.0 + time * 0.08)) * 22.0 + time * 1.8) * 0.5 + 0.5;
  float veins = smoothstep(0.42, 1.0, noise(vUv * 11.0 + vec2(time * 0.06, -time * 0.05)));
  float corePulse = sin(time * 2.2) * 0.5 + 0.5;

  vec3 color = mix(uSecondary, uPrimary, bands);
  color = mix(color, uAccent, veins * 0.42 + corePulse * 0.18);

  float alpha = 0.3 + fresnel * 0.72 + bands * 0.18;
  float glow = (0.45 + corePulse * 0.55) * uGlowIntensity;

  gl_FragColor = vec4(color * glow, clamp(alpha, 0.0, 0.95));
}
`;

const MODE_CONFIG: Record<
  AuraMode,
  {
    scale: number;
    turbulence: number;
    glow: number;
    halo: number;
    wireOpacity: number;
    rotation: number;
  }
> = {
  aura: {
    scale: 1,
    turbulence: 1,
    glow: 1,
    halo: 1,
    wireOpacity: 0.18,
    rotation: 1,
  },
  crystal: {
    scale: 0.96,
    turbulence: 0.42,
    glow: 1.06,
    halo: 0.72,
    wireOpacity: 0.34,
    rotation: 0.62,
  },
  nebula: {
    scale: 1.14,
    turbulence: 1.46,
    glow: 1.24,
    halo: 1.32,
    wireOpacity: 0.11,
    rotation: 0.82,
  },
  void: {
    scale: 0.92,
    turbulence: 0.82,
    glow: 0.82,
    halo: 1.52,
    wireOpacity: 0.28,
    rotation: 1.35,
  },
};

function modePrimaryColor(aura: AuraProfile, mode: AuraMode): string {
  return mode === "void" ? "#07020f" : aura.primaryColor;
}

function modeSecondaryColor(aura: AuraProfile, mode: AuraMode): string {
  return mode === "void" ? aura.accentColor : aura.secondaryColor;
}

export function AuraEntity({
  aura,
  visualOptions,
}: {
  aura: AuraProfile;
  visualOptions: AuraVisualOptions;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const preset = AURA_PRESETS[visualOptions.preset];
  const modeConfig = MODE_CONFIG[visualOptions.mode];
  const primaryColor = modePrimaryColor(aura, visualOptions.mode);
  const secondaryColor = modeSecondaryColor(aura, visualOptions.mode);
  const effectiveGlow =
    aura.glowIntensity * modeConfig.glow * preset.glowMultiplier;
  const effectiveTurbulence = aura.turbulence * modeConfig.turbulence;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPulseSpeed: { value: aura.pulseSpeed },
      uTurbulence: { value: effectiveTurbulence },
      uGlowIntensity: { value: effectiveGlow },
      uPrimary: { value: new THREE.Color(primaryColor) },
      uSecondary: { value: new THREE.Color(secondaryColor) },
      uAccent: { value: new THREE.Color(aura.accentColor) },
    }),
    [
      aura.accentColor,
      aura.pulseSpeed,
      effectiveGlow,
      effectiveTurbulence,
      primaryColor,
      secondaryColor,
    ],
  );

  useEffect(() => {
    if (!materialRef.current) return;

    materialRef.current.uniforms.uPulseSpeed.value = aura.pulseSpeed;
    materialRef.current.uniforms.uTurbulence.value = effectiveTurbulence;
    materialRef.current.uniforms.uGlowIntensity.value = effectiveGlow;
    materialRef.current.uniforms.uPrimary.value.set(primaryColor);
    materialRef.current.uniforms.uSecondary.value.set(secondaryColor);
    materialRef.current.uniforms.uAccent.value.set(aura.accentColor);
  }, [aura, effectiveGlow, effectiveTurbulence, primaryColor, secondaryColor]);

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }

    if (groupRef.current) {
      groupRef.current.rotation.y +=
        delta * (0.16 + aura.pulseSpeed * 0.035) * modeConfig.rotation;
      groupRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.18) * 0.08;
    }
  });

  return (
    <group ref={groupRef} scale={modeConfig.scale}>
      <mesh>
        {visualOptions.mode === "crystal" ? (
          <icosahedronGeometry args={[1.28, 5]} />
        ) : (
          <sphereGeometry args={[1.24, 128, 128]} />
        )}
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh scale={aura.haloScale * modeConfig.halo}>
        <sphereGeometry args={[1.48, 64, 64]} />
        <meshBasicMaterial
          color={
            visualOptions.mode === "void" ? aura.accentColor : aura.primaryColor
          }
          transparent
          opacity={Math.min(0.38, 0.09 * effectiveGlow)}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh
        scale={visualOptions.mode === "crystal" ? 0.96 : 0.72}
        rotation={[0.5, 0.2, 0.1]}
      >
        <icosahedronGeometry
          args={[1.0, visualOptions.mode === "crystal" ? 3 : 2]}
        />
        <meshBasicMaterial
          color={aura.accentColor}
          transparent
          opacity={modeConfig.wireOpacity}
          wireframe
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
