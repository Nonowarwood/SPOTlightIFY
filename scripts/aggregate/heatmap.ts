import type { RawPlay } from "./lib/types.ts";
import { effectiveMsPlayed } from "./lib/types.ts";
import type { HeatmapData } from "../../src/lib/data-types.ts";

export function buildHeatmap(plays: RawPlay[]): HeatmapData {
  const calendarMinutes = new Map<string, number>();
  // matrix[dayOfWeek 0=Mon..6=Sun][hour]
  const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

  for (const p of plays) {
    const date = new Date(p.played_at);
    const dateKey = p.played_at.slice(0, 10);
    const minutes = effectiveMsPlayed(p) / 60000;
    calendarMinutes.set(dateKey, (calendarMinutes.get(dateKey) ?? 0) + minutes);

    // getUTCDay: 0=Sun..6=Sat -> remap to 0=Mon..6=Sun
    const jsDay = date.getUTCDay();
    const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
    const hour = date.getUTCHours();
    matrix[dayIndex]![hour] = (matrix[dayIndex]![hour] ?? 0) + minutes;
  }

  return {
    calendar: [...calendarMinutes.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, minutes]) => ({ date, minutes: Math.round(minutes) })),
    hourDayMatrix: matrix.map((row) => row.map((m) => Math.round(m))),
  };
}
