import { readFile } from "node:fs/promises";
import type { RawPlay } from "./lib/types.ts";
import type { SoundData } from "../../src/lib/data-types.ts";

interface AudioFeaturesCache {
  [trackId: string]: { energy: number; valence: number; danceability: number; tempo: number };
}

/**
 * Reads raw/cache/audio_features.json from the checked-out data repo, if
 * present. That cache is only populated by spotlightify-data's optional
 * enrich-audio-features.ts, which itself soft-fails when this Spotify app
 * lacks extended-quota access — so an empty/missing cache here just means
 * "not available", not an error.
 */
export async function buildSound(dataRoot: string, plays: RawPlay[]): Promise<SoundData> {
  let cache: AudioFeaturesCache;
  try {
    cache = JSON.parse(await readFile(`${dataRoot}/raw/cache/audio_features.json`, "utf8"));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return { available: false };
    throw err;
  }

  if (Object.keys(cache).length === 0) return { available: false };

  let energySum = 0;
  let valenceSum = 0;
  let danceSum = 0;
  let count = 0;

  for (const p of plays) {
    const trackId = p.track_uri.split(":").pop()!;
    const features = cache[trackId];
    if (!features) continue;
    energySum += features.energy;
    valenceSum += features.valence;
    danceSum += features.danceability;
    count++;
  }

  if (count === 0) return { available: false };

  return {
    available: true,
    avgEnergy: round2(energySum / count),
    avgValence: round2(valenceSum / count),
    avgDanceability: round2(danceSum / count),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
