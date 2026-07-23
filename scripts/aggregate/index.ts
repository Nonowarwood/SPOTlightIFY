/**
 * Orchestrates the aggregation pipeline: reads raw data checked out from the
 * private spotlightify-data repo, computes aggregate-only stats, and writes
 * them to public/data/*.json for the Astro build to bundle.
 *
 * THIS IS THE PRIVACY BOUNDARY. Nothing written here should ever be a raw
 * per-event array with individual timestamps — only pre-bucketed aggregates.
 * The size tripwire below is a backstop, not a substitute for reviewing any
 * new aggregator function added to this pipeline.
 *
 * Usage: tsx scripts/aggregate/index.ts --input <data-source dir> --output <public/data dir>
 */
import { mkdir, writeFile, stat } from "node:fs/promises";
import { parseRawData } from "./parse-raw.ts";
import { buildOverview } from "./overview.ts";
import { buildTrends } from "./trends.ts";
import { buildHeatmap } from "./heatmap.ts";
import { buildGenres } from "./genres.ts";
import { buildSound } from "./sound.ts";
import { buildRecords } from "./records.ts";
import type { MetaData } from "../../src/lib/data-types.ts";

const MAX_FILE_BYTES = 3 * 1024 * 1024; // 3MB — a legitimate aggregate file should never get near this

function getArg(name: string, fallback: string): string {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1]! : fallback;
}

async function writeJson(path: string, data: unknown): Promise<void> {
  await writeFile(path, JSON.stringify(data, null, 2) + "\n", "utf8");
  const { size } = await stat(path);
  if (size > MAX_FILE_BYTES) {
    throw new Error(
      `Privacy tripwire: ${path} is ${size} bytes, over the ${MAX_FILE_BYTES}-byte aggregate ` +
        `sanity limit. This usually means an aggregator accidentally emitted raw per-event data. ` +
        `Refusing to build.`,
    );
  }
}

async function main() {
  const dataRoot = getArg("input", "data-source");
  const outDir = getArg("output", "public/data");

  await mkdir(outDir, { recursive: true });

  const { plays, genreCache } = await parseRawData(dataRoot);
  console.log(`Loaded ${plays.length} deduplicated plays.`);

  const overview = buildOverview(plays);
  const trends = buildTrends(plays);
  const heatmap = buildHeatmap(plays);
  const genres = buildGenres(plays, genreCache);
  const sound = await buildSound(dataRoot, plays);
  const records = buildRecords(plays);

  await writeJson(`${outDir}/overview.json`, overview);
  await writeJson(`${outDir}/trends.json`, trends);
  await writeJson(`${outDir}/heatmap.json`, heatmap);
  await writeJson(`${outDir}/genres.json`, genres);
  if (sound.available) await writeJson(`${outDir}/sound.json`, sound);

  await writeJson(`${outDir}/records.json`, records);

  const meta: MetaData = {
    generatedAt: new Date().toISOString(),
    recordCount: plays.length,
    dateRangeStart: plays[0]?.played_at ?? null,
    dateRangeEnd: plays[plays.length - 1]?.played_at ?? null,
    soundAvailable: sound.available,
  };
  await writeJson(`${outDir}/meta.json`, meta);

  console.log(`Wrote aggregates to ${outDir}/ (sound ${sound.available ? "available" : "unavailable"}).`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
