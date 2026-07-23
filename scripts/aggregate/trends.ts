import type { RawPlay } from "./lib/types.ts";
import { effectiveMsPlayed } from "./lib/types.ts";
import type { TrendsData } from "../../src/lib/data-types.ts";

export function buildTrends(plays: RawPlay[]): TrendsData {
  if (plays.length === 0) {
    return { daily: [], monthly: [], rollingAverage28d: [] };
  }

  const dailyMinutes = new Map<string, number>();
  const monthlyMinutes = new Map<string, number>();

  for (const p of plays) {
    const date = p.played_at.slice(0, 10);
    const month = p.played_at.slice(0, 7);
    const minutes = effectiveMsPlayed(p) / 60000;
    dailyMinutes.set(date, (dailyMinutes.get(date) ?? 0) + minutes);
    monthlyMinutes.set(month, (monthlyMinutes.get(month) ?? 0) + minutes);
  }

  const sortedDates = [...dailyMinutes.keys()].sort();
  const daily = sortedDates.map((date) => ({ date, minutes: Math.round(dailyMinutes.get(date)! ) }));

  // Fill the date range so the rolling average isn't skewed by missing zero-days.
  const first = new Date(sortedDates[0]!);
  const last = new Date(sortedDates[sortedDates.length - 1]!);
  const filled: { date: string; minutes: number }[] = [];
  for (let d = new Date(first); d <= last; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    filled.push({ date: key, minutes: dailyMinutes.get(key) ?? 0 });
  }

  const rollingAverage28d = filled.map((point, i) => {
    const windowStart = Math.max(0, i - 27);
    const window = filled.slice(windowStart, i + 1);
    const avg = window.reduce((sum, p) => sum + p.minutes, 0) / window.length;
    return { date: point.date, minutes: Math.round(avg) };
  });

  const monthly = [...monthlyMinutes.keys()]
    .sort()
    .map((month) => ({ month, minutes: Math.round(monthlyMinutes.get(month)!) }));

  return { daily, monthly, rollingAverage28d };
}
