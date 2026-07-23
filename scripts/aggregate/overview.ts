import type { RawPlay } from "./lib/types.ts";
import { effectiveMsPlayed } from "./lib/types.ts";
import type { OverviewData, OverviewWindow, RankedItem } from "../../src/lib/data-types.ts";

const TOP_N = 15;

function topN(
  plays: RawPlay[],
  keyFn: (p: RawPlay) => string,
  toItem: (key: string, ms: number, sample: RawPlay) => RankedItem,
): RankedItem[] {
  const totals = new Map<string, { ms: number; sample: RawPlay }>();
  for (const p of plays) {
    const key = keyFn(p);
    const entry = totals.get(key) ?? { ms: 0, sample: p };
    entry.ms += effectiveMsPlayed(p);
    totals.set(key, entry);
  }
  return [...totals.entries()]
    .sort((a, b) => b[1].ms - a[1].ms)
    .slice(0, TOP_N)
    .map(([key, { ms, sample }]) => toItem(key, ms, sample));
}

function windowFor(plays: RawPlay[], sinceMs: number | null): OverviewWindow {
  const scoped = sinceMs === null ? plays : plays.filter((p) => Date.parse(p.played_at) >= sinceMs);
  return {
    topArtists: topN(
      scoped,
      (p) => p.artist_name,
      (name, ms) => ({ name, minutes: Math.round(ms / 60000) }),
    ),
    topTracks: topN(
      scoped,
      (p) => `${p.track_name}__${p.artist_name}`,
      (_key, ms, sample) => ({ name: sample.track_name, sublabel: sample.artist_name, minutes: Math.round(ms / 60000) }),
    ),
    topAlbums: topN(
      scoped,
      (p) => `${p.album_name}__${p.artist_name}`,
      (_key, ms, sample) => ({ name: sample.album_name, sublabel: sample.artist_name, minutes: Math.round(ms / 60000) }),
    ),
  };
}

function sumMs(plays: RawPlay[]): number {
  return plays.reduce((sum, p) => sum + effectiveMsPlayed(p), 0);
}

export function buildOverview(plays: RawPlay[]): OverviewData {
  const now = Date.now();
  const day = 86_400_000;

  const totalMsByYear: Record<string, number> = {};
  for (const p of plays) {
    const year = p.played_at.slice(0, 4);
    totalMsByYear[year] = (totalMsByYear[year] ?? 0) + effectiveMsPlayed(p);
  }

  const uniqueTracks = new Set(plays.map((p) => p.track_uri)).size;
  const uniqueArtists = new Set(plays.map((p) => p.artist_name)).size;
  const uniqueAlbums = new Set(plays.map((p) => `${p.album_name}__${p.artist_name}`)).size;
  const listeningDays = new Set(plays.map((p) => p.played_at.slice(0, 10))).size;

  const last7d = plays.filter((p) => Date.parse(p.played_at) >= now - 7 * day);
  const prev7d = plays.filter((p) => {
    const t = Date.parse(p.played_at);
    return t >= now - 14 * day && t < now - 7 * day;
  });
  const last30d = plays.filter((p) => Date.parse(p.played_at) >= now - 30 * day);
  const prev30d = plays.filter((p) => {
    const t = Date.parse(p.played_at);
    return t >= now - 60 * day && t < now - 30 * day;
  });

  const pctChange = (current: number, previous: number): number | null => {
    if (previous === 0) return null;
    return (current - previous) / previous;
  };

  return {
    totalMsAllTime: sumMs(plays),
    totalMsByYear,
    uniqueTracks,
    uniqueArtists,
    uniqueAlbums,
    firstPlayDate: plays[0]?.played_at ?? null,
    totalListeningDays: listeningDays,
    windows: {
      last7d: windowFor(plays, now - 7 * day),
      last30d: windowFor(plays, now - 30 * day),
      last365d: windowFor(plays, now - 365 * day),
      allTime: windowFor(plays, null),
    },
    deltas: {
      last7dVsPrevious7dPct: pctChange(sumMs(last7d), sumMs(prev7d)),
      last30dVsPrevious30dPct: pctChange(sumMs(last30d), sumMs(prev30d)),
    },
  };
}
