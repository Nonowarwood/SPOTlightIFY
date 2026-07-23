// Mirrors the CSS custom properties in src/styles/global.css. Kept as plain
// hex strings (not read from CSS) so D3 code can use them directly for SVG fills.

// Dashboard-reference palette: purple leads, amber is the counterpoint,
// the rest stay harmonized around them. Mirrors global.css --color-cat-*.
// Index 8 (red) doubles as the error color (see PassphraseGate.astro).
export const CATEGORICAL_COLORS = [
  "#a78bfa", // purple (primary)
  "#fbc65e", // amber
  "#f472b6", // pink
  "#67e8f9", // cyan
  "#6ee7a0", // green
  "#82aaff", // blue
  "#e9e4ff", // lavender
  "#ff6b6b", // red
] as const;

/** Sequential ramp, low -> high intensity. Used for heatmap cells — deep
 *  violet-black to bright purple, matching the dashboard accent. */
export const SEQUENTIAL_PURPLE = [
  "#14101f",
  "#1e1533",
  "#2a1d4d",
  "#3b2a6e",
  "#553f9e",
  "#7c5fd3",
  "#a78bfa",
] as const;

/** Assigns colors in the fixed categorical order — never re-cycle per filter state. */
export function categoricalColor(index: number): string {
  return CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length]!;
}

export function sequentialColor(t: number): string {
  // t in [0, 1]
  const clamped = Math.max(0, Math.min(1, t));
  const idx = Math.round(clamped * (SEQUENTIAL_PURPLE.length - 1));
  return SEQUENTIAL_PURPLE[idx]!;
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
