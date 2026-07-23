// Mirrors the CSS custom properties in src/styles/global.css. Kept as plain
// hex strings (not read from CSS) so D3 code can use them directly for SVG fills.

// ANSI/phosphor-terminal inspired — deliberately saturated against the
// near-black page so data reads clearly, drawn from one coherent family
// instead of an arbitrary rainbow. Index 8 (red) doubles as the error color
// (see PassphraseGate.astro), so don't reorder without checking that usage.
export const CATEGORICAL_COLORS = [
  "#3ddc84", // green (primary)
  "#ffcc66", // amber
  "#5ec8f8", // cyan
  "#c792ea", // magenta
  "#82aaff", // blue
  "#f78c6c", // orange
  "#89ffc4", // mint
  "#ff5c5c", // red
] as const;

/** Sequential ramp, low -> high intensity. Used for heatmap cells — phosphor
 *  green from near-black to full brightness, matching the terminal palette. */
export const SEQUENTIAL_GREEN = [
  "#0a1410",
  "#0e2416",
  "#123a1e",
  "#155c28",
  "#1d8a3a",
  "#28c454",
  "#3ddc84",
] as const;

/** Assigns colors in the fixed categorical order — never re-cycle per filter state. */
export function categoricalColor(index: number): string {
  return CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length]!;
}

export function sequentialColor(t: number): string {
  // t in [0, 1]
  const clamped = Math.max(0, Math.min(1, t));
  const idx = Math.round(clamped * (SEQUENTIAL_GREEN.length - 1));
  return SEQUENTIAL_GREEN[idx]!;
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
