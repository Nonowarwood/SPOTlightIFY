import type { RawPlay } from "./lib/types.ts";
import { effectiveMsPlayed } from "./lib/types.ts";
import type { RecordsData, RankedItem } from "../../src/lib/data-types.ts";

const SESSION_GAP_MS = 30 * 60 * 1000; // a new session starts after 30 min of silence

function buildStreaks(days: Set<string>): { longest: number; current: number } {
  const sorted = [...days].sort();
  if (sorted.length === 0) return { longest: 0, current: 0 };

  let longest = 1;
  let running = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]!);
    const curr = new Date(sorted[i]!);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
    if (diffDays === 1) {
      running++;
      longest = Math.max(longest, running);
    } else {
      running = 1;
    }
  }

  // Current streak: walk back from the most recent day while consecutive.
  let current = 1;
  for (let i = sorted.length - 1; i > 0; i--) {
    const prev = new Date(sorted[i - 1]!);
    const curr = new Date(sorted[i]!);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
    if (diffDays === 1) current++;
    else break;
  }
  // If the most recent listening day isn't today or yesterday, the streak is over.
  const lastDay = new Date(sorted[sorted.length - 1]!);
  const daysSinceLast = Math.round((Date.now() - lastDay.getTime()) / 86_400_000);
  if (daysSinceLast > 1) current = 0;

  return { longest, current };
}

function buildDiscovery(plays: RawPlay[]): { month: string; newArtists: number; newTracks: number }[] {
  const firstArtistMonth = new Map<string, string>();
  const firstTrackMonth = new Map<string, string>();

  for (const p of plays) {
    const month = p.played_at.slice(0, 7);
    if (!firstArtistMonth.has(p.artist_name)) firstArtistMonth.set(p.artist_name, month);
    if (!firstTrackMonth.has(p.track_uri)) firstTrackMonth.set(p.track_uri, month);
  }

  const byMonth = new Map<string, { newArtists: number; newTracks: number }>();
  for (const month of firstArtistMonth.values()) {
    const entry = byMonth.get(month) ?? { newArtists: 0, newTracks: 0 };
    entry.newArtists++;
    byMonth.set(month, entry);
  }
  for (const month of firstTrackMonth.values()) {
    const entry = byMonth.get(month) ?? { newArtists: 0, newTracks: 0 };
    entry.newTracks++;
    byMonth.set(month, entry);
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, counts]) => ({ month, ...counts }));
}

function buildMostReplayed(plays: RawPlay[]): RankedItem[] {
  const counts = new Map<string, { count: number; sample: RawPlay }>();
  for (const p of plays) {
    const key = `${p.track_name}__${p.artist_name}`;
    const entry = counts.get(key) ?? { count: 0, sample: p };
    entry.count++;
    counts.set(key, entry);
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
    .map(({ count, sample }) => ({ name: sample.track_name, sublabel: sample.artist_name, minutes: count }));
}

function buildLongestSession(plays: RawPlay[]): number {
  if (plays.length === 0) return 0;
  const sorted = [...plays].sort((a, b) => a.played_at.localeCompare(b.played_at));

  let longestMs = 0;
  let sessionMs = 0;
  let prevEndMs: number | null = null;

  for (const p of sorted) {
    const startMs = Date.parse(p.played_at);
    const duration = effectiveMsPlayed(p);
    if (prevEndMs !== null && startMs - prevEndMs > SESSION_GAP_MS) {
      longestMs = Math.max(longestMs, sessionMs);
      sessionMs = 0;
    }
    sessionMs += duration;
    prevEndMs = startMs + duration;
  }
  longestMs = Math.max(longestMs, sessionMs);

  return Math.round(longestMs / 60000);
}

export function buildRecords(plays: RawPlay[]): RecordsData {
  const days = new Set(plays.map((p) => p.played_at.slice(0, 10)));
  const { longest, current } = buildStreaks(days);

  const historicalPlays = plays.filter((p) => p.source === "historical" && p.skipped !== null);
  const skipRate =
    historicalPlays.length === 0
      ? null
      : historicalPlays.filter((p) => p.skipped).length / historicalPlays.length;

  return {
    longestStreakDays: longest,
    currentStreakDays: current,
    skipRate,
    discoveryByMonth: buildDiscovery(plays),
    mostReplayed: buildMostReplayed(plays),
    longestSessionMinutes: buildLongestSession(plays),
  };
}
