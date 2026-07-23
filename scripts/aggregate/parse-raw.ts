import { readFile, readdir } from "node:fs/promises";
import type { AlbumImageCache, ArtistGenreCache, ArtistImageCache, RawPlay } from "./lib/types.ts";

async function readJsonlDir(dirPath: string): Promise<RawPlay[]> {
  let entries: string[];
  try {
    entries = await readdir(dirPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  const files = entries.filter((f) => f.endsWith(".jsonl")).sort();
  const all: RawPlay[] = [];
  for (const file of files) {
    const content = await readFile(`${dirPath}/${file}`, "utf8");
    for (const line of content.split("\n")) {
      if (line.trim().length === 0) continue;
      all.push(JSON.parse(line) as RawPlay);
    }
  }
  return all;
}

export interface ParsedData {
  plays: RawPlay[];
  genreCache: ArtistGenreCache;
  artistImageCache: ArtistImageCache;
  albumImageCache: AlbumImageCache;
}

async function readJsonCache<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    return fallback;
  }
}

/**
 * Loads every raw play from the checked-out data repo, historical first so
 * it wins any dedupe tie against a same-timestamp recently-played record
 * (historical carries real ms_played/skip/shuffle data, the poller doesn't).
 */
export async function parseRawData(dataRoot: string): Promise<ParsedData> {
  const historical = await readJsonlDir(`${dataRoot}/raw/historical`);
  const recentlyPlayed = await readJsonlDir(`${dataRoot}/raw/recently-played`);

  const seen = new Set<string>();
  const plays: RawPlay[] = [];
  for (const record of [...historical, ...recentlyPlayed]) {
    const key = `${record.track_uri}__${record.played_at}`;
    if (seen.has(key)) continue;
    seen.add(key);
    plays.push(record);
  }
  plays.sort((a, b) => a.played_at.localeCompare(b.played_at));

  const genreCache = await readJsonCache<ArtistGenreCache>(`${dataRoot}/raw/cache/artist_genres.json`, {});
  const artistImageCache = await readJsonCache<ArtistImageCache>(
    `${dataRoot}/raw/cache/artist_images.json`,
    {},
  );
  const albumImageCache = await readJsonCache<AlbumImageCache>(
    `${dataRoot}/raw/cache/album_images.json`,
    {},
  );

  return { plays, genreCache, artistImageCache, albumImageCache };
}
