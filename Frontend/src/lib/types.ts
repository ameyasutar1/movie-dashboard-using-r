export interface Movie {
  imdbId: string;
  title: string;
  releaseYear: number;
  releaseDate: string;
  genres: string[];
  writers: string[];
  actors: string[];
  directors: string[];
  sequel: number; // 0/1 in raw — but ratings 1-9 also appear
  hitFlop: number; // 1-9
}

export interface Person {
  id: string;
  name: string;
  movieCount: number;
  ratingSum: number;
  normalizedMovieRank: number;
  googleHits: number;
  normalizedGoogleRank: number;
  normalizedRating: number;
}

export interface DashboardData {
  movies: Movie[];
  actors: Person[];
  directors: Person[];
}

export type TalentType = "actors" | "directors";

export type TalentSortKey =
  | "normalizedRating"
  | "normalizedGoogleRank"
  | "movieCount";

export interface WorkbenchFilters {
  yearRange: [number, number];
  genre: string;
  sequelOnly: "all" | "sequel" | "original";
  scoreRange: [number, number];
}

export interface ApiFilters {
  yearMin: number;
  yearMax: number;
  genre: string;
  sequelOnly: "all" | "sequel" | "original";
  scoreMin: number;
  scoreMax: number;
}

export interface YearBucket {
  year: number;
  count: number;
  avgScore: number;
}

export interface SequelBucket {
  label: string;
  count: number;
  median: number;
  mean: number;
}

export interface GenreBucket {
  genre: string;
  count: number;
  avgScore: number;
}

export interface WriterBucket {
  name: string;
  count: number;
}

export interface HeatCell {
  genre: string;
  year: number;
  avg: number;
  count: number;
}

export interface HeatmapPayload {
  genres: string[];
  years: number[];
  cells: HeatCell[];
}

export interface WorkbenchMeta {
  yearRange: {
    min: number;
    max: number;
  };
  scoreRange: {
    min: number;
    max: number;
  };
  defaultFilters: ApiFilters;
  genres: string[];
  recordCounts: {
    movies: number;
    actors: number;
    directors: number;
  };
  sortOptions: TalentSortKey[];
}

export interface WorkbenchOverview {
  kpis: {
    films: number;
    avgScore: number;
    hits: number;
    hitRatePercent: number;
  };
  yearly: YearBucket[];
  sequelComparison: SequelBucket[];
  genreStats: GenreBucket[];
}

export interface WorkbenchGenreLab {
  heatmap: HeatmapPayload;
  sequelComparison: SequelBucket[];
  topWriters: WriterBucket[];
}

export interface WorkbenchMoviesPayload {
  filteredCount: number;
  total: number;
  limit: number;
  offset: number;
  query: string;
  items: Movie[];
}

export interface WorkbenchPayload {
  meta: WorkbenchMeta;
  filtersApplied: ApiFilters;
  overview: WorkbenchOverview;
  genreLab: WorkbenchGenreLab;
  movies: WorkbenchMoviesPayload;
}

export interface MoviesResponse {
  filtersApplied: ApiFilters;
  movies: WorkbenchMoviesPayload;
}

export interface TalentListResponse {
  type: TalentType;
  total: number;
  limit: number;
  offset: number;
  search: string;
  sort: TalentSortKey;
  items: Person[];
}

export interface TalentProfileResponse {
  type: TalentType;
  person: Person;
  filmographyCount: number;
  filmography: Movie[];
}

export interface CompareRadarPoint {
  axis: string;
  [name: string]: number | string;
}

export interface CompareResponse {
  type: TalentType;
  picked: string[];
  people: Person[];
  radarData: CompareRadarPoint[];
}
