// Shapes of the aggregate JSON files under public/data/*.json, generated at
// build time by scripts/aggregate/. Shared between the aggregation script and
// the client-side page scripts that fetch these files after the gate unlocks.
//
// IMPORTANT: nothing in this file's shapes should ever carry a raw per-event
// array with individual timestamps — that data must stay in the private
// spotlightify-data repo. See scripts/aggregate/index.ts's size tripwire.

export interface RankedItem {
  name: string;
  sublabel?: string;
  minutes: number;
}

export interface OverviewWindow {
  topArtists: RankedItem[];
  topTracks: RankedItem[];
  topAlbums: RankedItem[];
}

export interface OverviewData {
  totalMsAllTime: number;
  totalMsByYear: Record<string, number>;
  uniqueTracks: number;
  uniqueArtists: number;
  uniqueAlbums: number;
  firstPlayDate: string | null;
  totalListeningDays: number;
  windows: {
    last7d: OverviewWindow;
    last30d: OverviewWindow;
    last365d: OverviewWindow;
    allTime: OverviewWindow;
  };
  deltas: {
    last7dVsPrevious7dPct: number | null;
    last30dVsPrevious30dPct: number | null;
  };
}

export interface TrendsData {
  daily: { date: string; minutes: number }[];
  monthly: { month: string; minutes: number }[];
  rollingAverage28d: { date: string; minutes: number }[];
}

export interface HeatmapData {
  calendar: { date: string; minutes: number }[];
  /** [dayOfWeek 0=Mon..6=Sun][hour 0..23] = minutes */
  hourDayMatrix: number[][];
}

export interface GenresData {
  topGenres: { name: string; minutes: number }[];
  byYear: Record<string, { name: string; minutes: number }[]>;
}

export interface SoundData {
  available: boolean;
  avgEnergy?: number;
  avgValence?: number;
  avgDanceability?: number;
}

export interface RecordsData {
  longestStreakDays: number;
  currentStreakDays: number;
  /** null when no historical-source data with a real skip flag has been imported yet. */
  skipRate: number | null;
  discoveryByMonth: { month: string; newArtists: number; newTracks: number }[];
  mostReplayed: RankedItem[];
  longestSessionMinutes: number;
}

export interface MetaData {
  generatedAt: string;
  recordCount: number;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  soundAvailable: boolean;
}
