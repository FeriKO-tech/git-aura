"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { AuraProfile, AuraVisualOptions } from "@/types/github";
import { AURA_MODES, AURA_PRESETS } from "@/lib/aura-visuals";
import { AuraEntity } from "./AuraEntity";
import { OrbitRings } from "./OrbitRings";
import { ParticleField } from "./ParticleField";

type AuraStageProps = {
  aura: AuraProfile;
  visualOptions: AuraVisualOptions;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
};

export function AuraStage({
  aura,
  visualOptions,
  onCanvasReady,
}: AuraStageProps) {
  const preset = AURA_PRESETS[visualOptions.preset];
  const mode = AURA_MODES[visualOptions.mode];

  return (
    <div
      className="scanline relative min-h-[480px] overflow-hidden rounded-[2rem] border border-white/10 bg-black/30 shadow-aura backdrop-blur-xl lg:min-h-[680px]"
      style={{
        background: `linear-gradient(135deg, ${preset.panelTint}, rgba(0,0,0,0.32))`,
      }}
    >
      <div className="aura-grid pointer-events-none absolute inset-0 z-10 opacity-60" />
      <div className="pointer-events-none absolute inset-x-6 top-6 z-10 flex items-center justify-between text-xs uppercase tracking-[0.26em] text-white/45">
        <span>{mode.label} core</span>
        <span>{aura.energyLevel}% energy</span>
      </div>
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background: aura.primaryColor,
          opacity: 0.14 + aura.glowIntensity * 0.055,
        }}
      />

      <Canvas
        className="!absolute inset-0 h-full w-full"
        camera={{ position: [0, 0, 6.2], fov: 44 }}
        dpr={[1, 1.85]}
        gl={{
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(preset.background), 0);
          onCanvasReady(gl.domElement);
        }}
      >
        <color attach="background" args={[preset.background]} />
        <fog
          attach="fog"
          args={[preset.fog, 7, visualOptions.mode === "void" ? 9.5 : 11]}
        />
        <Stars
          radius={visualOptions.mode === "nebula" ? 46 : 38}
          depth={18}
          count={visualOptions.mode === "nebula" ? 2600 : 1800}
          factor={visualOptions.preset === "hologram" ? 2.6 : 3.6}
          saturation={0}
          fade
          speed={visualOptions.mode === "void" ? 0.18 : 0.45}
        />
        <ambientLight intensity={visualOptions.mode === "void" ? 0.26 : 0.45} />
        <pointLight
          position={[2.4, 2.8, 3.2]}
          intensity={2.5 * preset.glowMultiplier}
          color={aura.primaryColor}
        />
        <pointLight
          position={[-3.2, -1.8, 2.4]}
          intensity={1.8 * preset.glowMultiplier}
          color={aura.accentColor}
        />
        <ParticleField aura={aura} visualOptions={visualOptions} />
        <OrbitRings aura={aura} visualOptions={visualOptions} />
        <AuraEntity aura={aura} visualOptions={visualOptions} />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={visualOptions.mode === "crystal" ? 0.28 : 0.42}
          rotateSpeed={0.48}
          minPolarAngle={Math.PI * 0.25}
          maxPolarAngle={Math.PI * 0.75}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-6 bottom-6 z-10 grid grid-cols-3 gap-3 text-center text-xs uppercase tracking-[0.18em] text-white/55">
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
          {aura.languageLabel}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
          {visualOptions.mode}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
          {visualOptions.preset}
        </span>
      </div>
    </div>
  );
}
