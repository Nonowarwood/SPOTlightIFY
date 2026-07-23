// Mirrors the CSS custom properties in src/styles/global.css. Kept as plain
// hex strings (not read from CSS) so D3 code can use them directly for SVG fills.

// XMB-blue universe, lightened: sky blue leads, amber is the counterpoint.
// Mirrors global.css --color-cat-*.
// Index 8 (red) doubles as the error color (see PassphraseGate.astro).
export const CATEGORICAL_COLORS = [
  "#5ec8fa", // sky blue (primary)
  "#fbc65e", // amber
  "#f472b6", // pink
  "#a78bfa", // violet
  "#6ee7a0", // green
  "#82aaff", // indigo
  "#e2f1ff", // ice
  "#ff6b6b", // red
] as const;

/** Sequential ramp, low -> high intensity. Used for heatmap cells — blue,
 *  starting well above the card color so low values stay visible. */
export const SEQUENTIAL_BLUE = [
  "#16324f",
  "#1c4168",
  "#235284",
  "#2d68a6",
  "#3a85c9",
  "#55a9e8",
  "#7fd0ff",
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
