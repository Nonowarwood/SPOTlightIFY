import type { ArtistGenreCache, RawPlay } from "./lib/types.ts";
import { effectiveMsPlayed } from "./lib/types.ts";
import type { GenresData } from "../../src/lib/data-types.ts";

const TOP_N = 12;

/** When an artist has multiple genres, split their listening minutes evenly
 *  across those genres so per-genre totals still sum to the real total. */
function accumulate(plays: RawPlay[], genreCache: ArtistGenreCache): Map<string, number> {
  const totals = new Map<string, number>();
  for (const p of plays) {
    if (!p.artist_id) continue;
    const genres = genreCache[p.artist_id]?.genres ?? [];
    if (genres.length === 0) continue;
    const share = effectiveMsPlayed(p) / 60000 / genres.length;
    for (const genre of genres) {
      totals.set(genre, (totals.get(genre) ?? 0) + share);
    }
  }
  return totals;
}

function toRanked(totals: Map<string, number>): { name: string; minutes: number }[] {
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_N)
    .map(([name, minutes]) => ({ name, minutes: Math.round(minutes) }));
}

export function buildGenres(plays: RawPlay[], genreCache: ArtistGenreCache): GenresData {
  const topGenres = toRanked(accumulate(plays, genreCache));

  const byYearPlays = new Map<string, RawPlay[]>();
  for (const p of plays) {
    const year = p.played_at.slice(0, 4);
    if (!byYearPlays.has(year)) byYearPlays.set(year, []);
    byYearPlays.get(year)!.push(p);
  }

  const byYear: Record<string, { name: string; minutes: number }[]> = {};
  for (const [year, yearPlays] of byYearPlays) {
    byYear[year] = toRanked(accumulate(yearPlays, genreCache));
  }

  return { topGenres, byYear };
}
