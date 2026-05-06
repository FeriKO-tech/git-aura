/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { mapStatsToAura } from "@/lib/aura-mapping";
import { getGithubStats } from "@/lib/github";

export const runtime = "edge";
export const alt = "Git-Aura profile preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { username: string };
}) {
  const username = decodeURIComponent(params.username);
  const fallback = {
    displayName: username,
    avatarUrl: `https://github.com/${encodeURIComponent(username)}.png`,
    languageLabel: "Unknown",
    primaryColor: "#31d7ff",
    secondaryColor: "#9d7bff",
    energyLevel: 50,
    pulseSpeed: 1.5,
    ringCount: 3,
  };

  const data = await getGithubStats(username)
    .then((stats) => {
      const aura = mapStatsToAura(stats);
      return {
        displayName: stats.displayName ?? stats.username,
        avatarUrl: stats.avatarUrl,
        languageLabel: aura.languageLabel,
        primaryColor: aura.primaryColor,
        secondaryColor: aura.secondaryColor,
        energyLevel: aura.energyLevel,
        pulseSpeed: aura.pulseSpeed,
        ringCount: aura.ringCount,
      };
    })
    .catch(() => fallback);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: `radial-gradient(circle at 24% 30%, ${data.primaryColor}66, transparent 34%), radial-gradient(circle at 76% 68%, ${data.secondaryColor}55, transparent 36%), #04040a`,
        color: "white",
        padding: 64,
        fontFamily: "system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: 80,
          top: 90,
          width: 380,
          height: 380,
          borderRadius: 999,
          background: `radial-gradient(circle, ${data.primaryColor}cc, ${data.secondaryColor}66 42%, transparent 68%)`,
          boxShadow: `0 0 90px ${data.primaryColor}`,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "68%",
          zIndex: 2,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <img
            src={data.avatarUrl}
            alt=""
            width={104}
            height={104}
            style={{ borderRadius: 28 }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 26,
                color: "#8be9fd",
                letterSpacing: 8,
                textTransform: "uppercase",
              }}
            >
              Git-Aura
            </div>
            <div style={{ fontSize: 56, fontWeight: 900 }}>@{username}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 78, lineHeight: 0.95, fontWeight: 950 }}>
            {data.displayName}
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 28 }}>
            <span
              style={{
                padding: "12px 20px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.12)",
              }}
            >
              {data.languageLabel}
            </span>
            <span
              style={{
                padding: "12px 20px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.12)",
              }}
            >
              {data.energyLevel}% energy
            </span>
            <span
              style={{
                padding: "12px 20px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.12)",
              }}
            >
              {data.ringCount} rings
            </span>
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
