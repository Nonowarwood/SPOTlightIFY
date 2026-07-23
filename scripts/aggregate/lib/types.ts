// Mirrors spotlightify-data's scripts/lib/types.ts#RawPlay exactly — duplicated
// here because it lives in a separate private repo that this one only ever
// reads a checked-out copy of at build time (see .github/workflows/build-deploy.yml).
// If you change the schema in spotlightify-data, update this file to match.
export interface RawPlay {
  played_at: string;
  track_uri: string;
  track_name: string;
  artist_name: string;
  artist_id: string | null;
  album_name: string;
  album_id: string | null;
  ms_played: number | null;
  track_duration_ms: number;
  reason_start: string | null;
  reason_end: string | null;
  shuffle: boolean | null;
  skipped: boolean | null;
  platform: string | null;
  conn_country: string | null;
  source: "historical" | "recently-played";
}

export interface ArtistGenreCache {
  [artistId: string]: {
    name: string;
    genres: string[];
    fetchedAt: string;
  };
}

export interface ArtistImageCache {
  [artistId: string]: {
    name: string;
    imageUrl: string | null;
    fetchedAt: string;
  };
}

export interface AlbumImageCache {
  [albumId: string]: {
    name: string;
    imageUrl: string | null;
    fetchedAt: string;
  };
}

export interface TopItemRaw {
  id: string;
  name: string;
  imageUrl: string | null;
}

export interface TopTrackItemRaw extends TopItemRaw {
  artistNames: string[];
  albumName: string;
  albumImageUrl: string | null;
}

/** Mirrors spotlightify-data's TopSnapshot — the daily short/medium/long_term
 *  top-items snapshot used as an immediate approximate-history proxy. */
export interface TopSnapshotRaw {
  fetchedAt: string;
  short_term: { artists: TopItemRaw[]; tracks: TopTrackItemRaw[] };
  medium_term: { artists: TopItemRaw[]; tracks: TopTrackItemRaw[] };
  long_term: { artists: TopItemRaw[]; tracks: TopTrackItemRaw[] };
}

/** Best-available listened duration: real ms_played for historical records,
 *  falls back to the track's full duration for live-poller records (the
 *  closest approximation available — see RawPlay's source-dependent fields). */
export function effectiveMsPlayed(record: RawPlay): number {
  return record.ms_played ?? record.track_duration_ms;
}
