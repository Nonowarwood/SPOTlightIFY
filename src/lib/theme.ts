// Mirrors the CSS custom properties in src/styles/global.css. Kept as plain
// hex strings (not read from CSS) so D3 code can use them directly for SVG fills.

export const CATEGORICAL_COLORS = [
  "#3987e5", // blue
  "#d95926", // orange
  "#199e70", // aqua
  "#c98500", // yellow
  "#d55181", // magenta
  "#008300", // green
  "#9085e9", // violet
  "#e66767", // red
] as const;

/** Sequential ramp, low -> high intensity. Used for heatmap cells. */
export const SEQUENTIAL_BLUE = [
  "#101d2e",
  "#16314f",
  "#1a4571",
  "#1f5c98",
  "#2c74bd",
  "#4b93de",
  "#7fb4ec",
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
