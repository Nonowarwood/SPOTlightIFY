/**
 * Generates synthetic raw data shaped exactly like spotlightify-data's schema,
 * so the site's design/aggregation/charts can be built and iterated on before
 * real Spotify data (poller + historical export) exists. Never used in CI —
 * local dev only. Run: npm run fixture:generate
 */
import { mkdir, writeFile } from "node:fs/promises";
import type { ArtistGenreCache, RawPlay } from "../lib/types.ts";

const OUT_DIR = ".fixture-data";

const ARTISTS: { name: string; id: string; genres: string[] }[] = [
  { name: "Nova Wren", id: "a1", genres: ["dream pop", "shoegaze"] },
  { name: "Kilo Static", id: "a2", genres: ["synthwave", "electronic"] },
  { name: "Marlowe", id: "a3", genres: ["indie folk"] },
  { name: "Ceres Drift", id: "a4", genres: ["ambient", "electronic"] },
  { name: "Half Empty Room", id: "a5", genres: ["indie rock"] },
  { name: "Yuna Kites", id: "a6", genres: ["r&b", "neo soul"] },
  { name: "Static Orchard", id: "a7", genres: ["shoegaze", "indie rock"] },
  { name: "Petra Volt", id: "a8", genres: ["hyperpop", "electronic"] },
  { name: "Low Beam", id: "a9", genres: ["indie folk", "singer-songwriter"] },
  { name: "The Quiet Hours", id: "a10", genres: ["ambient"] },
  { name: "Reef Signal", id: "a11", genres: ["synthwave"] },
  { name: "Mono Garden", id: "a12", genres: ["dream pop"] },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function makeTracks(): { name: string; album: string; artist: (typeof ARTISTS)[number]; durationMs: number }[] {
  const tracks: { name: string; album: string; artist: (typeof ARTISTS)[number]; durationMs: number }[] = [];
  const nouns = ["Static", "Harbor", "Echo", "Glass", "Ember", "Tide", "Halo", "Drift", "Hollow", "Neon"];
  const nouns2 = ["Room", "Signal", "Light", "Field", "Hour", "Shore", "Frame", "Bloom", "Wire", "Sky"];
  ARTISTS.forEach((artist) => {
    const albumName = `${pick(nouns)} ${pick(nouns2)}`;
    for (let i = 0; i < 6; i++) {
      tracks.push({
        name: `${pick(nouns)} ${pick(nouns2)}`,
        album: albumName,
        artist,
        durationMs: 150_000 + Math.floor(Math.random() * 120_000),
      });
    }
  });
  return tracks;
}

function weightedHour(): number {
  // Bias toward evenings (18-23h) and lunch (12-13h), like real listening habits.
  const buckets = [
    ...Array(2).fill(8),
    ...Array(3).fill(12),
    ...Array(2).fill(15),
    ...Array(6).fill(19),
    ...Array(4).fill(22),
  ];
  return pick(buckets) + Math.floor(Math.random() * 2);
}

async function main() {
  const tracks = makeTracks();
  const now = new Date();
  const historical: RawPlay[] = [];
  const recentlyPlayed: RawPlay[] = [];

  const totalDays = 240; // ~8 months of history
  const pollerStartsDaysAgo = 10; // last 10 days simulate the live poller

  for (let daysAgo = totalDays; daysAgo >= 0; daysAgo--) {
    const playsToday = Math.random() < 0.15 ? 0 : 3 + Math.floor(Math.random() * 12); // some silent days
    for (let i = 0; i < playsToday; i++) {
      const track = pick(tracks);
      const date = new Date(now);
      date.setUTCDate(date.getUTCDate() - daysAgo);
      date.setUTCHours(weightedHour(), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60), 0);

      const isPollerEra = daysAgo <= pollerStartsDaysAgo;
      const skipped = !isPollerEra && Math.random() < 0.12;
      const msPlayed = skipped ? Math.floor(track.durationMs * (0.1 + Math.random() * 0.3)) : track.durationMs;

      const record: RawPlay = {
        played_at: date.toISOString(),
        track_uri: `spotify:track:${track.artist.id}-${track.name.replace(/\s/g, "").toLowerCase()}`,
        track_name: track.name,
        artist_name: track.artist.name,
        artist_id: track.artist.id,
        album_name: track.album,
        ms_played: isPollerEra ? null : msPlayed,
        track_duration_ms: track.durationMs,
        reason_start: isPollerEra ? null : "trackdone",
        reason_end: isPollerEra ? null : skipped ? "fwdbtn" : "trackdone",
        shuffle: isPollerEra ? null : Math.random() < 0.6,
        skipped: isPollerEra ? null : skipped,
        platform: isPollerEra ? null : pick(["iOS", "Android", "OSX"]),
        conn_country: isPollerEra ? null : "FR",
        source: isPollerEra ? "recently-played" : "historical",
      };

      if (isPollerEra) recentlyPlayed.push(record);
      else historical.push(record);
    }
  }

  const genreCache: ArtistGenreCache = {};
  for (const artist of ARTISTS) {
    genreCache[artist.id] = { name: artist.name, genres: artist.genres, fetchedAt: new Date().toISOString() };
  }

  const byYear = new Map<string, RawPlay[]>();
  for (const r of historical) {
    const year = r.played_at.slice(0, 4);
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(r);
  }

  await mkdir(`${OUT_DIR}/raw/historical`, { recursive: true });
  await mkdir(`${OUT_DIR}/raw/recently-played`, { recursive: true });
  await mkdir(`${OUT_DIR}/raw/cache`, { recursive: true });

  for (const [year, records] of byYear) {
    await writeFile(
      `${OUT_DIR}/raw/historical/${year}.jsonl`,
      records.map((r) => JSON.stringify(r)).join("\n") + "\n",
      "utf8",
    );
  }

  const month = now.toISOString().slice(0, 7);
  await writeFile(
    `${OUT_DIR}/raw/recently-played/${month}.jsonl`,
    recentlyPlayed.map((r) => JSON.stringify(r)).join("\n") + "\n",
    "utf8",
  );

  await writeFile(`${OUT_DIR}/raw/cache/artist_genres.json`, JSON.stringify(genreCache, null, 2), "utf8");

  console.log(
    `Fixture written to ${OUT_DIR}/: ${historical.length} historical + ${recentlyPlayed.length} recently-played plays.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
