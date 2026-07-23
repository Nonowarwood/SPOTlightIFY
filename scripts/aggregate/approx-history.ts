import { readdir, readFile } from "node:fs/promises";
import type { TopSnapshotRaw } from "./lib/types.ts";
import type { ApproxHistoryData, RankedItem } from "../../src/lib/data-types.ts";

const SNAPSHOT_DIR_NAME = "raw/top-snapshots";

/**
 * Reads the most recent daily top-items snapshot (see spotlightify-data's
 * fetch-top-items.ts) and reshapes it into the site's RankedItem format.
 * This is Spotify's own approximate ranking, not our precise per-play data —
 * used as an immediate stand-in for "long_term"/"medium_term" history while
 * waiting for the full streaming-history export (up to 30 days).
 */
export async function buildApproxHistory(dataRoot: string): Promise<ApproxHistoryData | null> {
  const dir = `${dataRoot}/${SNAPSHOT_DIR_NAME}`;
  let files: string[];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
  if (files.length === 0) return null;

  const latest = files[files.length - 1]!;
  const snapshot = JSON.parse(await readFile(`${dir}/${latest}`, "utf8")) as TopSnapshotRaw;

  const toRankedArtists = (items: TopSnapshotRaw["long_term"]["artists"]): RankedItem[] =>
    items.map((a, i) => ({ name: a.name, minutes: items.length - i, imageUrl: a.imageUrl }));

  const toRankedTracks = (items: TopSnapshotRaw["long_term"]["tracks"]): RankedItem[] =>
    items.map((t, i) => ({
      name: t.name,
      sublabel: t.artistNames.join(", "),
      minutes: items.length - i,
      imageUrl: t.imageUrl,
    }));

  return {
    fetchedAt: snapshot.fetchedAt,
    mediumTerm: {
      topArtists: toRankedArtists(snapshot.medium_term.artists),
      topTracks: toRankedTracks(snapshot.medium_term.tracks),
    },
    longTerm: {
      topArtists: toRankedArtists(snapshot.long_term.artists),
      topTracks: toRankedTracks(snapshot.long_term.tracks),
    },
  };
}
