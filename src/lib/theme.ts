// Mirrors the CSS custom properties in src/styles/global.css. Kept as plain
// hex strings (not read from CSS) so D3 code can use them directly for SVG fills.

// Console-dashboard inspired (deep blue immersive UI, soft glow highlights) —
// a cool blue/violet/pink family with a single warm gold accent for contrast,
// echoing the reference nav's white-glow-on-blue look without going full
// monochrome (8 categories still need to read apart in charts/lists).
// Index 8 (red) doubles as the error color (see PassphraseGate.astro).
export const CATEGORICAL_COLORS = [
  "#5ec8fa", // sky blue (primary)
  "#7c9cff", // indigo
  "#a78bfa", // violet
  "#f472b6", // pink
  "#2dd4bf", // teal
  "#fbbf24", // gold (single warm accent)
  "#e2e8f0", // silver
  "#ff6b6b", // red
] as const;

/** Sequential ramp, low -> high intensity. Used for heatmap cells — deep
 *  navy to bright sky blue, matching the console background glow. */
export const SEQUENTIAL_BLUE = [
  "#0a1120",
  "#0f1d3a",
  "#15305c",
  "#1c4a8a",
  "#2668b8",
  "#3d92e0",
  "#5ec8fa",
] as const;

/** Assigns colors in the fixed categorical order — never re-cycle per filter state. */
export function categoricalColor(index: number): string {
  return CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length]!;
}

export function sequentialColor(t: number): string {
  // t in [0, 1]
  const clamped = Math.max(0, Math.min(1, t));
  const idx = Math.round(clamped * (SEQUENTIAL_BLUE.length - 1));
  return SEQUENTIAL_BLUE[idx]!;
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (hours < 24) return `${hours} h ${minutes} min`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days} j ${remHours} h`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}
